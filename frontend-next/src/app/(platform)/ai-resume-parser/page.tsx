'use client';
import { useState, useEffect } from 'react';
import { Brain, Upload, FileText, CheckCircle } from 'lucide-react';

export default function AiResumeParserPage() {
  const [parsedResumes, setParsedResumes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);

  useEffect(() => {
    fetch('http://localhost:4200/api/v1/ai-resume-parser')
      .then(r => r.json())
      .then(setParsedResumes);
  }, []);

  const handleParse = async (e) => {
    e.preventDefault();
    setParsing(true);
    
    const formData = new FormData(e.target);
    const data = {
      candidateId: formData.get('candidateId'),
      resumeText: formData.get('resumeText')
    };

    await fetch('http://localhost:4200/api/v1/ai-resume-parser/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    setParsing(false);
    setShowModal(false);
    fetch('http://localhost:4200/api/v1/ai-resume-parser').then(r => r.json()).then(setParsedResumes);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Brain className="text-cyan-500" size={36} />
            AI Resume Parser
          </h1>
          <p className="text-gray-600 mt-1">Automatically extract structured data from resumes</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg">
          <Upload size={20} />
          Parse Resume
        </button>
      </div>

      <div className="grid gap-6">
        {parsedResumes.map((resume) => (
          <div key={resume.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <FileText className="text-cyan-500" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Candidate: {resume.candidateId}</h3>
                  <p className="text-sm text-gray-500">{new Date(resume.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${resume.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {resume.status}
              </span>
            </div>

            {resume.parsedData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-cyan-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <CheckCircle size={16} className="text-cyan-500" />
                    Contact Info
                  </h4>
                  <p className="text-sm text-gray-600">Email: {resume.parsedData.email || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Phone: {resume.parsedData.phone || 'N/A'}</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <CheckCircle size={16} className="text-blue-500" />
                    Experience
                  </h4>
                  <p className="text-sm text-gray-600">Total: {resume.parsedData.totalExperience || 0} years</p>
                  <p className="text-sm text-gray-600">Positions: {resume.parsedData.experience?.length || 0}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    Skills ({resume.parsedData.skills?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {resume.parsedData.skills?.slice(0, 6).map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700">{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <CheckCircle size={16} className="text-purple-500" />
                    Education
                  </h4>
                  <p className="text-sm text-gray-600">Degrees: {resume.parsedData.education?.length || 0}</p>
                </div>
              </div>
            )}

            <button onClick={() => setSelectedResume(resume)} className="mt-4 text-cyan-600 hover:text-cyan-800 text-sm font-medium">
              View Full Details →
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Brain size={28} />
                Parse Resume with AI
              </h2>
            </div>
            <form onSubmit={handleParse} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Candidate ID *</label>
                <input name="candidateId" required className="w-full px-4 py-2 border rounded-lg" placeholder="Enter candidate ID" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resume Text *</label>
                <textarea name="resumeText" required rows="12" className="w-full px-4 py-2 border rounded-lg font-mono text-sm" placeholder="Paste resume text here..."></textarea>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={parsing} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg hover:shadow-lg disabled:opacity-50">
                  {parsing ? 'Parsing...' : 'Parse Resume'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedResume && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Parsed Resume Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(selectedResume.parsedData, null, 2)}
              </pre>
              <button onClick={() => setSelectedResume(null)} className="w-full bg-gray-200 py-3 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
