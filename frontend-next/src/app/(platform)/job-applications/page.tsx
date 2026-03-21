'use client';

import { useState, useEffect } from 'react';
import { FileText, Mail, Phone, Calendar, ExternalLink, CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';

export default function JobApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState<any>({});
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState<string | null>(null);

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
    const jobMap = data.reduce((acc: any, job: any) => { acc[job.id] = job; return acc; }, {});
    setJobs(jobMap);
  };

  const action = async (id: string, endpoint: string, body: any = {}) => {
    setLoading(id + endpoint);
    await fetch(`${API_BASE}/job-applications/${id}/${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(null);
    fetchApplications();
  };

  const getCompanyName = (app: any) => jobs[app.jobId]?.companyId ? 'Our Company' : 'Our Company';

  const filteredApplications = applications.filter((app: any) =>
    filter === 'all' ? true : app.status === filter
  );

  const statusFilters = ['all', 'pending', 'shortlisted', 'selected', 'rejected'];

  const statusColors: any = {
    pending: 'bg-yellow-100 text-yellow-800',
    shortlisted: 'bg-blue-100 text-blue-800',
    selected: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a: any) => a.status === 'pending').length,
    shortlisted: applications.filter((a: any) => a.status === 'shortlisted').length,
    selected: applications.filter((a: any) => a.status === 'selected').length,
    rejected: applications.filter((a: any) => a.status === 'rejected').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ink">Job Applications</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(stats).map(([key, val]) => (
          <div key={key} className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <p className="text-sm text-ink/60 capitalize">{key}</p>
            <p className={`text-2xl font-bold ${key === 'selected' ? 'text-green-600' : key === 'rejected' ? 'text-red-600' : key === 'shortlisted' ? 'text-blue-600' : key === 'pending' ? 'text-yellow-600' : 'text-ink'}`}>{val as number}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize ${filter === status ? 'bg-aqua text-white' : 'bg-white/60 text-ink hover:bg-white/80'}`}
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
                <p className="text-sm text-ink/60">Applied for: {jobs[app.jobId]?.title || 'Unknown Position'}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[app.status] || 'bg-gray-100 text-gray-800'}`}>
                {app.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-ink/60"><Mail className="w-4 h-4" />{app.email}</div>
              <div className="flex items-center gap-2 text-sm text-ink/60"><Phone className="w-4 h-4" />{app.phone}</div>
              <div className="flex items-center gap-2 text-sm text-ink/60"><Calendar className="w-4 h-4" />{new Date(app.createdAt).toLocaleDateString()}</div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-ink mb-1">Experience: {app.experience} years</p>
              <p className="text-sm text-ink/60 mb-1">Cover Letter:</p>
              <p className="text-sm text-ink/80 bg-white/40 p-3 rounded-lg">{app.coverLetter}</p>
            </div>

            {(app.linkedinUrl || app.portfolioUrl) && (
              <div className="flex gap-4 mb-4">
                {app.linkedinUrl && <a href={app.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-aqua hover:underline"><ExternalLink className="w-4 h-4" />LinkedIn</a>}
                {app.portfolioUrl && <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-aqua hover:underline"><ExternalLink className="w-4 h-4" />Portfolio</a>}
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {app.status === 'pending' && (
                <>
                  <button
                    disabled={!!loading}
                    onClick={() => action(app.id, 'shortlist', { companyName: getCompanyName(app) })}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    <Clock className="w-4 h-4" />
                    {loading === app.id + 'shortlist' ? 'Sending...' : 'Shortlist & Invite for Interview'}
                  </button>
                  <button
                    disabled={!!loading}
                    onClick={() => action(app.id, 'reject')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
              {app.status === 'shortlisted' && (
                <>
                  <button
                    disabled={!!loading}
                    onClick={() => action(app.id, 'select', { companyName: getCompanyName(app) })}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    {loading === app.id + 'select' ? 'Creating Account...' : 'Clear / Select (Send Credentials)'}
                  </button>
                  <button
                    disabled={!!loading}
                    onClick={() => action(app.id, 'reject')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
              {app.status === 'selected' && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Employee account created — credentials sent to {app.email}
                </div>
              )}
              {app.status === 'rejected' && (
                <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
                  <XCircle className="w-4 h-4" />
                  Application rejected
                </div>
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
