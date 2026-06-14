# AKUL DRAVIN HRMS v11.0 - SYSTEM ARCHITECTURE

## 🏗️ Complete Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          AKUL DRAVIN HRMS v11.0                         │
│                    Premium AI-Powered SaaS Platform                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  HR Manager      │  │  Employee        │  │  Recruitment     │      │
│  │  Dashboard       │  │  Self-Service    │  │  Pipeline UI     │      │
│  │                  │  │  Portal           │  │                  │      │
│  │ • Metrics        │  │ • Check-in/Out    │  │ • Kanban Board   │      │
│  │ • Approvals      │  │ • Leave Request   │  │ • Candidate Cards│      │
│  │ • AI Insights    │  │ • Payslips        │  │ • AI Scoring     │      │
│  │ • Analytics      │  │ • Performance     │  │ • Interviews     │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  Admin Console   │  │  Analytics       │  │  Mobile App      │      │
│  │  (Super Admin)   │  │  Dashboard       │  │  (React Native)  │      │
│  │                  │  │                  │  │                  │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                           │
│  All UI built with CyberGlass 2.0 Design System                         │
│  • Glassmorphism effects (backdrop-filter blur)                         │
│  • Premium color tokens (HSL-based)                                     │
│  • Responsive layouts (Mobile → Desktop)                                │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              REST API LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  POST   /api/auth/login              → JWT Token                        │
│  POST   /api/auth/register           → Create Account                   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  AI ENGINE REST ENDPOINTS (40+)                                 │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                 │    │
│  │  Layer 1: HR Core          Layer 5: Decision Engine            │    │
│  │  ├─ analyze-leave          ├─ training-plan                    │    │
│  │  ├─ onboarding-plan        ├─ talent-redistribution            │    │
│  │  ├─ leave-abuse-patterns   └─ compensation-recommendations    │    │
│  │  └─ promotion              Layer 6: Security Engine            │    │
│  │                            ├─ behavioral-anomalies             │    │
│  │  Layer 2: Recruitment      ├─ ip-anomalies                     │    │
│  │  ├─ generate-job-desc      ├─ payroll-anomalies                │    │
│  │  ├─ parse-resume           └─ access-violations                │    │
│  │  ├─ screen-candidate       Layer 7: Assistant                  │    │
│  │  └─ interview-questions    ├─ query                            │    │
│  │                            ├─ explain-payslip                  │    │
│  │  Layer 3: Talent           ├─ leave-policy                     │    │
│  │  ├─ match-score            └─ onboarding-guidance              │    │
│  │  └─ skill-matrix           Layer 8: Automation                 │    │
│  │                            ├─ offer-letter                     │    │
│  │  Layer 4: Workforce        ├─ promotion-letter                 │    │
│  │  ├─ attrition-risk         ├─ confirmation-letter              │    │
│  │  ├─ skill-gaps             ├─ relieving-letter                 │    │
│  │  └─ succession-plan        └─ sign-document                    │    │
│  │                                                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  All endpoints protected with:                                          │
│  • JWT Authentication (JwtAuthGuard)                                    │
│  • Role-Based Authorization (@Roles)                                    │
│  • Request Validation (ParseUUIDPipe)                                   │
│  • Tenant Isolation (TenantContext)                                     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER (NestJS)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  AI ENGINE MODULE (8 Specialized Services)                      │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                 │    │
│  │  Layer 1: AiHrCoreService                                       │    │
│  │  • analyzeLeaveRequest() → AI recommendation                    │    │
│  │  • generateOnboardingPlan() → Structured tasks                  │    │
│  │  • detectLeaveAbusePatterns() → Risk detection                  │    │
│  │  • getPromotionRecommendations() → Career path                  │    │
│  │                                                                 │    │
│  │  Layer 2: AiRecruitmentEngineService                            │    │
│  │  • generateJobDescription() → Professional JD                   │    │
│  │  • parseResume() → Structured extraction                        │    │
│  │  • screenCandidate() → Score + feedback                         │    │
│  │  • generateInterviewQuestions() → Tailored questions            │    │
│  │                                                                 │    │
│  │  Layer 3: AiTalentIntelligenceService                           │    │
│  │  • calculateTalentScore() → Weighted formula (35% skill+...)    │    │
│  │  • mapSkillMatrix() → Gap identification                        │    │
│  │                                                                 │    │
│  │  Layer 4: AiWorkforceAnalyticsService                           │    │
│  │  • predictAttritionRisk() → 90%+ accuracy target                │    │
│  │  • forecastSkillGaps() → Timeline-based                         │    │
│  │  • generateSuccessionPlan() → Career progression                │    │
│  │                                                                 │    │
│  │  Layer 5: AiDecisionEngineService                               │    │
│  │  • generateTrainingPlan() → L&D roadmap                         │    │
│  │  • recommendTalentRedistribution() → Org optimization           │    │
│  │  • recommendCompensationAdjustments() → Budget-aware            │    │
│  │                                                                 │    │
│  │  Layer 6: AiSecurityEngineService                               │    │
│  │  • detectBehavioralAnomalies() → User profiling                 │    │
│  │  • detectIpAnomalies() → Geolocation risk                       │    │
│  │  • detectPayrollAnomalies() → Fraud detection                   │    │
│  │  • detectAccessViolations() → Policy enforcement                │    │
│  │                                                                 │    │
│  │  Layer 7: AiVoiceTextAssistantService                           │    │
│  │  • handleEmployeeQuery() → Conversational Q&A                   │    │
│  │  • explainPayslip() → Natural language                          │    │
│  │  • answerLeavePolicy() → Context-aware                          │    │
│  │  • generateOnboardingGuidance() → Personalized                  │    │
│  │                                                                 │    │
│  │  Layer 8: AiAutomationEngineService                             │    │
│  │  • generateOfferLetter() → Professional document                │    │
│  │  • generatePromotionLetter() → Role transition                  │    │
│  │  • generateConfirmationLetter() → Probation end                 │    │
│  │  • generateRelievingLetter() → Exit document                    │    │
│  │  • signDocument() → E-signature integration                     │    │
│  │                                                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  CORE MODULES (40+ microservices)                               │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                 │    │
│  │  Employee      Leave        Payroll      Recruitment           │    │
│  │  Attendance    Approval      Compliance   Analytics             │    │
│  │  Onboarding    Calendar      Tax         Interview              │    │
│  │  Lifecycle     Policies      Benefits    Hiring                 │    │
│  │  Performance   Ratification  Deductions  Offer Letter           │    │
│  │  Engagement    History       Reports     Background Check       │    │
│  │                                                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  CROSS-CUTTING CONCERNS                                         │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                 │    │
│  │  Authentication       JwtAuthGuard, Passport.js                │    │
│  │  Authorization        RolesGuard, @Roles decorator             │    │
│  │  Multi-Tenancy        TenantContext, AsyncLocalStorage          │    │
│  │  Logging              Winston logger, structured JSON           │    │
│  │  Error Handling       GlobalExceptionFilter                     │    │
│  │  Validation           class-validator, ValidationPipe           │    │
│  │  Caching              Redis, cache-manager                      │    │
│  │  Background Jobs      Bull queues, async workers                │    │
│  │                                                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      GOVERNANCE LAYER (3-Plane Model)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  EXECUTION PLANE (Per-Request Isolation)                        │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │  • AsyncLocalStorage<TenantContext>                             │    │
│  │  • TenantContext.getRepository() - All queries route here      │    │
│  │  • No raw SQL permitted - Prevents SQL injection               │    │
│  │  • All mutations tracked - Audit trail enabled                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  ADMISSION PLANE (AST Validation)                               │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │  • Governance scanner validates code at deployment              │    │
│  │  • Dependency matrix ensures module isolation                   │    │
│  │  • Forensic replay - Can replay tenant operations               │    │
│  │  • Policy enforcement - Multi-tenant rules applied              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  FEEDBACK PLANE (Telemetry & Drift Detection)                   │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │  • Telemetry ingestion - All API calls logged                   │    │
│  │  • Drift detection - Compare against baseline policies          │    │
│  │  • Policy ratification - Automated compliance check             │    │
│  │  • Anomaly detection - Alert on suspicious patterns             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  DATA PROTECTION:                                                        │
│  • governanceProvenanceHash - Tracks all mutations                      │
│  • epistemicConfidence - Tracks data lineage confidence                 │
│  • TenantSubscriber - Watches for unauthorized queries                  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER (TypeORM + PostgreSQL)                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  CORE ENTITIES   │  │  TRANSACTION     │  │  AUDIT ENTITIES  │      │
│  │                  │  │  ENTITIES        │  │                  │      │
│  │ • Employee       │  │ • LeaveRequest   │  │ • AuditLog       │      │
│  │ • Department     │  │ • LeaveApproval  │  │ • LoginHistory   │      │
│  │ • Candidate      │  │ • PayslipRecord  │  │ • ChangeLog      │      │
│  │ • RecruitmentJob │  │ • Attendance     │  │ • ApprovalQueue  │      │
│  │ • User           │  │ • ApprovalStep   │  │ • DocumentRecord │      │
│  │ • Company/Tenant │  │ • Promotion      │  │ • ProvisionLog   │      │
│  │                  │  │ • SkillHistory   │  │                  │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                           │
│  Database: PostgreSQL 14+                                               │
│  • JSONB columns for flexible AI response storage                       │
│  • Partitioning by company_id for multi-tenant scaling                  │
│  • Triggers for audit logging on DML operations                         │
│  • Full-text search on resume and job descriptions                      │
│                                                                           │
│  Redis: For caching and sessions                                        │
│  • Cache: Employee profiles, leave balance, dashboards                  │
│  • Sessions: JWT token blacklist, rate limiting                         │
│  • Queues: Background job processing                                    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL INTEGRATIONS                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  AI PROVIDERS    │  │  SERVICES        │  │  THIRD-PARTY     │      │
│  │                  │  │                  │  │  INTEGRATIONS    │      │
│  │ • OpenAI         │  │ • SendGrid       │  │ • Stripe         │      │
│  │   - GPT-4        │  │   (Email)        │  │   (Payments)     │      │
│  │   - Embeddings   │  │ • Twilio         │  │ • DocuSign       │      │
│  │                  │  │   (WhatsApp,SMS) │  │   (E-Signature)  │      │
│  │ • Anthropic      │  │ • AWS S3         │  │ • BioMax         │      │
│  │   - Claude 3     │  │   (File Storage) │  │   (Biometrics)   │      │
│  │   - Embeddings   │  │ • Firebase       │  │ • BGV Provider   │      │
│  │                  │  │   (Analytics)    │  │   (Background    │      │
│  │ • Fallback       │  │ • Slack          │  │    Verification) │      │
│  │   - Error        │  │   (Notifications)│  │                  │      │
│  │   - Graceful     │  │                  │  │                  │      │
│  │                  │  │                  │  │                  │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                           │
│  Provider Pattern: Service-based abstraction                            │
│  • AiProviderService interface                                          │
│  • Implementations for OpenAI, Anthropic, Fallback                      │
│  • Easy to add new providers without code changes                       │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagrams

