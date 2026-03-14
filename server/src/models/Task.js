import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    // Task belongs to a user – enforces per-user authorization
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },

    status: {
      type: String,
      enum: {
        values: ["todo", "in-progress", "done"],
        message: "Status must be todo, in-progress, or done",
      },
      default: "todo",
    },
  },
  { timestamps: true } // createdAt and updatedAt auto-managed
);

// Index on userId for fast per-user queries


export default mongoose.model("Task", taskSchema);
