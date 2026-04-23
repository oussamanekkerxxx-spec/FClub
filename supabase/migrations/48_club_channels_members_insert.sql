-- Allow any active member of a club to create a new channel
CREATE POLICY "Members can create club channels"
  ON public.club_channels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_memberships
      WHERE club_memberships.club_id = club_channels.club_id
        AND club_memberships.user_id = auth.uid()
        AND club_memberships.status = 'active'
    )
  );
