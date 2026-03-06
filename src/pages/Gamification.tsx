import { useState } from "react";

type Level = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

type Player = {
  rank: number;
  employee: string;
  dept: string;
  level: Level;
  xp: number;
  points: number;
  badges: number;
};

type Activity = {
  employee: string;
  action: string;
  points: number;
  time: string;
};

type Reward = {
  id: number;
  title: string;
  category: string;
  points: number;
  icon: string;
  available: number;
  premium: boolean;
};

const REWARDS: Reward[] = [
  { id: 1,  title: "Amazon Gift Card ₹500",   category: "Shopping", points: 500,   icon: "🛍️", available: 999, premium: false },
  { id: 2,  title: "Zomato Pro 3 months",     category: "Food",     points: 300,   icon: "🍔",  available: 50,  premium: false },
  { id: 3,  title: "Netflix 1-Month",         category: "OTT",      points: 800,   icon: "🎬",  available: 30,  premium: false },
  { id: 4,  title: "Extra Leave Day",         category: "Wellness", points: 2000,  icon: "🌴",  available: 10,  premium: false },
  { id: 5,  title: "Skill Course Voucher",    category: "Learning", points: 1500,  icon: "🎓",  available: 20,  premium: false },
  { id: 6,  title: "Branded Merchandise Kit", category: "Swag",    points: 800,   icon: "👕",  available: 40,  premium: false },
  { id: 7,  title: "Apple AirPods Pro",       category: "Gadgets",  points: 15000, icon: "🎧",  available: 5,   premium: true  },
  { id: 8,  title: "Goa Weekend Trip",        category: "Travel",   points: 25000, icon: "✈️",  available: 3,   premium: true  },
  { id: 9,  title: "MacBook Sleeve + Bag",    category: "Gadgets",  points: 5000,  icon: "💻",  available: 15,  premium: false },
  { id: 10, title: "Spa & Wellness Day",      category: "Wellness", points: 3000,  icon: "🧘",  available: 8,   premium: false },
  { id: 11, title: "Kindle Paperwhite",       category: "Gadgets",  points: 12000, icon: "📚",  available: 6,   premium: true  },
  { id: 12, title: "Team Lunch Voucher ₹2K", category: "Food",     points: 2500,  icon: "🥂",  available: 25,  premium: false },
];

const PLAYERS: Player[] = [
  { rank: 1, employee: "Ananya Roy",   dept: "Design",      level: "Diamond",  xp: 9840, points: 14200, badges: 18 },
  { rank: 2, employee: "Priya Nair",   dept: "Engineering", level: "Platinum", xp: 8210, points: 11800, badges: 14 },
  { rank: 3, employee: "Nisha Verma",  dept: "HR",          level: "Platinum", xp: 7650, points: 10400, badges: 12 },
  { rank: 4, employee: "Rahul Mehta",  dept: "Finance",     level: "Gold",     xp: 6200, points: 8900,  badges: 9  },
  { rank: 5, employee: "Vikram Singh", dept: "Sales",       level: "Gold",     xp: 5800, points: 8100,  badges: 8  },
  { rank: 6, employee: "Samar Kapoor", dept: "Engineering", level: "Silver",   xp: 3400, points: 4800,  badges: 5  },
  { rank: 7, employee: "Divya Sharma", dept: "Product",     level: "Bronze",   xp: 1200, points: 1600,  badges: 2  },
];

const ACTIVITIES: Activity[] = [
  { employee: "Ananya Roy",   action: "Completed React Advanced certification",          points: 150, time: "2h ago" },
  { employee: "Priya Nair",   action: "Achieved Sprint Goal — 5 consecutive sprints",   points: 100, time: "4h ago" },
  { employee: "Nisha Verma",  action: "Referred Samar Kapoor — successfully joined",    points: 200, time: "1d ago" },
  { employee: "Rahul Mehta",  action: "Submitted Q4 financial report 3 days early",     points: 80,  time: "1d ago" },
  { employee: "Vikram Singh", action: "Hit monthly sales target — 118% of quota",       points: 300, time: "2d ago" },
  { employee: "Ananya Roy",   action: "Gave 10 peer feedbacks this month",               points: 50,  time: "2d ago" },
];

const LEVEL_CONFIG: Record<Level, { color: string; bg: string; min: number; max: number }> = {
  Bronze:   { color: "#cd7f32", bg: "rgba(205,127,50,0.15)",   min: 0,     max: 2000  },
  Silver:   { color: "#c0c0c0", bg: "rgba(192,192,192,0.12)",  min: 2001,  max: 5000  },
  Gold:     { color: "#d2ae52", bg: "rgba(210,174,82,0.15)",   min: 5001,  max: 8000  },
  Platinum: { color: "#b97a93", bg: "rgba(185,122,147,0.16)",  min: 8001,  max: 11000 },
  Diamond:  { color: "#d99fb2", bg: "rgba(217,159,178,0.2)",   min: 11001, max: 99999 },
};

