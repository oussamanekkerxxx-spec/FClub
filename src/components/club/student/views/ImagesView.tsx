import { useState, useMemo } from 'react';
import { useStudentSharedFiles } from '@/hooks/useStudentSharedFiles';
import { useStudentCourses } from '@/hooks/useStudentCourses';
import { ImageIcon, X, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import EmptyState from '@/components/club/EmptyState';
import SkeletonCard from '@/components/club/SkeletonCard';
import type { ClubSharedFile } from '@/types/clubs';

interface ImageGroup {
  courseId: string;
  courseTitle: string;
  mathField: string | null;
  items: ClubSharedFile[];
}

export function ImagesView({ clubId }: { clubId: string }) {
  const { data: images, isLoading: imagesLoading, error } = useStudentSharedFiles({
    clubId,
    kinds: ['image'],
    enabled: !!clubId,
  });
  const { data: courses, isLoading: coursesLoading } = useStudentCourses(clubId, !!clubId);
  const [selectedImage, setSelectedImage] = useState<ClubSharedFile | null>(null);

  const courseMap = useMemo(() => {
    const map = new Map<string, { title: string; math_field: string | null }>();
    courses?.forEach((c) => map.set(c.id, { title: c.title, math_field: c.math_field }));
    return map;
  }, [courses]);

  const groups: ImageGroup[] = useMemo(() => {
    if (!images) return [];
    const groupMap = new Map<string, ImageGroup>();

    images.forEach((img) => {
      const course = courseMap.get(img.course_id);
      const key = img.course_id;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          courseId: key,
          courseTitle: course?.title || 'Unknown Course',
          mathField: course?.math_field || null,
          items: [],
        });
      }
      groupMap.get(key)!.items.push(img);
    });

    return Array.from(groupMap.values());
  }, [images, courseMap]);

  const isLoading = imagesLoading || coursesLoading;

  if (!clubId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ImageIcon className="w-6 h-6 text-[var(--color-text-muted)]" />}
          title="Select a club"
          subtitle="Join a student club to view learning images."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <SkeletonCard count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ImageIcon className="w-6 h-6 text-red-400" />}
          title="Failed to load images"
          subtitle="Please try again later."
        />
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ImageIcon className="w-6 h-6 text-[var(--color-text-muted)]" />}
          title="No learning images yet"
          subtitle="Share useful images to courses and they will appear here."
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.courseId}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3.5 h-[2px] bg-gradient-to-r from-[var(--color-amber)] to-orange-500 rounded-full" />
              <span className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--color-text-muted)]">
                {group.courseTitle}
              </span>
              {group.mathField && (
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                  {group.mathField}
                </span>
              )}
              <span className="text-[9px] text-[var(--color-text-muted)] ml-auto">
                {group.items.length} image{group.items.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {group.items.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-[var(--color-border)] bg-gray-100 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all"
                  onClick={() => setSelectedImage(img)}
                >
                  <img
                    src={img.file_url}
                    alt={img.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-[11px] font-bold truncate">{img.title}</p>
                    {img.description && (
                      <p className="text-white/80 text-[10px] truncate mt-0.5">{img.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          onClick={() => setSelectedImage(null)}
        >
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex flex-col">
              <span className="text-white font-medium text-[15px]">{selectedImage.title}</span>
              <span className="text-white/60 text-xs">
                {format(new Date(selectedImage.created_at), 'MMMM d, yyyy • h:mm a')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={selectedImage.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
                title="Open in new tab"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-5 h-5" />
              </a>
              <a
                href={selectedImage.file_url}
                download={selectedImage.file_name}
                className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
                title="Download"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors ml-2"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex items-center justify-center p-4 cursor-zoom-out">
            <img
              src={selectedImage.file_url}
              alt={selectedImage.title}
              draggable={false}
              className="max-w-full max-h-full object-contain drop-shadow-2xl select-none outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {selectedImage.description && (
            <div className="p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
              <div className="max-w-3xl text-white text-[15px] font-body leading-relaxed text-center">
                {selectedImage.description}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
