import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./src/config/dbConnect.js";
import authRoutes from "./src/routes/authRoutes.js";
import taskRoutes from "./src/routes/taskRoutes.js";

dotenv.config();

const app = express();

await connectDB();

app.use(cookieParser());
app.use(express.json());
app.set("trust proxy", 1);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : ["http://localhost:5173", "http://localhost:5175"];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // Postman / curl
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (origin.match(/^https:\/\/.*\.vercel\.app$/)) return cb(null, true);
      if (
        process.env.NODE_ENV === "development" &&
        origin.startsWith("http://localhost:")
      )
        return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Health check
app.get("/api/health", (req, res) =>
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  })
);


app.use((err, req, res, next) => {
  console.error("Express Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`TaskFlow server running on port ${PORT}`);
});
