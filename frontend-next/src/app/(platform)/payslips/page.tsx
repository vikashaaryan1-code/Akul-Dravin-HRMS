'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Download, Calendar } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employeeId: '', month: '', year: '', basicSalary: '', allowances: '', bonus: '', otherDeductions: '', workingDays: '', presentDays: '', leaveDays: '' });

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    const res = await fetch(`${API_BASE}/payroll`);
    const data = await res.json();
    setPayslips(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_BASE}/payroll/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    setForm({ employeeId: '', month: '', year: '', basicSalary: '', allowances: '', bonus: '', otherDeductions: '', workingDays: '', presentDays: '', leaveDays: '' });
    fetchPayslips();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ink">Payslips</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-aqua text-white rounded-lg">Generate Payslip</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Total Payslips</p>
              <p className="text-3xl font-bold text-ink">{payslips.length}</p>
            </div>
            <Calendar className="w-12 h-12 text-aqua/20" />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">This Month</p>
              <p className="text-3xl font-bold text-ink">{payslips.filter((p: any) => p.month === new Date().toLocaleString('default', { month: 'long' })).length}</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-600/20" />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Total Payout</p>
              <p className="text-3xl font-bold text-ink">₹{payslips.reduce((sum: number, p: any) => sum + parseFloat(p.netSalary || 0), 0).toLocaleString()}</p>
            </div>
            <DollarSign className="w-12 h-12 text-ember/20" />
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-ink/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Gross</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Deductions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Net Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {payslips.map((slip: any) => (
              <tr key={slip.id}>
                <td className="px-6 py-4 text-sm text-ink">{slip.employee?.name || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-ink">{slip.month} {slip.year}</td>
                <td className="px-6 py-4 text-sm text-ink">₹{parseFloat(slip.grossSalary).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-ink">₹{parseFloat(slip.totalDeductions).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm font-semibold text-green-600">₹{parseFloat(slip.netSalary).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${slip.status === 'generated' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {slip.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-aqua flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-ink mb-4">Generate Payslip</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Employee ID</label>
                  <input type="text" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Month</label>
                  <select value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                    <option value="">Select</option>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Year</label>
                  <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Basic Salary</label>
                  <input type="number" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Allowances</label>
                  <input type="number" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Bonus</label>
                  <input type="number" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Other Deductions</label>
                  <input type="number" value={form.otherDeductions} onChange={(e) => setForm({ ...form, otherDeductions: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Working Days</label>
                  <input type="number" value={form.workingDays} onChange={(e) => setForm({ ...form, workingDays: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Present Days</label>
                  <input type="number" value={form.presentDays} onChange={(e) => setForm({ ...form, presentDays: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Leave Days</label>
                  <input type="number" value={form.leaveDays} onChange={(e) => setForm({ ...form, leaveDays: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-aqua text-white rounded-lg">Generate</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-ink/10 text-ink rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
