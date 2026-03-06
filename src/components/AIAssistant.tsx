import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../auth/AuthContext";

type Msg = {
  id: number;
  from: "user" | "bot";
  text: string;
  typing?: boolean;
};

const SUGGESTIONS = [
  "Leave balance",
  "Latest payslip",
  "HR policies",
  "Upcoming holidays",
  "My attendance",
  "Raise an expense",
];

function aiReply(input: string, userName: string): string {
  const q = input.toLowerCase();

  if (/\bhello\b|\bhi\b|\bhey\b|namaste|good (morning|afternoon|evening)/i.test(q)) {
    return `Hello ${userName.split(" ")[0]}! ðŸ‘‹ I'm your AI HR assistant. How can I help you today? You can ask me about leaves, payslips, attendance, HR policies, or anything else.`;
  }
  if (/leave balance|leaves left|how many leaves|remaining leave/i.test(q)) {
    return `Here's your current leave balance:\nâ€¢ Earned Leave: 12 days\nâ€¢ Casual Leave: 5 days\nâ€¢ Sick Leave: 3 days\nâ€¢ Optional Holiday: 2 days\n\nTotal available: **22 days**. Need to apply for leave? Visit the Attendance module.`;
  }
  if (/apply.*leave|leave.*apply|take.*leave/i.test(q)) {
    return `To apply for leave:\n1. Go to **Attendance & Leave** in the sidebar\n2. Click "Apply Leave"\n3. Select leave type, dates, and reason\n4. Submit for manager approval\n\nYour manager will be notified instantly.`;
  }
  if (/payslip|pay slip|salary slip|pay stub/i.test(q)) {
    return `Your latest payslip for **February 2026**:\n\nðŸ’° Gross Salary: â‚¹1,00,000\nâž– PF Deduction: â‚¹12,000\nâž– TDS: â‚¹2,580\nâœ… **Net Salary: â‚¹85,420**\n\nPayslip has been credited to your bank account. Download it from the Payroll module.`;
  }
  if (/attendance|present|absent|late|working days/i.test(q)) {
    return `Your attendance for **March 2026**:\n\nâœ… Present: 18 days\nâŒ Absent: 0 days\nâ° Late arrivals: 2 days\nðŸ  Work from Home: 3 days\n\nAttendance percentage: **92%** â€” Great work! ðŸŽ‰`;
  }
  if (/holiday|public holiday|day off/i.test(q)) {
    return `Upcoming holidays:\n\nðŸŽ‰ **Holi** â€” March 14, 2026 (Friday)\nðŸŽ‰ **Gudi Padwa** â€” March 30, 2026 (Monday)\nðŸŽ‰ **Good Friday** â€” April 3, 2026 (Friday)\nðŸŽ‰ **Ambedkar Jayanti** â€” April 14, 2026\n\nFull holiday calendar is in the Documents module.`;
  }
  if (/policy|policies|rules|hr rule|work from home|wfh/i.test(q)) {
    return `Key HR Policies:\n\nðŸ  **WFH Policy**: Up to 3 days/week for eligible roles\nâ° **Working Hours**: 9:30 AM â€“ 6:30 PM (flexible Â±1 hr)\nðŸ‘— **Dress Code**: Business casual Monâ€“Thu; Casual on Friday\nðŸ¤ **Notice Period**: 60 days for all confirmed employees\n\nFull policy handbook is available in the Documents module.`;
  }
  if (/expense|claim|reimbursement/i.test(q)) {
    return `Your expense summary:\n\nâ³ Pending claims: **2** (â‚¹4,500 total)\nâœ… Approved this month: **â‚¹8,200**\nâŒ Rejected: **0**\n\nTo submit a new claim, go to the **Expense Management** module. Claims above â‚¹10,000 need Finance approval.`;
  }
  if (/salary|ctc|package|compensation|hike|increment/i.test(q)) {
    return `Your current compensation:\n\nðŸ’¼ **CTC**: â‚¹12,00,000 per annum\nðŸ’µ Monthly gross: â‚¹1,00,000\nâœ… Net in-hand: ~â‚¹85,420/month\n\nðŸ”” Next appraisal cycle: **April 2026**. Your current performance rating is **4.2/5**. Visit Performance Management for more details.`;
  }
  if (/performance|rating|appraisal|review|okr|goal/i.test(q)) {
    return `Your performance snapshot:\n\nâ­ Current Rating: **4.2 / 5**\nðŸ“ˆ OKR Progress: **78%** on track\nðŸ’¬ 360Â° Feedback Score: **4.0 / 5**\nðŸ† Level: Gold (3,420 XP)\n\nNext review cycle starts April 2026. Check the **Performance** module for full details.`;
  }
  if (/team|colleagues|employees|headcount/i.test(q)) {
    return `Company headcount at a glance:\n\nðŸ‘¥ Total Employees: **142**\nâœ… Active: **138**\nðŸš€ New joiners this month: **4**\nðŸ“‹ Open positions: **8**\n\nDetailed org chart is available in the **Employees** module.`;
  }
  if (/training|course|learning|lms|certification/i.test(q)) {
    return `Your learning dashboard:\n\nðŸ“š Enrolled courses: **3**\nâœ… Completed: **7** total\nðŸ… Certificates earned: **5**\n\nðŸ”¥ Recommended for you: **"Advanced React Patterns"** and **"Leadership Essentials"**\n\nVisit the **Learning Management** module to continue your learning journey.`;
  }
  if (/onboarding|new joiner|joining/i.test(q)) {
    return `Onboarding assistance:\n\nðŸ“‹ Your onboarding checklist is **85% complete**.\n\nPending tasks:\nâ€¢ Bank account verification\nâ€¢ IT equipment acknowledgement\n\nVisit the **Onboarding** module to complete pending steps or contact HR at hr@akuldravin.com.`;
  }
  if (/document|letter|certificate|offer letter|appointment/i.test(q)) {
    return `Available documents for you:\n\nðŸ“„ Offer Letter â€” Issued Jan 2026\nðŸ“„ Appointment Letter â€” Issued Feb 2026\nðŸ“„ Payslips (last 12 months)\nðŸ“„ Form 16 (FY 2025-26 â€” available Apr 2026)\n\nAll documents are downloadable from the **Document Management** module.`;
  }
  if (/help|\?$|what can you|options|menu/i.test(q)) {
    return `I can help you with:\n\nðŸ“… **Leave** â€” balance, application, approval status\nðŸ’° **Payroll** â€” payslips, salary info, deductions\nâ±ï¸ **Attendance** â€” daily/monthly records\nðŸ“‹ **HR Policies** â€” WFH, dress code, notice period\nðŸŽ‰ **Holidays** â€” upcoming public holidays\nðŸ§¾ **Expenses** â€” claims, reimbursements\nðŸ“ˆ **Performance** â€” ratings, OKRs, appraisals\nðŸ“š **Learning** â€” courses, certifications\n\nJust type your question naturally!`;
  }
  if (/thank|thanks|great|awesome|perfect|ok\b|okay|got it/i.test(q)) {
    return `You're welcome! ðŸ˜Š Is there anything else I can help you with? Type "help" anytime to see what I can do.`;
  }
  // Default
  return `I'm not sure I fully understood that. Here are some things I can help with:\n\nâ€¢ Type **"leave balance"** â€” check remaining leaves\nâ€¢ Type **"payslip"** â€” view your latest payslip\nâ€¢ Type **"attendance"** â€” this month's attendance\nâ€¢ Type **"HR policy"** â€” company policies\nâ€¢ Type **"holidays"** â€” upcoming public holidays\n\nOr type **"help"** to see all options.`;
}

