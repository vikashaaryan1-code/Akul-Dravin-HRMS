import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ai/interview-questions
 * Generates role-specific interview questions with answers & evaluation criteria.
 *
 * Body: { title, level, skills[], round, count? }
 */

const QUESTION_BANKS: Record<string, Record<string, string[]>> = {
  technical: {
    default: [
      'Walk me through your most complex technical project. What were the key architectural decisions?',
      'How do you approach debugging a production issue with no logs available?',
      'Describe a time you improved system performance. What metrics improved?',
      'How do you ensure code quality in a fast-moving team?',
      'Explain your approach to system design for a high-traffic application.',
    ],
    frontend: [
      'Explain the difference between CSR, SSR, SSG, and ISR. When would you use each?',
      'How do you optimize Core Web Vitals (LCP, CLS, FID/INP)?',
      'Describe your approach to state management in large React applications.',
      'How do you handle accessibility (WCAG AA) in your components?',
      'Walk me through how you would implement an infinite scroll with virtualization.',
    ],
    backend: [
      'How do you design a rate limiting system for a public API?',
      'Explain your approach to database sharding vs partitioning.',
      'How do you handle distributed transactions across microservices?',
      'Describe your strategy for zero-downtime database migrations.',
      'How would you implement a job queue with retry logic and dead letter queues?',
    ],
    devops: [
      'Walk me through your CI/CD pipeline design philosophy.',
      'How do you implement blue-green vs canary deployments?',
      'Describe your approach to Kubernetes resource management and auto-scaling.',
      'How do you handle secrets management across environments?',
      'What is your observability strategy (logs, metrics, traces)?',
    ],
  },
  behavioral: {
    default: [
      'Tell me about a time you disagreed with your manager. How did you handle it?',
      'Describe a situation where you had to deliver under extreme time pressure.',
      'Give an example of how you handled a major technical failure in production.',
      'Tell me about a time you mentored someone and the impact it had.',
      'Describe a time you had to learn a completely new technology quickly. How did you approach it?',
      'Tell me about a project where you took initiative beyond your defined role.',
      'Describe a time you had to influence without authority to get something done.',
    ],
  },
  system_design: {
    default: [
      'Design a scalable notification system (email, SMS, push) for 10M+ users.',
      'Design a URL shortener service. How would you handle 100K requests/second?',
      'Design an HRMS payroll processing system for 500K employees.',
      'How would you design a real-time attendance tracking system with geo-fencing?',
      'Design a multi-tenant SaaS platform with data isolation guarantees.',
    ],
  },
  leadership: {
    default: [
      'How do you build and maintain high-performing engineering teams?',
      'Describe your approach to technical roadmap planning and prioritization.',
      'How do you balance technical debt with feature delivery?',
      'Tell me about a time you had to make a difficult people decision.',
      'How do you foster a culture of psychological safety and innovation?',
    ],
  },
};

function getQuestionsForRole(
  title: string,
  skills: string[],
  round: string,
  count: number
): { question: string; category: string; evaluationCriteria: string }[] {
  const lowerTitle = title.toLowerCase();
  const lowerRound = round.toLowerCase();

  let questionPool: string[] = [];
  let category = 'General';

  if (lowerRound.includes('technical') || lowerRound.includes('coding')) {
    category = 'Technical';
    if (lowerTitle.includes('frontend') || lowerTitle.includes('react') || lowerTitle.includes('ui')) {
      questionPool = [...QUESTION_BANKS.technical.frontend, ...QUESTION_BANKS.technical.default];
    } else if (lowerTitle.includes('backend') || lowerTitle.includes('node') || lowerTitle.includes('api')) {
      questionPool = [...QUESTION_BANKS.technical.backend, ...QUESTION_BANKS.technical.default];
    } else if (lowerTitle.includes('devops') || lowerTitle.includes('sre') || lowerTitle.includes('cloud')) {
      questionPool = [...QUESTION_BANKS.technical.devops, ...QUESTION_BANKS.technical.default];
    } else {
      questionPool = QUESTION_BANKS.technical.default;
    }
  } else if (lowerRound.includes('design') || lowerRound.includes('system')) {
    category = 'System Design';
    questionPool = QUESTION_BANKS.system_design.default;
  } else if (lowerRound.includes('leadership') || lowerRound.includes('managerial')) {
    category = 'Leadership';
    questionPool = QUESTION_BANKS.leadership.default;
  } else {
    category = 'Behavioral';
    questionPool = QUESTION_BANKS.behavioral.default;
  }

  // Add skill-specific questions
  const skillQuestions = skills.slice(0, 3).map(
    (skill) => `Can you walk me through a complex problem you solved using ${skill}? What approach did you take?`
  );
  questionPool = [...skillQuestions, ...questionPool];

  // Deduplicate and limit
  const unique = [...new Set(questionPool)].slice(0, count);

  const evaluationMap: Record<string, string> = {
    Technical: 'Depth of knowledge, practical application, problem decomposition, code quality awareness',
    'System Design': 'Scalability thinking, trade-off analysis, communication clarity, production experience',
    Leadership: 'People skills, strategic thinking, decision-making under ambiguity, team impact',
    Behavioral: 'STAR method usage, self-awareness, growth mindset, accountability',
    General: 'Communication, role relevance, cultural fit, enthusiasm',
  };

  return unique.map((question) => ({
    question,
    category,
    evaluationCriteria: evaluationMap[category] || evaluationMap.General,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const { title, level = 'mid', skills = [], round = 'behavioral', count = 5 } = await req.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Job title is required' }, { status: 400 });
    }

    const sanitizedTitle = title.replace(/<[^>]*>/g, '').trim().slice(0, 100);
    const sanitizedSkills = Array.isArray(skills)
      ? skills.slice(0, 10).map((s: unknown) => String(s).replace(/<[^>]*>/g, '').trim())
      : [];
    const questionCount = Math.min(Math.max(Number(count) || 5, 1), 15);

    const questions = getQuestionsForRole(sanitizedTitle, sanitizedSkills, String(round), questionCount);

    return NextResponse.json({
      success: true,
      role: sanitizedTitle,
      level,
      round,
      questions,
      totalGenerated: questions.length,
      interviewTips: [
        'Use the STAR method (Situation, Task, Action, Result) for behavioral questions',
        'Look for specific examples rather than general statements',
        'Probe deeper with "Why?" and "What would you do differently?" follow-ups',
        'Score each answer 1-5 on a rubric before the next question',
        'Allow 60-90 seconds of thinking time for system design questions',
      ],
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Interview Questions] Error:', error);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
