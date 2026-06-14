'use client';

import { A2zStep } from '@/lib/a2z-engine';

interface DynamicFormProps {
  steps: A2zStep[];
  values: any;
  onChange: (field: string, value: any) => void;
}

const INPUT_STYLES =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-amber/60 focus:bg-white/10';

export function DynamicForm({ steps, values, onChange }: DynamicFormProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {steps.map((step) => (
        <div key={step.id} className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {step.label}
          </label>
          {step.type === 'select' ? (
            <select
              className={INPUT_STYLES}
              value={values[step.id] || ''}
              onChange={(e) => onChange(step.id, e.target.value)}
            >
              <option value="">Select option...</option>
              {step.options?.map((opt) => (
                <option key={opt} value={opt} className="bg-slate-900">
                  {opt}
                </option>
              ))}
            </select>
          ) : step.type === 'multiselect' ? (
            <div className="flex flex-wrap gap-2">
              {step.options?.map((opt) => {
                const selected = (values[step.id] || []).includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const current = values[step.id] || [];
                      const next = selected
                        ? current.filter((x: string) => x !== opt)
                        : [...current, opt];
                      onChange(step.id, next);
                    }}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                      selected
                        ? 'border-amber bg-amber/20 text-white'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              type="text"
              className={INPUT_STYLES}
              placeholder={step.placeholder}
              value={values[step.id] || ''}
              onChange={(e) => onChange(step.id, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
