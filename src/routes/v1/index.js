const express = require("express");
const AuthRouter = require("./auth.routes");
const VenueRouter = require("./venue.routes");
const BookingRouter = require("./booking.routes");


const v1Router = express.Router();

v1Router.use("/auth", AuthRouter);
v1Router.use("/venues", VenueRouter);
v1Router.use("/reservations", BookingRouter);

module.exports = v1Router;