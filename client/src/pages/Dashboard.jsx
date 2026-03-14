import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import TaskModal from "../components/TaskModal";

const STATUS_OPTIONS = ["", "todo", "in-progress", "done"];
const STATUS_LABELS = { "": "All", todo: "To Do", "in-progress": "In Progress", done: "Done" };

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null); // null = create, object = edit

  const fetchTasks = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 8 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const { data } = await api.get("/tasks", { params });
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  // Refetch whenever search or status filter changes
  useEffect(() => {
    fetchTasks(1);
  }, [fetchTasks]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleSaved = () => {
    setModalOpen(false);
    setEditTask(null);
    fetchTasks(pagination.page);
  };

  const statusBadge = (status) => {
    const map = { todo: "badge-todo", "in-progress": "badge-progress", done: "badge-done" };
    return <span className={`badge ${map[status] || ""}`}>{STATUS_LABELS[status] || status}</span>;
  };

  return (
    <div className="dashboard">
      {/* Navbar */}
      <header className="navbar">
        <h1 className="brand">TaskFlow</h1>
        <div className="nav-right">
          <span>Hi, {user?.name}</span>
          <button className="btn-outline" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Toolbar: search + filter + add */}
      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button className="btn-primary" onClick={() => { setEditTask(null); setModalOpen(true); }}>
          + New Task
        </button>
      </div>

      {/* Task list */}
      <div className="task-grid">
        {loading && <p className="center-msg">Loading...</p>}
        {error && <p className="center-msg error">{error}</p>}
        {!loading && !error && tasks.length === 0 && (
          <p className="center-msg">No tasks found. Create one!</p>
        )}
        {tasks.map((task) => (
          <div key={task._id} className="task-card">
            <div className="task-card-header">
              <h3>{task.title}</h3>
              {statusBadge(task.status)}
            </div>
            {task.description && <p className="task-desc">{task.description}</p>}
            <div className="task-card-footer">
              <span className="task-date">
                {new Date(task.createdAt).toLocaleDateString()}
              </span>
              <div className="task-actions">
                <button
                  className="btn-sm"
                  onClick={() => { setEditTask(task); setModalOpen(true); }}
                >
                  Edit
                </button>
                <button className="btn-sm btn-danger" onClick={() => handleDelete(task._id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.page <= 1}
            onClick={() => fetchTasks(pagination.page - 1)}
          >
            ← Prev
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchTasks(pagination.page + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <TaskModal
          task={editTask}
          onClose={() => { setModalOpen(false); setEditTask(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
