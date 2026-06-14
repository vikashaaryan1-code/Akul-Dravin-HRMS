'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Candidate {
  id: string;
  name: string;
  matchScore: number;
  role: string;
  skills: string[];
}

export const TalentUniverse = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching candidates
    setTimeout(() => {
      setCandidates([
        { id: '1', name: 'Arjun Sharma', matchScore: 94, role: 'Lead Frontend Engineer', skills: ['React', 'Next.js', 'TypeScript'] },
        { id: '2', name: 'Priya Patel', matchScore: 88, role: 'Backend Developer', skills: ['Node.js', 'NestJS', 'PostgreSQL'] },
        { id: '3', name: 'Rohan Gupta', matchScore: 75, role: 'Full Stack Developer', skills: ['React', 'Python', 'AWS'] },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      {/* Background glowing orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            AI Talent Universe
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Autonomous Candidate Matching & Scoring</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Candidates List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold border-b border-white/10 pb-4">Top Matches</h2>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-white/5 rounded-xl backdrop-blur-md border border-white/10" />
                ))}
              </div>
            ) : (
              candidates.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer group"
                >
                  <div>
                    <h3 className="text-xl font-medium group-hover:text-primary transition-colors">{c.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{c.role}</p>
                    <div className="flex gap-2 mt-3">
                      {c.skills.map((s) => (
                        <span key={s} className="px-3 py-1 text-xs bg-white/10 rounded-full text-gray-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* AI Match Score Circular Indicator */}
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                      <circle
                        cx="40" cy="40" r="36" fill="transparent"
                        stroke={c.matchScore > 90 ? '#22c55e' : c.matchScore > 70 ? '#eab308' : '#ef4444'}
                        strokeWidth="6"
                        strokeDasharray={226}
                        strokeDashoffset={226 - (226 * c.matchScore) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-lg font-bold">{c.matchScore}%</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Match</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* AI Copilot & Job Creator Panel */}
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-xl border border-primary/20 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Job Creator
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Job Title</label>
                  <input type="text" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors" placeholder="e.g. Senior DevOps Engineer" />
                </div>
                <button className="w-full bg-primary/20 hover:bg-primary/30 text-primary font-medium py-3 rounded-lg border border-primary/50 transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.5)]">
                  Generate Description
                </button>
              </div>
            </div>

            <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
              <h2 className="text-lg font-medium mb-4">Resume Parsing</h2>
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-black/20">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <p className="text-sm text-gray-300">Drag & drop resume PDF here</p>
                <p className="text-xs text-gray-500 mt-2">AI will automatically parse and score</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
