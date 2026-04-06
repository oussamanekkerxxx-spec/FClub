import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

function timeLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { conversations, setConversations, loading, error } = useConversations(user?.id, user?.isDemo ?? false);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((c) => c.id === selectedConvId);

  // Auto-select conversation from URL param or default to first
  useEffect(() => {
    if (conversations.length === 0) return;
    const convParam = searchParams.get('conv');
    if (convParam && conversations.some(c => c.id === convParam)) {
      setSelectedConvId(convParam);
      setMobileView('chat');
    } else if (!selectedConvId) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, searchParams, selectedConvId]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at')
        .eq('conversation_id', selectedConvId)
        .order('created_at', { ascending: true });

      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to realtime messages
    const channel = supabase
      .channel(`messages-${selectedConvId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConvId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConvId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConvId || !user) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConvId,
      sender_id: user.id,
      content,
    });

    if (!error) {
      // Update conversation's updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConvId);

      // Update local conversation list
      setConversations(prev =>
        prev.map(c =>
          c.id === selectedConvId
            ? { ...c, last_message: content, last_message_at: new Date().toISOString() }
            : c
        )
      );
    }

    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-amber)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <div className="font-heading text-lg text-navy mb-1">Could not load conversations</div>
          <p className="text-sm font-body text-[var(--color-text-secondary)]">{error}</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
          <div className="font-heading text-xl text-navy mb-2">No messages yet</div>
          <p className="text-sm font-body" style={{ color: 'var(--color-text-secondary)' }}>
            Find a skill and message a teacher to start a conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem-2rem)] md:h-[calc(100vh-3.5rem-3rem)] overflow-hidden" style={{ borderRadius: '18px', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)', background: 'white' }}>

      {/* Conversation List */}
      <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r border-[var(--color-border)] flex-shrink-0`}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-heading text-navy text-lg">Messages</h2>
          <p className="text-xs font-body mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => { setSelectedConvId(conv.id); setMobileView('chat'); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-parchment transition-colors text-left border-b border-[var(--color-border)] last:border-0 ${
                selectedConvId === conv.id ? 'bg-parchment' : 'bg-white'
              }`}
            >
              <Avatar className="w-11 h-11 flex-shrink-0">
                <AvatarImage src={conv.other_user.avatar} />
                <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '12px' }}>
                  {conv.other_user.firstName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-body font-medium text-navy">
                    {conv.other_user.firstName}
                  </span>
                  {conv.last_message_at && (
                    <span className="text-[10px] font-body" style={{ color: 'var(--color-text-muted)' }}>
                      {dayLabel(conv.last_message_at)}
                    </span>
                  )}
                </div>
                {conv.skill_title && (
                  <div className="text-[10px] font-body mb-0.5" style={{ color: 'var(--color-amber)' }}>
                    Re: {conv.skill_title}
                  </div>
                )}
                {conv.last_message && (
                  <p className="text-[11px] font-body truncate" style={{ color: 'var(--color-text-secondary)' }}>
                    {conv.last_message}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}>
        {selected ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
              <button
                className="md:hidden p-1.5 rounded-lg hover:bg-parchment mr-1"
                onClick={() => setMobileView('list')}
              >
                <ArrowLeft className="w-4 h-4 text-navy" />
              </button>
              <Avatar className="w-9 h-9">
                <AvatarImage src={selected.other_user.avatar} />
                <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '11px' }}>
                  {selected.other_user.firstName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold font-body text-navy text-sm">
                  {selected.other_user.firstName} {selected.other_user.lastName}
                </div>
                {selected.skill_title && (
                  <div className="text-[11px] font-body" style={{ color: 'var(--color-amber)' }}>
                    Re: {selected.skill_title}
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm font-body" style={{ color: 'var(--color-text-muted)' }}>
                    Start the conversation — say hello!
                  </p>
                </div>
              )}
              {messages.map((msg) => {
                const isOwn = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} gap-2`}>
                    {!isOwn && (
                      <Avatar className="w-7 h-7 flex-shrink-0 mt-auto">
                        <AvatarImage src={selected.other_user.avatar} />
                        <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '9px' }}>
                          {selected.other_user.firstName[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[72%] space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div
                        className="px-4 py-2.5 rounded-2xl font-body text-sm leading-relaxed"
                        style={
                          isOwn
                            ? { background: 'var(--color-navy)', color: 'white', borderBottomRightRadius: '4px' }
                            : { background: '#F4F0E8', color: 'var(--color-navy)', borderBottomLeftRadius: '4px' }
                        }
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] font-body px-1" style={{ color: 'var(--color-text-muted)' }}>
                        {timeLabel(msg.created_at)}
                      </span>
                    </div>
                    {isOwn && (
                      <Avatar className="w-7 h-7 flex-shrink-0 mt-auto">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback style={{ background: 'var(--color-amber)', color: 'white', fontSize: '9px' }}>
                          {user?.firstName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-4 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={`Message ${selected.other_user.firstName}…`}
                  className="input-sc flex-1 py-2.5 text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                  style={{ background: 'var(--color-amber)' }}
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="font-heading text-xl text-navy mb-2">No conversation selected</div>
              <p className="text-sm font-body" style={{ color: 'var(--color-text-secondary)' }}>
                Choose a conversation from the left to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