### Leave Request Analysis Flow

```
Employee submits leave request
        ↓
REST API: POST /ai/hr-core/analyze-leave
        ↓
AiHrCoreService.analyzeLeaveRequest()
        ↓
TenantContext.getRepository() - Multi-tenant isolation
        ↓
Fetch Employee + Leave Policy + Historical Data
        ↓
Build AI Prompt:
  "Analyze leave request:
   - Employee: Rahul, Eng, 5 years
   - Leave type: Casual
   - Days: 3 (Mon-Wed)
   - Frequency: 2x per month
   - Pattern: Adjacent to weekends
   ...Policy rules..."
        ↓
Call AI Provider (OpenAI GPT-4)
  {
    "recommendation": "ESCALATE",
    "confidence": 0.85,
    "reasoning": "Casual leave adjacent to weekend...",
    "requiresManualReview": true
  }
        ↓
TenantSubscriber logs mutation
  governanceProvenanceHash = hash(input + timestamp + tenantId)
  epistemicConfidence = 0.85
        ↓
Response to Frontend
        ↓
HR Portal displays recommendation with AI confidence score
        ↓
HR Manager approves/rejects with comment
        ↓
Leave status updated, notification sent to employee
```

### Candidate Screening Flow

```
Recruiter uploads candidate resume
        ↓
REST API: POST /ai/recruitment/parse-resume
        ↓
AiRecruitmentEngineService.parseResume()
        ↓
Extract text from PDF → Send to AI
        ↓
AI extracts: Name, Email, Phone, Experience[], Skills[], Education[]
        ↓
Store in CandidateProfile entity
        ↓
REST API: POST /ai/recruitment/screen-candidate
        ↓
AiRecruitmentEngineService.screenCandidate()
        ↓
Fetch candidate profile + job description + company culture
        ↓
AI evaluates:
  - Skill match: 85% (5 of 6 required skills)
  - Experience: 7 years (meets 5 year requirement)
  - Cultural fit: Medium
  - Red flags: None identified
        ↓
Response:
  {
    "score": 78,
    "status": "PASS",
    "strengths": ["React expert", "5+ years backend"],
    "gaps": ["No microservices experience"],
    "recommendation": "Schedule technical interview"
  }
        ↓
Recruitment portal shows candidate card with score
        ↓
Kanban board: Move from Screening → Interview
        ↓
AI generates tailored interview questions
        ↓
Interview feedback collected
        ↓
Final decision: Hire/Reject
```

