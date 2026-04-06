import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { extractFileNameFromUrl, normalizeHttpUrl } from '@/lib/safeUrl';
import {
  ChevronDown, ChevronUp, Play, Plus, Trash2, Loader2,
  PlaySquare, Clock, Pencil, X, Check, ExternalLink,
} from 'lucide-react';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface PlaylistVideo {
  id: string;
  playlist_id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_label: string | null;
  order_index: number;
}

interface Playlist {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  accent_color: string;
  cover_emoji: string;
  order_index: number;
  videos?: PlaylistVideo[];
}

interface ChatVideo {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  channelName: string;
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Extract YouTube video ID from various URL formats */
function getYouTubeId(url: string): string | null {
  const safeUrl = normalizeHttpUrl(url);
  if (!safeUrl) return null;

  try {
    const u = new URL(safeUrl);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
  } catch { /* ignore */ }
  return null;
}

/** Build an embeddable src URL from common video platforms */
function getEmbedUrl(url: string): string | null {
  const safeUrl = normalizeHttpUrl(url);
  if (!safeUrl) return null;

  const ytId = getYouTubeId(safeUrl);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;

  // Loom
  const loomMatch = safeUrl.match(/loom\.com\/share\/([a-z0-9]+)/i);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;

  // Direct video URL (mp4, webm, ogg)
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(safeUrl)) return safeUrl;

  return null;
}

/** Auto-generate thumbnail from YouTube URL */
function autoThumbnail(url: string): string | null {
  const ytId = getYouTubeId(url);
  return ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
}

const PRESET_COLORS = [
  '#8B7BFF', '#4FD5C6', '#FFB35C', '#FF7EA1',
  '#60A5FA', '#34D399', '#F87171', '#A78BFA',
];

