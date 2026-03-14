import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import { generateOtp } from "../utils/generateOtp.js";
import { generateTokens } from "../utils/generateTokens.js";
import { sendVerificationEmail } from "../utils/sendOtpEmail.js";

dotenv.config();


export const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    let existingUser = await User.findOne({ email });

    if (existingUser) {
      // User exists but not verified → resend OTP if cooldown passed
      if (!existingUser.isVerified) {
        if (
          existingUser.lastOtpSentAt &&
          Date.now() - existingUser.lastOtpSentAt.getTime() < 60 * 1000
        ) {
          return res.status(429).json({
            success: false,
            message: "Please wait 1 minute before requesting another OTP.",
          });
        }

        try {
          const { otp, hashedOtp, otpExpiry, lastOtpSentAt } =
            await generateOtp(email);

          existingUser.otpExpiry = otpExpiry;
          existingUser.hashedOtp = hashedOtp;
          existingUser.lastOtpSentAt = lastOtpSentAt;
          await existingUser.save();

          await sendVerificationEmail(email, otp);
        } catch (emailError) {
          console.error("Email sending failed:", emailError);
          return res.status(500).json({
            success: false,
            message: "Failed to send verification email. Please try again.",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Account already exists. Verification OTP resent to email.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "User already registered, please login",
      });
    }

    // New user – hash password and create account
    try {
      const { otp, hashedOtp, otpExpiry, lastOtpSentAt } =
        await generateOtp(email);
      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        email,
        name,
        password: hashedPassword,
        hashedOtp,
        isVerified: false,
        otpExpiry,
        lastOtpSentAt,
      });

      await sendVerificationEmail(email, otp);

      return res.status(201).json({
        success: true,
        message: "Account created. Please verify your email with the OTP sent.",
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return res.status(500).json({
        success: false,
        message: "Signup failed. Could not send verification email.",
      });
    }
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Signup failed. Please try again.",
    });
  }
};


export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Email already verified. Please login." });
    }

    if (!user.hashedOtp || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new one.",
      });
    }

    // OTP expired → auto-send a new one
    if (user.otpExpiry.getTime() < Date.now()) {
      try {
        const { otp: newOtp, hashedOtp, otpExpiry, lastOtpSentAt } =
          await generateOtp(email);
        user.hashedOtp = hashedOtp;
        user.otpExpiry = otpExpiry;
        user.lastOtpSentAt = lastOtpSentAt;
        await user.save();
        await sendVerificationEmail(email, newOtp);

        return res.status(400).json({
          success: false,
          message: "OTP expired. A new OTP has been sent to your email.",
        });
      } catch (emailError) {
        console.error("Failed to resend OTP:", emailError);
        return res.status(500).json({
          success: false,
          message: "Failed to resend OTP. Please try again.",
        });
      }
    }

    // Verify OTP using HMAC
    const inputHash = crypto
      .createHmac("sha256", process.env.SECRET)
      .update(otp)
      .digest("hex");

    if (inputHash !== user.hashedOtp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Mark verified and clear OTP fields
    user.isVerified = true;
    user.hashedOtp = null;
    user.otpExpiry = null;
    user.lastOtpSentAt = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now login.",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).json({
      success: false,
      message: "Verification failed. Please try again.",
    });
  }
};


export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Email already verified. Please login." });
    }

    // 1-minute cooldown to prevent spam
    if (
      user.lastOtpSentAt &&
      Date.now() - user.lastOtpSentAt.getTime() < 60 * 1000
    ) {
      const waitSeconds = Math.ceil(
        (60 * 1000 - (Date.now() - user.lastOtpSentAt.getTime())) / 1000
      );
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting another OTP.`,
      });
    }

    const { otp, hashedOtp, otpExpiry, lastOtpSentAt } =
      await generateOtp(email);

    user.hashedOtp = hashedOtp;
    user.otpExpiry = otpExpiry;
    user.lastOtpSentAt = lastOtpSentAt;
    await user.save();

    await sendVerificationEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully. Check your email.",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resend OTP. Please try again.",
    });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No account found with this email. Please signup first.",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Refresh token stored in HttpOnly cookie – inaccessible from JS
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    return res.json({
      success: true,
      message: "Login successful",
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};


export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res
      .status(401)
      .json({ success: false, message: "Token refresh failed" });
  }
};


export const logout = (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Logout failed" });
  }
};
