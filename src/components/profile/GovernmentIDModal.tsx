import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Upload, X, FileText, AlertTriangle, Clock, CheckCircle2,
  Camera, ChevronLeft, Loader2, RefreshCw, Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import {
  checkImageQuality, QUALITY_MESSAGES, type QualityFailReason,
  checkIDStructure, ID_STRUCTURE_MESSAGES, type IDFailReason,
} from '@/lib/imageQuality';
import { supabase } from '@/lib/supabase';
import type { User } from '@/contexts/AuthContext';

// ── Types ────────────────────────────────────────────────────────────────────

type DocType = 'cin' | 'passport' | 'license';
type Step    = 'type' | 'front' | 'back' | 'review';

interface SideState {
  file:           File | null;
  preview:        string | null;
  storagePath:    string | null;
  qualityScore:   number | null;
  qualityError:   QualityFailReason | null;
  structureError: IDFailReason | null;
  checking:       boolean;
  uploading:      boolean;
}

interface Props {
  open:        boolean;
  onClose:     () => void;
  userId:      string;
  idCardStatus: User['id_card_status'];
  idVerified:  boolean;
  /** Called after the edge function returns successfully. */
  onSubmitted: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const INITIAL_SIDE: SideState = {
  file: null, preview: null, storagePath: null,
  qualityScore: null, qualityError: null, structureError: null,
  checking: false, uploading: false,
};

const DOC_TYPES: { value: DocType; emoji: string; label: string; desc: string; sides: 1 | 2 }[] = [
  { value: 'cin',      emoji: '🪪', label: 'CIN',               desc: 'Carte Nationale d\'Identité — front & back', sides: 2 },
  { value: 'passport', emoji: '📘', label: 'Passport',           desc: 'Photo page only',                            sides: 1 },
  { value: 'license',  emoji: '🚗', label: 'Driver\'s license',  desc: 'Front & back',                               sides: 2 },
];

const ID_MIME_TYPES   = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'];
const ID_EXTENSIONS   = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'pdf'];

// ── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step, needsBack }: { step: Step; needsBack: boolean }) {
  const steps: Step[] = needsBack ? ['type', 'front', 'back', 'review'] : ['type', 'front', 'review'];
  const activeIdx = steps.indexOf(step);
  const labels = needsBack
    ? ['Type', 'Front', 'Back', 'Submit']
    : ['Type', 'Front', 'Submit'];

  return (
    <div className="flex items-center gap-1 mt-3">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-0.5 flex-1">
            <div
              className="w-full h-1 rounded-full transition-all duration-300"
              style={{ background: i <= activeIdx ? 'var(--color-amber)' : 'var(--color-parchment-dark)' }}
            />
            <span className="text-[9px] font-body font-semibold" style={{ color: i <= activeIdx ? 'var(--color-amber)' : 'var(--color-text-muted)' }}>
              {labels[i]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Quality feedback banner ───────────────────────────────────────────────────

function QualityBanner({
  error, score, structureError,
}: {
  error: QualityFailReason | null;
  score: number | null;
  structureError: IDFailReason | null;
}) {
  if (error) {
    const { title, hint } = QUALITY_MESSAGES[error];
    return (
      <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-700">{title}</p>
          <p className="text-xs text-red-600 mt-0.5">{hint}</p>
        </div>
      </div>
    );
  }
  if (structureError) {
    const { title, hint } = ID_STRUCTURE_MESSAGES[structureError];
    return (
      <div className="flex items-start gap-2.5 rounded-xl bg-orange-50 border border-orange-200 px-3 py-2.5">
        <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-orange-700">{title}</p>
          <p className="text-xs text-orange-600 mt-0.5">{hint}</p>
        </div>
      </div>
    );
  }
  if (score !== null) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span className="text-sm font-semibold text-emerald-700">
          Image looks good — quality score {score}/100
        </span>
      </div>
    );
  }
  return null;
}

// ── Capture panel (shared by front + back steps) ─────────────────────────────

interface CapturePanelProps {
  label:      string;
  side:       SideState;
  userId:     string;
  pathKey:    'id_front' | 'id_back';
  docType:    DocType;
  onUpdated:  (updates: Partial<SideState>) => void;
}

