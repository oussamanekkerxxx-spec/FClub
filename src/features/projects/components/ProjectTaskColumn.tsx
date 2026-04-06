import { useState } from 'react';
import { CheckCircle2, Circle, Plus, X } from 'lucide-react';
import type { ProjectTask, ProjectTaskStatus } from '@/features/projects/types';
import { nextTaskStatus } from '@/features/projects/utils';

interface ProjectTaskColumnProps {
  column: { id: ProjectTaskStatus; label: string };
  tasks: ProjectTask[];
  canEdit: boolean;
  onAdvance: (task: ProjectTask) => void;
  onDelete: (taskId: string) => void;
  onAddTask: (title: string, status: ProjectTaskStatus) => void;
}

export function ProjectTaskColumn({
  column,
  tasks,
  canEdit,
  onAdvance,
  onDelete,
  onAddTask,
}: ProjectTaskColumnProps) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const submit = () => {
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), column.id);
    setNewTitle('');
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          {column.label}
        </span>
        <span className="text-xs bg-[var(--color-bg-secondary)] rounded-full px-2 py-0.5 font-semibold">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <div key={task.id} className="sc-card p-3 flex items-start gap-2 group">
            <button
              onClick={() => {
                const next = nextTaskStatus(task.status);
                if (next) onAdvance({ ...task, status: next });
              }}
              className="mt-0.5 flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-amber)] transition-colors"
              title="Advance to next stage"
            >
              {task.status === 'done' ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
            </button>
            <span className={`flex-1 text-sm ${task.status === 'done' ? 'line-through text-[var(--color-text-muted)]' : ''}`}>
              {task.title}
            </span>
            {canEdit && (
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

      {canEdit && !adding && (
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
            onChange={(event) => setNewTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit();
              if (event.key === 'Escape') setAdding(false);
            }}
            placeholder="Task title..."
            className="sc-input text-sm px-3 py-2"
          />
          <div className="flex gap-1.5">
            <button onClick={submit} className="btn-amber text-xs px-3 py-1.5">
              Add
            </button>
            <button onClick={() => setAdding(false)} className="btn-ghost text-xs px-3 py-1.5">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
