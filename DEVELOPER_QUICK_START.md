# 🚀 AKUL DRAVIN HRMS v11.0 - DEVELOPER QUICK START

## Setup & Installation

### Prerequisites
- Node.js 18.17+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose

### Backend Setup

```bash
# Navigate to backend
cd backend/hrms-microservices

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your PostgreSQL, Redis, and OpenAI credentials

# Run database migrations
npm run typeorm:migration:run

# Start development server
npm run start:dev
```

**Backend runs on:** http://localhost:3001

### Frontend Setup

```bash
# Navigate to frontend
cd frontend-next

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3001

# Start development server
npm run dev
```

**Frontend runs on:** http://localhost:3000

---

## 📚 API ENDPOINTS QUICK REFERENCE

### Authentication
```bash
POST /auth/login
POST /auth/register
POST /auth/refresh-token
```

### AI Engine - HR Core
```bash
POST /ai/hr-core/analyze-leave
POST /ai/hr-core/onboarding-plan
GET /ai/hr-core/leave-abuse-patterns/:employeeId
GET /ai/hr-core/promotion/:employeeId
```

### AI Engine - Recruitment
```bash
POST /ai/recruitment/generate-job-description
POST /ai/recruitment/parse-resume
POST /ai/recruitment/screen-candidate
POST /ai/recruitment/interview-questions
```

### AI Engine - Talent Intelligence
```bash
POST /ai/talent/match-score
POST /ai/talent/skill-matrix
```

### AI Engine - Workforce Analytics
```bash
GET /ai/workforce/attrition-risk/:employeeId
GET /ai/workforce/skill-gaps
POST /ai/workforce/succession-plan/:roleId
```

### AI Engine - Decision Engine
```bash
POST /ai/decision/training-plan/:employeeId
GET /ai/decision/talent-redistribution
GET /ai/decision/compensation-recommendations
```

### AI Engine - Security
```bash
GET /ai/security/behavioral-anomalies/:userId
GET /ai/security/ip-anomalies/:userId
GET /ai/security/payroll-anomalies
GET /ai/security/access-violations
```

### AI Engine - Assistant
```bash
POST /ai/assistant/query
POST /ai/assistant/explain-payslip
POST /ai/assistant/leave-policy
POST /ai/assistant/onboarding-guidance
```

### AI Engine - Automation
```bash
POST /ai/automation/generate-offer-letter
POST /ai/automation/generate-promotion-letter
POST /ai/automation/generate-confirmation-letter
POST /ai/automation/generate-relieving-letter
POST /ai/automation/sign-document/:documentId
```

---

## 🧪 Testing APIs

### Using cURL

```bash
# Analyze leave request
curl -X POST http://localhost:3001/ai/hr-core/analyze-leave \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "emp-123",
    "leaveType": "CASUAL",
    "days": 3,
    "startDate": "2024-06-01"
  }'

# Parse resume
curl -X POST http://localhost:3001/ai/recruitment/parse-resume \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "Rajesh Kumar\nExperience: 5 years in React and Node.js..."
  }'

# Get attrition risk
curl -X GET http://localhost:3001/ai/workforce/attrition-risk/emp-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

1. Import the collection from `/docs/postman-collection.json`
2. Set `{{token}}` variable with your JWT token
3. Set `{{baseUrl}}` to http://localhost:3001
4. Run requests individually or use the collection runner

---

## 🎨 Frontend Component Usage

### Import CyberGlass Theme

```typescript
// In your app layout
import '@/styles/cybeglass-2.0.css';
```

### Use Core Components

```typescript
import { Button, Card, Badge, LoadingSpinner } from '@/components/ui/core-components';

export default function MyPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <Card className="!bg-slate-800/40">
        <h1 className="gradient-title">Welcome</h1>
        <p className="text-slate-400 mt-2">Subtitle text in secondary color</p>
        
        <Badge variant="success">Active</Badge>
        
        <Button 
          isLoading={loading}
          onClick={() => setLoading(true)}
        >
          Click Me
        </Button>
      </Card>
    </div>
  );
}
```

### Use Glassmorphism Classes

```html
<!-- Glass panel -->
<div class="glass-panel">
  Blurred background with transparency
</div>

<!-- Glass card -->
<div class="glass-card p-6 rounded-xl">
  Premium glassmorphism effect
