# Job Board Webhook API Documentation

## Automatic Job Posting Webhook

This webhook allows external systems to automatically post job openings to the HRMS platform.

### Endpoint

```
POST /api/v1/webhooks/job-posting
```

### Authentication

Include the API key in the request headers:

```
x-api-key: your-secret-webhook-key
```

### Request Body

```json
{
  "companyId": "uuid-of-company",
  "title": "Senior Software Engineer",
  "description": "We are looking for an experienced software engineer...",
  "location": "Remote",
  "employmentType": "Full-time",
  "experienceLevel": "Senior",
  "salaryMin": 100000,
  "salaryMax": 150000,
  "skills": "JavaScript, React, Node.js, TypeScript",
  "openings": 2,
  "closingDate": "2024-12-31"
}
```

### Field Descriptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| companyId | string (UUID) | No | Default company | Company posting the job |
| title | string | Yes | - | Job title |
| description | string | Yes | - | Detailed job description |
| location | string | No | "Remote" | Job location |
| employmentType | string | No | "Full-time" | Full-time, Part-time, Contract, Internship |
| experienceLevel | string | No | "Mid-level" | Entry-level, Mid-level, Senior, Lead |
| salaryMin | number | No | - | Minimum salary |
| salaryMax | number | No | - | Maximum salary |
| skills | string | No | "" | Comma-separated skills |
| openings | number | No | 1 | Number of positions |
| closingDate | string (date) | No | - | Application deadline |

### Response

**Success (201 Created):**
```json
{
  "id": "job-uuid",
  "companyId": "company-uuid",
  "title": "Senior Software Engineer",
  "status": "open",
  "postedDate": "2024-01-15T10:30:00Z",
  ...
}
```

**Error (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Invalid API key"
}
```

### Example Usage

#### cURL
```bash
curl -X POST http://localhost:4200/api/v1/webhooks/job-posting \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-webhook-key" \
  -d '{
    "title": "Senior Software Engineer",
    "description": "We are looking for an experienced software engineer...",
    "location": "Remote",
    "employmentType": "Full-time",
    "experienceLevel": "Senior",
    "salaryMin": 100000,
    "salaryMax": 150000,
    "skills": "JavaScript, React, Node.js, TypeScript",
    "openings": 2
  }'
```

#### JavaScript/Node.js
```javascript
const response = await fetch('http://localhost:4200/api/v1/webhooks/job-posting', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-secret-webhook-key'
  },
  body: JSON.stringify({
    title: 'Senior Software Engineer',
    description: 'We are looking for an experienced software engineer...',
    location: 'Remote',
    employmentType: 'Full-time',
    experienceLevel: 'Senior',
    salaryMin: 100000,
    salaryMax: 150000,
    skills: 'JavaScript, React, Node.js, TypeScript',
    openings: 2
  })
});

const job = await response.json();
console.log('Job posted:', job);
```

#### Python
```python
import requests

response = requests.post(
    'http://localhost:4200/api/v1/webhooks/job-posting',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': 'your-secret-webhook-key'
    },
    json={
        'title': 'Senior Software Engineer',
        'description': 'We are looking for an experienced software engineer...',
        'location': 'Remote',
        'employmentType': 'Full-time',
        'experienceLevel': 'Senior',
        'salaryMin': 100000,
        'salaryMax': 150000,
        'skills': 'JavaScript, React, Node.js, TypeScript',
        'openings': 2
    }
)

job = response.json()
print('Job posted:', job)
```

### Configuration

Set the webhook API key in your `.env` file:

```env
WEBHOOK_API_KEY=your-secret-webhook-key
```

### Integration Examples

#### ATS Integration
Integrate with your existing ATS to automatically sync job postings:

```javascript
// When a job is approved in your ATS
async function onJobApproved(atsJob) {
  await fetch('http://localhost:4200/api/v1/webhooks/job-posting', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.HRMS_WEBHOOK_KEY
    },
    body: JSON.stringify({
      title: atsJob.title,
      description: atsJob.description,
      location: atsJob.location,
      employmentType: atsJob.type,
      experienceLevel: atsJob.level,
      salaryMin: atsJob.salary.min,
      salaryMax: atsJob.salary.max,
      skills: atsJob.skills.join(', '),
      openings: atsJob.positions
    })
  });
}
```

#### Scheduled Job Posting
Use cron jobs or scheduled tasks to post jobs automatically:

```javascript
// Post jobs every day at 9 AM
const cron = require('node-cron');

cron.schedule('0 9 * * *', async () => {
  const pendingJobs = await getApprovedJobs();
  
  for (const job of pendingJobs) {
    await fetch('http://localhost:4200/api/v1/webhooks/job-posting', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.HRMS_WEBHOOK_KEY
      },
      body: JSON.stringify(job)
    });
  }
});
```

### Security Best Practices

1. **Keep API Key Secret**: Never commit the API key to version control
2. **Use HTTPS**: Always use HTTPS in production
3. **Rotate Keys**: Regularly rotate your webhook API keys
4. **IP Whitelisting**: Consider restricting webhook access to specific IPs
5. **Rate Limiting**: Implement rate limiting to prevent abuse

### Troubleshooting

**401 Unauthorized**
- Verify the API key is correct
- Check the `x-api-key` header is included

**400 Bad Request**
- Ensure required fields (title, description) are provided
- Validate data types match the schema

**500 Internal Server Error**
- Check backend logs for detailed error messages
- Verify database connection is working
