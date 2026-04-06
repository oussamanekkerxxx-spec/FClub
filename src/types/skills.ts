import type { Category, Format, SkillLevel, SkillStatus } from './shared';

export type { Category, Format, SkillLevel, SkillStatus };

// ── Review (used by LeaveReviewModal → SkillDetail) ─────────────────────────
export interface Review {
  id: string;
  rating: number;
  content: string;
  tags: string[];
  created_at: string;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
    city: string;
  };
}

// ── Teacher profile embedded on a Skill ──────────────────────────────────────
// Note: snake_case fields mirror DB column names intentionally — mappers handle
// the boundary. A future pass can camelCase these once all consumers are updated.
export interface SkillTeacher {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  bio: string;
  location: string;
  city: string;
  trust_tier: 0 | 1 | 2 | 3 | 4;
  trust_score: number;
  archetype: 'giver' | 'seeker' | 'connector' | 'mixed';
  what_i_teach: string[];
  what_i_learn: string[];
  languages: string[];
  sessions_completed: number;
  reviews_count: number;
  joined_at: string;
}

// ── UI model for a skill listing ─────────────────────────────────────────────
// This is the camelCase-ready model. Fields that come from the DB are mapped
// through mapSkillRow in src/mappers/skills.ts — never spread raw rows here.
export interface Skill {
  id: string;
  slug: string;
  teacher_id: string;
  title: string;
  category: Category;
  description: string;
  philosophy: string;
  who_for: string;
  what_session_looks_like: string;
  price_per_hour: number;
  currency: string;
  format: Format;
  location: string;
  neighborhood: string;
  languages: string[];
  level: SkillLevel;
  avg_rating: number;
  reviews_count: number;
  tags: string[];
  cover_gradient: string;
  /** Null when no cover photo has been uploaded. */
  cover_image_url: string | null;
  is_free: boolean;
  is_group: boolean;
  max_headcount: number | null;
  current_headcount: number;
  availability_note: string | null;
  status: SkillStatus;
  created_at: string;
  teacher: SkillTeacher;
}
