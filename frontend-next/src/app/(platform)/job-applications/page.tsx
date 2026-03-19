'use client';

import { useState, useEffect } from 'react';
import { FileText, Mail, Phone, Calendar, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';

export default function JobApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState<any>({});
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
    fetchJobs();
  }, []);

  const fetchApplications = async () => {
    const res = await fetch(`${API_BASE}/job-applications`);
    const data = await res.json();
    setApplications(data);
  };

  const fetchJobs = async () => {
    const res = await fetch(`${API_BASE}/jobs`);
    const data = await res.json();
    const jobMap = data.reduce((acc: any, job: any) => {
      acc[job.id] = job;
      return acc;
    }, {});
    setJobs(jobMap);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`${API_BASE}/job-applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchApplications();
  };

  const filteredApplications = applications.filter((app: any) => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter((a: any) => a.status === 'pending').length,
    reviewed: applications.filter((a: any) => a.status === 'reviewed').length,
    accepted: applications.filter((a: any) => a.status === 'accepted').length,
    rejected: applications.filter((a: any) => a.status === 'rejected').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ink">Job Applications</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-4">
          <p className="text-sm text-ink/60">Total</p>
          <p className="text-2xl font-bold text-ink">{stats.total}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-4">
          <p className="text-sm text-ink/60">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-4">
          <p className="text-sm text-ink/60">Reviewed</p>
          <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-4">
          <p className="text-sm text-ink/60">Accepted</p>
          <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-4">
          <p className="text-sm text-ink/60">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'pending', 'reviewed', 'accepted', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize ${
              filter === status
                ? 'bg-aqua text-white'
                : 'bg-white/60 text-ink hover:bg-white/80'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredApplications.map((app: any) => (
          <div key={app.id} className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-ink">{app.fullName}</h3>
                <p className="text-sm text-ink/60">
                  Applied for: {jobs[app.jobId]?.title || 'Unknown Position'}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  app.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : app.status === 'reviewed'
                    ? 'bg-blue-100 text-blue-800'
                    : app.status === 'accepted'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {app.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-ink/60">
                <Mail className="w-4 h-4" />
                {app.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-ink/60">
                <Phone className="w-4 h-4" />
                {app.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-ink/60">
                <Calendar className="w-4 h-4" />
                {new Date(app.appliedDate).toLocaleDateString()}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-ink mb-1">Experience: {app.experience} years</p>
              <p className="text-sm text-ink/60 mb-2">Cover Letter:</p>
              <p className="text-sm text-ink/80 bg-white/40 p-3 rounded-lg">{app.coverLetter}</p>
            </div>

            {(app.linkedinUrl || app.portfolioUrl) && (
              <div className="flex gap-4 mb-4">
                {app.linkedinUrl && (
                  <a
                    href={app.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-aqua hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
                {app.portfolioUrl && (
                  <a
                    href={app.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-aqua hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Portfolio
                  </a>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {app.status === 'pending' && (
                <>
                  <button
                    onClick={() => updateStatus(app.id, 'reviewed')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Clock className="w-4 h-4" />
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => updateStatus(app.id, 'accepted')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => updateStatus(app.id, 'rejected')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
              {app.status === 'reviewed' && (
                <>
                  <button
                    onClick={() => updateStatus(app.id, 'accepted')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => updateStatus(app.id, 'rejected')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {filteredApplications.length === 0 && (
          <div className="text-center py-12 bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl">
            <FileText className="w-12 h-12 text-ink/20 mx-auto mb-4" />
            <p className="text-ink/60">No applications found</p>
          </div>
        )}
      </div>
    </div>
  );
}
