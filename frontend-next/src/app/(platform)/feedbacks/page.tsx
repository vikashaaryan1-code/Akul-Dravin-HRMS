'use client';
import { useState, useEffect } from 'react';
import { MessageSquare, Plus } from 'lucide-react';

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetch('http://localhost:4200/api/v1/feedbacks').then(r => r.json()).then(setFeedbacks); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:4200/api/v1/feedbacks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    setShowModal(false);
    fetch('http://localhost:4200/api/v1/feedbacks').then(r => r.json()).then(setFeedbacks);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Feedback</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Submit Feedback</button>
      </div>
      <div className="grid gap-4">
        {feedbacks.map((f) => (
          <div key={f.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{'⭐'.repeat(f.rating)}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${f.status === 'reviewed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{f.status}</span>
            </div>
            <p className="text-gray-600 mb-2">{f.comments}</p>
            <div className="text-sm text-gray-500">Type: {f.type} • Employee: {f.employeeId}</div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">Submit Feedback</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input name="employeeId" placeholder="Employee ID *" required className="w-full px-4 py-2 border rounded-lg" />
              <select name="type" required className="w-full px-4 py-2 border rounded-lg"><option value="">Type</option><option value="performance">Performance</option><option value="culture">Culture</option><option value="management">Management</option></select>
              <select name="rating" required className="w-full px-4 py-2 border rounded-lg"><option value="">Rating</option>{[1,2,3,4,5].map(r => <option key={r} value={r}>{r} Star{r>1?'s':''}</option>)}</select>
              <textarea name="comments" placeholder="Comments *" required rows="4" className="w-full px-4 py-2 border rounded-lg"></textarea>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">Submit</button><button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
