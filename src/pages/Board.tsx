import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  HandHelping,
  CalendarDays,
  HelpCircle,
  Plus,
  X,
  MapPin,
  Clock,
  Loader2,
} from 'lucide-react';

interface BoardPost {
  id: string;
  author_id: string;
  type: 'looking_for' | 'offering' | 'event' | 'question';
  title: string;
  content: string;
  neighborhood: string | null;
  expires_at: string | null;
  created_at: string;
  author?: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

const POST_TYPES = [
  { value: 'looking_for', label: 'Looking for', icon: Search, color: 'var(--color-amber)', bg: '#FFF3E0' },
  { value: 'offering', label: 'Offering', icon: HandHelping, color: 'var(--color-forest)', bg: '#E8F5EE' },
  { value: 'event', label: 'Event', icon: CalendarDays, color: 'var(--color-plum)', bg: '#F3E8FF' },
  { value: 'question', label: 'Question', icon: HelpCircle, color: 'var(--color-navy)', bg: '#E8EFF5' },
] as const;

const NEIGHBORHOODS = ['Medina', 'Guéliz', 'Hivernage', 'Mellah', 'Palmeraie', 'Kasbah'];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Board() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newPost, setNewPost] = useState({
    type: 'looking_for' as string,
    title: '',
    content: '',
    neighborhood: '',
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('board_posts')
      .select('id, author_id, type, title, content, neighborhood, expires_at, created_at')
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    // Fetch author profiles
    const authorIds = [...new Set(data.map(p => p.author_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', authorIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const mapped: BoardPost[] = data.map(p => ({
      ...p,
      author: profileMap.get(p.author_id) || undefined,
    }));

    setPosts(mapped);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || user.id === 'demo-user-bypass') {
      toast.error('Sign in to post on the board');
      return;
    }
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('board_posts').insert({
      author_id: user.id,
      type: newPost.type,
      title: newPost.title.trim(),
      content: newPost.content.trim(),
      neighborhood: newPost.neighborhood || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error('Could not create post');
      return;
    }

    toast.success('Post published!');
    setShowNewPost(false);
    setNewPost({ type: 'looking_for', title: '', content: '', neighborhood: '' });
    fetchPosts();
  };

  const handleDelete = async (postId: string) => {
    const { error } = await supabase.from('board_posts').delete().eq('id', postId);
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Post deleted');
    }
  };

  const filtered = filterType ? posts.filter(p => p.type === filterType) : posts;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-amber)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-navy">Community Board</h1>
          <p className="font-body text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Ask, offer, find — the neighbourhood bulletin.
          </p>
        </div>
        <button
          onClick={() => setShowNewPost(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold font-body text-white transition-all hover:scale-105"
          style={{ background: 'var(--color-amber)' }}
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType(null)}
          className="px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all border"
          style={
            filterType === null
              ? { background: 'var(--color-navy)', color: 'white', borderColor: 'var(--color-navy)' }
              : { background: 'white', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }
          }
        >
          All ({posts.length})
        </button>
        {POST_TYPES.map((pt) => {
          const count = posts.filter(p => p.type === pt.value).length;
          return (
            <button
              key={pt.value}
              onClick={() => setFilterType(filterType === pt.value ? null : pt.value)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all border"
              style={
                filterType === pt.value
                  ? { background: pt.color, color: 'white', borderColor: pt.color }
                  : { background: 'white', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }
              }
            >
              <pt.icon className="w-3 h-3" />
              {pt.label} ({count})
            </button>
          );
        })}
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-navy text-lg">New Post</h2>
              <button onClick={() => setShowNewPost(false)} className="p-1.5 rounded-lg hover:bg-parchment">
                <X className="w-4 h-4 text-navy" />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex gap-2 flex-wrap">
              {POST_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  onClick={() => setNewPost(prev => ({ ...prev, type: pt.value }))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all border"
                  style={
                    newPost.type === pt.value
                      ? { background: pt.color, color: 'white', borderColor: pt.color }
                      : { background: 'white', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }
                  }
                >
                  <pt.icon className="w-3 h-3" />
                  {pt.label}
                </button>
              ))}
            </div>

            <input
              value={newPost.title}
              onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Title"
              className="input-sc"
            />
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
              placeholder="What's on your mind?"
              className="input-sc resize-none"
              rows={4}
            />
            <select
              value={newPost.neighborhood}
              onChange={(e) => setNewPost(prev => ({ ...prev, neighborhood: e.target.value }))}
              className="input-sc"
            >
              <option value="">Neighborhood (optional)</option>
              {NEIGHBORHOODS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewPost(false)}
                className="px-4 py-2 rounded-xl text-sm font-body font-semibold border border-[var(--color-border)] text-navy hover:bg-parchment"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !newPost.title.trim() || !newPost.content.trim()}
                className="px-5 py-2 rounded-xl text-sm font-body font-semibold text-white disabled:opacity-40"
                style={{ background: 'var(--color-amber)' }}
              >
                {submitting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-heading text-xl text-navy mb-2">No posts yet</div>
          <p className="font-body text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Be the first to post something on the community board.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const typeInfo = POST_TYPES.find(pt => pt.value === post.type) || POST_TYPES[0];
            const TypeIcon = typeInfo.icon;
            const isOwn = post.author_id === user?.id;

            return (
              <div
                key={post.id}
                className="sc-card p-5 space-y-3"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarImage src={post.author?.avatar_url} />
                      <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '11px' }}>
                        {post.author?.first_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-body font-semibold text-navy text-sm truncate">
                        {post.author?.first_name} {post.author?.last_name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-body" style={{ color: 'var(--color-text-muted)' }}>
                        <Clock className="w-2.5 h-2.5" />
                        {timeAgo(post.created_at)}
                        {post.neighborhood && (
                          <>
                            <span>·</span>
                            <MapPin className="w-2.5 h-2.5" />
                            {post.neighborhood}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-body font-semibold"
                      style={{ background: typeInfo.bg, color: typeInfo.color }}
                    >
                      <TypeIcon className="w-3 h-3" />
                      {typeInfo.label}
                    </span>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete post"
                      >
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-heading text-navy text-base mb-1">{post.title}</h3>
                  <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {post.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
