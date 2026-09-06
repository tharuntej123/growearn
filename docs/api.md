# API Specification & Endpoints

All endpoints follow the standardized response contract:
```json
{
  "success": true,
  "data": {}
}
```
Or error format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request"
  }
}
```

## Core Endpoint Catalog

### Authentication
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Login and receive HTTP-only JWT cookie
- `POST /api/auth/logout` — Clear session cookie
- `GET /api/auth/me` — Retrieve current authenticated user
- `POST /api/auth/role-select` — Switch primary role / onboarding

### Jobs & Freelancing
- `GET /api/jobs` — Filter and search jobs with explainable AI match scores
- `GET /api/jobs/:id` — Detailed job breakdown
- `POST /api/jobs` — Create new job listing (Companies/Admin)
- `POST /api/jobs/:id/apply` — Apply with AI-matched cover letter
- `POST /api/jobs/:id/proposal` — Submit freelance milestone proposal

### Courses & Learning
- `GET /api/courses` — Search course catalog
- `GET /api/courses/:id` — Course lessons & syllabus
- `POST /api/courses` — Publish course
- `POST /api/courses/:id/enroll` — Enroll student & record mock payment
- `POST /api/courses/:id/progress` — Update lesson completion & issue certificates

### Mentorship
- `GET /api/mentors` — Search verified mentor directory
- `GET /api/mentors/:id` — Mentor public profile & ratings
- `POST /api/mentors/:id/request` — Request 1-on-1 mentorship session

### AI Services
- `POST /api/ai/skill-analysis` — Generate skill gap analysis
- `POST /api/ai/roadmap` — Generate structured career roadmap
- `POST /api/ai/proposal` — Generate tailored freelance proposal
- `POST /api/ai/message` — Polish message with specified tone
- `POST /api/ai/chat` — Authenticated career assistant conversation
- `POST /api/ai/resume-parse` — Extract skills from resume text

### Social & Feed
- `GET /api/posts` — Retrieve professional feed
- `POST /api/posts` — Publish achievement/project post
- `POST /api/posts/:id/like` — Toggle post like
- `POST /api/posts/:id/comments` — Add comment to post
