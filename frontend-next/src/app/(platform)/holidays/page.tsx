'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2 } from 'lucide-react';

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [stats, setStats] = useState({ total: 0, mandatory: 0, optional: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);

  useEffect(() => {
    fetchHolidays();
    fetchStats();
  }, []);

  const fetchHolidays = async () => {
    const res = await fetch('http://localhost:4200/api/v1/holidays');
    const data = await res.json();
    setHolidays(data);
  };

  const fetchStats = async () => {
    const res = await fetch('http://localhost:4200/api/v1/holidays/stats');
    const data = await res.json();
    setStats(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    data.isOptional = data.isOptional === 'on';

    const url = editingHoliday
      ? `http://localhost:4200/api/v1/holidays/${editingHoliday.id}`
      : 'http://localhost:4200/api/v1/holidays';

    await fetch(url, {
      method: editingHoliday ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    setShowModal(false);
    setEditingHoliday(null);
    fetchHolidays();
    fetchStats();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this holiday?')) {
      await fetch(`http://localhost:4200/api/v1/holidays/${id}`, { method: 'DELETE' });
      fetchHolidays();
      fetchStats();
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Holidays</h1>
          <p className="text-gray-600 mt-1">Manage company holidays</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingHoliday(null); }}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          Add Holiday
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-cyan-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Holidays</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <Calendar className="text-cyan-500" size={40} />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-green-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Mandatory</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.mandatory}</p>
            </div>
            <Calendar className="text-green-500" size={40} />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-orange-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Optional</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.optional}</p>
            </div>
            <Calendar className="text-orange-500" size={40} />
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Optional</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {holidays.map((holiday) => (
              <tr key={holiday.id} className="hover:bg-cyan-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{holiday.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(holiday.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{holiday.type}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    holiday.isOptional ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {holiday.isOptional ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    holiday.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {holiday.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingHoliday(holiday); setShowModal(true); }} className="text-blue-600 hover:text-blue-800">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(holiday.id)} className="text-red-600 hover:text-red-800">
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">{editingHoliday ? 'Edit Holiday' : 'Add Holiday'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input name="name" defaultValue={editingHoliday?.name} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input name="date" type="date" defaultValue={editingHoliday?.date} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                    <select name="type" defaultValue={editingHoliday?.type} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                      <option value="">Select Type</option>
                      <option value="national">National</option>
                      <option value="regional">Regional</option>
                      <option value="company">Company</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea name="description" defaultValue={editingHoliday?.description} rows="2" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select name="status" defaultValue={editingHoliday?.status || 'active'} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input name="isOptional" type="checkbox" defaultChecked={editingHoliday?.isOptional} className="w-4 h-4 text-cyan-500 rounded focus:ring-2 focus:ring-cyan-500" />
                  <label className="text-sm font-medium text-gray-700">Optional Holiday</label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg hover:shadow-lg transition-all font-medium">
                  {editingHoliday ? 'Update' : 'Create'} Holiday
                </button>
                <button type="button" onClick={() => { setShowModal(false); setEditingHoliday(null); }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-all font-medium">
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
