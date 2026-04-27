import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import type { ClubCourse } from '@/types/clubs';

interface CourseWithCounts extends ClubCourse {
  file_count: number;
  lesson_count: number;
}

export function useStudentCourses(clubId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.student.courses(clubId),
    queryFn: async () => {
      // Get courses
      const { data: courses, error } = await supabase
        .from('club_courses')
        .select('*')
        .eq('club_id', clubId)
        .order('position', { ascending: true });

      if (error) throw error;
      if (!courses) return [];

      // Get file counts per course
      const { data: fileCounts } = await supabase
        .from('club_shared_files')
        .select('course_id, id')
        .eq('club_id', clubId);

      // Get lesson counts per course
      const { data: lessonCounts } = await supabase
        .from('club_lessons')
        .select('course_id, id')
        .eq('club_id', clubId);

      const fileCountMap = fileCounts?.reduce((acc, f) => {
        acc[f.course_id] = (acc[f.course_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const lessonCountMap = lessonCounts?.reduce((acc, l) => {
        acc[l.course_id] = (acc[l.course_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const coursesWithCounts: CourseWithCounts[] = courses.map(course => ({
        ...course,
        file_count: fileCountMap[course.id] || 0,
        lesson_count: lessonCountMap[course.id] || 0,
      }));

      return coursesWithCounts;
    },
    enabled,
  });
}