import { useMemo } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { isSchemaMismatchError, normaliseProject } from '@/features/club-chat/workspace/messageData';
import { normalizeHttpUrl } from '@/lib/safeUrl';
import type { EventMessagePayload, Message } from '@/features/club-chat/workspace/types';
import { getChatStore } from '@/features/club-chat/store/chatStore';

export function useChatWizards() {
  return useMemo(() => {
    const refreshProjectInMessages = async (projectId: string) => {
      const projectSelectCandidates = [
        `
          id, club_id, title, pitch, description, start_date, duration_weeks, hours_per_week, visibility, status, creator_id,
          roles:project_roles(id, title, slots_needed),
          skills:project_skills(id, skill_name),
          applications:project_applications(
            id, user_id, role_id, experience, availability_hours, status,
            user:profiles(first_name, last_name, avatar_url)
          ),
          meetings:project_meetings(id, scheduled_at, agenda, meeting_url, notes, status)
        `,
        `
          id, club_id, title, description, status, created_by, github_url, figma_url, notion_url, progress,
          roles:project_roles(id, title, slots_needed),
          skills:project_skills(id, skill_name),
          applications:project_applications(
            id, user_id, role_id, experience, availability_hours, status,
            user:profiles(first_name, last_name, avatar_url)
          ),
          meetings:project_meetings(id, scheduled_at, agenda, meeting_url, notes, status)
        `,
        'id, club_id, title, description, status, created_by',
      ];

      let projectData: Record<string, unknown> | null = null;
      for (const selectClause of projectSelectCandidates) {
        const response = await supabase.from('club_projects').select(selectClause).eq('id', projectId).single();
        if (!response.error && response.data) {
          projectData = response.data as unknown as Record<string, unknown>;
          break;
        }
        if (!isSchemaMismatchError(response.error)) break;
      }

      const normalizedProject = projectData ? normaliseProject(projectData) : null;
      if (normalizedProject) {
        const store = getChatStore();
        store.setMessages((prev: Message[]) => prev.map(m => m.project?.id === projectId ? { ...m, project: normalizedProject } : m));
        store.setProjectWizard({ viewingApplicants: store.projectWizard.viewingApplicants?.id === projectId ? normalizedProject : store.projectWizard.viewingApplicants });
      }
    };

    const submitVideoWizard = async () => {
      const store = getChatStore();
      const { videoWizard, activeChannelId, user, clubId } = store;
      if (!videoWizard.file || !videoWizard.title.trim()) { toast.error('Title and video are required'); return; }
      if (!activeChannelId || !user || !clubId) return;
      store.setVideoWizard({ saving: true });
      try {
        const result = await uploadToCloudinary(videoWizard.file, () => {});
        const videoUrl = result.url;
        let targetPlaylistId = videoWizard.playlistId;
        if (!targetPlaylistId && videoWizard.newPlaylistName.trim()) {
          const { data: newPl } = await supabase.from('club_playlists')
            .insert({ club_id: clubId, title: videoWizard.newPlaylistName.trim(), created_by: user.id })
            .select('id').single();
          if (newPl) targetPlaylistId = newPl.id;
        }
        if (!targetPlaylistId) { toast.error('Please select or create a playlist'); store.setVideoWizard({ saving: false }); return; }
        await supabase.from('club_playlist_videos').insert({
          playlist_id: targetPlaylistId, title: videoWizard.title.trim(), video_url: videoUrl,
          duration_label: videoWizard.duration || null, added_by: user.id,
        });
        await supabase.from('club_messages').insert({
          channel_id: activeChannelId, sender_id: user.id,
          content: `🎬 Shared a video: **${videoWizard.title.trim()}**`, video_url: videoUrl,
        });
        const { data: pl } = await supabase.from('club_playlists').select('id,title').eq('club_id', clubId).order('order_index');
        store.setPlaylists(pl ?? []);
        toast.success('Video saved to playlist!');
        store.setVideoWizard({ open: false, file: null, preview: '', title: '', playlistId: '', newPlaylistName: '', duration: '' });
      } catch (e: any) {
        toast.error('Upload failed: ' + (e?.message ?? 'error'));
      } finally {
        store.setVideoWizard({ saving: false });
      }
    };

    const submitProjectWizard = async (payload: any) => {
      const store = getChatStore();
      if (!store.activeChannelId || !store.user || !store.clubId) return;
      store.setProjectWizard({ saving: true });
      try {
        const { data: messageData, error: msgErr } = await supabase.from('club_messages').insert({
          channel_id: store.activeChannelId, sender_id: store.user.id,
          content: `🚀 Created a new project pitch: **${payload.title}**\n\n💡 *${payload.pitch}*`,
        }).select('id').single();
        if (msgErr) throw msgErr;
        const { data: proj, error: projErr } = await supabase.from('club_projects').insert({
          club_id: store.clubId, channel_id: store.activeChannelId, creator_id: store.user.id, message_id: messageData.id,
          title: payload.title, pitch: payload.pitch, description: payload.description || '',
          start_date: payload.start_date || null, duration_weeks: payload.duration_weeks,
          hours_per_week: payload.hours_per_week, visibility: payload.visibility, status: 'open',
        }).select('id').single();
        if (projErr) throw projErr;
        if (payload.roles.length > 0) {
          await supabase.from('project_roles').insert(payload.roles.map((r: any) => ({ project_id: proj.id, title: r.title, slots_needed: r.slots_needed })));
        }
        if (payload.skills.length > 0) {
          await supabase.from('project_skills').insert(payload.skills.map((s: string) => ({ project_id: proj.id, skill_name: s })));
        }
        toast.success('Project launched successfully!');
        store.setProjectWizard({ open: false });
      } catch (e: any) {
        toast.error('Failed to launch project: ' + (e?.message ?? 'error'));
      } finally {
        store.setProjectWizard({ saving: false });
      }
    };

    const handleSubmitApplication = async (project: any, payload: any) => {
      const store = getChatStore();
      if (!store.user) return;
      store.setProjectWizard({ submittingApplication: true });
      try {
        const { error } = await supabase.from('project_applications').insert({
          project_id: project.id, role_id: payload.role_id, user_id: store.user.id,
          experience: payload.experience, availability_hours: payload.availability_hours, status: 'pending',
        });
        if (error) {
          if (error.code === '23505') toast.info('You already applied to this project');
          else throw error;
        } else {
          toast.success('Application submitted!');
          store.setProjectWizard({ applyingTo: null });
          await refreshProjectInMessages(project.id);
        }
      } catch (e: any) {
        toast.error('Failed to submit: ' + (e?.message ?? 'error'));
      } finally {
        store.setProjectWizard({ submittingApplication: false });
      }
    };

    const handleUpdateApplicationStatus = async (applicationId: string, status: 'accepted' | 'waitlisted' | 'rejected') => {
      const { error } = await supabase.from('project_applications').update({ status }).eq('id', applicationId);
      if (error) { toast.error('Update failed'); return; }
      const store = getChatStore();
      if (store.projectWizard.viewingApplicants) await refreshProjectInMessages(store.projectWizard.viewingApplicants.id);
    };

    const submitEventWizard = async () => {
      const store = getChatStore();
      const { eventWizard, activeChannelId, user, clubId } = store;
      if (!eventWizard.title.trim() || !eventWizard.date) { toast.error('Title and date are required'); return; }
      if (!activeChannelId || !user || !clubId) return;
      const safeMeetingLink = normalizeHttpUrl(eventWizard.link);
      if (eventWizard.online && eventWizard.link.trim() && !safeMeetingLink) {
        toast.error('Meeting link must start with http:// or https://'); return;
      }
      store.setEventWizard({ saving: true });
      try {
        const startsAtIso = new Date(eventWizard.date).toISOString();
        const eventPayload = {
          club_id: clubId, created_by: user.id, title: eventWizard.title.trim(),
          description: eventWizard.description.trim() || null, starts_at: startsAtIso,
          format: eventWizard.online ? 'online' : 'in-person', is_online: eventWizard.online,
          meeting_link: eventWizard.online ? safeMeetingLink : null,
          duration_mins: eventWizard.duration ? parseInt(eventWizard.duration, 10) : null,
          event_style: eventWizard.style,
        };
        let createdEvent: EventMessagePayload | null = null;
        const firstAttempt = await supabase.from('club_events').insert(eventPayload)
          .select('id, title, description, starts_at, format, event_style, meeting_link, location, duration_mins, rsvp_count, attendee_count, host_label, outcomes').single();
        if (firstAttempt.error?.code === '42703') {
          const fallbackPayload = { ...eventPayload } as Record<string, unknown>;
          delete fallbackPayload.event_style;
          const fallbackAttempt = await supabase.from('club_events').insert(fallbackPayload)
            .select('id, title, description, starts_at, format, meeting_link, location, duration_mins, rsvp_count, attendee_count, host_label, outcomes').single();
          if (fallbackAttempt.error) throw fallbackAttempt.error;
          createdEvent = { ...(fallbackAttempt.data as Omit<EventMessagePayload, 'event_style'>), event_style: eventWizard.style };
        } else if (firstAttempt.error) {
          throw firstAttempt.error;
        } else {
          createdEvent = firstAttempt.data as EventMessagePayload;
        }
        const messagePayload: Record<string, unknown> = {
          channel_id: activeChannelId, sender_id: user.id,
          content: `Created an event: **${eventWizard.title.trim()}** on ${format(new Date(eventWizard.date), 'MMMM d, yyyy')}`,
        };
        if (createdEvent?.id) messagePayload.event_id = createdEvent.id;
        let messageInsert = await supabase.from('club_messages').insert(messagePayload);
        if (messageInsert.error?.code === '42703' && messagePayload.event_id) {
          delete messagePayload.event_id;
          messageInsert = await supabase.from('club_messages').insert(messagePayload);
        }
        if (messageInsert.error) throw messageInsert.error;
        toast.success('Event created and shared!');
        store.setEventWizard({ open: false, title: '', description: '', date: '', online: true, style: 'workshop', link: '', duration: '' });
      } catch (e: any) {
        toast.error('Failed: ' + (e?.message ?? 'error'));
      } finally {
        store.setEventWizard({ saving: false });
      }
    };

    const submitPollWizard = async () => {
      const store = getChatStore();
      const { pollWizard, activeChannelId, user } = store;
      if (!pollWizard.question.trim() || !activeChannelId || !user) return;
      const validOptions = pollWizard.options.filter((o: string) => o.trim());
      if (validOptions.length < 2) { toast.error('Please provide at least 2 options.'); return; }
      store.setPollWizard({ saving: true });
      try {
        const { data: msgInfo, error: msgErr } = await supabase.from('club_messages').insert({
          channel_id: activeChannelId, sender_id: user.id, content: pollWizard.question.trim(),
        }).select().single();
        if (msgErr) throw msgErr;
        const { data: poll, error: pollErr } = await supabase.from('polls').insert({
          message_id: msgInfo.id, question: pollWizard.question.trim(),
          is_anonymous: pollWizard.isAnonymous, multiple_answers: pollWizard.multipleAnswers,
        }).select().single();
        if (pollErr) throw pollErr;
        const { error: optErr } = await supabase.from('poll_options').insert(
          validOptions.map((text: string) => ({ poll_id: poll.id, text: text.trim() }))
        );
        if (optErr) throw optErr;
        toast.success('Poll created!');
        store.setPollWizard({ open: false, question: '', options: ['', ''], isAnonymous: false, multipleAnswers: false });
      } catch (e: any) {
        toast.error('Failed to create poll: ' + (e?.message || 'unknown'));
      } finally {
        store.setPollWizard({ saving: false });
      }
    };

    return {
      submitVideoWizard,
      submitProjectWizard,
      handleSubmitApplication,
      handleUpdateApplicationStatus,
      submitEventWizard,
      submitPollWizard,
    };
  }, []);
}
