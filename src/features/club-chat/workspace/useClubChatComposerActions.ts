import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary, detectFileKind } from '@/lib/cloudinary';
import type { MathField } from '@/types/clubs';

export function useClubChatComposerActions(ctx: any) {
  const {
    clubId,
    clubCategory,
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
    setShowLearningFileModal,
    setLearningFileData,
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

      // Intercept for student clubs: show metadata modal instead of immediate send
      const isStudentClub = clubCategory === 'student' && clubId && activeChannelId;
      if (isStudentClub && !overrides?.scheduled_at) {
        const fileKind = detectFileKind(chatAttachment.file);
        const validKinds: string[] = ['pdf', 'document', 'slides', 'spreadsheet', 'video', 'audio', 'image'];
        if (!validKinds.includes(fileKind)) {
          toast.error('This file type is not supported for course linking.');
          setSending(false);
          return;
        }
        setLearningFileData({ file: chatAttachment.file, fileKind });
        setShowLearningFileModal(true);
        setSending(false);
        return;
      }

      try {
        setUploadProgress(1);
        const result = await uploadToCloudinary(chatAttachment.file, setUploadProgress);
        setUploadProgress(0);
        if (chatAttachment.type === 'image') imageUrl = result.url;
        else if (chatAttachment.type === 'video') videoUrl = result.url;
        else if (chatAttachment.type === 'pdf' || chatAttachment.type === 'document') pdfUrl = result.url;
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
    handleLearningFileSubmit: async (data: {
      file: File;
      fileKind: string;
      title: string;
      description: string;
      courseId: string;
      lessonId: string | null;
      category: string;
      mathField: MathField | null;
    }) => {
      if (!activeChannelId || !user || !clubId) return;
      
      try {
        setUploadProgress(1);
        
        // 1. Upload file
        const result = await uploadToCloudinary(data.file, setUploadProgress);
        
        // 2. Determine which message field to set based on file kind
        let payload: any = {
          channel_id: activeChannelId,
          sender_id: user.id,
          content: data.title,
        };
        
        if (data.fileKind === 'image') {
          payload.image_url = result.url;
        } else if (data.fileKind === 'video' || data.fileKind === 'audio') {
          payload.video_url = result.url;
        } else if (data.fileKind === 'pdf') {
          payload.pdf_url = result.url;
        } else {
          // For documents, slides, spreadsheet - store as pdf_url since cloudinary raw becomes accessible URL
          payload.pdf_url = result.url;
        }
        
        if (data.description.trim()) {
          payload.caption = data.description.trim();
        }
        
        // 3. Create chat message
        const { data: messageData, error: messageError } = await supabase
          .from('club_messages')
          .insert(payload)
          .select('id')
          .single();
        
        if (messageError) {
          toast.error('Could not send message.');
          setUploadProgress(0);
          return;
        }
        
        // 4. Create learning file record
        const baseSharedFilePayload = {
          club_id: clubId,
          course_id: data.courseId,
          lesson_id: data.lessonId,
          message_id: messageData?.id,
          channel_id: activeChannelId,
          uploaded_by: user.id,
          title: data.title,
          description: data.description.trim() || null,
          category: data.category.trim() || null,
          file_url: result.url,
          file_name: data.file.name,
          mime_type: data.file.type || null,
          file_kind: data.fileKind,
          storage_provider: 'cloudinary',
          storage_public_id: result.publicId,
          source: 'chat' as const,
        };

        let { error: fileError } = await supabase
          .from('club_shared_files')
          .insert({
            ...baseSharedFilePayload,
            math_field: data.mathField,
          });

        const missingMathFieldInSchema =
          fileError?.code === 'PGRST204' &&
          (fileError.message?.includes("'math_field'") ||
            fileError.message?.toLowerCase().includes('math_field'));

        if (missingMathFieldInSchema) {
          const retryResult = await supabase
            .from('club_shared_files')
            .insert(baseSharedFilePayload);

          fileError = retryResult.error;
        }

        if (fileError) {
          // Learning file linking failed, but message was sent
          console.error('Learning file linking failed:', fileError);
          toast.info('File shared in chat, but course linking failed.');
        } else {
          toast.success('File added to course!');
        }
        
        setUploadProgress(0);
        setChatAttachment(null);
        setLearningFileData(null);
        
      } catch (err: any) {
        console.error('Learning file submit error:', err);
        toast.error('Upload failed: ' + (err?.message ?? 'unknown error'));
        setUploadProgress(0);
      }
    },
  };
}
