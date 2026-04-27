import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { unwrapRelation } from '@/lib/utils';
import type { Club, JoinRequest, ProfileMini } from '@/types/clubs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCheck, UserX, MapPin, Loader2, FolderKanban, Mic2, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { reportError } from '@/lib/errors';

type ClubRequestRow = {
  id: string;
  request_type: 'room' | 'project_help' | 'event_help' | 'other';
  status: string;
  requested_by: string;
  title: string;
  details: string | null;
  created_at: string;
  profile?: ProfileMini | ProfileMini[] | null;
};

type ProjectApplicationRow = {
  id: string;
  project_id: string;
  user_id: string;
  role_id: string | null;
  status: string;
  experience: string | null;
  availability_hours: number | null;
  created_at: string;
  applicant?: ProfileMini | ProfileMini[] | null;
  project?: { id: string; title: string; club_id: string; creator_id: string | null } | Array<{ id: string; title: string; club_id: string; creator_id: string | null }> | null;
  role?: { id: string; title: string } | Array<{ id: string; title: string }> | null;
};

type InboxItem = {
  id: string;
  kind: 'join' | 'club_request' | 'project_application';
  createdAt: string;
  requesterId: string;
  profile: ProfileMini | null;
  title: string;
  subtitle: string;
  details: string | null;
  raw: JoinRequest | ClubRequestRow | ProjectApplicationRow;
};

interface RequestsTabProps {
  clubId: string;
  club: Club;
  onResolved: (opts?: { memberDelta?: number }) => void;
}

function toProfile(value: ProfileMini | ProfileMini[] | null | undefined): ProfileMini | null {
  return unwrapRelation(value);
}

function requestIcon(kind: InboxItem['kind'], requestType?: ClubRequestRow['request_type']) {
  if (kind === 'project_application') return <FolderKanban className="w-3.5 h-3.5" />;
  if (kind === 'club_request' && requestType === 'room') return <Mic2 className="w-3.5 h-3.5" />;
  return <Inbox className="w-3.5 h-3.5" />;
}

