import type { ClubProject } from '@/components/chat/ProjectBubble';
import type { Poll } from '@/types/messaging';
import type {
  EventMessagePayload,
  Message,
  SelectError,
} from '@/features/club-chat/workspace/types';

const MESSAGE_BASE_FIELDS = `
  id, channel_id, sender_id, content, image_url, video_url, pdf_url, voice_url, location_lat, location_lng,
  created_at, reply_to_id, is_edited, deleted_at, caption, forwarded_from_id, forwarded_from_name
`;

const MESSAGE_RELATIONS_SELECT = `
  sender:profiles!club_messages_sender_id_fkey(first_name, last_name, avatar_url),
  reactions:message_reactions(id, user_id, emoji),
  poll:polls(id, question, is_anonymous, multiple_answers, options:poll_options(id, text, votes:poll_votes(id, user_id)))
`;

const PROJECT_RELATIONS_SELECT = `
  roles:project_roles(id, title, slots_needed),
  skills:project_skills(id, skill_name),
  applications:project_applications(id, user_id, role_id, experience, availability_hours, status),
  meetings:project_meetings(id, scheduled_at, agenda, meeting_url, notes, status)
`;

const PROJECT_SELECT_MODERN = `
  project:club_projects(
    id, club_id, title, pitch, description, start_date, duration_weeks, hours_per_week, visibility, status, creator_id,
    ${PROJECT_RELATIONS_SELECT}
  )
`;

const PROJECT_SELECT_LEGACY = `
  project:club_projects(
    id, club_id, title, description, status, created_by, github_url, figma_url, notion_url, progress,
    ${PROJECT_RELATIONS_SELECT}
  )
`;

const EVENT_SELECT_MODERN = `
  event:club_events!club_messages_event_id_fkey(
    id, title, description, starts_at, format, event_style, meeting_link, location, duration_mins,
    rsvp_count, attendee_count, host_label, outcomes
  )
`;

const EVENT_SELECT_LEGACY = `
  event:club_events!club_messages_event_id_fkey(
    id, title, description, starts_at, format, meeting_link, location, duration_mins,
    rsvp_count, attendee_count
  )
`;

function buildMessageSelect({
  includeEventId,
  projectSchema,
  eventSchema,
}: {
  includeEventId: boolean;
  projectSchema: 'modern' | 'legacy' | null;
  eventSchema: 'modern' | 'legacy' | null;
}): string {
  const parts = [
    MESSAGE_BASE_FIELDS,
    includeEventId ? 'event_id' : null,
    MESSAGE_RELATIONS_SELECT,
    projectSchema === 'modern'
      ? PROJECT_SELECT_MODERN
      : projectSchema === 'legacy'
      ? PROJECT_SELECT_LEGACY
      : null,
    eventSchema === 'modern'
      ? EVENT_SELECT_MODERN
      : eventSchema === 'legacy'
      ? EVENT_SELECT_LEGACY
      : null,
  ].filter((part): part is string => Boolean(part));

  return parts.join(',\n      ');
}

export const MESSAGE_SELECT_CANDIDATES = [
  buildMessageSelect({ includeEventId: true, projectSchema: 'modern', eventSchema: 'modern' }),
  buildMessageSelect({ includeEventId: true, projectSchema: 'modern', eventSchema: 'legacy' }),
  buildMessageSelect({ includeEventId: true, projectSchema: 'legacy', eventSchema: 'modern' }),
  buildMessageSelect({ includeEventId: true, projectSchema: 'legacy', eventSchema: 'legacy' }),
  buildMessageSelect({ includeEventId: false, projectSchema: 'legacy', eventSchema: null }),
  buildMessageSelect({ includeEventId: false, projectSchema: null, eventSchema: null }),
];

export function isSchemaMismatchError(error: SelectError): boolean {
  if (!error) return false;
  if (error.code === '42703' || error.code === '42P01' || error.code === 'PGRST200' || error.code === 'PGRST204') {
    return true;
  }
  return /column|relation|does not exist|could not find/i.test(error.message ?? '');
}

export function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function normaliseProject(projectValue: unknown): ClubProject | null {
  const project = unwrapRelation(projectValue as Record<string, unknown> | Record<string, unknown>[] | null);
  if (!project) return null;

  const creatorId = typeof project.creator_id === 'string'
    ? project.creator_id
    : typeof project.created_by === 'string'
    ? project.created_by
    : '';

  return {
    ...(project as unknown as ClubProject),
    id: typeof project.id === 'string' ? project.id : '',
    club_id: typeof project.club_id === 'string' ? project.club_id : '',
    title: typeof project.title === 'string' ? project.title : 'Untitled Project',
    pitch: typeof project.pitch === 'string'
      ? project.pitch
      : typeof project.description === 'string'
      ? project.description
      : '',
    description: typeof project.description === 'string' ? project.description : '',
    visibility: typeof project.visibility === 'string' ? project.visibility : 'club',
    status: typeof project.status === 'string' ? project.status : 'open',
    creator_id: creatorId,
  };
}

export function normaliseEvent(eventValue: unknown): EventMessagePayload | null {
  const event = unwrapRelation(eventValue as Record<string, unknown> | Record<string, unknown>[] | null);
  if (!event || typeof event.id !== 'string' || typeof event.title !== 'string') return null;

  return {
    id: event.id,
    title: event.title,
    description: typeof event.description === 'string' || event.description === null ? event.description : null,
    starts_at: typeof event.starts_at === 'string' ? event.starts_at : new Date().toISOString(),
    format:
      event.format === 'online' || event.format === 'in-person' || event.format === 'both'
        ? event.format
        : 'online',
    event_style:
      event.event_style === 'workshop' || event.event_style === 'sprint' || event.event_style === 'showcase'
        ? event.event_style
        : 'workshop',
    meeting_link: typeof event.meeting_link === 'string' || event.meeting_link === null ? event.meeting_link : null,
    location: typeof event.location === 'string' || event.location === null ? event.location : null,
    duration_mins: typeof event.duration_mins === 'number' ? event.duration_mins : null,
    rsvp_count: typeof event.rsvp_count === 'number' ? event.rsvp_count : 0,
    attendee_count: typeof event.attendee_count === 'number' ? event.attendee_count : 0,
    host_label: typeof event.host_label === 'string' || event.host_label === null ? event.host_label : null,
    outcomes: typeof event.outcomes === 'string' || event.outcomes === null ? event.outcomes : null,
  };
}

export function normaliseMessageRow(row: Record<string, unknown>): Message {
  return {
    ...(row as unknown as Message),
    sender: unwrapRelation(row.sender as Message['sender'] | Message['sender'][] | null) ?? undefined,
    poll: unwrapRelation(row.poll as Poll | Poll[] | null),
    project: normaliseProject(row.project),
    event: normaliseEvent(row.event),
  };
}
