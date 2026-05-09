import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '@/lib/t';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  X, Search, MapPin, Plus, AlertCircle, ShieldCheck,
  Crosshair, Users, SlidersHorizontal, Star, Wifi,
  Gift, Globe, RefreshCw, Flame, BookOpen,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBoardInsights } from '@/hooks/useBoardInsights';
import { buildMapPoints, scoreBoardPosts } from '@/lib/boardInsights';
import { BOARD_POST_TYPES } from '@/types/board';
import { useBrowseSkills } from '@/hooks/useBrowseSkills';
import { CATEGORIES } from '@/constants/categories';
import { MOROCCO_REGIONS } from '@/lib/morocco';
import type { Format } from '@/types/skills';
import { SearchBar } from '@/components/ui/search-bar';
import { CardSkeletonGrid } from '@/components/ui/card-skeleton';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string, t: (key: string) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('just now');
  if (mins < 60) return `${mins}${t('m ago')}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${t('h ago')}`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}${t('d ago')}`;
  return new Date(dateStr).toLocaleDateString();
}

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() - Date.now() < 86400000;
}

function useFormatLabels(t: (key: string) => string): Record<Format, string> {
  return {
    online: t('Online'),
    'in-person': t('In-person'),
    both: t('Online & In-person'),
  };
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type PageTab = 'board' | 'skills';

export default function Board() {
  const { user } = useAuth();
  const { t } = useT();
  const FORMAT_LABELS = useFormatLabels(t);

  // ── Tab ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<PageTab>('board');

  // ── Board state ───────────────────────────────────────────────────────────
  const { posts, loading: boardLoading, refetch: refetchBoard } = useBoardInsights(user);
  const [showNewPost, setShowNewPost] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('map');
  const [showMapModal, setShowMapModal] = useState(false);
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

  const rankedPosts = useMemo(() => scoreBoardPosts(posts, viewerLocation), [posts, viewerLocation]);
  const mapPoints = useMemo(() => buildMapPoints(rankedPosts), [rankedPosts]);
  const activePoint = useMemo(
    () => mapPoints.find((p) => p.id === activePointId) ?? mapPoints[0] ?? null,
    [activePointId, mapPoints],
  );
  const trustedPercent = useMemo(() => {
    if (posts.length === 0) return 0;
    return Math.round((posts.filter((p) => (p.author?.trust_tier ?? 0) >= 2).length / posts.length) * 100);
  }, [posts]);
  const avgDistance = useMemo(() => {
    const d = rankedPosts.map((p) => p.distance_km).filter((d): d is number => d !== null);
    if (!d.length) return null;
    return (d.reduce((s, v) => s + v, 0) / d.length).toFixed(1);
  }, [rankedPosts]);
  const smartMatches = useMemo(
    () => rankedPosts.filter((p) => p.author_id !== user?.id).slice(0, 3),
    [rankedPosts, user?.id],
  );

  // ── Skills state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<Format | 'all'>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState(500);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [showGroupsOnly, setShowGroupsOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { skills, loading: skillsLoading, error: skillsError, refetch: refetchSkills } = useBrowseSkills();

  const categoriesWithCounts = useMemo(
    () => CATEGORIES.map((cat) => ({ ...cat, count: skills.filter((s) => s.category === cat.id).length })),
    [skills],
  );
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    skills.forEach((s) => (s.languages || []).forEach((l: string) => langs.add(l)));
    return Array.from(langs).sort();
  }, [skills]);
  const filteredSkills = useMemo(
    () =>
      skills.filter((skill) => {
        const q = search.toLowerCase();
        const matchSearch =
          !search ||
          skill.title.toLowerCase().includes(q) ||
          skill.teacher.firstName.toLowerCase().includes(q) ||
          skill.teacher.lastName.toLowerCase().includes(q) ||
          skill.description.toLowerCase().includes(q);
        return (
          matchSearch &&
          (selectedCategory === 'all' || skill.category === selectedCategory) &&
          (selectedFormat === 'all' || skill.format === selectedFormat || skill.format === 'both') &&
          skill.price_per_hour <= maxPrice &&
          (!showFreeOnly || skill.price_per_hour === 0) &&
          (!showGroupsOnly || skill.is_group) &&
          (selectedNeighborhood === 'all' ||
            (skill.neighborhood || skill.location || '').toLowerCase().includes(selectedNeighborhood.toLowerCase())) &&
          (selectedLanguage === 'all' || skill.languages.includes(selectedLanguage))
        );
      }),
    [skills, search, selectedCategory, selectedFormat, maxPrice, showFreeOnly, showGroupsOnly, selectedNeighborhood, selectedLanguage],
  );
  const hasActiveFilters =
    selectedCategory !== 'all' || selectedFormat !== 'all' || maxPrice < 500 ||
    showFreeOnly || showGroupsOnly || selectedNeighborhood !== 'all' || selectedLanguage !== 'all';

  const resetFilters = () => {
    setSelectedCategory('all'); setSelectedFormat('all'); setMaxPrice(500);
    setShowFreeOnly(false); setShowGroupsOnly(false);
    setSelectedNeighborhood('all'); setSelectedLanguage('all');
  };

  // ── Board actions ─────────────────────────────────────────────────────────
  const requestViewerLocation = () => {
    if (!navigator.geolocation) { toast.error(t('Geolocation not supported')); return; }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setViewerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationLoading(false); toast.success(t('Distance ranking enabled')); },
      () => { setLocationLoading(false); toast.error(t('Location permission denied.')); },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const attachPostLocation = () => {
    if (!navigator.geolocation) { toast.error(t('Geolocation not supported')); return; }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewPost((p) => ({ ...p, location_lat: pos.coords.latitude, location_lng: pos.coords.longitude, location_precision: 'exact' }));
        setLocationLoading(false); toast.success(t('Location attached'));
      },
      () => { setLocationLoading(false); toast.error(t('Could not read location')); },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleSubmit = async () => {
    if (!user || user.isDemo) { toast.error(t('Sign in to post on the board')); return; }
    if (!newPost.title.trim() || !newPost.content.trim()) { toast.error(t('Title and content are required')); return; }
    setSubmitting(true);
    const payload = {
      author_id: user.id, type: newPost.type,
      title: newPost.title.trim(), content: newPost.content.trim(),
      neighborhood: newPost.neighborhood || null,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      location_lat: newPost.location_lat, location_lng: newPost.location_lng,
      location_precision: newPost.location_precision,
    };
    const { error: e1 } = await supabase.from('board_posts').insert(payload);
    if (e1) {
      const { error: e2 } = await supabase.from('board_posts').insert({ author_id: payload.author_id, type: payload.type, title: payload.title, content: payload.content, neighborhood: payload.neighborhood, expires_at: payload.expires_at });
      if (e2) { toast.error(t('Could not create post')); setSubmitting(false); return; }
    }
    setSubmitting(false);
    toast.success(t('Flare published!'));
    setShowNewPost(false);
    setNewPost({ type: 'looking_for', title: '', content: '', neighborhood: '', location_lat: null, location_lng: null, location_precision: 'unknown' });
    refetchBoard();
  };

  const handleDelete = async (postId: string) => {
    const { error } = await supabase.from('board_posts').delete().eq('id', postId);
    if (!error) { toast.success('Flare removed'); refetchBoard(); }
  };

  const trackSignal = async (targetUserId: string, signalType: 'board_connect_click' | 'board_profile_view') => {
    if (!user || user.isDemo || !targetUserId || targetUserId === user.id) return;
    await supabase.from('relationship_signals').insert({ actor_id: user.id, target_id: targetUserId, signal_type: signalType, signal_strength: 1, context_type: 'board' });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl mt-2"
        style={{
          background: 'linear-gradient(135deg, var(--color-navy) 0%, #1e3a5f 50%, #0f2740 100%)',
          boxShadow: '0 24px 60px rgba(15,39,64,0.3)',
        }}
      >
        {/* Background decoration */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(rgba(196,135,58,0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        />

        {/* ── MOBILE COMPACT BAR (< sm) ── */}
        <div className="sm:hidden flex items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[var(--color-amber)] animate-pulse flex-shrink-0" />
            <h1 className="font-heading text-[17px] text-white leading-tight truncate">{t('Community Board')}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={requestViewerLocation}
              disabled={locationLoading}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-white/80 border border-white/15 bg-white/10 transition active:scale-95"
              title={t('Use My Location')}
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowNewPost(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition"
              style={{ background: 'var(--color-amber)', boxShadow: '0 3px 12px rgba(196,135,58,0.4)' }}
            >
              <Plus className="w-3 h-3" /> {t('Flare')}
            </button>
          </div>
        </div>

        {/* Stats strip — ultra-compact on mobile */}
        <div className="sm:hidden flex gap-2 px-4 pb-3">
          {[
            { label: t('Flares'), value: posts.length },
            { label: t('Trusted'), value: `${trustedPercent}%` },
            { label: t('Dist'), value: avgDistance ? `${avgDistance}km` : '—' },
            { label: t('Skills'), value: skills.length },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex-1 rounded-lg px-2 py-1.5 text-center"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="font-heading text-[14px] text-white leading-none">{value}</div>
              <div className="font-body text-[9px] text-white/50 mt-0.5 leading-none">{label}</div>
            </div>
          ))}
        </div>

        {/* ── DESKTOP FULL LAYOUT (≥ sm) ── */}
        <div className="hidden sm:block px-8 py-10">
          <div className="relative flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ background: 'rgba(196,135,58,0.2)', color: 'var(--color-amber)', border: '1px solid rgba(196,135,58,0.3)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-amber)] animate-pulse" />
                {t('Live Community')}
              </div>
              <h1 className="font-heading text-4xl text-white leading-tight mb-2">{t('Community Board')}</h1>
              <p className="font-body text-white/60 text-[15px] leading-relaxed max-w-lg">
                {t('Discover local flares and skill listings — all in one place. Ranked by trust and proximity.')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:flex-shrink-0">
              <button
                onClick={requestViewerLocation}
                disabled={locationLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold font-body transition-all"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <Crosshair className="w-4 h-4" />
                {locationLoading ? t('Locating...') : viewerLocation ? t('Location Active') : t('Use My Location')}
              </button>
              <button
                onClick={() => setShowNewPost(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold font-body text-white transition-all hover:opacity-90"
                style={{ background: 'var(--color-amber)', boxShadow: '0 4px 16px rgba(196,135,58,0.4)' }}
              >
                <Plus className="w-4 h-4" /> {t('Drop a Flare')}
              </button>
            </div>
          </div>
          {/* Stats strip */}
          <div className="relative mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t('Active Flares'), value: posts.length },
              { label: t('Trusted Authors'), value: `${trustedPercent}%` },
              { label: t('Avg Distance'), value: avgDistance ? `${avgDistance} km` : '—' },
              { label: t('Skills Listed'), value: skills.length },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-2xl px-4 py-3 text-center"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="font-heading text-2xl text-white">{value}</div>
                <div className="font-body text-xs text-white/50 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tab switcher ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 rounded-2xl w-full sm:w-fit overflow-x-auto scrollbar-none" style={{ background: 'var(--color-parchment-dark)', border: '1px solid var(--color-border)' }}>
        <button
          onClick={() => setActiveTab('board')}
          className={`flex flex-1 sm:flex-none justify-center items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold font-body transition-all ${activeTab === 'board' ? 'bg-white text-navy shadow-sm' : 'text-[var(--color-text-muted)] hover:text-navy'}`}
        >
          <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {t('City Flares')}
          {posts.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--color-amber)' }}>
              {posts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex flex-1 sm:flex-none justify-center items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold font-body transition-all ${activeTab === 'skills' ? 'bg-white text-navy shadow-sm' : 'text-[var(--color-text-muted)] hover:text-navy'}`}
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {t('Browse Skills')}
          {skills.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-[var(--color-text-muted)]" style={{ background: 'var(--color-parchment)' }}>
              {filteredSkills.length}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  CITY FLARES TAB                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'board' && (
        <div className="space-y-6">
          {/* Map + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          {/* Mobile toolbar: map button + type filter chips */}
            <div className="lg:hidden space-y-2">
              <div className="flex gap-2">
                <button onClick={() => setShowMapModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[var(--color-border)] text-navy font-semibold text-xs shadow-sm flex-shrink-0">
                  <MapPin className="w-3.5 h-3.5" /> {t('Signal Map')}
                </button>
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                  {[{ label: 'All', value: 'all' }, ...BOARD_POST_TYPES.map(t => ({ label: t.label, value: t.value }))].map((f) => (
                    <button
                      key={f.value}
                      className={`flex-shrink-0 px-2.5 py-1.5 rounded-full text-[10px] font-semibold border transition ${
                        (f.value === 'all' ? rankedPosts.length === posts.length : false)
                          ? 'bg-navy text-white border-navy'
                          : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Map / Feed panel */}
            <section className="sc-card overflow-hidden hidden lg:flex flex-col">
              <div className="p-5 border-b border-[var(--color-border)] flex flex-wrap justify-between items-center gap-4" style={{ background: 'rgba(255,255,255,0.5)' }}>
                <div>
                  <h2 className="font-heading text-lg text-navy">{t('Local Signal Map')}</h2>
                  <p className="font-body text-[13px] text-[var(--color-text-secondary)]">
                    {t('Ranked by live relationship signals & distance.')}
                  </p>
                </div>
                <div className="flex bg-parchment p-1 rounded-xl border border-[var(--color-border)]">
                  {(['map', 'feed'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setViewMode(m)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-body transition-all capitalize ${viewMode === m ? 'bg-white text-navy shadow-sm' : 'text-[var(--color-text-muted)] hover:text-navy'}`}
                    >
                      {m === 'map' ? t('Map View') : t('Feed Only')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col bg-white">
                {viewMode === 'map' ? (
                  <div className="relative w-full h-[360px] rounded-2xl border border-[var(--color-border)] overflow-hidden flex-1 shrink-0 bg-[radial-gradient(circle_at_20%_20%,#eef2ff_0%,#f8fafc_45%,#e2e8f0_100%)]">
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(var(--color-navy) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                    {mapPoints.map((point) => {
                      const typeStyle = BOARD_POST_TYPES.find((t) => t.value === point.type) ?? BOARD_POST_TYPES[0];
                      const sz = 10 + Math.round(point.score.total / 18);
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
                          <span className="absolute -inset-2 rounded-full blur-md opacity-40" style={{ backgroundColor: typeStyle.color }} />
                          <span className="relative block rounded-full border-2 border-white shadow-lg" style={{ width: `${sz}px`, height: `${sz}px`, backgroundColor: typeStyle.color }} />
                        </button>
                      );
                    })}
                    {activePoint && (
                      <div className="absolute left-4 right-4 bottom-4 p-3 rounded-xl bg-white/95 border border-[var(--color-border)] shadow-lg backdrop-blur-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-navy truncate">{activePoint.title}</div>
                            <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                              {t('Score')} {Math.round(activePoint.score.total)}/100{activePoint.distance_km !== null ? ` · ${activePoint.distance_km.toFixed(1)} km` : ''}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[var(--color-amber)] text-white">
                            {BOARD_POST_TYPES.find((t) => t.value === activePoint.type)?.label}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {activePoint.reasons.map((r) => (
                            <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">{r}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-[360px] rounded-2xl border border-dashed border-[var(--color-border)] bg-gray-50 flex items-center justify-center flex-col shrink-0">
                    <MapPin className="w-8 h-8 text-[var(--color-text-muted)] mb-3" />
                    <span className="text-sm font-semibold text-navy font-body">{t('Feed mode active')}</span>
                    <span className="text-xs text-[var(--color-text-secondary)] font-body mt-1">{t('Switch to Map View to inspect geo-ranked flares.')}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Right sidebar: stats + smart matches */}
            <div className="flex flex-col gap-6">
              <section className="sc-card">
                <div className="p-4 border-b border-[var(--color-border)]" style={{ background: 'rgba(255,255,255,0.5)' }}>
                  <h2 className="font-heading text-base text-navy">{t('Board Signals')}</h2>
                  <p className="font-body text-xs text-[var(--color-text-secondary)]">{t('Live metrics & trust.')}</p>
                </div>
                <div className="p-3 sm:p-4 grid grid-cols-4 sm:grid-cols-2 gap-2 sm:gap-3">
                  {[
                    { label: t('Active Flares'), value: posts.length },
                    { label: t('Trusted Authors'), value: `${trustedPercent}%` },
                    { label: t('Avg Distance'), value: avgDistance ? `${avgDistance}km` : '—' },
                    { label: t('Open Bounties'), value: posts.filter((p) => p.type === 'bounty').length },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-parchment p-2 sm:p-3 rounded-lg sm:rounded-xl border border-[var(--color-border)] text-center sm:text-left">
                      <strong className="block font-heading text-lg sm:text-xl text-navy">{value}</strong>
                      <span className="font-body text-[9px] sm:text-xs text-[var(--color-text-secondary)] leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="sc-card flex-1">
                <div className="p-4 border-b border-[var(--color-border)]" style={{ background: 'rgba(255,255,255,0.5)' }}>
                  <h2 className="font-heading text-base text-navy">{t('Smart Matches')}</h2>
                  <p className="font-body text-xs text-[var(--color-text-secondary)]">{t('Relationship-ranked opportunities.')}</p>
                </div>
                <div className="p-4 space-y-3">
                  {smartMatches.length === 0 ? (
                    <p className="text-xs text-[var(--color-text-secondary)] font-body py-4">{t('No matches yet. Add location & skills to unlock ranking.')}</p>
                  ) : (
                    smartMatches.map((post) => (
                      <div key={post.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-[var(--color-border)] shadow-sm">
                        <div className="min-w-0">
                          <strong className="block text-sm font-semibold text-navy font-body mb-0.5 truncate">{post.title}</strong>
                          <span className="text-[11px] text-[var(--color-text-secondary)] font-body">{post.reasons[0] ?? t('Relationship signal detected')}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-green-50 text-green-700 flex-shrink-0 ml-2">{Math.round(post.score.total)}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Community feed */}
          <section className="sc-card overflow-hidden">
            <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between flex-wrap gap-4" style={{ background: 'rgba(244,240,232,0.5)' }}>
              <div>
                <h2 className="font-heading text-lg text-navy">{t('Community Feed')}</h2>
                <p className="font-body text-[13px] text-[var(--color-text-secondary)]">{t('Sorted by relationship score & distance.')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[t('Relationship First'), t('Distance Aware')].map((label) => (
                  <span key={label} className="px-3 py-1 rounded-full border border-[var(--color-border)] bg-white text-xs font-semibold text-navy font-body shadow-sm">{label}</span>
                ))}
              </div>
            </div>
            <div className="p-5">
              {boardLoading ? (
                <div className="py-12 text-center text-[var(--color-text-muted)] font-body text-sm flex flex-col items-center">
                  <span className="w-6 h-6 border-2 border-[var(--color-amber)] border-t-transparent rounded-full animate-spin mb-3" />
                  {t('Loading flares...')}
                </div>
              ) : rankedPosts.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-[var(--color-border)] rounded-2xl bg-gray-50">
                  <Search className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-3" />
                  <div className="font-heading text-lg text-navy mb-1">{t('No active flares yet')}</div>
                  <p className="font-body text-sm text-[var(--color-text-secondary)]">{t('Be the first to drop a flare and start the local network.')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rankedPosts.map((post) => {
                    const typeInfo = BOARD_POST_TYPES.find((t) => t.value === post.type) ?? BOARD_POST_TYPES[0];
                    const isTrusted = (post.author?.trust_tier ?? 0) >= 3;
                    const isExpiring = isExpiringSoon(post.expires_at);
                    const isOwn = user?.id === post.author_id;
                    const ring = (post.author?.trust_tier ?? 0) === 4 ? 'ring-[var(--color-amber)]'
                      : (post.author?.trust_tier ?? 0) === 3 ? 'ring-[var(--color-plum)]'
                      : (post.author?.trust_tier ?? 0) === 2 ? 'ring-[var(--color-forest)]'
                      : 'ring-gray-200';
                    return (
                      <article
                        key={post.id}
                        className={`p-5 rounded-2xl border transition-all ${isTrusted ? 'border-[#C4873A]/30 bg-[#FFF3E0]/20 shadow-sm' : 'border-[var(--color-border)] bg-white hover:border-[var(--color-amber)]'}`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className={`w-11 h-11 flex-shrink-0 ring-2 ring-offset-2 ${ring}`}>
                              <AvatarImage src={post.author?.avatar_url ?? undefined} />
                              <AvatarFallback style={{ background: 'var(--color-navy)', color: 'white' }}>{post.author?.first_name?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <strong className="block text-sm font-bold text-navy font-body truncate">{post.author?.first_name} {post.author?.last_name}</strong>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-body text-[var(--color-text-secondary)] mt-0.5">
                                {post.neighborhood && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{post.neighborhood}</span>}
                                <span>{timeAgo(post.created_at, t)}</span>
                              </div>
                            </div>
                          </div>
                          {isTrusted && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-amber)] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm flex-shrink-0">
                              <ShieldCheck className="w-3 h-3" /> Tier {post.author?.trust_tier}
                            </div>
                          )}
                        </div>
                        <h3 className="font-heading text-lg text-navy mb-2 line-clamp-1">{post.title}</h3>
                        <p className="font-body text-sm leading-relaxed text-[var(--color-text-secondary)] line-clamp-3 mb-4 h-16">{post.content}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: typeInfo.bg, color: typeInfo.color }}>{typeInfo.label}</span>
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider"><Users className="w-3 h-3" /> {Math.round(post.score.total)} Match</span>
                          {post.distance_km !== null && <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">{post.distance_km.toFixed(1)}km</span>}
                          {isExpiring && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider"><AlertCircle className="w-3 h-3" /> Expiring</span>}
                        </div>
                        <div className="mb-4 flex flex-wrap gap-1.5">
                          {post.reasons.map((r) => <span key={r} className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]">{r}</span>)}
                        </div>
                        <div className="flex items-center gap-2 pt-4 border-t border-[var(--color-border)]">
                          {isOwn ? (
                            <button onClick={() => handleDelete(post.id)} className="w-full py-2 btn-outline-navy !text-xs">Remove Flare</button>
                          ) : (
                            <>
                              <button
                                className={`flex-1 py-2 shadow-sm !text-xs ${post.type === 'bounty' ? 'btn-navy' : 'btn-amber'}`}
                                onClick={() => { void trackSignal(post.author_id, 'board_connect_click'); toast.info('Connection request logged'); }}
                              >
                                {post.type === 'offering' ? t('Book Session') : post.type === 'bounty' ? t('Claim Bounty') : t('Connect')}
                              </button>
                              <button
                                className="flex-1 py-2 btn-outline-navy !text-xs font-semibold"
                                onClick={() => { void trackSignal(post.author_id, 'board_profile_view'); toast.info('Profile signal logged'); }}
                              >
                                {t('View Profile')}
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
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  BROWSE SKILLS TAB                                                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'skills' && (
        <div className="space-y-5">
          {/* Search */}
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={t("What do you want to learn? Try 'piano', 'Python', 'cooking'…")}
          />

          {/* Category chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setShowFreeOnly(!showFreeOnly)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold font-body transition-all ${showFreeOnly ? 'text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
              style={showFreeOnly ? { background: 'var(--color-forest)' } : {}}
            >
              <Gift className="w-3.5 h-3.5" /> {t('Free')}
            </button>
            <button
              onClick={() => setShowGroupsOnly(!showGroupsOnly)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold font-body transition-all ${showGroupsOnly ? 'text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
              style={showGroupsOnly ? { background: 'var(--color-plum)' } : {}}
            >
              <Users className="w-3.5 h-3.5" /> {t('Groups')}
            </button>
            <div className="w-px h-5 bg-[var(--color-border)] flex-shrink-0" />
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold font-body transition-all ${selectedCategory === 'all' ? 'text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
              style={selectedCategory === 'all' ? { background: 'var(--color-navy)' } : {}}
            >
              {t('All Skills')}
            </button>
            {categoriesWithCounts.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold font-body transition-all ${selectedCategory === cat.id ? 'text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
                style={selectedCategory === cat.id ? { background: 'var(--color-amber)' } : {}}
              >
                <span>{cat.emoji}</span>
                {cat.label}
                {cat.count > 0 && <span className="text-[10px] opacity-60">{cat.count}</span>}
              </button>
            ))}
          </div>

          {/* Main grid + sidebar */}
          <div className="flex gap-5">
            {/* Filter Sidebar */}
            <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-56 flex-shrink-0 space-y-5`}>
              <div className="sc-card p-4 space-y-5">
                {/* Region */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] mb-2.5">{t('Region')}</div>
                  <div className="space-y-1.5">
                    {[['all', 'All Morocco'] as const, ...MOROCCO_REGIONS.map((r) => [r, r] as const)].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setSelectedNeighborhood(val)}
                        className={`flex items-center gap-2 w-full text-left px-2.5 py-2 rounded-lg text-sm font-body transition-all ${selectedNeighborhood === val ? 'font-semibold' : 'text-[var(--color-text-secondary)] hover:bg-parchment'}`}
                        style={selectedNeighborhood === val ? { color: 'var(--color-amber)', background: '#FFF3E0' } : {}}
                      >
                        {val === 'all' && <MapPin className="w-3.5 h-3.5" />}
                        {val === 'all' ? t('All Morocco') : label}
                      </button>
                    ))}
                  </div>
                </div>
                <hr className="divider-warm" />
                {/* Format */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] mb-2.5">Format</div>
                  <div className="space-y-1.5">
                    {(['all', 'online', 'in-person', 'both'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setSelectedFormat(f)}
                        className={`flex items-center gap-2 w-full text-left px-2.5 py-2 rounded-lg text-sm font-body transition-all ${selectedFormat === f ? 'font-semibold' : 'text-[var(--color-text-secondary)] hover:bg-parchment'}`}
                        style={selectedFormat === f ? { color: 'var(--color-amber)', background: '#FFF3E0' } : {}}
                      >
                        {f === 'online' && <Wifi className="w-3.5 h-3.5" />}
                        {f === 'in-person' && <MapPin className="w-3.5 h-3.5" />}
                        {f === 'both' && <Users className="w-3.5 h-3.5" />}
                        {f === 'all' ? 'All formats' : FORMAT_LABELS[f]}
                      </button>
                    ))}
                  </div>
                </div>
                {availableLanguages.length > 0 && (
                  <>
                    <hr className="divider-warm" />
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] mb-2.5">Language</div>
                      <div className="space-y-1.5">
                        <button
                          onClick={() => setSelectedLanguage('all')}
                          className={`flex items-center gap-2 w-full text-left px-2.5 py-2 rounded-lg text-sm font-body transition-all ${selectedLanguage === 'all' ? 'font-semibold' : 'text-[var(--color-text-secondary)] hover:bg-parchment'}`}
                          style={selectedLanguage === 'all' ? { color: 'var(--color-amber)', background: '#FFF3E0' } : {}}
                        >
                          <Globe className="w-3.5 h-3.5" /> All languages
                        </button>
                        {availableLanguages.map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setSelectedLanguage(lang)}
                            className={`flex items-center gap-2 w-full text-left px-2.5 py-2 rounded-lg text-sm font-body transition-all ${selectedLanguage === lang ? 'font-semibold' : 'text-[var(--color-text-secondary)] hover:bg-parchment'}`}
                            style={selectedLanguage === lang ? { color: 'var(--color-amber)', background: '#FFF3E0' } : {}}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <hr className="divider-warm" />
                {/* Price */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] mb-2.5">Max price</div>
                  <div className="text-2xl font-bold font-heading mb-2" style={{ color: 'var(--color-amber)' }}>{maxPrice} MAD</div>
                  <input type="range" min={50} max={500} step={25} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-amber-sc" />
                  <div className="flex justify-between text-[10px] font-body text-[var(--color-text-muted)] mt-1"><span>50 MAD</span><span>500 MAD</span></div>
                </div>
                {hasActiveFilters && (
                  <button onClick={resetFilters} className="w-full text-sm font-semibold font-body py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-parchment transition-colors">
                    Reset filters
                  </button>
                )}
              </div>
            </aside>

            {/* Skill grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <p className="font-body text-sm text-[var(--color-text-secondary)]">
                  {filteredSkills.length} skill{filteredSkills.length !== 1 ? 's' : ''} available
                </p>
                <button
                  className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[var(--color-border)] text-sm font-semibold font-body text-navy"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </button>
              </div>

              {skillsLoading ? (
                <CardSkeletonGrid count={6} variant="skill" />
              ) : skillsError ? (
                <div className="sc-card p-12 text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-400" />
                  <div className="font-heading text-xl text-navy mb-2">Failed to load skills</div>
                  <p className="font-body text-[var(--color-text-secondary)] text-sm mb-4">{skillsError?.message}</p>
                  <button onClick={refetchSkills} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-amber)] hover:underline">
                    <RefreshCw className="w-3.5 h-3.5" /> Try again
                  </button>
                </div>
              ) : filteredSkills.length === 0 ? (
                <div className="sc-card p-12 text-center">
                  <div className="font-heading text-xl text-navy mb-2">{skills.length === 0 ? 'No skills found yet' : 'No skills match your filters'}</div>
                  <p className="font-body text-[var(--color-text-secondary)] text-sm">{skills.length === 0 ? 'Be the first to teach something!' : 'Try adjusting your search or filters.'}</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredSkills.map((skill) => (
                    <Link key={skill.id} to={`/app/skill/${skill.slug}`} className="skill-card group block">
                      <div className={`h-28 relative flex items-end p-3 overflow-hidden ${!skill.cover_image_url ? `bg-gradient-to-br ${skill.cover_gradient}` : 'bg-gray-900'}`}>
                        {skill.cover_image_url && <img src={skill.cover_image_url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-90" />}
                        <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 font-body" style={{ color: 'var(--color-navy)' }}>
                          {skill.format === 'both' ? '🌐 Both' : skill.format === 'online' ? '💻 Online' : '📍 In-person'}
                        </span>
                        {skill.is_group && (
                          <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 font-body flex items-center gap-1" style={{ color: 'var(--color-plum)' }}>
                            <Users className="w-3 h-3" />
                            {skill.max_headcount ? `${skill.current_headcount || 0}/${skill.max_headcount}` : 'Group'}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8 ring-2 ring-white/60">
                            <AvatarImage src={skill.teacher.avatar} />
                            <AvatarFallback style={{ background: 'var(--color-amber)', color: 'white', fontSize: '11px' }}>{skill.teacher.firstName[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-[11px] font-semibold font-body text-white drop-shadow">{skill.teacher.firstName} {skill.teacher.lastName}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="font-semibold font-body text-sm text-navy mb-1 group-hover:text-amber-sc transition-colors">{skill.title}</div>
                        <p className="text-[11px] font-body leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{skill.description.substring(0, 80)}…</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {skill.tags.slice(0, 2).map((tag: string) => (
                            <span key={tag} className="text-[10px] font-body px-2 py-0.5 rounded-full" style={{ background: '#F4F0E8', color: 'var(--color-text-secondary)' }}>{tag}</span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-sc text-amber-sc" />
                            <span className="text-xs font-bold text-navy">{skill.avg_rating}</span>
                            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>({skill.reviews_count})</span>
                          </div>
                          <div className="font-bold font-body text-sm" style={{ color: skill.price_per_hour === 0 || skill.is_free ? 'var(--color-forest)' : 'var(--color-amber)' }}>
                            {skill.price_per_hour === 0 || skill.is_free ? 'Free' : <>{skill.price_per_hour} {skill.currency}<span className="text-[10px] font-normal">/hr</span></>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── New Flare modal ───────────────────────────────────────────────── */}
      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="sc-card w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl text-navy">Drop a Flare</h2>
              <button onClick={() => setShowNewPost(false)} className="p-1.5 rounded-lg hover:bg-parchment text-[var(--color-text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {BOARD_POST_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setNewPost((p) => ({ ...p, type: t.value }))}
                  className="px-3 py-1.5 rounded-full text-xs font-body font-semibold transition-all"
                  style={{ background: newPost.type === t.value ? t.color : 'transparent', color: newPost.type === t.value ? 'white' : 'var(--color-text-secondary)', border: `1px solid ${newPost.type === t.value ? t.color : 'var(--color-border)'}` }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <input value={newPost.title} onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="input-sc" />
            <textarea value={newPost.content} onChange={(e) => setNewPost((p) => ({ ...p, content: e.target.value }))} placeholder="What do you need or have to offer?" className="input-sc resize-none" rows={4} />
            <input value={newPost.neighborhood} onChange={(e) => setNewPost((p) => ({ ...p, neighborhood: e.target.value }))} placeholder="City or area (optional)" className="input-sc" />
            <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-parchment px-3 py-2">
              <span className="text-xs text-[var(--color-text-secondary)] font-body">{newPost.location_lat !== null ? '📍 Location attached' : 'No location attached'}</span>
              <button onClick={attachPostLocation} disabled={locationLoading} className="btn-outline-navy py-1.5 px-3 !text-xs">{locationLoading ? 'Locating...' : 'Attach Location'}</button>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowNewPost(false)} className="btn-outline-navy py-2 px-4 shadow-none">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || !newPost.title.trim() || !newPost.content.trim()} className="btn-amber py-2 px-6 disabled:opacity-50">
                {submitting ? 'Dropping...' : 'Drop Flare'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 lg:hidden">
          <div className="sc-card w-full max-w-lg p-0 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 h-[80vh]">
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.9)' }}>
              <div>
                <h2 className="font-heading text-lg text-navy">Local Signal Map</h2>
              </div>
              <button onClick={() => setShowMapModal(false)} className="p-1.5 rounded-lg hover:bg-parchment text-[var(--color-text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative flex-1 w-full bg-[radial-gradient(circle_at_20%_20%,#eef2ff_0%,#f8fafc_45%,#e2e8f0_100%)]">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(var(--color-navy) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
              {mapPoints.map((point) => {
                const typeStyle = BOARD_POST_TYPES.find((t) => t.value === point.type) ?? BOARD_POST_TYPES[0];
                const sz = 10 + Math.round(point.score.total / 18);
                return (
                  <button
                    key={point.id}
                    type="button"
                    onClick={() => setActivePointId(point.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none"
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  >
                    <span className="absolute -inset-2 rounded-full blur-md opacity-40" style={{ backgroundColor: typeStyle.color }} />
                    <span className="relative block rounded-full border-2 border-white shadow-lg" style={{ width: `${sz}px`, height: `${sz}px`, backgroundColor: typeStyle.color }} />
                  </button>
                );
              })}
              {activePoint && (
                <div className="absolute left-4 right-4 bottom-4 p-3 rounded-xl bg-white/95 border border-[var(--color-border)] shadow-lg backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-navy truncate">{activePoint.title}</div>
                      <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                        Score {Math.round(activePoint.score.total)}/100{activePoint.distance_km !== null ? ` · ${activePoint.distance_km.toFixed(1)} km` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
