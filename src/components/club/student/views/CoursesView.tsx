import { useState } from 'react';
import { useStudentCourses } from '@/hooks/useStudentCourses';
import { FolderOpen } from 'lucide-react';
import EmptyState from '@/components/club/EmptyState';
import SkeletonCard from '@/components/club/SkeletonCard';
import type { ClubCourse } from '@/types/clubs';

import { PillNav, MATH_FIELD_LABELS } from './StudentViewShared';
import { CourseDetailModal } from './CourseDetailModal';


export function CoursesView({ clubId }: { clubId: string }) {
  const { data: courses, isLoading, error } = useStudentCourses(clubId, !!clubId);
  const [selectedCourse, setSelectedCourse] = useState<ClubCourse | null>(null);

  if (!clubId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<FolderOpen className="w-6 h-6 text-[var(--color-text-muted)]" />}
          title="Select a club"
          subtitle="Join a student club to view courses."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <SkeletonCard count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<FolderOpen className="w-6 h-6 text-red-400" />}
          title="Failed to load courses"
          subtitle="Please try again later."
        />
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<FolderOpen className="w-6 h-6 text-[var(--color-text-muted)]" />}
          title="No courses yet"
          subtitle="Courses will appear here once added by club moderators."
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PillNav items={['All', 'In Progress', 'Completed', 'New']} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <div
            key={course.id}
            onClick={() => setSelectedCourse(course)}
            className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden hover:-translate-y-1 hover:border-orange-200 transition-all cursor-pointer group shadow-sm"
          >
            <div className="h-28 relative">
              {course.cover_image_url ? (
                <img src={course.cover_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                  <FolderOpen className="w-8 h-8 text-orange-300" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-[14px] font-bold text-navy mb-1 group-hover:text-[var(--color-amber)] transition-colors">
                {course.title}
              </h3>
              {course.math_field ? (
                <div className="mb-2">
                  <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    {MATH_FIELD_LABELS[course.math_field] ?? course.math_field}
                  </span>
                </div>
              ) : null}
              {course.description ? (
                <p className="text-[11px] text-[var(--color-text-muted)] mb-3 line-clamp-2">
                  {course.description}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      {selectedCourse && (
        <CourseDetailModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />
      )}
    </div>
  );
}
