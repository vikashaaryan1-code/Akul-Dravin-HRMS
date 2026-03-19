'use client';

import { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Users } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ companyId: '00000000-0000-0000-0000-000000000000', title: '', description: '', location: '', employmentType: 'Full-time', experienceLevel: 'Mid-level', salaryMin: '', salaryMax: '', skills: '', openings: 1, closingDate: '', status: 'open' });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const res = await fetch(`${API_BASE}/jobs`);
    const data = await res.json();
    setJobs(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    setForm({ companyId: '00000000-0000-0000-0000-000000000000', title: '', description: '', location: '', employmentType: 'Full-time', experienceLevel: 'Mid-level', salaryMin: '', salaryMax: '', skills: '', openings: 1, closingDate: '', status: 'open' });
    fetchJobs();
  };

  const stats = {
    total: jobs.length,
    open: jobs.filter((j: any) => j.status === 'open').length,
    closed: jobs.filter((j: any) => j.status === 'closed').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ink">Job Openings</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-aqua text-white rounded-lg">Post Job</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Total Jobs</p>
              <p className="text-3xl font-bold text-ink">{stats.total}</p>
            </div>
            <Briefcase className="w-12 h-12 text-aqua/20" />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Open Positions</p>
              <p className="text-3xl font-bold text-green-600">{stats.open}</p>
            </div>
            <Users className="w-12 h-12 text-green-600/20" />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Closed</p>
              <p className="text-3xl font-bold text-ember">{stats.closed}</p>
            </div>
            <Briefcase className="w-12 h-12 text-ember/20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job: any) => (
          <div key={job.id} className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-ink">{job.title}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {job.status}
              </span>
            </div>
            <p className="text-sm text-ink/60 mb-4 line-clamp-2">{job.description}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-ink/60">
                <MapPin className="w-4 h-4" />
                {job.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-ink/60">
                <DollarSign className="w-4 h-4" />
                ₹{job.salaryMin?.toLocaleString()} - ₹{job.salaryMax?.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-ink/60">
                <Users className="w-4 h-4" />
                {job.openings} opening(s)
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-ink/10">
              <span className="text-xs text-ink/60">{job.employmentType} • {job.experienceLevel}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-ink mb-4">Post New Job</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1">Job Title</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={4} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Location</label>
                  <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Employment Type</label>
                  <select value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Experience Level</label>
                  <select value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                    <option>Entry-level</option>
                    <option>Mid-level</option>
                    <option>Senior</option>
                    <option>Lead</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Openings</label>
                  <input type="number" value={form.openings} onChange={(e) => setForm({ ...form, openings: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Min Salary</label>
                  <input type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Max Salary</label>
                  <input type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1">Skills (comma separated)</label>
                  <input type="text" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Closing Date</label>
                  <input type="date" value={form.closingDate} onChange={(e) => setForm({ ...form, closingDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-aqua text-white rounded-lg">Post Job</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-ink/10 text-ink rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
