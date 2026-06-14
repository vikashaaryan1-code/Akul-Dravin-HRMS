'use client';

import { useState, useCallback } from 'react';
import {
  Zap, Mail, Webhook, Clock, GitBranch, Bell, Database, Play, Plus, Trash2,
  ArrowDown, ChevronRight, Save, RotateCcw, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { DraggableStepList } from '@/components/workflow/DraggableStepList';

// ── Types ─────────────────────────────────────────────────────────────────────

type TriggerType =
  | 'manual'
  | 'event:employee_created'
  | 'event:employee_offboarded'
  | 'event:leave_approved'
  | 'event:payroll_generated'
  | 'event:crm_lead_created'
  | 'schedule';

type StepType = 'email' | 'webhook' | 'delay' | 'condition' | 'notification' | 'ai_action';

interface WorkflowStep {
  id: string;
  type: StepType;
  name: string;
  config: Record<string, string>;
}

interface WorkflowDef {
  id?: string;
  name: string;
  description: string;
  triggerType: TriggerType;
  steps: WorkflowStep[];
  isActive: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TRIGGERS: { value: TriggerType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'manual', label: 'Manual Trigger', icon: <Play className="h-4 w-4" />, color: 'bg-slate-100 dark:bg-slate-800 text-slate-600' },
  { value: 'event:employee_created', label: 'Employee Created', icon: <Database className="h-4 w-4" />, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
  { value: 'event:employee_offboarded', label: 'Employee Offboarded', icon: <Database className="h-4 w-4" />, color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' },
  { value: 'event:leave_approved', label: 'Leave Approved', icon: <Database className="h-4 w-4" />, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' },
  { value: 'event:payroll_generated', label: 'Payroll Generated', icon: <Database className="h-4 w-4" />, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
  { value: 'event:crm_lead_created', label: 'CRM Lead Created', icon: <Database className="h-4 w-4" />, color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600' },
  { value: 'schedule', label: 'Scheduled (Cron)', icon: <Clock className="h-4 w-4" />, color: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600' },
];

const STEP_TYPES: { type: StepType; label: string; icon: React.ReactNode; color: string; defaultName: string }[] = [
  { type: 'email', label: 'Send Email', icon: <Mail className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', defaultName: 'Send Email' },
  { type: 'notification', label: 'Push Notification', icon: <Bell className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', defaultName: 'Send Notification' },
  { type: 'webhook', label: 'Call Webhook', icon: <Webhook className="h-4 w-4" />, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20', defaultName: 'Call Webhook' },
  { type: 'delay', label: 'Wait / Delay', icon: <Clock className="h-4 w-4" />, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800', defaultName: 'Wait 1 Hour' },
  { type: 'condition', label: 'Condition Branch', icon: <GitBranch className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', defaultName: 'If / Else Condition' },
  { type: 'ai_action', label: 'AI Action', icon: <Zap className="h-4 w-4" />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20', defaultName: 'Generate AI Insight' },
];

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001'}/api/v1`;

function uid() { return Math.random().toString(36).slice(2, 10); }

// ── Step Config Forms ─────────────────────────────────────────────────────────

function StepConfigForm({ step, onChange }: { step: WorkflowStep; onChange: (cfg: Record<string, string>) => void }) {
  const update = (key: string, val: string) => onChange({ ...step.config, [key]: val });
  const inp = (label: string, key: string, placeholder?: string) => (
    <div key={key}>
      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <input value={step.config[key] ?? ''} onChange={e => update(key, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400" />
    </div>
  );

  switch (step.type) {
    case 'email': return <div className="space-y-2">{inp('To', 'to', '{{employee.email}}')}{inp('Subject', 'subject', 'Welcome to the team!')}{inp('Body template', 'body', 'Hi {{employee.name}}, ...')}</div>;
    case 'webhook': return <div className="space-y-2">{inp('Webhook URL', 'url', 'https://hooks.example.com/...')}{inp('Method', 'method', 'POST')}</div>;
    case 'delay': return <div className="space-y-2">{inp('Duration (e.g. 30m, 2h, 1d)', 'duration', '1h')}</div>;
    case 'condition': return <div className="space-y-2">{inp('Field path', 'field', 'employee.department')}{inp('Operator (eq, neq, gt, lt, contains)', 'operator', 'eq')}{inp('Value', 'value', 'Engineering')}</div>;
    case 'notification': return <div className="space-y-2">{inp('Title', 'title', 'Action Required')}{inp('Message', 'message', 'New employee {{employee.name}} has joined.')}</div>;
    case 'ai_action': return <div className="space-y-2">{inp('Action type (insight / report / summarize)', 'aiType', 'insight')}{inp('Context prompt', 'prompt', 'Summarize onboarding status for {{employee.name}}')}</div>;
    default: return null;
  }
}

// ── Step Card ─────────────────────────────────────────────────────────────────

function StepCard({ step, index, onUpdate, onDelete, isLast }: {
  step: WorkflowStep; index: number;
  onUpdate: (s: WorkflowStep) => void;
  onDelete: () => void;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = STEP_TYPES.find(s => s.type === step.type);

  return (
    <div className="relative">
      <div className={`rounded-xl border ${expanded ? 'border-blue-200 dark:border-blue-800' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 transition`}>
        <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${meta?.color ?? 'bg-slate-100 text-slate-500'}`}>
            {meta?.icon}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{step.name}</p>
            <p className="text-[10px] text-slate-400">{meta?.label} · Step {index + 1}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={e => { e.stopPropagation(); onDelete(); }}
              className="p-1 rounded text-slate-300 hover:text-red-400 transition"><Trash2 className="h-3.5 w-3.5" /></button>
            <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>

        {expanded && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 space-y-3">
            <div>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Step Name</p>
              <input value={step.name} onChange={e => onUpdate({ ...step, name: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
            <StepConfigForm step={step} onChange={cfg => onUpdate({ ...step, config: cfg })} />
          </div>
        )}
      </div>

      {!isLast && (
        <div className="flex justify-center my-1">
          <ArrowDown className="h-4 w-4 text-slate-300" />
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const EMPTY_WORKFLOW: WorkflowDef = {
  name: 'New Workflow',
  description: '',
  triggerType: 'manual',
  steps: [],
  isActive: true,
};

const TEMPLATES: WorkflowDef[] = [
  {
    name: 'Employee Onboarding',
    description: 'Sends welcome email, notifies HR, then triggers AI onboarding summary.',
    triggerType: 'event:employee_created',
    isActive: true,
    steps: [
      { id: uid(), type: 'email', name: 'Send Welcome Email', config: { to: '{{employee.email}}', subject: 'Welcome to {{company.name}}!', body: 'Hi {{employee.name}}, welcome aboard!' } },
      { id: uid(), type: 'notification', name: 'Notify HR Manager', config: { title: 'New Hire Joined', message: '{{employee.name}} has joined the {{employee.department}} team.' } },
      { id: uid(), type: 'delay', name: 'Wait 24 Hours', config: { duration: '24h' } },
      { id: uid(), type: 'ai_action', name: 'Generate Onboarding Insight', config: { aiType: 'insight', prompt: 'Summarize onboarding readiness for {{employee.name}} in {{employee.department}}.' } },
    ],
  },
  {
    name: 'Leave Approval Notification',
    description: 'Notifies employee and team lead when a leave request is approved.',
    triggerType: 'event:leave_approved',
    isActive: true,
    steps: [
      { id: uid(), type: 'email', name: 'Email Employee', config: { to: '{{employee.email}}', subject: 'Leave Approved', body: 'Your leave from {{leave.startDate}} to {{leave.endDate}} has been approved.' } },
      { id: uid(), type: 'notification', name: 'Notify Team Lead', config: { title: 'Leave Approved', message: '{{employee.name}} is on leave {{leave.startDate}} – {{leave.endDate}}.' } },
    ],
  },
  {
    name: 'Payroll Generated Alert',
    description: 'Sends payroll summary email and posts to webhook after payroll run.',
    triggerType: 'event:payroll_generated',
    isActive: true,
    steps: [
      { id: uid(), type: 'email', name: 'Payroll Summary Email', config: { to: 'finance@company.com', subject: 'Payroll Generated — {{payroll.month}}', body: 'Total payout: {{payroll.totalAmount}} for {{payroll.employeeCount}} employees.' } },
      { id: uid(), type: 'webhook', name: 'Post to Finance Hook', config: { url: '{{env.FINANCE_WEBHOOK_URL}}', method: 'POST' } },
    ],
  },
];

export function WorkflowBuilderView() {
  const [workflow, setWorkflow] = useState<WorkflowDef>(EMPTY_WORKFLOW);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'success' | 'error'>('idle');
  const [showTemplates, setShowTemplates] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const addStep = useCallback((type: StepType) => {
    const meta = STEP_TYPES.find(s => s.type === type)!;
    setWorkflow(wf => ({
      ...wf,
      steps: [...wf.steps, { id: uid(), type, name: meta.defaultName, config: {} }],
    }));
  }, []);

  const reorderSteps = useCallback((newSteps: WorkflowStep[]) => {
    setWorkflow(wf => ({ ...wf, steps: newSteps }));
  }, []);

  const updateStep = useCallback((id: string, updated: WorkflowStep) => {
    setWorkflow(wf => ({ ...wf, steps: wf.steps.map(s => s.id === id ? updated : s) }));
  }, []);

  const deleteStep = useCallback((id: string) => {
    setWorkflow(wf => ({ ...wf, steps: wf.steps.filter(s => s.id !== id) }));
  }, []);

  const saveWorkflow = async () => {
    setSaving(true); setSaveState('idle'); setTestResult(null);
    try {
      const res = await fetch(`${API_BASE}/automation/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : ''}`,
        },
        body: JSON.stringify({
          name: workflow.name,
          description: workflow.description,
          triggerType: workflow.triggerType,
          triggerConfig: {},
          steps: workflow.steps,
          isActive: workflow.isActive,
        }),
      });
      setSaveState(res.ok ? 'success' : 'error');
      if (res.ok) { const data = await res.json(); setWorkflow(wf => ({ ...wf, id: data.id ?? data.data?.id })); }
    } catch { setSaveState('error'); }
    setSaving(false);
    setTimeout(() => setSaveState('idle'), 3000);
  };

  const testRun = async () => {
    if (!workflow.id) { setTestResult('Save the workflow first to test it.'); return; }
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch(`${API_BASE}/automation/workflows/${workflow.id}/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : ''}`,
        },
        body: JSON.stringify({ triggerData: { test: true }, triggeredBy: 'manual-test' }),
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult(`✅ Test triggered successfully. Job ID: ${data.jobId ?? 'queued'}`);
      } else {
        setTestResult('⚠️ Trigger returned an error. Check backend logs.');
      }
    } catch { setTestResult('❌ Could not reach the backend. Ensure the server is running.'); }
    setTesting(false);
  };

  const triggerMeta = TRIGGERS.find(t => t.value === workflow.triggerType);

  return (
    <div className="space-y-5 animate-rise">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title="Workflow Builder" description="Create event-driven automations across HR, CRM, payroll, and recruitment." />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setShowTemplates(t => !t); setTestResult(null); }}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <RotateCcw className="h-3.5 w-3.5" />Templates
          </button>
          <button onClick={testRun} disabled={testing}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition disabled:opacity-50">
            <Play className="h-3.5 w-3.5" />{testing ? 'Testing...' : 'Test Run'}
          </button>
          <button onClick={saveWorkflow} disabled={saving}
            className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl font-medium transition disabled:opacity-50 ${
              saveState === 'success' ? 'bg-emerald-600 text-white' : saveState === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
            {saveState === 'success' ? <><CheckCircle2 className="h-3.5 w-3.5" />Saved!</> :
             saveState === 'error'   ? <><XCircle className="h-3.5 w-3.5" />Failed</> :
             <><Save className="h-3.5 w-3.5" />{saving ? 'Saving...' : 'Save Workflow'}</>}
          </button>
        </div>
      </div>

      {/* Test result */}
      {testResult && (
        <div className="px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {testResult}
        </div>
      )}

      {/* Templates */}
      {showTemplates && (
        <div className="grid gap-3 sm:grid-cols-3">
          {TEMPLATES.map((tpl, i) => (
            <button key={i} onClick={() => { setWorkflow({ ...tpl, steps: tpl.steps.map(s => ({ ...s, id: uid() })) }); setShowTemplates(false); }}
              className="text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition group">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">{tpl.name}</p>
              <p className="text-xs text-slate-500 mt-1">{tpl.description}</p>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                <span>{TRIGGERS.find(t => t.value === tpl.triggerType)?.label}</span>
                <span>·</span><span>{tpl.steps.length} steps</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[350px_1fr]">
        {/* Left: Workflow metadata */}
        <div className="space-y-4">
          <GlassCard>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Workflow Details</p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Name</p>
                <input value={workflow.name} onChange={e => setWorkflow(wf => ({ ...wf, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/30" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Description</p>
                <textarea value={workflow.description} onChange={e => setWorkflow(wf => ({ ...wf, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/30 resize-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="wf-active" checked={workflow.isActive} onChange={e => setWorkflow(wf => ({ ...wf, isActive: e.target.checked }))}
                  className="rounded" />
                <label htmlFor="wf-active" className="text-xs text-slate-600 dark:text-slate-400">Active (will execute on trigger)</label>
              </div>
            </div>
          </GlassCard>

          {/* Trigger selector */}
          <GlassCard>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Trigger Event</p>
            <div className="space-y-1.5">
              {TRIGGERS.map(t => (
                <button key={t.value} onClick={() => setWorkflow(wf => ({ ...wf, triggerType: t.value }))}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                    workflow.triggerType === t.value
                      ? 'ring-2 ring-blue-500 ' + t.color
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                  <span className={`p-1 rounded-lg ${t.color}`}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Add step palette */}
          <GlassCard>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Add Step</p>
            <div className="grid grid-cols-2 gap-1.5">
              {STEP_TYPES.map(s => (
                <button key={s.type} onClick={() => addStep(s.type)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition hover:scale-[1.02] ${s.color}`}>
                  <Plus className="h-3 w-3 shrink-0" />{s.label}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right: Canvas */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Workflow Canvas</p>
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${triggerMeta?.color ?? 'bg-slate-100 text-slate-500'}`}>
              {triggerMeta?.icon}<span>{triggerMeta?.label}</span>
            </div>
          </div>

          {workflow.steps.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <Zap className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-400">No steps yet</p>
              <p className="text-xs text-slate-400 mt-1">Add steps from the left panel or load a template</p>
            </div>
          ) : (
            <div className="space-y-0">
              {/* Trigger node */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-2 ${triggerMeta?.color ?? 'bg-slate-100'}`}>
                {triggerMeta?.icon}
                <div>
                  <p className="text-xs font-bold">TRIGGER</p>
                  <p className="text-[10px] opacity-80">{triggerMeta?.label}</p>
                </div>
              </div>
              <div className="flex justify-center mb-1"><ArrowDown className="h-4 w-4 text-slate-300" /></div>

              <DraggableStepList
                steps={workflow.steps}
                onReorder={reorderSteps}
                renderStep={(step, i, isLast) => (
                  <StepCard
                    step={step as WorkflowStep}
                    index={i}
                    onUpdate={updated => updateStep(step.id, updated as WorkflowStep)}
                    onDelete={() => deleteStep(step.id)}
                    isLast={isLast}
                  />
                )}
              />

              {/* End node */}
              <div className="flex justify-center mt-2"><ArrowDown className="h-4 w-4 text-slate-300" /></div>
              <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 text-xs font-bold mt-1">
                <CheckCircle2 className="h-4 w-4" />WORKFLOW COMPLETE
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
