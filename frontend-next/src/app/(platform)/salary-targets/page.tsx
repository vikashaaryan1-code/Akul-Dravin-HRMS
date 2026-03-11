'use client';
import { useState } from 'react';
import { Target, DollarSign, TrendingUp, Plus } from 'lucide-react';

export default function SalaryTargetsPage() {
  const [targets, setTargets] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.target));
    setTargets([...targets, { ...formData, id: Date.now(), achievedAmount: 0, earnedIncentive: 0, isActive: true }]);
    setShowAdd(false);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Target-Based Salary</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Add Target</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl">
          <DollarSign className="w-12 h-12 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-800">Fixed Salary</h3>
          <p className="text-sm text-gray-600 mt-1">Base compensation</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl">
          <Target className="w-12 h-12 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-800">Target Amount</h3>
          <p className="text-sm text-gray-600 mt-1">Sales/performance goal</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl">
          <TrendingUp className="w-12 h-12 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-800">Incentive %</h3>
          <p className="text-sm text-gray-600 mt-1">Bonus on achievement</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b"><h2 className="text-xl font-bold">Employee Targets</h2></div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>{['Employee ID', 'Fixed Salary', 'Target', 'Incentive %', 'Period', 'Achieved', 'Earned', 'Status'].map(h => <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {targets.length > 0 ? targets.map(t => (
              <tr key={t.id}>
                <td className="px-6 py-4 font-medium">{t.employeeId}</td>
                <td className="px-6 py-4">₹{parseFloat(t.fixedSalary).toLocaleString()}</td>
                <td className="px-6 py-4">₹{parseFloat(t.targetAmount).toLocaleString()}</td>
                <td className="px-6 py-4">{t.incentivePercentage}%</td>
                <td className="px-6 py-4 capitalize">{t.targetPeriod}</td>
                <td className="px-6 py-4">₹{parseFloat(t.achievedAmount).toLocaleString()}</td>
                <td className="px-6 py-4">₹{parseFloat(t.earnedIncentive).toLocaleString()}</td>
                <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span></td>
              </tr>
            )) : <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500">No targets configured</td></tr>}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">Configure Target-Based Salary</h2></div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <input name="employeeId" placeholder="Employee ID *" required className="w-full px-4 py-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <input name="fixedSalary" type="number" placeholder="Fixed Salary *" required min="0" className="px-4 py-2 border rounded-lg" />
                <input name="targetAmount" type="number" placeholder="Target Amount *" required min="0" className="px-4 py-2 border rounded-lg" />
                <input name="incentivePercentage" type="number" placeholder="Incentive % *" required min="0" max="100" step="0.1" className="px-4 py-2 border rounded-lg" />
                <select name="targetPeriod" required className="px-4 py-2 border rounded-lg">
                  <option value="">Select Period *</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <input name="periodStartDate" type="date" required className="px-4 py-2 border rounded-lg" />
                <input name="periodEndDate" type="date" required className="px-4 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">Create Target</button>
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
