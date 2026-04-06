import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Clock3,
  ExternalLink,
  FolderKanban,
  Github,
  Loader2,
  MessageSquare,
  Shield,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { PROJECT_STATUS_COLORS } from '@/features/projects/constants';
import { fetchProjectBoard, getClubProject } from '@/features/projects/api';
import type { ClubProject, ProjectMember, ProjectTask } from '@/features/projects/types';
import { normalizeHttpUrl } from '@/lib/safeUrl';

function initials(member?: ProjectMember): string {
  if (!member?.profile) return '?';
  const first = member.profile.first_name?.[0] ?? '';
  const last = member.profile.last_name?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || '?';
}

export default function ProjectDetails() {
  const { clubId, projectId } = useParams<{ clubId: string; projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<ClubProject | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProject() {
      if (!projectId) {
        if (mounted) setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [projectData, board] = await Promise.all([
          getClubProject(projectId),
          fetchProjectBoard(projectId).catch(() => ({ tasks: [], members: [] })),
        ]);

        if (!mounted) return;
        setProject(projectData);
        setTasks(board.tasks);
        setMembers(board.members.length > 0 ? board.members : projectData?.members ?? []);
      } catch {
        if (mounted) {
          toast.error('Could not load project details');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProject();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  const statusConfig = project ? PROJECT_STATUS_COLORS[project.status] ?? PROJECT_STATUS_COLORS.idea : PROJECT_STATUS_COLORS.idea;

  const progress = useMemo(() => {
    if (!project) return 0;
    if (typeof project.progress === 'number') return project.progress;
    if (tasks.length === 0) return 0;
    const done = tasks.filter((task) => task.status === 'done').length;
    return Math.round((done / tasks.length) * 100);
  }, [project, tasks]);

  const acceptedByRole = useMemo(() => {
    const map = new Map<string, number>();
    project?.applications?.forEach((application) => {
      if (application.status !== 'accepted') return;
      map.set(application.role_id, (map.get(application.role_id) ?? 0) + 1);
    });
    return map;
  }, [project]);

  const isCreator = !!user && !!project && (project.creator_id === user.id || project.created_by === user.id);
  const safeGithubUrl = normalizeHttpUrl(project?.github_url);
  const safeFigmaUrl = normalizeHttpUrl(project?.figma_url);
  const safeNotionUrl = normalizeHttpUrl(project?.notion_url);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-amber)]" />
      </div>
    );
  }

  if (!project || !clubId) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-navy mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="sc-card p-10 text-center">
          <FolderKanban className="w-8 h-8 mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="font-semibold text-sm text-navy">Project not found</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            This project may have been removed or you may not have access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <button
        onClick={() => navigate(`/club/${clubId}`)}
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Club
      </button>

      <section className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.25),transparent_55%)]" />
        <div className="relative p-6 sm:p-7">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: statusConfig.bg, color: statusConfig.text }}>
              {statusConfig.label}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-white/10 text-white border border-white/15">
              {project.visibility ?? 'club'} visibility
            </span>
            {isCreator && (
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-white/10 text-white border border-white/15">
                Creator view
              </span>
            )}
          </div>
          <h1 className="font-heading text-white text-2xl sm:text-3xl font-bold leading-tight">{project.title}</h1>
          <p className="text-sm text-white/80 mt-2 max-w-3xl">
            {project.pitch?.trim() || project.description?.trim() || 'Collaborative club project.'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="rounded-xl bg-white/10 border border-white/15 p-3">
              <div className="text-[11px] text-white/70 uppercase tracking-wide">Progress</div>
              <div className="text-lg font-bold text-white mt-0.5">{progress}%</div>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/15 p-3">
              <div className="text-[11px] text-white/70 uppercase tracking-wide">Participants</div>
              <div className="text-lg font-bold text-white mt-0.5">{members.length}</div>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/15 p-3">
              <div className="text-[11px] text-white/70 uppercase tracking-wide">Tasks</div>
              <div className="text-lg font-bold text-white mt-0.5">{tasks.length}</div>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/15 p-3">
              <div className="text-[11px] text-white/70 uppercase tracking-wide">Meetings</div>
              <div className="text-lg font-bold text-white mt-0.5">{project.meetings?.length ?? 0}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        <article className="sc-card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-navy mb-2">Overview</h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {project.description?.trim() || 'No full description has been added yet.'}
          </p>
          <div className="flex flex-wrap gap-3 mt-4 text-xs text-[var(--color-text-muted)]">
            {project.start_date && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Starts {format(new Date(project.start_date), 'MMM d, yyyy')}
              </span>
            )}
            {project.duration_weeks && (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="w-3.5 h-3.5" />
                {project.duration_weeks} week plan
              </span>
            )}
            {project.hours_per_week && (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="w-3.5 h-3.5" />
                {project.hours_per_week}h/week expected
              </span>
            )}
          </div>
        </article>

        <article className="sc-card p-5">
          <h2 className="text-sm font-semibold text-navy mb-3">Links</h2>
          <div className="space-y-2">
            {safeGithubUrl ? (
              <a
                href={safeGithubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-sm text-[var(--color-text-secondary)]"
              >
                <span className="inline-flex items-center gap-2"><Github className="w-4 h-4" /> GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : null}
            {safeFigmaUrl ? (
              <a
                href={safeFigmaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-sm text-[var(--color-text-secondary)]"
              >
                <span>Figma</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : null}
            {safeNotionUrl ? (
              <a
                href={safeNotionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-sm text-[var(--color-text-secondary)]"
              >
                <span>Notion</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : null}
            {!safeGithubUrl && !safeFigmaUrl && !safeNotionUrl && (
              <p className="text-xs text-[var(--color-text-muted)]">No external workspace links yet.</p>
            )}
          </div>
        </article>
      </section>

      <section className="grid lg:grid-cols-2 gap-5">
        <article className="sc-card p-5">
          <h2 className="text-sm font-semibold text-navy mb-3 inline-flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[var(--color-amber)]" />
            Team
          </h2>
          {members.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">No one has joined this project yet.</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--color-bg-secondary)]">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">{initials(member)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">
                      {member.profile ? `${member.profile.first_name} ${member.profile.last_name}` : 'Club member'}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{member.user_id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="sc-card p-5">
          <h2 className="text-sm font-semibold text-navy mb-3">Roles & Skills</h2>
          <div className="space-y-3">
            {project.roles && project.roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.roles.map((role) => {
                  const filled = acceptedByRole.get(role.id) ?? 0;
                  return (
                    <div key={role.id} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                      {role.title} {filled}/{role.slots_needed}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">No explicit roles set yet.</p>
            )}

            {project.skills && project.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {project.skills.map((skill) => (
                  <span key={skill.id} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                    {skill.skill_name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">No stack tags yet.</p>
            )}
          </div>
        </article>
      </section>

      <section className="sc-card p-5">
        <h2 className="text-sm font-semibold text-navy mb-3">Task Progress</h2>
        <div className="h-2 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--color-amber)] transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 grid sm:grid-cols-3 gap-2 text-xs">
          <div className="px-3 py-2 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
            To do: {tasks.filter((task) => task.status === 'todo').length}
          </div>
          <div className="px-3 py-2 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
            In progress: {tasks.filter((task) => task.status === 'in_progress').length}
          </div>
          <div className="px-3 py-2 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
            Done: {tasks.filter((task) => task.status === 'done').length}
          </div>
        </div>
      </section>

      <section className="sc-card p-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-navy">Project conversation</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Most updates, votes, files, and decisions happen in the club chat.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/app/club/${clubId}/chat`}
            className="btn-amber text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
            style={{ padding: '6px 12px' }}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Open Chat
          </Link>
          <span className="text-xs inline-flex items-center gap-1 text-[var(--color-text-muted)]">
            <Shield className="w-3.5 h-3.5" />
            More project analytics planned next phase
          </span>
        </div>
      </section>
    </div>
  );
}
