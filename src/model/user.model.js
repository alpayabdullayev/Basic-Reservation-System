const mongoose = require("mongoose");
const userSchema = require("../schemas/user.schema");


const userModel = mongoose.model("Users", userSchema);

module.exports = userModel;