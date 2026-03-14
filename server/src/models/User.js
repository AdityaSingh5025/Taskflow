import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Name is required"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Hashed with bcrypt – never stored as plain text
    password: {
      type: String,
      required: [true, "Password is required"],
    },

    isVerified: { type: Boolean, default: false },

    // OTP fields – hashed OTP stored, never plain text
    hashedOtp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    lastOtpSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
