import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock3,
  ExternalLink,
  Filter,
  FolderKanban,
  Github,
  LayoutGrid,
  List,
  Loader2,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { PROJECT_STATUS_COLORS, PROJECT_TASK_COLUMNS } from '@/features/projects/constants';
import {
  calculateProjectProgress,
  nextTaskStatus,
} from '@/features/projects/utils';
import { useProjectDetails } from '@/features/projects/hooks/useProjectDetails';
import type { ProjectTaskStatus } from '@/features/projects/types';
import { normalizeHttpUrl } from '@/lib/safeUrl';

type WorkspaceTab = 'board' | 'list' | 'workload' | 'decisions';
type RailTab = 'chat' | 'activity';
type ActivityTone = 'indigo' | 'emerald' | 'amber' | 'rose';
type ActivityItem = { id: string; title: string; detail: string; createdAt: string; tone: ActivityTone };

const toneClass = (tone: ActivityTone) =>
  tone === 'emerald'
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
    : tone === 'amber'
    ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
    : tone === 'rose'
    ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
    : 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30';

const statusLabel = (s: ProjectTaskStatus) =>
  s === 'todo' ? 'To Do' : s === 'in_progress' ? 'Doing' : 'Done';

const isBlocked = (title: string) => /blocked|blocker|awaiting/i.test(title);

const ago = (iso?: string | null) => {
  if (!iso) return 'No deadline';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return 'No deadline';
  }
};

const initials = (member?: { profile?: { first_name?: string; last_name?: string } | null }) => {
  const first = member?.profile?.first_name?.[0] ?? '';
  const last = member?.profile?.last_name?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || '?';
};

