'use client';

import { useState } from 'react';
import { AutomationModuleView } from '@/components/modules/AutomationModuleView';
import { WorkflowBuilderView } from '@/components/modules/WorkflowBuilderView';

const TABS = [
 { id: 'workflows', label: 'Automation Dashboard' },
 { id: 'builder', label: '⚡ Workflow Builder' },
];

export function AutomationPageContent() {
 const [tab, setTab] = useState('workflows');

 return (
 <div className="space-y-4">
 {/* Tab bar */}
 <div className="flex gap-1 border-b border-slate-100 pb-0 ">
 {TABS.map((t) => (
 <button
 key={t.id}
 type="button"
 onClick={() => setTab(t.id)}
 className={`rounded-t-xl border-b-2 px-4 py-2 text-sm font-medium transition ${
 tab === t.id
 ? 'border-blue-600 text-blue-600 '
 : 'border-transparent text-slate-500 hover:text-slate-700 '
 }`}
 >
 {t.label}
 </button>
 ))}
 </div>

 {tab === 'workflows' ? <AutomationModuleView /> : <WorkflowBuilderView />}
 </div>
 );
}
