const express = require("express");
const authenticate = require("../../middleware/authenticate");
const { getCurrentUser } = require("../../controller/user.controller");



const UserRouter = express.Router();

UserRouter.get("/current-user",authenticate, getCurrentUser)


module.exports = UserRouter;
