
const userModel = require("../model/user.model");
const sendMail = require("../utils/sendMail");
const bcrypt = require("bcrypt");
const { generateAccessToken, generateRefreshToken } = require("../utils/generate-token");
const { cookieOptions } = require("../utils/cookieOptions");

const register = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;

    const userExist = await userModel.findOne({ email });

    if (userExist) {
      return res.status(409).json({ message: "User already exists" });
    }

    const newUser = new userModel({ username, password, email });
    newUser.emailVerification();

    await newUser.save();

    const emailText = `Please click the link below to verify your email: 
    ${process.env.CLIENT_URL}/verify-email?token=${newUser.emailVerificationToken}`;
    await sendMail(newUser.email, "Please verify your email", emailText);

    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const user = await userModel.findOne({ emailVerificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid token." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified." });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Email verified successfully." });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select('+password')

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Incorrect email or password." });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Account not verified. Please verify your account before logging in.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account is not active." });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    const { password: _, ...otherDetails } = user._doc;

    res.status(200).json({
      message: "Login successful",
      user: otherDetails,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, verifyEmail, login };
