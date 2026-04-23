import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Shield, Users, BookOpen, Clock, Check, X, Star,
  ChevronDown, ChevronUp, BadgeCheck, AlertCircle,
  Loader2, ImageOff, FileText,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────────────────

interface MemberRow {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  trust_tier: number;
  trust_score: number;
  what_i_teach: string[];
  created_at: string;
}

interface OcrData {
  name:        string | null;
  dob:         string | null;
  id_number:   string | null;
  expiry:      string | null;
  nationality: string | null;
  mrz_line1:   string | null;
  mrz_line2:   string | null;
  mrz_line3:   string | null;
}

interface VerificationRequest {
  id:                  string;
  user_id:             string;
  document_type:       'cin' | 'passport' | 'license';
  front_path:          string;
  back_path:           string | null;
  ocr_data:            OcrData | null;
  mrz_valid:           boolean | null;
  quality_score_front: number | null;
  quality_score_back:  number | null;
  status:              string;
  created_at:          string;
  // joined client-side
  profile?: { first_name: string; last_name: string; avatar_url: string | null };
}

// ── VerificationCard ─────────────────────────────────────────────────────────

interface CardProps {
  request:    VerificationRequest;
  adminId:    string;
  onApproved: (id: string) => void;
  onRejected: (id: string) => void;
}

