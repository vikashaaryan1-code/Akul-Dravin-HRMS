# Job Board Feature - Complete Implementation Guide

## Overview

The Job Board feature provides a complete recruitment workflow from job posting to application management. It includes:

- **Public Job Listings** on the homepage
- **Application Flow** with authentication
- **Admin Dashboard** for job management
- **Application Review System** for HR teams
- **Webhook API** for automatic job posting

## User Flow

### 1. Public User (Job Seeker)

```
Homepage → View Jobs → Click Apply → Login/Signup → Fill Application → Submit → Confirmation
```

#### Steps:
1. Visit homepage at `http://localhost:3000`
2. Scroll to "Open Positions" section
3. Browse available jobs (shows up to 6 jobs)
4. Click "Apply Now" on desired position
5. Redirected to login page if not authenticated
6. After login, redirected to application form
7. Fill out application details:
   - Full Name
   - Email
   - Phone
   - Years of Experience
   - LinkedIn Profile (optional)
   - Portfolio URL (optional)
   - Cover Letter
   - Resume Upload (optional)
8. Submit application
9. See success confirmation
10. Automatically redirected to homepage

### 2. Admin/HR User

```
Login → Dashboard → Jobs/Applications → Manage → Review → Accept/Reject
```

#### Job Management:
1. Login at `http://localhost:3000/login`
2. Navigate to "Jobs" in sidebar
3. View all job postings with statistics
4. Click "Post Job" to create new opening
5. Fill job details and submit

#### Application Management:
1. Navigate to "Job Applications" in sidebar
2. View all applications with status filters
3. Filter by: All, Pending, Reviewed, Accepted, Rejected
4. Review application details
5. Update status:
   - Mark as Reviewed
   - Accept candidate
   - Reject candidate

## Features

### Homepage Job Board

**Location:** `frontend-next/src/components/landing/JobBoardSection.tsx`

**Features:**
- Displays up to 6 open positions
- Shows job title, description, location, type, salary
- Real-time data from backend API
- Loading states
- "Apply Now" button with authentication check
- "View All Openings" button

**API Endpoint:** `GET /api/v1/jobs?status=open`

### Job Application Form

**Location:** `frontend-next/src/app/job-application/page.tsx`

**Features:**
- Pre-filled job details
- Comprehensive application form
- Form validation
- Success confirmation screen
- Auto-redirect after submission

**API Endpoint:** `POST /api/v1/job-applications`

### Admin Job Management

**Location:** `frontend-next/src/app/(platform)/jobs/page.tsx`

**Features:**
- Job statistics dashboard
- Create new job postings
- View all jobs (open/closed)
- Job details display
- Status management

**API Endpoints:**
- `GET /api/v1/jobs` - List all jobs
- `POST /api/v1/jobs` - Create new job
- `PATCH /api/v1/jobs/:id` - Update job
- `DELETE /api/v1/jobs/:id` - Delete job

### Application Review System

**Location:** `frontend-next/src/app/(platform)/job-applications/page.tsx`

**Features:**
- Application statistics (Total, Pending, Reviewed, Accepted, Rejected)
- Status filters
- Detailed application view
- Contact information display
- LinkedIn/Portfolio links
- Status update actions
- Bulk review capabilities

**API Endpoints:**
- `GET /api/v1/job-applications` - List all applications
- `GET /api/v1/job-applications/:id` - Get single application
- `PATCH /api/v1/job-applications/:id` - Update application status

### Automatic Job Posting Webhook

**Location:** `backend/hrms-microservices/src/modules/webhook/`

**Features:**
- Secure API key authentication
- Automatic job creation
- External system integration
- Default value handling

**API Endpoint:** `POST /api/v1/webhooks/job-posting`

**Documentation:** See `WEBHOOK_API_DOCUMENTATION.md`

## Backend Structure

### Job Module
```
backend/hrms-microservices/src/modules/job/
├── job.controller.ts    # REST endpoints
├── job.service.ts       # Business logic
└── job.module.ts        # Module definition
```

### Job Application Module
```
backend/hrms-microservices/src/modules/job-application/
├── job-application.controller.ts
├── job-application.service.ts
└── job-application.module.ts
```

### Webhook Module
```
backend/hrms-microservices/src/modules/webhook/
├── webhook.controller.ts
└── webhook.module.ts
```

## Database Schema

