# AI & Machine Learning Architecture

## 1. Hybrid 5-Factor Job & Candidate Matching Engine

Rather than relying strictly on unverified LLM generation, the platform implements a **deterministic hybrid scoring algorithm**:

$$\text{Final Score} = (S \times 0.50) + (E \times 0.20) + (L \times 0.10) + (G \times 0.10) + (A \times 0.10)$$

Where:
1. **$S$ (Skills Match - 50%)**: Exact & semantic overlap between user's verified competencies and job's required skills.
2. **$E$ (Experience Match - 20%)**: User's years of experience vs required seniority level (`ENTRY`, `MID`, `SENIOR`, `LEAD`).
3. **$L$ (Location Match - 10%)**: Remote compatibility vs matching country, state, or city for local roles.
4. **$G$ (Career Goal Match - 10%)**: Target role alignment with the job title.
5. **$A$ (AI Semantic Context - 10%)**: Bio, headline, and domain relevance similarity index.

## 2. AI Capabilities

- **AI Skill Gap Analysis**: Identifies missing libraries and architectures needed to achieve career goals.
- **Dynamic Career Roadmaps**: Generates 6-stage milestones connecting directly to platform courses, mentors, projects, and target job postings.
- **AI Proposal Generator**: Crafts structured proposals with milestone architectures and delivery timelines.
- **AI Communication Assistant**: Real-time message polishing across Professional, Friendly, Concise, Persuasive, and Grammar Fix tones.
- **Resume Parser**: Extracts technical competencies and suggests title / experience seniority from raw text.
- **Zero-Hallucination Fallback**: `MOCK_AI=true` ensures the system functions reliably offline without external API dependencies.