---

## 🔐 Security Architecture

### Multi-Tenant Isolation Strategy

```
Request comes in with JWT token
        ↓
JwtAuthGuard extracts userId, tenantId
        ↓
TenantContext.setTenantId(tenantId)
        ↓
Request enters controller method
        ↓
@Roles(Role.HR_MANAGER) guard checks authorization
        ↓
Service method calls TenantContext.getRepository()
        ↓
TypeORM query AUTOMATICALLY adds:
  WHERE company_id = ${tenantId}
        ↓
All queries isolated to tenant's data only
        ↓
TenantSubscriber watches for violations
  - Rejects raw queries
  - Logs suspicious patterns
  - Alerts on policy violations
        ↓
Response encrypted before sending to client
```

### Rate Limiting & Quota Enforcement

```
User makes API call
        ↓
Check Redis cache: "{userId}:call_count"
        ↓
If exceeds quota:
  - Return 429 Too Many Requests
  - Log attempt
  - Alert if pattern suggests attack
        ↓
Increment counter with TTL (1 hour)
        ↓
Allow request to proceed
        ↓
Log to AiLogs table:
  - userId, tenantId
  - action (ai layer)
  - tokens used
  - latency
  - cost
        ↓
Analytics dashboard tracks usage per tenant
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CI/CD Pipeline                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Git Push → GitHub Actions                                      │
│         ↓                                                        │
│  Lint & Format Check (ESLint, Prettier)                         │
│         ↓                                                        │
│  TypeScript Compilation Check                                   │
│         ↓                                                        │
│  Unit Tests (Jest)                                              │
│         ↓                                                        │
│  Integration Tests                                              │
│         ↓                                                        │
│  Build Docker Images                                            │
│         ↓                                                        │
│  Push to ECR (AWS)                                              │
│         ↓                                                        │
│  Deploy to Staging (ECS Fargate)                                │
│         ↓                                                        │
│  E2E Tests                                                      │
│         ↓                                                        │
│  Manual QA Approval                                             │
│         ↓                                                        │
│  Deploy to Production (Blue-Green)                              │
│         ↓                                                        │
│  Smoke Tests                                                    │
│         ↓                                                        │
│  Monitor: DataDog, Sentry                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📈 Scalability Design

### Horizontal Scaling

**Backend Microservices:**
- Each NestJS service runs in separate ECS task
- Load balancer distributes requests
- Auto-scaling based on CPU/Memory/Requests

**Database:**
- PostgreSQL read replicas for analytics queries
- Redis cluster for caching (6-node cluster)
- Sharding by company_id for multi-tenant scale

**Frontend:**
- Next.js deployed to CloudFront (CDN)
- Vercel edge functions for API routes
- ISR (Incremental Static Regeneration) for dashboard pages

### Performance Optimization

```
AI Request Caching:
  User asks: "What's my leave balance?"
  
  First request:
    → Query database
    → Call AI service
    → Cache in Redis (1 hour TTL)
    → Return to user
  
  Second request (within 1 hour):
    → Check Redis cache
    → Return cached response (instant)
    → Save 1000ms latency + AI cost

