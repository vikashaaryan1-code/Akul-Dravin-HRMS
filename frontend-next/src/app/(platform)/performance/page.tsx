'use client';

import { useState, useEffect } from 'react';
import { Star, TrendingUp, Award } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';

export default function PerformancePage() {
  const [reviews, setReviews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employeeId: '', reviewerId: '', reviewPeriod: 'Q1', reviewYear: new Date().getFullYear(), overallRating: 3, technicalSkills: 3, communication: 3, teamwork: 3, leadership: 3, strengths: '', improvements: '', goals: '' });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const res = await fetch(`${API_BASE}/performance-reviews`);
    const data = await res.json();
    setReviews(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_BASE}/performance-reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    setForm({ employeeId: '', reviewerId: '', reviewPeriod: 'Q1', reviewYear: new Date().getFullYear(), overallRating: 3, technicalSkills: 3, communication: 3, teamwork: 3, leadership: 3, strengths: '', improvements: '', goals: '' });
    fetchReviews();
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum: number, r: any) => sum + r.overallRating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ink">Performance Reviews</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-aqua text-white rounded-lg">Create Review</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Total Reviews</p>
              <p className="text-3xl font-bold text-ink">{reviews.length}</p>
            </div>
            <Award className="w-12 h-12 text-aqua/20" />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Avg Rating</p>
              <p className="text-3xl font-bold text-ink">{avgRating}/5</p>
            </div>
            <Star className="w-12 h-12 text-yellow-400/20" />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">This Quarter</p>
              <p className="text-3xl font-bold text-ink">{reviews.filter((r: any) => r.reviewPeriod === 'Q1').length}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600/20" />
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-ink/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Overall</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Technical</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Communication</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {reviews.map((review: any) => (
              <tr key={review.id}>
                <td className="px-6 py-4 text-sm text-ink">{review.employee?.name || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-ink">{review.reviewPeriod} {review.reviewYear}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-ink">{review.overallRating}/5</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-ink">{review.technicalSkills}/5</td>
                <td className="px-6 py-4 text-sm text-ink">{review.communication}/5</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${review.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {review.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-ink mb-4">Create Performance Review</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Employee ID</label>
                  <input type="text" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Review Period</label>
                  <select value={form.reviewPeriod} onChange={(e) => setForm({ ...form, reviewPeriod: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                    <option>Q1</option>
                    <option>Q2</option>
                    <option>Q3</option>
                    <option>Q4</option>
                    <option>Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Overall Rating</label>
                  <input type="number" min="1" max="5" value={form.overallRating} onChange={(e) => setForm({ ...form, overallRating: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Technical Skills</label>
                  <input type="number" min="1" max="5" value={form.technicalSkills} onChange={(e) => setForm({ ...form, technicalSkills: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Communication</label>
                  <input type="number" min="1" max="5" value={form.communication} onChange={(e) => setForm({ ...form, communication: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Teamwork</label>
                  <input type="number" min="1" max="5" value={form.teamwork} onChange={(e) => setForm({ ...form, teamwork: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1">Strengths</label>
                  <textarea value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1">Areas for Improvement</label>
                  <textarea value={form.improvements} onChange={(e) => setForm({ ...form, improvements: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1">Goals</label>
                  <textarea value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-aqua text-white rounded-lg">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-ink/10 text-ink rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
