import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import type { ClubLesson } from '@/types/clubs';

export function useStudentLessons(courseId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.student.lessons(courseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('position', { ascending: true });

      if (error) throw error;
      return (data ?? []) as ClubLesson[];
    },
    enabled,
  });
}