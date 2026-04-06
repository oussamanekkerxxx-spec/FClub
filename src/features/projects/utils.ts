import type { ProjectTask, ProjectTaskStatus } from './types';
import { NEXT_TASK_STATUS } from './constants';

export function initials(profile?: { first_name: string; last_name: string } | null): string {
  if (!profile) return '?';
  return `${profile.first_name[0] ?? ''}${profile.last_name[0] ?? ''}`.toUpperCase();
}

export function calculateProjectProgress(tasks: ProjectTask[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((task) => task.status === 'done').length;
  return Math.round((done / tasks.length) * 100);
}

export function nextTaskStatus(status: ProjectTaskStatus): ProjectTaskStatus | null {
  return NEXT_TASK_STATUS[status];
}