GraphQL Batching (if implemented):
  Multiple components need employee data
    → Batch requests into single query
    → Dataloader caches intermediate results
    → Single database query instead of N+1
```

---

## 📞 Monitoring & Observability

```
Application Metrics:
  • API request latency (p50, p95, p99)
  • Error rates by endpoint
  • AI provider latency + cost
  • Database query duration
  • Cache hit/miss ratio

Business Metrics:
  • Active tenants
  • API calls per tenant
  • Leave requests processed
  • Candidates screened
  • Documents generated
  • Failed approvals (need investigation)

Security Events:
  • Failed login attempts
  • Access violations detected
  • Anomalies flagged
  • Policy violations
  • Audit log entries

Logging:
  • Centralized logging: CloudWatch/ELK
  • Structured JSON format
  • Trace IDs for request correlation
  • Sensitive data redaction
```

---

## 🎯 Summary

**Total Endpoints:** 40+  
**AI Layers:** 8 specialized services  
**Multi-Tenant:** Enforced at every layer  
**Scalability:** Horizontal + vertical  
**Security:** JWT + Role-based + Multi-tenant isolation  
**Performance:** Caching + Batching + CDN  
**Monitoring:** Comprehensive telemetry  

---

*Architecture designed for enterprise-scale HR + Recruitment SaaS*
