'use client';
import { useState, useEffect } from 'react';
import { Gift, Award, Plane, DollarSign, CheckCircle } from 'lucide-react';

export default function RewardsPage() {
  const [rewards, setRewards] = useState([]);
  const [showCalc, setShowCalc] = useState(false);

  useEffect(() => {
    fetch('http://localhost:4200/api/v1/performance-rewards/pending?companyId=comp123')
      .then(r => r.json())
      .then(d => setRewards(Array.isArray(d) ? d : []));
  }, []);

  const calculateReward = async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.target));
    const res = await fetch('http://localhost:4200/api/v1/performance-rewards/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const reward = await res.json();
    alert(`Reward: ${reward.rewardTitle} - ₹${reward.monetaryValue}`);
    setShowCalc(false);
  };

  const approveReward = async (id) => {
    await fetch(`http://localhost:4200/api/v1/performance-rewards/${id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy: 'admin123' }),
    });
    alert('Reward approved!');
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Performance Rewards</h1>
        <button onClick={() => setShowCalc(true)} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg">Calculate Reward</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Plane, label: 'Tour', color: 'purple', desc: 'Score 90+, 50+ tasks' },
          { icon: DollarSign, label: 'Bonus', color: 'green', desc: 'Score 80+, 30+ tasks' },
          { icon: Gift, label: 'Gift', color: 'blue', desc: 'Score 70+, 20+ tasks' },
          { icon: Award, label: 'Certificate', color: 'yellow', desc: 'Good performance' },
        ].map(({ icon: Icon, label, color, desc }) => (
          <div key={label} className={`p-6 bg-gradient-to-br from-${color}-50 to-${color}-100 border-2 border-${color}-200 rounded-xl`}>
            <Icon className={`w-12 h-12 text-${color}-600 mb-3`} />
            <h3 className="font-semibold text-gray-800">{label}</h3>
            <p className="text-sm text-gray-600 mt-1">{desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b"><h2 className="text-xl font-bold">Pending Approvals</h2></div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>{['Employee', 'Reward', 'Score', 'Tasks', 'Value', 'Action'].map(h => <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {rewards.length > 0 ? rewards.map(r => (
              <tr key={r.id}>
                <td className="px-6 py-4">{r.employeeId}</td>
                <td className="px-6 py-4">{r.rewardTitle}</td>
                <td className="px-6 py-4">{r.performanceScore}</td>
                <td className="px-6 py-4">{r.tasksCompleted}</td>
                <td className="px-6 py-4">₹{r.monetaryValue?.toLocaleString()}</td>
                <td className="px-6 py-4"><button onClick={() => approveReward(r.id)} className="flex items-center gap-1 text-green-600 hover:text-green-700"><CheckCircle size={16} />Approve</button></td>
              </tr>
            )) : <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No pending rewards</td></tr>}
          </tbody>
        </table>
      </div>

      {showCalc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">Calculate Reward</h2></div>
            <form onSubmit={calculateReward} className="p-6 space-y-4">
              <input name="employeeId" placeholder="Employee ID *" required className="w-full px-4 py-2 border rounded-lg" />
              <input name="performanceScore" type="number" placeholder="Performance Score (0-100) *" required min="0" max="100" className="w-full px-4 py-2 border rounded-lg" />
              <input name="tasksCompleted" type="number" placeholder="Tasks Completed *" required min="0" className="w-full px-4 py-2 border rounded-lg" />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">Calculate</button>
                <button type="button" onClick={() => setShowCalc(false)} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
