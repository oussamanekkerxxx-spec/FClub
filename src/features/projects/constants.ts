import type { ProjectStatus, ProjectTaskStatus } from './types';

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string; label: string }> = {
  idea: { bg: '#EDE9FE', text: '#6D28D9', label: 'Idea' },
  active: { bg: '#DCFCE7', text: '#16A34A', label: 'Active' },
  paused: { bg: '#FEF9C3', text: '#CA8A04', label: 'Paused' },
  completed: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Completed' },
  open: { bg: '#FFE8CC', text: '#D97706', label: 'Open' },
};

export const PROJECT_TASK_COLUMNS: ReadonlyArray<{ id: ProjectTaskStatus; label: string }> = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

export const NEXT_TASK_STATUS: Record<ProjectTaskStatus, ProjectTaskStatus | null> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: null,
};
