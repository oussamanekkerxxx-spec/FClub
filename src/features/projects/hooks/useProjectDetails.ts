import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import {
  createProjectTask,
  deleteProjectTask,
  fetchProjectBoard,
  getClubProject,
  joinProject,
  leaveProject,
  setProjectProgress,
  updateProjectTaskStatus,
} from '@/features/projects/api';
import type {
  ClubProject,
  ProjectMember,
  ProjectTask,
  ProjectTaskStatus,
} from '@/features/projects/types';

export interface ProjectBoard {
  tasks: ProjectTask[];
  members: ProjectMember[];
}

export interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

interface UseProjectDetailsOptions {
  projectId: string | undefined;
}

interface UseProjectDetailsResult {
  project: ClubProject | null;
  board: ProjectBoard | null;
  chat: ChatMessage[];
  loading: boolean;
  chatLoading: boolean;
  setTaskStatus: (taskId: string, status: ProjectTaskStatus) => Promise<void>;
  addTask: (title: string, status: ProjectTaskStatus, orderIndex: number) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  toggleMembership: (userId: string) => Promise<void>;
  syncProgress: (progress: number) => Promise<void>;
}

async function fetchChat(channelId: string): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from('club_messages')
    .select('id, content, created_at, sender:profiles!club_messages_sender_id_fkey(first_name, last_name, avatar_url)')
    .eq('channel_id', channelId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20);

  return ((data ?? []) as Record<string, unknown>[])
    .map((row) => {
      const sender = Array.isArray(row.sender) ? row.sender[0] : row.sender;
      return {
        id: row.id as string,
        content: (row.content as string) ?? '',
        created_at: row.created_at as string,
        sender_name: `${sender?.first_name ?? ''} ${sender?.last_name ?? ''}`.trim() || 'Club member',
        sender_avatar: (sender as Record<string, unknown>)?.avatar_url as string | null,
      } satisfies ChatMessage;
    })
    .reverse();
}

export function useProjectDetails({ projectId }: UseProjectDetailsOptions): UseProjectDetailsResult {
  const qc = useQueryClient();

  // ── Project detail ───────────────────────────────────────────────────────

  const projectQuery = useQuery({
    queryKey: projectId ? queryKeys.projects.detail(projectId) : ['project', '__disabled__'],
    queryFn: () => getClubProject(projectId!),
    enabled: !!projectId,
    staleTime: 60_000,
  });

  const project = projectQuery.data ?? null;
  const channelId = project?.channel_id ?? null;

  // ── Kanban board ─────────────────────────────────────────────────────────

  const boardQuery = useQuery({
    queryKey: projectId ? queryKeys.projects.board(projectId) : ['board', '__disabled__'],
    queryFn: () => fetchProjectBoard(projectId!),
    enabled: !!projectId,
    staleTime: 30_000,
  });

  const board = boardQuery.data ?? null;

  // ── Chat messages ───────────────────────────────────────────────────────

  const chatQuery = useQuery({
    queryKey: channelId ? queryKeys.projects.chat(channelId) : ['chat', '__disabled__'],
    queryFn: () => fetchChat(channelId!),
    enabled: !!channelId,
    staleTime: 30_000,
  });

  const chat = chatQuery.data ?? [];

  // ── Loading ────────────────────────────────────────────────────────────

  const loading = projectQuery.isLoading || boardQuery.isLoading;
  const chatLoading = chatQuery.isLoading;

  // ── Mutations ───────────────────────────────────────────────────────────

  const setTaskStatus = useCallback(
    async (taskId: string, status: ProjectTaskStatus) => {
      if (!projectId) return;
      await updateProjectTaskStatus(taskId, status);
      qc.setQueryData<ProjectBoard>(queryKeys.projects.board(projectId), (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
        };
      });
    },
    [projectId, qc]
  );

  const addTask = useCallback(
    async (title: string, status: ProjectTaskStatus, orderIndex: number) => {
      if (!projectId) return;
      const created = await createProjectTask(projectId, title, status, orderIndex);
      qc.setQueryData<ProjectBoard>(queryKeys.projects.board(projectId), (prev) => {
        if (!prev) return prev;
        return { ...prev, tasks: [...prev.tasks, created] };
      });
    },
    [projectId, qc]
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      if (!projectId) return;
      await deleteProjectTask(taskId);
      qc.setQueryData<ProjectBoard>(queryKeys.projects.board(projectId), (prev) => {
        if (!prev) return prev;
        return { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) };
      });
    },
    [projectId, qc]
  );

  const toggleMembership = useCallback(
    async (userId: string) => {
      if (!projectId) return;
      const isMember = board?.members.some((m) => m.user_id === userId) ?? false;
      if (isMember) {
        await leaveProject(projectId, userId);
        qc.setQueryData<ProjectBoard>(queryKeys.projects.board(projectId), (prev) => {
          if (!prev) return prev;
          return { ...prev, members: prev.members.filter((m) => m.user_id !== userId) };
        });
      } else {
        await joinProject(projectId, userId);
        qc.setQueryData<ProjectBoard>(queryKeys.projects.board(projectId), (prev) => {
          if (!prev) return prev;
          return { ...prev, members: [...prev.members, { user_id: userId, profile: null }] };
        });
      }
    },
    [projectId, board, qc]
  );

  const syncProgress = useCallback(
    async (progress: number) => {
      if (!projectId) return;
      await setProjectProgress(projectId, progress);
      qc.setQueryData<ClubProject | null>(queryKeys.projects.detail(projectId), (prev) => {
        if (!prev) return prev;
        return { ...prev, progress };
      });
    },
    [projectId, qc]
  );

  return {
    project,
    board,
    chat,
    loading,
    chatLoading,
    setTaskStatus,
    addTask,
    removeTask,
    toggleMembership,
    syncProgress,
  };
}