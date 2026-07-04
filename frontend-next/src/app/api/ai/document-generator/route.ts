import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ai/document-generator
 * Generates enterprise HR documents (offer letters, experience letters,
 * promotion letters, termination letters, salary summaries, etc.)
 *
 * Body: { type, employeeData, customInstructions? }
 */

const DOCUMENT_TEMPLATES: Record<string, (data: Record<string, string>) => string> = {
  offer_letter: (d) => `
OFFER LETTER

Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}

Dear ${d.candidateName || '[Candidate Name]'},

We are delighted to offer you the position of **${d.designation || '[Designation]'}** at **${d.companyName || 'Akul Dravin Technologies'}**.

COMPENSATION PACKAGE:
• Annual CTC: ₹${d.ctc || '[CTC]'}
• Basic Salary: ₹${d.basic || '[Basic]'} per month
• HRA: ₹${d.hra || '[HRA]'} per month
• Special Allowance: ₹${d.specialAllowance || '[Special Allowance]'} per month

JOINING DETAILS:
• Date of Joining: ${d.joiningDate || '[Joining Date]'}
• Department: ${d.department || '[Department]'}
• Reporting To: ${d.reportingManager || '[Reporting Manager]'}
• Location: ${d.location || '[Location]'}

This offer is subject to successful completion of background verification and document submission.

Please sign and return this letter by ${d.acceptanceDeadline || '[Acceptance Deadline]'} to confirm your acceptance.

We look forward to having you as part of our team.

Warm regards,
${d.hrName || 'HR Department'}
${d.companyName || 'Akul Dravin Technologies'}
  `.trim(),

  experience_letter: (d) => `
EXPERIENCE LETTER

Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}

To Whom It May Concern,

This is to certify that **${d.employeeName || '[Employee Name]'}** (Employee ID: ${d.employeeId || '[Employee ID]'}) was employed with **${d.companyName || 'Akul Dravin Technologies'}** from **${d.joiningDate || '[Joining Date]'}** to **${d.relievingDate || '[Relieving Date]'}** in the capacity of **${d.designation || '[Designation]'}**, Department: ${d.department || '[Department]'}.

During their tenure, ${d.employeeName?.split(' ')[0] || 'the employee'} demonstrated exceptional skills, dedication, and professionalism. They consistently met performance standards and contributed significantly to the team's objectives.

${d.employeeName?.split(' ')[0] || 'The employee'} is leaving the organization on their own accord and we wish them the very best in their future endeavors.

Authorized Signatory,
${d.hrName || 'HR Manager'}
${d.companyName || 'Akul Dravin Technologies'}
  `.trim(),

  promotion_letter: (d) => `
PROMOTION LETTER

Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}

Dear ${d.employeeName || '[Employee Name]'},

We are pleased to inform you that effective **${d.effectiveDate || '[Effective Date]'}**, you have been promoted to the position of **${d.newDesignation || '[New Designation]'}** in the ${d.department || '[Department]'} department.

This promotion reflects your outstanding performance, dedication, and the value you bring to our organization.

REVISED COMPENSATION:
• New Annual CTC: ₹${d.newCtc || '[New CTC]'}
• Effective Date: ${d.effectiveDate || '[Effective Date]'}

Your new responsibilities and KRAs will be shared by your manager separately. We are confident that you will continue to excel in your new role.

Congratulations on this well-deserved recognition!

Warm regards,
${d.hrName || 'HR Department'}
${d.companyName || 'Akul Dravin Technologies'}
  `.trim(),

  termination_letter: (d) => `
TERMINATION LETTER

Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
PRIVATE & CONFIDENTIAL

Dear ${d.employeeName || '[Employee Name]'},

This letter is to inform you that your employment with **${d.companyName || 'Akul Dravin Technologies'}** is terminated effective **${d.terminationDate || '[Termination Date]'}**.

Reason: ${d.reason || '[Reason for Termination]'}

SEPARATION TERMS:
• Last Working Day: ${d.lastWorkingDay || '[Last Working Day]'}
• Final Settlement: Will be processed within 30-45 working days
• Experience Certificate: Will be issued post clearance

Please complete the offboarding process, return company assets, and ensure knowledge transfer is completed before your last working day.

This letter is issued without prejudice to any other rights or remedies available to the company.

Regards,
${d.hrName || 'HR Department'}
${d.companyName || 'Akul Dravin Technologies'}
  `.trim(),

  salary_slip: (d) => `
PAYSLIP — ${d.month || new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}

Employee: ${d.employeeName || '[Employee Name]'}
Employee ID: ${d.employeeId || '[ID]'}
Designation: ${d.designation || '[Designation]'}
Department: ${d.department || '[Department]'}
Bank Account: XXXX${d.accountLast4 || 'XXXX'}

EARNINGS:
Basic Salary         ₹${d.basic || '0'}
House Rent Allowance ₹${d.hra || '0'}
Special Allowance    ₹${d.specialAllowance || '0'}
Medical Allowance    ₹${d.medical || '0'}
GROSS EARNINGS       ₹${d.gross || '0'}

DEDUCTIONS:
Provident Fund (12%) ₹${d.pf || '0'}
ESI (0.75%)          ₹${d.esi || '0'}
Professional Tax     ₹${d.pt || '0'}
TDS                  ₹${d.tds || '0'}
TOTAL DEDUCTIONS     ₹${d.totalDeductions || '0'}

NET PAY              ₹${d.netPay || '0'}

This is a computer-generated payslip and does not require a signature.
  `.trim(),
};

export async function POST(req: NextRequest) {
  try {
    const { type, employeeData = {}, customInstructions } = await req.json();

    // Validate document type
    if (!type || !DOCUMENT_TEMPLATES[type]) {
      return NextResponse.json(
        {
          error: 'Invalid document type',
          validTypes: Object.keys(DOCUMENT_TEMPLATES),
        },
        { status: 400 }
      );
    }

    // Sanitize employee data (prevent XSS via document injection)
    const sanitizedData: Record<string, string> = {};
    for (const [key, value] of Object.entries(employeeData)) {
      if (typeof value === 'string') {
        sanitizedData[key] = value.replace(/<[^>]*>/g, '').trim();
      }
    }

    // Generate document from template
    let document = DOCUMENT_TEMPLATES[type](sanitizedData);

    // Apply custom instructions if provided
    if (customInstructions) {
      // In production, this would call the AI engine for custom refinement
      // For now, append custom notes
      document += `\n\nAdditional Notes: ${customInstructions.replace(/<[^>]*>/g, '').trim()}`;
    }

    return NextResponse.json(
      {
        success: true,
        document,
        type,
        generatedAt: new Date().toISOString(),
        wordCount: document.split(/\s+/).length,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('[AI Document Generator] Error:', error);
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 });
  }
}
