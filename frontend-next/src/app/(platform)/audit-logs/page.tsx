'use client';

import { useState, useEffect } from 'react';
import { Shield, Activity, User } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const res = await fetch(`${API_BASE}/audit-logs`);
    const data = await res.json();
    setLogs(data);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-aqua" />
        <div>
          <h1 className="text-3xl font-bold text-ink">Audit Logs</h1>
          <p className="text-sm text-ink/60">System activity and security monitoring</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Total Events</p>
              <p className="text-3xl font-bold text-ink">{logs.length}</p>
            </div>
            <Activity className="w-12 h-12 text-aqua/20" />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Today</p>
              <p className="text-3xl font-bold text-ink">{logs.filter((l: any) => new Date(l.createdAt).toDateString() === new Date().toDateString()).length}</p>
            </div>
            <Shield className="w-12 h-12 text-green-600/20" />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Active Users</p>
              <p className="text-3xl font-bold text-ink">{new Set(logs.map((l: any) => l.userId)).size}</p>
            </div>
            <User className="w-12 h-12 text-purple-600/20" />
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-ink/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Entity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {logs.map((log: any) => (
              <tr key={log.id}>
                <td className="px-6 py-4 text-sm text-ink">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-ink">{log.userId}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    log.action.includes('create') ? 'bg-green-100 text-green-800' :
                    log.action.includes('update') ? 'bg-blue-100 text-blue-800' :
                    log.action.includes('delete') ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-ink">{log.entity}</td>
                <td className="px-6 py-4 text-sm text-ink/60">{log.ipAddress || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
