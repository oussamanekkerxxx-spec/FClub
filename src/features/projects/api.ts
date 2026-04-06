import { supabase } from '@/lib/supabase';
import type { ClubProject, ProjectCreateInput, ProjectMember, ProjectMemberProfile, ProjectTask, ProjectTaskStatus } from './types';

type ProjectMemberRow = {
  user_id: string;
  profile: ProjectMemberProfile | ProjectMemberProfile[] | null;
};

type ProjectRow = Omit<ClubProject, 'members'> & {
  members?: ProjectMemberRow[] | null;
};

function normalizeMemberRow(row: ProjectMemberRow): ProjectMember {
  return {
    user_id: row.user_id,
    profile: Array.isArray(row.profile) ? row.profile[0] ?? null : row.profile,
  };
}

function normalizeProjectRow(row: ProjectRow): ClubProject {
  return {
    ...row,
    members: (row.members ?? []).map(normalizeMemberRow),
  };
}

const PROJECT_SELECT = `
  *,
  members:project_members(
    user_id,
    profile:profiles!project_members_user_id_fkey(first_name, last_name, avatar_url)
  )
`;

const PROJECT_DETAIL_SELECT = `
  *,
  members:project_members(
    user_id,
    profile:profiles!project_members_user_id_fkey(first_name, last_name, avatar_url)
  ),
  roles:project_roles(id, title, slots_needed),
  skills:project_skills(id, skill_name),
  applications:project_applications(id, user_id, role_id, experience, availability_hours, status),
  meetings:project_meetings(id, scheduled_at, agenda, meeting_url, notes, status)
`;

export async function listClubProjects(clubId: string): Promise<ClubProject[]> {
  const { data, error } = await supabase
    .from('club_projects')
    .select(PROJECT_SELECT)
    .eq('club_id', clubId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as ProjectRow[]).map(normalizeProjectRow);
}

export async function createClubProject(input: ProjectCreateInput): Promise<ClubProject> {
  const { data, error } = await supabase
    .from('club_projects')
    .insert(input)
    .select(PROJECT_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return normalizeProjectRow(data as ProjectRow);
}

export async function getClubProject(projectId: string): Promise<ClubProject | null> {
  const { data, error } = await supabase
    .from('club_projects')
    .select(PROJECT_DETAIL_SELECT)
    .eq('id', projectId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return normalizeProjectRow(data as ProjectRow);
}

export async function deleteClubProject(projectId: string): Promise<void> {
  const { error } = await supabase.from('club_projects').delete().eq('id', projectId);
  if (error) throw new Error(error.message);
}

export async function fetchProjectBoard(projectId: string): Promise<{ tasks: ProjectTask[]; members: ProjectMember[] }> {
  const [{ data: tasksData, error: tasksError }, { data: membersData, error: membersError }] = await Promise.all([
    supabase
      .from('project_tasks')
      .select('id, title, status, assigned_to, order_index')
      .eq('project_id', projectId)
      .order('order_index'),
    supabase
      .from('project_members')
      .select('user_id, profile:profiles!project_members_user_id_fkey(first_name, last_name, avatar_url)')
      .eq('project_id', projectId),
  ]);

  if (tasksError) throw new Error(tasksError.message);
  if (membersError) throw new Error(membersError.message);

  return {
    tasks: (tasksData ?? []) as ProjectTask[],
    members: ((membersData ?? []) as ProjectMemberRow[]).map(normalizeMemberRow),
  };
}

export async function joinProject(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('project_members').insert({ project_id: projectId, user_id: userId });
  if (error) throw new Error(error.message);
}

export async function leaveProject(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function createProjectTask(
  projectId: string,
  title: string,
  status: ProjectTaskStatus,
  orderIndex: number
): Promise<ProjectTask> {
  const { data, error } = await supabase
    .from('project_tasks')
    .insert({ project_id: projectId, title, status, order_index: orderIndex })
    .select('id, title, status, assigned_to, order_index')
    .single();

  if (error) throw new Error(error.message);
  return data as ProjectTask;
}

export async function updateProjectTaskStatus(taskId: string, status: ProjectTaskStatus): Promise<void> {
  const { error } = await supabase.from('project_tasks').update({ status }).eq('id', taskId);
  if (error) throw new Error(error.message);
}

export async function deleteProjectTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('project_tasks').delete().eq('id', taskId);
  if (error) throw new Error(error.message);
}

export async function setProjectProgress(projectId: string, progress: number): Promise<void> {
  const { error } = await supabase.from('club_projects').update({ progress }).eq('id', projectId);
  if (error) throw new Error(error.message);
}
