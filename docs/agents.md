# CrewAI Multi-Agent Service Architecture (`agents/`)

## 1. Overview

Growearn integrates an autonomous multi-agent career planning subsystem powered by **CrewAI**, **FastAPI**, and **Tavily Search**. The multi-agent service runs as a containerized microservice alongside the Next.js frontend and PostgreSQL/Ollama infrastructure, exposed internally on port `8001`.

When a learner requests an advanced career roadmap on `/learner/dashboard`, the Next.js API route (`/api/ai/roadmap/agentic`) delegates the planning lifecycle to the CrewAI service. If the agent service is unavailable, unconfigured, or times out (>60s), the platform gracefully degrades to an atomic, deterministic single-pass roadmap generator to guarantee 100% uptime.

---

## 2. The 3-Agent Crew Architecture

The multi-agent workflow is structured as a sequential Crew of three specialized agents:

```text
┌───────────────────────┐
│   Learner Request     │
│   (Skill / Target)    │
└──────────┬────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Tech Lead Labor Market Researcher (Researcher Agent)     │
│    • Role: Senior Tech Labor Market & Curriculum Researcher │
│    • Goal: Research real-world job demand & modern stack    │
│    • Tools: Tavily Web Search (Live industry data)          │
└──────────────────────────┬──────────────────────────────────┘
                           │ Agent Output (Key Skills, Trends)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Senior Curriculum Architect & Career Planner (Planner)    │
│    • Role: Curriculum Architect                             │
│    • Goal: Synthesize research into 4 phased milestones     │
│    • Tools: Growearn Platform Catalog Search (DB items)     │
└──────────────────────────┬──────────────────────────────────┘
                           │ Agent Output (Structured Phases)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Principal Engineering Career Reviewer (Reviewer Agent)   │
│    • Role: Principal Engineering Mentor & Quality Auditor   │
│    • Goal: Audit prerequisites, time feasibility & JSON     │
│    • Output: Validated RoadmapResponse schema               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌───────────────────────┐
│ Clean RoadmapResponse │
│ (Stored in PostgreSQL)│
└───────────────────────┘
```

### Agent Roles & Specifications

1. **Labor Market Researcher Agent**
   - **Role**: `Senior Tech Labor Market & Curriculum Researcher`
   - **Goal**: Research real-world industry job market demand, emerging tooling, and high-frequency production requirements for the target role.
   - **Backstory**: Veteran engineering leader with deep expertise across hiring trends and engineering skill taxonomies.
   - **Tools**: `TavilySearchTool` (queries Tavily REST API with relevance scoring).

2. **Curriculum Architect & Planner Agent**
   - **Role**: `Senior Curriculum Architect & Career Planner`
   - **Goal**: Synthesize labor market findings into four actionable, phased progression milestones (`Fundamentals`, `Intermediate & System Design`, `Advanced Production Patterns`, `Interview Prep & Capstone`).
   - **Backstory**: Staff educator who designs high-conversion university and corporate engineering bootcamps.
   - **Tools**: `GrowearnCatalogLookupTool` (retrieves relevant verified courses and mentors from Growearn).

3. **Principal Engineering Reviewer Agent**
   - **Role**: `Principal Engineering Mentor & Quality Auditor`
   - **Goal**: Audit the draft roadmap for realistic time commitments, prerequisite order, actionable projects, and strict JSON schema conformance.
   - **Backstory**: Rigorous engineering manager focused on pragmatic execution, eliminating fluff, and verifying that every milestone includes a concrete deliverable.
   - **Tools**: Audit validators ensuring valid output format.

---

## 3. Tool Implementations

- **`TavilySearchTool` (`agents/app/tools.py`)**:
  - Leverages Tavily Search API to retrieve live web documentation, official guides, and production repos.
  - Automatically handles query normalization and extracts clean title, URL, and snippet payloads.
  - Includes graceful mock/offline fallback if `TAVILY_API_KEY` is not supplied.

- **`GrowearnCatalogLookupTool` (`agents/app/tools.py`)**:
  - Queries internal Growearn courses and expert mentors matching the requested technical domain.
  - Returns structured catalog references to ground milestones in available platform offerings.

---

## 4. API Specification & Request / Response Flow

### `POST /roadmap`

**Request Payload (`RoadmapRequest`)**:
```json
{
  "skill": "Next.js 16",
  "targetRole": "Full Stack Engineer",
  "experienceLevel": "intermediate",
  "currentSkills": ["React", "TypeScript", "Node.js"],
  "weeklyHours": 15
}
```

**Response Payload (`RoadmapResponse`)**:
```json
{
  "title": "Comprehensive Next.js 16 Career Roadmap",
  "targetRole": "Full Stack Engineer",
  "durationWeeks": 16,
  "phases": [
    {
      "phase": 1,
      "title": "Next.js 16 Server Components & Core Architecture",
      "duration": "Weeks 1-4",
      "description": "Deep dive into React 19 RSC, Server Actions, and partial prerendering.",
      "milestones": [
        "Migrate client components to RSC",
        "Implement Server Actions with Zod validation"
      ],
      "recommendedCourses": ["Course-UUID-1"],
      "recommendedMentors": ["Mentor-UUID-1"],
      "tavilyResources": [
        {
          "title": "Next.js Official Documentation",
          "url": "https://nextjs.org/docs",
          "snippet": "Learn Next.js App Router and Server Components."
        }
      ]
    }
  ],
  "agentTrace": [
    {
      "agent": "Researcher",
      "status": "completed",
      "summary": "Researched industry demand for Next.js 16 and identified key requirements."
    },
    {
      "agent": "Planner",
      "status": "completed",
      "summary": "Synthesized 4 milestone phases aligned with catalog courses and mentors."
    },
    {
      "agent": "Reviewer",
      "status": "completed",
      "summary": "Audited curriculum for feasibility and verified JSON schema compliance."
    }
  ],
  "disclaimer": "AI-generated multi-agent roadmap grounded in live market data."
}
```

---

## 5. Failure Handling & Resilient Degradation

Production environments require uninterrupted availability even during third-party LLM rate-limits or cold starts:
1. **Multi-Agent Sequential Execution**: CrewAI runs with sequential process flow.
2. **60-Second Timeout Budget**: Next.js client sets an explicit timeout of 60 seconds (`timeoutMs: 60000`).
3. **Resilient Local Fallback**:
   - If `crew.kickoff()` raises an exception (e.g. rate limit, tool failure, missing keys), `agents/app/crew.py` executes a high-fidelity local deterministic generator that produces the exact same `RoadmapResponse` schema.
   - If the entire HTTP connection to `http://agents:8001` fails (e.g. service down), Next.js route `src/app/api/ai/roadmap/agentic/route.ts` catches the error and executes `CareerRoadmapService.generateForLearnerWithTavily()`.
4. **Zero User-Facing Error**: The learner always receives a high-quality roadmap and clear agent traces.

---

## 6. Running Standalone for Local Development

### Option A: Direct Python Execution
```bash
cd agents
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

### Option B: Running Tests
```bash
cd agents
pytest tests/ -v
```

### Option C: Containerized via Docker Compose
```bash
docker compose up agents -d
curl http://localhost:8001/health
```
