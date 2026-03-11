'use client';

import { useState, useEffect } from 'react';
import { FileText, Mail, Phone, Briefcase } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ jobId: '', candidateName: '', email: '', phone: '', experienceYears: 0, skills: '', currentCompany: '', currentSalary: '', expectedSalary: '' });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const res = await fetch(`${API_BASE}/applications`);
    const data = await res.json();
    setApplications(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    setForm({ jobId: '', candidateName: '', email: '', phone: '', experienceYears: 0, skills: '', currentCompany: '', currentSalary: '', expectedSalary: '' });
    fetchApplications();
  };

  const updateStage = async (id: string, stage: string) => {
    await fetch(`${API_BASE}/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in-progress', stage }),
    });
    fetchApplications();
  };

  const stages = ['screening', 'interview', 'offer', 'hired', 'rejected'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ink">Applications</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-aqua text-white rounded-lg">Add Application</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stages.map(stage => (
          <div key={stage} className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-ink mb-2 capitalize">{stage}</h3>
            <p className="text-2xl font-bold text-aqua">{applications.filter((a: any) => a.stage === stage).length}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-ink/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Candidate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Job</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Experience</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Expected Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Stage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {applications.map((app: any) => (
              <tr key={app.id}>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-ink">{app.candidateName}</p>
                    <div className="flex items-center gap-2 text-xs text-ink/60 mt-1">
                      <Mail className="w-3 h-3" />
                      {app.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink/60">
                      <Phone className="w-3 h-3" />
                      {app.phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-ink">{app.job?.title || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-ink">{app.experienceYears} years</td>
                <td className="px-6 py-4 text-sm text-ink">₹{app.expectedSalary?.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <select value={app.stage} onChange={(e) => updateStage(app.id, e.target.value)} className="px-2 py-1 text-xs rounded border">
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <button className="text-aqua text-sm">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-ink mb-4">Add Application</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1">Job ID</label>
                  <input type="text" value={form.jobId} onChange={(e) => setForm({ ...form, jobId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Candidate Name</label>
                  <input type="text" value={form.candidateName} onChange={(e) => setForm({ ...form, candidateName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Experience (Years)</label>
                  <input type="number" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1">Skills</label>
                  <input type="text" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Current Company</label>
                  <input type="text" value={form.currentCompany} onChange={(e) => setForm({ ...form, currentCompany: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Current Salary</label>
                  <input type="number" value={form.currentSalary} onChange={(e) => setForm({ ...form, currentSalary: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Expected Salary</label>
                  <input type="number" value={form.expectedSalary} onChange={(e) => setForm({ ...form, expectedSalary: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-aqua text-white rounded-lg">Submit</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-ink/10 text-ink rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
