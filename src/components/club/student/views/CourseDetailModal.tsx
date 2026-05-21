import { useStudentLessons } from '@/hooks/useStudentLessons';
import { X, BookOpen, Loader2 } from 'lucide-react';
import type { ClubCourse } from '@/types/clubs';

interface Props {
  course: ClubCourse | null;
  onClose: () => void;
}

export function CourseDetailModal({ course, onClose }: Props) {
  const { data: lessons, isLoading } = useStudentLessons(course?.id ?? '', !!course);

  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-[16px] font-bold text-navy">{course.title}</h2>
            {course.description ? (
              <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">{course.description}</p>
            ) : null}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-[var(--color-text-muted)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-amber)]" />
            </div>
          ) : !lessons || lessons.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen className="w-8 h-8 text-orange-200 mx-auto mb-3" />
              <p className="text-[13px] font-semibold text-navy">No lessons yet</p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Lessons will appear here once added.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, idx) => (
                <div
                  key={lesson.id}
                  className="flex items-start gap-3 p-3 bg-parchment/50 border border-[var(--color-border)] rounded-xl hover:border-orange-200 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-[11px] font-bold text-amber-700 flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-navy">{lesson.title}</div>
                    {lesson.description ? (
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{lesson.description}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
