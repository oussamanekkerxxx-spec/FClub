import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { CalendarDays, PlusCircle, X, Loader2, Clock, MapPin, ExternalLink, MessageSquareMore } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { ClubEvent } from '@/types/fightclub';
import type { EventStyle } from '@/types/shared';
import { normalizeHttpUrl } from '@/lib/safeUrl';

type AnnouncementRef = {
  messageId: string;
  channelId: string;
  channelName: string;
  createdAt: string;
};

type StyleMeta = {
  label: string;
  chipClass: string;
  headerClass: string;
};

const STYLE_META: Record<EventStyle, StyleMeta> = {
  workshop: {
    label: 'Workshop',
    chipClass: 'bg-amber-100 text-amber-700 border border-amber-200',
    headerClass: 'from-amber-100 to-orange-100',
  },
  sprint: {
    label: 'Sprint',
    chipClass: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    headerClass: 'from-indigo-100 to-violet-100',
  },
  showcase: {
    label: 'Showcase',
    chipClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    headerClass: 'from-emerald-100 to-teal-100',
  },
};

interface Props {
  clubId: string;
  userId: string | undefined;
  isMember: boolean;
  isModOrAdmin: boolean;
  focusEventId?: string | null;
}

export default function EventsTab({ clubId, userId, isMember, isModOrAdmin, focusEventId }: Props) {
  const navigate = useNavigate();

  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [myRsvpIds, setMyRsvpIds] = useState<Set<string>>(new Set());
  const [announcementByEventId, setAnnouncementByEventId] = useState<Record<string, AnnouncementRef>>({});

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('18:00');
  const [eventDuration, setEventDuration] = useState('60');
  const [eventDesc, setEventDesc] = useState('');
  const [eventStyle, setEventStyle] = useState<EventStyle>('workshop');
  const [eventHost, setEventHost] = useState('');
  const [eventOutcomes, setEventOutcomes] = useState('');
  const [eventIsOnline, setEventIsOnline] = useState(true);
  const [eventLink, setEventLink] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      const { data } = await supabase
        .from('club_events')
        .select('*')
        .eq('club_id', clubId)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at');

      if (cancelled) return;
      if (data) setEvents(data);
      setEventsLoaded(true);
    };

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, [clubId]);

  useEffect(() => {
    if (!focusEventId || events.some(e => e.id === focusEventId)) return;

    supabase
      .from('club_events')
      .select('*')
      .eq('id', focusEventId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setEvents(prev => {
          if (prev.some(ev => ev.id === data.id)) return prev;
          return [...prev, data].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
        });
      });
  }, [focusEventId, events]);

  const rsvpsLoadedRef = useRef(false);
  useEffect(() => {
    if (!userId || events.length === 0 || rsvpsLoadedRef.current) return;
    rsvpsLoadedRef.current = true;

    supabase
      .from('event_rsvps')
      .select('event_id')
      .eq('user_id', userId)
      .in('event_id', events.map(e => e.id))
      .then(({ data }) => {
        if (data) setMyRsvpIds(new Set(data.map((r: { event_id: string }) => r.event_id)));
      });
  }, [events, userId]);

  useEffect(() => {
    if (events.length === 0) {
      return;
    }

    const ids = events.map(e => e.id);

    supabase
      .from('club_messages')
      .select('id, event_id, channel_id, created_at, channel:club_channels!club_messages_channel_id_fkey(name)')
      .in('event_id', ids)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          if (error.code !== '42703') {
            console.error('[events announcement lookup]', error);
          }
          return;
        }

        const map: Record<string, AnnouncementRef> = {};
        for (const row of data ?? []) {
          const eventId = row.event_id as string | null;
          if (!eventId || map[eventId]) continue;
          const channelRaw = row.channel as { name?: string } | Array<{ name?: string }> | null;
          const channel = Array.isArray(channelRaw) ? channelRaw[0] : channelRaw;
          map[eventId] = {
            messageId: row.id as string,
            channelId: row.channel_id as string,
            channelName: channel?.name ?? 'chat',
            createdAt: row.created_at as string,
          };
        }
        setAnnouncementByEventId(map);
      });
  }, [events]);

  const resetCreateEvent = () => {
    setShowCreateEvent(false);
    setEventTitle('');
    setEventDate('');
    setEventTime('18:00');
    setEventDuration('60');
    setEventDesc('');
    setEventStyle('workshop');
    setEventHost('');
    setEventOutcomes('');
    setEventIsOnline(true);
    setEventLink('');
    setEventLocation('');
  };

  const handleCreateEvent = async () => {
    if (!userId || !eventTitle.trim() || !eventDate) return;
    const safeMeetingLink = normalizeHttpUrl(eventLink);
    if (eventIsOnline && eventLink.trim() && !safeMeetingLink) {
      toast.error('Meeting link must start with http:// or https://');
      return;
    }

    setCreatingEvent(true);

    const startsAtIso = new Date(`${eventDate}T${eventTime}`).toISOString();
    const payload = {
      club_id: clubId,
      created_by: userId,
      title: eventTitle.trim(),
      description: eventDesc.trim() || null,
      starts_at: startsAtIso,
      duration_mins: parseInt(eventDuration, 10) || 60,
      format: eventIsOnline ? 'online' : 'in-person',
      is_online: eventIsOnline,
      meeting_link: eventIsOnline ? safeMeetingLink : null,
      location: !eventIsOnline ? eventLocation.trim() || null : null,
      event_style: eventStyle,
      host_label: eventHost.trim() || null,
      outcomes: eventOutcomes.trim() || null,
    };

    let result = await supabase
      .from('club_events')
      .insert(payload)
      .select('*')
      .single();

    if (result.error?.code === '42703') {
      const fallbackPayload = { ...payload } as Record<string, unknown>;
      delete fallbackPayload.event_style;
      delete fallbackPayload.host_label;
      delete fallbackPayload.outcomes;
      result = await supabase
        .from('club_events')
        .insert(fallbackPayload)
        .select('*')
        .single();
    }

    const { data, error } = result;

    if (error) {
      toast.error('Could not create event. Check DB migrations are applied.');
      console.error('[handleCreateEvent]', error);
    } else {
      setEvents(prev => [...prev, data].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()));
      resetCreateEvent();
      toast.success('Event created!');
    }

    setCreatingEvent(false);
  };

  const handleRsvp = async (eventId: string) => {
    if (!userId) return;

    const already = myRsvpIds.has(eventId);
    if (already) {
      await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', userId);
      setMyRsvpIds(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, rsvp_count: Math.max(0, (e.rsvp_count ?? 0) - 1) } : e));
      return;
    }

    await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: userId });
    setMyRsvpIds(prev => new Set([...prev, eventId]));
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, rsvp_count: (e.rsvp_count ?? 0) + 1 } : e));
  };

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [events]
  );

  return (
    <div className="space-y-3">
      {isModOrAdmin && (
        <div className="sc-card p-4">
          {!showCreateEvent ? (
            <button
              onClick={() => setShowCreateEvent(true)}
              className="flex items-center gap-2 text-sm font-semibold w-full justify-center py-2 rounded-xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-amber)] hover:text-[var(--color-amber)] transition-all"
            >
              <PlusCircle className="w-4 h-4" /> New Event
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-navy text-sm">Create Event</h3>
                <button onClick={resetCreateEvent} className="text-[var(--color-text-muted)] hover:text-navy">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                value={eventTitle}
                onChange={e => setEventTitle(e.target.value)}
                placeholder="Event title *"
                className="input-sc text-sm w-full"
              />

              <textarea
                value={eventDesc}
                onChange={e => setEventDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="input-sc text-sm w-full resize-none"
              />

              <div className="grid grid-cols-3 gap-2">
                {(['workshop', 'sprint', 'showcase'] as EventStyle[]).map(style => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setEventStyle(style)}
                    className={`px-2 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                      eventStyle === style
                        ? 'bg-[var(--color-navy)] text-white'
                        : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-parchment'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Date *</label>
                  <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="input-sc text-sm w-full" />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Time</label>
                  <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className="input-sc text-sm w-full" />
                </div>
              </div>

              <input
                type="number"
                value={eventDuration}
                min="15"
                step="15"
                onChange={e => setEventDuration(e.target.value)}
                placeholder="Duration in minutes"
                className="input-sc text-sm w-full"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  value={eventHost}
                  onChange={e => setEventHost(e.target.value)}
                  placeholder="Host label (optional)"
                  className="input-sc text-sm w-full"
                />
                <input
                  value={eventOutcomes}
                  onChange={e => setEventOutcomes(e.target.value)}
                  placeholder="Expected outcomes"
                  className="input-sc text-sm w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setEventIsOnline(true)}
                  className={`p-2.5 rounded-xl border-2 text-sm font-semibold transition-all text-left ${
                    eventIsOnline
                      ? 'border-[var(--color-amber)] bg-amber-50 text-[var(--color-amber)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-300'
                  }`}
                >
                  Online
                </button>
                <button
                  onClick={() => setEventIsOnline(false)}
                  className={`p-2.5 rounded-xl border-2 text-sm font-semibold transition-all text-left ${
                    !eventIsOnline
                      ? 'border-[var(--color-amber)] bg-amber-50 text-[var(--color-amber)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-300'
                  }`}
                >
                  In-person
                </button>
              </div>

              {eventIsOnline ? (
                <input
                  value={eventLink}
                  onChange={e => setEventLink(e.target.value)}
                  placeholder="Meeting link"
                  className="input-sc text-sm w-full"
                />
              ) : (
                <input
                  value={eventLocation}
                  onChange={e => setEventLocation(e.target.value)}
                  placeholder="Location"
                  className="input-sc text-sm w-full"
                />
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={resetCreateEvent}
                  className="flex-1 py-2 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEvent}
                  disabled={creatingEvent || !eventTitle.trim() || !eventDate}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:scale-[1.02]"
                  style={{ background: 'var(--color-navy)' }}
                >
                  {creatingEvent ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Event'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!eventsLoaded ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="sc-card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="sc-card p-10 text-center">
          <CalendarDays className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
          <p className="text-[var(--color-text-secondary)] text-sm">No upcoming events scheduled.</p>
        </div>
      ) : (
        sortedEvents.map(event => {
          const eventStyleValue: EventStyle = event.event_style ?? 'workshop';
          const style = STYLE_META[eventStyleValue];
          const rsvped = myRsvpIds.has(event.id);
          const announcement = announcementByEventId[event.id];
          const highlighted = !!focusEventId && focusEventId === event.id;
          const safeMeetingLink = normalizeHttpUrl(event.meeting_link);

          return (
            <div
              key={event.id}
              className={`sc-card p-0 overflow-hidden ${highlighted ? 'ring-2 ring-[var(--color-amber)] ring-offset-2 ring-offset-white' : ''}`}
            >
              <div className={`px-4 py-2 bg-gradient-to-r ${style.headerClass} border-b border-[var(--color-border)] flex items-center justify-between`}>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${style.chipClass}`}>
                  {style.label}
                </span>
                <span className="text-xs text-[var(--color-text-muted)] font-medium">
                  {event.host_label || 'Club event'}
                </span>
              </div>

              <div className="p-5 flex items-start gap-4">
                <div className="flex-shrink-0 w-12 text-center rounded-xl overflow-hidden border border-[var(--color-border)]">
                  <div className="text-xs font-bold uppercase py-1" style={{ background: 'var(--color-navy)', color: 'white' }}>
                    {format(new Date(event.starts_at), 'MMM')}
                  </div>
                  <div className="font-heading font-bold text-xl text-navy py-1">
                    {format(new Date(event.starts_at), 'd')}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-navy">{event.title}</h3>

                  {event.description && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">{event.description}</p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-muted)] flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {format(new Date(event.starts_at), 'HH:mm')}
                      {event.duration_mins ? ` • ${event.duration_mins}min` : ''}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {event.location}
                      </span>
                    )}
                    {safeMeetingLink && (
                      <a
                        href={safeMeetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[var(--color-amber)] font-semibold hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Join link
                      </a>
                    )}
                    <span className="font-medium">
                      {event.format === 'online' ? 'Online' : event.format === 'both' ? 'Hybrid' : 'In-person'}
                    </span>
                  </div>

                  {event.outcomes && (
                    <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                      <span className="font-semibold">Outcomes:</span> {event.outcomes}
                    </p>
                  )}

                  {announcement && (
                    <button
                      onClick={() =>
                        navigate(`/app/club/${clubId}/chat`, {
                          state: {
                            focusChannelId: announcement.channelId,
                            focusMessageId: announcement.messageId,
                          },
                        })
                      }
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-navy)] hover:text-[var(--color-amber)] transition-colors"
                    >
                      <MessageSquareMore className="w-3.5 h-3.5" />
                      Announced in #{announcement.channelName}
                    </button>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {event.rsvp_count ?? event.attendee_count ?? 0} going
                  </span>
                  {isMember && (
                    <button
                      onClick={() => handleRsvp(event.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                        rsvped
                          ? 'bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-500'
                          : 'btn-amber'
                      }`}
                      style={!rsvped ? { padding: '6px 12px' } : {}}
                    >
                      {rsvped ? 'Going' : 'RSVP'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
