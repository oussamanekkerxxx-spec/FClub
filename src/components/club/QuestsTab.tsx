import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Quest, QuestStep } from '@/types/fightclub';
import { useLazyQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/queryKeys';
import { Users, Sword, ChevronRight, Check, PlusCircle, X, Loader2 } from 'lucide-react';
import MemberGate from './MemberGate';

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: '#DCFCE7', text: '#16A34A' },
  intermediate: { bg: '#FEF9C3', text: '#CA8A04' },
  advanced: { bg: '#FEE2E2', text: '#DC2626' },
};

type QuestRow = Quest & { steps: QuestStep[]; participants: { user_id: string }[] };

function QuestCard({
  quest,
  isMember,
  onJoin,
  onLeave,
  onStepToggle,
}: {
  quest: Quest;
  isMember: boolean;
  onJoin: (questId: string) => void;
  onLeave: (questId: string) => void;
  onStepToggle: (stepId: string, questId: string, current: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const diff = DIFFICULTY_COLORS[quest.difficulty] ?? DIFFICULTY_COLORS.beginner;
  const completedSteps = quest.steps?.filter((s: QuestStep) => s.is_completed).length ?? 0;
  const totalSteps = quest.steps?.length ?? quest.step_count;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const statusColor: Record<string, string> = {
    open: 'var(--color-forest)',
    in_progress: 'var(--color-amber)',
    completed: 'var(--color-plum)',
    cancelled: '#9CA3AF',
  };

  return (
    <div className="sc-card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: diff.bg, color: diff.text }}>
                {quest.difficulty}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: statusColor[quest.status] }}>
                ● {quest.status.replace('_', ' ')}
              </span>
            </div>
            <h3 className="font-semibold text-navy text-sm">{quest.title}</h3>
            {quest.description && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">{quest.description}</p>
            )}
            <div className="mt-2 text-[11px] text-[var(--color-text-muted)]">
              Contribution points: +4 join • +6 per step • +20 completion
            </div>
          </div>

          <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg hover:bg-parchment transition-colors flex-shrink-0">
            <ChevronRight className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {totalSteps > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--color-text-muted)]">{completedSteps}/{totalSteps} steps</span>
              <span className="font-semibold" style={{ color: 'var(--color-amber)' }}>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--color-amber)' }} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <Users className="w-3.5 h-3.5" />
            {quest.participant_count} participant{quest.participant_count !== 1 ? 's' : ''}
            {quest.max_participants && ` / ${quest.max_participants}`}
          </div>
          {isMember && quest.status !== 'completed' && quest.status !== 'cancelled' && (
            quest.i_am_participant ? (
              <button onClick={() => onLeave(quest.id)} className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-red-500 transition-colors">
                Leave
              </button>
            ) : (
              <button onClick={() => onJoin(quest.id)} className="text-xs font-semibold btn-amber px-3 py-1" style={{ padding: '4px 12px', fontSize: '12px' }}>
                Join Quest
              </button>
            )
          )}
        </div>
      </div>

      {expanded && quest.steps && quest.steps.length > 0 && (
        <div className="border-t border-[var(--color-border)] px-5 py-3 space-y-2 bg-[#FAFAF8]">
          {quest.steps.map((step: QuestStep) => (
            <div key={step.id} className="flex items-center gap-3">
              <button
                disabled={!quest.i_am_participant}
                onClick={() => onStepToggle(step.id, quest.id, step.is_completed)}
                className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                  step.is_completed
                    ? 'bg-[var(--color-forest)] border-[var(--color-forest)]'
                    : 'border-gray-300 hover:border-[var(--color-forest)]'
                } disabled:opacity-40`}
              >
                {step.is_completed && <Check className="w-3 h-3 text-white" />}
              </button>
              <span className={`text-sm ${step.is_completed ? 'line-through text-[var(--color-text-muted)]' : 'text-navy'}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface QuestsTabProps {
  clubId: string;
  isMember: boolean;
  isPrivate: boolean;
  userId: string | undefined;
  isModOrAdmin?: boolean;
}

export default function QuestsTab({ clubId, isMember, isPrivate, userId, isModOrAdmin = false }: QuestsTabProps) {
  const { data: rawQuests, loading, setData: setQuests } = useLazyQuery<QuestRow>(
    queryKeys.clubs.quests(clubId),
    () => supabase
      .from('quests')
      .select('*, steps:quest_steps(*), participants:quest_participants(user_id)')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false }),
    isMember && !!clubId,
    { errorMessage: 'Failed to load quests' }
  );

  const quests = useMemo(
    () => rawQuests.map(q => ({
      ...q,
      steps: q.steps?.sort((a: QuestStep, b: QuestStep) => a.order_index - b.order_index),
      i_am_participant: userId ? q.participants?.some((p: { user_id: string }) => p.user_id === userId) : false,
    })),
    [rawQuests, userId]
  );

  const [showCreate, setShowCreate] = useState(false);
  const [creatingQuest, setCreatingQuest] = useState(false);
  const [questTitle, setQuestTitle] = useState('');
  const [questDescription, setQuestDescription] = useState('');
  const [questDifficulty, setQuestDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [questDeadline, setQuestDeadline] = useState('');
  const [questMaxParticipants, setQuestMaxParticipants] = useState('');
  const [questSteps, setQuestSteps] = useState('');

  const resetQuestForm = () => {
    setShowCreate(false);
    setQuestTitle('');
    setQuestDescription('');
    setQuestDifficulty('beginner');
    setQuestDeadline('');
    setQuestMaxParticipants('');
    setQuestSteps('');
  };

  const handleCreateQuest = async () => {
    if (!isModOrAdmin || !userId || !questTitle.trim()) return;

    const parsedSteps = questSteps
      .split('\n')
      .map(step => step.trim())
      .filter(Boolean);

    setCreatingQuest(true);
    try {
      const payload = {
        club_id: clubId,
        title: questTitle.trim(),
        description: questDescription.trim() || null,
        status: 'open',
        difficulty: questDifficulty,
        max_participants: questMaxParticipants ? parseInt(questMaxParticipants, 10) : null,
        participant_count: 0,
        step_count: parsedSteps.length,
        deadline: questDeadline ? new Date(`${questDeadline}T23:59:59`).toISOString() : null,
        created_by: userId,
      };

      let createQuest = await supabase.from('quests').insert(payload).select('*').single();

      if (createQuest.error?.code === '42703') {
        const fallbackPayload = { ...payload } as Record<string, unknown>;
        delete fallbackPayload.participant_count;
        delete fallbackPayload.step_count;
        createQuest = await supabase.from('quests').insert(fallbackPayload).select('*').single();
      }

      if (createQuest.error) throw createQuest.error;

      let insertedSteps: QuestStep[] = [];
      if (parsedSteps.length > 0) {
        const { data: stepRows, error: stepsError } = await supabase
          .from('quest_steps')
          .insert(parsedSteps.map((title, index) => ({
            quest_id: createQuest.data.id,
            title,
            description: null,
            order_index: index,
            is_completed: false,
          })))
          .select('*');

        if (stepsError) {
          console.error('[create quest steps]', stepsError);
          toast.info('Quest created, but we could not save steps.');
        } else {
          insertedSteps = stepRows as QuestStep[];
        }
      }

      const newQuestRow: QuestRow = {
        ...(createQuest.data as QuestRow),
        steps: insertedSteps,
        participants: [],
      };

      setQuests(prev => [newQuestRow, ...prev]);
      resetQuestForm();
      toast.success('Quest created!');
    } catch (error) {
      console.error('[create quest]', error);
      toast.error('Could not create quest.');
    } finally {
      setCreatingQuest(false);
    }
  };

  const handleJoinQuest = async (questId: string) => {
    if (!userId) return;
    const { error } = await supabase.from('quest_participants').insert({ quest_id: questId, user_id: userId });
    if (!error) {
      setQuests(prev => prev.map(q => q.id === questId
        ? { ...q, participant_count: q.participant_count + 1, i_am_participant: true }
        : q));
      toast.success('You joined this quest!');
    }
  };

  const handleLeaveQuest = async (questId: string) => {
    if (!userId) return;
    await supabase.from('quest_participants').delete().eq('quest_id', questId).eq('user_id', userId);
    setQuests(prev => prev.map(q => q.id === questId
      ? { ...q, participant_count: Math.max(0, q.participant_count - 1), i_am_participant: false }
      : q));
  };

  const handleStepToggle = async (stepId: string, questId: string, current: boolean) => {
    if (!userId) return;
    await supabase.from('quest_steps').update({
      is_completed: !current,
      completed_by: !current ? userId : null,
      completed_at: !current ? new Date().toISOString() : null,
    }).eq('id', stepId);

    setQuests(prev => prev.map(q => q.id === questId ? {
      ...q,
      steps: q.steps?.map((s: QuestStep) => s.id === stepId ? { ...s, is_completed: !current } : s),
    } : q));
  };

  if (!isMember) return <MemberGate isPrivate={isPrivate} />;

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="sc-card p-5 animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-2 bg-gray-100 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isModOrAdmin && (
        <div className="sc-card p-4">
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2 rounded-xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-amber)] hover:border-[var(--color-amber)] transition-all"
            >
              <PlusCircle className="w-4 h-4" /> Launch Quest
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy">New Quest</h3>
                <button onClick={resetQuestForm} className="text-[var(--color-text-muted)] hover:text-navy">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                value={questTitle}
                onChange={e => setQuestTitle(e.target.value)}
                placeholder="Quest title *"
                className="input-sc text-sm w-full"
              />

              <textarea
                value={questDescription}
                onChange={e => setQuestDescription(e.target.value)}
                placeholder="Description"
                rows={2}
                className="input-sc text-sm w-full resize-none"
              />

              <div className="grid grid-cols-3 gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map(diff => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setQuestDifficulty(diff)}
                    className={`px-2 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                      questDifficulty === diff
                        ? 'bg-[var(--color-navy)] text-white'
                        : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-parchment'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={questDeadline}
                  onChange={e => setQuestDeadline(e.target.value)}
                  className="input-sc text-sm w-full"
                />
                <input
                  type="number"
                  min="1"
                  value={questMaxParticipants}
                  onChange={e => setQuestMaxParticipants(e.target.value)}
                  placeholder="Max participants"
                  className="input-sc text-sm w-full"
                />
              </div>

              <textarea
                value={questSteps}
                onChange={e => setQuestSteps(e.target.value)}
                placeholder="One step per line"
                rows={4}
                className="input-sc text-sm w-full resize-none"
              />

              <div className="flex gap-2 pt-1">
                <button
                  onClick={resetQuestForm}
                  className="flex-1 py-2 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateQuest}
                  disabled={creatingQuest || !questTitle.trim()}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                  style={{ background: 'var(--color-navy)' }}
                >
                  {creatingQuest ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Quest'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {quests.length === 0 ? (
        <div className="sc-card p-10 text-center">
          <Sword className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
          <p className="text-[var(--color-text-secondary)] text-sm">No quests yet. Launch one to start contributions.</p>
        </div>
      ) : (
        (['open', 'in_progress', 'completed'] as const).map(status => {
          const statusQuests = quests.filter(q => q.status === status);
          if (statusQuests.length === 0) return null;

          return (
            <div key={status}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                {status === 'open' ? 'Open' : status === 'in_progress' ? 'In Progress' : 'Completed'}
              </h3>
              <div className="space-y-3">
                {statusQuests.map(quest => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    isMember={isMember}
                    onJoin={handleJoinQuest}
                    onLeave={handleLeaveQuest}
                    onStepToggle={handleStepToggle}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
