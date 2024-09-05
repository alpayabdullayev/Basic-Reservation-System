const mongoose = require("mongoose");
const venueSchema = require("../schemas/venue.schema");


const venueModel = mongoose.model("Venues", venueSchema);

module.exports = venueModel;
