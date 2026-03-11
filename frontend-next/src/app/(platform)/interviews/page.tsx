'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, MapPin, Star } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ applicationId: '', title: '', type: 'Technical', scheduledAt: '', duration: 60, location: '', notes: '' });

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    const res = await fetch(`${API_BASE}/interviews`);
    const data = await res.json();
    setInterviews(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_BASE}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    setForm({ applicationId: '', title: '', type: 'Technical', scheduledAt: '', duration: 60, location: '', notes: '' });
    fetchInterviews();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`${API_BASE}/interviews/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchInterviews();
  };

  const stats = {
    scheduled: interviews.filter((i: any) => i.status === 'scheduled').length,
    completed: interviews.filter((i: any) => i.status === 'completed').length,
    cancelled: interviews.filter((i: any) => i.status === 'cancelled').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ink">Interviews</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-aqua text-white rounded-lg">Schedule Interview</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Scheduled</p>
              <p className="text-3xl font-bold text-aqua">{stats.scheduled}</p>
            </div>
            <Calendar className="w-12 h-12 text-aqua/20" />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Completed</p>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <Clock className="w-12 h-12 text-green-600/20" />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Cancelled</p>
              <p className="text-3xl font-bold text-ember">{stats.cancelled}</p>
            </div>
            <Calendar className="w-12 h-12 text-ember/20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interviews.map((interview: any) => (
          <div key={interview.id} className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-ink">{interview.title}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                interview.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {interview.status}
              </span>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-ink/60">
                <Calendar className="w-4 h-4" />
                {new Date(interview.scheduledAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-ink/60">
                <Clock className="w-4 h-4" />
                {new Date(interview.scheduledAt).toLocaleTimeString()} ({interview.duration} min)
              </div>
              <div className="flex items-center gap-2 text-sm text-ink/60">
                {interview.type === 'Video' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                {interview.location || interview.type}
              </div>
              {interview.rating && (
                <div className="flex items-center gap-2 text-sm text-ink/60">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {interview.rating}/5
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {interview.status === 'scheduled' && (
                <>
                  <button onClick={() => updateStatus(interview.id, 'completed')} className="flex-1 px-3 py-1 text-xs bg-green-100 text-green-800 rounded">Complete</button>
                  <button onClick={() => updateStatus(interview.id, 'cancelled')} className="flex-1 px-3 py-1 text-xs bg-red-100 text-red-800 rounded">Cancel</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-ink mb-4">Schedule Interview</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Application ID</label>
                <input type="text" value={form.applicationId} onChange={(e) => setForm({ ...form, applicationId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                  <option>Technical</option>
                  <option>HR</option>
                  <option>Managerial</option>
                  <option>Video</option>
                  <option>Phone</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Scheduled At</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Duration (minutes)</label>
                <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-aqua text-white rounded-lg">Schedule</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-ink/10 text-ink rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
