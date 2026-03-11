'use client';
import { useState, useEffect } from 'react';
import { Target, Zap, TrendingUp, Award } from 'lucide-react';

export default function AiMatchingPage() {
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({ total: 0, highMatch: 0 });
  const [showModal, setShowModal] = useState(false);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    fetch('http://localhost:4200/api/v1/ai-matching')
      .then(r => r.json())
      .then(setMatches);
    fetch('http://localhost:4200/api/v1/ai-matching/stats')
      .then(r => r.json())
      .then(setStats);
  }, []);

  const handleMatch = async (e) => {
    e.preventDefault();
    setMatching(true);

    const formData = new FormData(e.target);
    const data = {
      candidateId: formData.get('candidateId'),
      jobId: formData.get('jobId'),
      candidateData: {
        skills: formData.get('skills')?.split(',').map(s => s.trim()) || [],
        totalExperience: parseInt(formData.get('experience') || '0'),
        education: [{ degree: formData.get('education') }]
      },
      jobData: {
        requiredSkills: formData.get('requiredSkills')?.split(',').map(s => s.trim()) || [],
        minExperience: parseInt(formData.get('minExperience') || '0')
      }
    };

    await fetch('http://localhost:4200/api/v1/ai-matching/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    setMatching(false);
    setShowModal(false);
    fetch('http://localhost:4200/api/v1/ai-matching').then(r => r.json()).then(setMatches);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Target className="text-cyan-500" size={36} />
            AI Candidate Matching
          </h1>
          <p className="text-gray-600 mt-1">Intelligent candidate-job matching with ML algorithms</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg">
          <Zap size={20} />
          Run Matching
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-cyan-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Matches</p>
              <p className="text-3xl font-bold text-cyan-600 mt-1">{stats.total}</p>
            </div>
            <Target className="text-cyan-500" size={40} />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-green-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">High Matches (80%+)</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.highMatch}</p>
            </div>
            <Award className="text-green-500" size={40} />
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {matches.map((match) => (
          <div key={match.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Candidate: {match.candidateId}</h3>
                <p className="text-sm text-gray-600">Job: {match.jobId}</p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getScoreColor(match.matchScore)} px-4 py-2 rounded-lg`}>
                  {match.matchScore}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Match Score</p>
              </div>
            </div>

            {match.matchDetails && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Skills</p>
                  <p className="text-lg font-bold text-blue-600">{Math.round(match.matchDetails.skillMatch)}%</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Experience</p>
                  <p className="text-lg font-bold text-green-600">{Math.round(match.matchDetails.experienceMatch)}%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Education</p>
                  <p className="text-lg font-bold text-purple-600">{Math.round(match.matchDetails.educationMatch)}%</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Location</p>
                  <p className="text-lg font-bold text-orange-600">{Math.round(match.matchDetails.locationMatch)}%</p>
                </div>
                <div className="bg-cyan-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Salary</p>
                  <p className="text-lg font-bold text-cyan-600">{Math.round(match.matchDetails.salaryMatch)}%</p>
                </div>
              </div>
            )}

            {match.matchDetails && (
              <div className="space-y-3">
                {match.matchDetails.matchedSkills?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">✓ Matched Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {match.matchDetails.matchedSkills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {match.matchDetails.missingSkills?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">⚠ Missing Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {match.matchDetails.missingSkills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {match.matchDetails.recommendations?.length > 0 && (
                  <div className="bg-cyan-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <TrendingUp size={16} className="text-cyan-500" />
                      AI Recommendations:
                    </p>
                    <ul className="space-y-1">
                      {match.matchDetails.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-gray-600">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Zap size={28} />
                Run AI Matching
              </h2>
            </div>
            <form onSubmit={handleMatch} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Candidate ID *</label>
                  <input name="candidateId" required className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job ID *</label>
                  <input name="jobId" required className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-700 mb-3">Candidate Data</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma-separated) *</label>
                    <input name="skills" required className="w-full px-4 py-2 border rounded-lg" placeholder="JavaScript, React, Node.js" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Experience (years) *</label>
                      <input name="experience" type="number" required className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                      <input name="education" className="w-full px-4 py-2 border rounded-lg" placeholder="Bachelor's" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-700 mb-3">Job Requirements</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills (comma-separated) *</label>
                    <input name="requiredSkills" required className="w-full px-4 py-2 border rounded-lg" placeholder="JavaScript, React, TypeScript" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Experience (years) *</label>
                    <input name="minExperience" type="number" required className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={matching} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg hover:shadow-lg disabled:opacity-50">
                  {matching ? 'Matching...' : 'Run AI Matching'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