export default function Gamification() {
  const [redeemed, setRedeemed] = useState<Set<number>>(new Set());
  const totalPoints = PLAYERS.reduce((s, p) => s + p.points, 0);
  const totalBadges = PLAYERS.reduce((s, p) => s + p.badges, 0);

  function handleRedeem(id: number) {
    setRedeemed((prev) => new Set([...prev, id]));
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Gamification Engine</h1>
        <p className="page-sub">Bronze → Silver → Gold → Platinum → Diamond · Points · Leaderboard · Rewards</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Points Awarded</p>
          <p className="stat-value">{totalPoints.toLocaleString("en-IN")}</p>
          <p className="stat-note">This financial year</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Active Players</p>
          <p className="stat-value">{PLAYERS.length}</p>
          <p className="stat-note">Employees on leaderboard</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Badges Earned</p>
          <p className="stat-value stat-green">{totalBadges}</p>
          <p className="stat-note">Achievement badges total</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Top Department</p>
          <p className="stat-value" style={{ fontSize: "1.3rem" }}>Design</p>
          <p className="stat-note">Highest avg team score</p>
        </div>
      </div>

      {/* Level Legend */}
      <div className="section-block">
        <div className="section-head">
          <h2>Level System</h2>
          <p>Five tiers of achievement. Each level unlocks premium benefits and rewards.</p>
        </div>
        <div className="level-legend">
          {(Object.entries(LEVEL_CONFIG) as [Level, typeof LEVEL_CONFIG[Level]][]).map(([level, cfg]) => (
            <div key={level} className="level-tile" style={{ borderColor: cfg.color, background: cfg.bg }}>
              <span className="level-name" style={{ color: cfg.color }}>{level}</span>
              <span className="level-range">{cfg.min.toLocaleString()} — {cfg.max === 99999 ? "∞" : cfg.max.toLocaleString()} XP</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="section-block">
        <div className="section-head">
          <h2>Leaderboard</h2>
          <p>Company-wide rankings updated in real-time.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Level</th>
              <th>XP</th>
              <th>Points</th>
              <th>Badges</th>
            </tr>
          </thead>
          <tbody>
            {PLAYERS.map((p) => {
              const cfg = LEVEL_CONFIG[p.level];
              return (
                <tr key={p.rank}>
                  <td>
                    <span className={`rank-badge ${p.rank <= 3 ? "rank-top" : ""}`}>#{p.rank}</span>
                  </td>
                  <td>{p.employee}</td>
                  <td>{p.dept}</td>
                  <td>
                    <span className="level-chip" style={{ color: cfg.color, borderColor: cfg.color, background: cfg.bg }}>
                      {p.level}
                    </span>
                  </td>
                  <td className="mono">{p.xp.toLocaleString()}</td>
                  <td className="mono" style={{ color: "var(--gold-soft)", fontWeight: 700 }}>
                    {p.points.toLocaleString()}
                  </td>
                  <td className="mono">{p.badges}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Reward Marketplace */}
      <div className="section-block">
        <div className="section-head">
          <h2>Reward Marketplace</h2>
          <p>Redeem your points for premium perks, experiences, and gadgets.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 8 }}>
          {REWARDS.map((r) => (
            <div key={r.id} style={{
              background: r.premium ? "linear-gradient(135deg, rgba(210,174,82,0.08), rgba(210,174,82,0.03))" : "var(--bg-panel)",
              border: `1px solid ${r.premium ? "var(--border-gold)" : "var(--border)"}`,
              borderRadius: "var(--radius)",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              position: "relative",
            }}>
              {r.premium && (
                <span style={{ position: "absolute", top: 8, right: 10, fontSize: "0.62rem", color: "var(--gold)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>★ Premium</span>
              )}
              <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>{r.icon}</span>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.82rem", color: "var(--text-main)", paddingRight: r.premium ? 52 : 0 }}>{r.title}</p>
              <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", background: "var(--bg-surface)", borderRadius: 4, padding: "1px 6px", width: "fit-content" }}>{r.category}</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: "var(--gold-soft)", fontSize: "0.88rem" }}>{r.points.toLocaleString()} pts</span>
                <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>{redeemed.has(r.id) ? "Redeemed ✓" : `${r.available} left`}</span>
              </div>
              <button
                style={{
                  marginTop: 4,
                  background: redeemed.has(r.id) ? "rgba(64,183,126,0.2)" : "linear-gradient(135deg, var(--gold), #7a5c1e)",
                  border: redeemed.has(r.id) ? "1px solid #40b77e" : "none",
                  borderRadius: 6,
                  color: redeemed.has(r.id) ? "#40b77e" : "#000",
                  fontWeight: 700,
                  fontSize: "0.74rem",
                  padding: "5px 0",
                  cursor: redeemed.has(r.id) ? "default" : "pointer",
                  width: "100%",
                }}
                onClick={() => !redeemed.has(r.id) && handleRedeem(r.id)}
              >
                {redeemed.has(r.id) ? "✓ Redeemed" : "Redeem"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="section-block">
        <div className="section-head">
          <h2>Recent Activity</h2>
          <p>Latest points-earning actions across the company.</p>
        </div>
        <div className="activity-feed">
          {ACTIVITIES.map((act, i) => (
            <div key={i} className="activity-item">
              <div className="activity-avatar">{act.employee.charAt(0)}</div>
              <div className="activity-body">
                <p className="activity-employee">{act.employee}</p>
                <p className="activity-action">{act.action}</p>
              </div>
              <div className="activity-right">
                <span className="activity-points">+{act.points} pts</span>
                <span className="activity-time">{act.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
