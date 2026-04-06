import { useState } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Github,
  KanbanSquare,
  Loader2,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PROJECT_STATUS_COLORS, PROJECT_TASK_COLUMNS } from '@/features/projects/constants';
import {
  createProjectTask,
  deleteProjectTask,
  fetchProjectBoard,
  joinProject,
  leaveProject,
  setProjectProgress,
  updateProjectTaskStatus,
} from '@/features/projects/api';
import type { ClubProject, ProjectMember, ProjectTask } from '@/features/projects/types';
import { calculateProjectProgress, initials } from '@/features/projects/utils';
import { normalizeHttpUrl } from '@/lib/safeUrl';
import { ProjectTaskColumn } from './ProjectTaskColumn';

interface ProjectCardProps {
  project: ClubProject;
  userId: string | undefined;
  isActiveMember: boolean;
  canModerate: boolean;
  onProjectUpdate: (project: ClubProject) => void;
  onProjectDelete: (projectId: string) => void;
}

export function ProjectCard({
  project,
  userId,
  isActiveMember,
  canModerate,
  onProjectUpdate,
  onProjectDelete,
}: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [tasks, setTasks] = useState<ProjectTask[]>(project.tasks ?? []);
  const [members, setMembers] = useState<ProjectMember[]>(project.members ?? []);
  const statusConfig = PROJECT_STATUS_COLORS[project.status] ?? PROJECT_STATUS_COLORS.idea;
  const isProjectMember = members.some((member) => member.user_id === userId);
  const canDelete = canModerate || project.created_by === userId;
  const detailHref = `/app/club/${project.club_id}/projects/${project.id}`;
  const safeGithubUrl = normalizeHttpUrl(project.github_url);
  const safeFigmaUrl = normalizeHttpUrl(project.figma_url);
  const safeNotionUrl = normalizeHttpUrl(project.notion_url);

  const syncProgress = async (updatedTasks: ProjectTask[]) => {
    const progress = calculateProjectProgress(updatedTasks);
    await setProjectProgress(project.id, progress);
    onProjectUpdate({ ...project, progress });
  };

  const handleExpand = async () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    if (!nextExpanded || tasks.length > 0) return;

    setLoadingBoard(true);
    try {
      const board = await fetchProjectBoard(project.id);
      setTasks(board.tasks);
      setMembers(board.members);
    } catch {
      toast.error('Could not load project board');
    } finally {
      setLoadingBoard(false);
    }
  };

  const handleToggleMembership = async () => {
    if (!userId) return;
    try {
      if (isProjectMember) {
        await leaveProject(project.id, userId);
        setMembers((prev) => prev.filter((member) => member.user_id !== userId));
        toast('Left project');
      } else {
        await joinProject(project.id, userId);
        setMembers((prev) => [...prev, { user_id: userId }]);
        toast.success('Joined project');
      }
    } catch {
      toast.error('Could not update membership');
    }
  };

  const handleAdvanceTask = async (task: ProjectTask) => {
    try {
      await updateProjectTaskStatus(task.id, task.status);
      const updated = tasks.map((current) => (current.id === task.id ? { ...current, status: task.status } : current));
      setTasks(updated);
      await syncProgress(updated);
    } catch {
      toast.error('Could not update task');
    }
  };

  const handleAddTask = async (title: string, status: ProjectTask['status']) => {
    try {
      const createdTask = await createProjectTask(project.id, title, status, tasks.length);
      const updated = [...tasks, createdTask];
      setTasks(updated);
      await syncProgress(updated);
    } catch {
      toast.error('Could not add task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteProjectTask(taskId);
      const updated = tasks.filter((task) => task.id !== taskId);
      setTasks(updated);
      await syncProgress(updated);
    } catch {
      toast.error('Could not delete task');
    }
  };

  return (
    <div className="sc-card p-5 flex flex-col gap-4 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500" />
      <div className="absolute -top-16 -right-14 w-40 h-40 rounded-full bg-blue-100/50 blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-sm truncate">{project.title}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ background: statusConfig.bg, color: statusConfig.text }}>
              {statusConfig.label}
            </span>
          </div>
          {project.description && <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">{project.description}</p>}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isActiveMember && (
            <button
              onClick={handleToggleMembership}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                isProjectMember ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-red-500' : 'btn-amber'
              }`}
            >
              {isProjectMember ? 'Leave' : 'Join'}
            </button>
          )}
          {canDelete && (
            <button onClick={() => onProjectDelete(project.id)} className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors p-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
        {project.deadline && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(project.deadline), 'MMM d, yyyy')}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" /> {members.length} members
        </span>
        {safeGithubUrl && (
          <a href={safeGithubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[var(--color-amber)] transition-colors">
            <Github className="w-3.5 h-3.5" /> GitHub
          </a>
        )}
        {safeFigmaUrl && (
          <a href={safeFigmaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[var(--color-amber)] transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Figma
          </a>
        )}
        {safeNotionUrl && (
          <a href={safeNotionUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[var(--color-amber)] transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Notion
          </a>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${project.progress}%`, background: project.progress === 100 ? '#16A34A' : 'var(--color-amber)' }}
          />
        </div>
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] w-8 text-right">{project.progress}%</span>
      </div>

      {members.length > 0 && (
        <div className="flex -space-x-2">
          {members.slice(0, 6).map((member) => (
            <Avatar key={member.user_id} className="w-7 h-7 border-2 border-[var(--color-bg-card)]">
              <AvatarImage src={member.profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">{initials(member.profile)}</AvatarFallback>
            </Avatar>
          ))}
          {members.length > 6 && (
            <div className="w-7 h-7 rounded-full bg-[var(--color-bg-secondary)] border-2 border-[var(--color-bg-card)] flex items-center justify-center text-xs font-semibold text-[var(--color-text-secondary)]">
              +{members.length - 6}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handleExpand}
          className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-amber)] transition-colors font-medium"
        >
          <KanbanSquare className="w-3.5 h-3.5" />
          {expanded ? 'Hide' : 'Show'} Task Board
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <Link
          to={detailHref}
          className="text-xs font-semibold text-[var(--color-amber)] hover:underline inline-flex items-center gap-1"
        >
          See details
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {expanded &&
        (loadingBoard ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-amber)]" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[var(--color-border)]">
            {PROJECT_TASK_COLUMNS.map((column) => (
              <ProjectTaskColumn
                key={column.id}
                column={column}
                tasks={tasks.filter((task) => task.status === column.id)}
                canEdit={isActiveMember}
                onAdvance={handleAdvanceTask}
                onDelete={handleDeleteTask}
                onAddTask={handleAddTask}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
