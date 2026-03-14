import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Send a simple plain-text OTP email (no HTML template)
export const sendVerificationEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your TaskFlow Verification OTP",
    text: `Your OTP for TaskFlow is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nDo not share this OTP with anyone.`,
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};
