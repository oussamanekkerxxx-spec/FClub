// Shared domain types for SKILLCLUB — derived from the Supabase schema.

export type Category =
  | 'music' | 'languages' | 'technology' | 'cooking' | 'art'
  | 'fitness' | 'crafts' | 'writing' | 'photography' | 'business';

export type Format = 'online' | 'in-person' | 'both';

export type SkillLevel = 'all levels' | 'beginner' | 'intermediate' | 'advanced';

export type SkillStatus = 'active' | 'paused';

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
  is_group: boolean;
  max_headcount: number | null;
  current_headcount: number;
  availability_note: string | null;
  status: SkillStatus;
  created_at: string;
  teacher: SkillTeacher;
}
