import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';

export function useClubChatComposerActions(ctx: any) {
  const {
    user,
    activeChannelId,
    activeChannel,
    isAdminOrMod,
    newMessage,
    chatAttachment,
    editingMessage,
    replyingTo,
    attachmentCaption,
    isRecording,
    scheduledDate,
    scheduledTime,
    isSilentSend,
    typingTimerRef,
    textareaRef,
    mediaRecorderRef,
    audioChunksRef,
    recordingTimerRef,
    lastSentAtRef,
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
    setShowScheduleModal,
    setScheduledDate,
    setScheduledTime,
    setIsSilentSend,
    setMessages,
  } = ctx;

  const applyFormat = useCallback((syntax: string) => {
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
  }, [newMessage, setNewMessage, textareaRef]);

  const handleShareLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    toast.info('Requesting location...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!activeChannelId || !user) return;
        const { latitude, longitude } = position.coords;
        const { error } = await supabase.from('club_messages').insert({
          channel_id: activeChannelId,
          sender_id: user.id,
          content: 'Shared Location',
          location_lat: latitude,
          location_lng: longitude,
        });
        if (error) toast.error('Failed to share location.');
        else toast.success('Location shared!');
        setShowAttachMenu(false);
      },
      (error) => toast.error('Location error: ' + error.message)
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start(100);
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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const stopRecordingAndSend = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setTimeout(async () => {
        if (!activeChannelId || !user) return;
        setSending(true);
        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const file = new File([blob], 'voice-message.webm', { type: 'audio/webm' });
          setUploadProgress(1);
          const result = await uploadToCloudinary(file, setUploadProgress);
          await supabase.from('club_messages').insert({
            channel_id: activeChannelId,
            sender_id: user.id,
            content: 'Voice Message',
            voice_url: result.url,
          });
        } catch {
          toast.error('Failed to send voice message.');
        } finally {
          setSending(false);
          setUploadProgress(0);
        }
      }, 300);
    }
  };

  const handleSend = async (overrides?: any) => {
    if (!newMessage.trim() && !chatAttachment && !editingMessage) return;
    if (!activeChannelId || !user) return;

    const slowDelay = (activeChannel?.slow_mode_delay ?? 0) * 1000;
    if (!isAdminOrMod && slowDelay > 0 && !editingMessage) {
      const elapsed = Date.now() - lastSentAtRef.current;
      if (elapsed < slowDelay) {
        const remaining = Math.ceil((slowDelay - elapsed) / 1000);
        toast.error(`Slow mode is on. Wait ${remaining}s before sending again.`);
        return;
      }
    }

    setSending(true);
    const text = newMessage.trim();

    if (editingMessage) {
      const { error } = await supabase.from('club_messages').update({
        content: text,
        is_edited: true,
      }).eq('id', editingMessage.id);

      if (error) toast.error('Could not edit message.');
      else {
        setMessages((prev: any[]) => prev.map(m => (m.id === editingMessage.id ? { ...m, content: text, is_edited: true } : m)));
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

    if (chatAttachment) {
      if (chatAttachment.file.size > 100 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 100 MB.');
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
        setChatAttachment(null);
      } catch (err: any) {
        toast.error('Upload failed: ' + (err?.message ?? 'unknown error'));
        setUploadProgress(0);
        setNewMessage(text);
        setSending(false);
        return;
      }
    }

    const payload: any = {
      channel_id: activeChannelId,
      sender_id: user.id,
      content: text || '',
      ...overrides,
    };
    if (replyingTo) payload.reply_to_id = replyingTo.id;
    if (imageUrl) payload.image_url = imageUrl;
    if (videoUrl) payload.video_url = videoUrl;
    if (pdfUrl) payload.pdf_url = pdfUrl;
    if (attachmentCaption.trim() && (imageUrl || videoUrl)) {
      payload.caption = attachmentCaption.trim();
    }

    let { error } = await supabase.from('club_messages').insert(payload);
    if (error?.code === '42703' || error?.message?.includes('column')) {
      delete payload.reply_to_id;
      delete payload.is_edited;
      ({ error } = await supabase.from('club_messages').insert(payload));
    }

    if (error) {
      toast.error('Could not send message.');
      setNewMessage(text);
    } else {
      setReplyingTo(null);
      setAttachmentCaption('');
      lastSentAtRef.current = Date.now();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (activeChannelId && user) {
        supabase.from('club_typing').delete().eq('channel_id', activeChannelId).eq('user_id', user.id).then();
      }
    }
    setSending(false);
  };

  const submitScheduledMessage = () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select both a date and time.');
      return;
    }
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    if (new Date(scheduledAt) <= new Date()) {
      toast.error('Scheduled time must be in the future.');
      return;
    }

    handleSend({
      scheduled_at: scheduledAt,
      is_silent: isSilentSend,
    });

    setShowScheduleModal(false);
    setScheduledDate('');
    setScheduledTime('');
    setIsSilentSend(false);
    toast.success(isSilentSend ? 'Message scheduled silently.' : 'Message scheduled.');
  };

  return {
    applyFormat,
    handleShareLocation,
    startRecording,
    cancelRecording,
    stopRecordingAndSend,
    handleSend,
    submitScheduledMessage,
  };
}
