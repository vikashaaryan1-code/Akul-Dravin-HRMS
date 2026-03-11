'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusPill } from '@/components/ui/StatusPill';

type LeaveType = {
  id: string;
  name: string;
  code: string;
  description?: string;
  daysPerYear: number;
  carryForward: boolean;
  maxCarryForward?: number;
  encashmentAllowed: boolean;
  requiresApproval: boolean;
  isPaid: boolean;
  status: string;
};

const DEFAULT_LEAVE_TYPES = [
  { name: 'Casual Leave', code: 'CL', daysPerYear: 12, carryForward: false, encashmentAllowed: false, isPaid: true },
  { name: 'Sick Leave', code: 'SL', daysPerYear: 12, carryForward: true, maxCarryForward: 30, encashmentAllowed: false, isPaid: true },
  { name: 'Earned Leave', code: 'EL', daysPerYear: 15, carryForward: true, maxCarryForward: 45, encashmentAllowed: true, isPaid: true },
  { name: 'Maternity Leave', code: 'ML', daysPerYear: 182, carryForward: false, encashmentAllowed: false, isPaid: true },
  { name: 'Paternity Leave', code: 'PL', daysPerYear: 15, carryForward: false, encashmentAllowed: false, isPaid: true },
  { name: 'Compensatory Off', code: 'CO', daysPerYear: 0, carryForward: false, encashmentAllowed: false, isPaid: true },
  { name: 'Loss of Pay', code: 'LOP', daysPerYear: 0, carryForward: false, encashmentAllowed: false, isPaid: false },
  { name: 'Bereavement Leave', code: 'BL', daysPerYear: 5, carryForward: false, encashmentAllowed: false, isPaid: true },
];

export default function LeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    companyId: '',
    daysPerYear: 0,
    carryForward: false,
    maxCarryForward: 0,
    encashmentAllowed: false,
    requiresApproval: true,
    isPaid: true,
    status: 'active',
  });

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      const response = await fetch('http://localhost:4200/api/v1/leave/types');
      const data = await response.json();
      setLeaveTypes(data);
    } catch (error) {
      console.error('Error fetching leave types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `http://localhost:4200/api/v1/leave/types/${editingId}`
        : 'http://localhost:4200/api/v1/leave/types';
      
      const method = editingId ? 'PATCH' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      fetchLeaveTypes();
      resetForm();
    } catch (error) {
      console.error('Error saving leave type:', error);
    }
  };

  const handleEdit = (leaveType: LeaveType) => {
    setEditingId(leaveType.id);
    setFormData({
      name: leaveType.name,
      code: leaveType.code,
      description: leaveType.description || '',
      companyId: '',
      daysPerYear: leaveType.daysPerYear,
      carryForward: leaveType.carryForward,
      maxCarryForward: leaveType.maxCarryForward || 0,
      encashmentAllowed: leaveType.encashmentAllowed,
      requiresApproval: leaveType.requiresApproval,
      isPaid: leaveType.isPaid,
      status: leaveType.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this leave type?')) return;
    
    try {
      await fetch(`http://localhost:4200/api/v1/leave/types/${id}`, {
        method: 'DELETE',
      });
      fetchLeaveTypes();
    } catch (error) {
      console.error('Error deleting leave type:', error);
    }
  };

  const loadDefaultTypes = () => {
    if (confirm('Load 8 default leave types from PRD?')) {
      DEFAULT_LEAVE_TYPES.forEach(async (type) => {
        await fetch('http://localhost:4200/api/v1/leave/types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...type, companyId: '', requiresApproval: true, status: 'active' }),
        });
      });
      setTimeout(fetchLeaveTypes, 1000);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      companyId: '',
      daysPerYear: 0,
      carryForward: false,
      maxCarryForward: 0,
      encashmentAllowed: false,
      requiresApproval: true,
      isPaid: true,
      status: 'active',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-slate-600">Loading leave types...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageTitle>Leave Type Configuration</PageTitle>
        <div className="flex gap-2">
          {leaveTypes.length === 0 && (
            <button
              onClick={loadDefaultTypes}
              className="inline-flex items-center gap-2 rounded-xl border border-aqua bg-aqua/10 px-4 py-2 text-sm font-semibold text-aqua transition hover:bg-aqua/20"
            >
              Load Default Types
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-ink to-aqua px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus size={16} />
            Add Leave Type
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-aqua/10 p-3">
              <Calendar className="text-aqua" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Types</p>
              <p className="text-2xl font-bold text-ink">{leaveTypes.length}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-100 p-3">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Paid Leaves</p>
              <p className="text-2xl font-bold text-ink">
                {leaveTypes.filter(l => l.isPaid).length}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber/10 p-3">
              <Calendar className="text-amber" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Days/Year</p>
              <p className="text-2xl font-bold text-ink">
                {leaveTypes.reduce((sum, l) => sum + l.daysPerYear, 0)}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ember/10 p-3">
              <XCircle className="text-ember" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Encashable</p>
              <p className="text-2xl font-bold text-ink">
                {leaveTypes.filter(l => l.encashmentAllowed).length}
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
              {editingId ? 'Edit Leave Type' : 'Add New Leave Type'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Leave Type Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-aqua"
                    placeholder="e.g., Casual Leave"
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
                    placeholder="e.g., CL"
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
                  placeholder="Leave type description..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Days Per Year *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.daysPerYear}
                    onChange={(e) => setFormData({ ...formData, daysPerYear: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-aqua"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Max Carry Forward
                  </label>
                  <input
                    type="number"
                    value={formData.maxCarryForward}
                    onChange={(e) => setFormData({ ...formData, maxCarryForward: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-aqua"
                    disabled={!formData.carryForward}
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

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.carryForward}
                    onChange={(e) => setFormData({ ...formData, carryForward: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-aqua focus:ring-aqua"
                  />
                  <span className="text-sm text-slate-700">Carry Forward Allowed</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.encashmentAllowed}
                    onChange={(e) => setFormData({ ...formData, encashmentAllowed: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-aqua focus:ring-aqua"
                  />
                  <span className="text-sm text-slate-700">Encashment Allowed</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.requiresApproval}
                    onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-aqua focus:ring-aqua"
                  />
                  <span className="text-sm text-slate-700">Requires Approval</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPaid}
                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-aqua focus:ring-aqua"
                  />
                  <span className="text-sm text-slate-700">Paid Leave</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-gradient-to-r from-ink to-aqua px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {editingId ? 'Update' : 'Create'} Leave Type
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

      {/* Leave Types Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Leave Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Code</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Days/Year</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Carry Forward</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Encashment</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Paid</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveTypes.map((leaveType) => (
                <tr key={leaveType.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-ink">{leaveType.name}</p>
                      {leaveType.description && (
                        <p className="text-xs text-slate-500">{leaveType.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-600">{leaveType.code}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600">{leaveType.daysPerYear}</td>
                  <td className="px-4 py-3 text-center">
                    {leaveType.carryForward ? (
                      <span className="text-green-600">✓ {leaveType.maxCarryForward ? `(Max ${leaveType.maxCarryForward})` : ''}</span>
                    ) : (
                      <span className="text-slate-400">✗</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {leaveType.encashmentAllowed ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-slate-400">✗</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {leaveType.isPaid ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-ember">✗</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={leaveType.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(leaveType)}
                        className="rounded-lg p-2 text-aqua transition hover:bg-aqua/10"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(leaveType.id)}
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

          {leaveTypes.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              No leave types configured. Click "Load Default Types" or "Add Leave Type" to get started.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
