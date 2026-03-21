'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', category: '' });

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch { setTasks([]); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, createdBy: 'current-user-id' }),
    });
    setShowModal(false);
    setForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', category: '' });
    fetchTasks();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchTasks();
  };

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.fullName || userId;

  const statuses = ['todo', 'in-progress', 'review', 'done'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ink">Tasks</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-aqua text-white rounded-lg">Create Task</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statuses.map(status => (
          <div key={status} className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <h3 className="font-semibold text-ink mb-4 capitalize">{status.replace('-', ' ')}</h3>
            <div className="space-y-3">
              {tasks.filter((t: any) => t.status === status).length === 0 ? (
                <p className="text-xs text-ink/40 text-center py-4">No tasks</p>
              ) : (
                tasks.filter((t: any) => t.status === status).map((task: any) => (
                  <div key={task.id} className="bg-white border border-ink/10 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-ink">{task.title}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-green-100 text-green-800'
                      }`}>{task.priority}</span>
                    </div>
                    {task.description && <p className="text-xs text-ink/60 mb-2">{task.description}</p>}
                    {task.assignedTo && <p className="text-xs text-ink/50 mb-1">Assigned: {getUserName(task.assignedTo)}</p>}
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-ink/60">
                        <Clock className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    <select
                      value={task.status}
                      onChange={(e) => updateStatus(task.id, e.target.value)}
                      className="w-full mt-2 px-2 py-1 text-xs border rounded"
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-ink mb-4">Create Task</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Assign To</label>
                <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select employee...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Due Date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-aqua text-white rounded-lg">Create & Notify</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-ink/10 text-ink rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
