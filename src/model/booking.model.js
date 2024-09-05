const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venues",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    date: { type: Date, required: true },
    numberOfPeople: { type: Number, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const bookingModel = mongoose.model("Bookings", bookingSchema);

module.exports = bookingModel;
