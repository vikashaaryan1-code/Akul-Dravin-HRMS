'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';

export default function SalaryStructuresPage() {
  const [structures, setStructures] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);

  useEffect(() => {
    fetchStructures();
  }, []);

  const fetchStructures = async () => {
    const res = await fetch('http://localhost:4200/api/v1/salary-structures');
    const data = await res.json();
    setStructures(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const basicSalary = parseFloat(data.basicSalary) || 0;
    const hra = parseFloat(data.hra) || 0;
    const conveyance = parseFloat(data.conveyance) || 0;
    const medicalAllowance = parseFloat(data.medicalAllowance) || 0;
    const specialAllowance = parseFloat(data.specialAllowance) || 0;
    const otherAllowances = parseFloat(data.otherAllowances) || 0;
    const pfDeduction = parseFloat(data.pfDeduction) || 0;
    const esiDeduction = parseFloat(data.esiDeduction) || 0;
    const tdsDeduction = parseFloat(data.tdsDeduction) || 0;
    const otherDeductions = parseFloat(data.otherDeductions) || 0;

    const grossSalary = basicSalary + hra + conveyance + medicalAllowance + specialAllowance + otherAllowances;
    const netSalary = grossSalary - pfDeduction - esiDeduction - tdsDeduction - otherDeductions;

    const payload = { ...data, grossSalary, netSalary };

    const url = editingStructure
      ? `http://localhost:4200/api/v1/salary-structures/${editingStructure.id}`
      : 'http://localhost:4200/api/v1/salary-structures';

    await fetch(url, {
      method: editingStructure ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setShowModal(false);
    setEditingStructure(null);
    fetchStructures();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this salary structure?')) {
      await fetch(`http://localhost:4200/api/v1/salary-structures/${id}`, { method: 'DELETE' });
      fetchStructures();
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Salary Structures</h1>
          <p className="text-gray-600 mt-1">Manage employee compensation</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingStructure(null); }}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          Add Structure
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Employee ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Basic Salary</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Gross Salary</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Net Salary</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Effective From</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {structures.map((structure) => (
              <tr key={structure.id} className="hover:bg-cyan-50/50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-800">{structure.employeeId}</td>
                <td className="px-6 py-4 text-sm text-gray-800">₹{parseFloat(structure.basicSalary).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">₹{parseFloat(structure.grossSalary).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm font-bold text-green-600">₹{parseFloat(structure.netSalary).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(structure.effectiveFrom).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    structure.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {structure.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingStructure(structure); setShowModal(true); }} className="text-blue-600 hover:text-blue-800">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(structure.id)} className="text-red-600 hover:text-red-800">
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">{editingStructure ? 'Edit Salary Structure' : 'Add Salary Structure'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                  <input name="employeeId" defaultValue={editingStructure?.employeeId} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Basic Salary *</label>
                  <input name="basicSalary" type="number" step="0.01" defaultValue={editingStructure?.basicSalary} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">HRA</label>
                  <input name="hra" type="number" step="0.01" defaultValue={editingStructure?.hra || 0} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conveyance</label>
                  <input name="conveyance" type="number" step="0.01" defaultValue={editingStructure?.conveyance || 0} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Medical Allowance</label>
                  <input name="medicalAllowance" type="number" step="0.01" defaultValue={editingStructure?.medicalAllowance || 0} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Allowance</label>
                  <input name="specialAllowance" type="number" step="0.01" defaultValue={editingStructure?.specialAllowance || 0} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Other Allowances</label>
                  <input name="otherAllowances" type="number" step="0.01" defaultValue={editingStructure?.otherAllowances || 0} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PF Deduction</label>
                  <input name="pfDeduction" type="number" step="0.01" defaultValue={editingStructure?.pfDeduction || 0} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ESI Deduction</label>
                  <input name="esiDeduction" type="number" step="0.01" defaultValue={editingStructure?.esiDeduction || 0} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TDS Deduction</label>
                  <input name="tdsDeduction" type="number" step="0.01" defaultValue={editingStructure?.tdsDeduction || 0} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Other Deductions</label>
                  <input name="otherDeductions" type="number" step="0.01" defaultValue={editingStructure?.otherDeductions || 0} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Effective From *</label>
                  <input name="effectiveFrom" type="date" defaultValue={editingStructure?.effectiveFrom} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select name="status" defaultValue={editingStructure?.status || 'active'} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg hover:shadow-lg transition-all font-medium">
                  {editingStructure ? 'Update' : 'Create'} Structure
                </button>
                <button type="button" onClick={() => { setShowModal(false); setEditingStructure(null); }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-all font-medium">
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
