-- 35_club_projects.sql

-- 1. club_projects
CREATE TABLE IF NOT EXISTS club_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES club_channels(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES club_messages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  pitch TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date DATE,
  duration_weeks INTEGER,
  hours_per_week INTEGER,
  visibility TEXT NOT NULL DEFAULT 'club', -- 'club' or 'public'
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'active', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. project_roles
CREATE TABLE IF NOT EXISTS project_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES club_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slots_needed INTEGER NOT NULL DEFAULT 1
);

-- 3. project_skills
CREATE TABLE IF NOT EXISTS project_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES club_projects(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL
);

-- 4. project_applications
CREATE TABLE IF NOT EXISTS project_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES club_projects(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES project_roles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experience TEXT NOT NULL,
  availability_hours INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'waitlisted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(project_id, user_id) -- A user can only apply once per project
);

-- 5. project_meetings
CREATE TABLE IF NOT EXISTS project_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES club_projects(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  agenda TEXT,
  meeting_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE club_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_meetings ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- RLS: club_projects
-- ----------------------------------------------------
CREATE POLICY "Projects are viewable by club members or if public"
  ON club_projects FOR SELECT
  USING (
    visibility = 'public' 
    OR EXISTS (
      SELECT 1 FROM club_memberships 
      WHERE club_memberships.club_id = club_projects.club_id 
      AND club_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Club members can create projects"
  ON club_projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_memberships 
      WHERE club_memberships.club_id = club_projects.club_id 
      AND club_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can update projects"
  ON club_projects FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete projects"
  ON club_projects FOR DELETE
  USING (creator_id = auth.uid());


-- ----------------------------------------------------
-- RLS: project_roles & project_skills
-- ----------------------------------------------------
CREATE POLICY "Roles are viewable by anyone who can view the project"
  ON project_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_projects WHERE club_projects.id = project_roles.project_id
    )
  );
CREATE POLICY "Project creators can manage roles"
  ON project_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_projects
      WHERE club_projects.id = project_roles.project_id
      AND club_projects.creator_id = auth.uid()
    )
  );

CREATE POLICY "Skills are viewable by anyone who can view the project"
  ON project_skills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_projects WHERE club_projects.id = project_skills.project_id
    )
  );
CREATE POLICY "Project creators can manage skills"
  ON project_skills FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_projects
      WHERE club_projects.id = project_skills.project_id
      AND club_projects.creator_id = auth.uid()
    )
  );


-- ----------------------------------------------------
-- RLS: project_applications
-- ----------------------------------------------------
-- CRITICAL PRIVACY: Only the creator can see all applications. Regular users can only see their own.
CREATE POLICY "Creators can view all applications for their projects"
  ON project_applications FOR SELECT
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM club_projects
      WHERE club_projects.id = project_applications.project_id
      AND club_projects.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can apply to projects"
  ON project_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Creators can update application status"
  ON project_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_projects
      WHERE club_projects.id = project_applications.project_id
      AND club_projects.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can withdraw their applications"
  ON project_applications FOR DELETE
  USING (user_id = auth.uid());


-- ----------------------------------------------------
-- RLS: project_meetings
-- ----------------------------------------------------
CREATE POLICY "Meetings are viewable by accepted members and creators"
  ON project_meetings FOR SELECT
  USING (
    creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_applications
      WHERE project_applications.project_id = project_meetings.project_id
      AND project_applications.user_id = auth.uid()
      AND project_applications.status = 'accepted'
    )
  );

CREATE POLICY "Creators can manage meetings"
  ON project_meetings FOR ALL
  USING (creator_id = auth.uid());

-- Triggers
CREATE TRIGGER update_club_projects_updated_at
  BEFORE UPDATE ON club_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
