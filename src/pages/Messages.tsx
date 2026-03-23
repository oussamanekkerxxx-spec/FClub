import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { conversations } from '@/data/mockData';
import { Send, ArrowLeft } from 'lucide-react';

function timeLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date('2026-03-12T02:17:00Z');
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Messages() {
  const { user } = useAuth();
  const [selectedConvId, setSelectedConvId] = useState(conversations[0]?.id ?? null);
  const [newMessage, setNewMessage] = useState('');
  const [localConvs, setLocalConvs] = useState(conversations);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const selected = localConvs.find((c) => c.id === selectedConvId);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedConvId) return;
    setLocalConvs((prev) =>
      prev.map((c) =>
        c.id === selectedConvId
          ? {
              ...c,
              last_message: newMessage,
              last_message_at: new Date().toISOString(),
              unread_count: 0,
              messages: [
                ...c.messages,
                { id: `m-local-${Date.now()}`, sender_id: 'user-1', content: newMessage, created_at: new Date().toISOString() },
              ],
            }
          : c
      )
    );
    setNewMessage('');
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem-2rem)] md:h-[calc(100vh-3.5rem-3rem)] overflow-hidden" style={{ borderRadius: '18px', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)', background: 'white' }}>

      {/* Conversation List */}
      <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r border-[var(--color-border)] flex-shrink-0`}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-heading text-navy text-lg">Messages</h2>
          <p className="text-xs font-body mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {localConvs.filter((c) => c.unread_count > 0).length} unread
          </p>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {localConvs.map((conv) => (
            <button
              key={conv.id}
              onClick={() => { setSelectedConvId(conv.id); setMobileView('chat'); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-parchment transition-colors text-left border-b border-[var(--color-border)] last:border-0 ${
                selectedConvId === conv.id ? 'bg-parchment' : 'bg-white'
              }`}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="w-11 h-11">
                  <AvatarImage src={conv.other_member.avatar} />
                  <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '12px' }}>
                    {conv.other_member.firstName[0]}
                  </AvatarFallback>
                </Avatar>
                {conv.unread_count > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold font-body text-white flex items-center justify-center"
                    style={{ background: 'var(--color-amber)' }}
                  >
                    {conv.unread_count}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-sm font-body ${conv.unread_count ? 'font-bold text-navy' : 'font-medium text-navy'}`}>
                    {conv.other_member.firstName}
                  </span>
                  <span className="text-[10px] font-body" style={{ color: 'var(--color-text-muted)' }}>
                    {dayLabel(conv.last_message_at)}
                  </span>
                </div>
                {conv.skill && (
                  <div className="text-[10px] font-body mb-0.5" style={{ color: 'var(--color-amber)' }}>
                    Re: {conv.skill.title}
                  </div>
                )}
                <p className={`text-[11px] font-body truncate ${conv.unread_count ? 'text-navy' : ''}`} style={{ color: conv.unread_count ? 'var(--color-navy)' : 'var(--color-text-secondary)' }}>
                  {conv.last_message}
                </p>
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
                <AvatarImage src={selected.other_member.avatar} />
                <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '11px' }}>
                  {selected.other_member.firstName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold font-body text-navy text-sm">
                  {selected.other_member.firstName} {selected.other_member.lastName}
                </div>
                {selected.skill && (
                  <div className="text-[11px] font-body" style={{ color: 'var(--color-amber)' }}>
                    Re: {selected.skill.title}
                  </div>
                )}
              </div>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-[11px] font-body text-[var(--color-text-muted)]">Active</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {selected.messages.map((msg) => {
                const isOwn = msg.sender_id === 'user-1';
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} gap-2`}>
                    {!isOwn && (
                      <Avatar className="w-7 h-7 flex-shrink-0 mt-auto">
                        <AvatarImage src={selected.other_member.avatar} />
                        <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '9px' }}>
                          {selected.other_member.firstName[0]}
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
            </div>

            {/* Input */}
            <div className="px-5 py-4 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={`Message ${selected.other_member.firstName}…`}
                  className="input-sc flex-1 py-2.5 text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
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
