const bookingModel = require("../model/booking.model");
const userModel = require("../model/user.model");
const sendMail = require("../utils/sendMail");

const createBooking = async (req, res, next) => {
  const currentUser = req.user;
  const { date, time, venueId } = req.body;

  try {
    const bookingDateTime = new Date(`${date.split("T")[0]}T${time}:00.000Z`);
    const now = new Date();

    console.log("Booking DateTime:", bookingDateTime);
    console.log("Current DateTime:", now);

    if (bookingDateTime < now) {
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

      await sendMail(user.email, "Booking Confirmation", emailText);
    } else {
      console.log("No email found for user");
    }
    res
      .status(201)
      .json({ message: "Booking created successfully", booking: newBooking });
  } catch (error) {
    next(error);
  }
};

const getBookingsByUserId = async (req, res, next) => {
  const userId = req.user.userId; 

  try {
    const bookings = await bookingModel.find({ user: userId }).populate({
      path: "user",
      select: "username email _id",
    }).populate({
      path: "venueId",
      select: "name location",
    })

    if (bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found for this user." });
    }

    res.status(200).json(bookings);
  } catch (error) {
    next(error);  
  }
};

const getBookingsAdmin = async (req, res, next) => {
  const { page = 1, limit = 10, searchText = "" } = req.query;

  try {
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
  } catch (error) {
    next(error);
  }
};

const deleteBooking = async (req, res, next) => {
  const user = req.user;
  const bookingId = req.params.id;

  try {
    const booking = await bookingModel.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.user.toString() !== user.userId.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: "You do not have permission to delete this booking." });
    }

    await bookingModel.findByIdAndDelete(bookingId);

    await userModel.findByIdAndUpdate(user.userId, {
      $pull: { bookings: bookingId },
    });

    res.status(200).json({ message: "Booking deleted successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking ,getBookingsByUserId,deleteBooking,getBookingsAdmin};