export default function ProjectDetails() {
  const { clubId, projectId } = useParams<{ clubId: string; projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { project, board, chat, loading, chatLoading, setTaskStatus, addTask, removeTask, toggleMembership, syncProgress } =
    useProjectDetails({ projectId });

  const tasks = board?.tasks ?? [];
  const members = board?.members ?? [];

  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('board');
  const [railTab, setRailTab] = useState<RailTab>('chat');
  const [showRail, setShowRail] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectTaskStatus>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | string>('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Record<ProjectTaskStatus, string>>({
    todo: '',
    in_progress: '',
    done: '',
  });
  const [saving, setSaving] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const progress = useMemo(
    () => (project?.progress ?? calculateProjectProgress(tasks)),
    [project, tasks]
  );
  const creatorId = project?.creator_id ?? project?.created_by ?? null;
  const isCreator = !!user && !!creatorId && creatorId === user.id;
  const isMember = !!user && members.some((m) => m.user_id === user.id);
  const canEdit = Boolean(user && (isCreator || isMember));
  const statusCfg = project
    ? PROJECT_STATUS_COLORS[project.status] ?? PROJECT_STATUS_COLORS.idea
    : PROJECT_STATUS_COLORS.idea;

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    members.forEach((member) =>
      m.set(
        member.user_id,
        member.profile
          ? `${member.profile.first_name} ${member.profile.last_name}`.trim()
          : member.user_id.slice(0, 8)
      )
    );
    return m;
  }, [members]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (assigneeFilter !== 'all' && t.assigned_to !== assigneeFilter) return false;
      if (!q) return true;
      const assignee = t.assigned_to ? nameById.get(t.assigned_to) ?? '' : '';
      return t.title.toLowerCase().includes(q) || assignee.includes(q);
    });
  }, [tasks, statusFilter, assigneeFilter, query, nameById]);

  const blockedCount = filtered.filter((t) => isBlocked(t.title)).length;
  const reviewCount = filtered.filter((t) => t.status === 'in_progress').length;
  const doneCount = filtered.filter((t) => t.status === 'done').length;

  const workload = useMemo(
    () =>
      members
        .map((member) => {
          const mine = tasks.filter((t) => t.assigned_to === member.user_id);
          return {
            member,
            total: mine.length,
            done: mine.filter((t) => t.status === 'done').length,
            doing: mine.filter((t) => t.status === 'in_progress').length,
            blocked: mine.filter((t) => isBlocked(t.title)).length,
          };
        })
        .sort((a, b) => b.total - a.total),
    [members, tasks]
  );

  const decisions = useMemo(() => {
    const m = (project?.meetings ?? []).map((meeting) => ({
      id: meeting.id,
      title: meeting.agenda || 'Meeting checkpoint',
      detail: meeting.notes?.trim() || 'Decision detail will be captured in notes.',
      createdAt: meeting.scheduled_at,
      tone: 'indigo' as ActivityTone,
    }));
    const links = [
      normalizeHttpUrl(project?.github_url),
      normalizeHttpUrl(project?.figma_url),
      normalizeHttpUrl(project?.notion_url),
    ]
      .filter(Boolean)
      .map((url, i) => ({
        id: `l-${i}`,
        title: 'Workspace link added',
        detail: url as string,
        createdAt: project?.updated_at ?? project?.created_at ?? new Date().toISOString(),
        tone: 'amber' as ActivityTone,
      }));
    return [...m, ...links];
  }, [project]);

  const feed = useMemo(() => {
    const system: ActivityItem[] = project
      ? [
          {
            id: 'a1',
            title: 'Project workspace initialized',
            detail: `${project.title} is running in IT + Dev workspace mode.`,
            createdAt: project.created_at,
            tone: 'indigo',
          },
          {
            id: 'a2',
            title: 'Progress snapshot',
            detail: `${doneCount}/${tasks.length} tasks complete.`,
            createdAt: new Date().toISOString(),
            tone:
              doneCount === tasks.length && tasks.length > 0 ? 'emerald' : 'amber',
          },
        ]
      : [];
    return [...activity, ...system]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }, [activity, project, doneCount, tasks.length]);

  const pushActivity = (title: string, detail: string, tone: ActivityTone) =>
    setActivity((prev) => [
      {
        id: `${Date.now()}-${prev.length}`,
        title,
        detail,
        createdAt: new Date().toISOString(),
        tone,
      },
      ...prev,
    ]);

  async function handleAdvanceTask(task: (typeof tasks)[0]) {
    const next = nextTaskStatus(task.status);
    if (!next || saving) return;
    setSaving(true);
    try {
      await setTaskStatus(task.id, next);
      const nextProgress = calculateProjectProgress(
        tasks.map((t) => (t.id === task.id ? { ...t, status: next } : t))
      );
      await syncProgress(nextProgress);
      pushActivity(
        'Task moved',
        `"${task.title}" moved to ${statusLabel(next)}.`,
        next === 'done' ? 'emerald' : 'indigo'
      );
    } catch {
      toast.error('Could not move task');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTask(status: ProjectTaskStatus) {
    if (saving) return;
    const title = draft[status].trim();
    if (!title || !projectId) return;
    setSaving(true);
    try {
      await addTask(title, status, tasks.length);
      setDraft((prev) => ({ ...prev, [status]: '' }));
      const nextProgress = calculateProjectProgress([...tasks, { id: 'new', title, status, assigned_to: null, order_index: tasks.length } as (typeof tasks)[0]]);
      await syncProgress(nextProgress);
      pushActivity(
        'Task created',
        `"${title}" added to ${statusLabel(status)}.`,
        'emerald'
      );
    } catch {
      toast.error('Could not add task');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveTask(taskId: string) {
    if (saving) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    setSaving(true);
    try {
      await removeTask(taskId);
      const nextProgress = calculateProjectProgress(tasks.filter((t) => t.id !== taskId));
      await syncProgress(nextProgress);
      pushActivity('Task removed', `"${task.title}" was deleted.`, 'rose');
    } catch {
      toast.error('Could not remove task');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleMembership() {
    if (!user) return;
    try {
      await toggleMembership(user.id);
      pushActivity(
        isMember ? 'Team member left' : 'Team member joined',
        `${user.firstName} ${isMember ? 'left' : 'joined'} the project team.`,
        isMember ? 'amber' : 'emerald'
      );
    } catch {
      toast.error('Could not update membership');
    }
  }

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-amber)]" />
      </div>
    );

  if (!project || !clubId)
    return (
      <div className="sc-card p-8 text-center max-w-3xl mx-auto">
        <FolderKanban className="w-8 h-8 mx-auto mb-3 text-[var(--color-text-muted)]" />
        <p className="font-semibold text-navy">Project not found</p>
      </div>
    );

  const safeGithub = normalizeHttpUrl(project.github_url);
  const safeFigma = normalizeHttpUrl(project.figma_url);
  const safeNotion = normalizeHttpUrl(project.notion_url);

  return (
    <div className="w-full space-y-4">
      <button
        onClick={() => navigate(`/app/club/${clubId}?tab=projects`)}
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-navy"
      >
        <ArrowLeft className="w-4 h-4" />Back to Club Projects
      </button>
      <section className="rounded-3xl border border-slate-700/80 bg-slate-950 text-slate-100 overflow-hidden shadow-[0_20px_80px_rgba(2,6,23,0.45)]">
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold">
              IT + DEV WORKSPACE
            </span>
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: statusCfg.bg, color: statusCfg.text }}
            >
              {statusCfg.label}
            </span>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white">
                {project.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                {project.pitch?.trim() ||
                  project.description?.trim() ||
                  'Collaborative IT and Dev project workspace.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleToggleMembership}
                disabled={!user}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  isMember
                    ? 'border border-rose-400/30 bg-rose-500/20 text-rose-200'
                    : 'border border-emerald-400/30 bg-emerald-500/20 text-emerald-200'
                } disabled:opacity-50`}
              >
                {isMember ? 'Leave Team' : 'Join Team'}
              </button>
              <Link
                to={`/app/club/${clubId}/chat`}
                state={{ focusChannelId: project.channel_id ?? undefined, clubName: project.title }}
                className="rounded-lg border border-indigo-400/30 bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-100 inline-flex items-center gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5" />Open Project Chat
              </Link>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-[11px] text-slate-400 uppercase">Progress</div>
              <div className="mt-1 text-lg font-semibold">{progress}%</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-[11px] text-slate-400 uppercase">Tasks</div>
              <div className="mt-1 text-lg font-semibold">{tasks.length}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-[11px] text-slate-400 uppercase">Reviews</div>
              <div className="mt-1 text-lg font-semibold text-violet-300">
                {reviewCount}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-[11px] text-slate-400 uppercase">Blockers</div>
              <div className="mt-1 text-lg font-semibold text-rose-300">
                {blockedCount}
              </div>
            </div>
          </div>
        </div>

        <div className={`grid ${showRail ? 'xl:grid-cols-[minmax(0,1fr)_340px]' : 'xl:grid-cols-1'}`}>
          <div className="p-4 sm:p-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'board' as const, label: 'Board', icon: LayoutGrid },
                  { id: 'list' as const, label: 'List', icon: List },
                  { id: 'workload' as const, label: 'Workload', icon: Users },
                  { id: 'decisions' as const, label: 'Decision Log', icon: Sparkles },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setWorkspaceTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${
                      workspaceTab === tab.id
                        ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/30'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowRail((v) => !v)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-300"
                >
                  {showRail ? (
                    <PanelRightClose className="h-3.5 w-3.5" />
                  ) : (
                    <PanelRightOpen className="h-3.5 w-3.5" />
                  )}
                  {showRail ? 'Hide Panel' : 'Show Panel'}
                </button>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
                <label className="relative block">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tasks, owners..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-200 outline-none focus:border-indigo-400"
                  />
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3">
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | ProjectTaskStatus)}
                    className="bg-transparent py-2 text-xs font-semibold text-slate-300 outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">Doing</option>
                    <option value="done">Done</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="bg-transparent py-2 text-xs font-semibold text-slate-300 outline-none"
                  >
                    <option value="all">All Members</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.profile
                          ? `${m.profile.first_name} ${m.profile.last_name}`
                          : m.user_id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {workspaceTab === 'board' && (
              <div className="grid gap-4 xl:grid-cols-3">
                {PROJECT_TASK_COLUMNS.map((col) => {
                  const colTasks = filtered
                    .filter((t) => t.status === col.id)
                    .sort((a, b) => a.order_index - b.order_index);
                  return (
                    <article
                      key={col.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                          {col.label}
                        </h3>
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                          {colTasks.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {colTasks.map((task) => {
                          const blocked = isBlocked(task.title);
                          return (
                            <div
                              key={task.id}
                              className={`rounded-xl border p-3 ${
                                blocked
                                  ? 'border-rose-400/35 bg-rose-950/20'
                                  : 'border-slate-700/70 bg-slate-950/70'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-slate-100">
                                    {task.title}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5">
                                      <Calendar className="h-3 w-3" />
                                      {ago(project.deadline)}
                                    </span>
                                    {blocked && (
                                      <span className="inline-flex items-center gap-1 rounded-md border border-rose-400/40 bg-rose-500/10 px-2 py-0.5 text-rose-300">
                                        <ShieldAlert className="h-3 w-3" />
                                        Blocked
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {canEdit && (
                                    <button
                                      onClick={() => handleAdvanceTask(task)}
                                      disabled={saving}
                                      className="rounded-md border border-slate-700 bg-slate-900 p-1.5 text-slate-400 hover:text-indigo-300 disabled:opacity-50"
                                    >
                                      <ArrowRight className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  {canEdit && (
                                    <button
                                      onClick={() => handleRemoveTask(task.id)}
                                      disabled={saving}
                                      className="rounded-md border border-slate-700 bg-slate-900 p-1.5 text-slate-500 hover:text-rose-300 disabled:opacity-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {canEdit && (
                          <div className="mt-1 flex gap-1.5">
                            <input
                              value={draft[col.id]}
                              onChange={(e) =>
                                setDraft((prev) => ({
                                  ...prev,
                                  [col.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTask(col.id as ProjectTaskStatus);
                              }}
                              placeholder={`Add task to ${col.label}…`}
                              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-400 placeholder:text-slate-600"
                            />
                            <button
                              onClick={() => handleAddTask(col.id as ProjectTaskStatus)}
                              disabled={saving || !draft[col.id].trim()}
                              className="rounded-lg border border-emerald-400/30 bg-emerald-500/20 p-1.5 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {workspaceTab === 'list' && (
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900">
                      <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-400">Task</th>
                      <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-400">Status</th>
                      <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-400">Owner</th>
                      <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-400">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                          No tasks match your filters.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((t) => (
                        <tr
                          key={t.id}
                          className="border-b border-slate-800/60 last:border-b-0"
                        >
                          <td className="px-4 py-3 text-sm text-slate-100">{t.title}</td>
                          <td className="px-4 py-3 text-xs text-slate-300">{statusLabel(t.status)}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {t.assigned_to ? nameById.get(t.assigned_to) ?? t.assigned_to.slice(0, 8) : 'Unassigned'}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">{ago(project.deadline)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {workspaceTab === 'workload' && (
              <div className="grid gap-3 md:grid-cols-2">
                {workload.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-500">
                    Add members and assignments to unlock workload view.
                  </div>
                ) : (
                  workload.map((row) => (
                    <article
                      key={row.member.user_id}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2">
                          <Avatar className="h-8 w-8 border border-slate-700">
                            <AvatarImage
                              src={row.member.profile?.avatar_url ?? undefined}
                            />
                            <AvatarFallback className="text-xs">
                              {initials(row.member)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-semibold text-slate-100">
                            {row.member.profile
                              ? `${row.member.profile.first_name} ${row.member.profile.last_name}`
                              : row.member.user_id.slice(0, 8)}
                          </p>
                        </div>
                        <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-xs font-semibold text-slate-300">
                          {row.total} tasks
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                        <div className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-300">
                          Doing {row.doing}
                        </div>
                        <div className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-emerald-300">
                          Done {row.done}
                        </div>
                        <div className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-rose-300">
                          Blocked {row.blocked}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}

            {workspaceTab === 'decisions' && (
              <div className="space-y-3">
                {decisions.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
                    <h3 className="text-sm font-semibold text-slate-100">
                      Decision log is ready
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      As meetings and reviews grow, decisions and approvals will be tracked here.
                    </p>
                  </div>
                ) : (
                  decisions.map((d) => (
                    <article
                      key={d.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-100">
                            {d.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-400 break-all">
                            {d.detail}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${toneClass(
                            d.tone
                          )}`}
                        >
                          Logged
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">
                        {ago(d.createdAt)}
                      </p>
                    </article>
                  ))
                )}
              </div>
            )}
          </div>

          {showRail && (
            <aside className="border-t border-slate-800 bg-slate-900/70 xl:border-l xl:border-t-0">
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setRailTab('chat')}
                  className={`flex-1 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide ${
                    railTab === 'chat'
                      ? 'text-indigo-200 bg-indigo-500/10'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setRailTab('activity')}
                  className={`flex-1 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide ${
                    railTab === 'activity'
                      ? 'text-indigo-200 bg-indigo-500/10'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Activity
                </button>
              </div>

              {railTab === 'chat' && (
                <div className="flex h-full flex-col">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-xs font-semibold text-slate-300">
                      Project discussion thread
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Synced from the linked project channel.
                    </p>
                  </div>
                  <div className="max-h-[420px] flex-1 space-y-3 overflow-y-auto px-4 py-3">
                    {chatLoading ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-300" />
                      </div>
                    ) : chat.length === 0 ? (
                      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500">
                        No channel messages yet.
                      </div>
                    ) : (
                      chat.map((m) => (
                        <div key={m.id} className="flex gap-2.5">
                          <Avatar className="h-7 w-7 border border-slate-700">
                            <AvatarImage src={m.sender_avatar ?? undefined} />
                            <AvatarFallback className="text-[10px]">
                              {m.sender_name
                                .split(' ')
                                .map((part) => part[0] ?? '')
                                .join('')
                                .slice(0, 2)
                                .toUpperCase() || 'CM'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <p className="truncate text-[11px] font-semibold text-slate-200">
                                {m.sender_name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {ago(m.created_at)}
                              </p>
                            </div>
                            <div className="rounded-lg border border-slate-700 bg-slate-950/90 px-2.5 py-2 text-xs leading-relaxed text-slate-300">
                              {m.content || 'Shared an attachment'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-slate-800 p-3">
                    <Link
                      to={`/app/club/${clubId}/chat`}
                      state={{ focusChannelId: project.channel_id ?? undefined, clubName: project.title }}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-400/30 bg-indigo-500/15 px-3 py-2 text-xs font-semibold text-indigo-200"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Continue in full chat
                    </Link>
                  </div>
                </div>
              )}

              {railTab === 'activity' && (
                <div className="max-h-[560px] space-y-2 overflow-y-auto p-3">
                  {feed.map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-200">
                          {entry.title}
                        </p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${toneClass(
                            entry.tone
                          )}`}
                        >
                          Event
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{entry.detail}</p>
                      <p className="mt-2 text-[10px] text-slate-500">
                        {ago(entry.createdAt)}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </aside>
          )}
        </div>

        <footer className="border-t border-slate-800 bg-slate-900/60 p-4">
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1">
              <Clock3 className="h-3.5 w-3.5" />
              {project.deadline ? `Deadline ${ago(project.deadline)}` : 'No deadline yet'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1">
              <Users className="h-3.5 w-3.5" />
              {members.length} team member{members.length !== 1 ? 's' : ''}
            </span>
            {safeGithub && (
              <a
                href={safeGithub}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-300 hover:text-white"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {safeFigma && (
              <a
                href={safeFigma}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-300 hover:text-white"
              >
                Figma
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {safeNotion && (
              <a
                href={safeNotion}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-300 hover:text-white"
              >
                Notion
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}