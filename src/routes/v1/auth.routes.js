const express = require("express");

const validateRequest = require("../../middleware/validateRequest");
const { loginSchema, registerSchema } = require("../../validations/auth-validations");
const { register, verifyEmail, login } = require("../../controller/auth.controller");



const AuthRouter = express.Router();

AuthRouter.post("/register", validateRequest(registerSchema),register);
AuthRouter.get("/verify-email", verifyEmail);
AuthRouter.post("/login",validateRequest(loginSchema),login);


module.exports = AuthRouter;