export default function RequestsTab({ clubId, club, onResolved }: RequestsTabProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadInbox = async () => {
      setLoading(true);

      const [joinResult, clubResult, appResult] = await Promise.all([
        supabase
          .from('join_requests')
          .select('id, user_id, created_at, status, profile:profiles!join_requests_user_id_fkey(first_name, last_name, avatar_url, city)')
          .eq('club_id', clubId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('club_requests')
          .select('id, request_type, status, requested_by, title, details, created_at, profile:profiles!club_requests_requested_by_fkey(first_name, last_name, avatar_url, city)')
          .eq('club_id', clubId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('project_applications')
          .select(`
            id, project_id, user_id, role_id, status, experience, availability_hours, created_at,
            applicant:profiles!project_applications_user_id_fkey(first_name, last_name, avatar_url, city),
            role:project_roles!project_applications_role_id_fkey(id, title),
            project:club_projects!project_applications_project_id_fkey(id, title, club_id, creator_id)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ]);

      if (cancelled) return;

      if (joinResult.error) reportError('requests.join_query', joinResult.error);
      if (clubResult.error && clubResult.error.code !== '42P01') reportError('requests.club_requests_query', clubResult.error);
      if (appResult.error) reportError('requests.project_applications_query', appResult.error);

      const joinItems: InboxItem[] = (joinResult.data ?? []).map((row: JoinRequest) => {
        const profile = toProfile(row.profile);
        return {
          id: row.id,
          kind: 'join',
          createdAt: row.created_at,
          requesterId: row.user_id,
          profile,
          title: 'Join request',
          subtitle: 'Wants to join this club',
          details: null,
          raw: row,
        };
      });

      const clubItems: InboxItem[] = (clubResult.data ?? []).map((row: ClubRequestRow) => {
        const profile = toProfile(row.profile);
        const subtitle =
          row.request_type === 'room'
            ? 'Requested a new voice room'
            : row.request_type === 'project_help'
              ? 'Requested project help'
              : row.request_type === 'event_help'
                ? 'Requested event support'
                : 'General request';

        return {
          id: row.id,
          kind: 'club_request',
          createdAt: row.created_at,
          requesterId: row.requested_by,
          profile,
          title: row.title,
          subtitle,
          details: row.details,
          raw: row,
        };
      });

      const projectItems: InboxItem[] = (appResult.data ?? [])
        .map((row: ProjectApplicationRow) => {
          const project = Array.isArray(row.project) ? row.project[0] : row.project;
          if (!project || project.club_id !== clubId) return null;
          const role = Array.isArray(row.role) ? row.role[0] : row.role;
          const profile = toProfile(row.applicant);

          return {
            id: row.id,
            kind: 'project_application',
            createdAt: row.created_at,
            requesterId: row.user_id,
            profile,
            title: `Project application: ${project.title}`,
            subtitle: role?.title ? `Applied for ${role.title}` : 'Applied to contribute',
            details: row.experience,
            raw: row,
          } as InboxItem;
        })
        .filter(Boolean) as InboxItem[];

      const merged = [...joinItems, ...clubItems, ...projectItems]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setItems(merged);
      setLoading(false);
    };

    loadInbox();

    return () => {
      cancelled = true;
    };
  }, [clubId]);

  const pendingCounts = useMemo(() => {
    const out = { join: 0, clubRequest: 0, project: 0 };
    for (const item of items) {
      if (item.kind === 'join') out.join += 1;
      else if (item.kind === 'club_request') out.clubRequest += 1;
      else out.project += 1;
    }
    return out;
  }, [items]);

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

const resolveJoin = async (item: InboxItem, approved: boolean) => {
    const row = item.raw as JoinRequest;
    setResolvingId(item.id);

    try {
      if (approved) {
        const { data: existing } = await supabase
          .from('club_memberships')
          .select('id')
          .eq('club_id', clubId)
          .eq('user_id', row.user_id)
          .maybeSingle();

        let membershipError;
        if (existing) {
          ({ error: membershipError } = await supabase
            .from('club_memberships')
            .update({ role: 'member', status: 'active' })
            .eq('id', existing.id));
        } else {
          ({ error: membershipError } = await supabase
            .from('club_memberships')
            .insert({ club_id: clubId, user_id: row.user_id, role: 'member', status: 'active' }));
        }

        if (membershipError) throw membershipError;
      }

      const nextStatus = approved ? 'approved' : 'rejected';
      const { error: updateError } = await supabase
        .from('join_requests')
        .update({ status: nextStatus })
        .eq('id', row.id);
      if (updateError) throw updateError;

      await supabase.from('notifications').insert({
        user_id: row.user_id,
        type: approved ? 'join_approved' : 'join_rejected',
        title: approved ? 'Request approved' : 'Request declined',
        body: approved
          ? `You were approved to join ${club.name}.`
          : `Your request to join ${club.name} was declined.`,
        link: `/app/club/${club.id}`,
      });

      removeItem(item.id);
      onResolved({ memberDelta: approved ? 1 : undefined });
      toast.success(approved ? 'Join request approved' : 'Join request declined');
    } catch (error) {
      reportError('requests.resolve_join', error);
      toast.error('Could not update this join request.');
    } finally {
      setResolvingId(null);
    }
  };

  const resolveClubRequest = async (item: InboxItem, approved: boolean) => {
    const row = item.raw as ClubRequestRow;
    if (!user?.id) return;
    setResolvingId(item.id);

    try {
      const { error: updateError } = await supabase
        .from('club_requests')
        .update({
          status: approved ? 'accepted' : 'declined',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      if (updateError) throw updateError;

      await supabase.from('notifications').insert({
        user_id: row.requested_by,
        type: approved ? 'club_request_accepted' : 'club_request_declined',
        title: approved ? 'Request accepted' : 'Request declined',
        body: approved
          ? `Your request "${row.title}" was accepted by a club moderator.`
          : `Your request "${row.title}" was declined by a club moderator.`,
        link: `/app/club/${club.id}`,
        actor_id: user.id,
      });

      removeItem(item.id);
      onResolved();
      toast.success(approved ? 'Request accepted' : 'Request declined');
    } catch (error) {
      reportError('requests.resolve_club_request', error);
      toast.error('Could not update this request.');
    } finally {
      setResolvingId(null);
    }
  };

  const resolveProjectApplication = async (item: InboxItem, approved: boolean) => {
    const row = item.raw as ProjectApplicationRow;
    if (!user?.id) return;
    setResolvingId(item.id);

    try {
      const nextStatus = approved ? 'accepted' : 'rejected';
      const { error: updateError } = await supabase
        .from('project_applications')
        .update({ status: nextStatus })
        .eq('id', row.id);
      if (updateError) throw updateError;

      const project = Array.isArray(row.project) ? row.project[0] : row.project;

      await supabase.from('notifications').insert({
        user_id: row.user_id,
        type: approved ? 'project_application_accepted' : 'project_application_rejected',
        title: approved ? 'Project application accepted' : 'Project application declined',
        body: approved
          ? `You were accepted for ${project?.title ?? 'a project'}.`
          : `Your application for ${project?.title ?? 'a project'} was declined.`,
        link: `/app/club/${club.id}`,
        actor_id: user.id,
      });

      removeItem(item.id);
      onResolved();
      toast.success(approved ? 'Application accepted' : 'Application declined');
    } catch (error) {
      reportError('requests.resolve_project_application', error);
      toast.error('Could not update this project application.');
    } finally {
      setResolvingId(null);
    }
  };

  const handleResolve = async (item: InboxItem, approved: boolean) => {
    if (item.kind === 'join') {
      await resolveJoin(item, approved);
      return;
    }
    if (item.kind === 'club_request') {
      await resolveClubRequest(item, approved);
      return;
    }
    await resolveProjectApplication(item, approved);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="sc-card p-4 flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-2 bg-gray-100 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="sc-card p-10 text-center">
        <UserCheck className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
        <p className="text-[var(--color-text-secondary)] text-sm">No pending requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="sc-card p-3 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
        <span><strong className="text-[var(--color-text)]">{pendingCounts.join}</strong> join</span>
        <span><strong className="text-[var(--color-text)]">{pendingCounts.project}</strong> project</span>
        <span><strong className="text-[var(--color-text)]">{pendingCounts.clubRequest}</strong> other</span>
      </div>

      {items.map(item => {
        const profile = item.profile;
        const displayName = profile ? `${profile.first_name} ${profile.last_name}` : 'Member';
        const busy = resolvingId === item.id;
        const clubRequestType = item.kind === 'club_request' ? (item.raw as ClubRequestRow).request_type : undefined;

        return (
          <div key={item.id} className="sc-card p-4 flex items-center gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '13px' }}>
                {profile?.first_name?.[0] ?? '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-navy flex items-center gap-2">
                {displayName}
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]">
                  {requestIcon(item.kind, clubRequestType)}
                  {item.kind === 'join' ? 'Join' : item.kind === 'project_application' ? 'Project' : 'Request'}
                </span>
              </div>

              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{item.title}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.subtitle}</div>

              {item.details && (
                <div className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">{item.details}</div>
              )}

              {profile?.city && (
                <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-1">
                  <MapPin className="w-2.5 h-2.5" /> {profile.city}
                </div>
              )}

              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                disabled={busy}
                onClick={() => handleResolve(item, true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105 disabled:opacity-60"
                style={{ background: 'var(--color-forest)' }}
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />} Accept
              </button>
              <button
                disabled={busy}
                onClick={() => handleResolve(item, false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                <UserX className="w-3.5 h-3.5" /> Decline
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