function CapturePanel({ label, side, userId, pathKey, docType, onUpdated }: CapturePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError]   = useState(false);

  const idUpload = useStorageUpload({
    bucket:           'id-documents',
    maxBytes:         5 * 1024 * 1024,
    allowedMimeTypes: ID_MIME_TYPES,
    allowedExtensions: ID_EXTENSIONS,
  });

  // Stop camera stream on unmount or when deactivated
  const stopCamera = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  const startCamera = async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError(true);
    }
  };

  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `snapshot_${pathKey}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      processFile(file);
    }, 'image/jpeg', 0.92);
  };

  const processFile = async (file: File) => {
    // Revoke the previous preview URL before creating a new one
    if (side.preview) URL.revokeObjectURL(side.preview);

    // Show preview immediately
    const isPdf = file.type === 'application/pdf';
    const preview = isPdf ? null : URL.createObjectURL(file);
    onUpdated({
      file, preview,
      qualityError: null, qualityScore: null,
      structureError: null, storagePath: null, checking: true,
    });

    // Stage 1: Quality check (blur, brightness)
    const quality = await checkImageQuality(file);
    if (!quality.pass) {
      onUpdated({ checking: false, qualityError: quality.reason, qualityScore: null });
      return;
    }

    // Stage 2: Structural check — only for CIN images, not PDFs
    if (docType === 'cin' && !isPdf) {
      const structure = await checkIDStructure(file, pathKey === 'id_front' ? 'front' : 'back', 'cin');
      if (!structure.pass) {
        onUpdated({ checking: false, qualityScore: quality.score, structureError: structure.reason ?? 'low_structure' });
        return;
      }
    }

    onUpdated({ checking: false, qualityScore: quality.score, qualityError: null, structureError: null, uploading: true });

    // Stage 3: Upload to storage
    const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${userId}/${pathKey}.${ext}`;
    const url  = await idUpload.upload(file, userId, `${userId}/${pathKey}`, 'ID image saved.');

    if (url) {
      onUpdated({ uploading: false, storagePath: path });
    } else {
      // upload() already shows a toast error
      onUpdated({ uploading: false });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const reset = () => {
    // Revoke the preview blob URL to free memory
    if (side.preview) URL.revokeObjectURL(side.preview);
    onUpdated({ ...INITIAL_SIDE });
    stopCamera();
  };

  const busy = side.checking || side.uploading || idUpload.uploading;

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider font-body" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileInput} />

      {/* Camera view */}
      {cameraActive && (
        <div className="relative rounded-xl overflow-hidden bg-black">
          <video ref={videoRef} className="w-full rounded-xl" playsInline muted />
          <div className="absolute inset-0 border-2 border-dashed border-white/40 rounded-xl pointer-events-none" />
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-3">
            <button onClick={stopCamera} className="px-4 py-2 rounded-full bg-white/20 text-white text-sm font-semibold backdrop-blur-sm">
              Cancel
            </button>
            <button onClick={captureSnapshot} className="px-5 py-2 rounded-full bg-white text-navy text-sm font-semibold">
              Capture
            </button>
          </div>
        </div>
      )}

      {/* Preview or drop zone */}
      {!cameraActive && (
        side.preview ? (
          /* Image preview */
          <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)]">
            <img src={side.preview} alt="ID preview" className="w-full max-h-48 object-cover" />
            {/* Overlay while checking / uploading */}
            {busy && (
              <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-amber)' }} />
                <span className="text-xs font-semibold font-body text-navy">
                  {side.checking ? 'Checking quality…' : 'Uploading…'}
                </span>
              </div>
            )}
            {/* Change button (shown after quality pass) */}
            {!busy && (
              <button
                onClick={reset}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center hover:bg-red-50 transition-colors border border-[var(--color-border)]"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>
        ) : side.file && !side.preview ? (
          /* PDF placeholder */
          <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-slate-50 px-4 py-3">
            <FileText className="w-8 h-8 text-slate-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold font-body text-navy truncate">{side.file.name}</p>
              <p className="text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>
                {(side.file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            {busy && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: 'var(--color-amber)' }} />}
            {!busy && <button onClick={reset}><X className="w-4 h-4 text-slate-400" /></button>}
          </div>
        ) : (
          /* Drop zone */
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-colors"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <Upload className="w-6 h-6" style={{ color: 'var(--color-text-muted)' }} />
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-semibold font-body underline"
                style={{ color: 'var(--color-navy)' }}
              >
                Click to upload
              </button>
              <span className="text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>
                or drag & drop — JPG, PNG, WEBP, PDF · max 5 MB
              </span>
            </div>
          </div>
        )
      )}

      {/* Quality / structure feedback */}
      {!busy && !cameraActive && (side.qualityError || side.structureError || side.qualityScore !== null) && (
        <QualityBanner
          error={side.qualityError}
          score={side.qualityScore}
          structureError={side.structureError}
        />
      )}

      {/* Camera action */}
      {!cameraActive && !side.storagePath && !busy && (
        <div className="flex items-center gap-2">
          {side.qualityError && (
            <button
              onClick={() => { onUpdated({ ...INITIAL_SIDE }); }}
              className="flex items-center gap-1.5 text-xs font-semibold font-body py-1.5 px-3 rounded-lg border border-[var(--color-border)] hover:bg-slate-50 transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <RefreshCw className="w-3 h-3" /> Try again
            </button>
          )}
          {!cameraError && (
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 text-xs font-semibold font-body py-1.5 px-3 rounded-lg border border-[var(--color-border)] hover:bg-slate-50 transition-colors ml-auto"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Camera className="w-3 h-3" /> Use camera
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Review thumbnail — blurred by default, tap to reveal ─────────────────────

function ReviewThumb({
  preview, label, score,
}: {
  preview: string;
  label: string;
  score: number | null;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="space-y-1">
      <p
        className="text-[10px] font-semibold uppercase tracking-wider font-body"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </p>
      <div
        className="relative rounded-xl overflow-hidden border border-[var(--color-border)] cursor-pointer"
        style={{ maxHeight: '140px' }}
        onClick={() => setRevealed(r => !r)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setRevealed(r => !r)}
        aria-label={revealed ? `Hide ${label} ID image` : `Tap to reveal ${label} ID image`}
      >
        <img
          src={preview}
          alt={label}
          className="w-full object-cover transition-all duration-300"
          style={{ filter: revealed ? 'none' : 'blur(12px)', userSelect: 'none' }}
          draggable={false}
        />
        {!revealed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/10">
            <span className="text-2xl">👁️</span>
            <span className="text-[11px] font-semibold text-white drop-shadow font-body">
              Tap to preview
            </span>
          </div>
        )}
      </div>
      {score !== null && (
        <p className="text-[10px] font-body text-center" style={{ color: 'var(--color-text-muted)' }}>
          Quality: {score}/100
        </p>
      )}
    </div>
  );
}

// ── Main modal ───────────────────────────────────────────────────────────────

export default function GovernmentIDModal({ open, onClose, userId, idCardStatus, idVerified, onSubmitted }: Props) {
  const [step,       setStep]       = useState<Step>('type');
  const [docType,    setDocType]    = useState<DocType | null>(null);
  const [front,      setFront]      = useState<SideState>(INITIAL_SIDE);
  const [back,       setBack]       = useState<SideState>(INITIAL_SIDE);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const needsBack = docType !== 'passport';
  const isAlreadyPending  = idCardStatus === 'pending' && !idVerified;
  const isRejected        = idCardStatus === 'rejected';
  const canResubmit       = !isAlreadyPending && !idVerified;

  // Reset when modal opens / closes
  useEffect(() => {
    if (!open) {
      setStep('type'); setDocType(null);
      setFront(INITIAL_SIDE); setBack(INITIAL_SIDE);
      setSubmitting(false); setSubmitError(null);
    }
  }, [open]);

  const updateFront = (updates: Partial<SideState>) => setFront(prev => ({ ...prev, ...updates }));
  const updateBack  = (updates: Partial<SideState>) => setBack(prev => ({ ...prev, ...updates }));

  const selectDocType = (type: DocType) => {
    setDocType(type);
    setFront(INITIAL_SIDE);
    setBack(INITIAL_SIDE);
    setStep('front');
  };

  const goBack = () => {
    if (step === 'front')  { setStep('type');  return; }
    if (step === 'back')   { setStep('front'); return; }
    if (step === 'review') { setStep(needsBack ? 'back' : 'front'); return; }
  };

  const goNextFromFront = () => {
    if (needsBack) setStep('back');
    else setStep('review');
  };

  const goNextFromBack = () => setStep('review');

  const handleSubmit = async () => {
    if (!docType || !front.storagePath) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const { error } = await supabase.functions.invoke('verify-id', {
        body: {
          userId,
          documentType:      docType,
          frontPath:         front.storagePath,
          backPath:          back.storagePath ?? undefined,
          qualityScoreFront: front.qualityScore ?? 0,
          qualityScoreBack:  back.qualityScore  ?? undefined,
        },
      });

      if (error) throw new Error(error.message ?? 'Verification request failed');
      onSubmitted();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedFront  = !!front.storagePath && !front.checking && !front.uploading;
  const canProceedBack   = !!back.storagePath  && !back.checking  && !back.uploading;
  const canSubmit        = canProceedFront && (!needsBack || canProceedBack);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== 'type' && (
              <button onClick={goBack} className="p-1 -ml-1 rounded-lg hover:bg-slate-100 transition-colors">
                <ChevronLeft className="w-4 h-4 text-[var(--color-text-muted)]" />
              </button>
            )}
            <div className="flex-1">
              <DialogTitle className="font-heading text-navy text-lg leading-tight">
                {step === 'type'   && 'Verify your identity'}
                {step === 'front'  && `${DOC_TYPES.find(d => d.value === docType)?.label} — front side`}
                {step === 'back'   && `${DOC_TYPES.find(d => d.value === docType)?.label} — back side`}
                {step === 'review' && 'Review & submit'}
              </DialogTitle>
              {step === 'type' && (
                <p className="text-sm font-body mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Earn <strong>+20 trust points</strong> · reviewed within 24h
                </p>
              )}
            </div>
          </div>

          {/* Step indicator (hidden on type selection) */}
          {step !== 'type' && <StepIndicator step={step} needsBack={needsBack} />}
        </DialogHeader>

        <div className="space-y-4 pt-1">

          {/* ── Status banners ─────────────────────────────────────────────── */}
          {idVerified && (
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-medium text-emerald-700">Your identity has been verified.</span>
            </div>
          )}
          {isAlreadyPending && (
            <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-sm font-medium text-amber-700">Your ID is under review. We'll notify you within 24h.</span>
            </div>
          )}
          {isRejected && (
            <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="text-sm font-medium text-red-700">Your ID was not accepted. Please re-submit a clearer photo.</span>
            </div>
          )}

          {canResubmit && (
            <>
              {/* ── Step: Type selection ──────────────────────────────────── */}
              {step === 'type' && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider font-body" style={{ color: 'var(--color-text-muted)' }}>
                    Choose document type
                  </p>
                  {DOC_TYPES.map(dt => (
                    <button
                      key={dt.value}
                      onClick={() => selectDocType(dt.value)}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all hover:border-[var(--color-amber)] hover:bg-amber-50"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <span className="text-2xl">{dt.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold font-body text-navy">{dt.label}</p>
                        <p className="text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>{dt.desc}</p>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'var(--color-border)' }} />
                    </button>
                  ))}

                  {/* Tips */}
                  <div className="rounded-xl bg-slate-50 px-4 py-3 mt-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider font-body mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      Photo tips
                    </p>
                    {['All 4 corners visible', 'No glare or blur', 'Good lighting'].map(tip => (
                      <div key={tip} className="flex items-center gap-2 text-xs font-body mb-1 last:mb-0" style={{ color: 'var(--color-text-secondary)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-amber)] flex-shrink-0" />
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step: Front ───────────────────────────────────────────── */}
              {step === 'front' && (
                <>
                  <CapturePanel
                    label="Front of document"
                    side={front}
                    userId={userId}
                    pathKey="id_front"
                    docType={docType!}
                    onUpdated={updateFront}
                  />
                  {canProceedFront && (
                    <button onClick={goNextFromFront} className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold font-body text-white transition-opacity" style={{ background: 'var(--color-navy)' }}>
                      {needsBack ? 'Next — back side' : 'Review & submit'}
                    </button>
                  )}
                </>
              )}

              {/* ── Step: Back ────────────────────────────────────────────── */}
              {step === 'back' && (
                <>
                  <CapturePanel
                    label="Back of document"
                    side={back}
                    userId={userId}
                    pathKey="id_back"
                    docType={docType!}
                    onUpdated={updateBack}
                  />
                  {canProceedBack && (
                    <button onClick={goNextFromBack} className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold font-body text-white transition-opacity" style={{ background: 'var(--color-navy)' }}>
                      Review & submit
                    </button>
                  )}
                </>
              )}

              {/* ── Step: Review ──────────────────────────────────────────── */}
              {step === 'review' && (
                <div className="space-y-4">
                  {/* Thumbnails — blurred by default, tap to reveal */}
                  <div className={`grid gap-3 ${needsBack && back.preview ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {front.preview && (
                      <ReviewThumb preview={front.preview} label="Front" score={front.qualityScore} />
                    )}
                    {needsBack && back.preview && (
                      <ReviewThumb preview={back.preview} label="Back" score={back.qualityScore} />
                    )}
                  </div>

                  <p className="text-xs font-body text-center" style={{ color: 'var(--color-text-muted)' }}>
                    Our team reviews submissions within 24 hours.
                  </p>

                  {/* Submit error */}
                  {submitError && (
                    <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{submitError}</p>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold font-body text-white transition-opacity disabled:opacity-40"
                    style={{ background: 'var(--color-navy)' }}
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Analysing document…</>
                    ) : (
                      'Submit for verification'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
