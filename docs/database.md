# Database Architecture & Entity Relationships

The relational model is designed in Prisma ORM with strict normalization, relational foreign keys, cascade deletes, and indexing.

```mermaid
erDiagram
    User ||--o| Profile : has
    User ||--o| MentorProfile : has
    User ||--o{ UserSkill : masters
    Skill ||--o{ UserSkill : categorized_by
    User ||--o{ Post : creates
    Post ||--o{ Comment : receives
    Post ||--o{ Like : receives
    User ||--o{ Course : instructs
    Course ||--o{ CourseModule : contains
    CourseModule ||--o{ Lesson : contains
    User ||--o{ Enrollment : enrolls
    User ||--o{ Job : posts
    Job ||--o{ JobSkill : requires
    Job ||--o{ Application : receives
    Job ||--o{ Proposal : receives
    User ||--o{ MentorshipRequest : requests
    User ||--o{ MentorshipBooking : schedules
    User ||--o| AIProfile : analyzes
    User ||--o| CareerRoadmap : follows
    CareerRoadmap ||--o{ RoadmapItem : contains
```

## Relational Models Summary

| Model | Purpose |
|---|---|
| `User` | Core identity with email, password hash, role (`STUDENT`, `MENTOR`, `FREELANCER`, `COMPANY`), location, and bio. |
| `Profile` | Portfolio URLs, hourly rate, career goals, AI score, and company metadata. |
| `Skill` & `UserSkill` | Verified competencies with proficiency levels (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`). |
| `Job` & `JobSkill` | Full-time and freelance listings with work mode (`REMOTE`, `ONSITE`, `HYBRID`), local indicators, and salary range. |
| `Course`, `CourseModule`, `Lesson` | Interactive video course catalog with lesson progress tracking and automated certificate generation. |
| `MentorshipRequest` & `Booking` | 1-on-1 coaching requests, meeting room links, and ratings. |
| `AIProfile` & `CareerRoadmap` | Skill gap analysis, target role roadmaps, and step-by-step milestone linkages. |
