import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Skill } from '@/types/fightclub';
import { MapPin, Clock, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const TIMES = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
const STEP_LABELS = ['Overview', 'Location', 'Date & Time', 'Your Note'];

interface Props {
  skill: Skill;
  isOpen: boolean;
  onClose: () => void;
}

export default function NewBookingModal({ skill, isOpen, onClose }: Props) {
  const { user } = useAuth();
  const guestDropdownRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(0);
  const [neighborhood, setNeighborhood] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep(0);
    setNeighborhood('');
    setDate(undefined);
    setTime('');
    setNote('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canProceed = () => {
    if (step === 1) return !!neighborhood;
    if (step === 2) return !!date && !!time;
    return true;
  };

  const handleSubmit = async () => {
    if (!user || user.isDemo) {
      toast.error('Sign in to request a session');
      return;
    }

    const proposedTime =
      date && time
        ? new Date(`${date.toISOString().split('T')[0]}T${time}:00`)
        : undefined;

    setSubmitting(true);
    const { error } = await supabase.from('bookings').insert({
      skill_id: skill.id,
      student_id: user.id,
      teacher_id: skill.teacher_id,
      status: 'pending',
      proposed_time: proposedTime?.toISOString(),
      neighborhood,
      student_note: note || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error('Could not send request. Please try again.');
    } else {
      toast.success(`Session request sent to ${skill.teacher.firstName}!`);
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-navy">Request a Session</DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-1 my-2">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-body flex-shrink-0 transition-all"
                style={
                  i < step
                    ? { background: 'var(--color-forest)', color: 'white' }
                    : i === step
                    ? { background: 'var(--color-amber)', color: 'white' }
                    : { background: '#E8E2D4', color: 'var(--color-text-muted)' }
                }
              >
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className="flex-1 h-px mx-1 transition-all"
                  style={{ background: i < step ? 'var(--color-forest)' : '#E8E2D4' }}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs font-body font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-amber)' }}>
          {STEP_LABELS[step]}
        </p>

        {/* Step 0: Overview */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl" style={{ background: 'var(--color-bg)' }}>
              <div className="font-heading text-navy text-lg">{skill.title}</div>
              <div className="font-body text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                with {skill.teacher.firstName} {skill.teacher.lastName}
              </div>
              <div className="flex items-center gap-3 mt-3 text-sm font-body">
                <span className="font-bold" style={{ color: 'var(--color-amber)' }}>
                  {skill.price_per_hour} {skill.currency}/hr
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>·</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {skill.format === 'both' ? 'Online or In-person' : skill.format}
                </span>
              </div>
            </div>
            <p className="text-sm font-body leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              You're requesting a session with {skill.teacher.firstName}. They'll see your request and can accept, suggest a different time, or message you to discuss.
            </p>
            <div className="text-xs font-body p-3 rounded-xl" style={{ background: '#E8F5EE', color: '#2D7A4F' }}>
              No payment required. Sessions are agreed directly with the teacher.
            </div>
            {/* ref declared here to fix the guestDropdownRef crash */}
            <div ref={guestDropdownRef} />
          </div>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm font-body" style={{ color: 'var(--color-text-secondary)' }}>
              Where would you like to meet?
            </p>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              <input
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="City, neighbourhood or café…"
                className="input-sc pl-10"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={{ before: new Date() }}
              className="mx-auto"
            />
            {date && (
              <div>
                <p className="text-xs font-body font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Pick a time
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIMES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTime(t)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-body border transition-all"
                      style={
                        time === t
                          ? { borderColor: 'var(--color-amber)', background: '#FFF3E0', color: 'var(--color-navy)', fontWeight: 600 }
                          : { borderColor: 'var(--color-border)', background: 'white', color: 'var(--color-text-secondary)' }
                      }
                    >
                      <Clock className="w-3 h-3" />
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Note */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm font-body" style={{ color: 'var(--color-text-secondary)' }}>
              Add a short note for {skill.teacher.firstName} — optional but makes a great first impression.
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Hi ${skill.teacher.firstName}, I'm interested in learning…`}
              className="input-sc resize-none w-full"
              rows={4}
            />
            <div
              className="p-3 rounded-xl text-xs font-body"
              style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}
            >
              <div className="font-semibold text-navy mb-1">Your request summary</div>
              <div>{skill.title} · {neighborhood} · {date?.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at {time}</div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--color-border)]">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl border text-sm font-semibold font-body text-navy hover:bg-parchment transition-colors"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl text-sm font-semibold font-body btn-amber disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl text-sm font-semibold font-body btn-amber disabled:opacity-50 transition-all"
            >
              {submitting ? 'Sending…' : `Send Request to ${skill.teacher.firstName}`}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
