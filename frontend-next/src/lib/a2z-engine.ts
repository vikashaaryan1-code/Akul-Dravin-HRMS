import { getPublicApiBaseUrl } from './api-base';

export interface ApiResponse<T> {
 success: boolean;
 data: T;
 error?: string;
}

export interface A2zWorkflow {
 id: string;
 title: string;
 description: string;
 steps: A2zStep[];
}

export interface A2zStep {
 id: string;
 label: string;
 type: 'select' | 'input' | 'multiselect';
 options?: string[];
 placeholder?: string;
}

export interface A2zPreview {
 estimatedModules: number;
 targetTimeline: string;
 readinessScore: number;
 phases: Array<{ phase: string; status: string; eta: string }>;
}

const API_BASE = getPublicApiBaseUrl();

export async function getA2zWorkflows(): Promise<A2zWorkflow[]> {
 const res = await fetch(`${API_BASE}/a2z-engine/workflows`);
 const json: ApiResponse<A2zWorkflow[]> = await res.json();
 if (!json.success) throw new Error(json.error);
 return json.data;
}

export async function getA2zPreview(config: any): Promise<A2zPreview> {
 const res = await fetch(`${API_BASE}/a2z-engine/preview`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(config),
 });
 const json: ApiResponse<A2zPreview> = await res.json();
 if (!json.success) throw new Error(json.error);
 return json.data;
}
