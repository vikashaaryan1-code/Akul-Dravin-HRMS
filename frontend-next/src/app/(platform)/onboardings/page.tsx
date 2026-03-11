'use client';
import { useState, useEffect } from 'react';
import { UserPlus, Plus } from 'lucide-react';

export default function OnboardingsPage() {
  const [onboardings, setOnboardings] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetch('http://localhost:4200/api/v1/onboardings').then(r => r.json()).then(setOnboardings); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:4200/api/v1/onboardings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    setShowModal(false);
    fetch('http://localhost:4200/api/v1/onboardings').then(r => r.json()).then(setOnboardings);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Employee Onboarding</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Start Onboarding</button>
      </div>
      <div className="grid gap-4">
        {onboardings.map((o) => (
          <div key={o.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Employee: {o.employeeId}</h3>
                <p className="text-sm text-gray-500">Start Date: {new Date(o.startDate).toLocaleDateString()}</p>
                {o.buddy && <p className="text-sm text-gray-500">Buddy: {o.buddy}</p>}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${o.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{o.status}</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2 mb-2"><div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full" style={{ width: `${o.progress}%` }}></div></div>
            <p className="text-sm text-gray-600">Progress: {o.progress}%</p>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">Start Onboarding</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input name="employeeId" placeholder="Employee ID *" required className="w-full px-4 py-2 border rounded-lg" />
              <input name="startDate" type="date" required className="w-full px-4 py-2 border rounded-lg" />
              <input name="buddy" placeholder="Onboarding Buddy" className="w-full px-4 py-2 border rounded-lg" />
              <input name="progress" type="number" min="0" max="100" placeholder="Progress %" defaultValue="0" className="w-full px-4 py-2 border rounded-lg" />
              <select name="status" defaultValue="in_progress" className="w-full px-4 py-2 border rounded-lg"><option value="in_progress">In Progress</option><option value="completed">Completed</option></select>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">Start</button><button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