// â”€â”€â”€ VideoRow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function VideoRow({
  video, index, canManage, openId, onPlay, onDelete,
}: {
  video: PlaylistVideo;
  index: number;
  canManage: boolean;
  openId: string | null;
  onPlay: (id: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const isOpen = openId === video.id;
  const embedUrl = getEmbedUrl(video.video_url);
  const thumb = video.thumbnail_url ?? autoThumbnail(video.video_url);
  const safeVideoUrl = normalizeHttpUrl(video.video_url);

  return (
    <div className="flex flex-col gap-0">
      {/* Row header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 group cursor-pointer transition-colors
          ${isOpen ? 'bg-[var(--color-bg-secondary)]' : 'hover:bg-[var(--color-bg-secondary)]/60'}
          rounded-xl`}
        onClick={() => onPlay(isOpen ? null : video.id)}
      >
        {/* Thumbnail / number */}
        <div className="w-14 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center relative">
          {thumb
            ? <img src={thumb} alt="" className="w-full h-full object-cover" />
            : <PlaySquare className="w-4 h-4 text-gray-500" />
          }
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-3.5 h-3.5 text-white fill-white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            <span className="text-[var(--color-text-muted)] font-normal mr-1.5">
              {String(index + 1).padStart(2, '0')} â€”
            </span>
            {video.title}
          </p>
          {video.duration_label && (
            <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> {video.duration_label}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onPlay(isOpen ? null : video.id); }}
            className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              isOpen
                ? 'bg-[var(--color-amber)] text-white'
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-amber)] hover:text-white'
            }`}
          >
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <Play className="w-3 h-3" />}
            {isOpen ? 'Close' : 'Watch'}
          </button>
          {canManage && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(video.id); }}
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Inline player */}
      {isOpen && (
        <div className="px-4 pb-3">
          {embedUrl ? (
            embedUrl.endsWith('.mp4') || embedUrl.endsWith('.webm') || embedUrl.endsWith('.ogg')
              ? (
                <video
                  src={embedUrl}
                  controls
                  autoPlay
                  className="w-full rounded-xl aspect-video bg-black"
                />
              ) : (
                <iframe
                  src={embedUrl}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="w-full rounded-xl aspect-video bg-black border-0"
                />
              )
          ) : (
            <div className="w-full aspect-video rounded-xl bg-[var(--color-bg-secondary)] flex flex-col items-center justify-center gap-2">
              <PlaySquare className="w-8 h-8 text-[var(--color-text-muted)]" />
              <p className="text-xs text-[var(--color-text-muted)]">Can't embed this URL</p>
              {safeVideoUrl && (
                <a href={safeVideoUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[var(--color-amber)] hover:underline font-semibold">
                  Open in new tab â†’
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ PlaylistCard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PlaylistCard({
  playlist, canManage, onDelete, onUpdate,
}: {
  playlist: Playlist;
  canManage: boolean;
  onDelete: (id: string) => void;
  onUpdate: (p: Playlist) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [videos, setVideos]     = useState<PlaylistVideo[]>(playlist.videos ?? []);
  const [loaded, setLoaded]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [openVideoId, setOpenVideoId] = useState<string | null>(null);

  // Add-video form state
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [vTitle, setVTitle]             = useState('');
  const [vUrl, setVUrl]                 = useState('');
  const [vDuration, setVDuration]       = useState('');
  const [addingVideo, setAddingVideo]   = useState(false);

  // Edit playlist inline
  const [editing, setEditing]           = useState(false);
  const [editTitle, setEditTitle]       = useState(playlist.title);
  const [editDesc, setEditDesc]         = useState(playlist.description ?? '');
  const [editColor, setEditColor]       = useState(playlist.accent_color);
  const [editEmoji, setEditEmoji]       = useState(playlist.cover_emoji);
  const [saving, setSaving]             = useState(false);

  const loadVideos = async () => {
    if (loaded) return;
    setLoading(true);
    const { data } = await supabase
      .from('club_playlist_videos')
      .select('*')
      .eq('playlist_id', playlist.id)
      .order('order_index');
    if (data) setVideos(data);
    setLoaded(true);
    setLoading(false);
  };

  const handleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next) await loadVideos();
  };

  const handleAddVideo = async () => {
    if (!vTitle.trim() || !vUrl.trim()) return;
    const safeVideoUrl = normalizeHttpUrl(vUrl);
    if (!safeVideoUrl) {
      toast.error('Video URL must start with http:// or https://');
      return;
    }

    setAddingVideo(true);
    const thumb = autoThumbnail(safeVideoUrl) ?? null;
    const { data, error } = await supabase
      .from('club_playlist_videos')
      .insert({
        playlist_id: playlist.id,
        title: vTitle.trim(),
        video_url: safeVideoUrl,
        thumbnail_url: thumb,
        duration_label: vDuration.trim() || null,
        order_index: videos.length,
      })
      .select().single();
    if (error) { toast.error('Could not add video.'); }
    else {
      setVideos(prev => [...prev, data]);
      setVTitle(''); setVUrl(''); setVDuration('');
      setShowAddVideo(false);
      toast.success('Video added!');
    }
    setAddingVideo(false);
  };

  const handleDeleteVideo = async (id: string) => {
    await supabase.from('club_playlist_videos').delete().eq('id', id);
    setVideos(prev => prev.filter(v => v.id !== id));
    if (openVideoId === id) setOpenVideoId(null);
    toast('Video removed.');
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('club_playlists').update({
      title: editTitle.trim(),
      description: editDesc.trim() || null,
      accent_color: editColor,
      cover_emoji: editEmoji.trim() || 'ðŸ“‚',
    }).eq('id', playlist.id);
    if (error) { toast.error('Could not save changes.'); }
    else {
      onUpdate({ ...playlist, title: editTitle.trim(), description: editDesc.trim() || null, accent_color: editColor, cover_emoji: editEmoji.trim() || 'ðŸ“‚' });
      setEditing(false);
      toast.success('Playlist updated!');
    }
    setSaving(false);
  };

  return (
    <div className="sc-card overflow-hidden"
      style={{ borderLeft: `4px solid ${playlist.accent_color}` }}>

      {/* â”€â”€ Playlist header â”€â”€ */}
      {editing ? (
        <div className="p-4 flex flex-col gap-3">
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <input value={editEmoji} onChange={e => setEditEmoji(e.target.value)}
              className="sc-input w-14 text-center text-xl px-2 py-2" maxLength={2} />
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
              className="sc-input text-sm px-3 py-2" placeholder="Playlist title" />
          </div>
          <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)}
            className="sc-input text-sm px-3 py-2 resize-none" rows={2} placeholder="Description (optional)" />
          {/* Color picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--color-text-secondary)]">Color:</span>
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setEditColor(c)}
                className="w-6 h-6 rounded-full border-2 transition-all"
                style={{ background: c, borderColor: editColor === c ? 'white' : 'transparent',
                  boxShadow: editColor === c ? `0 0 0 2px ${c}` : 'none' }} />
            ))}
            <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)}
              className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent" title="Custom color" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} disabled={saving}
              className="btn-amber flex items-center gap-1.5 text-xs disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save
            </button>
            <button onClick={() => setEditing(false)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleExpand}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleExpand(); }}
          className="w-full flex items-center gap-3 px-4 py-4 text-left cursor-pointer hover:bg-[var(--color-bg-secondary)]/40 transition-colors"
        >
          {/* Emoji icon */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${playlist.accent_color}22` }}>
            {playlist.cover_emoji}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{playlist.title}</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {videos.length > 0 ? `${videos.length} video${videos.length !== 1 ? 's' : ''}` : 'No videos yet'}
              {playlist.description && ` · ${playlist.description}`}
            </p>
          </div>

          {/* Admin controls + chevron */}
          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
            {canManage && (
              <>
                <button onClick={() => setEditing(true)}
                  className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-amber)] hover:bg-parchment transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(playlist.id)}
                  className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <div className="ml-1 text-[var(--color-text-muted)]">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Expanded: video list â”€â”€ */}
      {expanded && !editing && (
        <div className="border-t border-[var(--color-border)] flex flex-col gap-0.5 pb-2">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-amber)]" />
            </div>
          ) : videos.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <PlaySquare className="w-6 h-6 mx-auto mb-2 text-[var(--color-text-muted)] opacity-50" />
              <p className="text-xs text-[var(--color-text-muted)]">No videos yet.</p>
            </div>
          ) : (
            <div className="pt-1">
              {videos.map((v, i) => (
                <VideoRow
                  key={v.id}
                  video={v}
                  index={i}
                  canManage={canManage}
                  openId={openVideoId}
                  onPlay={id => setOpenVideoId(id)}
                  onDelete={handleDeleteVideo}
                />
              ))}
            </div>
          )}

          {/* Add video form */}
          {canManage && (
            <div className="px-4 pt-2">
              {showAddVideo ? (
                <div className="flex flex-col gap-2 sc-card p-3">
                  <input value={vTitle} onChange={e => setVTitle(e.target.value)}
                    placeholder="Video title *" className="sc-input text-sm px-3 py-2" />
                  <input value={vUrl} onChange={e => setVUrl(e.target.value)}
                    placeholder="YouTube / Loom / direct URL *" className="sc-input text-sm px-3 py-2" />
                  <input value={vDuration} onChange={e => setVDuration(e.target.value)}
                    placeholder="Duration (e.g. 8:42)" className="sc-input text-sm px-3 py-2" />
                  <div className="flex gap-2 mt-1">
                    <button onClick={handleAddVideo} disabled={addingVideo || !vTitle.trim() || !vUrl.trim()}
                      className="btn-amber flex items-center gap-1.5 text-xs disabled:opacity-50">
                      {addingVideo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add
                    </button>
                    <button onClick={() => { setShowAddVideo(false); setVTitle(''); setVUrl(''); setVDuration(''); }}
                      className="btn-ghost text-xs px-3 py-1.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddVideo(true)}
                  className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-amber)] transition-colors py-1">
                  <Plus className="w-3.5 h-3.5" /> Add video
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ PlaylistsTab (main export) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface PlaylistsTabProps {
  clubId: string;
  userId: string | undefined;
  canManage: boolean;   // admin or moderator
  isMember: boolean;
}

export default function PlaylistsTab({ clubId, userId, canManage, isMember }: PlaylistsTabProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [creating, setCreating]   = useState(false);
  const [chatVideos, setChatVideos] = useState<ChatVideo[]>([]);
  const [loadingChatVideos, setLoadingChatVideos] = useState(true);

  // New playlist form
  const [fTitle, setFTitle]     = useState('');
  const [fDesc, setFDesc]       = useState('');
  const [fColor, setFColor]     = useState('#8B7BFF');
  const [fEmoji, setFEmoji]     = useState('ðŸ“‚');

  useEffect(() => {
    supabase
      .from('club_playlists')
      .select('*')
      .eq('club_id', clubId)
      .order('order_index')
      .then(({ data }) => {
        if (data) setPlaylists(data);
        setLoading(false);
      });
  }, [clubId]);

  useEffect(() => {
    let mounted = true;

    async function loadChatVideos() {
      if (!clubId || !isMember) {
        if (mounted) {
          setChatVideos([]);
          setLoadingChatVideos(false);
        }
        return;
      }

      setLoadingChatVideos(true);
      const { data: channels } = await supabase
        .from('club_channels')
        .select('id, name')
        .eq('club_id', clubId);

      const channelMap = new Map((channels ?? []).map((channel) => [channel.id, channel.name]));
      const channelIds = Array.from(channelMap.keys());

      if (channelIds.length === 0) {
        if (mounted) {
          setChatVideos([]);
          setLoadingChatVideos(false);
        }
        return;
      }

      const { data: messages } = await supabase
        .from('club_messages')
        .select('id, channel_id, content, video_url, created_at')
        .in('channel_id', channelIds)
        .not('video_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(120);

      if (!mounted) return;

      const videos = (messages ?? [])
        .map((message) => {
          const safeUrl = normalizeHttpUrl(message.video_url as string | null);
          if (!safeUrl) return null;

          return {
            id: message.id,
            title: message.content?.trim() || extractFileNameFromUrl(safeUrl, 'Shared video'),
            url: safeUrl,
            createdAt: message.created_at,
            channelName: channelMap.get(message.channel_id) ?? 'general',
          };
        })
        .filter((video): video is ChatVideo => video !== null);

      setChatVideos(videos);
      setLoadingChatVideos(false);
    }

    loadChatVideos();
    return () => {
      mounted = false;
    };
  }, [clubId, isMember]);

  const handleCreate = async () => {
    if (!userId || !fTitle.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('club_playlists')
      .insert({
        club_id: clubId,
        title: fTitle.trim(),
        description: fDesc.trim() || null,
        accent_color: fColor,
        cover_emoji: fEmoji.trim() || 'ðŸ“‚',
        created_by: userId,
        order_index: playlists.length,
      })
      .select().single();
    if (error) { toast.error('Could not create playlist.'); }
    else {
      setPlaylists(prev => [...prev, data]);
      setFTitle(''); setFDesc(''); setFColor('#8B7BFF'); setFEmoji('ðŸ“‚');
      setShowForm(false);
      toast.success('Playlist created!');
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('club_playlists').delete().eq('id', id);
    setPlaylists(prev => prev.filter(p => p.id !== id));
    toast('Playlist deleted.');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-amber)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sc-card p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          Videos From Chat
        </h3>
        {loadingChatVideos ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-amber)]" />
          </div>
        ) : chatVideos.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)]">No video messages yet.</p>
        ) : (
          <div className="space-y-2">
            {chatVideos.slice(0, 12).map((video) => {
              const safeVideoUrl = normalizeHttpUrl(video.url);
              if (!safeVideoUrl) return null;

              return (
                <a
                  key={video.id}
                  href={safeVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2.5 hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center">
                    <PlaySquare className="w-4 h-4 text-[var(--color-amber)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy truncate">{video.title}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                      #{video.channelName} · {new Date(video.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-sm">Video Playlists</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {playlists.length} playlist{playlists.length !== 1 ? 's' : ''} · click to expand
          </p>
        </div>
        {canManage && (
          <button onClick={() => setShowForm(v => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-navy hover:border-[var(--color-amber)] transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Playlist
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="sc-card p-4 flex flex-col gap-3">
          <h3 className="font-semibold text-sm">Create Playlist</h3>

          <div className="grid grid-cols-[auto_1fr] gap-2">
            <input value={fEmoji} onChange={e => setFEmoji(e.target.value)}
              className="sc-input w-14 text-center text-xl px-2 py-2" maxLength={2}
              placeholder="ðŸ“‚" />
            <input value={fTitle} onChange={e => setFTitle(e.target.value)}
              placeholder="Playlist title *" className="sc-input text-sm px-3 py-2.5" />
          </div>

          <textarea value={fDesc} onChange={e => setFDesc(e.target.value)}
            placeholder="Brief description (optional)"
            className="sc-input text-sm px-3 py-2.5 resize-none" rows={2} />

          {/* Color presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--color-text-secondary)]">Accent color:</span>
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setFColor(c)}
                className="w-6 h-6 rounded-full border-2 transition-all"
                style={{ background: c, borderColor: fColor === c ? 'white' : 'transparent',
                  boxShadow: fColor === c ? `0 0 0 2px ${c}` : 'none' }} />
            ))}
            <input type="color" value={fColor} onChange={e => setFColor(e.target.value)}
              className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent" title="Custom color" />
          </div>

          {/* Preview strip */}
          <div className="rounded-xl overflow-hidden border-l-4 p-3 flex items-center gap-3"
            style={{ borderLeftColor: fColor, background: `${fColor}11` }}>
            <span className="text-xl">{fEmoji || 'ðŸ“‚'}</span>
            <div>
              <p className="text-sm font-semibold">{fTitle || 'Playlist title'}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{fDesc || 'No description'}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating || !fTitle.trim()}
              className="btn-amber flex items-center gap-1.5 text-sm disabled:opacity-50">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm px-4 py-2">Cancel</button>
          </div>
        </div>
      )}

      {/* Playlist list */}
      {playlists.length === 0 ? (
        <div className="sc-card p-10 text-center text-[var(--color-text-secondary)]">
          <PlaySquare className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-sm">No playlists yet</p>
          <p className="text-xs mt-1">
            {canManage ? 'Create the first playlist to start organizing videos.' : 'No video playlists have been added yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {playlists.map(pl => (
            <PlaylistCard
              key={pl.id}
              playlist={pl}
              canManage={canManage}
              onDelete={handleDelete}
              onUpdate={updated => setPlaylists(prev => prev.map(p => p.id === updated.id ? updated : p))}
            />
          ))}
        </div>
      )}
    </div>
  );
}


