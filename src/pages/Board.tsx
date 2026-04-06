import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { X, Search, MapPin, Plus, AlertCircle, ShieldCheck, Crosshair, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBoardInsights } from '@/hooks/useBoardInsights';
import { buildMapPoints, scoreBoardPosts } from '@/lib/boardInsights';
import { BOARD_POST_TYPES } from '@/types/board';

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

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() - Date.now() < 86400000;
}

export default function Board() {
  const { user } = useAuth();
  const { posts, loading, refetch } = useBoardInsights(user);
  const [showNewPost, setShowNewPost] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('map');
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const [viewerLocation, setViewerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [newPost, setNewPost] = useState({
    type: 'looking_for' as (typeof BOARD_POST_TYPES)[number]['value'],
    title: '',
    content: '',
    neighborhood: '',
    location_lat: null as number | null,
    location_lng: null as number | null,
    location_precision: 'unknown' as 'exact' | 'neighborhood' | 'city' | 'unknown',
  });

  const rankedPosts = useMemo(
    () => scoreBoardPosts(posts, viewerLocation),
    [posts, viewerLocation]
  );
  const mapPoints = useMemo(() => buildMapPoints(rankedPosts), [rankedPosts]);

  const activePoint = useMemo(
    () => mapPoints.find((point) => point.id === activePointId) ?? mapPoints[0] ?? null,
    [activePointId, mapPoints]
  );

  const trustedPercent = useMemo(() => {
    if (posts.length === 0) return 0;
    const trusted = posts.filter((post) => (post.author?.trust_tier ?? 0) >= 2).length;
    return Math.round((trusted / posts.length) * 100);
  }, [posts]);

  const avgDistance = useMemo(() => {
    const distances = rankedPosts.map((post) => post.distance_km).filter((d): d is number => d !== null);
    if (distances.length === 0) return null;
    const avg = distances.reduce((sum, value) => sum + value, 0) / distances.length;
    return avg.toFixed(1);
  }, [rankedPosts]);

  const smartMatches = useMemo(
    () => rankedPosts.filter((post) => post.author_id !== user?.id).slice(0, 3),
    [rankedPosts, user?.id]
  );

  const requestViewerLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this browser');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setViewerLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
        toast.success('Distance ranking is now enabled');
      },
      () => {
        setLocationLoading(false);
        toast.error('Location permission denied. Showing network-based ranking only.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const attachPostLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this browser');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNewPost((prev) => ({
          ...prev,
          location_lat: position.coords.latitude,
          location_lng: position.coords.longitude,
          location_precision: 'exact',
        }));
        setLocationLoading(false);
        toast.success('Location attached to this flare');
      },
      () => {
        setLocationLoading(false);
        toast.error('Could not read your location');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async () => {
    if (!user || user.isDemo) {
      toast.error('Sign in to post on the board');
      return;
    }
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSubmitting(true);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const payload = {
      author_id: user.id,
      type: newPost.type,
      title: newPost.title.trim(),
      content: newPost.content.trim(),
      neighborhood: newPost.neighborhood || null,
      expires_at: expiresAt,
      location_lat: newPost.location_lat,
      location_lng: newPost.location_lng,
      location_precision: newPost.location_precision,
    };

    let insertError: string | null = null;
    const withGeoInsert = await supabase.from('board_posts').insert(payload);
    if (withGeoInsert.error) {
      const fallbackInsert = await supabase.from('board_posts').insert({
        author_id: payload.author_id,
        type: payload.type,
        title: payload.title,
        content: payload.content,
        neighborhood: payload.neighborhood,
        expires_at: payload.expires_at,
      });
      if (fallbackInsert.error) insertError = fallbackInsert.error.message;
    }
    setSubmitting(false);

    if (insertError) {
      toast.error('Could not create post');
      return;
    }

    toast.success('Post published');
    setShowNewPost(false);
    setNewPost({
      type: 'looking_for',
      title: '',
      content: '',
      neighborhood: '',
      location_lat: null,
      location_lng: null,
      location_precision: 'unknown',
    });
    refetch();
  };

  const handleDelete = async (postId: string) => {
    const { error } = await supabase.from('board_posts').delete().eq('id', postId);
    if (!error) {
      toast.success('Flare removed');
      refetch();
    }
  };

  const trackSignal = async (
    targetUserId: string,
    signalType: 'board_connect_click' | 'board_profile_view'
  ) => {
    if (!user || user.isDemo || !targetUserId || targetUserId === user.id) return;
    await supabase.from('relationship_signals').insert({
      actor_id: user.id,
      target_id: targetUserId,
      signal_type: signalType,
      signal_strength: 1,
      context_type: 'board',
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <section className="flex flex-col md:flex-row justify-between items-start gap-6 mt-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--color-border)] shadow-sm text-xs font-semibold text-[var(--color-amber)] mb-4">
            <span className="w-2 h-2 rounded-full bg-[var(--color-amber)] animate-pulse" />
            Community Pulse
          </div>
          <h1 className="font-heading text-4xl text-navy leading-tight mb-2">City Board</h1>
          <p className="font-body text-[var(--color-text-secondary)] max-w-2xl text-[15px] leading-relaxed">
            Real-time requests, offers, and events ranked by relationship strength and distance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={requestViewerLocation}
            disabled={locationLoading}
            className="btn-outline-navy whitespace-nowrap py-2.5 px-4"
          >
            <Crosshair className="w-4 h-4" />
            {locationLoading ? 'Locating...' : viewerLocation ? 'Location Active' : 'Use My Location'}
          </button>
          <button onClick={() => setShowNewPost(true)} className="btn-amber whitespace-nowrap">
            <Plus className="w-4 h-4" /> Drop a Flare
          </button>
        </div>
      </section>

      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="sc-card w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl text-navy">New Flare</h2>
              <button
                onClick={() => setShowNewPost(false)}
                className="p-1.5 rounded-lg hover:bg-parchment text-[var(--color-text-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {BOARD_POST_TYPES.map((typeOption) => (
                <button
                  key={typeOption.value}
                  onClick={() => setNewPost((prev) => ({ ...prev, type: typeOption.value }))}
                  className="px-3 py-1.5 rounded-full text-xs font-body font-semibold transition-all"
                  style={{
                    background: newPost.type === typeOption.value ? typeOption.color : 'transparent',
                    color: newPost.type === typeOption.value ? 'white' : 'var(--color-text-secondary)',
                    border: `1px solid ${newPost.type === typeOption.value ? typeOption.color : 'var(--color-border)'}`,
                  }}
                >
                  {typeOption.label}
                </button>
              ))}
            </div>

            <input
              value={newPost.title}
              onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Title"
              className="input-sc"
            />
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="What do you need or have to offer?"
              className="input-sc resize-none"
              rows={4}
            />
            <input
              value={newPost.neighborhood}
              onChange={(e) => setNewPost((prev) => ({ ...prev, neighborhood: e.target.value }))}
              placeholder="City or area (optional)"
              className="input-sc"
            />

            <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-parchment px-3 py-2">
              <div className="text-xs text-[var(--color-text-secondary)] font-body">
                {newPost.location_lat !== null ? 'Exact point attached' : 'No map point attached'}
              </div>
              <button
                onClick={attachPostLocation}
                disabled={locationLoading}
                className="btn-outline-navy py-1.5 px-3 !text-xs"
              >
                {locationLoading ? 'Locating...' : 'Attach Location'}
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowNewPost(false)}
                className="btn-outline-navy py-2 px-4 shadow-none"
              >
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

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="sc-card overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[var(--color-border)] flex flex-wrap justify-between items-center gap-4 bg-[rgba(255,255,255,0.5)]">
            <div>
              <h2 className="font-heading text-lg text-navy">Local Signal Map</h2>
              <p className="font-body text-[13px] text-[var(--color-text-secondary)]">
                Map points are now real board posts ranked by live relationship signals.
              </p>
            </div>
            <div className="flex bg-parchment p-1 rounded-xl shadow-inner border border-[var(--color-border)]">
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-body transition-all ${
                  viewMode === 'map'
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-navy'
                }`}
              >
                Map View
              </button>
              <button
                onClick={() => setViewMode('feed')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-body transition-all ${
                  viewMode === 'feed'
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-navy'
                }`}
              >
                Feed Only
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col bg-white">
            {viewMode === 'map' ? (
              <div className="relative w-full h-[360px] rounded-2xl border border-[var(--color-border)] overflow-hidden flex-1 shrink-0 bg-[radial-gradient(circle_at_20%_20%,#eef2ff_0%,#f8fafc_45%,#e2e8f0_100%)]">
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: 'radial-gradient(var(--color-navy) 1px, transparent 1px)',
                    backgroundSize: '22px 22px',
                  }}
                />

                {mapPoints.map((point) => {
                  const typeStyle = BOARD_POST_TYPES.find((typeOption) => typeOption.value === point.type) ?? BOARD_POST_TYPES[0];
                  const size = 10 + Math.round(point.score.total / 18);

                  return (
                    <button
                      key={point.id}
                      type="button"
                      onMouseEnter={() => setActivePointId(point.id)}
                      onFocus={() => setActivePointId(point.id)}
                      onClick={() => setActivePointId(point.id)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-amber)]"
                      style={{ left: `${point.x}%`, top: `${point.y}%` }}
                      aria-label={point.title}
                    >
                      <span
                        className="absolute -inset-2 rounded-full blur-md opacity-40"
                        style={{ backgroundColor: typeStyle.color }}
                      />
                      <span
                        className="relative block rounded-full border-2 border-white shadow-lg"
                        style={{ width: `${size}px`, height: `${size}px`, backgroundColor: typeStyle.color }}
                      />
                    </button>
                  );
                })}

                {activePoint && (
                  <div className="absolute left-4 right-4 bottom-4 p-3 rounded-xl bg-white/95 border border-[var(--color-border)] shadow-lg backdrop-blur-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-navy truncate">{activePoint.title}</div>
                        <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                          Match score {Math.round(activePoint.score.total)} / 100
                          {activePoint.distance_km !== null ? ` | ${activePoint.distance_km.toFixed(1)} km` : ''}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[var(--color-amber)] text-white">
                        {BOARD_POST_TYPES.find((typeOption) => typeOption.value === activePoint.type)?.label}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {activePoint.reasons.map((reason) => (
                        <span
                          key={reason}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-[360px] rounded-2xl border border-dashed border-[var(--color-border)] bg-gray-50 flex items-center justify-center flex-col shrink-0">
                <MapPin className="w-8 h-8 text-[var(--color-text-muted)] mb-3" />
                <span className="text-sm font-semibold text-navy font-body">Feed mode active</span>
                <span className="text-xs text-[var(--color-text-secondary)] font-body mt-1">
                  Switch to Map View to inspect geo-ranked flares.
                </span>
              </div>
            )}
          </div>
        </section>

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
                <strong className="block font-heading text-xl text-navy">{trustedPercent}%</strong>
                <span className="font-body text-xs text-[var(--color-text-secondary)]">Trusted Authors</span>
              </div>
              <div className="bg-parchment p-3 rounded-xl border border-[var(--color-border)]">
                <strong className="block font-heading text-xl text-navy">{avgDistance ? `${avgDistance}km` : '--'}</strong>
                <span className="font-body text-xs text-[var(--color-text-secondary)]">Avg Distance</span>
              </div>
              <div className="bg-parchment p-3 rounded-xl border border-[var(--color-border)]">
                <strong className="block font-heading text-xl text-navy">
                  {posts.filter((post) => post.type === 'bounty').length}
                </strong>
                <span className="font-body text-xs text-[var(--color-text-secondary)]">Open Bounties</span>
              </div>
            </div>
          </section>

          <section className="sc-card flex-1">
            <div className="p-4 border-b border-[var(--color-border)] bg-[rgba(255,255,255,0.5)]">
              <h2 className="font-heading text-base text-navy">Smart Matches</h2>
              <p className="font-body text-xs text-[var(--color-text-secondary)]">Top relationship-ranked opportunities.</p>
            </div>
            <div className="p-4 space-y-3">
              {smartMatches.length === 0 ? (
                <div className="text-xs text-[var(--color-text-secondary)] font-body py-4">
                  No matches yet. Add your location and profile skills to unlock ranking.
                </div>
              ) : (
                smartMatches.map((post) => (
                  <div
                    key={post.id}
                    className="flex justify-between items-center bg-white p-3 rounded-xl border border-[var(--color-border)] shadow-sm"
                  >
                    <div className="min-w-0">
                      <strong className="block text-sm font-semibold text-navy font-body mb-0.5 truncate">
                        {post.title}
                      </strong>
                      <span className="text-[11px] text-[var(--color-text-secondary)] font-body">
                        {post.reasons[0] ?? 'Relationship signal detected'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-green-50 text-green-700">
                      {Math.round(post.score.total)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <section className="sc-card overflow-hidden">
        <div className="p-5 border-b border-[var(--color-border)] bg-slate-50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-heading text-lg text-navy">Community Feed</h2>
              <p className="font-body text-[13px] text-[var(--color-text-secondary)]">
                Sorted by real relationship score and distance.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full border border-[var(--color-border)] bg-white text-xs font-semibold text-navy font-body shadow-sm">
                Relationship First
              </span>
              <span className="px-3 py-1 rounded-full border border-[var(--color-border)] bg-white text-xs font-semibold text-navy font-body shadow-sm">
                Distance Aware
              </span>
            </div>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="py-12 text-center text-[var(--color-text-muted)] font-body text-sm flex flex-col items-center">
              <span className="w-6 h-6 border-2 border-[var(--color-amber)] border-t-transparent rounded-full animate-spin mb-3" />
              Loading flares...
            </div>
          ) : rankedPosts.length === 0 ? (
            <div className="py-16 text-center bg-gray-50 border border-dashed border-[var(--color-border)] rounded-2xl my-4">
              <Search className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-3" />
              <div className="font-heading text-lg text-navy mb-1">No active flares yet</div>
              <p className="font-body text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto">
                Be the first to drop a flare and start the local network.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rankedPosts.map((post) => {
                const typeInfo = BOARD_POST_TYPES.find((typeOption) => typeOption.value === post.type) ?? BOARD_POST_TYPES[0];
                const isTrusted = (post.author?.trust_tier ?? 0) >= 3;
                const isExpiring = isExpiringSoon(post.expires_at);
                const isOwn = user?.id === post.author_id;
                const ringColor =
                  (post.author?.trust_tier ?? 0) === 4
                    ? 'ring-[var(--color-amber)]'
                    : (post.author?.trust_tier ?? 0) === 3
                    ? 'ring-[var(--color-plum)]'
                    : (post.author?.trust_tier ?? 0) === 2
                    ? 'ring-[var(--color-forest)]'
                    : 'ring-gray-200';

                return (
                  <article
                    key={post.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isTrusted
                        ? 'border-[#C4873A]/30 bg-[#FFF3E0]/20 shadow-sm'
                        : 'border-[var(--color-border)] bg-white hover:border-[var(--color-amber)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className={`w-11 h-11 flex-shrink-0 ring-2 ring-offset-2 ${ringColor}`}>
                          <AvatarImage src={post.author?.avatar_url ?? undefined} />
                          <AvatarFallback style={{ background: 'var(--color-navy)', color: 'white' }}>
                            {post.author?.first_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <strong className="block text-sm font-bold text-navy font-body truncate">
                            {post.author?.first_name} {post.author?.last_name}
                          </strong>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-body text-[var(--color-text-secondary)] mt-0.5">
                            {post.neighborhood && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" />
                                {post.neighborhood}
                              </span>
                            )}
                            <span>{timeAgo(post.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {isTrusted && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-amber)] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          <ShieldCheck className="w-3 h-3" /> Tier {post.author?.trust_tier}
                        </div>
                      )}
                    </div>

                    <h3 className="font-heading text-lg text-navy mb-2 line-clamp-1">{post.title}</h3>
                    <p className="font-body text-sm leading-relaxed text-[var(--color-text-secondary)] line-clamp-3 mb-4 h-16">
                      {post.content}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-2">
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: typeInfo.bg, color: typeInfo.color }}
                      >
                        {typeInfo.label}
                      </span>
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                        <Users className="w-3 h-3" /> {Math.round(post.score.total)} Match
                      </span>
                      {post.distance_km !== null && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                          {post.distance_km.toFixed(1)}km
                        </span>
                      )}
                      {isExpiring && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider">
                          <AlertCircle className="w-3 h-3" /> Expiring
                        </span>
                      )}
                    </div>

                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {post.reasons.map((reason) => (
                        <span
                          key={reason}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-[var(--color-border)]">
                      {isOwn ? (
                        <button onClick={() => handleDelete(post.id)} className="w-full py-2 btn-outline-navy !text-xs">
                          Remove Flare
                        </button>
                      ) : (
                        <>
                          <button
                            className={`flex-1 py-2 shadow-sm !text-xs ${
                              post.type === 'bounty'
                                ? 'btn-navy bg-[var(--color-plum)] hover:bg-[#4a2e7a]'
                                : 'btn-amber'
                            }`}
                            onClick={() => {
                              void trackSignal(post.author_id, 'board_connect_click');
                              toast.info('Connection request signal logged');
                            }}
                          >
                            {post.type === 'offering'
                              ? 'Book Session'
                              : post.type === 'bounty'
                              ? 'Claim Bounty'
                              : 'Connect'}
                          </button>
                          <button
                            className="flex-1 py-2 btn-outline-navy !text-xs font-semibold"
                            onClick={() => {
                              void trackSignal(post.author_id, 'board_profile_view');
                              toast.info('Profile signal logged');
                            }}
                          >
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
