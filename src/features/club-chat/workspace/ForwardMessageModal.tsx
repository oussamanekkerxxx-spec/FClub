import { CornerUpLeft, Hash, Megaphone, X } from 'lucide-react';

interface ForwardMessageModalProps {
  c: any;
}

export default function ForwardMessageModal({ c }: ForwardMessageModalProps) {
  if (!c.showForwardModal || !c.forwardingMessage) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 animate-in fade-in">
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CornerUpLeft className="w-5 h-5 text-emerald-500" style={{ transform: 'scaleX(-1)' }} />
            <h3 className="font-heading font-bold text-navy text-[17px]">Forward to Channel</h3>
          </div>
          <button onClick={() => { c.setShowForwardModal(false); c.setForwardingMessage(null); }} className="p-2 rounded-full hover:bg-parchment text-[var(--color-text-muted)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 px-3 py-2 bg-[var(--color-parchment)] rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] truncate">
          <span className="font-medium text-navy mr-1">"{c.forwardingMessage.content || 'Attachment'}"</span>
        </div>

        <div className="space-y-1 max-h-60 overflow-y-auto">
          {c.channels.map((chan: any) => {
            const Icon = chan.is_announcement_only ? Megaphone : Hash;
            const isCurrentChannel = chan.id === c.activeChannelId;
            return (
              <button
                key={chan.id}
                disabled={isCurrentChannel && !c.forwardingMessage.forwarded_from_id}
                onClick={() => c.handleForwardMessage(chan.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-[var(--color-parchment)] transition-colors text-left disabled:opacity-40"
              >
                <Icon className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                <span className="font-medium text-navy truncate">#{chan.name}</span>
                {isCurrentChannel && <span className="ml-auto text-[10px] text-[var(--color-text-muted)]">current</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
