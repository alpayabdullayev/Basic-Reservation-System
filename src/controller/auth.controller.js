const userModel = require("../model/user.model");
const sendMail = require("../utils/sendMail");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generate-token");
const { cookieOptions } = require("../utils/cookieOptions");
const logger = require("../utils/logger");


/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Operations related to user registration and authentication
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Registers a new user, sends a verification email, and returns user details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "example_user"
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: User created successfully. A verification email has been sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User created successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     isVerified:
 *                       type: boolean
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User already exists"
 *       500:
 *         description: Internal server error
 */

const register = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;

    const userExist = await userModel.findOne({ email });

    if (userExist) {
      logger.warn(
        `Register attempt failed. User with email ${email} already exists.`
      );
      return res.status(409).json({ message: "User already exists" });
    }

    const newUser = new userModel({ username, password, email });
    newUser.emailVerification();

    await newUser.save();

    const emailText = `Please click the link below to verify your email: 
    ${process.env.CLIENT_URL}/verify-email?token=${newUser.emailVerificationToken}`;
    await sendMail(newUser.email, "Please verify your email", emailText);

    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
    logger.info(`User ${username} created successfully`);
  } catch (err) {
    logger.error(`Error in register ${err.message}`);
    next(err);
  }
};

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Operations related to user registration and authentication
 */

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Verify user email
 *     description: Verifies the user's email using a token sent via email.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         description: Email verification token
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email verified successfully"
 *                 accessToken:
 *                   type: string
 *                   example: "your_access_token_here"
 *                 refreshToken:
 *                   type: string
 *                   example: "your_refresh_token_here"
 *       400:
 *         description: Invalid or already verified token
 *       500:
 *         description: Internal server error
 */

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const user = await userModel.findOne({ emailVerificationToken: token });

    if (!user) {
      logger.warn(`Invalid token during email verification attempt.`);
      return res.status(400).json({ message: "Invalid token." });
    }

    if (user.isVerified) {
      logger.info(`User with email ${user.email} already verified.`);
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
    logger.info(`User ${user.email} verified successfully.`);
  } catch (err) {
    logger.error(`Error in verifyEmail: ${err.message}`);
    next(err);
  }
};

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Operations related to user management
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login a user
 *     description: Authenticates a user and returns access and refresh tokens. Tokens are also set in HTTP-only cookies.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful. Returns user details, access token, and refresh token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     isVerified:
 *                       type: boolean
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Incorrect email or password
 *       403:
 *         description: Account not verified or inactive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Account not verified. Please verify your account before logging in."
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      logger.warn(`Login failed. User with email ${email} not found.`);
      return res.status(404).json({ message: "User not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Login failed. Incorrect password for user ${email}.`);
      return res.status(400).json({ message: "Incorrect email or password." });
    }

    if (!user.isVerified) {
      logger.warn(`Login attempt failed for ${email}. Account not verified.`);
      return res.status(403).json({
        message:
          "Account not verified. Please verify your account before logging in.",
      });
    }

    if (!user.isActive) {
      logger.warn(`Login attempt failed for ${email}. Account is not active.`);
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
    logger.info(`User ${email} logged in successfully.`);
  } catch (err) {
    logger.error(`Error in login: ${err.message}`);
    next(err);
  }
};

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Operations related to user registration and authentication
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request password reset
 *     description: Sends a password reset email to the user with a reset token link.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Password reset email sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset email sent."
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 */

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      logger.warn(`Forgot password attempt failed. User with email ${email} not found.`);
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = jwt.sign({ userId: user._id }, process.env.RESET_PASSWORD_SECRET, {
      expiresIn: "1h",
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const emailText = `To reset your password, please click the link below: \n\n ${resetUrl}`;

    await sendMail(user.email, "Password Reset", null, {}, emailText);
    logger.info(`Password reset email sent to ${user.email}`);
    res.status(200).json({ message: "Password reset email sent." });
  } catch (err) {
    logger.error(`Error in forgotPassword: ${err.message}`);
    next(err);
  }
};


/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Operations related to user registration and authentication
 */

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset user's password
 *     description: Allows the user to reset their password using a token sent to their email.
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: "newPassword123"
 *                 description: The new password to be set
 *     responses:
 *       200:
 *         description: Password has been reset successfully
 *       400:
 *         description: Invalid or expired token, or user not found
 *       500:
 *         description: Internal server error
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.query;
    const { newPassword } = req.body;

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
    } catch (error) {
      logger.warn(`Invalid or expired reset token`);
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    const user = await userModel.findOne({ _id: decodedToken.userId });
    if (!user) {
      logger.warn(`Reset password failed. User not found.`);
      return res.status(400).json({ message: "User not found." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    logger.info(`Password reset successfully for user ${user.email}`);
    res.status(200).json({ message: "Password has been reset." });
  } catch (err) {
    logger.error(`Error in resetPassword: ${err.message}`);
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    logger.info(`User logged out successfully`);
    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    logger.error(`Error in logout: ${err.message}`);
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      logger.warn(`Refresh token missing`);
      return res.status(401).json({ message: "Refresh Token is Missing" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_TOKEN);
    } catch (error) {
      logger.warn(`Invalid or expired refresh token: ${error.message}`);
      return res.status(401).json({ message: "Invalid or Expired Refresh Token" });
    }

    const user = await userModel.findById(decoded.userId);
    if (!user) {
      logger.warn(`User not found for refresh token`);
      return res.status(404).json({ message: "User Not Found" });
    }

    const accessToken = generateAccessToken(user);
    res.cookie("accessToken", accessToken, cookieOptions);

    logger.info(`Access token refreshed successfully for user ${user.email}`);
    res.status(200).json({ message: "Access Token refreshed successfully" });
  } catch (err) {
    logger.error(`Error in refreshToken: ${err.message}`);
    next(err);
  }
};

module.exports = { register, verifyEmail, login, logout, refreshToken ,forgotPassword,resetPassword};
