import { useState } from "react";
import api from "../api/axios";

// Handles both Create (task=null) and Edit (task=object)
export default function TaskModal({ task, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "todo",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setLoading(true);
    try {
      if (task) {
        await api.put(`/tasks/${task._id}`, form);
      } else {
        await api.post("/tasks", form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{task ? "Edit Task" : "New Task"}</h2>
        <form onSubmit={handleSubmit}>
          <label>Title</label>
          <input
            name="title"
            placeholder="Task title"
            value={form.title}
            onChange={handleChange}
            required
          />
          <label>Description</label>
          <textarea
            name="description"
            placeholder="Optional description"
            value={form.description}
            onChange={handleChange}
            rows={3}
          />
          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          {error && <p className="error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : task ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
