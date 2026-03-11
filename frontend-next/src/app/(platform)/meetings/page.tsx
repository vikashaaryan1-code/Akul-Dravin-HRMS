'use client';
import { useState, useEffect } from 'react';
import { Video, Plus, Edit2, Trash2 } from 'lucide-react';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { fetch('http://localhost:4200/api/v1/meetings').then(r => r.json()).then(setMeetings); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editing ? `http://localhost:4200/api/v1/meetings/${editing.id}` : 'http://localhost:4200/api/v1/meetings';
    await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    setShowModal(false);
    setEditing(null);
    fetch('http://localhost:4200/api/v1/meetings').then(r => r.json()).then(setMeetings);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Meetings</h1>
        <button onClick={() => { setShowModal(true); setEditing(null); }} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Schedule Meeting</button>
      </div>
      <div className="grid gap-4">
        {meetings.map((m) => (
          <div key={m.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{m.title}</h3>
                <p className="text-gray-600 mb-3">{m.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{new Date(m.startTime).toLocaleString()}</span>
                  <span>•</span>
                  <span>{m.location || m.meetingLink}</span>
                  <span>•</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${m.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{m.status}</span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => { setEditing(m); setShowModal(true); }} className="text-blue-600"><Edit2 size={20} /></button>
                <button onClick={async () => { if (confirm('Delete?')) { await fetch(`http://localhost:4200/api/v1/meetings/${m.id}`, { method: 'DELETE' }); fetch('http://localhost:4200/api/v1/meetings').then(r => r.json()).then(setMeetings); }}} className="text-red-600"><Trash2 size={20} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">{editing ? 'Edit' : 'Schedule'} Meeting</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input name="title" placeholder="Title *" defaultValue={editing?.title} required className="w-full px-4 py-2 border rounded-lg" />
              <textarea name="description" placeholder="Description" defaultValue={editing?.description} rows="2" className="w-full px-4 py-2 border rounded-lg"></textarea>
              <div className="grid grid-cols-2 gap-4">
                <input name="startTime" type="datetime-local" defaultValue={editing?.startTime} required className="px-4 py-2 border rounded-lg" />
                <input name="endTime" type="datetime-local" defaultValue={editing?.endTime} required className="px-4 py-2 border rounded-lg" />
                <input name="location" placeholder="Location" defaultValue={editing?.location} className="px-4 py-2 border rounded-lg" />
                <input name="meetingLink" placeholder="Meeting Link" defaultValue={editing?.meetingLink} className="px-4 py-2 border rounded-lg" />
                <input name="organizer" placeholder="Organizer *" defaultValue={editing?.organizer} required className="px-4 py-2 border rounded-lg" />
                <select name="status" defaultValue={editing?.status || 'scheduled'} className="px-4 py-2 border rounded-lg"><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
              </div>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">{editing ? 'Update' : 'Schedule'}</button><button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
