import { useState } from 'react';
import { KanbanSquare, Loader2, MessageSquare, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { useClubProjects } from '@/features/projects/hooks/useClubProjects';
import type { ProjectStatus } from '@/features/projects/types';
import { normalizeHttpUrl } from '@/lib/safeUrl';
import EmptyState from './EmptyState';
import SkeletonCard from './SkeletonCard';

interface ProjectsTabProps {
  clubId: string;
  userId: string | undefined;
  isActiveMember: boolean;
  canModerate: boolean;
}

export default function ProjectsTab({ clubId, userId, isActiveMember, canModerate }: ProjectsTabProps) {
  const { projects, loading, creating, createProject, removeProject, updateProjectLocal } = useClubProjects(clubId);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('idea');
  const [deadline, setDeadline] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [notionUrl, setNotionUrl] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('idea');
    setDeadline('');
    setGithubUrl('');
    setFigmaUrl('');
    setNotionUrl('');
  };

  const handleCreate = async () => {
    if (!userId || !title.trim()) return;

    const safeGithubUrl = normalizeHttpUrl(githubUrl);
    const safeFigmaUrl = normalizeHttpUrl(figmaUrl);
    const safeNotionUrl = normalizeHttpUrl(notionUrl);

    if (githubUrl.trim() && !safeGithubUrl) {
      toast.error('GitHub URL must start with http:// or https://');
      return;
    }
    if (figmaUrl.trim() && !safeFigmaUrl) {
      toast.error('Figma URL must start with http:// or https://');
      return;
    }
    if (notionUrl.trim() && !safeNotionUrl) {
      toast.error('Notion URL must start with http:// or https://');
      return;
    }

    const ok = await createProject({
      club_id: clubId,
      title: title.trim(),
      description: description.trim() || null,
      status,
      deadline: deadline || null,
      github_url: safeGithubUrl,
      figma_url: safeFigmaUrl,
      notion_url: safeNotionUrl,
      created_by: userId,
      progress: 0,
    });
    if (!ok) return;

    setShowForm(false);
    resetForm();
  };

  if (loading) return <SkeletonCard />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-sm">Club Projects</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {projects.length} project{projects.length !== 1 ? 's' : ''} · launched from chat and visible here
          </p>
        </div>
        {isActiveMember && (
          <button
            onClick={() => setShowForm((value) => !value)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-navy hover:border-[var(--color-amber)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Project
          </button>
        )}
      </div>

      <div className="sc-card p-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy">Best workflow: launch in chat, track here</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Start with a poll, post your project card in messages, then use this tab to manage details and progress.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-[var(--color-text-muted)] inline-flex items-center gap-1.5 whitespace-nowrap">
          <MessageSquare className="w-3.5 h-3.5" />
          Chat-first
        </span>
      </div>

      {showForm && (
        <div className="sc-card p-5 flex flex-col gap-3 border-l-4 border-l-[var(--color-amber)]">
          <h3 className="font-semibold text-sm mb-1">Create Project</h3>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Project title *"
            className="sc-input text-sm px-4 py-2.5"
          />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            className="sc-input text-sm px-4 py-2.5 resize-none"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Status</label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as ProjectStatus)}
                className="sc-input text-sm px-3 py-2 w-full"
              >
                <option value="idea">Idea</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="open">Open</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Deadline</label>
              <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="sc-input text-sm px-3 py-2 w-full" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <input
              value={githubUrl}
              onChange={(event) => setGithubUrl(event.target.value)}
              placeholder="GitHub URL"
              className="sc-input text-sm px-3 py-2"
            />
            <input
              value={figmaUrl}
              onChange={(event) => setFigmaUrl(event.target.value)}
              placeholder="Figma URL"
              className="sc-input text-sm px-3 py-2"
            />
            <input
              value={notionUrl}
              onChange={(event) => setNotionUrl(event.target.value)}
              placeholder="Notion URL"
              className="sc-input text-sm px-3 py-2"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleCreate} disabled={creating || !title.trim()} className="btn-amber flex items-center gap-1.5 text-sm disabled:opacity-50">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm px-4 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState
          icon={<KanbanSquare className="w-6 h-6 text-[var(--color-text-muted)]" />}
          title="No projects yet"
          subtitle={isActiveMember ? 'Start the first project for this club!' : 'Join the club to create projects.'}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              userId={userId}
              isActiveMember={isActiveMember}
              canModerate={canModerate}
              onProjectUpdate={updateProjectLocal}
              onProjectDelete={removeProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
