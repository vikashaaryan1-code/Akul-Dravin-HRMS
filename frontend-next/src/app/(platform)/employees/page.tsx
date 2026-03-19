'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Search, UserCheck, UserX, UserCog, Download, Upload } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, onLeave: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEmployees();
    fetchStats();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('http://localhost:4200/api/v1/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:4200/api/v1/employees/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ total: 0, active: 0, inactive: 0, onLeave: 0 });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    console.log('Submitting employee data:', data);

    try {
      const url = editingEmployee
        ? `http://localhost:4200/api/v1/employees/${editingEmployee.id}`
        : 'http://localhost:4200/api/v1/employees';

      const response = await fetch(url, {
        method: editingEmployee ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('API Error:', error);
        alert('Failed to save employee: ' + error);
        return;
      }

      const result = await response.json();
      console.log('Employee saved:', result);
      alert('Employee saved successfully!');

      setShowModal(false);
      setEditingEmployee(null);
      e.target.reset();
      await fetchEmployees();
      await fetchStats();
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this employee?')) {
      await fetch(`http://localhost:4200/api/v1/employees/${id}`, { method: 'DELETE' });
      fetchEmployees();
      fetchStats();
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Employee ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Date of Birth', 'Gender', 'Joining Date', 'Salary', 'Status', 'Address', 'Company ID'].join(','),
      ...employees.map(emp => [
        emp.employeeId,
        emp.firstName,
        emp.lastName,
        emp.email,
        emp.phone || '',
        emp.dateOfBirth || '',
        emp.gender || '',
        emp.joiningDate,
        emp.salary,
        emp.status,
        `"${(emp.address || '').replace(/"/g, '""')}"`,
        emp.companyId || '00000000-0000-0000-0000-000000000000'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');
        
        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          const employee = {
            employeeId: values[0]?.trim(),
            firstName: values[1]?.trim(),
            lastName: values[2]?.trim(),
            email: values[3]?.trim(),
            phone: values[4]?.trim(),
            dateOfBirth: values[5]?.trim(),
            gender: values[6]?.trim(),
            joiningDate: values[7]?.trim(),
            salary: values[8]?.trim(),
            status: values[9]?.trim() || 'active',
            address: values[10]?.trim().replace(/^"|"$/g, '').replace(/""/g, '"'),
            companyId: values[11]?.trim() || '00000000-0000-0000-0000-000000000000'
          };

          try {
            const response = await fetch('http://localhost:4200/api/v1/employees', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(employee),
            });

            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }
        }

        alert(`Import completed!\nSuccess: ${successCount}\nFailed: ${errorCount}`);
        fetchEmployees();
        fetchStats();
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import employees. Please check the file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredEmployees = employees.filter(emp =>
    `${emp.firstName} ${emp.lastName} ${emp.email} ${emp.employeeId}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Employee Management</h1>
          <p className="text-gray-600 mt-1">Manage your workforce</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
          >
            <Download size={20} />
            Export
          </button>
          <label className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all cursor-pointer">
            <Upload size={20} />
            Import
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={() => { setShowModal(true); setEditingEmployee(null); }}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Add Employee
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-cyan-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Employees</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <Users className="text-cyan-500" size={40} />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-green-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <UserCheck className="text-green-500" size={40} />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-red-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Inactive</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.inactive}</p>
            </div>
            <UserX className="text-red-500" size={40} />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-orange-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">On Leave</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.onLeave}</p>
            </div>
            <UserCog className="text-orange-500" size={40} />
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm mb-6 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">ID</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">Email</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">Phone</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">Joining</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEmployees.map((emp) => (
              <tr key={emp.id} className="hover:bg-cyan-50/50 transition-colors">
                <td className="px-2 py-2 text-xs text-gray-800">{emp.employeeId}</td>
                <td className="px-2 py-2 text-xs font-medium text-gray-800 whitespace-nowrap">{emp.firstName} {emp.lastName}</td>
                <td className="px-2 py-2 text-xs text-gray-600">{emp.email}</td>
                <td className="px-2 py-2 text-xs text-gray-600">{emp.phone || 'N/A'}</td>
                <td className="px-2 py-2 text-xs text-gray-600 whitespace-nowrap">{new Date(emp.joiningDate).toLocaleDateString()}</td>
                <td className="px-2 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    emp.status === 'active' ? 'bg-green-100 text-green-700' :
                    emp.status === 'inactive' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingEmployee(emp); setShowModal(true); }} className="text-blue-600 hover:text-blue-800">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:text-red-800">
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                  <input name="employeeId" defaultValue={editingEmployee?.employeeId} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <input name="companyId" type="hidden" defaultValue={editingEmployee?.companyId || '00000000-0000-0000-0000-000000000000'} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input name="firstName" defaultValue={editingEmployee?.firstName} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input name="lastName" defaultValue={editingEmployee?.lastName} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input name="email" type="email" defaultValue={editingEmployee?.email} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input name="phone" defaultValue={editingEmployee?.phone} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input name="dateOfBirth" type="date" defaultValue={editingEmployee?.dateOfBirth} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select name="gender" defaultValue={editingEmployee?.gender} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date *</label>
                  <input name="joiningDate" type="date" defaultValue={editingEmployee?.joiningDate} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                  <input name="salary" type="number" step="0.01" defaultValue={editingEmployee?.salary} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select name="status" defaultValue={editingEmployee?.status || 'active'} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea name="address" defaultValue={editingEmployee?.address} rows="2" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"></textarea>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg hover:shadow-lg transition-all font-medium">
                  {editingEmployee ? 'Update' : 'Create'} Employee
                </button>
                <button type="button" onClick={() => { setShowModal(false); setEditingEmployee(null); }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-all font-medium">
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