function VerificationCard({ request, adminId, onApproved, onRejected }: CardProps) {
  const [expanded,      setExpanded]      = useState(false);
  const [frontUrl,      setFrontUrl]      = useState<string | null>(null);
  const [backUrl,       setBackUrl]       = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const [rejectMode,    setRejectMode]    = useState(false);
  const [notes,         setNotes]         = useState('');
  const [acting,        setActing]        = useState(false);

  const { profile, ocr_data: ocr, mrz_valid } = request;
  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : '—';
  const docLabel = { cin: 'CIN', passport: 'Passport', license: "Driver's license" }[request.document_type];

  // Generate signed URLs when card expands
  const handleExpand = async () => {
    setExpanded(e => !e);
    if (expanded || frontUrl) return; // already loaded

    setLoadingImages(true);
    const [frontRes, backRes] = await Promise.all([
      supabase.storage.from('id-documents').createSignedUrl(request.front_path, 3600),
      request.back_path
        ? supabase.storage.from('id-documents').createSignedUrl(request.back_path, 3600)
        : Promise.resolve({ data: null }),
    ]);
    setFrontUrl(frontRes.data?.signedUrl ?? null);
    setBackUrl((backRes as { data: { signedUrl: string } | null }).data?.signedUrl ?? null);
    setLoadingImages(false);
  };

  const handleApprove = async () => {
    setActing(true);
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ id_card_status: 'approved', id_verified: true, trust_tier: 2 })
      .eq('id', request.user_id);

    const { error: reqErr } = await supabase
      .from('id_verification_requests')
      .update({ status: 'approved', reviewer_id: adminId, reviewed_at: new Date().toISOString() })
      .eq('id', request.id);

    if (profileErr || reqErr) {
      toast.error('Failed to approve — check console');
      setActing(false);
      return;
    }
    toast.success(`${displayName} verified ✓`);
    onApproved(request.id);
  };

  const handleReject = async () => {
    setActing(true);
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ id_card_status: 'rejected' })
      .eq('id', request.user_id);

    const { error: reqErr } = await supabase
      .from('id_verification_requests')
      .update({
        status:         'rejected',
        reviewer_id:    adminId,
        reviewer_notes: notes.trim() || null,
        reviewed_at:    new Date().toISOString(),
      })
      .eq('id', request.id);

    if (profileErr || reqErr) {
      toast.error('Failed to reject — check console');
      setActing(false);
      return;
    }
    toast.success('Verification rejected');
    onRejected(request.id);
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
      {/* Card header — always visible */}
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '11px' }}>
            {profile?.first_name?.[0] ?? '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold font-body text-sm text-navy">{displayName}</p>
          <p className="text-[11px] font-body" style={{ color: 'var(--color-text-muted)' }}>
            {docLabel} · Submitted {new Date(request.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        {/* MRZ quick badge */}
        {mrz_valid === true  && <span className="text-[10px] font-semibold font-body px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">MRZ ✓</span>}
        {mrz_valid === false && <span className="text-[10px] font-semibold font-body px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 flex-shrink-0">MRZ ✗</span>}
        {expanded ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                  : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />}
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-[var(--color-border)] px-4 pb-4 pt-3 space-y-4 bg-white">

          {/* Images */}
          <div className={`grid gap-3 ${request.back_path ? 'grid-cols-2' : 'grid-cols-1 max-w-xs'}`}>
            {/* Front */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider font-body" style={{ color: 'var(--color-text-muted)' }}>
                Front {request.quality_score_front !== null && <span className="normal-case font-normal">· Q: {request.quality_score_front}/100</span>}
              </p>
              <ImageSlot url={frontUrl} loading={loadingImages} path={request.front_path} />
            </div>
            {/* Back */}
            {request.back_path && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider font-body" style={{ color: 'var(--color-text-muted)' }}>
                  Back {request.quality_score_back !== null && <span className="normal-case font-normal">· Q: {request.quality_score_back}/100</span>}
                </p>
                <ImageSlot url={backUrl} loading={loadingImages} path={request.back_path} />
              </div>
            )}
          </div>

          {/* OCR Data */}
          {ocr ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider font-body mb-2" style={{ color: 'var(--color-text-muted)' }}>
                OCR Extracted
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                {[
                  { label: 'Name',        value: ocr.name },
                  { label: 'DOB',         value: ocr.dob },
                  { label: 'ID number',   value: ocr.id_number },
                  { label: 'Expiry',      value: ocr.expiry },
                  { label: 'Nationality', value: ocr.nationality },
                  { label: 'MRZ',         value: mrz_valid === null ? 'No MRZ' : mrz_valid ? 'Valid ✓' : 'Invalid ✗' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <span className="text-[10px] font-body" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                    <p className={`text-xs font-semibold font-body ${
                      label === 'MRZ'
                        ? mrz_valid === true  ? 'text-emerald-700'
                        : mrz_valid === false ? 'text-red-600'
                        : 'text-slate-400'
                        : 'text-navy'
                    }`}>
                      {value ?? <span className="text-slate-400 font-normal">—</span>}
                    </p>
                  </div>
                ))}
              </div>

              {/* MRZ lines (collapsed by default, shown for reference) */}
              {(ocr.mrz_line1 || ocr.mrz_line2) && (
                <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 font-mono text-[10px] text-slate-500 space-y-0.5 overflow-x-auto">
                  {ocr.mrz_line1 && <p>{ocr.mrz_line1}</p>}
                  {ocr.mrz_line2 && <p>{ocr.mrz_line2}</p>}
                  {ocr.mrz_line3 && <p>{ocr.mrz_line3}</p>}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>
              <AlertCircle className="w-3.5 h-3.5" />
              OCR data unavailable — review images manually.
            </div>
          )}

          {/* Actions */}
          {!rejectMode ? (
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleApprove}
                disabled={acting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold font-body text-white disabled:opacity-50 transition-opacity"
                style={{ background: 'var(--color-forest)' }}
              >
                {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                Approve
              </button>
              <button
                onClick={() => setRejectMode(true)}
                disabled={acting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold font-body disabled:opacity-50"
                style={{ background: '#FEE2E2', color: '#DC2626' }}
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Reason for rejection (optional — shown to the user)"
                rows={2}
                className="input-sc resize-none text-sm w-full"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={acting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold font-body text-white disabled:opacity-50"
                  style={{ background: '#DC2626' }}
                >
                  {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  Confirm rejection
                </button>
                <button
                  onClick={() => { setRejectMode(false); setNotes(''); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold font-body border border-[var(--color-border)] hover:bg-slate-50"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── ImageSlot ─────────────────────────────────────────────────────────────────

function ImageSlot({ url, loading, path }: { url: string | null; loading: boolean; path: string }) {
  const isPdf = path.toLowerCase().endsWith('.pdf');

  if (loading) {
    return (
      <div className="w-full h-32 rounded-xl bg-slate-100 flex items-center justify-center animate-pulse">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
      </div>
    );
  }
  if (isPdf) {
    return (
      <div className="w-full h-32 rounded-xl bg-slate-100 flex flex-col items-center justify-center gap-1.5 border border-[var(--color-border)]">
        <FileText className="w-6 h-6 text-slate-400" />
        <span className="text-[10px] font-body text-slate-400">PDF document</span>
      </div>
    );
  }
  if (!url) {
    return (
      <div className="w-full h-32 rounded-xl bg-slate-100 flex flex-col items-center justify-center gap-1.5">
        <ImageOff className="w-5 h-5 text-slate-400" />
        <span className="text-[10px] font-body text-slate-400">Image unavailable</span>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt="ID document"
      className="w-full h-32 object-cover rounded-xl border border-[var(--color-border)]"
    />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Admin() {
  const { user } = useAuth();
  const [members,      setMembers]      = useState<MemberRow[]>([]);
  const [requests,     setRequests]     = useState<VerificationRequest[]>([]);
  const [skillCount,   setSkillCount]   = useState(0);
  const [isLoading,    setIsLoading]    = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') { setIsLoading(false); return; }

    async function fetchAdminData() {
      const [membersRes, skillsRes, requestsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, trust_tier, trust_score, what_i_teach, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('skills')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('id_verification_requests')
          .select('id, user_id, document_type, front_path, back_path, ocr_data, mrz_valid, quality_score_front, quality_score_back, status, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: true }),
        // Fetch profiles for the pending requests in a second pass (after we know user_ids)
        Promise.resolve(null),
      ]);

      if (membersRes.data) setMembers(membersRes.data as MemberRow[]);
      if (skillsRes.count !== null) setSkillCount(skillsRes.count);

      if (requestsRes.data && requestsRes.data.length > 0) {
        const rawRequests = requestsRes.data as VerificationRequest[];

        // Fetch profiles for each pending user_id
        const userIds = [...new Set(rawRequests.map(r => r.user_id))];
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(
          (profileData ?? []).map(p => [p.id, p as { id: string; first_name: string; last_name: string; avatar_url: string | null }])
        );

        setRequests(rawRequests.map(r => ({ ...r, profile: profileMap.get(r.user_id) })));
      }

      setIsLoading(false);
    }

    fetchAdminData();
  }, [user]);

  if (user?.role !== 'admin') return <Navigate to="/app/discover" replace />;

  const verifiedCount = members.filter(m => m.trust_tier >= 2).length;

  const handleApproved = (requestId: string) =>
    setRequests(prev => prev.filter(r => r.id !== requestId));

  const handleRejected = (requestId: string) =>
    setRequests(prev => prev.filter(r => r.id !== requestId));

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-parchment-dark rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-navy">Admin Dashboard</h1>
        <p className="font-body text-[var(--color-text-secondary)] mt-1 text-sm">Morocco · Live data</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members',        value: members.length,   icon: Users,    color: '#5C3D8F', bg: '#EDE8F7' },
          { label: 'Verified Members',     value: verifiedCount,    icon: Shield,   color: '#2D7A4F', bg: '#E8F5EE' },
          { label: 'Active Skills',        value: skillCount,       icon: BookOpen, color: '#C4873A', bg: '#FFF3E0' },
          { label: 'Pending Verifications',value: requests.length,  icon: Clock,    color: '#1B2A4A', bg: '#EAF0FF' },
        ].map(stat => (
          <div key={stat.label} className="sc-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
                <stat.icon className="w-4.5 h-4.5" style={{ color: stat.color }} />
              </div>
              <div>
                <div className="font-bold font-heading text-xl text-navy">{stat.value}</div>
                <div className="text-[11px] font-body text-[var(--color-text-muted)]">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending ID Verifications */}
      <div className="sc-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4" style={{ color: 'var(--color-amber)' }} />
          <h3 className="font-heading text-navy" style={{ fontSize: '1.05rem' }}>Pending Verifications</h3>
          <span className="ml-1 text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>
            — click a card to review
          </span>
        </div>

        {requests.length > 0 ? (
          <div className="space-y-2">
            {requests.map(r => (
              <VerificationCard
                key={r.id}
                request={r}
                adminId={user!.id}
                onApproved={handleApproved}
                onRejected={handleRejected}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Check className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-forest)' }} />
            <p className="font-body text-sm text-[var(--color-text-secondary)]">All caught up! No pending verifications.</p>
          </div>
        )}
      </div>

      {/* All Members */}
      <div className="sc-card p-5">
        <h3 className="font-heading text-navy mb-4" style={{ fontSize: '1.05rem' }}>All Members</h3>
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-parchment transition-colors">
              <Avatar className="w-9 h-9">
                <AvatarImage src={member.avatar_url ?? undefined} />
                <AvatarFallback style={{ background: 'var(--color-amber)', color: 'white', fontSize: '11px' }}>
                  {member.first_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold font-body text-navy text-sm">
                  {member.first_name} {member.last_name}
                </div>
                <div className="text-[11px] font-body text-[var(--color-text-muted)]">
                  {(member.what_i_teach ?? []).slice(0, 2).join(', ')} · Joined {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {member.trust_score > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-sc text-amber-sc" />
                    <span className="text-xs font-bold font-body text-navy">{member.trust_score}</span>
                  </div>
                )}
                <span
                  className="text-[10px] font-semibold font-body px-2 py-0.5 rounded-full"
                  style={member.trust_tier >= 2
                    ? { background: '#E8F5EE', color: '#2D7A4F' }
                    : { background: '#EDF2FF', color: '#4C6EF5' }}
                >
                  Tier {member.trust_tier}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
