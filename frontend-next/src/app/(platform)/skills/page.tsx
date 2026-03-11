'use client';
import { useState, useEffect } from 'react';
import { Award, Plus } from 'lucide-react';

export default function SkillsPage() {
  const [data, setData] = useState([]);
  const [show, setShow] = useState(false);

  useEffect(() => { fetch('http://localhost:4200/api/v1/skills').then(r => r.json()).then(setData); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:4200/api/v1/skills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    setShow(false);
    fetch('http://localhost:4200/api/v1/skills').then(r => r.json()).then(setData);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Skills</h1>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Add Skill</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.map((d) => (
          <div key={d.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">{d.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{d.description}</p>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700">{d.category}</span>
          </div>
        ))}
      </div>
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">Add Skill</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input name="name" placeholder="Skill Name *" required className="w-full px-4 py-2 border rounded-lg" />
              <select name="category" required className="w-full px-4 py-2 border rounded-lg"><option value="">Category</option><option value="technical">Technical</option><option value="soft">Soft Skills</option><option value="language">Language</option></select>
              <textarea name="description" placeholder="Description" rows="3" className="w-full px-4 py-2 border rounded-lg"></textarea>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">Create</button><button type="button" onClick={() => setShow(false)} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
