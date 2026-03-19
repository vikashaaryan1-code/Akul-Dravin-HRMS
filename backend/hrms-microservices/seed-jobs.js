const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4200/api/v1';

const sampleJobs = [
  {
    companyId: '00000000-0000-0000-0000-000000000000',
    title: 'Senior Full Stack Developer',
    description: 'We are seeking an experienced Full Stack Developer to join our growing team. You will work on cutting-edge web applications using modern technologies. Responsibilities include designing and implementing scalable solutions, collaborating with cross-functional teams, and mentoring junior developers.',
    location: 'Remote',
    employmentType: 'Full-time',
    experienceLevel: 'Senior',
    salaryMin: 120000,
    salaryMax: 160000,
    skills: 'JavaScript, TypeScript, React, Node.js, PostgreSQL, AWS',
    openings: 2,
    closingDate: '2024-12-31',
    status: 'open'
  },
  {
    companyId: '00000000-0000-0000-0000-000000000000',
    title: 'Product Manager',
    description: 'Join our product team to drive the vision and strategy for our HRMS platform. You will work closely with engineering, design, and business teams to deliver exceptional user experiences. Strong analytical skills and experience in SaaS products required.',
    location: 'Hybrid - New York',
    employmentType: 'Full-time',
    experienceLevel: 'Mid-level',
    salaryMin: 100000,
    salaryMax: 140000,
    skills: 'Product Strategy, Agile, User Research, Data Analysis, Roadmap Planning',
    openings: 1,
    closingDate: '2024-11-30',
    status: 'open'
  },
  {
    companyId: '00000000-0000-0000-0000-000000000000',
    title: 'UI/UX Designer',
    description: 'We are looking for a creative UI/UX Designer to craft beautiful and intuitive user interfaces. You will be responsible for the entire design process from research to final implementation. Experience with design systems and modern design tools is essential.',
    location: 'Remote',
    employmentType: 'Full-time',
    experienceLevel: 'Mid-level',
    salaryMin: 80000,
    salaryMax: 110000,
    skills: 'Figma, Adobe XD, User Research, Prototyping, Design Systems, HTML/CSS',
    openings: 1,
    closingDate: '2024-12-15',
    status: 'open'
  },
  {
    companyId: '00000000-0000-0000-0000-000000000000',
    title: 'DevOps Engineer',
    description: 'Join our infrastructure team to build and maintain scalable cloud infrastructure. You will work with Kubernetes, Docker, and CI/CD pipelines to ensure reliable deployments. Experience with AWS and infrastructure as code is required.',
    location: 'Remote',
    employmentType: 'Full-time',
    experienceLevel: 'Senior',
    salaryMin: 110000,
    salaryMax: 150000,
    skills: 'AWS, Kubernetes, Docker, Terraform, CI/CD, Linux, Python',
    openings: 1,
    closingDate: '2024-12-20',
    status: 'open'
  },
  {
    companyId: '00000000-0000-0000-0000-000000000000',
    title: 'Data Analyst',
    description: 'We are seeking a Data Analyst to help us make data-driven decisions. You will analyze user behavior, create dashboards, and provide insights to improve our product. Strong SQL skills and experience with BI tools required.',
    location: 'Hybrid - San Francisco',
    employmentType: 'Full-time',
    experienceLevel: 'Entry-level',
    salaryMin: 70000,
    salaryMax: 95000,
    skills: 'SQL, Python, Tableau, Excel, Statistics, Data Visualization',
    openings: 1,
    closingDate: '2024-12-10',
    status: 'open'
  },
  {
    companyId: '00000000-0000-0000-0000-000000000000',
    title: 'Customer Success Manager',
    description: 'Help our customers succeed with our HRMS platform. You will onboard new clients, provide training, and ensure customer satisfaction. Excellent communication skills and experience in SaaS customer success required.',
    location: 'Remote',
    employmentType: 'Full-time',
    experienceLevel: 'Mid-level',
    salaryMin: 75000,
    salaryMax: 100000,
    skills: 'Customer Success, SaaS, Communication, Training, CRM, Problem Solving',
    openings: 2,
    closingDate: '2024-12-25',
    status: 'open'
  },
  {
    companyId: '00000000-0000-0000-0000-000000000000',
    title: 'QA Engineer',
    description: 'Join our quality assurance team to ensure our platform meets the highest standards. You will design test plans, automate tests, and work closely with developers to identify and fix issues. Experience with test automation frameworks required.',
    location: 'Remote',
    employmentType: 'Full-time',
    experienceLevel: 'Mid-level',
    salaryMin: 85000,
    salaryMax: 115000,
    skills: 'Test Automation, Selenium, Jest, Cypress, API Testing, Agile',
    openings: 1,
    closingDate: '2024-12-18',
    status: 'open'
  },
  {
    companyId: '00000000-0000-0000-0000-000000000000',
    title: 'Marketing Intern',
    description: 'Gain hands-on experience in B2B SaaS marketing. You will assist with content creation, social media management, and campaign execution. This is a great opportunity for students or recent graduates looking to start their marketing career.',
    location: 'Remote',
    employmentType: 'Internship',
    experienceLevel: 'Entry-level',
    salaryMin: 20000,
    salaryMax: 30000,
    skills: 'Content Writing, Social Media, Marketing, Communication, Creativity',
    openings: 2,
    closingDate: '2024-11-25',
    status: 'open'
  }
];

async function seedJobs() {
  console.log('🌱 Starting job seeding...\n');

  for (const job of sampleJobs) {
    try {
      const response = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(job),
      });

      if (response.ok) {
        const created = await response.json();
        console.log(`✅ Created: ${job.title} (${created.id})`);
      } else {
        console.error(`❌ Failed to create: ${job.title}`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${job.title}:`, error.message);
    }
  }

  console.log('\n✨ Job seeding completed!');
  console.log(`📊 Total jobs created: ${sampleJobs.length}`);
  console.log('\n🌐 Visit http://localhost:3000 to see the jobs on the homepage');
}

seedJobs();
