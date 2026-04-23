import { supabase } from '@/lib/supabase';
import type { SkillRow } from '@/mappers/skills';
import { mapSkillRow } from '@/mappers/skills';
import type { Skill } from '@/types/skills';

export const ACTIVE_SKILLS_SELECT =
  '*, profiles!skills_teacher_id_fkey(id, first_name, last_name, avatar_url, bio, neighborhood, city, trust_tier, trust_score, sessions_completed, reviews_count)';

export async function fetchActiveSkillRows(): Promise<SkillRow[]> {
  const { data, error } = await supabase
    .from('skills')
    .select(ACTIVE_SKILLS_SELECT)
    .eq('is_active', true);

  if (error) throw error;
  return (data ?? []) as SkillRow[];
}

export async function fetchActiveSkills(): Promise<Skill[]> {
  const rows = await fetchActiveSkillRows();
  return rows.map(mapSkillRow);
}
