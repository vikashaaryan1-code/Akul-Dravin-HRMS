'use client';

import { useEffect, useState } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { useUIStore } from '@/store/ui-store';
import { platformApi } from '@/services/api/platform-api';

const BADGES = [
 { icon: '🏆', name: 'Top Performer', desc: 'Achieved 95%+ KPI 3 months running', rarity: 'Legendary' },
 { icon: '🎯', name: 'Sales Ace', desc: 'Closed 10 deals in a single month', rarity: 'Epic' },
 { icon: '📚', name: 'Knowledge Champion', desc: 'Completed 5 LMS courses this quarter', rarity: 'Rare' },
 { icon: '⚡', name: 'Attendance Elite', desc: '100% attendance for 90 consecutive days', rarity: 'Epic' },
 { icon: '🤝', name: 'Team Collaborator', desc: 'Assisted 10+ colleagues in task reviews', rarity: 'Rare' },
 { icon: '🚀', name: 'Early Adopter', desc: 'First to complete mandatory compliance', rarity: 'Common' },
];

const RARITY_COLOR: Record<string, string> = {
 Legendary: 'from-amber-500 to-yellow-400',
 Epic: 'from-violet-500 to-purple-400',
 Rare: 'from-sky-500 to-cyan-400',
 Common: 'from-slate-500 to-slate-400',
};

const LEVEL_COLOR: Record<string, string> = {
 Platinum: 'text-cyan-400',
 Gold: 'text-amber-400',
 Silver: 'text-slate-600',
 Bronze: 'text-orange-400',
};

function scoreToLevel(score: number): string {
 if (score >= 95) return 'Platinum';
 if (score >= 85) return 'Gold';
 if (score >= 70) return 'Silver';
 return 'Bronze';
}

type LeaderboardEntry = { id: string; teamName: string; score: number; completedTasks: number; targetAchieved: number };

export function GamificationModuleView() {
 const activeRole = useUIStore((state) => state.activeRole);

 const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 setLoading(true);
 platformApi.getTeamLeaderboard()
 .then((res) => setLeaderboard((res as any).data ?? res))
 .catch((e) => setError(String(e?.message ?? 'Failed to load gamification data')))
 .finally(() => setLoading(false));
 }, []);

 const ranked = leaderboard.map((e, i) => ({
 ...e,
 rank: i + 1,
 points: e.score * 100,
 badges: Math.max(1, Math.floor(e.score / 15)),
 level: scoreToLevel(e.score),
 dept: 'Team',
 name: e.teamName,
 }));

 const totalPoints = ranked.reduce((s, e) => s + e.points, 0);
 const totalBadges = ranked.reduce((s, e) => s + e.badges, 0);
 const platinumCnt = ranked.filter(e => e.level === 'Platinum').length;

 const engagementTrend = [
 { name: 'Jan', value: 64 }, { name: 'Feb', value: 71 }, { name: 'Mar', value: 78 },
 { name: 'Apr', value: 82 }, { name: 'May', value: 87 }, { name: 'Jun', value: 91 },
 ];

 if (loading) return (
 <div className="flex items-center justify-center h-64 text-slate-500 animate-pulse">Loading gamification data…</div>
 );
 if (error) return (
 <div className="flex items-center justify-center h-64 text-red-400">Error: {error}</div>
 );

 return (
 <div className="space-y-5">
 <PageTitle
 title="Employee Gamification"
 description="Points, badges, leaderboards, and recognition programs to boost engagement and performance culture."
 />

 <ModuleLinksBar
 links={[
 { label: 'Performance', href: `/performance?role=${activeRole}` },
 { label: 'LMS', href: `/lms?role=${activeRole}` },
 { label: 'Employees', href: `/employees?role=${activeRole}` },
 ]}
 isLive={true}
 loading={false}
 error={null}
 />

 {/* KPI row */}
 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Total Points Awarded</p>
 <p className="mt-2 text-2xl font-semibold text-amber-400">{totalPoints.toLocaleString()}</p>
 <p className="mt-1 text-xs text-slate-500">Across all teams</p>
 </GlassCard>
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Badges Unlocked</p>
 <p className="mt-2 text-2xl font-semibold text-violet-400">{totalBadges}</p>
 <p className="mt-1 text-xs text-slate-500">6 distinct badge types</p>
 </GlassCard>
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Platinum Members</p>
 <p className="mt-2 text-2xl font-semibold text-cyan-400">{platinumCnt}</p>
 <p className="mt-1 text-xs text-slate-500">Top tier achievers</p>
 </GlassCard>
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Engagement Score</p>
 <p className="mt-2 text-2xl font-semibold text-emerald-400">
 {ranked.length > 0 ? Math.round(ranked.reduce((s, e) => s + e.score, 0) / ranked.length) : 0}%
 </p>
 <p className="mt-1 text-xs text-slate-500">Live team average</p>
 </GlassCard>
 </section>

 {/* Trend + Badges */}
 <section className="grid gap-4 xl:grid-cols-3">
 <div className="xl:col-span-2">
 <TrendAreaChart title="Monthly Engagement Score Trend" color="#a78bfa" data={engagementTrend} />
 </div>

 {/* Badge showcase */}
 <GlassCard>
 <p className="text-sm font-semibold text-white mb-3">Badge Gallery</p>
 <div className="grid grid-cols-2 gap-2">
 {BADGES.map((badge) => (
 <div
 key={badge.name}
 className="group relative rounded-xl border border-white/5 bg-white/5 p-2 hover:bg-white/10 transition-colors cursor-default"
 title={badge.desc}
 >
 <div className={`mb-1 h-1 w-full rounded-full bg-gradient-to-r ${RARITY_COLOR[badge.rarity]}`} />
 <div className="flex items-center gap-1.5">
 <span className="text-xl">{badge.icon}</span>
 <div>
 <p className="text-[11px] font-medium text-white leading-tight">{badge.name}</p>
 <p className="text-[9px] text-slate-500">{badge.rarity}</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 </GlassCard>
 </section>

 {/* Leaderboard table */}
 <section>
 <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
 🏅 Team Leaderboard
 </h2>
 {ranked.length === 0 ? (
 <p className="text-xs text-slate-500 text-center py-8">No leaderboard data yet.</p>
 ) : (
 <SimpleTable
 rows={ranked.map((e) => ({
 ...e,
 rankLabel: e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : `#${e.rank}`,
 }))}
 columns={[
 { key: 'rankLabel', label: 'Rank' },
 { key: 'name', label: 'Team' },
 {
 key: 'points',
 label: 'Points',
 render: (row) => (
 <span className="font-semibold text-amber-400">{row.points.toLocaleString()}</span>
 ),
 },
 { key: 'badges', label: 'Badges' },
 {
 key: 'level',
 label: 'Level',
 render: (row) => (
 <span className={`font-semibold ${LEVEL_COLOR[row.level] ?? 'text-white'}`}>
 {row.level}
 </span>
 ),
 },
 ]}
 />
 )}
 </section>
 </div>
 );
}
