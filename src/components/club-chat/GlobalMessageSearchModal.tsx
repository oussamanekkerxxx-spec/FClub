import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Loader2, Hash, Megaphone, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { springs } from '@/lib/animation';

interface GlobalMessageSearchModalProps {
  clubId: string;
  onClose: () => void;
  onSelectMessage: (channelId: string, messageId: string) => void;
}

function highlightMatch(text: string, query: string) {
  if (!query.trim() || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-amber-200 text-amber-900 rounded px-0.5 not-italic">{part}</mark>
      : part
  );
}

export default function GlobalMessageSearchModal({ clubId, onClose, onSelectMessage }: GlobalMessageSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('fightclub_recent_searches') || '[]'); } catch { return []; }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      const { data: channels } = await supabase
        .from('club_channels').select('id, name, is_announcement_only').eq('club_id', clubId);

      if (!channels?.length) { setResults([]); setLoading(false); return; }

      const { data: messages } = await supabase
        .from('club_messages')
        .select('id, content, created_at, channel_id, sender:users(first_name, last_name, avatar_url)')
        .in('channel_id', channels.map(c => c.id))
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(40);

      setResults((messages || []).map(m => ({ ...m, channel: channels.find(c => c.id === m.channel_id) })));
      setLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [query, clubId]);

  const handleSelect = (channelId: string, messageId: string) => {
    // persist recent search
    if (query.trim()) {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      localStorage.setItem('fightclub_recent_searches', JSON.stringify(updated));
    }
    onSelectMessage(channelId, messageId);
    onClose();
  };

  const isEmpty = !query.trim();
  const noResults = query.trim() && !loading && results.length === 0;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-16 px-4"
      style={{ background: 'rgba(10,12,20,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={springs.backdrop}
    >
      <motion.div
        className="w-full max-w-xl flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxHeight: 'calc(100vh - 100px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.97)',
        }}
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={springs.modal}
      >
        {/* ── Search bar ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-black/5">
          {loading
            ? <Loader2 className="w-5 h-5 text-amber-500 animate-spin flex-shrink-0" />
            : <Search className="w-5 h-5 text-[var(--color-text-muted)] flex-shrink-0" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search messages across all channels…"
            className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium text-navy placeholder-[var(--color-text-muted)]"
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1.5 hover:bg-black/5 rounded-full text-[var(--color-text-muted)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[11px] font-bold text-[var(--color-text-muted)] border border-[var(--color-border)] px-2 py-1 rounded-lg hover:bg-black/5 transition-colors ml-1"
            >
              ESC
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* Empty state — show recents */}
          {isEmpty && (
            <div className="py-4">
              {recentSearches.length > 0 ? (
                <>
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest px-4 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Recent searches
                  </p>
                  {recentSearches.map(s => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8F9FA] transition-colors text-left"
                    >
                      <Clock className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                      <span className="text-sm text-[var(--color-text-secondary)]">{s}</span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-[var(--color-text-muted)]">
                  <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                    <Search className="w-6 h-6 text-[var(--color-text-muted)] opacity-40" />
                  </div>
                  <p className="text-sm font-semibold text-navy">Search everything</p>
                  <p className="text-[12px] text-[var(--color-text-muted)] mt-1">Find messages across all channels at once</p>
                </div>
              )}
            </div>
          )}

          {/* No results */}
          {noResults && (
            <div className="flex flex-col items-center justify-center py-10 text-[var(--color-text-muted)]">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Search className="w-5 h-5 opacity-30" />
              </div>
              <p className="text-sm font-semibold text-navy">No messages found</p>
              <p className="text-[12px] mt-1">No results for <span className="font-semibold">"{query}"</span></p>
            </div>
          )}

          {/* Results */}
          {!isEmpty && !noResults && results.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="divide-y divide-black/[0.04]">
                {results.map(msg => {
                  const sender = msg.sender as any;
                  const initials = `${sender?.first_name?.[0] || ''}${sender?.last_name?.[0] || ''}`.toUpperCase();
                  return (
                    <button
                      key={msg.id}
                      onClick={() => handleSelect(msg.channel_id, msg.id)}
                      className="w-full text-left px-4 py-3.5 hover:bg-[#F8F9FA] transition-colors group flex gap-3 items-start"
                    >
                      {/* Avatar */}
                      {sender?.avatar_url ? (
                        <img src={sender.avatar_url} className="w-9 h-9 rounded-full flex-shrink-0 object-cover mt-0.5" alt="" loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0 mt-0.5">
                          {initials || '?'}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-semibold text-navy text-[13px]">
                            {sender?.first_name} {sender?.last_name}
                          </span>
                          {/* Channel badge */}
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">
                            {msg.channel?.is_announcement_only ? <Megaphone className="w-2.5 h-2.5" /> : <Hash className="w-2.5 h-2.5" />}
                            {msg.channel?.name}
                          </span>
                          <span className="text-[11px] text-[var(--color-text-muted)] ml-auto">
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-[13px] text-[var(--color-text-secondary)] leading-snug line-clamp-2">
                          {highlightMatch(msg.content || '', query)}
                        </p>
                      </div>

                      {/* Jump arrow */}
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                        <div className="w-7 h-7 rounded-full bg-navy/5 flex items-center justify-center mt-1">
                          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-navy" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Footer hint ─────────────────────────────────────────────── */}
        {!isEmpty && results.length > 0 && (
          <div className="px-4 py-2.5 border-t border-black/5 flex items-center gap-4 text-[11px] text-[var(--color-text-muted)]">
            <span><kbd className="font-mono bg-black/5 px-1.5 py-0.5 rounded text-[10px]">↵</kbd> to jump</span>
            <span><kbd className="font-mono bg-black/5 px-1.5 py-0.5 rounded text-[10px]">Esc</kbd> to close</span>
            <span className="ml-auto">{results.length} result{results.length !== 1 ? 's' : ''} across all channels</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
