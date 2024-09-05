const express = require("express");

const validateRequest = require("../../middleware/validateRequest");
const { loginSchema, registerSchema, resetPasswordSchema } = require("../../validations/auth-validations");
const { register, verifyEmail, login, forgotPassword, resetPassword, logout } = require("../../controller/auth.controller");



const AuthRouter = express.Router();

AuthRouter.post("/register", validateRequest(registerSchema),register);
AuthRouter.get("/verify-email", verifyEmail);
AuthRouter.post("/login",validateRequest(loginSchema),login);
AuthRouter.post("/forgot-password",forgotPassword)
AuthRouter.post("/reset-password",validateRequest(resetPasswordSchema), resetPassword);
AuthRouter.post("/logout",logout);



module.exports = AuthRouter;