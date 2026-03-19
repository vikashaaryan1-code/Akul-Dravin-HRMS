'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Upload, ArrowLeft, CheckCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';

export default function JobApplicationPage() {
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const jobId = localStorage.getItem('applyJobId');
    if (!jobId) {
      router.push('/');
      return;
    }
    fetchJob(jobId);
  }, []);

  const fetchJob = async (jobId: string) => {
    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setJob(data);
      }
    } catch (error) {
      console.error('Failed to fetch job:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      jobId: job.id,
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      experience: formData.get('experience'),
      coverLetter: formData.get('coverLetter'),
      linkedinUrl: formData.get('linkedinUrl'),
      portfolioUrl: formData.get('portfolioUrl'),
      status: 'pending',
      appliedDate: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${API_BASE}/job-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSubmitted(true);
        localStorage.removeItem('applyJobId');
        setTimeout(() => router.push('/'), 3000);
      } else {
        alert('Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Application error:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for applying to {job?.title}. We'll review your application and get back to you soon.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all font-medium"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Jobs
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 rounded-xl">
              <Briefcase className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-600">{job.location || 'Remote'} • {job.employmentType || 'Full-time'}</p>
            </div>
          </div>

          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-700">{job.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                name="fullName"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
              <input
                name="phone"
                type="tel"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
              <input
                name="experience"
                type="number"
                min="0"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
              <input
                name="linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio/Website</label>
              <input
                name="portfolioUrl"
                type="url"
                placeholder="https://yourportfolio.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter *</label>
              <textarea
                name="coverLetter"
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Tell us why you're a great fit for this role..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resume/CV (Optional)</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <Upload size={20} />
                  <span>Upload File</span>
                  <input
                    name="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />
                </label>
                <span className="text-sm text-gray-500">PDF, DOC, DOCX (Max 5MB)</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-8 bg-gray-200 text-gray-700 py-4 rounded-lg hover:bg-gray-300 transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
