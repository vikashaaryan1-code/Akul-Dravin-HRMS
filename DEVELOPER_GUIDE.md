# DEVELOPER QUICK REFERENCE GUIDE

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install
npm --prefix frontend-next install
npm --prefix backend/hrms-microservices install

# Development
npm run dev                    # Start both frontend + backend
npm run dev:frontend          # Start Next.js only (port 3000)
npm run dev:backend           # Start NestJS only (port 4200)

# Production
npm run build                 # Build both
npm run preview              # Preview production build
```

## 📡 API Endpoints Quick Reference

### Base URL
```
http://localhost:4200/api/v1
```

### Authentication
```
POST   /auth/login           { email, password }
POST   /auth/register        { email, password, name }
```

### Common Pattern (All Modules)
```
GET    /{module}             List all
GET    /{module}/stats       Get statistics
GET    /{module}/:id         Get by ID
POST   /{module}             Create { ...data }
PATCH  /{module}/:id         Update { ...data }
DELETE /{module}/:id         Delete
```

### All Available Modules
```
departments, designations, branches, employees, attendance, 
leave-types, leave-requests, shifts, overtime, timesheets, 
holidays, payroll, payslips, salary-structures, benefits,
jobs, applications, interviews, offers, candidates, skills,
recruiters, placements, commissions, performance, appraisals,
goals, feedbacks, projects, clients, tasks, invoices, expenses,
subscriptions, announcements, meetings, notifications, tickets,
policies, assets, trainings, reports, audit-logs, analytics,
onboardings, exits, certificates, roles
```

## 🎨 Frontend Pages

### URL Pattern
```
http://localhost:3000/{module}
```

### All Available Pages (48 total)
```
/dashboard
/departments
/designations
/branches
/employees
/attendance
/leave
/leave-requests
/shifts
/overtime
/timesheets
/holidays
/payroll
/payslips
/salary-structures
/benefits
/jobs
/applications
/interviews
/offers
/candidates
/skills
/recruiters
/placements
/commissions
/performance
/appraisals
/goals
/feedbacks
/projects
/clients
/tasks
/invoices
/expenses
/subscriptions
/announcements
/meetings
/notifications
/tickets
/policies
/assets
/trainings
/reports
/audit-logs
/analytics
/onboardings
/exits
/certificates
/roles
```

## 🗄️ Database Tables

### Connection String
```
postgresql://postgres:postgres@localhost:5432/akul_dravin_hrms
```

### All Tables (48 total)
```sql
users, roles, companies, branches, departments, designations,
employees, employee_documents, certificates, onboardings, exits,
attendance, leave_types, leaves, shifts, overtime, timesheets, holidays,
payroll, payslips, salary_structures, benefits,
jobs, applications, interviews, offers, candidates, skills,
recruiters, placements, commissions,
performance_reviews, appraisals, goals, feedbacks,
projects, clients, tasks,
invoices, expenses, subscriptions,
announcements, meetings, notifications, tickets, policies,
assets, trainings, reports, audit_logs, analytics
```

## 🔧 Adding a New Module

### 1. Backend (NestJS)

#### Create Entity
```typescript
// backend/hrms-microservices/src/modules/{module}/{module}.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('{modules}')
export class {Module} {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

#### Create Service
```typescript
// backend/hrms-microservices/src/modules/{module}/{module}.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { {Module} } from './{module}.entity';

@Injectable()
export class {Module}Service {
  constructor(@InjectRepository({Module}) private repo: Repository<{Module}>) {}
  
  async findAll(): Promise<{Module}[]> { return this.repo.find(); }
  async findOne(id: string): Promise<{Module}> { return this.repo.findOne({ where: { id } }); }
  async create(data: Partial<{Module}>): Promise<{Module}> { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<{Module}>): Promise<{Module}> { await this.repo.update(id, data); return this.findOne(id); }
  async remove(id: string): Promise<void> { await this.repo.delete(id); }
}
```

#### Create Controller
```typescript
// backend/hrms-microservices/src/modules/{module}/{module}.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { {Module}Service } from './{module}.service';
import { {Module} } from './{module}.entity';

@Controller('{modules}')
export class {Module}Controller {
  constructor(private readonly service: {Module}Service) {}
  
  @Get() findAll(): Promise<{Module}[]> { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string): Promise<{Module}> { return this.service.findOne(id); }
  @Post() create(@Body() data: Partial<{Module}>): Promise<{Module}> { return this.service.create(data); }
  @Patch(':id') update(@Param('id') id: string, @Body() data: Partial<{Module}>): Promise<{Module}> { return this.service.update(id, data); }
  @Delete(':id') remove(@Param('id') id: string): Promise<void> { return this.service.remove(id); }
}
```

#### Create Module
```typescript
// backend/hrms-microservices/src/modules/{module}/{module}.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { {Module}Controller } from './{module}.controller';
import { {Module}Service } from './{module}.service';
import { {Module} } from './{module}.entity';

@Module({
  imports: [TypeOrmModule.forFeature([{Module}])],
  controllers: [{Module}Controller],
  providers: [{Module}Service],
  exports: [{Module}Service],
})
export class {Module}Module {}
```

#### Register in AppModule
```typescript
// backend/hrms-microservices/src/app.module.ts
import { {Module}Module } from './modules/{module}/{module}.module';

@Module({
  imports: [
    // ... other modules
    {Module}Module,
  ],
})
export class AppModule {}
```

### 2. Frontend (Next.js)

#### Create Page
```typescript
// frontend-next/src/app/(platform)/{modules}/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

export default function {Module}sPage() {
  const [data, setData] = useState([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch('http://localhost:4200/api/v1/{modules}')
      .then(r => r.json())
      .then(setData);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:4200/api/v1/{modules}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(e.target)))
    });
    setShow(false);
    fetch('http://localhost:4200/api/v1/{modules}').then(r => r.json()).then(setData);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">{Module}s</h1>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg">
          <Plus size={20} />Add {Module}
        </button>
      </div>
      
      {/* Table or Grid */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-cyan-50/50">
                <td className="px-6 py-4 text-sm text-gray-800">{item.name}</td>
                <td className="px-6 py-4">Actions</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Add {Module}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input name="name" placeholder="Name *" required className="w-full px-4 py-2 border rounded-lg" />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">Create</button>
                <button type="button" onClick={() => setShow(false)} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

## 🎨 Design System Classes

### Colors
```css
/* Primary */
bg-cyan-500, text-cyan-600, border-cyan-100

/* Gradients */
bg-gradient-to-r from-cyan-500 to-blue-500

/* Status Colors */
bg-green-100 text-green-700  /* Success */
bg-orange-100 text-orange-700 /* Warning */
bg-red-100 text-red-700      /* Error */
bg-blue-100 text-blue-700    /* Info */
```

### Components
```css
/* Glass Card */
bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm

/* Button Primary */
bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg

/* Input */
px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500

/* Badge */
px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700
```

## 🐛 Common Issues & Solutions

### Issue: Database connection failed
```bash
# Solution: Check PostgreSQL is running
# Windows: Check Services
# Mac/Linux: sudo service postgresql status
```

### Issue: Port already in use
```bash
# Solution: Kill process on port
# Windows: netstat -ano | findstr :4200
#          taskkill /PID <PID> /F
# Mac/Linux: lsof -ti:4200 | xargs kill -9
```

### Issue: Module not found
```bash
# Solution: Reinstall dependencies
npm install
npm --prefix frontend-next install
npm --prefix backend/hrms-microservices install
```

## 📚 Useful Commands

### Database
```bash
# Create database
createdb akul_dravin_hrms

# Drop database
dropdb akul_dravin_hrms

# Connect to database
psql -U postgres -d akul_dravin_hrms
```

### Git
```bash
# Commit changes
git add .
git commit -m "feat: add new module"
git push origin main
```

### Testing
```bash
# Backend tests
cd backend/hrms-microservices
npm test

# Frontend tests
cd frontend-next
npm test
```

## 🔍 Debugging Tips

1. **Check Backend Logs**: Look at terminal running `npm run dev:backend`
2. **Check Frontend Logs**: Open browser console (F12)
3. **Check Database**: Use pgAdmin or psql to verify data
4. **Check Network**: Use browser DevTools Network tab
5. **Check Environment**: Verify .env files are correct

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review COMPLETE_IMPLEMENTATION_SUMMARY.md
3. Check module-specific code
4. Review error logs

---

**Last Updated**: January 2025
**Version**: 1.0.0
