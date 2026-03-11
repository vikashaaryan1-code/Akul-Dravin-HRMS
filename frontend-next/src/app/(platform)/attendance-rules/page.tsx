'use client';
import { useState } from 'react';
import { Plus, Percent, Clock } from 'lucide-react';

export default function AttendanceRulesPage() {
  const [rules, setRules] = useState([
    { id: 1, ruleName: 'Half Day Deduction', deductionType: 'half_day', deductionPercentage: 50, minHoursForHalfDay: 4, isActive: true },
    { id: 2, ruleName: 'Full Day Deduction', deductionType: 'full_day', deductionPercentage: 100, minHoursForFullDay: 8, isActive: true },
  ]);
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.target));
    setRules([...rules, { ...formData, id: Date.now(), isActive: true }]);
    setShowAdd(false);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Attendance Deduction Rules</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Add Rule</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl">
          <Percent className="w-12 h-12 text-red-600 mb-3" />
          <h3 className="font-semibold text-gray-800">Half Day</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">50% Deduction</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl">
          <Percent className="w-12 h-12 text-orange-600 mb-3" />
          <h3 className="font-semibold text-gray-800">Full Day</h3>
          <p className="text-2xl font-bold text-orange-600 mt-2">100% Deduction</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl">
          <Clock className="w-12 h-12 text-yellow-600 mb-3" />
          <h3 className="font-semibold text-gray-800">Late Arrival</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-2">Custom %</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b"><h2 className="text-xl font-bold">Active Rules</h2></div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>{['Rule Name', 'Type', 'Deduction %', 'Min Hours', 'Status'].map(h => <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {rules.map(r => (
              <tr key={r.id}>
                <td className="px-6 py-4 font-medium">{r.ruleName}</td>
                <td className="px-6 py-4">{r.deductionType?.replace('_', ' ')}</td>
                <td className="px-6 py-4">{r.deductionPercentage}%</td>
                <td className="px-6 py-4">{r.minHoursForHalfDay || r.minHoursForFullDay || '-'} hrs</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{r.isActive ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">Add Deduction Rule</h2></div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <input name="ruleName" placeholder="Rule Name *" required className="w-full px-4 py-2 border rounded-lg" />
              <select name="deductionType" required className="w-full px-4 py-2 border rounded-lg">
                <option value="">Select Type *</option>
                <option value="half_day">Half Day</option>
                <option value="full_day">Full Day</option>
                <option value="late_arrival">Late Arrival</option>
                <option value="early_departure">Early Departure</option>
              </select>
              <input name="deductionPercentage" type="number" placeholder="Deduction % *" required min="0" max="100" className="w-full px-4 py-2 border rounded-lg" />
              <input name="minHoursForHalfDay" type="number" placeholder="Min Hours for Half Day" step="0.5" className="w-full px-4 py-2 border rounded-lg" />
              <input name="minHoursForFullDay" type="number" placeholder="Min Hours for Full Day" step="0.5" className="w-full px-4 py-2 border rounded-lg" />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">Create Rule</button>
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
