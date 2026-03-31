import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { X, Search, MapPin, Plus, AlertCircle, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface BoardPost {
  id: string;
  author_id: string;
  type: 'looking_for' | 'offering' | 'event' | 'question' | 'bounty';
  title: string;
  content: string;
  neighborhood: string | null;
  expires_at: string | null;
  created_at: string;
  author?: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    trust_tier?: number;
  };
}

const POST_TYPES = [
  { value: 'looking_for', label: 'Looking for', color: 'var(--color-plum)', bg: '#F3E8FF' },
  { value: 'offering', label: 'Offering', color: 'var(--color-forest)', bg: '#E8F5EE' },
  { value: 'bounty', label: 'Bounty', color: 'var(--color-amber)', bg: '#FFF3E0' },
  { value: 'event', label: 'Event', color: 'var(--color-navy)', bg: '#E3F2FD' },
  { value: 'question', label: 'Question', color: 'var(--color-text-secondary)', bg: '#F1F5F9' },
] as const;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Board() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('map');
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
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('board_posts')
      .select('id, author_id, type, title, content, neighborhood, expires_at, created_at, author:profiles!board_posts_author_id_fkey(first_name, last_name, avatar_url, trust_tier)')
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPosts(data.map((d: any) => ({
        ...d,
        author: Array.isArray(d.author) ? d.author[0] : d.author,
      })) as BoardPost[]);
    }
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
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from('board_posts').insert({
      author_id: user.id,
      type: newPost.type,
      title: newPost.title.trim(),
      content: newPost.content.trim(),
      neighborhood: newPost.neighborhood || null,
      expires_at: expiresAt,
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
      toast.success('Flare removed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row justify-between items-start gap-6 mt-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--color-border)] shadow-sm text-xs font-semibold text-[var(--color-amber)] mb-4">
            <span className="w-2 h-2 rounded-full bg-[var(--color-amber)] animate-pulse" />
            Community Pulse
          </div>
          <h1 className="font-heading text-4xl text-navy leading-tight mb-2">City Board</h1>
          <p className="font-body text-[var(--color-text-secondary)] max-w-2xl text-[15px] leading-relaxed">
            The heartbeat of the local skill-sharing ecosystem. Discover requests, offers, bounties, and trusted helpers around you.
          </p>
        </div>
        <button onClick={() => setShowNewPost(true)} className="btn-amber whitespace-nowrap">
          <Plus className="w-4 h-4" /> Drop a Flare
        </button>
      </section>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="sc-card w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl text-navy">New Flare</h2>
              <button onClick={() => setShowNewPost(false)} className="p-1.5 rounded-lg hover:bg-parchment text-[var(--color-text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {POST_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  onClick={() => setNewPost(prev => ({ ...prev, type: pt.value }))}
                  className="px-3 py-1.5 rounded-full text-xs font-body font-semibold transition-all"
                  style={{
                    background: newPost.type === pt.value ? pt.color : 'transparent',
                    color: newPost.type === pt.value ? 'white' : 'var(--color-text-secondary)',
                    border: `1px solid ${newPost.type === pt.value ? pt.color : 'var(--color-border)'}`
                  }}
                >
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
              placeholder="What do you need or have to offer?"
              className="input-sc resize-none"
              rows={4}
            />
            <input
              value={newPost.neighborhood}
              onChange={(e) => setNewPost(prev => ({ ...prev, neighborhood: e.target.value }))}
              placeholder="City or area (optional)"
              className="input-sc"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowNewPost(false)} className="btn-outline-navy py-2 px-4 shadow-none">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !newPost.title.trim() || !newPost.content.trim()}
                className="btn-amber py-2 px-6 disabled:opacity-50"
              >
                {submitting ? 'Dropping...' : 'Drop Flare'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP GRID: MAP & STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        
        {/* Glow Map Panel */}
        <section className="sc-card overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[var(--color-border)] flex flex-wrap justify-between items-center gap-4 bg-[rgba(255,255,255,0.5)]">
            <div>
              <h2 className="font-heading text-lg text-navy">Local Glow Map</h2>
              <p className="font-body text-[13px] text-[var(--color-text-secondary)]">Active flares based on your proximity.</p>
            </div>
            <div className="flex bg-parchment p-1 rounded-xl shadow-inner border border-[var(--color-border)]">
              <button 
                onClick={() => setViewMode('map')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-body transition-all ${viewMode === 'map' ? 'bg-white text-navy shadow-sm' : 'text-[var(--color-text-muted)] hover:text-navy'}`}
              >
                Map View
              </button>
              <button 
                onClick={() => setViewMode('feed')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-body transition-all ${viewMode === 'feed' ? 'bg-white text-navy shadow-sm' : 'text-[var(--color-text-muted)] hover:text-navy'}`}
              >
                Feed Only
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col bg-white">
            {viewMode === 'map' ? (
              <div className="relative w-full h-[360px] rounded-2xl border border-[var(--color-border)] bg-slate-50 overflow-hidden flex-1 shrink-0">
                {/* CSS Mock Map Grid */}
                <div 
                  className="absolute inset-0 opacity-20 transition-opacity" 
                  style={{
                    backgroundImage: 'radial-gradient(var(--color-navy) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
                  }}
                />
                
                {/* Map "Glows" - hardcoded placeholders for visual effect */}
                <div className="absolute top-[30%] left-[20%] w-6 h-6 rounded-full bg-[var(--color-plum)] blur-md opacity-30 animate-pulse" />
                <div className="absolute top-[32%] left-[21%] w-3 h-3 rounded-full bg-white border-2 border-[var(--color-plum)] shadow-lg z-10" />

                <div className="absolute top-[60%] left-[50%] w-6 h-6 rounded-full bg-[var(--color-amber)] blur-md opacity-30 animate-pulse" />
                <div className="absolute top-[62%] left-[51%] w-3 h-3 rounded-full bg-white border-2 border-[var(--color-amber)] shadow-lg z-10" />

                <div className="absolute top-[40%] left-[70%] w-6 h-6 rounded-full bg-[var(--color-forest)] blur-md opacity-30 animate-pulse" />
                <div className="absolute top-[42%] left-[71%] w-3 h-3 rounded-full bg-white border-2 border-[var(--color-forest)] shadow-lg z-10" />

                <div className="absolute top-[20%] left-[60%] w-6 h-6 rounded-full bg-[var(--color-navy)] blur-md opacity-20 animate-pulse" />
                <div className="absolute top-[22%] left-[61%] w-3 h-3 rounded-full bg-white border-2 border-[var(--color-navy)] shadow-lg z-10" />
                
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-center z-20">
                  {POST_TYPES.map(pt => (
                    <div key={pt.value} className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-[var(--color-border)] text-[10px] font-semibold flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full" style={{ background: pt.color }} />
                      <span className="text-navy">{pt.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full h-[360px] rounded-2xl border border-dashed border-[var(--color-border)] bg-gray-50 flex items-center justify-center flex-col shrink-0">
                <MapPin className="w-8 h-8 text-[var(--color-text-muted)] mb-3" />
                <span className="text-sm font-semibold text-navy font-body">Map functionality paused</span>
                <span className="text-xs text-[var(--color-text-secondary)] font-body mt-1">Activate Map View to see geographic flares.</span>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar Stack */}
        <div className="flex flex-col gap-6">
          <section className="sc-card">
            <div className="p-4 border-b border-[var(--color-border)] bg-[rgba(255,255,255,0.5)]">
              <h2 className="font-heading text-base text-navy">Board Signals</h2>
              <p className="font-body text-xs text-[var(--color-text-secondary)]">Live metrics & trust.</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <div className="bg-parchment p-3 rounded-xl border border-[var(--color-border)]">
                <strong className="block font-heading text-xl text-navy">{posts.length}</strong>
                <span className="font-body text-xs text-[var(--color-text-secondary)]">Active Flares</span>
              </div>
              <div className="bg-parchment p-3 rounded-xl border border-[var(--color-border)]">
                <strong className="block font-heading text-xl text-navy">93%</strong>
                <span className="font-body text-xs text-[var(--color-text-secondary)]">Trusted Replies</span>
              </div>
              <div className="bg-parchment p-3 rounded-xl border border-[var(--color-border)]">
                <strong className="block font-heading text-xl text-navy">14m</strong>
                <span className="font-body text-xs text-[var(--color-text-secondary)]">Avg Response</span>
              </div>
              <div className="bg-parchment p-3 rounded-xl border border-[var(--color-border)]">
                <strong className="block font-heading text-xl text-navy">{posts.filter(p => p.type === 'bounty').length}</strong>
                <span className="font-body text-xs text-[var(--color-text-secondary)]">Open Bounties</span>
              </div>
            </div>
          </section>

          <section className="sc-card flex-1">
            <div className="p-4 border-b border-[var(--color-border)] bg-[rgba(255,255,255,0.5)]">
              <h2 className="font-heading text-base text-navy">Smart Matches</h2>
              <p className="font-body text-xs text-[var(--color-text-secondary)]">Helpers matching your profile.</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[var(--color-border)] shadow-sm">
                <div>
                  <strong className="block text-sm font-semibold text-navy font-body mb-0.5">Spanish tutor needed</strong>
                  <span className="text-[11px] text-[var(--color-text-secondary)] font-body">Matched to 4 nearby users</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#FFEBEE] text-[#E53935]">HOT</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[var(--color-border)] shadow-sm">
                <div>
                  <strong className="block text-sm font-semibold text-navy font-body mb-0.5">Guitar basics</strong>
                  <span className="text-[11px] text-[var(--color-text-secondary)] font-body">2 trusted creators available</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-green-50 text-green-700">10km</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* BOTTOM GRID: COMMUNITY FEED */}
      <section className="sc-card overflow-hidden">
        <div className="p-5 border-b border-[var(--color-border)] bg-slate-50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-heading text-lg text-navy">Community Feed</h2>
              <p className="font-body text-[13px] text-[var(--color-text-secondary)]">Color-coded by intent, trust, and urgency.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full border border-[var(--color-border)] bg-white text-xs font-semibold text-navy font-body shadow-sm">Nearby First</span>
              <span className="px-3 py-1 rounded-full border border-[var(--color-border)] bg-white text-xs font-semibold text-navy font-body shadow-sm">Direct Booking</span>
            </div>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
             <div className="py-12 text-center text-[var(--color-text-muted)] font-body text-sm flex flex-col items-center">
               <span className="w-6 h-6 border-2 border-[var(--color-amber)] border-t-transparent rounded-full animate-spin mb-3"></span>
               Loading flares...
             </div>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center bg-gray-50 border border-dashed border-[var(--color-border)] rounded-2xl my-4">
              <Search className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-3" />
              <div className="font-heading text-lg text-navy mb-1">No flares active in your area</div>
              <p className="font-body text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto">Be the first to drop a flare on the map and start building the local network.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map(post => {
                const typeInfo = POST_TYPES.find(pt => pt.value === post.type) || POST_TYPES[0];
                const isTrusted = post.author?.trust_tier && post.author.trust_tier >= 3;
                const isExpiring = post.expires_at && new Date(post.expires_at).getTime() - Date.now() < 86400000;
                const isOwn = user?.id === post.author_id;

                const ringColor = 
                  post.author?.trust_tier === 4 ? 'ring-[var(--color-amber)]' : 
                  post.author?.trust_tier === 3 ? 'ring-[var(--color-plum)]' : 
                  post.author?.trust_tier === 2 ? 'ring-[var(--color-forest)]' : 'ring-gray-200';

                return (
                  <article 
                    key={post.id} 
                    className={`p-5 rounded-2xl border transition-all ${isTrusted ? 'border-[#C4873A]/30 bg-[#FFF3E0]/20 shadow-sm' : 'border-[var(--color-border)] bg-white hover:border-[var(--color-amber)]'}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className={`w-11 h-11 flex-shrink-0 ring-2 ring-offset-2 ${ringColor}`}>
                          <AvatarImage src={post.author?.avatar_url} />
                          <AvatarFallback style={{ background: 'var(--color-navy)', color: 'white' }}>
                            {post.author?.first_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <strong className="block text-sm font-bold text-navy font-body truncate">
                            {post.author?.first_name} {post.author?.last_name}
                          </strong>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-body text-[var(--color-text-secondary)] mt-0.5">
                            {post.neighborhood && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{post.neighborhood}</span>}
                            <span>• {timeAgo(post.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {isTrusted && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-amber)] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          <ShieldCheck className="w-3 h-3" /> Tier {post.author?.trust_tier}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <h3 className="font-heading text-lg text-navy mb-2 line-clamp-1">{post.title}</h3>
                    <p className="font-body text-sm leading-relaxed text-[var(--color-text-secondary)] line-clamp-3 mb-4 h-16">
                      {post.content}
                    </p>

                    {/* Meta Chips */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      <span 
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: typeInfo.bg, color: typeInfo.color }}
                      >
                        {typeInfo.label}
                      </span>
                      {isExpiring && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider">
                          <AlertCircle className="w-3 h-3" /> Expiring
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-[var(--color-border)]">
                      {isOwn ? (
                        <button onClick={() => handleDelete(post.id)} className="w-full py-2 btn-outline-navy !text-xs">
                          Remove Flare
                        </button>
                      ) : (
                        <>
                          <button className={`flex-1 py-2 shadow-sm !text-xs ${post.type === 'bounty' ? 'btn-navy bg-[var(--color-plum)] hover:bg-[#4a2e7a]' : 'btn-amber'}`}>
                            {post.type === 'offering' ? 'Book Session' : post.type === 'bounty' ? 'Claim Bounty' : 'Connect'}
                          </button>
                          <button className="flex-1 py-2 btn-outline-navy !text-xs font-semibold">
                            View Profile
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
