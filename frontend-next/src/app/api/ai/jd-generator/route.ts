import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ai/jd-generator
 * Generates professional Job Descriptions from minimal input.
 *
 * Body: { title, department, experience, skills[], location, jobType, companyName? }
 */

interface JDInput {
  title: string;
  department?: string;
  experience?: string;
  skills?: string[];
  location?: string;
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  companyName?: string;
  salaryRange?: string;
  remotePolicy?: 'on-site' | 'remote' | 'hybrid';
}

function generateJobDescription(input: JDInput): string {
  const {
    title,
    department = 'Engineering',
    experience = '2-4 years',
    skills = [],
    location = 'India',
    jobType = 'full-time',
    companyName = 'Akul Dravin Technologies',
    salaryRange,
    remotePolicy = 'hybrid',
  } = input;

  const skillsList = skills.length > 0 ? skills : ['Problem-solving', 'Communication', 'Team collaboration'];
  const remotePolicyLabel = {
    'on-site': 'On-site',
    'remote': 'Fully Remote',
    'hybrid': 'Hybrid (3 days office)',
  }[remotePolicy];

  return `
## ${title}

**Company:** ${companyName}
**Department:** ${department}
**Location:** ${location}
**Work Mode:** ${remotePolicyLabel}
**Employment Type:** ${jobType.charAt(0).toUpperCase() + jobType.slice(1)}
**Experience:** ${experience}
${salaryRange ? `**Compensation:** ${salaryRange}` : ''}

---

### About the Role

We are looking for a talented **${title}** to join our growing ${department} team at ${companyName}. This is an exciting opportunity to work on cutting-edge enterprise solutions that impact millions of users. You will collaborate with a passionate team and have the opportunity to shape the future of our platform.

---

### Key Responsibilities

• Design, develop, and maintain scalable ${title.toLowerCase()} solutions
• Collaborate with cross-functional teams including Product, Design, and QA
• Participate in code reviews, architecture discussions, and technical planning
• Identify performance bottlenecks and implement optimization strategies
• Write clean, well-documented code following best practices
• Contribute to technical documentation and knowledge sharing
• Mentor junior team members and support their growth
• Stay updated with industry trends and emerging technologies relevant to your domain

---

### Required Qualifications

• ${experience} of hands-on experience in a ${title} role or similar
• Strong proficiency in: ${skillsList.slice(0, 5).join(', ')}
• Proven track record of delivering high-quality solutions in a fast-paced environment
• Excellent problem-solving skills and analytical thinking
• Strong communication and collaboration abilities
• Experience working in Agile/Scrum environments

---

### Technical Skills

**Must Have:**
${skillsList.slice(0, Math.ceil(skillsList.length / 2)).map(s => `• ${s}`).join('\n')}

**Nice to Have:**
${skillsList.slice(Math.ceil(skillsList.length / 2)).map(s => `• ${s}`).join('\n') || '• Experience with cloud platforms (AWS/GCP/Azure)\n• Open-source contributions\n• Knowledge of enterprise software architecture'}

---

### What We Offer

• Competitive compensation package ${salaryRange ? `(${salaryRange})` : ''}
• Comprehensive health insurance (self + family)
• 30 days paid leave + holidays
• Learning & development budget (₹50,000/year)
• ${remotePolicyLabel} work policy
• Employee Stock Option Plan (ESOP) for senior roles
• World-class tools and infrastructure
• Fast-paced, innovation-driven culture
• Direct impact on a platform used by enterprise teams

---

### About ${companyName}

${companyName} is building the world's most advanced AI-first HRMS platform. We are a team of passionate engineers, designers, and HR domain experts working together to redefine how organizations manage their most valuable asset — their people.

---

*${companyName} is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all employees.*
  `.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json(
        { error: 'Job title is required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const input: JDInput = {
      title: String(body.title).replace(/<[^>]*>/g, '').trim().slice(0, 100),
      department: body.department ? String(body.department).replace(/<[^>]*>/g, '').trim() : undefined,
      experience: body.experience ? String(body.experience).trim() : undefined,
      skills: Array.isArray(body.skills)
        ? body.skills.slice(0, 20).map((s: unknown) => String(s).replace(/<[^>]*>/g, '').trim())
        : undefined,
      location: body.location ? String(body.location).replace(/<[^>]*>/g, '').trim() : undefined,
      jobType: ['full-time', 'part-time', 'contract', 'internship'].includes(body.jobType)
        ? body.jobType
        : 'full-time',
      companyName: body.companyName ? String(body.companyName).replace(/<[^>]*>/g, '').trim() : undefined,
      salaryRange: body.salaryRange ? String(body.salaryRange).trim() : undefined,
      remotePolicy: ['on-site', 'remote', 'hybrid'].includes(body.remotePolicy)
        ? body.remotePolicy
        : 'hybrid',
    };

    // In production: call the FastAPI AI engine for LLM-powered JD generation
    // const aiResponse = await fetch(`${process.env.AI_ENGINE_URL}/jd-generate`, { ... });
    // For now: use high-quality template generation
    const jd = generateJobDescription(input);

    return NextResponse.json({
      success: true,
      jobDescription: jd,
      title: input.title,
      wordCount: jd.split(/\s+/).length,
      generatedAt: new Date().toISOString(),
      aiPowered: false, // Toggle to true when AI engine is connected
    });
  } catch (error) {
    console.error('[JD Generator] Error:', error);
    return NextResponse.json({ error: 'Failed to generate job description' }, { status: 500 });
  }
}
