import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Send, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { first_name: string; last_name: string; avatar_url: string };
}

export default function RoomChat() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const roomName = (location.state as { roomName?: string } | null)?.roomName || 'Room';

  // Fetch messages and subscribe to realtime
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at, sender:profiles!messages_sender_id_fkey(first_name, last_name, avatar_url)')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (data) {
        type MsgRow = Omit<Message, 'sender'> & { sender: Message['sender'] | Message['sender'][] | null };
        setMessages((data as MsgRow[]).map(m => ({
          ...m,
          sender: Array.isArray(m.sender) ? m.sender[0] : m.sender ?? undefined,
        })));
      }
    };

    load();

    // Realtime
    const channel = supabase
      .channel(`room-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, payload => {
        const msg = payload.new as Message;
        setMessages(prev => [...prev, msg]);
        // Fetch sender separately
        supabase.from('profiles').select('first_name, last_name, avatar_url').eq('id', msg.sender_id).single()
          .then(({ data: p }) => {
            if (p) setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, sender: p } : m));
          });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !user || !id) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: user.id,
      content: text.trim(),
    });
    setSending(false);
    if (!error) setText('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-white border-b border-[var(--color-border)] rounded-t-2xl">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-parchment text-navy">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-[var(--color-navy)] flex items-center justify-center text-white text-sm font-bold">
          {roomName[0]?.toUpperCase() || '#'}
        </div>
        <div>
          <div className="font-heading text-base text-navy leading-none">{roomName}</div>
          <div className="text-[11px] text-[var(--color-text-muted)] font-body mt-0.5">
            {messages.length} messages
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-[var(--color-parchment)]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <div className="text-4xl mb-3">💬</div>
            <p className="font-body text-sm text-[var(--color-text-secondary)]">No messages yet. Say hello!</p>
          </div>
        )}

        {messages.map(msg => {
          const isOwn = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
              {!isOwn && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={msg.sender?.avatar_url} />
                  <AvatarFallback style={{ background: 'var(--color-navy)', color: 'white', fontSize: '12px' }}>
                    {msg.sender?.first_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[74%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isOwn && (
                  <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] font-body px-1">
                    {msg.sender?.first_name || 'Member'}
                  </span>
                )}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed break-words shadow-sm ${
                    isOwn
                      ? 'bg-[var(--color-navy)] text-white rounded-tr-sm'
                      : 'bg-white text-navy border border-[var(--color-border)] rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-[var(--color-text-muted)] font-body px-1">
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-[var(--color-border)] rounded-b-2xl flex gap-3 items-end">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none input-sc py-2.5 leading-relaxed text-sm"
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
          style={{ background: 'var(--color-amber)' }}
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
