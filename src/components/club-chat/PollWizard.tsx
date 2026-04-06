import { BarChart2, X, Plus, Send, Loader2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 animate-in fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-orange-500" />
            <h3 className="font-heading font-bold text-navy text-[17px]">Create a Poll</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-parchment text-[var(--color-text-muted)]"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <input value={pollQuestion} onChange={e => onQuestionChange(e.target.value)} placeholder="Ask a question *" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-orange-400/30 font-medium text-navy" />

          <div className="space-y-2 pt-2">
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={opt}
                  onChange={e => {
                    const newOpts = [...pollOptions];
                    newOpts[i] = e.target.value;
                    onOptionsChange(newOpts);
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-orange-400/30"
                />
                {pollOptions.length > 2 && (
                  <button onClick={() => onOptionsChange(pollOptions.filter((_, idx) => idx !== i))} className="p-2 text-[var(--color-text-muted)] hover:text-red-500"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>
          {pollOptions.length < 10 && (
            <button onClick={() => onOptionsChange([...pollOptions, ''])} className="text-sm text-orange-500 font-medium hover:underline flex items-center gap-1 mt-1"><Plus className="w-3.5 h-3.5" /> Add an option</button>
          )}

          <div className="pt-4 border-t border-[var(--color-border)] space-y-2">
            <label className="flex items-center gap-3 cursor-pointer hover:bg-black/5 p-2 rounded-lg transition-colors">
              <input type="checkbox" checked={pollIsAnonymous} onChange={e => onIsAnonymousChange(e.target.checked)} className="w-4 h-4 rounded accent-orange-500" />
              <span className="text-sm text-navy">Anonymous Voting</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer hover:bg-black/5 p-2 rounded-lg transition-colors">
              <input type="checkbox" checked={pollMultipleAnswers} onChange={e => onMultipleAnswersChange(e.target.checked)} className="w-4 h-4 rounded accent-orange-500" />
              <span className="text-sm text-navy">Multiple Answers</span>
            </label>
          </div>
        </div>

        <button disabled={savingPoll || !pollQuestion.trim()} onClick={onSubmit} className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-[15px] hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2 shadow-md">
          {savingPoll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {savingPoll ? 'Creating…' : 'Send Poll'}
        </button>
      </div>
    </div>
  );
}
