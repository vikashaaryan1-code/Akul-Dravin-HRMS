'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2 } from 'lucide-react';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState({ total: 0, inProgress: 0, completed: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetch('http://localhost:4200/api/v1/goals').then(r => r.json()).then(setGoals);
    fetch('http://localhost:4200/api/v1/goals/stats').then(r => r.json()).then(setStats);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editing ? `http://localhost:4200/api/v1/goals/${editing.id}` : 'http://localhost:4200/api/v1/goals';
    await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    setShowModal(false);
    setEditing(null);
    fetch('http://localhost:4200/api/v1/goals').then(r => r.json()).then(setGoals);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Goals & OKRs</h1>
        <button onClick={() => { setShowModal(true); setEditing(null); }} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Add Goal</button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {[{ l: 'Total', v: stats.total, c: 'cyan' }, { l: 'In Progress', v: stats.inProgress, c: 'orange' }, { l: 'Completed', v: stats.completed, c: 'green' }].map((s, i) => (
          <div key={i} className={`bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-${s.c}-100 shadow-sm`}><p className="text-gray-600 text-sm">{s.l}</p><p className={`text-3xl font-bold text-${s.c}-600 mt-1`}>{s.v}</p></div>
        ))}
      </div>

      <div className="grid gap-4">
        {goals.map((g) => (
          <div key={g.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{g.title}</h3>
                <p className="text-gray-600 mb-3">{g.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Category: {g.category}</span>
                  <span>•</span>
                  <span>Target: {new Date(g.targetDate).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="font-medium">Progress: {g.progress}%</span>
                </div>
                <div className="mt-3 bg-gray-200 rounded-full h-2"><div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full" style={{ width: `${g.progress}%` }}></div></div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => { setEditing(g); setShowModal(true); }} className="text-blue-600"><Edit2 size={20} /></button>
                <button onClick={async () => { if (confirm('Delete?')) { await fetch(`http://localhost:4200/api/v1/goals/${g.id}`, { method: 'DELETE' }); fetch('http://localhost:4200/api/v1/goals').then(r => r.json()).then(setGoals); }}} className="text-red-600"><Trash2 size={20} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">{editing ? 'Edit' : 'Add'} Goal</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input name="employeeId" placeholder="Employee ID *" defaultValue={editing?.employeeId} required className="w-full px-4 py-2 border rounded-lg" />
              <input name="title" placeholder="Title *" defaultValue={editing?.title} required className="w-full px-4 py-2 border rounded-lg" />
              <textarea name="description" placeholder="Description *" defaultValue={editing?.description} required rows="2" className="w-full px-4 py-2 border rounded-lg"></textarea>
              <div className="grid grid-cols-2 gap-4">
                <select name="category" defaultValue={editing?.category} required className="px-4 py-2 border rounded-lg"><option value="">Category</option><option value="performance">Performance</option><option value="skill">Skill Development</option><option value="project">Project</option></select>
                <input name="progress" type="number" min="0" max="100" placeholder="Progress %" defaultValue={editing?.progress || 0} className="px-4 py-2 border rounded-lg" />
                <input name="startDate" type="date" defaultValue={editing?.startDate} required className="px-4 py-2 border rounded-lg" />
                <input name="targetDate" type="date" defaultValue={editing?.targetDate} required className="px-4 py-2 border rounded-lg" />
              </div>
              <select name="status" defaultValue={editing?.status || 'in_progress'} className="w-full px-4 py-2 border rounded-lg"><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="on_hold">On Hold</option></select>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">{editing ? 'Update' : 'Create'}</button><button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
