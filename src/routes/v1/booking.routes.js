const express = require("express");

const authenticate = require("../../middleware/authenticate");
const { createBooking, getBookingsByUserId, deleteBooking } = require("../../controller/booking.controller");
const validateRequest = require("../../middleware/validateRequest");
const { bookingSchema } = require("../../validations/booking-validations");
const checkRole = require("../../middleware/checkRole");

const BookingRouter = express.Router();

BookingRouter.post(
  "/",
  validateRequest(bookingSchema),
  authenticate,
  createBooking
);

BookingRouter.get("/",authenticate, getBookingsByUserId)
BookingRouter.delete("/:id",authenticate, deleteBooking)


module.exports = BookingRouter;
