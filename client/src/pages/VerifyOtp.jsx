import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api/axios";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-email", { email, otp });
      if (data.success) {
        navigate("/login", { state: { verified: true } });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    setResending(true);
    try {
      const { data } = await api.post("/auth/resend-otp", { email });
      if (data.success) setMessage("OTP resent! Check your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="brand">TaskFlow</h1>
        <h2>Verify Email</h2>
        <p className="sub">OTP sent to <strong>{email}</strong></p>
        <form onSubmit={handleVerify}>
          <input
            type="text"
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
          />
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
        <button className="link-btn" onClick={handleResend} disabled={resending}>
          {resending ? "Sending..." : "Resend OTP"}
        </button>
        <p><Link to="/signup">Back to Signup</Link></p>
      </div>
    </div>
  );
}
