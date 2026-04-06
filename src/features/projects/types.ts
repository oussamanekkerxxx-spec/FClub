export type ProjectStatus = 'idea' | 'active' | 'paused' | 'completed' | 'open';
export type ProjectTaskStatus = 'todo' | 'in_progress' | 'done';

export interface ProjectMemberProfile {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export interface ProjectMember {
  user_id: string;
  profile?: ProjectMemberProfile | null;
}

export interface ProjectTask {
  id: string;
  title: string;
  status: ProjectTaskStatus;
  assigned_to: string | null;
  order_index: number;
}

export interface ProjectRole {
  id: string;
  title: string;
  slots_needed: number;
}

export interface ProjectSkill {
  id: string;
  skill_name: string;
}

export interface ProjectApplication {
  id: string;
  user_id: string;
  role_id: string;
  experience: string;
  availability_hours: number;
  status: string;
}

export interface ProjectMeeting {
  id: string;
  scheduled_at: string;
  agenda: string;
  meeting_url: string;
  notes: string;
  status: string;
}

export interface ClubProject {
  id: string;
  club_id: string;
  channel_id?: string | null;
  message_id?: string | null;
  title: string;
  pitch?: string | null;
  description: string | null;
  start_date?: string | null;
  duration_weeks?: number | null;
  hours_per_week?: number | null;
  visibility?: string | null;
  status: ProjectStatus;
  deadline: string | null;
  progress: number;
  github_url: string | null;
  figma_url: string | null;
  notion_url: string | null;
  created_by: string | null;
  creator_id?: string | null;
  created_at: string;
  updated_at?: string;
  members?: ProjectMember[];
  tasks?: ProjectTask[];
  roles?: ProjectRole[];
  skills?: ProjectSkill[];
  applications?: ProjectApplication[];
  meetings?: ProjectMeeting[];
}

export interface ProjectCreateInput {
  club_id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  deadline: string | null;
  github_url: string | null;
  figma_url: string | null;
  notion_url: string | null;
  created_by: string;
  progress: number;
}
