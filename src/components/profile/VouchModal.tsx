import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { X, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function VouchModal({
  recipientId,
  recipientName,
  skills,
  onClose,
  onSuccess
}: {
  recipientId: string;
  recipientName: string;
  skills: string[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [selectedSkill, setSelectedSkill] = useState('');
  const [vouchText, setVouchText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (!selectedSkill) {
      toast.error('Please select a skill to vouch for');
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from('vouches').insert({
      voucher_id: user.id,
      recipient_id: recipientId,
      skill_tag: selectedSkill,
      vouch_text: vouchText.trim() || null
    });

    setSubmitting(false);

    if (error) {
      if (error.code === '23505') {
        toast.error('You have already vouched for this skill for this member.');
      } else {
        toast.error('Could not submit vouch. Please try again.');
        console.error(error);
      }
      return;
    }

    toast.success(`You successfully vouched for ${recipientName}!`);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-floating relative">
        <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-heading text-lg text-navy">Vouch for {recipientName}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-parchment text-[var(--color-text-muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)] font-body leading-relaxed">
            Vouches build trust in the community. What skill can you confirm {recipientName} is outstanding at?
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] font-body mb-2">Select Skill</label>
            <div className="flex flex-wrap gap-2">
              {skills.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSkill(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all border ${
                    selectedSkill === s 
                      ? 'bg-[var(--color-forest)] text-white border-[var(--color-forest)]'
                      : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-forest)]'
                  }`}
                >
                  {s}
                  {selectedSkill === s && <Check className="w-3 h-3 inline-block ml-1" />}
                </button>
              ))}
            </div>
            {skills.length === 0 && (
              <p className="text-xs text-red-500 italic">This member hasn't listed any skills yet.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] font-body mb-2">Personal Vouch (Optional)</label>
            <textarea
              value={vouchText}
              onChange={(e) => setVouchText(e.target.value)}
              placeholder="E.g. They explained complex Javascript closures perfectly..."
              className="input-sc resize-none text-sm"
              rows={3}
            />
          </div>
        </div>

        <div className="p-5 border-t border-[var(--color-border)] flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-xl font-body font-semibold text-sm text-navy hover:bg-parchment transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={submitting || !selectedSkill}
            className="flex-1 px-4 py-2 bg-[var(--color-amber)] rounded-xl font-body font-semibold text-sm text-white disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Vouch'}
          </button>
        </div>
      </div>
    </div>
  );
}
