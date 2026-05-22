import React, { createContext, useContext, useMemo } from 'react';
import { useStudentSharedFiles } from '@/hooks/useStudentSharedFiles';
import { useStudentCourses } from '@/hooks/useStudentCourses';
import type { ClubSharedFile, ClubCourse } from '@/types/clubs';

interface MessageSharedFileContextValue {
  /** Lookup a shared file by its linked message_id */
  getSharedFileByMessageId: (messageId: string) => ClubSharedFile | undefined;
  /** Lookup a course by its id */
  getCourseById: (courseId: string) => ClubCourse | undefined;
}

const MessageSharedFileContext = createContext<MessageSharedFileContextValue>({
  getSharedFileByMessageId: () => undefined,
  getCourseById: () => undefined,
});

export function MessageSharedFileProvider({
  clubId,
  children,
}: {
  clubId: string;
  children: React.ReactNode;
}) {
  const { data: sharedFiles } = useStudentSharedFiles({
    clubId,
    enabled: !!clubId,
  });
  const { data: courses } = useStudentCourses(clubId, !!clubId);

  const value = useMemo(() => {
    const fileMap = new Map<string, ClubSharedFile>();
    sharedFiles?.forEach((f) => {
      if (f.message_id) fileMap.set(f.message_id, f);
    });

    const courseMap = new Map<string, ClubCourse>();
    courses?.forEach((c) => courseMap.set(c.id, c));

    return {
      getSharedFileByMessageId: (messageId: string) => fileMap.get(messageId),
      getCourseById: (courseId: string) => courseMap.get(courseId),
    };
  }, [sharedFiles, courses]);

  return (
    <MessageSharedFileContext.Provider value={value}>
      {children}
    </MessageSharedFileContext.Provider>
  );
}

export function useMessageSharedFile() {
  return useContext(MessageSharedFileContext);
}
