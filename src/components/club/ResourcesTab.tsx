import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { ClubResource } from '@/types/fightclub';
import { useLazyQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/queryKeys';
import { extractFileNameFromUrl, normalizeHttpUrl } from '@/lib/safeUrl';
import {
  BookOpen,
  ExternalLink,
  FileText,
  Image,
  Link as LinkIcon,
  Loader2,
  Plus,
  Trash2,
  Video,
} from 'lucide-react';
import EmptyState from './EmptyState';
import SkeletonCard from './SkeletonCard';
import { formatDistanceToNow } from 'date-fns';

const RESOURCE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  link: LinkIcon,
  document: FileText,
  video: Video,
  image: Image,
};

type ChatResource = {
  id: string;
  title: string;
  url: string;
  type: 'document' | 'video' | 'image';
  created_at: string;
  channelName: string;
};

interface ResourcesTabProps {
  clubId: string;
  userId: string | undefined;
  isMember: boolean;
  isModOrAdmin: boolean;
}

export default function ResourcesTab({ clubId, userId, isMember, isModOrAdmin }: ResourcesTabProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [chatResources, setChatResources] = useState<ChatResource[]>([]);
  const [loadingChat, setLoadingChat] = useState(true);

  const { data: resources, loading, setData: setResources } = useLazyQuery<ClubResource>(
    queryKeys.clubs.resources(clubId),
    () =>
      supabase
        .from('club_resources')
        .select('*, adder:profiles!club_resources_added_by_fkey(first_name, last_name, avatar_url)')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false }),
    !!clubId,
    { errorMessage: 'Failed to load resources' }
  );

  useEffect(() => {
    let mounted = true;

    async function loadChatResources() {
      if (!clubId || !isMember) {
        if (mounted) {
          setChatResources([]);
          setLoadingChat(false);
        }
        return;
      }

      setLoadingChat(true);
      const { data: channels, error: channelsError } = await supabase
        .from('club_channels')
        .select('id, name')
        .eq('club_id', clubId);

      if (channelsError) {
        if (mounted) setLoadingChat(false);
        return;
      }

      const channelMap = new Map((channels ?? []).map((channel) => [channel.id, channel.name]));
      const channelIds = Array.from(channelMap.keys());

      if (channelIds.length === 0) {
        if (mounted) {
          setChatResources([]);
          setLoadingChat(false);
        }
        return;
      }

      const { data: messages, error: messagesError } = await supabase
        .from('club_messages')
        .select('id, channel_id, content, image_url, video_url, pdf_url, created_at')
        .in('channel_id', channelIds)
        .order('created_at', { ascending: false })
        .limit(200);

      if (messagesError) {
        if (mounted) setLoadingChat(false);
        return;
      }

      const dedupe = new Set<string>();
      const mapped: ChatResource[] = [];

      (messages ?? []).forEach((message) => {
        const channelName = channelMap.get(message.channel_id) ?? 'general';
        const entries: Array<{ url: string | null; type: ChatResource['type'] }> = [
          { url: message.pdf_url, type: 'document' },
          { url: message.video_url, type: 'video' },
          { url: message.image_url, type: 'image' },
        ];

        entries.forEach((entry) => {
          const safeUrl = normalizeHttpUrl(entry.url);
          if (!safeUrl || dedupe.has(safeUrl)) return;
          dedupe.add(safeUrl);
          mapped.push({
            id: `${message.id}-${entry.type}`,
            title: message.content?.trim() || extractFileNameFromUrl(safeUrl, 'Shared file'),
            url: safeUrl,
            type: entry.type,
            created_at: message.created_at,
            channelName,
          });
        });
      });

      if (mounted) {
        setChatResources(mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setLoadingChat(false);
      }
    }

    loadChatResources();
    return () => {
      mounted = false;
    };
  }, [clubId, isMember]);

  const handleAdd = async () => {
    if (!userId || !newTitle.trim()) return;
    const safeUrl = normalizeHttpUrl(newUrl);
    if (newUrl.trim() && !safeUrl) {
      toast.error('Resource URL must start with http:// or https://');
      return;
    }

    setAdding(true);
    const { data, error } = await supabase
      .from('club_resources')
      .insert({ club_id: clubId, title: newTitle.trim(), url: safeUrl, added_by: userId })
      .select('*, adder:profiles!club_resources_added_by_fkey(first_name, last_name, avatar_url)')
      .single();

    if (!error && data) {
      setResources((prev) => [data, ...prev]);
      setNewTitle('');
      setNewUrl('');
      setShowAdd(false);
      toast.success('Resource added');
    }
    setAdding(false);
  };

  const handleDelete = async (resourceId: string) => {
    await supabase.from('club_resources').delete().eq('id', resourceId);
    setResources((prev) => prev.filter((resource) => resource.id !== resourceId));
  };

  return (
    <div className="space-y-4">
      {isMember && (
        <div className="sc-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-navy">Resources</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Chat files auto-appear here.</p>
            </div>
            <button
              onClick={() => setShowAdd((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-navy hover:border-[var(--color-amber)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Resource
            </button>
          </div>

          {showAdd && (
            <div className="mt-3 grid sm:grid-cols-[1fr_1fr_auto] gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Title"
                className="input-sc text-sm"
              />
              <input
                type="url"
                value={newUrl}
                onChange={(event) => setNewUrl(event.target.value)}
                placeholder="URL (optional)"
                className="input-sc text-sm"
              />
              <button
                onClick={handleAdd}
                disabled={adding || !newTitle.trim()}
                className="btn-amber text-xs disabled:opacity-50"
                style={{ padding: '8px 12px' }}
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="sc-card p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          From Chat
        </h3>
        {loadingChat ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-amber)]" />
          </div>
        ) : chatResources.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)]">No shared files in chat yet.</p>
        ) : (
          <div className="space-y-2">
            {chatResources.slice(0, 30).map((resource) => {
              const Icon = RESOURCE_ICONS[resource.type];
              const safeResourceUrl = normalizeHttpUrl(resource.url);
              if (!safeResourceUrl) return null;
              return (
                <a
                  key={resource.id}
                  href={safeResourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2.5 hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[var(--color-amber)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">{resource.title}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      #{resource.channelName} · {formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                </a>
              );
            })}
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonCard count={4} />
      ) : resources.length === 0 ? (
        <EmptyState icon={<BookOpen className="w-6 h-6 text-[var(--color-text-muted)]" />} title="No resources yet" subtitle="Add links, files, and tools for the club." />
      ) : (
        <div className="space-y-2">
          {resources.map((resource) => {
            const Icon = RESOURCE_ICONS[resource.type] ?? LinkIcon;
            const safeResourceUrl = normalizeHttpUrl(resource.url);
            return (
              <div key={resource.id} className="sc-card p-4 flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--color-bg-secondary)]">
                  <Icon className="w-4 h-4 text-[var(--color-amber)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-navy truncate">{resource.title}</div>
                  {resource.adder && (
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      Added by {resource.adder.first_name} ·{' '}
                      {formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {safeResourceUrl && (
                    <a href={safeResourceUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-parchment transition-colors">
                      <ExternalLink className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    </a>
                  )}
                  {(resource.added_by === userId || isModOrAdmin) && (
                    <button onClick={() => handleDelete(resource.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-[var(--color-text-muted)] hover:text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
