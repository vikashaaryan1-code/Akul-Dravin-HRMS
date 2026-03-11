'use client';
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';
export default function ShiftsPage() {
  const [shifts, setShifts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', startTime: '', endTime: '', durationHours: 8, workingDays: ['Mon','Tue','Wed','Thu','Fri'] });
  useEffect(() => { fetchShifts(); }, []);
  const fetchShifts = async () => { const res = await fetch(`${API_BASE}/shifts`); setShifts(await res.json()); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/shifts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, companyId: 'current-company-id' }) });
    setShowModal(false);
    setForm({ name: '', startTime: '', endTime: '', durationHours: 8, workingDays: ['Mon','Tue','Wed','Thu','Fri'] });
    fetchShifts();
  };
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ink">Shifts</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-aqua text-white rounded-lg">Add Shift</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shifts.map((shift) => (
          <div key={shift.id} className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-8 h-8 text-aqua" />
              <div><h3 className="font-semibold text-ink">{shift.name}</h3><p className="text-sm text-ink/60">{shift.startTime} - {shift.endTime}</p></div>
            </div>
            <p className="text-sm text-ink/60">{shift.durationHours} hours</p>
            <span className={`mt-2 inline-block px-2 py-1 text-xs rounded-full ${shift.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{shift.isActive ? 'Active' : 'Inactive'}</span>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-ink mb-4">Add Shift</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-ink mb-1">Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Start Time</label><input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">End Time</label><input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Duration (hours)</label><input type="number" value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-aqua text-white rounded-lg">Add</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-ink/10 text-ink rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
