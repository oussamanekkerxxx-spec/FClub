import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Plus, X, Github, ExternalLink, ChevronDown, ChevronUp,
  Loader2, Trash2, Users, Calendar, CheckCircle2, Circle, KanbanSquare,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProjectMember {
  user_id: string;
  profile?: { first_name: string; last_name: string; avatar_url: string | null };
}

interface ProjectTask {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  assigned_to: string | null;
  order_index: number;
}

interface ClubProject {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  status: 'idea' | 'active' | 'paused' | 'completed';
  deadline: string | null;
  progress: number;
  github_url: string | null;
  figma_url: string | null;
  notion_url: string | null;
  created_by: string | null;
  created_at: string;
  members?: ProjectMember[];
  tasks?: ProjectTask[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  idea:      { bg: '#EDE9FE', text: '#6D28D9', label: 'Idea' },
  active:    { bg: '#DCFCE7', text: '#16A34A', label: 'Active' },
  paused:    { bg: '#FEF9C3', text: '#CA8A04', label: 'Paused' },
  completed: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Completed' },
};

const TASK_COLUMNS: { id: 'todo' | 'in_progress' | 'done'; label: string }[] = [
  { id: 'todo',        label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done',        label: 'Done' },
];

function initials(p?: { first_name: string; last_name: string } | null) {
  if (!p) return '?';
  return `${p.first_name[0] ?? ''}${p.last_name[0] ?? ''}`.toUpperCase();
}

// ─── KanbanColumn ────────────────────────────────────────────────────────────

function KanbanColumn({
  col, tasks, memberId, onAdvance, onDelete, onAddTask,
}: {
  col: { id: 'todo' | 'in_progress' | 'done'; label: string };
  tasks: ProjectTask[];
  memberId: string | undefined;
  onAdvance: (task: ProjectTask) => void;
  onDelete: (taskId: string) => void;
  onAddTask: (title: string, status: 'todo' | 'in_progress' | 'done') => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const submit = () => {
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), col.id);
    setNewTitle('');
    setAdding(false);
  };

  const NEXT: Record<string, 'in_progress' | 'done' | null> = {
    todo: 'in_progress',
    in_progress: 'done',
    done: null,
  };

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          {col.label}
        </span>
        <span className="text-xs bg-[var(--color-bg-secondary)] rounded-full px-2 py-0.5 font-semibold">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map(task => (
          <div key={task.id}
            className="sc-card p-3 flex items-start gap-2 group"
          >
            <button
              onClick={() => NEXT[task.status] && onAdvance({ ...task, status: NEXT[task.status]! })}
              className="mt-0.5 flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-amber)] transition-colors"
              title="Advance to next stage"
            >
              {task.status === 'done'
                ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                : <Circle className="w-4 h-4" />
              }
            </button>
            <span className={`flex-1 text-sm ${task.status === 'done' ? 'line-through text-[var(--color-text-muted)]' : ''}`}>
              {task.title}
            </span>
            {memberId && (
              <button
                onClick={() => onDelete(task.id)}
                className="opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-red-500 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {memberId && !adding && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-amber)] transition-colors mt-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add task
        </button>
      )}
      {adding && (
        <div className="flex flex-col gap-1.5">
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="Task title…"
            className="sc-input text-sm px-3 py-2"
          />
          <div className="flex gap-1.5">
            <button onClick={submit} className="btn-amber text-xs px-3 py-1.5">Add</button>
            <button onClick={() => setAdding(false)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ProjectCard ─────────────────────────────────────────────────────────────

function ProjectCard({
  project, userId, isActiveMember, canModerate,
  onUpdate, onDelete,
}: {
  project: ClubProject;
  userId: string | undefined;
  isActiveMember: boolean;
  canModerate: boolean;
  onUpdate: (p: ClubProject) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState<ProjectTask[]>(project.tasks ?? []);
  const [members, setMembers] = useState<ProjectMember[]>(project.members ?? []);
  const [loadingKanban, setLoadingKanban] = useState(false);
  const statusCfg = STATUS_COLORS[project.status] ?? STATUS_COLORS.idea;
  const isMember = members.some(m => m.user_id === userId);

  const loadKanban = async () => {
    if (tasks.length > 0) return;
    setLoadingKanban(true);
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', project.id)
        .order('order_index'),
      supabase
        .from('project_members')
        .select('user_id, profile:profiles!project_members_user_id_fkey(first_name, last_name, avatar_url)')
        .eq('project_id', project.id),
    ]);
    if (t) setTasks(t);
    if (m) setMembers(m as any);
    setLoadingKanban(false);
  };

  const handleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next) await loadKanban();
  };

  const handleJoin = async () => {
    if (!userId) return;
    if (isMember) {
      await supabase.from('project_members').delete()
        .eq('project_id', project.id).eq('user_id', userId);
      setMembers(prev => prev.filter(m => m.user_id !== userId));
      toast('Left project.');
    } else {
      await supabase.from('project_members').insert({ project_id: project.id, user_id: userId });
      setMembers(prev => [...prev, { user_id: userId! }]);
      toast.success('Joined project!');
    }
  };

  const handleAdvanceTask = async (task: ProjectTask) => {
    await supabase.from('project_tasks').update({ status: task.status }).eq('id', task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    // auto-recalculate progress
    const updated = tasks.map(t => t.id === task.id ? { ...t, status: task.status } : t);
    const done = updated.filter(t => t.status === 'done').length;
    const progress = updated.length > 0 ? Math.round((done / updated.length) * 100) : 0;
    await supabase.from('club_projects').update({ progress }).eq('id', project.id);
    onUpdate({ ...project, progress });
  };

  const handleAddTask = async (title: string, status: 'todo' | 'in_progress' | 'done') => {
    const { data, error } = await supabase.from('project_tasks')
      .insert({ project_id: project.id, title, status, order_index: tasks.length })
      .select().single();
    if (error) { toast.error('Could not add task.'); return; }
    const updated = [...tasks, data];
    setTasks(updated);
    const done = updated.filter(t => t.status === 'done').length;
    const progress = updated.length > 0 ? Math.round((done / updated.length) * 100) : 0;
    await supabase.from('club_projects').update({ progress }).eq('id', project.id);
    onUpdate({ ...project, progress });
  };

  const handleDeleteTask = async (taskId: string) => {
    await supabase.from('project_tasks').delete().eq('id', taskId);
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    const done = updated.filter(t => t.status === 'done').length;
    const progress = updated.length > 0 ? Math.round((done / updated.length) * 100) : 0;
    await supabase.from('club_projects').update({ progress }).eq('id', project.id);
    onUpdate({ ...project, progress });
  };

  const canDelete = canModerate || project.created_by === userId;

  return (
    <div className="sc-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-sm truncate">{project.title}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
              style={{ background: statusCfg.bg, color: statusCfg.text }}>
              {statusCfg.label}
            </span>
          </div>
          {project.description && (
            <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isActiveMember && (
            <button onClick={handleJoin}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                isMember
                  ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-red-500'
                  : 'btn-amber'
              }`}>
              {isMember ? 'Leave' : 'Join'}
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(project.id)}
              className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors p-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Meta row */}
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
        {/* Links */}
        {project.github_url && (
          <a href={project.github_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[var(--color-amber)] transition-colors">
            <Github className="w-3.5 h-3.5" /> GitHub
          </a>
        )}
        {project.figma_url && (
          <a href={project.figma_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[var(--color-amber)] transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Figma
          </a>
        )}
        {project.notion_url && (
          <a href={project.notion_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[var(--color-amber)] transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Notion
          </a>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${project.progress}%`,
              background: project.progress === 100 ? '#16A34A' : 'var(--color-amber)',
            }} />
        </div>
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] w-8 text-right">
          {project.progress}%
        </span>
      </div>

      {/* Member avatars */}
      {members.length > 0 && (
        <div className="flex -space-x-2">
          {members.slice(0, 6).map(m => (
            <Avatar key={m.user_id} className="w-7 h-7 border-2 border-[var(--color-bg-card)]">
              <AvatarImage src={(m.profile as any)?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">
                {initials(m.profile as any)}
              </AvatarFallback>
            </Avatar>
          ))}
          {members.length > 6 && (
            <div className="w-7 h-7 rounded-full bg-[var(--color-bg-secondary)] border-2 border-[var(--color-bg-card)]
              flex items-center justify-center text-xs font-semibold text-[var(--color-text-secondary)]">
              +{members.length - 6}
            </div>
          )}
        </div>
      )}

      {/* Expand/collapse kanban */}
      <button
        onClick={handleExpand}
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]
          hover:text-[var(--color-amber)] transition-colors font-medium"
      >
        <KanbanSquare className="w-3.5 h-3.5" />
        {expanded ? 'Hide' : 'Show'} Task Board
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        loadingKanban ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-amber)]" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[var(--color-border)]">
            {TASK_COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                col={col}
                tasks={tasks.filter(t => t.status === col.id)}
                memberId={isActiveMember ? userId : undefined}
                onAdvance={handleAdvanceTask}
                onDelete={handleDeleteTask}
                onAddTask={handleAddTask}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ─── ProjectsTab (main export) ───────────────────────────────────────────────

interface ProjectsTabProps {
  clubId: string;
  userId: string | undefined;
  isActiveMember: boolean;
  canModerate: boolean;
}

export default function ProjectsTab({ clubId, userId, isActiveMember, canModerate }: ProjectsTabProps) {
  const [projects, setProjects] = useState<ClubProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // form state
  const [fTitle, setFTitle]       = useState('');
  const [fDesc, setFDesc]         = useState('');
  const [fStatus, setFStatus]     = useState<'idea' | 'active' | 'paused' | 'completed'>('idea');
  const [fDeadline, setFDeadline] = useState('');
  const [fGithub, setFGithub]     = useState('');
  const [fFigma, setFFigma]       = useState('');
  const [fNotion, setFNotion]     = useState('');

  useEffect(() => {
    supabase
      .from('club_projects')
      .select(`
        *,
        members:project_members(
          user_id,
          profile:profiles!project_members_user_id_fkey(first_name, last_name, avatar_url)
        )
      `)
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setProjects(data as any);
        setLoading(false);
      });
  }, [clubId]);

  const handleCreate = async () => {
    if (!userId || !fTitle.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('club_projects')
      .insert({
        club_id: clubId,
        title: fTitle.trim(),
        description: fDesc.trim() || null,
        status: fStatus,
        deadline: fDeadline || null,
        github_url: fGithub.trim() || null,
        figma_url: fFigma.trim() || null,
        notion_url: fNotion.trim() || null,
        created_by: userId,
        progress: 0,
      })
      .select(`
        *,
        members:project_members(
          user_id,
          profile:profiles!project_members_user_id_fkey(first_name, last_name, avatar_url)
        )
      `)
      .single();

    if (error) {
      toast.error('Could not create project.');
    } else {
      setProjects(prev => [data as any, ...prev]);
      setShowForm(false);
      setFTitle(''); setFDesc(''); setFDeadline(''); setFGithub(''); setFFigma(''); setFNotion('');
      setFStatus('idea');
      toast.success('Project created!');
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('club_projects').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id));
    toast('Project deleted.');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-amber)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Club Projects</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isActiveMember && (
          <button onClick={() => setShowForm(v => !v)} className="btn-amber flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="sc-card p-5 flex flex-col gap-3">
          <h3 className="font-semibold text-sm mb-1">Create Project</h3>

          <input value={fTitle} onChange={e => setFTitle(e.target.value)}
            placeholder="Project title *"
            className="sc-input text-sm px-4 py-2.5" />

          <textarea value={fDesc} onChange={e => setFDesc(e.target.value)}
            placeholder="Description"
            className="sc-input text-sm px-4 py-2.5 resize-none" rows={3} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Status</label>
              <select value={fStatus} onChange={e => setFStatus(e.target.value as any)}
                className="sc-input text-sm px-3 py-2 w-full">
                <option value="idea">💡 Idea</option>
                <option value="active">🚀 Active</option>
                <option value="paused">⏸ Paused</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Deadline</label>
              <input type="date" value={fDeadline} onChange={e => setFDeadline(e.target.value)}
                className="sc-input text-sm px-3 py-2 w-full" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <input value={fGithub} onChange={e => setFGithub(e.target.value)}
              placeholder="GitHub URL" className="sc-input text-sm px-3 py-2" />
            <input value={fFigma} onChange={e => setFFigma(e.target.value)}
              placeholder="Figma URL" className="sc-input text-sm px-3 py-2" />
            <input value={fNotion} onChange={e => setFNotion(e.target.value)}
              placeholder="Notion URL" className="sc-input text-sm px-3 py-2" />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleCreate} disabled={creating || !fTitle.trim()}
              className="btn-amber flex items-center gap-1.5 text-sm disabled:opacity-50">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm px-4 py-2">Cancel</button>
          </div>
        </div>
      )}

      {/* Project list */}
      {projects.length === 0 ? (
        <div className="sc-card p-10 text-center text-[var(--color-text-secondary)]">
          <KanbanSquare className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-sm">No projects yet</p>
          <p className="text-xs mt-1">
            {isActiveMember ? 'Start the first project for this club!' : 'Join the club to create projects.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              userId={userId}
              isActiveMember={isActiveMember}
              canModerate={canModerate}
              onUpdate={updated => setProjects(prev => prev.map(x => x.id === updated.id ? updated : x))}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
