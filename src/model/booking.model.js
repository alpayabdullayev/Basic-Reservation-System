const mongoose = require("mongoose");
const bookingSchema = require("../schemas/booking.schema");

const bookingModel = mongoose.model("Bookings", bookingSchema);

module.exports = bookingModel;
