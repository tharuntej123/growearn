/**
 * @file intent-classifier.ts
 * @description Production Intent Classifier for user queries on GrowEarn.
 * 
 * Architecture:
 * - Replaces keyword if-else heuristics with structured zero-shot embedding similarity
 *   and semantic classification into 6 canonical categories.
 * 
 * Categories:
 * - course: Course discovery, syllabus, learning resources
 * - mentor: 1-on-1 mentorship, expert advice, coaching sessions
 * - jobs: Job listings, freelancing, proposals, hiring
 * - roadmap: Step-by-step career path, learning plan, skill progression
 * - profile: Resume parsing, portfolio analysis, profile enhancement
 * - general: Technical Q&A, conceptual questions, platform assistance
 * 
 * Input: Query string
 * Output: { intent: IntentCategory, confidence: number, rationale: string }
 */

import { generateEmbedding, isEmbeddingConfigured } from './embeddings';

export type IntentCategory = 'course' | 'mentor' | 'jobs' | 'roadmap' | 'profile' | 'general';

interface CategoryPrototype {
  category: IntentCategory;
  description: string;
  exemplars: string[];
  prototypeEmbedding?: number[];
}

const CATEGORY_PROTOTYPES: CategoryPrototype[] = [
  {
    category: 'roadmap',
    description: 'Structured step-by-step career roadmaps, learning timelines, curricula, and milestone guides',
    exemplars: [
      'Give me a roadmap for Backend Developer',
      'How to become a Full Stack Engineer step by step',
      'Show me learning path for DevOps and Cloud',
      'What should I learn in month 1 and month 2',
      'Curriculum to master System Design and Microservices',
    ],
  },
  {
    category: 'mentor',
    description: 'Mentorship programs, 1-on-1 coaching, senior architects, mock interviews, and code reviews',
    exemplars: [
      'Who are the available mentors for Java Spring Boot?',
      'Find a mentor to review my system architecture',
      'Book a 1-on-1 session with a senior engineer',
      'Who can guide me for FAANG coding interviews?',
      'List mentors specializing in AI and Machine Learning',
    ],
  },
  {
    category: 'jobs',
    description: 'Job postings, freelance contracts, client proposals, salaries, and hiring opportunities',
    exemplars: [
      'Show me open backend developer jobs in Chennai',
      'Are there freelance Next.js gigs available?',
      'Find high-paying remote cloud engineer positions',
      'How to apply for frontend developer internships',
      'Freelance projects matching my React and Node skills',
    ],
  },
  {
    category: 'course',
    description: 'Courses, video tutorials, modules, lessons, and certification classes',
    exemplars: [
      'What courses are available for PostgreSQL optimization?',
      'Recommend a comprehensive course for React 19 and Next.js',
      'Show me syllabus for Spring Boot microservices course',
      'Are there free or paid tutorials for Kubernetes?',
      'Explore courses in full stack development',
    ],
  },
  {
    category: 'profile',
    description: 'Resume audit, portfolio review, skill analysis, LinkedIn optimization, and user profile',
    exemplars: [
      'Analyze my missing skills for a senior role',
      'How can I improve my resume for frontend jobs?',
      'Audit my profile and tell me what to update',
      'Parse my uploaded resume text',
      'What skills do I need to add to reach 90+ score?',
    ],
  },
  {
    category: 'general',
    description: 'Technical software engineering concepts, coding questions, system architecture, and general platform help',
    exemplars: [
      'What is the difference between REST and GraphQL?',
      'How does PostgreSQL indexing with B-Trees work?',
      'Explain Kafka consumer groups and partitions',
      'How does GrowEarn verify mentor profiles?',
      'What is CAP theorem in distributed systems?',
    ],
  },
];

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

let prototypeEmbeddingsInitialized = false;

async function ensurePrototypes(): Promise<void> {
  if (prototypeEmbeddingsInitialized) return;

  for (const proto of CATEGORY_PROTOTYPES) {
    const combinedText = `${proto.description}. Exemplars: ${proto.exemplars.join(' | ')}`;
    proto.prototypeEmbedding = await generateEmbedding(combinedText);
  }

  prototypeEmbeddingsInitialized = true;
}

function classifyHeuristically(query: string): {
  intent: IntentCategory;
  confidence: number;
  scores: Record<IntentCategory, number>;
} {
  const q = query.toLowerCase();
  const scores: Record<IntentCategory, number> = {
    roadmap: 0.1,
    mentor: 0.1,
    jobs: 0.1,
    course: 0.1,
    profile: 0.1,
    general: 0.2,
  };

  let detected: IntentCategory = 'general';
  if (/\b(roadmap|roadmaps|career path|learning path|timeline|curriculum|step by step|how to become)\b/i.test(q)) {
    detected = 'roadmap';
    scores.roadmap = 0.95;
  } else if (/\b(mentor|mentors|mentorship|coach|coaches|coaching|1-on-1|mock interview|review my)\b/i.test(q)) {
    detected = 'mentor';
    scores.mentor = 0.95;
  } else if (/\b(job|jobs|gig|gigs|freelance|freelancer|hiring|vacanc|opening|openings|positions|salary|salaries|internship|internships)\b/i.test(q)) {
    detected = 'jobs';
    scores.jobs = 0.95;
  } else if (/\b(course|courses|tutorial|tutorials|syllabus|class|classes|module|lesson|learn .* fundamentals)\b/i.test(q)) {
    detected = 'course';
    scores.course = 0.95;
  } else if (/\b(resume|portfolio|audit.*profile|missing skill|missing skills|analyze.*skill|profile score)\b/i.test(q)) {
    detected = 'profile';
    scores.profile = 0.95;
  } else {
    detected = 'general';
    scores.general = 0.85;
  }

  return {
    intent: detected,
    confidence: scores[detected],
    scores,
  };
}

export class IntentClassifier {
  /**
   * Classify user query using vector similarity against category semantic prototypes.
   * Gracefully falls back to structured rule-based classification if embeddings provider is unavailable.
   */
  static async classify(query: string): Promise<{
    intent: IntentCategory;
    confidence: number;
    scores: Record<IntentCategory, number>;
  }> {
    if (!query || query.trim().length === 0) {
      return {
        intent: 'general',
        confidence: 1.0,
        scores: { course: 0, mentor: 0, jobs: 0, roadmap: 0, profile: 0, general: 1.0 },
      };
    }

    if (!isEmbeddingConfigured()) {
      return classifyHeuristically(query);
    }

    try {
      await ensurePrototypes();
      const queryEmbedding = await generateEmbedding(query);

      const scores: Record<IntentCategory, number> = {
        course: 0,
        mentor: 0,
        jobs: 0,
        roadmap: 0,
        profile: 0,
        general: 0,
      };

      let highestCategory: IntentCategory = 'general';
      let highestScore = -1;

      for (const proto of CATEGORY_PROTOTYPES) {
        if (proto.prototypeEmbedding) {
          const score = dotProduct(queryEmbedding, proto.prototypeEmbedding);
          const normalizedScore = Number(Math.max(0, Math.min(1, (score + 1) / 2)).toFixed(4));
          scores[proto.category] = normalizedScore;

          if (score > highestScore) {
            highestScore = score;
            highestCategory = proto.category;
          }
        }
      }

      return {
        intent: highestCategory,
        confidence: scores[highestCategory],
        scores,
      };
    } catch {
      return classifyHeuristically(query);
    }
  }
}
