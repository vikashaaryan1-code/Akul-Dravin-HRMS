'use client';
import { useState, useEffect } from 'react';
import { UserMinus, Plus } from 'lucide-react';

export default function ExitsPage() {
  const [exits, setExits] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetch('http://localhost:4200/api/v1/exits').then(r => r.json()).then(setExits); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:4200/api/v1/exits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    setShowModal(false);
    fetch('http://localhost:4200/api/v1/exits').then(r => r.json()).then(setExits);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Employee Exit Management</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Initiate Exit</button>
      </div>
      <div className="grid gap-4">
        {exits.map((e) => (
          <div key={e.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-800">Employee: {e.employeeId}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${e.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{e.status}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Resignation Date: {new Date(e.resignationDate).toLocaleDateString()}</p>
                  <p>Last Working Day: {new Date(e.lastWorkingDay).toLocaleDateString()}</p>
                  <p>Reason: {e.reason}</p>
                  {e.feedback && <p>Feedback: {e.feedback}</p>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">Initiate Exit Process</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input name="employeeId" placeholder="Employee ID *" required className="w-full px-4 py-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <input name="resignationDate" type="date" required className="px-4 py-2 border rounded-lg" />
                <input name="lastWorkingDay" type="date" required className="px-4 py-2 border rounded-lg" />
              </div>
              <select name="reason" required className="w-full px-4 py-2 border rounded-lg"><option value="">Reason</option><option value="resignation">Resignation</option><option value="retirement">Retirement</option><option value="termination">Termination</option><option value="other">Other</option></select>
              <textarea name="feedback" placeholder="Exit Feedback" rows="3" className="w-full px-4 py-2 border rounded-lg"></textarea>
              <select name="status" defaultValue="pending" className="w-full px-4 py-2 border rounded-lg"><option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option></select>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">Initiate</button><button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
