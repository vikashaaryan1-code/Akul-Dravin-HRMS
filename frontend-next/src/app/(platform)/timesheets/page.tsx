'use client';

import { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState(null);

  useEffect(() => {
    fetchTimesheets();
    fetchStats();
  }, []);

  const fetchTimesheets = async () => {
    const res = await fetch('http://localhost:4200/api/v1/timesheets');
    setTimesheets(await res.json());
  };

  const fetchStats = async () => {
    const res = await fetch('http://localhost:4200/api/v1/timesheets/stats');
    setStats(await res.json());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = editingTimesheet ? `http://localhost:4200/api/v1/timesheets/${editingTimesheet.id}` : 'http://localhost:4200/api/v1/timesheets';
    await fetch(url, { method: editingTimesheet ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(formData)) });
    setShowModal(false);
    setEditingTimesheet(null);
    fetchTimesheets();
    fetchStats();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete?')) {
      await fetch(`http://localhost:4200/api/v1/timesheets/${id}`, { method: 'DELETE' });
      fetchTimesheets();
      fetchStats();
    }
  };

  const handleApprove = async (id) => {
    await fetch(`http://localhost:4200/api/v1/timesheets/${id}/approve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approverId: 'admin' }) });
    fetchTimesheets();
    fetchStats();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Timesheets</h1>
          <p className="text-gray-600 mt-1">Track work hours</p>
        </div>
        <button onClick={() => { setShowModal(true); setEditingTimesheet(null); }} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all">
          <Plus size={20} />
          Add Timesheet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total', value: stats.total, icon: Clock, color: 'cyan' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'orange' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'green' }
        ].map((stat, i) => (
          <div key={i} className={`bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-${stat.color}-100 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className={`text-3xl font-bold text-${stat.color}-600 mt-1`}>{stat.value}</p>
              </div>
              <stat.icon className={`text-${stat.color}-500`} size={40} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <tr>
              {['Employee ID', 'Date', 'Hours', 'Project', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {timesheets.map((ts) => (
              <tr key={ts.id} className="hover:bg-cyan-50/50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-800">{ts.employeeId}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(ts.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{ts.hoursWorked}h</td>
                <td className="px-6 py-4 text-sm text-gray-600">{ts.projectId || 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${ts.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{ts.status}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {ts.status === 'pending' && <button onClick={() => handleApprove(ts.id)} className="text-green-600 hover:text-green-800"><CheckCircle size={18} /></button>}
                    <button onClick={() => { setEditingTimesheet(ts); setShowModal(true); }} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(ts.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
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
              <h2 className="text-2xl font-bold">{editingTimesheet ? 'Edit' : 'Add'} Timesheet</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input name="employeeId" placeholder="Employee ID *" defaultValue={editingTimesheet?.employeeId} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
              <input name="date" type="date" defaultValue={editingTimesheet?.date} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
              <input name="hoursWorked" type="number" step="0.5" placeholder="Hours *" defaultValue={editingTimesheet?.hoursWorked} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
              <input name="projectId" placeholder="Project ID" defaultValue={editingTimesheet?.projectId} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
              <textarea name="description" placeholder="Description" defaultValue={editingTimesheet?.description} rows="2" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"></textarea>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg hover:shadow-lg transition-all font-medium">{editingTimesheet ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setShowModal(false); setEditingTimesheet(null); }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-all font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
