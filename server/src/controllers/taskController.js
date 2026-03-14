import Task from "../models/Task.js";
import { encrypt, decrypt } from "../utils/encryption.js";

// Helper to strip encryption before sending to client
const formatTask = (task) => ({
  _id: task._id,
  title: task.title,
  description: task.description ? decrypt(task.description) : "",
  status: task.status,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});


export const createTask = async (req, res) => {
  try {
    const { title, description, status } = req.body;

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    const task = await Task.create({
      userId: req.user.id,
      title: title.trim(),
      description: encrypt(description?.trim() || ""),
      status: status || "todo",
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: formatTask(task),
    });
  } catch (error) {
    console.error("createTask error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to create task" });
  }
};


export const getTasks = async (req, res) => {
  try {
    const { status, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Build query – user can only see their own tasks
    const query = { userId: req.user.id };

    if (status && ["todo", "in-progress", "done"].includes(status)) {
      query.status = status;
    }

    if (search && search.trim()) {
      // Case-insensitive title search using regex
      query.title = { $regex: search.trim(), $options: "i" };
    }

    const [tasks, total] = await Promise.all([
      Task.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Task.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      tasks: tasks.map(formatTask),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("getTasks error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch tasks" });
  }
};


export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id, // Ensures user can only access their own tasks
    });

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    return res.json({ success: true, task: formatTask(task) });
  } catch (error) {
    console.error("getTaskById error:", error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid task ID" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch task" });
  }
};


export const updateTask = async (req, res) => {
  try {
    const { title, description, status } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = encrypt(description.trim());
    if (status !== undefined) task.status = status;

    await task.save();

    return res.json({
      success: true,
      message: "Task updated successfully",
      task: formatTask(task),
    });
  } catch (error) {
    console.error("updateTask error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid task ID" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to update task" });
  }
};


export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id, // Authorization: only delete own tasks
    });

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    return res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("deleteTask error:", error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid task ID" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete task" });
  }
};
