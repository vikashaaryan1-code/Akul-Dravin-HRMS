'use client';
import { useState, useEffect } from 'react';
import { AlertCircle, Plus, Edit2, Trash2 } from 'lucide-react';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetch('http://localhost:4200/api/v1/tickets').then(r => r.json()).then(setTickets);
    fetch('http://localhost:4200/api/v1/tickets/stats').then(r => r.json()).then(setStats);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editing ? `http://localhost:4200/api/v1/tickets/${editing.id}` : 'http://localhost:4200/api/v1/tickets';
    await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    setShowModal(false);
    setEditing(null);
    fetch('http://localhost:4200/api/v1/tickets').then(r => r.json()).then(setTickets);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Support Tickets</h1>
        <button onClick={() => { setShowModal(true); setEditing(null); }} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Create Ticket</button>
      </div>
      <div className="grid grid-cols-3 gap-6 mb-8">
        {[{ l: 'Total', v: stats.total, c: 'cyan' }, { l: 'Open', v: stats.open, c: 'orange' }, { l: 'Closed', v: stats.closed, c: 'green' }].map((s, i) => (
          <div key={i} className={`bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-${s.c}-100 shadow-sm`}><p className="text-gray-600 text-sm">{s.l}</p><p className={`text-3xl font-bold text-${s.c}-600 mt-1`}>{s.v}</p></div>
        ))}
      </div>
      <div className="grid gap-4">
        {tickets.map((t) => (
          <div key={t.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{t.title}</h3>
                  <span className="text-sm text-gray-500">#{t.ticketNumber}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${t.priority === 'high' ? 'bg-red-100 text-red-700' : t.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{t.priority}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${t.status === 'closed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{t.status}</span>
                </div>
                <p className="text-gray-600 mb-2">{t.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Category: {t.category}</span>
                  <span>•</span>
                  <span>Created by: {t.createdBy}</span>
                  {t.assignedTo && <><span>•</span><span>Assigned to: {t.assignedTo}</span></>}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => { setEditing(t); setShowModal(true); }} className="text-blue-600"><Edit2 size={20} /></button>
                <button onClick={async () => { if (confirm('Delete?')) { await fetch(`http://localhost:4200/api/v1/tickets/${t.id}`, { method: 'DELETE' }); fetch('http://localhost:4200/api/v1/tickets').then(r => r.json()).then(setTickets); }}} className="text-red-600"><Trash2 size={20} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">{editing ? 'Edit' : 'Create'} Ticket</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input name="ticketNumber" placeholder="Ticket # *" defaultValue={editing?.ticketNumber} required className="w-full px-4 py-2 border rounded-lg" />
              <input name="title" placeholder="Title *" defaultValue={editing?.title} required className="w-full px-4 py-2 border rounded-lg" />
              <textarea name="description" placeholder="Description *" defaultValue={editing?.description} required rows="3" className="w-full px-4 py-2 border rounded-lg"></textarea>
              <div className="grid grid-cols-2 gap-4">
                <select name="category" defaultValue={editing?.category} required className="px-4 py-2 border rounded-lg"><option value="">Category</option><option value="technical">Technical</option><option value="hr">HR</option><option value="admin">Admin</option></select>
                <select name="priority" defaultValue={editing?.priority || 'low'} className="px-4 py-2 border rounded-lg"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
                <input name="createdBy" placeholder="Created By *" defaultValue={editing?.createdBy} required className="px-4 py-2 border rounded-lg" />
                <input name="assignedTo" placeholder="Assigned To" defaultValue={editing?.assignedTo} className="px-4 py-2 border rounded-lg" />
                <select name="status" defaultValue={editing?.status || 'open'} className="px-4 py-2 border rounded-lg"><option value="open">Open</option><option value="in_progress">In Progress</option><option value="closed">Closed</option></select>
              </div>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">{editing ? 'Update' : 'Create'}</button><button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
