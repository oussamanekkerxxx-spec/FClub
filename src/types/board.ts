export type BoardPostType = 'looking_for' | 'offering' | 'event' | 'question' | 'bounty';
export type BoardLocationPrecision = 'exact' | 'neighborhood' | 'city' | 'unknown';

export interface BoardAuthor {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  trust_tier: number;
  what_i_teach: string[];
  what_i_learn: string[];
  languages: string[];
  city: string | null;
  neighborhood: string | null;
}

export interface BoardRelationshipSignals {
  sharedSkillCount: number;
  sharedLanguageCount: number;
  hasDirectConversation: boolean;
  messagesExchanged: number;
  sharedActivityCount: number;
  trustSignalsCount: number;
  boardActionSignalsCount: number;
}

export interface BoardPost {
  id: string;
  author_id: string;
  type: BoardPostType;
  title: string;
  content: string;
  neighborhood: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_precision: BoardLocationPrecision;
  expires_at: string | null;
  created_at: string;
  author?: BoardAuthor;
  signals: BoardRelationshipSignals;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface BoardScoreBreakdown {
  skills: number;
  contact: number;
  activity: number;
  trust: number;
  actions: number;
  distance: number;
  total: number;
}

export interface BoardRankedPost extends BoardPost {
  distance_km: number | null;
  score: BoardScoreBreakdown;
  reasons: string[];
}

export interface BoardMapPoint extends BoardRankedPost {
  x: number;
  y: number;
}

export const BOARD_POST_TYPES: ReadonlyArray<{
  value: BoardPostType;
  label: string;
  color: string;
  bg: string;
}> = [
  { value: 'looking_for', label: 'Looking for', color: 'var(--color-plum)', bg: '#F3E8FF' },
  { value: 'offering', label: 'Offering', color: 'var(--color-forest)', bg: '#E8F5EE' },
  { value: 'bounty', label: 'Bounty', color: 'var(--color-amber)', bg: '#FFF3E0' },
  { value: 'event', label: 'Event', color: 'var(--color-navy)', bg: '#E3F2FD' },
  { value: 'question', label: 'Question', color: 'var(--color-text-secondary)', bg: '#F1F5F9' },
];