</div>

<!-- Gradient text -->
<h1 class="gradient-title">Premium Headline</h1>
```

---

## 📊 Database Schema

### Key Tables

**employees**
- id (UUID)
- companyId (UUID) - Multi-tenant
- email, firstName, lastName
- department, designation, reportingManagerId
- employmentStatus, joinDate, exitDate
- createdAt, updatedAt

**leave_requests**
- id (UUID)
- employeeId (UUID)
- leaveType (CASUAL, SICK, EARNED, MATERNITY)
- startDate, endDate, totalDays
- reason, status (PENDING, APPROVED, REJECTED)
- approverIds, approverComments
- aiAnalysis (JSON) - Stores AI recommendation
- createdAt, updatedAt

**candidates**
- id (UUID)
- companyId (UUID)
- name, email, phone
- resumeText, parsedResume (JSON)
- skills[], experience[], education[]
- createdAt, updatedAt

**ai_logs**
- id (UUID)
- companyId (UUID)
- layer (HR_CORE, RECRUITMENT, etc.)
- action (analyze_leave, parse_resume, etc.)
- input, output (JSON)
- tokensUsed, executionTimeMs
- createdAt

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/akul_dravin_hrms
DATABASE_SYNCHRONIZE=false
DATABASE_LOGGING=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=24h

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEFAULT_AI_PROVIDER=openai

# File Storage
AWS_S3_BUCKET=akul-dravin-hrms-prod
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Email Service
SENDGRID_API_KEY=
EMAIL_FROM=noreply@akuldravn.com

# Application
NODE_ENV=development
LOG_LEVEL=debug
PORT=3001
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Akul Dravin HRMS
NEXT_PUBLIC_VERSION=11.0.0
```

---

## 🐛 Debugging

### Enable Debug Logging

```bash
# Backend
DEBUG=akul-dravin:* npm run start:dev

# Frontend
DEBUG=* npm run dev
```

### Check Logs

```bash
# Backend logs
tail -f logs/application.log

# Database logs
tail -f logs/database.log

# AI API logs
grep "ai-engine" logs/application.log
```

### Database Debugging

```bash
# Connect to PostgreSQL
psql postgresql://user:password@localhost:5432/akul_dravin_hrms

# Common queries
SELECT * FROM employees WHERE company_id = 'tenant-123';
SELECT * FROM leave_requests WHERE status = 'PENDING';
SELECT * FROM ai_logs ORDER BY created_at DESC LIMIT 10;
```

---

## 📈 Performance Optimization

### Backend
- Enable Redis caching for frequently accessed data
- Use database connection pooling (min: 5, max: 20)
- Implement request batching for AI API calls
- Use async/await properly to avoid blocking

### Frontend
- Code splitting: `dynamic(() => import('./component'))`
- Image optimization: use `next/image` component
- CSS-in-JS: Tailwind pre-compiles to static CSS
- Lazy load charts and heavy components

---

## 🚢 Deployment Checklist

- [ ] Set all environment variables
- [ ] Run database migrations
- [ ] Build frontend: `npm run build`
- [ ] Build backend: `npm run build`
- [ ] Test API endpoints
- [ ] Set up SSL/TLS certificates
- [ ] Configure CDN for static assets
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Test disaster recovery
- [ ] Load test critical paths
- [ ] Security audit
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/ai-enhancement`
2. Follow code style in `.eslintrc.json`
3. Write tests: `npm run test`
4. Update documentation
5. Submit PR with description
6. Request review from 2+ maintainers

---

## 📞 Support

**Documentation:** `/docs/ARCHITECTURE_SPEC.md`  
**API Docs:** http://localhost:3001/api-docs (Swagger)  
**Issues:** GitHub Issues  
**Slack:** #akul-dravin-dev  

---

## 🎯 Next Steps

1. **Set up local development environment** (30 min)
2. **Run the test suite** to ensure everything works
3. **Explore the codebase** - start with `/src/modules/ai-engine`
4. **Try calling AI endpoints** using Postman
5. **Browse the frontend components** in Chrome DevTools
6. **Read PHASE_1_COMPLETION_SUMMARY.md** for architecture overview

---

**Happy Coding! 🚀**

---

*Last Updated: May 31, 2024*
*Akul Dravin HRMS v11.0*
