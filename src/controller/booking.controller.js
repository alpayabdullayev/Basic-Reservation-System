const bookingModel = require("../model/booking.model");
const userModel = require("../model/user.model");
const logger = require("../utils/logger");
const sendMail = require("../utils/sendMail");

const createBooking = async (req, res, next) => {
  const currentUser = req.user;
  const { date, time, venueId } = req.body;

  try {
    const bookingDateTime = new Date(`${date.split("T")[0]}T${time}:00.000Z`);
    const now = new Date();

    console.log("Booking DateTime:", bookingDateTime);
    console.log("Current DateTime:", now);
    logger.info(`Creating booking for user ${currentUser.userId} at venue ${venueId}`);

    if (bookingDateTime < now) {
      logger.warn(`Booking attempt in the past by user ${currentUser.userId}`);
      return res.status(400).json({
        message: "Booking cannot be in the past. Please select a future date.",
      });
    }

    const conflictingBooking = await bookingModel.findOne({
      venueId: venueId,
      date: date,
      time: time,
    });

    if (conflictingBooking) {
      logger.warn(`Booking conflict at venue ${venueId} for user ${currentUser.userId}`);
      return res.status(400).json({
        message:
          "There is already a booking for this venue at the selected time.",
      });
    }

    const newBooking = new bookingModel({
      ...req.body,
      user: currentUser.userId,
    });

    await newBooking.save();

    await userModel.findByIdAndUpdate(currentUser.userId, {
      $push: { bookings: newBooking._id },
    });

    const user = await userModel.findById(currentUser.userId);

    console.log("userdi", user);

    if (user && user.email) {
      const emailText = `Dear ${user.username}, your booking has been created successfully for ${date} at ${time}.`;

      console.log("Sending email to:", user.email);

      logger.info(`Sending booking confirmation email to ${user.email}`);
      await sendMail(user.email, "Booking Confirmation", emailText);
    } else {
      console.log("No email found for user");
    }
    res
      .status(201)
      .json({ message: "Booking created successfully", booking: newBooking });
      logger.info(`Booking created successfully for user ${currentUser.userId}`);
  } catch (error) {
    logger.error(`Error in createBooking: ${error.message}`);
    next(error);
  }
};

const getBookingsByUserId = async (req, res, next) => {
  const userId = req.user.userId; 

  try {
    logger.info(`Fetching bookings for user ${userId}`);
    const bookings = await bookingModel.find({ user: userId }).populate({
      path: "user",
      select: "username email _id",
    }).populate({
      path: "venueId",
      select: "name location",
    })

    if (bookings.length === 0) {
      logger.info(`No bookings found for user ${userId}`);
      return res.status(404).json({ message: "No bookings found for this user." });
    }

    logger.info(`Bookings fetched successfully for user ${userId}`);
    res.status(200).json(bookings);
  } catch (error) {
    logger.error(`Error in getBookingsByUserId: ${error.message}`);
    next(error);  
  }
};

const getBookingsAdmin = async (req, res, next) => {
  const { page = 1, limit = 10, searchText = "" } = req.query;

  try {

    logger.info(`Fetching bookings for admin. Page: ${page}, Limit: ${limit}, Search: ${searchText}`);

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;

    const query = {};
    if (searchText) {
      query.$or = [
        { 'user.username': new RegExp(searchText, 'i') },
        { 'user.email': new RegExp(searchText, 'i') },
        { 'venueId.name': new RegExp(searchText, 'i') }
      ];
    }

    const totalCount = await bookingModel.countDocuments(query);

    const bookings = await bookingModel.find(query)
      .populate({
        path: "user",
        select: "username email _id",
      })
      .populate({
        path: "venueId",
        select: "name location",
      })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    if (bookings.length === 0) {
      logger.info(`No bookings found. Page: ${pageNumber}, Search: ${searchText}`)
      return res.status(404).json({
        message: "No bookings found.",
        docs: bookings,
        totalDocs: totalCount,
        limit: pageSize,
        page: pageNumber,
        totalPages: Math.ceil(totalCount / pageSize),
      });
    }

    res.status(200).json({
      docs: bookings,
      totalDocs: totalCount,
      limit: pageSize,
      page: pageNumber,
      totalPages: Math.ceil(totalCount / pageSize),
    });
    logger.info(`Bookings fetched successfully for admin. Page: ${pageNumber}`);
  } catch (error) {
    logger.error(`Error in getBookingsAdmin: ${error.message}`);
    next(error);
  }
};

const deleteBooking = async (req, res, next) => {
  const user = req.user;
  const bookingId = req.params.id;

  try {
    logger.info(`Deleting booking ${bookingId} by user ${user.userId}`);
    const booking = await bookingModel.findById(bookingId);
    
    if (!booking) {
      logger.warn(`Booking ${bookingId} not found for deletion`);
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.user.toString() !== user.userId.toString() && user.role !== 'admin') {
      logger.warn(`User ${user.userId} does not have permission to delete booking ${bookingId}`);
      return res.status(403).json({ message: "You do not have permission to delete this booking." });
    }

    await bookingModel.findByIdAndDelete(bookingId);

    await userModel.findByIdAndUpdate(user.userId, {
      $pull: { bookings: bookingId },
    });

    logger.info(`Booking ${bookingId} deleted successfully by user ${user.userId}`);
    res.status(200).json({ message: "Booking deleted successfully." });
  } catch (error) {
    logger.error(`Error in deleteBooking: ${error.message}`);
    next(error);
  }
};

module.exports = { createBooking ,getBookingsByUserId,deleteBooking,getBookingsAdmin};
