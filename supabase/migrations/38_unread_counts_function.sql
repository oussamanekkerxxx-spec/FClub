-- Replaces N per-channel COUNT queries with a single RPC call.
-- Called from ClubChat.tsx when loading channels for a club.

CREATE OR REPLACE FUNCTION get_all_unread_counts(p_club_id UUID, p_user_id UUID)
RETURNS TABLE(channel_id UUID, unread_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id AS channel_id,
    COUNT(cm.id)::BIGINT AS unread_count
  FROM club_channels cc
  LEFT JOIN club_messages cm
    ON cm.channel_id = cc.id
    AND cm.deleted_at IS NULL
  LEFT JOIN channel_reads cr
    ON cr.channel_id = cc.id
    AND cr.user_id = p_user_id
  WHERE cc.club_id = p_club_id
    AND cm.created_at > COALESCE(cr.last_read_at, '1970-01-01'::timestamptz)
  GROUP BY cc.id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_unread_counts(UUID, UUID) TO authenticated;
