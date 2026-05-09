import React from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { reportError } from '@/lib/errors';
import { uploadToCloudinary, detectFileKind } from '@/lib/cloudinary';
import type { ChatStoreState } from './types';

export function createComposerActions(
  set: (fn: (draft: ChatStoreState) => void) => void,
  get: () => any
) {
  return {
    // ── Direct field setters ──
    setComposerText: (text: string) =>
      set((draft) => { draft.composer.text = text; }),
    setComposerAttachment: (attachment: import('@/features/club-chat/workspace/types').ChatAttachment | null) =>
      set((draft) => { draft.composer.attachment = attachment; }),
    setComposerCaption: (caption: string) =>
      set((draft) => { draft.composer.caption = caption; }),
    setComposerReplyingTo: (msg: import('@/features/club-chat/workspace/types').Message | null) =>
      set((draft) => { draft.composer.replyingTo = msg; }),
    setComposerEditing: (msg: import('@/features/club-chat/workspace/types').Message | null) =>
      set((draft) => { draft.composer.editing = msg; }),
    setComposerSending: (sending: boolean) =>
      set((draft) => { draft.composer.sending = sending; }),
    setComposerUploadProgress: (progress: number) =>
      set((draft) => { draft.composer.uploadProgress = progress; }),
    setComposerShowAttachMenu: (show: boolean) =>
      set((draft) => { draft.composer.showAttachMenu = show; }),
    setComposerIsRecording: (recording: boolean) =>
      set((draft) => { draft.composer.isRecording = recording; }),
    setComposerRecordingTime: (time: number) =>
      set((draft) => { draft.composer.recordingTime = time; }),
    setComposerFocused: (focused: boolean) =>
      set((draft) => { draft.composer.focused = focused; }),
    setLastSentAt: (time: number) =>
      set((draft) => { draft.lastSentAt = time; }),

    // ── Apply text format (bold, italic, etc.) ──
    applyFormat: (syntax: string, textareaRef: React.RefObject<HTMLTextAreaElement | null>) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const state = get();
      const text = state.composer.text;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = text.substring(start, end);
      const inner = selected || 'text';
      const formatted = `${syntax}${inner}${syntax}`;
      const next = text.substring(0, start) + formatted + text.substring(end);
      set((draft) => { draft.composer.text = next; });
      setTimeout(() => {
        textarea.focus();
        const cursor = start + syntax.length + inner.length + syntax.length;
        textarea.setSelectionRange(cursor, cursor);
      }, 0);
    },

    // ── Share location ──
    handleShareLocation: async () => {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser.');
        return;
      }
      toast.info('Requesting location...');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const state = get();
          if (!state.activeChannelId || !state.user) return;
          const { latitude, longitude } = position.coords;
          const { error } = await supabase.from('club_messages').insert({
            channel_id: state.activeChannelId,
            sender_id: state.user.id,
            content: 'Shared Location',
            location_lat: latitude,
            location_lng: longitude,
          });
          if (error) toast.error('Failed to share location.');
          else toast.success('Location shared!');
          set((draft) => { draft.composer.showAttachMenu = false; });
        },
        (error) => toast.error('Location error: ' + error.message)
      );
    },

    // ── Start voice recording ──
    startRecording: async (
      mediaRecorderRef: React.RefObject<MediaRecorder | null>,
      audioChunksRef: React.RefObject<BlobPart[]>,
      recordingTimerRef: React.RefObject<ReturnType<typeof setInterval> | null>
    ) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current!.push(e.data);
        };
        mediaRecorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
        };
        mediaRecorder.start(100);
        set((draft) => {
          draft.composer.isRecording = true;
          draft.composer.recordingTime = 0;
        });
        recordingTimerRef.current = setInterval(() => {
          const current = get().composer.recordingTime;
          set((draft) => { draft.composer.recordingTime = current + 1; });
        }, 1000);
      } catch {
        toast.error('Microphone access denied.');
      }
    },

    // ── Cancel voice recording ──
    cancelRecording: (
      mediaRecorderRef: React.RefObject<MediaRecorder | null>,
      recordingTimerRef: React.RefObject<ReturnType<typeof setInterval> | null>
    ) => {
      if (mediaRecorderRef.current && get().composer.isRecording) {
        mediaRecorderRef.current.stop();
        set((draft) => { draft.composer.isRecording = false; });
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      }
    },

    // ── Stop recording and send voice message ──
    stopRecordingAndSend: async (
      mediaRecorderRef: React.RefObject<MediaRecorder | null>,
      audioChunksRef: React.RefObject<BlobPart[]>,
      recordingTimerRef: React.RefObject<ReturnType<typeof setInterval> | null>
    ) => {
      if (mediaRecorderRef.current && get().composer.isRecording) {
        mediaRecorderRef.current.stop();
        set((draft) => { draft.composer.isRecording = false; });
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setTimeout(async () => {
          const state = get();
          if (!state.activeChannelId || !state.user) return;
          set((draft) => { draft.composer.sending = true; });
          try {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const file = new File([blob], 'voice-message.webm', { type: 'audio/webm' });
            set((draft) => { draft.composer.uploadProgress = 1; });
            const result = await uploadToCloudinary(file, (progress) => {
              set((draft) => { draft.composer.uploadProgress = progress; });
            });

            const tempId = `temp-audio-${Date.now()}`;
            const optimisticMsg: any = {
              id: tempId,
              channel_id: state.activeChannelId,
              sender_id: state.user.id,
              content: 'Voice Message',
              voice_url: result.url,
              sender: {
                first_name: (state.user as any).firstName ?? '',
                last_name: (state.user as any).lastName ?? '',
                avatar_url: (state.user as any).avatarUrl ?? null,
              },
              created_at: new Date().toISOString(),
            };
            set((draft) => { draft.messages = [...draft.messages, optimisticMsg]; });

            const { data, error } = await supabase.from('club_messages').insert({
              channel_id: state.activeChannelId,
              sender_id: state.user.id,
              content: 'Voice Message',
              voice_url: result.url,
            }).select().single();

            if (error) throw error;

            if (data) {
              set((draft) => {
                draft.messages = draft.messages.map((m) =>
                  m.id === tempId ? { ...data, sender: optimisticMsg.sender } : m
                );
              });
            }
          } catch {
            toast.error('Failed to send voice message.');
            set((draft) => {
              draft.messages = draft.messages.filter((m) => !String(m.id).startsWith('temp-audio-'));
            });
          } finally {
            set((draft) => {
              draft.composer.sending = false;
              draft.composer.uploadProgress = 0;
            });
          }
        }, 300);
      }
    },

    // ── Main send handler ──
    handleSend: async (
      overrides?: any,
      typingTimerRef?: React.RefObject<ReturnType<typeof setTimeout> | null>
    ) => {
      const state = get();
      const { composer, activeChannelId, user, clubId, clubCategory, channels, lastSentAt } = state;

      if (!composer.text.trim() && !composer.attachment && !composer.editing) return;
      if (!activeChannelId || !user) return;

      const activeChannel = channels.find((c: import('@/features/club-chat/workspace/types').Channel) => c.id === activeChannelId);
      const slowDelay = (activeChannel?.slow_mode_delay ?? 0) * 1000;
      if (!state.ui.isAdminOrMod && slowDelay > 0 && !composer.editing) {
        const elapsed = Date.now() - lastSentAt;
        if (elapsed < slowDelay) {
          const remaining = Math.ceil((slowDelay - elapsed) / 1000);
          toast.error(`Slow mode is on. Wait ${remaining}s before sending again.`);
          return;
        }
      }

      set((draft) => { draft.composer.sending = true; });
      const text = composer.text.trim();

      if (composer.editing) {
        const { error } = await supabase.from('club_messages').update({
          content: text,
          is_edited: true,
        }).eq('id', composer.editing.id);

        if (error) toast.error('Could not edit message.');
        else {
          set((draft) => {
            draft.messages = draft.messages.map((m) =>
              m.id === composer.editing!.id ? { ...m, content: text, is_edited: true } : m
            );
            draft.composer.editing = null;
            draft.composer.text = '';
          });
        }
        set((draft) => { draft.composer.sending = false; });
        return;
      }

      set((draft) => { draft.composer.text = ''; });

      let imageUrl: string | null = null;
      let videoUrl: string | null = null;
      let pdfUrl: string | null = null;
      let imageWidth: number | undefined;
      let imageHeight: number | undefined;
      let videoWidth: number | undefined;
      let videoHeight: number | undefined;

      if (composer.attachment) {
        if (composer.attachment.file.size > 100 * 1024 * 1024) {
          toast.error('File is too large. Maximum size is 100 MB.');
          set((draft) => {
            draft.composer.text = text;
            draft.composer.sending = false;
          });
          return;
        }

        const isStudentClub = clubCategory === 'student' && clubId && activeChannelId;
        if (isStudentClub && !overrides?.scheduled_at) {
          const fileKind = detectFileKind(composer.attachment.file);
          const validKinds: string[] = ['pdf', 'document', 'slides', 'spreadsheet', 'video', 'audio', 'image'];
          if (!validKinds.includes(fileKind)) {
            toast.error('This file type is not supported for course linking.');
            set((draft) => { draft.composer.sending = false; });
            return;
          }
          set((draft) => {
            draft.learningFileModal.data = { file: composer.attachment!.file, fileKind };
            draft.learningFileModal.open = true;
            draft.composer.sending = false;
          });
          return;
        }

        try {
          set((draft) => { draft.composer.uploadProgress = 1; });
          const result = await uploadToCloudinary(composer.attachment.file, (progress) => {
            set((draft) => { draft.composer.uploadProgress = progress; });
          });
          set((draft) => { draft.composer.uploadProgress = 0; });
          if (composer.attachment.type === 'image') {
            imageUrl = result.url;
            const img = new Image();
            img.src = URL.createObjectURL(composer.attachment.file);
            await new Promise((resolve) => {
              img.onload = () => {
                imageWidth = img.naturalWidth;
                imageHeight = img.naturalHeight;
                resolve(true);
              };
              img.onerror = () => resolve(true);
            });
          } else if (composer.attachment.type === 'video') {
            videoUrl = result.url;
            const vid = document.createElement('video');
            vid.src = URL.createObjectURL(composer.attachment.file);
            await new Promise((resolve) => {
              vid.onloadedmetadata = () => {
                videoWidth = vid.videoWidth;
                videoHeight = vid.videoHeight;
                resolve(true);
              };
              vid.onerror = () => resolve(true);
            });
          } else if (composer.attachment.type === 'pdf' || composer.attachment.type === 'document') {
            pdfUrl = result.url;
          }
          set((draft) => { draft.composer.attachment = null; });
        } catch (err: any) {
          toast.error('Upload failed: ' + (err?.message ?? 'unknown error'));
          set((draft) => {
            draft.composer.uploadProgress = 0;
            draft.composer.text = text;
            draft.composer.sending = false;
          });
          return;
        }
      }

      const payload: any = {
        channel_id: activeChannelId,
        sender_id: user.id,
        content: text || '',
        ...overrides,
      };
      if (composer.replyingTo) payload.reply_to_id = composer.replyingTo.id;
      if (imageUrl) {
        payload.image_url = imageUrl;
        if (imageWidth) payload.image_width = imageWidth;
        if (imageHeight) payload.image_height = imageHeight;
      }
      if (videoUrl) {
        payload.video_url = videoUrl;
        if (videoWidth) payload.video_width = videoWidth;
        if (videoHeight) payload.video_height = videoHeight;
      }
      if (pdfUrl) payload.pdf_url = pdfUrl;
      if (composer.caption.trim() && (imageUrl || videoUrl)) {
        payload.caption = composer.caption.trim();
      }

      // ── Optimistic UI ──
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: any = {
        ...payload,
        id: tempId,
        created_at: new Date().toISOString(),
        sender: {
          first_name: (user as any).firstName ?? '',
          last_name: (user as any).lastName ?? '',
          avatar_url: (user as any).avatarUrl ?? null,
        },
        reactions: [],
        is_edited: false,
        deleted_at: null,
        reply_to_message: composer.replyingTo ?? null,
      };
      set((draft) => { draft.messages = [...draft.messages, optimisticMsg]; });
      set((draft) => {
        draft.composer.replyingTo = null;
        draft.composer.caption = '';
      });

      let { data: insertedRow, error } = await supabase
        .from('club_messages')
        .insert(payload)
        .select('id, created_at')
        .single();

      if (error?.code === '42703' || error?.message?.includes('column')) {
        delete payload.reply_to_id;
        delete payload.is_edited;
        const retry = await supabase
          .from('club_messages')
          .insert(payload)
          .select('id, created_at')
          .single();
        insertedRow = retry.data;
        error = retry.error;
      }

      if (error) {
        toast.error('Could not send message.');
        set((draft) => {
          draft.messages = draft.messages.filter((m) => m.id !== tempId);
          draft.composer.text = text;
        });
      } else {
        if (insertedRow?.id) {
          set((draft) => {
            draft.messages = draft.messages.map((m) =>
              m.id === tempId ? { ...m, id: insertedRow!.id, created_at: insertedRow!.created_at } : m
            );
          });
        }
        set((draft) => { draft.lastSentAt = Date.now(); });
        if (typingTimerRef?.current) clearTimeout(typingTimerRef.current);
        if (activeChannelId && user) {
          supabase.from('club_typing').delete().eq('channel_id', activeChannelId).eq('user_id', user.id).then();
        }
      }
      set((draft) => { draft.composer.sending = false; });
    },

    // ── Submit scheduled message ──
    submitScheduledMessage: () => {
      const state = get();
      if (!state.scheduleModal.date || !state.scheduleModal.time) {
        toast.error('Please select both a date and time.');
        return;
      }
      const scheduledAt = new Date(`${state.scheduleModal.date}T${state.scheduleModal.time}`).toISOString();
      if (new Date(scheduledAt) <= new Date()) {
        toast.error('Scheduled time must be in the future.');
        return;
      }

      const { handleSend } = get();
      handleSend({
        scheduled_at: scheduledAt,
        is_silent: state.scheduleModal.isSilent,
      });

      set((draft) => {
        draft.scheduleModal.open = false;
        draft.scheduleModal.date = '';
        draft.scheduleModal.time = '';
        draft.scheduleModal.isSilent = false;
      });
      toast.success(state.scheduleModal.isSilent ? 'Message scheduled silently.' : 'Message scheduled.');
    },

    // ── Handle learning file submit ──
    handleLearningFileSubmit: async (data: {
      file: File;
      fileKind: string;
      title: string;
      description: string;
      courseId: string;
      lessonId: string | null;
      category: string;
      mathField: import('@/types/clubs').MathField | null;
    }) => {
      const state = get();
      if (!state.activeChannelId || !state.user || !state.clubId) return;

      try {
        set((draft) => { draft.composer.uploadProgress = 1; });
        const result = await uploadToCloudinary(data.file, (progress) => {
          set((draft) => { draft.composer.uploadProgress = progress; });
        });

        let payload: any = {
          channel_id: state.activeChannelId,
          sender_id: state.user.id,
          content: data.title,
        };

        if (data.fileKind === 'image') {
          payload.image_url = result.url;
        } else if (data.fileKind === 'video' || data.fileKind === 'audio') {
          payload.video_url = result.url;
        } else if (data.fileKind === 'pdf') {
          payload.pdf_url = result.url;
        } else {
          payload.pdf_url = result.url;
        }

        if (data.description.trim()) {
          payload.caption = data.description.trim();
        }

        const { data: messageData, error: messageError } = await supabase
          .from('club_messages')
          .insert(payload)
          .select('id')
          .single();

        if (messageError) {
          toast.error('Could not send message.');
          set((draft) => { draft.composer.uploadProgress = 0; });
          return;
        }

        const baseSharedFilePayload = {
          club_id: state.clubId,
          course_id: data.courseId,
          lesson_id: data.lessonId,
          message_id: messageData?.id,
          channel_id: state.activeChannelId,
          uploaded_by: state.user.id,
          title: data.title,
          description: data.description.trim() || null,
          category: data.category.trim() || null,
          file_url: result.url,
          file_name: data.file.name,
          mime_type: data.file.type || null,
          file_kind: data.fileKind,
          storage_provider: 'cloudinary' as const,
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
          reportError('composerActions:fileLink', fileError);
          toast.info('File shared in chat, but course linking failed.');
        } else {
          toast.success('File added to course!');
        }

        set((draft) => {
          draft.composer.uploadProgress = 0;
          draft.composer.attachment = null;
          draft.learningFileModal.data = null;
        });
      } catch (err: any) {
        reportError('composerActions:submit', err);
        toast.error('Upload failed: ' + (err?.message ?? 'unknown error'));
        set((draft) => { draft.composer.uploadProgress = 0; });
      }
    },
  };
}
