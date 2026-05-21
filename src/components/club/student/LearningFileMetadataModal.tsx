import { useState, useEffect } from 'react';
import { X, FileText, Loader2, BookOpen, ChevronDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { MathField, ClubCourse, ClubLesson } from '@/types/clubs';

interface LearningFileMetadataModalProps {
  file: File;
  fileKind: string;
  clubId: string;
  user?: { id: string };
  onSubmit: (data: {
    file: File;
    fileKind: string;
    title: string;
    description: string;
    courseId: string;
    lessonId: string | null;
    category: string;
    mathField: MathField | null;
  }) => Promise<void>;
  onSkip: () => Promise<void>;
  onClose: () => void;
}

const FILE_KIND_ICONS: Record<string, string> = {
  pdf: '📄',
  document: '📝',
  slides: '📊',
  spreadsheet: '📈',
  video: '🎬',
  audio: '🎧',
  image: '🖼',
  other: '📎',
};

export default function LearningFileMetadataModal({
  file,
  fileKind,
  clubId,
  user,
  onSubmit,
  onSkip,
  onClose,
}: LearningFileMetadataModalProps) {
  const [title, setTitle] = useState(file.name.replace(/\.[^/.]+$/, ''));
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [courses, setCourses] = useState<ClubCourse[]>([]);
  const [lessons, setLessons] = useState<ClubLesson[]>([]);
  const [courseId, setCourseId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function loadCoursesAndRole() {
      setCoursesLoading(true);
      const { data: courseData, error: courseError } = await supabase
        .from('club_courses')
        .select('*')
        .eq('club_id', clubId)
        .eq('is_published', true)
        .order('position', { ascending: true });
      
      if (!courseError && courseData) {
        setCourses(courseData as ClubCourse[]);
        if (courseData.length > 0) {
          setCourseId(courseData[0].id);
        }
      }
      setCoursesLoading(false);

      if (user?.id) {
        const { data: mem } = await supabase
          .from('club_memberships')
          .select('role')
          .eq('club_id', clubId)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        setUserRole(mem?.role ?? 'member');
      }
    }
    if (clubId) loadCoursesAndRole();
  }, [clubId, user?.id]);

  useEffect(() => {
    async function loadLessons() {
      if (!courseId) {
        setLessons([]);
        return;
      }
      const { data, error } = await supabase
        .from('club_lessons')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('position', { ascending: true });
      
      if (!error && data) {
        setLessons(data as ClubLesson[]);
      }
    }
    loadLessons();
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category || loading) return;

    setLoading(true);
    
    let finalCourseId = courseId;

    // If no course selected, auto-create one (admins/moderators only)
    if (!finalCourseId && clubId && user && category) {
      const canCreateCourse = userRole === 'admin' || userRole === 'moderator';

      // Check if course exists for this subject
      const { data: existing } = await supabase
        .from('club_courses')
        .select('id')
        .eq('club_id', clubId)
        .eq('math_field', category)
        .limit(1)
        .maybeSingle();
      
      if (existing?.id) {
        finalCourseId = existing.id;
      } else if (canCreateCourse) {
        // Create new course
        const { data: newCourse, error: courseError } = await supabase
          .from('club_courses')
          .insert({
            club_id: clubId,
            title: newCourseTitle || (category.charAt(0).toUpperCase() + category.slice(1)),
            description: newCourseDesc || null,
            math_field: category as MathField,
            created_by: user.id,
          })
          .select('id')
          .single();
        
        if (courseError || !newCourse) {
          toast.error('Could not create course: ' + (courseError?.message || 'error'));
          setLoading(false);
          return;
        }
        finalCourseId = newCourse.id;
      } else {
        toast.error('No course exists for this subject. Ask a moderator to create one, or send the file in chat only.');
        setLoading(false);
        return;
      }
    }

    if (!finalCourseId) {
      toast.error('Please select a course');
      setLoading(false);
      return;
    }

    await onSubmit({
      file,
      fileKind,
      title: title.trim(),
      description: description.trim(),
      courseId: finalCourseId,
      lessonId: lessonId || null,
      category: category.trim(),
      mathField: (category as MathField) || null,
    });
    setLoading(false);
  };

  const isValid = title.trim().length > 0 && category.length > 0;

  const groupedCourses = courses.reduce((acc, course) => {
    const field = course.math_field || 'other';
    if (!acc[field]) acc[field] = [];
    acc[field].push(course);
    return acc;
  }, {} as Record<string, ClubCourse[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[11px] font-bold text-orange-700">
              {FILE_KIND_ICONS[fileKind] || 'FILE'}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-navy">Share File</h2>
              <p className="text-[11px] text-[var(--color-text-muted)]">Add to courses or send in chat</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-[var(--color-text-muted)] hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-gray-50 p-3">
            <FileText className="h-5 w-5 text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-navy">{file.name}</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 3 Notes"
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this file about?"
              rows={2}
              className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Subject <span className="text-red-400">*</span></label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 appearance-none cursor-pointer"
              >
                <option value="">Select subject...</option>
                <option value="math">Math</option>
                <option value="physics">Physics</option>
                <option value="biology">Biology</option>
                <option value="chemistry">Chemistry</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-semibold text-navy">Course</label>
              {(userRole === 'admin' || userRole === 'moderator') && (
                <button
                  type="button"
                  onClick={() => setShowNewCourse(!showNewCourse)}
                  className="text-[11px] text-[var(--color-amber)] hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> New Course
                </button>
              )}
            </div>
            
            {showNewCourse ? (
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <input
                  type="text"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="Course title e.g., Algebra Basics"
                  className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                />
                <textarea
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  placeholder="Course description (optional)"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                />
              </div>
            ) : (
              <div className="relative">
                <select
                  value={courseId}
                  onChange={(e) => { setCourseId(e.target.value); setLessonId(''); }}
                  disabled={coursesLoading}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 appearance-none cursor-pointer"
                >
                  <option value="">Select existing course...</option>
                  {Object.entries(groupedCourses).map(([field, fieldCourses]) => (
                    <optgroup key={field} label={field.charAt(0).toUpperCase() + field.slice(1)}>
                      {fieldCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>

          {lessons.length > 0 && (
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-navy">Lesson (optional)</label>
              <div className="relative">
                <select
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 appearance-none cursor-pointer"
                >
                  <option value="">Course-level (no lesson)</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[var(--color-border)] bg-gray-50 px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-amber)] to-orange-500 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                {loading ? 'Sharing...' : 'Share to Course'}
              </button>
            </div>
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                await onSkip();
                setLoading(false);
              }}
              disabled={loading}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              📎 Send in chat only
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
