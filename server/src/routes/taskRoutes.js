import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// All task routes require authentication
router.use(authMiddleware);

router.post("/", createTask);         // POST   /api/tasks
router.get("/", getTasks);            // GET    /api/tasks?page=1&limit=10&status=todo&search=keyword
router.get("/:id", getTaskById);      // GET    /api/tasks/:id
router.put("/:id", updateTask);       // PUT    /api/tasks/:id
router.delete("/:id", deleteTask);    // DELETE /api/tasks/:id

export default router;
