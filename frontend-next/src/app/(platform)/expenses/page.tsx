'use client';
import { useState, useEffect } from 'react';
import { DollarSign, Receipt, CheckCircle } from 'lucide-react';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';
const categories = ['Travel', 'Food', 'Accommodation', 'Office Supplies', 'Training', 'Other'];
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Travel', amount: '', expenseDate: '', description: '' });
  useEffect(() => { fetchExpenses(); }, []);
  const fetchExpenses = async () => {
    const res = await fetch(`${API_BASE}/expenses`);
    const data = await res.json();
    setExpenses(data);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, employeeId: 'current-user-id' }),
    });
    setShowModal(false);
    setForm({ title: '', category: 'Travel', amount: '', expenseDate: '', description: '' });
    fetchExpenses();
  };
  const handleApprove = async (id) => {
    await fetch(`${API_BASE}/expenses/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approverId: 'current-user-id' }),
    });
    fetchExpenses();
  };
  const stats = {
    total: expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    pending: expenses.filter((e) => e.status === 'pending').length,
    approved: expenses.filter((e) => e.status === 'approved').length,
  };
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ink">Expenses</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-aqua text-white rounded-lg">Submit Expense</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-ink/60">Total</p><p className="text-3xl font-bold text-ink">₹{stats.total.toLocaleString()}</p></div>
            <DollarSign className="w-12 h-12 text-aqua/20" />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-ink/60">Pending</p><p className="text-3xl font-bold text-amber-600">{stats.pending}</p></div>
            <Receipt className="w-12 h-12 text-amber-600/20" />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-ink/60">Approved</p><p className="text-3xl font-bold text-green-600">{stats.approved}</p></div>
            <CheckCircle className="w-12 h-12 text-green-600/20" />
          </div>
        </div>
      </div>
      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-ink/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="px-6 py-4 text-sm text-ink">{expense.title}</td>
                <td className="px-6 py-4 text-sm text-ink">{expense.category}</td>
                <td className="px-6 py-4 text-sm font-semibold text-ink">₹{parseFloat(expense.amount).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-ink">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${expense.status === 'approved' ? 'bg-green-100 text-green-800' : expense.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                    {expense.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {expense.status === 'pending' && <button onClick={() => handleApprove(expense.id)} className="text-green-600">Approve</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-ink mb-4">Submit Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-ink mb-1">Title</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Amount</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Date</label><input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
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