### Jobs Table
```sql
- id (UUID, Primary Key)
- companyId (UUID, Foreign Key)
- title (VARCHAR)
- description (TEXT)
- location (VARCHAR)
- employmentType (VARCHAR)
- experienceLevel (VARCHAR)
- salaryMin (DECIMAL)
- salaryMax (DECIMAL)
- skills (TEXT)
- openings (INTEGER)
- closingDate (DATE)
- status (VARCHAR) - 'open', 'closed'
- postedDate (TIMESTAMP)
```

### Job Applications Table
```sql
- id (UUID, Primary Key)
- jobId (UUID, Foreign Key)
- fullName (VARCHAR)
- email (VARCHAR)
- phone (VARCHAR)
- experience (INTEGER)
- coverLetter (TEXT)
- linkedinUrl (VARCHAR)
- portfolioUrl (VARCHAR)
- status (VARCHAR) - 'pending', 'reviewed', 'accepted', 'rejected'
- appliedDate (TIMESTAMP)
```

## API Reference

### Jobs API

#### List Jobs
```http
GET /api/v1/jobs?status=open&companyId=uuid
```

#### Get Single Job
```http
GET /api/v1/jobs/:id
```

#### Create Job
```http
POST /api/v1/jobs
Content-Type: application/json

{
  "companyId": "uuid",
  "title": "Software Engineer",
  "description": "Job description...",
  "location": "Remote",
  "employmentType": "Full-time",
  "experienceLevel": "Mid-level",
  "salaryMin": 80000,
  "salaryMax": 120000,
  "skills": "JavaScript, React, Node.js",
  "openings": 2,
  "closingDate": "2024-12-31",
  "status": "open"
}
```

#### Update Job
```http
PATCH /api/v1/jobs/:id
Content-Type: application/json

{
  "status": "closed"
}
```

#### Delete Job
```http
DELETE /api/v1/jobs/:id
```

### Job Applications API

#### List Applications
```http
GET /api/v1/job-applications?jobId=uuid&status=pending
```

#### Get Single Application
```http
GET /api/v1/job-applications/:id
```

#### Create Application
```http
POST /api/v1/job-applications
Content-Type: application/json

{
  "jobId": "uuid",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "experience": 5,
  "coverLetter": "I am interested...",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "portfolioUrl": "https://johndoe.com",
  "status": "pending"
}
```

#### Update Application Status
```http
PATCH /api/v1/job-applications/:id
Content-Type: application/json

{
  "status": "accepted"
}
```

## Configuration

### Environment Variables

**Backend (.env):**
```env
WEBHOOK_API_KEY=your-secret-webhook-key
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=akul_dravin_hrms
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4200/api/v1
```

## Testing

### Manual Testing

1. **Test Job Posting:**
   ```bash
   curl -X POST http://localhost:4200/api/v1/jobs \
     -H "Content-Type: application/json" \
     -d '{
       "companyId": "00000000-0000-0000-0000-000000000000",
       "title": "Test Job",
       "description": "Test description",
       "location": "Remote",
       "employmentType": "Full-time",
       "status": "open"
     }'
   ```

2. **Test Application Submission:**
   - Visit homepage
   - Click "Apply Now" on any job
   - Complete the form
   - Verify submission success

3. **Test Admin Dashboard:**
   - Login as admin
   - Navigate to Jobs page
   - Create a new job
   - Navigate to Applications page
   - Review and update application status

### Webhook Testing

```bash
curl -X POST http://localhost:4200/api/v1/webhooks/job-posting \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-webhook-key" \
  -d '{
    "title": "Webhook Test Job",
    "description": "Posted via webhook",
    "location": "Remote"
  }'
```

## Deployment

### Production Checklist

- [ ] Set secure WEBHOOK_API_KEY
- [ ] Configure production database
- [ ] Enable HTTPS
- [ ] Set up email notifications for applications
- [ ] Configure file upload storage (S3, etc.)
- [ ] Set up rate limiting
- [ ] Enable application analytics
- [ ] Configure backup strategy

## Future Enhancements

1. **Email Notifications:**
   - Send confirmation email to applicants
   - Notify HR of new applications
   - Status update notifications

2. **Resume Parsing:**
   - AI-powered resume extraction
   - Auto-fill application fields

3. **Advanced Filtering:**
   - Search by skills
   - Salary range filters
   - Location-based search

4. **Application Tracking:**
   - Interview scheduling
   - Candidate pipeline
   - Communication history

5. **Analytics Dashboard:**
   - Application metrics
   - Time-to-hire tracking
   - Source tracking

## Support

For issues or questions:
- Check backend logs: `backend/hrms-microservices/logs/`
- Review API documentation: `WEBHOOK_API_DOCUMENTATION.md`
- Contact: support@akuldravin.com
