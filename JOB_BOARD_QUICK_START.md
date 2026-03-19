# Job Board Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Application

```bash
# From project root
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:4200/api/v1

### Step 2: Seed Sample Jobs

```bash
# Open new terminal
cd backend/hrms-microservices
node seed-jobs.js
```

You should see:
```
✅ Created: Senior Full Stack Developer
✅ Created: Product Manager
✅ Created: UI/UX Designer
...
✨ Job seeding completed!
```

### Step 3: View Jobs on Homepage

1. Open browser: http://localhost:3000
2. Scroll down to "Open Positions" section
3. You'll see 6 job listings with:
   - Job title
   - Description
   - Location
   - Employment type
   - Salary range
   - Apply button

### Step 4: Test Application Flow

1. Click "Apply Now" on any job
2. You'll be redirected to login page
3. Login with demo credentials:
   - Email: `admin@akuldravin.com`
   - Password: `password123`
   - Or click "Continue Demo"
4. Fill out the application form:
   - Full Name
   - Email
   - Phone
   - Years of Experience
   - LinkedIn (optional)
   - Portfolio (optional)
   - Cover Letter
5. Click "Submit Application"
6. See success confirmation ✅
7. Auto-redirected to homepage

### Step 5: Review Applications (Admin)

1. Login at http://localhost:3000/login
2. Select role: "Platform Admin"
3. Click "Continue Demo" or login
4. In sidebar, find "Job Applications"
5. You'll see:
   - Application statistics
   - Filter buttons (All, Pending, Reviewed, Accepted, Rejected)
   - List of all applications
6. Click status buttons to:
   - Mark as Reviewed
   - Accept candidate
   - Reject candidate

### Step 6: Manage Jobs (Admin)

1. In sidebar, click "Jobs"
2. View job statistics:
   - Total Jobs
   - Open Positions
   - Closed
3. Click "Post Job" to create new opening
4. Fill job details and submit

## 🎯 Key Features

### For Job Seekers
- Browse open positions on homepage
- Easy application process
- No account needed to browse
- Account required to apply

### For Admins/HR
- Post new jobs
- Review applications
- Update application status
- View statistics

### For Developers
- Webhook API for auto-posting
- RESTful API endpoints
- Complete documentation

## 📝 Quick Commands

```bash
# Start everything
npm run dev

# Seed jobs
cd backend/hrms-microservices && node seed-jobs.js

# Test webhook
curl -X POST http://localhost:4200/api/v1/webhooks/job-posting \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-webhook-key" \
  -d '{"title":"Test Job","description":"Test","location":"Remote"}'
```

## 🔗 Important URLs

- **Homepage**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Jobs Admin**: http://localhost:3000/dashboard (then click Jobs)
- **Applications Admin**: http://localhost:3000/dashboard (then click Job Applications)
- **API Base**: http://localhost:4200/api/v1

## 📚 Documentation

- **Complete Guide**: [JOB_BOARD_FEATURE.md](JOB_BOARD_FEATURE.md)
- **Webhook API**: [WEBHOOK_API_DOCUMENTATION.md](WEBHOOK_API_DOCUMENTATION.md)
- **Implementation Summary**: [JOB_BOARD_IMPLEMENTATION_SUMMARY.md](JOB_BOARD_IMPLEMENTATION_SUMMARY.md)

## ✅ Verification Checklist

- [ ] Backend running on port 4200
- [ ] Frontend running on port 3000
- [ ] Sample jobs seeded
- [ ] Jobs visible on homepage
- [ ] Can click "Apply Now"
- [ ] Redirects to login
- [ ] Application form works
- [ ] Success confirmation shows
- [ ] Admin can view applications
- [ ] Admin can update status

## 🐛 Troubleshooting

**Jobs not showing on homepage?**
- Check backend is running: http://localhost:4200/api/v1/jobs
- Run seed script: `node seed-jobs.js`

**Can't apply for jobs?**
- Make sure you're logged in
- Check browser console for errors

**Webhook not working?**
- Set WEBHOOK_API_KEY in backend/.env
- Include x-api-key header in request

## 🎉 Success!

You now have a fully functional job board with:
- ✅ Public job listings
- ✅ Application system
- ✅ Admin dashboard
- ✅ Application review
- ✅ Automatic posting API

## 🚀 Next Steps

1. Customize job fields
2. Add email notifications
3. Implement resume upload
4. Add advanced search
5. Create analytics dashboard

Need help? Check the documentation files or contact support.
