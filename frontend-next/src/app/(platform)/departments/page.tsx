'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2, Users, DollarSign } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusPill } from '@/components/ui/StatusPill';

type Department = {
  id: string;
  name: string;
  code: string;
  description?: string;
  companyId: string;
  headEmployeeId?: string;
  teamSize: number;
  budgetAllocated?: number;
  status: string;
  isActive: boolean;
  createdAt: string;
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    companyId: '',
    teamSize: 0,
    budgetAllocated: 0,
    status: 'active',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:4200/api/v1/departments');
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `http://localhost:4200/api/v1/departments/${editingId}`
        : 'http://localhost:4200/api/v1/departments';
      
      const method = editingId ? 'PATCH' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      fetchDepartments();
      resetForm();
    } catch (error) {
      console.error('Error saving department:', error);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingId(dept.id);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      companyId: dept.companyId,
      teamSize: dept.teamSize,
      budgetAllocated: dept.budgetAllocated || 0,
      status: dept.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    try {
      await fetch(`http://localhost:4200/api/v1/departments/${id}`, {
        method: 'DELETE',
      });
      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      companyId: '',
      teamSize: 0,
      budgetAllocated: 0,
      status: 'active',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-slate-600">Loading departments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageTitle>Department Management</PageTitle>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-ink to-aqua px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={16} />
          Add Department
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-aqua/10 p-3">
              <Building2 className="text-aqua" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Departments</p>
              <p className="text-2xl font-bold text-ink">{departments.length}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ember/10 p-3">
              <Users className="text-ember" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Employees</p>
              <p className="text-2xl font-bold text-ink">
                {departments.reduce((sum, d) => sum + d.teamSize, 0)}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber/10 p-3">
              <DollarSign className="text-amber" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Budget</p>
              <p className="text-2xl font-bold text-ink">
                ₹{departments.reduce((sum, d) => sum + (d.budgetAllocated || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <GlassCard className="w-full max-w-2xl">
            <h2 className="mb-4 text-xl font-bold text-ink">
              {editingId ? 'Edit Department' : 'Add New Department'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-aqua"
                    placeholder="e.g., Human Resources"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Department Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-aqua"
                    placeholder="e.g., HR"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-aqua"
                  rows={3}
                  placeholder="Department description..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Team Size
                  </label>
                  <input
                    type="number"
                    value={formData.teamSize}
                    onChange={(e) => setFormData({ ...formData, teamSize: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-aqua"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.budgetAllocated}
                    onChange={(e) => setFormData({ ...formData, budgetAllocated: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-aqua"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-aqua"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-gradient-to-r from-ink to-aqua px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {editingId ? 'Update' : 'Create'} Department
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Departments Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Department</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Team Size</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Budget</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-ink">{dept.name}</p>
                      {dept.description && (
                        <p className="text-xs text-slate-500">{dept.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{dept.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{dept.teamSize}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    ₹{(dept.budgetAllocated || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={dept.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(dept)}
                        className="rounded-lg p-2 text-aqua transition hover:bg-aqua/10"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id)}
                        className="rounded-lg p-2 text-ember transition hover:bg-ember/10"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {departments.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              No departments found. Click "Add Department" to create one.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
