import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClubProject, deleteClubProject, listClubProjects } from '@/features/projects/api';
import type { ClubProject, ProjectCreateInput } from '@/features/projects/types';

interface UseClubProjectsResult {
  projects: ClubProject[];
  loading: boolean;
  creating: boolean;
  createProject: (input: ProjectCreateInput) => Promise<boolean>;
  removeProject: (projectId: string) => Promise<void>;
  updateProjectLocal: (project: ClubProject) => void;
}

export function useClubProjects(clubId: string): UseClubProjectsResult {
  const [projects, setProjects] = useState<ClubProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await listClubProjects(clubId);
        if (mounted) setProjects(data);
      } catch {
        toast.error('Could not load projects');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [clubId]);

  const createProject = async (input: ProjectCreateInput): Promise<boolean> => {
    setCreating(true);
    try {
      const created = await createClubProject(input);
      setProjects((prev) => [created, ...prev]);
      toast.success('Project created');
      return true;
    } catch {
      toast.error('Could not create project');
      return false;
    } finally {
      setCreating(false);
    }
  };

  const removeProject = async (projectId: string) => {
    try {
      await deleteClubProject(projectId);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      toast('Project deleted');
    } catch {
      toast.error('Could not delete project');
    }
  };

  const updateProjectLocal = (project: ClubProject) => {
    setProjects((prev) => prev.map((current) => (current.id === project.id ? project : current)));
  };

  return {
    projects,
    loading,
    creating,
    createProject,
    removeProject,
    updateProjectLocal,
  };
}
