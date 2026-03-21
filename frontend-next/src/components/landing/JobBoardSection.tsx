'use client';

import { useState, useEffect } from 'react';
import { Briefcase, MapPin, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';

export function JobBoardSection() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const openJobs = data.filter((job: any) => job.status === 'open');
        setJobs(openJobs.slice(0, 6));
      }
    } catch (error) {
      // Silently fail if backend is not running
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (jobId: string) => {
    localStorage.setItem('applyJobId', jobId);
    router.push('/job-application');
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Open Positions</h2>
          <p className="text-xl text-gray-600">Join our team and build your career with us</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job: any) => (
            <div key={job.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-lg">
                  <Briefcase className="text-white" size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {job.status}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={16} />
                  <span>{job.location || 'Remote'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} />
                  <span>{job.employmentType || 'Full-time'}</span>
                </div>
                {job.salaryRange && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign size={16} />
                    <span>{job.salaryRange}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleApply(job.id)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg hover:shadow-lg transition-all font-medium"
              >
                Apply Now
                <ArrowRight size={18} />
              </button>
            </div>
          ))}
        </div>

        {jobs.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No open positions at the moment. Check back soon!</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Loading opportunities...</p>
          </div>
        )}

        {jobs.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={() => router.push('/login?redirect=job-board')}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              View All Openings
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
