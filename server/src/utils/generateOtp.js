import crypto from "crypto";

export const generateOtp = async (email) => {
  try {
    if (!process.env.SECRET) {
      throw new Error("SECRET environment variable is not set");
    }

    if (!email) {
      throw new Error("Valid email is required for OTP generation");
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash OTP using HMAC-SHA256 for secure storage (never store plain OTP)
    const hashedOtp = crypto
      .createHmac("sha256", process.env.SECRET)
      .update(otp)
      .digest("hex");

    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return {
      hashedOtp,
      otp,
      otpExpiry: new Date(expires),
      lastOtpSentAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating OTP:", error);
    throw new Error(`Failed to generate OTP: ${error.message}`);
  }
};
