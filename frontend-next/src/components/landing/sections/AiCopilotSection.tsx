'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, BarChart3, Users, MessageSquare, Sparkles, TrendingUp } from 'lucide-react';

const DEMO_MESSAGES = [
  { role: 'user', text: 'What is the attrition risk for the engineering team this quarter?' },
  { role: 'ai', text: 'High risk detected in 3 senior engineers (>85% confidence). Key drivers: below-market compensation variance of 18%, 2 missed promotion cycles, and reduced sprint engagement over 6 weeks. Recommended action: initiate retention conversation with manager.' },
  { role: 'user', text: 'Forecast payroll cost for Q3 if we hire 20 engineers.' },
  { role: 'ai', text: 'Projected Q3 payroll impact: +₹42.6L/month. Breakeven against projected revenue uplift at month 4.2. Recommend phasing 10 hires in July and 10 in September for optimal cash-flow alignment.' },
] as const;

const TABS = [
  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  { id: 'analytics', label: 'Predictive Analytics', icon: BarChart3 },
  { id: 'twin', label: 'Digital Twin', icon: Users },
] as const;

type TabId = typeof TABS[number]['id'];

export function AiCopilotSection() {
  const [activeTab, setActiveTab] = useState<TabId>('chat');

  return (
    <section id="ai-copilot" className="py-28 bg-depth-1/40" aria-labelledby="ai-heading">
      <div className="container-brand">
        <div className="text-center mb-16">
          <p className="section-label text-ember mb-3">AI Copilot</p>
          <h2
            id="ai-heading"
            className="text-4xl lg:text-6xl font-black tracking-tighter leading-none text-white"
          >
            Your Enterprise
            <br />
            <span className="text-gradient-gold">Thought Partner</span>
          </h2>
          <p className="mt-5 text-lg text-slate-400 max-w-xl mx-auto">
            Conversational intelligence, predictive signals, and executive foresight — built into every module.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Tab panel */}
          <div className="surface-raised border-subtle rounded-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/5" role="tablist" aria-label="AI Copilot views">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 flex-1 py-3.5 px-4 text-xs font-bold uppercase tracking-wide transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'text-gold border-b-2 border-gold bg-gold/5'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Panel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                id={`panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`tab-${activeTab}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="p-6 min-h-[340px]"
              >
                {activeTab === 'chat' && (
                  <div className="space-y-4">
                    {DEMO_MESSAGES.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'ai' && (
                          <div className="h-7 w-7 rounded-lg bg-ember/20 border border-ember/30 flex items-center justify-center shrink-0">
                            <BrainCircuit className="h-3.5 w-3.5 text-ember" aria-hidden="true" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-white/8 border border-white/10 text-slate-200'
                              : 'bg-depth-2 border border-white/5 text-slate-300'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-white mb-6">Predictive Analytics Dashboard</p>
                    {[
                      { label: 'Attrition Risk Index', value: 72, color: 'bg-ember' },
                      { label: 'Revenue Forecast Accuracy', value: 94, color: 'bg-jade' },
                      { label: 'Payroll Variance Score', value: 88, color: 'bg-gold' },
                      { label: 'Hiring Pipeline Health', value: 61, color: 'bg-aqua' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-400">{item.label}</span>
                          <span className="text-white font-bold">{item.value}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.value}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-full ${item.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'twin' && (
                  <div className="space-y-5">
                    <p className="text-sm font-bold text-white mb-4">Digital Twin — Org Simulation</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Org Health Score', val: '91/100', icon: TrendingUp, color: 'text-jade' },
                        { label: 'Span of Control', val: '1:7.4', icon: Users, color: 'text-gold' },
                        { label: 'Burnout Probability', val: '14%', icon: Sparkles, color: 'text-ember' },
                        { label: 'Succession Readiness', val: '78%', icon: BarChart3, color: 'text-aqua' },
                      ].map((item) => (
                        <div key={item.label} className="surface-base border-subtle rounded-xl p-4">
                          <item.icon className={`h-4 w-4 ${item.color} mb-2`} aria-hidden="true" />
                          <p className={`text-xl font-black ${item.color}`}>{item.val}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Feature list */}
          <div className="space-y-5">
            {[
              {
                icon: MessageSquare, color: 'text-ember',
                title: 'Natural Language Queries',
                desc: 'Ask anything in plain English — attrition forecasts, payroll summaries, or team OKRs. No SQL required.',
              },
              {
                icon: BarChart3, color: 'text-gold',
                title: 'Predictive Intelligence',
                desc: 'Machine-learning models trained on workforce patterns surface risk signals before they become issues.',
              },
              {
                icon: Users, color: 'text-aqua',
                title: 'Digital Twin Simulation',
                desc: 'Model hiring, restructuring, or policy changes against your live org graph — before committing.',
              },
              {
                icon: TrendingUp, color: 'text-jade',
                title: 'Executive Intelligence Layer',
                desc: 'Board-ready dashboards with cohort analysis, margin attribution, and headcount ROI scoring.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="flex gap-4 surface-base border-subtle rounded-2xl p-5 hover:bg-white/5 transition-colors duration-300"
              >
                <div className={`h-10 w-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-black text-white text-sm">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
