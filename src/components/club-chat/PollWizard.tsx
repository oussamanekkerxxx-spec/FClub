import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, X, Plus, Send, Loader2 } from 'lucide-react';
import { springs } from '@/lib/animation';

interface PollWizardProps {
  pollQuestion: string;
  pollOptions: string[];
  pollIsAnonymous: boolean;
  pollMultipleAnswers: boolean;
  savingPoll: boolean;
  onClose: () => void;
  onQuestionChange: (value: string) => void;
  onOptionsChange: (options: string[]) => void;
  onIsAnonymousChange: (value: boolean) => void;
  onMultipleAnswersChange: (value: boolean) => void;
  onSubmit: () => void;
}

export default function PollWizard({
  pollQuestion,
  pollOptions,
  pollIsAnonymous,
  pollMultipleAnswers,
  savingPoll,
  onClose,
  onQuestionChange,
  onOptionsChange,
  onIsAnonymousChange,
  onMultipleAnswersChange,
  onSubmit,
}: PollWizardProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={springs.backdrop}
      >
        <motion.div
          className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={springs.modal}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-orange-500" />
              <h3 className="font-heading font-bold text-navy text-[17px]">Create a Poll</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-parchment text-[var(--color-text-muted)]"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-3">
            <input value={pollQuestion} onChange={(e) => onQuestionChange(e.target.value)} placeholder="Ask a question…" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-orange-400/30 font-medium" />
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={opt} onChange={(e) => { const next = [...pollOptions]; next[i] = e.target.value; onOptionsChange(next); }} placeholder={`Option ${i + 1}`} className="flex-1 px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-orange-400/30" />
                {pollOptions.length > 2 && (
                  <button onClick={() => onOptionsChange(pollOptions.filter((_, idx) => idx !== i))} className="p-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
            {pollOptions.length < 6 && (
              <button onClick={() => onOptionsChange([...pollOptions, ''])} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-navy transition-colors font-medium">
                <Plus className="w-4 h-4" /> Add option
              </button>
            )}
            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                <input type="checkbox" checked={pollIsAnonymous} onChange={(e) => onIsAnonymousChange(e.target.checked)} className="rounded accent-orange-500" /> Anonymous
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                <input type="checkbox" checked={pollMultipleAnswers} onChange={(e) => onMultipleAnswersChange(e.target.checked)} className="rounded accent-orange-500" /> Multiple answers
              </label>
            </div>
            <button disabled={savingPoll || !pollQuestion.trim() || pollOptions.some(o => !o.trim())} onClick={onSubmit} className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-[15px] hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2 mt-2">
              {savingPoll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {savingPoll ? 'Creating…' : 'Create Poll'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
