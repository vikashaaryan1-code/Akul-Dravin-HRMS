'use client';
import { useState, useEffect } from 'react';
import { GraduationCap, Users } from 'lucide-react';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';
export default function TrainingsPage() {
  const [trainings, setTrainings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', trainer: '', startDate: '', endDate: '', capacity: 20 });
  useEffect(() => { fetchTrainings(); }, []);
  const fetchTrainings = async () => { const res = await fetch(`${API_BASE}/trainings`); setTrainings(await res.json()); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/trainings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, companyId: 'current-company-id' }) });
    setShowModal(false);
    setForm({ title: '', description: '', trainer: '', startDate: '', endDate: '', capacity: 20 });
    fetchTrainings();
  };
  const handleEnroll = async (id) => {
    await fetch(`${API_BASE}/trainings/${id}/enroll`, { method: 'PATCH' });
    fetchTrainings();
  };
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ink">Trainings</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-aqua text-white rounded-lg">Create Training</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainings.map((training) => (
          <div key={training.id} className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <GraduationCap className="w-8 h-8 text-aqua" />
              <div className="flex-1"><h3 className="font-semibold text-ink">{training.title}</h3><p className="text-sm text-ink/60 mt-1">{training.trainer}</p></div>
            </div>
            <p className="text-sm text-ink/60 mb-3">{new Date(training.startDate).toLocaleDateString()} - {new Date(training.endDate).toLocaleDateString()}</p>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-ink/60"><Users className="w-4 h-4" /><span>{training.enrolled}/{training.capacity}</span></div>
              <span className={`px-2 py-1 text-xs rounded-full ${training.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : training.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{training.status}</span>
            </div>
            {training.enrolled < training.capacity && training.status === 'scheduled' && (
              <button onClick={() => handleEnroll(training.id)} className="w-full py-2 bg-aqua text-white rounded-lg text-sm">Enroll</button>
            )}
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-ink mb-4">Create Training</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-ink mb-1">Title</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Trainer</label><input type="text" value={form.trainer} onChange={(e) => setForm({ ...form, trainer: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Start Date</label><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">End Date</label><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Capacity</label><input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-aqua text-white rounded-lg">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-ink/10 text-ink rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
