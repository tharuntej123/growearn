import { HybridMatchResult } from './types';

export interface UserMatchProfile {
  skills: string[];
  yearsExperience: number;
  location?: string;
  careerGoal?: string;
  headline?: string;
  bio?: string;
}

export interface JobMatchRequirement {
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: string; // ENTRY, MID, SENIOR, LEAD
  locationType: string; // REMOTE, ONSITE, HYBRID
  country?: string;
  state?: string;
  city?: string;
}

export class HybridMatcher {
  /**
   * Calculates a 5-factor transparent explainable hybrid match score
   * Skills: 50%, Experience: 20%, Location: 10%, Career Goal: 10%, AI Semantic: 10%
   */
  static calculateJobMatch(
    user: UserMatchProfile,
    job: JobMatchRequirement
  ): HybridMatchResult {
    const userSkillsLower = user.skills.map((s) => s.toLowerCase().trim());
    const jobSkillsLower = job.requiredSkills.map((s) => s.toLowerCase().trim());

    // 1. Skill Match (50% weight)
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    jobSkillsLower.forEach((reqSkill) => {
      const found = userSkillsLower.some(
        (uSkill) => uSkill.includes(reqSkill) || reqSkill.includes(uSkill)
      );
      if (found) {
        matchedSkills.push(reqSkill);
      } else {
        missingSkills.push(reqSkill);
      }
    });

    const skillScore =
      jobSkillsLower.length > 0
        ? Math.round((matchedSkills.length / jobSkillsLower.length) * 100)
        : 85;

    // 2. Experience Match (20% weight)
    let requiredYears = 2;
    if (job.experienceLevel === 'ENTRY') requiredYears = 0;
    else if (job.experienceLevel === 'MID') requiredYears = 2;
    else if (job.experienceLevel === 'SENIOR') requiredYears = 5;
    else if (job.experienceLevel === 'LEAD') requiredYears = 8;

    let expScore = 100;
    if (user.yearsExperience < requiredYears) {
      expScore = Math.max(40, Math.round((user.yearsExperience / requiredYears) * 100));
    }

    // 3. Location Match (10% weight)
    let locationScore = 100;
    let locationExplanation = 'Remote position — open globally';

    if (job.locationType === 'REMOTE') {
      locationScore = 100;
      locationExplanation = '100% Remote flexibility matched';
    } else {
      const userLoc = (user.location || '').toLowerCase();
      const jobCity = (job.city || '').toLowerCase();
      const jobState = (job.state || '').toLowerCase();
      const jobCountry = (job.country || '').toLowerCase();

      if (userLoc.includes(jobCity) && jobCity.length > 0) {
        locationScore = 100;
        locationExplanation = `Direct local match in ${job.city}`;
      } else if (userLoc.includes(jobState) && jobState.length > 0) {
        locationScore = 85;
        locationExplanation = `State/Regional match in ${job.state}`;
      } else if (userLoc.includes(jobCountry) && jobCountry.length > 0) {
        locationScore = 70;
        locationExplanation = `Country match in ${job.country}`;
      } else {
        locationScore = 40;
        locationExplanation = `Location mismatch (${job.locationType} in ${job.city || job.country})`;
      }
    }

    // 4. Career Goal Match (10% weight)
    let goalScore = 75;
    let goalExplanation = 'General alignment with career aspirations';
    if (user.careerGoal) {
      const goalLower = user.careerGoal.toLowerCase();
      const titleLower = job.title.toLowerCase();
      if (titleLower.includes(goalLower) || goalLower.includes(titleLower)) {
        goalScore = 100;
        goalExplanation = `Strong alignment with your target goal of "${user.careerGoal}"`;
      } else if (
        (goalLower.includes('backend') && titleLower.includes('backend')) ||
        (goalLower.includes('frontend') && titleLower.includes('frontend')) ||
        (goalLower.includes('full stack') && titleLower.includes('stack')) ||
        (goalLower.includes('ai') && titleLower.includes('ai'))
      ) {
        goalScore = 90;
        goalExplanation = `High domain alignment with "${user.careerGoal}"`;
      }
    }

    // 5. AI Semantic Score (10% weight)
    const combinedProfileText = `${user.headline || ''} ${user.bio || ''} ${user.skills.join(' ')}`.toLowerCase();
    const combinedJobText = `${job.title} ${job.description}`.toLowerCase();
    let semanticMatches = 0;
    const keywords = ['react', 'node', 'typescript', 'python', 'java', 'sql', 'docker', 'aws', 'api', 'architecture'];
    keywords.forEach((kw) => {
      if (combinedProfileText.includes(kw) && combinedJobText.includes(kw)) {
        semanticMatches++;
      }
    });

    const semanticScore = Math.min(100, Math.max(60, 60 + semanticMatches * 8));
    const semanticReasoning = `Contextual domain similarity index evaluated at ${semanticScore}%`;

    // Calculate weighted total: 50% + 20% + 10% + 10% + 10%
    const totalScore = Math.round(
      skillScore * 0.5 +
        expScore * 0.2 +
        locationScore * 0.1 +
        goalScore * 0.1 +
        semanticScore * 0.1
    );

    // Build human-readable explanation
    const matchDetails = matchedSkills.length > 0 ? `Matched: ${matchedSkills.join(', ')}` : 'No direct skill overlap';
    const gapDetails = missingSkills.length > 0 ? `• Missing: ${missingSkills.join(', ')}` : '• All required skills covered';
    const finalExplanation = `${totalScore}% Match — ${matchDetails}. ${gapDetails}. Experience (${user.yearsExperience} yrs vs ${requiredYears} yrs req).`;

    return {
      overallScore: totalScore,
      factors: {
        skillMatch: { score: skillScore, weight: 50, matched: matchedSkills, missing: missingSkills },
        experienceMatch: { score: expScore, weight: 20, userYears: user.yearsExperience, requiredYears },
        locationMatch: { score: locationScore, weight: 10, explanation: locationExplanation },
        careerGoalMatch: { score: goalScore, weight: 10, alignment: goalExplanation },
        aiSemanticScore: { score: semanticScore, weight: 10, reasoning: semanticReasoning },
      },
      explanation: finalExplanation,
    };
  }
}
