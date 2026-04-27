import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import type { ClubSharedFile, FileKind } from '@/types/clubs';

interface UseStudentSharedFilesParams {
  clubId: string;
  courseId?: string;
  lessonId?: string;
  kinds?: FileKind[];
  enabled?: boolean;
}

export function useStudentSharedFiles({
  clubId,
  courseId,
  lessonId,
  kinds,
  enabled = true,
}: UseStudentSharedFilesParams) {
  const kindsKey = kinds?.length ? [...kinds].sort().join(',') : 'all';

  return useQuery({
    queryKey: queryKeys.student.sharedFiles(clubId, courseId, lessonId, kindsKey),
    queryFn: async () => {
      let query = supabase
        .from('club_shared_files')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      }
      if (kinds && kinds.length > 0) {
        query = query.in('file_kind', kinds);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data ?? []) as ClubSharedFile[];
    },
    enabled: enabled && !!clubId,
  });
}
