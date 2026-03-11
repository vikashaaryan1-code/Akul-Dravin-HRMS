'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, Shield, CheckCircle } from 'lucide-react';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, requiresAck: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  useEffect(() => {
    fetchPolicies();
    fetchStats();
  }, []);

  const fetchPolicies = async () => {
    const res = await fetch('http://localhost:4200/api/v1/policies');
    const data = await res.json();
    setPolicies(data);
  };

  const fetchStats = async () => {
    const res = await fetch('http://localhost:4200/api/v1/policies/stats');
    const data = await res.json();
    setStats(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    data.requiresAcknowledgment = data.requiresAcknowledgment === 'on';

    const url = editingPolicy
      ? `http://localhost:4200/api/v1/policies/${editingPolicy.id}`
      : 'http://localhost:4200/api/v1/policies';

    await fetch(url, {
      method: editingPolicy ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    setShowModal(false);
    setEditingPolicy(null);
    fetchPolicies();
    fetchStats();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this policy?')) {
      await fetch(`http://localhost:4200/api/v1/policies/${id}`, { method: 'DELETE' });
      fetchPolicies();
      fetchStats();
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Company Policies</h1>
          <p className="text-gray-600 mt-1">Manage organizational policies</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingPolicy(null); }}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          Add Policy
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-cyan-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Policies</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <FileText className="text-cyan-500" size={40} />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-green-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Policies</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <Shield className="text-green-500" size={40} />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-orange-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Requires Acknowledgment</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.requiresAck}</p>
            </div>
            <CheckCircle className="text-orange-500" size={40} />
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Effective Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Requires Ack</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {policies.map((policy) => (
              <tr key={policy.id} className="hover:bg-cyan-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{policy.title}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{policy.category}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(policy.effectiveDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    policy.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {policy.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {policy.requiresAcknowledgment ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingPolicy(policy); setShowModal(true); }} className="text-blue-600 hover:text-blue-800">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(policy.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">{editingPolicy ? 'Edit Policy' : 'Add New Policy'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input name="title" defaultValue={editingPolicy?.title} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select name="category" defaultValue={editingPolicy?.category} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                    <option value="">Select Category</option>
                    <option value="HR">HR</option>
                    <option value="IT">IT</option>
                    <option value="Finance">Finance</option>
                    <option value="Security">Security</option>
                    <option value="Compliance">Compliance</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea name="description" defaultValue={editingPolicy?.description} required rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea name="content" defaultValue={editingPolicy?.content} rows="5" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date *</label>
                    <input name="effectiveDate" type="date" defaultValue={editingPolicy?.effectiveDate} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                    <input name="expiryDate" type="date" defaultValue={editingPolicy?.expiryDate} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select name="status" defaultValue={editingPolicy?.status || 'active'} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input name="requiresAcknowledgment" type="checkbox" defaultChecked={editingPolicy?.requiresAcknowledgment} className="w-4 h-4 text-cyan-500 rounded focus:ring-2 focus:ring-cyan-500" />
                  <label className="text-sm font-medium text-gray-700">Requires Employee Acknowledgment</label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg hover:shadow-lg transition-all font-medium">
                  {editingPolicy ? 'Update' : 'Create'} Policy
                </button>
                <button type="button" onClick={() => { setShowModal(false); setEditingPolicy(null); }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-all font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
