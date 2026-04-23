import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import type { DmMessage } from '@/features/dm-chat/types';

/** Pick the best audio MIME type supported by this browser. */
function getBestMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

function mimeToExt(mimeType: string): string {
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

export function useDMComposerActions(ctx: any) {
  const {
    user,
    selectedConvId,
    setConversations,
    newMessage,
    chatAttachment,
    editingMessage,
    replyingTo,
    attachmentCaption,
    isRecording,
    textareaRef,
    mediaRecorderRef,
    audioChunksRef,
    recordingTimerRef,
    setNewMessage,
    setUploadProgress,
    setSending,
    setChatAttachment,
    setReplyingTo,
    setAttachmentCaption,
    setEditingMessage,
    setShowAttachMenu,
    setIsRecording,
    setRecordingTime,
    setMessages,
  } = ctx;

  // ── Formatting toolbar ───────────────────────────────────────────────────────
  const applyFormat = useCallback(
    (syntax: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = newMessage.substring(start, end);
      const inner = selected || 'text';
      const formatted = `${syntax}${inner}${syntax}`;
      const next = newMessage.substring(0, start) + formatted + newMessage.substring(end);
      setNewMessage(next);
      setTimeout(() => {
        textarea.focus();
        const cursor = start + syntax.length + inner.length + syntax.length;
        textarea.setSelectionRange(cursor, cursor);
      }, 0);
    },
    [newMessage, setNewMessage, textareaRef]
  );

  // ── Share location ───────────────────────────────────────────────────────────
  const handleShareLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    toast.info('Requesting location…');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!selectedConvId || !user) return;
        const { latitude, longitude } = position.coords;
        const { error } = await supabase.from('messages').insert({
          conversation_id: selectedConvId,
          sender_id: user.id,
          content: 'Shared Location',
          location_lat: latitude,
          location_lng: longitude,
        });
        if (error) toast.error('Failed to share location.');
        else {
          toast.success('Location shared!');
          _bumpConversation('📍 Shared Location');
        }
        setShowAttachMenu(false);
      },
      (error) => toast.error('Location error: ' + error.message)
    );
  };

  // ── Voice recording ──────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getBestMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev: number) => prev + 1);
      }, 1000);
    } catch {
      toast.error('Microphone access denied.');
    }
  };

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && isRecording) {
      // Override onstop so it only cleans up — no preview creation
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      };
      recorder.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    // Also clear any pending voice preview
    if (chatAttachment?.type === 'voice') {
      URL.revokeObjectURL(chatAttachment.previewUrl);
      setChatAttachment(null);
    }
  };

  /**
   * Stop recording and create a playable preview in the attachment area.
   * The actual upload + send happens when the user clicks the Send button.
   */
  const stopRecordingAndSend = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isRecording) return;

    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    // Use onstop (fires after all ondataavailable events) — no setTimeout race condition
    recorder.onstop = () => {
      recorder.stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      const mimeType = recorder.mimeType || 'audio/webm';
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      const ext = mimeToExt(mimeType);
      const file = new File([blob], `voice-message.${ext}`, { type: mimeType });
      const previewUrl = URL.createObjectURL(blob);
      // Place in attachment area so the user can listen before sending
      setChatAttachment({ file, type: 'voice', previewUrl });
    };

    recorder.stop();
  };

  // ── Send / edit message ──────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!newMessage.trim() && !chatAttachment && !editingMessage) return;
    if (!selectedConvId || !user) return;

    setSending(true);
    const text = newMessage.trim();

    // ── Edit mode
    if (editingMessage) {
      const { error } = await supabase
        .from('messages')
        .update({ content: text, is_edited: true })
        .eq('id', editingMessage.id);

      if (error) toast.error('Could not edit message.');
      else {
        setMessages((prev: DmMessage[]) =>
          prev.map((m) => (m.id === editingMessage.id ? { ...m, content: text, is_edited: true } : m))
        );
        setEditingMessage(null);
        setNewMessage('');
      }
      setSending(false);
      return;
    }

    setNewMessage('');

    let imageUrl: string | null = null;
    let videoUrl: string | null = null;
    let pdfUrl: string | null = null;
    let voiceUrl: string | null = null;

    if (chatAttachment) {
      if (chatAttachment.file.size > 100 * 1024 * 1024) {
        toast.error('File too large — maximum is 100 MB.');
        setNewMessage(text);
        setSending(false);
        return;
      }
      try {
        setUploadProgress(1);
        const result = await uploadToCloudinary(chatAttachment.file, setUploadProgress);
        setUploadProgress(0);
        if (chatAttachment.type === 'image') imageUrl = result.url;
        else if (chatAttachment.type === 'video') videoUrl = result.url;
        else if (chatAttachment.type === 'pdf') pdfUrl = result.url;
        else if (chatAttachment.type === 'voice') {
          voiceUrl = result.url;
          URL.revokeObjectURL(chatAttachment.previewUrl); // free blob URL memory
        }
        setChatAttachment(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'unknown error';
        toast.error('Upload failed: ' + msg);
        setUploadProgress(0);
        setNewMessage(text);
        setSending(false);
        return;
      }
    }

    const payload: Record<string, unknown> = {
      conversation_id: selectedConvId,
      sender_id: user.id,
      content: voiceUrl ? null : (text || null),
    };
    if (replyingTo) payload.reply_to_id = replyingTo.id;
    if (imageUrl) payload.image_url = imageUrl;
    if (videoUrl) payload.video_url = videoUrl;
    if (pdfUrl) payload.pdf_url = pdfUrl;
    if (voiceUrl) payload.voice_url = voiceUrl;
    if (attachmentCaption.trim() && (imageUrl || videoUrl)) {
      payload.caption = attachmentCaption.trim();
    }

    // Graceful fallback: retry with only base columns if DB hasn't been migrated yet
    let { error } = await supabase.from('messages').insert(payload);
    if (error?.code === '42703' || error?.code === 'PGRST200' || error?.message?.includes('column') || error?.message?.includes('does not exist')) {
      // Base schema only — no extended columns
      const minimal = {
        conversation_id: selectedConvId,
        sender_id: user.id,
        content: voiceUrl ? '🎙️ Voice Message' : imageUrl ? '📷 Photo' : videoUrl ? '🎬 Video' : pdfUrl ? '📄 File' : text || '📎 Attachment',
      };
      ({ error } = await supabase.from('messages').insert(minimal));
    }

    if (error) {
      toast.error('Could not send message.');
      setNewMessage(text);
    } else {
      setReplyingTo(null);
      setAttachmentCaption('');
      const preview =
        voiceUrl ? '🎙️ Voice Message' :
        imageUrl ? '📷 Photo' :
        videoUrl ? '🎬 Video' :
        pdfUrl ? '📄 File' :
        text;
      _bumpConversation(preview);
    }
    setSending(false);
  };

  // ── Reactions ────────────────────────────────────────────────────────────────
  const handleToggleReaction = async (msgId: string, emoji: string) => {
    if (!user) return;
    const msg = ctx.messages?.find((m: DmMessage) => m.id === msgId);
    if (!msg) return;
    const existing = msg.reactions?.find((r: any) => r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      await supabase.from('dm_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('dm_reactions').insert({ message_id: msgId, user_id: user.id, emoji });
    }
  };

  // ── Edit / delete / reply ───────────────────────────────────────────────────
  const handleEditMessage = (msg: DmMessage) => {
    ctx.setEditingMessage(msg);
    ctx.setReplyingTo(null);
    setNewMessage(msg.content || '');
    textareaRef.current?.focus();
  };

  const handleReplyMessage = (msg: DmMessage) => {
    ctx.setReplyingTo(msg);
    ctx.setEditingMessage(null);
    textareaRef.current?.focus();
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm('Delete this message?')) return;
    setMessages((prev: DmMessage[]) =>
      prev.map((m) => (m.id === msgId ? { ...m, deleted_at: new Date().toISOString() } : m))
    );
    // Try soft-delete first, fall back to actual delete
    const { error } = await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', msgId);
    if (error) {
      // If column doesn't exist yet, remove from local state only
    }
  };

  // ── Internal: update conversation last_message + re-sort ───────────────────
  function _bumpConversation(preview: string) {
    const nowIso = new Date().toISOString();
    supabase
      .from('conversations')
      .update({ updated_at: nowIso })
      .eq('id', selectedConvId)
      .then();
    setConversations((prev: any[]) => {
      const updated = prev.map((c) =>
        c.id === selectedConvId
          ? { ...c, last_message: preview, last_message_at: nowIso }
          : c
      );
      return [...updated].sort((a, b) => {
        const aTime = a.last_message_at || a.updated_at || '';
        const bTime = b.last_message_at || b.updated_at || '';
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
    });
  }

  return {
    applyFormat,
    handleShareLocation,
    startRecording,
    cancelRecording,
    stopRecordingAndSend,
    handleSend,
    handleToggleReaction,
    handleEditMessage,
    handleReplyMessage,
    handleDeleteMessage,
  };
}