let msgCounter = 0;

function makeMsg(from: "user" | "bot", text: string, typing = false): Msg {
  return { id: ++msgCounter, from, text, typing };
}

export default function AIAssistant() {
  const auth = useContext(AuthContext);
  const userName = auth?.session?.user.name ?? "there";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    makeMsg("bot", `Hi ${userName.split(" ")[0]}! ðŸ‘‹ I'm your AI HR assistant. Ask me about leaves, payslips, policies, or anything else.\n\nOr pick a quick option below:`),
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    setMessages((prev) => [...prev, makeMsg("user", trimmed)]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const reply = aiReply(trimmed, userName);
      setTyping(false);
      setMessages((prev) => [...prev, makeMsg("bot", reply)]);
    }, 950);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  // Format bot text: **bold**, newlines
  function formatText(text: string) {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
          )}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="AI HR Assistant"
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 1000,
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: open
            ? "linear-gradient(135deg, #7a5c1e, var(--gold))"
            : "linear-gradient(135deg, var(--gold), #7a5c1e)",
          border: "none",
          boxShadow: "0 4px 20px rgba(210,174,82,0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.3rem",
          transition: "all 0.2s ease",
          color: "#000",
        }}
      >
        {open ? "âœ•" : "âœ¦"}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 92,
            right: 28,
            zIndex: 1000,
            width: 360,
            maxHeight: 520,
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-panel)",
            border: "1px solid var(--border-gold)",
            borderRadius: 16,
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #2a0a15, #4a1023)",
            borderBottom: "1px solid var(--border-gold)",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--gold), #7a5c1e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              color: "#000",
              fontWeight: 800,
              flexShrink: 0,
            }}>âœ¦</div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)" }}>AI HR Assistant</p>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--green)" }}>â— Online â€” powered by Akul Dravin AI</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 14px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            scrollbarWidth: "thin",
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div style={{
                  maxWidth: "85%",
                  padding: "10px 13px",
                  borderRadius: msg.from === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: msg.from === "user"
                    ? "linear-gradient(135deg, var(--gold), #7a5c1e)"
                    : "rgba(255,255,255,0.05)",
                  border: msg.from === "bot" ? "1px solid var(--border)" : "none",
                  color: msg.from === "user" ? "#000" : "var(--text-main)",
                  fontSize: "0.82rem",
                  lineHeight: 1.55,
                  fontWeight: msg.from === "user" ? 600 : 400,
                }}>
                  {formatText(msg.text)}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "10px 16px",
                  borderRadius: "14px 14px 14px 4px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  gap: 5,
                  alignItems: "center",
                }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--gold)",
                        display: "inline-block",
                        animation: "ai-dot 1.2s infinite",
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick suggestions â€” only after first bot message */}
            {messages.length === 1 && !typing && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      fontSize: "0.72rem",
                      padding: "5px 11px",
                      borderRadius: 20,
                      border: "1px solid var(--border-gold)",
                      background: "rgba(210,174,82,0.08)",
                      color: "var(--gold)",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              borderTop: "1px solid var(--border)",
              padding: "10px 12px",
              display: "flex",
              gap: 8,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anythingâ€¦"
              disabled={typing}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: "0.82rem",
                color: "var(--text-main)",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              style={{
                background: input.trim() && !typing
                  ? "linear-gradient(135deg, var(--gold), #7a5c1e)"
                  : "rgba(255,255,255,0.08)",
                border: "none",
                borderRadius: 10,
                width: 36,
                height: 36,
                cursor: input.trim() && !typing ? "pointer" : "default",
                color: input.trim() && !typing ? "#000" : "var(--text-dim)",
                fontWeight: 800,
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              âž¤
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes ai-dot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}



