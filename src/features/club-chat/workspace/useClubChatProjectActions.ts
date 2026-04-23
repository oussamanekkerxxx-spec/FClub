import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { isSchemaMismatchError, normaliseProject } from '@/features/club-chat/workspace/messageData';
import { normalizeHttpUrl } from '@/lib/safeUrl';
import type { EventMessagePayload, Message } from '@/features/club-chat/workspace/types';

export function useClubChatProjectActions(ctx: any) {
  const {
    user,
    clubId,
    activeChannelId,
    videoWizardFile,
    videoTitle,
    videoPlaylistId,
    videoNewPlaylistName,
    videoDuration,
    pollQuestion,
    pollOptions,
    pollIsAnonymous,
    pollMultipleAnswers,
    evtTitle,
    evtDesc,
    evtDate,
    evtOnline,
    evtStyle,
    evtLink,
    evtDuration,
    viewingApplicants,
    setSavingVideo,
    setShowVideoWizard,
    setVideoWizardFile,
    setVideoWizardPreview,
    setVideoTitle,
    setVideoPlaylistId,
    setVideoNewPlaylistName,
    setVideoDuration,
    setPlaylists,
    setSavingProject,
    setShowProjectWizard,
    setSubmittingApplication,
    setApplyingToProject,
    setSavingEvent,
    setShowEventWizard,
    setEvtTitle,
    setEvtDesc,
    setEvtDate,
    setEvtOnline,
    setEvtStyle,
    setEvtLink,
    setEvtDuration,
    setSavingPoll,
    setShowPollWizard,
    setPollQuestion,
    setPollOptions,
    setPollIsAnonymous,
    setPollMultipleAnswers,
    setMessages,
    setViewingApplicants,
  } = ctx;

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
      const response = await supabase
        .from('club_projects')
        .select(selectClause)
        .eq('id', projectId)
        .single();

      if (!response.error && response.data) {
        projectData = response.data as unknown as Record<string, unknown>;
        break;
      }

      if (!isSchemaMismatchError(response.error)) break;
    }

    const normalizedProject = projectData ? normaliseProject(projectData) : null;
    if (normalizedProject) {
      setMessages((prev: Message[]) => prev.map(m =>
        m.project?.id === projectId ? { ...m, project: normalizedProject } : m
      ));
      setViewingApplicants((prev: any) => (prev?.id === projectId ? normalizedProject : prev));
    }
  };

  const submitVideoWizard = async () => {
    if (!videoWizardFile || !videoTitle.trim()) { toast.error('Title and video are required'); return; }
    if (!activeChannelId || !user || !clubId) return;
    setSavingVideo(true);
    try {
      const result = await uploadToCloudinary(videoWizardFile, () => {});
      const videoUrl = result.url;

      let targetPlaylistId = videoPlaylistId;
      if (!targetPlaylistId && videoNewPlaylistName.trim()) {
        const { data: newPl } = await supabase.from('club_playlists')
          .insert({ club_id: clubId, title: videoNewPlaylistName.trim(), created_by: user.id })
          .select('id').single();
        if (newPl) targetPlaylistId = newPl.id;
      }
      if (!targetPlaylistId) { toast.error('Please select or create a playlist'); setSavingVideo(false); return; }

      await supabase.from('club_playlist_videos').insert({
        playlist_id: targetPlaylistId,
        title: videoTitle.trim(),
        video_url: videoUrl,
        duration_label: videoDuration || null,
        added_by: user.id,
      });
      await supabase.from('club_messages').insert({
        channel_id: activeChannelId,
        sender_id: user.id,
        content: `🎬 Shared a video: **${videoTitle.trim()}**`,
        video_url: videoUrl,
      });
      const { data: pl } = await supabase.from('club_playlists').select('id,title').eq('club_id', clubId).order('order_index');
      setPlaylists(pl ?? []);
      toast.success('Video saved to playlist!');
      setShowVideoWizard(false);
      setVideoWizardFile(null);
      setVideoWizardPreview('');
      setVideoTitle('');
      setVideoPlaylistId('');
      setVideoNewPlaylistName('');
      setVideoDuration('');
    } catch (e: any) {
      toast.error('Upload failed: ' + (e?.message ?? 'error'));
    } finally {
      setSavingVideo(false);
    }
  };

  const submitProjectWizard = async (payload: any) => {
    if (!activeChannelId || !user || !clubId) return;
    setSavingProject(true);
    try {
      const { data: messageData, error: msgErr } = await supabase.from('club_messages').insert({
        channel_id: activeChannelId,
        sender_id: user.id,
        content: `🚀 Created a new project pitch: **${payload.title}**\n\n💡 *${payload.pitch}*`,
      }).select('id').single();
      if (msgErr) throw msgErr;

      const { data: proj, error: projErr } = await supabase.from('club_projects').insert({
        club_id: clubId,
        channel_id: activeChannelId,
        creator_id: user.id,
        message_id: messageData.id,
        title: payload.title,
        pitch: payload.pitch,
        description: payload.description || '',
        start_date: payload.start_date || null,
        duration_weeks: payload.duration_weeks,
        hours_per_week: payload.hours_per_week,
        visibility: payload.visibility,
        status: 'open',
      }).select('id').single();
      if (projErr) throw projErr;

      if (payload.roles.length > 0) {
        await supabase.from('project_roles').insert(
          payload.roles.map((r: any) => ({ project_id: proj.id, title: r.title, slots_needed: r.slots_needed }))
        );
      }
      if (payload.skills.length > 0) {
        await supabase.from('project_skills').insert(
          payload.skills.map((s: string) => ({ project_id: proj.id, skill_name: s }))
        );
      }

      toast.success('Project launched successfully!');
      setShowProjectWizard(false);
    } catch (e: any) {
      toast.error('Failed to launch project: ' + (e?.message ?? 'error'));
    } finally {
      setSavingProject(false);
    }
  };

  const handleSubmitApplication = async (project: any, payload: any) => {
    if (!user) return;
    setSubmittingApplication(true);
    try {
      const { error } = await supabase.from('project_applications').insert({
        project_id: project.id,
        role_id: payload.role_id,
        user_id: user.id,
        experience: payload.experience,
        availability_hours: payload.availability_hours,
        status: 'pending',
      });
      if (error) {
        if (error.code === '23505') {
          toast.info('You already applied to this project');
        } else {
          throw error;
        }
      } else {
        toast.success('Application submitted!');
        setApplyingToProject(null);
        await refreshProjectInMessages(project.id);
      }
    } catch (e: any) {
      toast.error('Failed to submit: ' + (e?.message ?? 'error'));
    } finally {
      setSubmittingApplication(false);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: 'accepted' | 'waitlisted' | 'rejected') => {
    const { error } = await supabase
      .from('project_applications')
      .update({ status })
      .eq('id', applicationId);
    if (error) {
      toast.error('Update failed');
      return;
    }
    if (viewingApplicants) await refreshProjectInMessages(viewingApplicants.id);
  };

  const submitEventWizard = async () => {
    if (!evtTitle.trim() || !evtDate) { toast.error('Title and date are required'); return; }
    if (!activeChannelId || !user || !clubId) return;
    const safeMeetingLink = normalizeHttpUrl(evtLink);
    if (evtOnline && evtLink.trim() && !safeMeetingLink) {
      toast.error('Meeting link must start with http:// or https://');
      return;
    }

    setSavingEvent(true);
    try {
      const startsAtIso = new Date(evtDate).toISOString();
      const eventPayload = {
        club_id: clubId,
        created_by: user.id,
        title: evtTitle.trim(),
        description: evtDesc.trim() || null,
        starts_at: startsAtIso,
        format: evtOnline ? 'online' : 'in-person',
        is_online: evtOnline,
        meeting_link: evtOnline ? safeMeetingLink : null,
        duration_mins: evtDuration ? parseInt(evtDuration, 10) : null,
        event_style: evtStyle,
      };

      let createdEvent: EventMessagePayload | null = null;

      const firstAttempt = await supabase
        .from('club_events')
        .insert(eventPayload)
        .select('id, title, description, starts_at, format, event_style, meeting_link, location, duration_mins, rsvp_count, attendee_count, host_label, outcomes')
        .single();

      if (firstAttempt.error?.code === '42703') {
        const fallbackPayload = { ...eventPayload } as Record<string, unknown>;
        delete fallbackPayload.event_style;
        const fallbackAttempt = await supabase
          .from('club_events')
          .insert(fallbackPayload)
          .select('id, title, description, starts_at, format, meeting_link, location, duration_mins, rsvp_count, attendee_count, host_label, outcomes')
          .single();
        if (fallbackAttempt.error) throw fallbackAttempt.error;
        createdEvent = {
          ...(fallbackAttempt.data as Omit<EventMessagePayload, 'event_style'>),
          event_style: evtStyle,
        };
      } else if (firstAttempt.error) {
        throw firstAttempt.error;
      } else {
        createdEvent = firstAttempt.data as EventMessagePayload;
      }

      const messagePayload: Record<string, unknown> = {
        channel_id: activeChannelId,
        sender_id: user.id,
        content: `Created an event: **${evtTitle.trim()}** on ${format(new Date(evtDate), 'MMMM d, yyyy')}`,
      };
      if (createdEvent?.id) messagePayload.event_id = createdEvent.id;

      let messageInsert = await supabase.from('club_messages').insert(messagePayload);
      if (messageInsert.error?.code === '42703' && messagePayload.event_id) {
        delete messagePayload.event_id;
        messageInsert = await supabase.from('club_messages').insert(messagePayload);
      }
      if (messageInsert.error) throw messageInsert.error;

      toast.success('Event created and shared!');
      setShowEventWizard(false);
      setEvtTitle('');
      setEvtDesc('');
      setEvtDate('');
      setEvtOnline(true);
      setEvtStyle('workshop');
      setEvtLink('');
      setEvtDuration('');
    } catch (e: any) {
      toast.error('Failed: ' + (e?.message ?? 'error'));
    } finally {
      setSavingEvent(false);
    }
  };

  const submitPollWizard = async () => {
    if (!pollQuestion.trim() || !activeChannelId || !user) return;
    const validOptions = pollOptions.filter((o: string) => o.trim());
    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 options.');
      return;
    }
    setSavingPoll(true);
    try {
      const { data: msgInfo, error: msgErr } = await supabase.from('club_messages').insert({
        channel_id: activeChannelId,
        sender_id: user.id,
        content: pollQuestion.trim(),
      }).select().single();
      if (msgErr) throw msgErr;

      const { data: poll, error: pollErr } = await supabase.from('polls').insert({
        message_id: msgInfo.id,
        question: pollQuestion.trim(),
        is_anonymous: pollIsAnonymous,
        multiple_answers: pollMultipleAnswers,
      }).select().single();
      if (pollErr) throw pollErr;

      const { error: optErr } = await supabase.from('poll_options').insert(
        validOptions.map((text: string) => ({ poll_id: poll.id, text: text.trim() }))
      );
      if (optErr) throw optErr;

      toast.success('Poll created!');
      setShowPollWizard(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setPollIsAnonymous(false);
      setPollMultipleAnswers(false);
    } catch (e: any) {
      toast.error('Failed to create poll: ' + (e?.message || 'unknown'));
    } finally {
      setSavingPoll(false);
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
}
