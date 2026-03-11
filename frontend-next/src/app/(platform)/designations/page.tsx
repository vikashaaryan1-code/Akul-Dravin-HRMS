'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Award, TrendingUp, DollarSign } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusPill } from '@/components/ui/StatusPill';

type Designation = {
  id: string;
  name: string;
  code: string;
  description?: string;
  companyId: string;
  departmentId?: string;
  level: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  status: string;
  isActive: boolean;
};

const LEVELS = [
  'C-Suite',
  'VP/Director',
  'Senior Manager',
  'Manager',
  'Lead/Senior',
  'Associate/Executive',
  'Intern/Trainee',
];

export default function DesignationsPage() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    companyId: '',
    departmentId: '',
    level: 'Manager',
    salaryMin: 0,
    salaryMax: 0,
    currency: 'INR',
    status: 'active',
  });

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    try {
      const response = await fetch('http://localhost:4200/api/v1/designations');
      const data = await response.json();
      setDesignations(data);
    } catch (error) {
      console.error('Error fetching designations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `http://localhost:4200/api/v1/designations/${editingId}`
        : 'http://localhost:4200/api/v1/designations';
      
      const method = editingId ? 'PATCH' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      fetchDesignations();
      resetForm();
    } catch (error) {
      console.error('Error saving designation:', error);
    }
  };

  const handleEdit = (designation: Designation) => {
    setEditingId(designation.id);
    setFormData({
      name: designation.name,
      code: designation.code,
      description: designation.description || '',
      companyId: designation.companyId,
      departmentId: designation.departmentId || '',
      level: designation.level,
      salaryMin: designation.salaryMin || 0,
      salaryMax: designation.salaryMax || 0,
      currency: designation.currency,
      status: designation.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this designation?')) return;
    
    try {
      await fetch(`http://localhost:4200/api/v1/designations/${id}`, {
        method: 'DELETE',
      });
      fetchDesignations();
    } catch (error) {
      console.error('Error deleting designation:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      companyId: '',
      departmentId: '',
      level: 'Manager',
      salaryMin: 0,
      salaryMax: 0,
      currency: 'INR',
      status: 'active',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'C-Suite': 'bg-purple-100 text-purple-700',
      'VP/Director': 'bg-blue-100 text-blue-700',
      'Senior Manager': 'bg-cyan-100 text-cyan-700',
      'Manager': 'bg-green-100 text-green-700',
      'Lead/Senior': 'bg-yellow-100 text-yellow-700',
      'Associate/Executive': 'bg-orange-100 text-orange-700',
      'Intern/Trainee': 'bg-gray-100 text-gray-700',
    };
    return colors[level] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-slate-600">Loading designations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageTitle>Designation Management</PageTitle>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-ink to-aqua px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={16} />
          Add Designation
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-aqua/10 p-3">
              <Award className="text-aqua" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Designations</p>
              <p className="text-2xl font-bold text-ink">{designations.length}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ember/10 p-3">
              <TrendingUp className="text-ember" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Hierarchy Levels</p>
              <p className="text-2xl font-bold text-ink">{LEVELS.length}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber/10 p-3">
              <DollarSign className="text-amber" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg Salary Range</p>
              <p className="text-2xl font-bold text-ink">
                ₹{Math.round(designations.reduce((sum, d) => sum + ((d.salaryMin || 0) + (d.salaryMax || 0)) / 2, 0) / designations.length / 100000) || 0}L
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <GlassCard className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <h2 className="mb-4 text-xl font-bold text-ink">
              {editingId ? 'Edit Designation' : 'Add New Designation'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Designation Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-aqua"
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-aqua"
                    placeholder="e.g., SE"
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
                  rows={2}
                  placeholder="Role description..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Level *
                  </label>
                  <select
                    required
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-aqua"
                  >
                    {LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
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

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Min Salary (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => setFormData({ ...formData, salaryMin: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-aqua"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Max Salary (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => setFormData({ ...formData, salaryMax: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-aqua"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-aqua"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-gradient-to-r from-ink to-aqua px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {editingId ? 'Update' : 'Create'} Designation
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

      {/* Designations Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Designation</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Level</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Salary Range</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {designations.map((designation) => (
                <tr key={designation.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-ink">{designation.name}</p>
                      {designation.description && (
                        <p className="text-xs text-slate-500">{designation.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{designation.code}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getLevelColor(designation.level)}`}>
                      {designation.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {designation.salaryMin && designation.salaryMax ? (
                      <>₹{(designation.salaryMin / 100000).toFixed(1)}L - ₹{(designation.salaryMax / 100000).toFixed(1)}L</>
                    ) : (
                      'Not set'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={designation.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(designation)}
                        className="rounded-lg p-2 text-aqua transition hover:bg-aqua/10"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(designation.id)}
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

          {designations.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              No designations found. Click "Add Designation" to create one.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
