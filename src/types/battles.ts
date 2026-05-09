export type BattleFormat = 'video' | 'code' | 'image' | 'text' | 'audio';
export type BattleStatus = 'open' | 'voting' | 'closed' | 'cancelled';
export type JudgeType = 'community_vote' | 'panel' | 'auto';

export interface Battle {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  topic: string;
  format: BattleFormat;
  status: BattleStatus;
  challenger_id: string | null;
  opponent_id: string | null;
  challenger_club_id: string | null;
  opponent_club_id: string | null;
  judge_type: JudgeType;
  deadline: string | null;
  winner_id: string | null;
  created_at: string;
  ended_at: string | null;
  challenger?: BattleParticipant;
  opponent?: BattleParticipant;
}

export interface BattleParticipant {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export interface BattleSubmission {
  id: string;
  battle_id: string;
  participant_id: string;
  content_url: string | null;
  description: string | null;
  votes_count: number;
  created_at: string;
  participant?: BattleParticipant;
  has_voted?: boolean;
}

export type TournamentFormat = 'single_elimination' | 'round_robin';
export type TournamentStatus = 'registering' | 'active' | 'completed' | 'cancelled';

export interface Tournament {
  id: string;
  host_club_id: string;
  opponent_club_id: string | null;
  name: string;
  format: TournamentFormat;
  max_participants: number;
  status: TournamentStatus;
  start_date: string | null;
  end_date: string | null;
  winner_club_id: string | null;
  created_at: string;
}

export interface TournamentParticipant {
  tournament_id: string;
  user_id: string;
  club_id: string;
  seed: number | null;
  status: 'active' | 'eliminated';
  profile?: BattleParticipant;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  participant_a_id: string | null;
  participant_b_id: string | null;
  winner_id: string | null;
  battle_id: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  scheduled_at: string | null;
  participant_a?: BattleParticipant;
  participant_b?: BattleParticipant;
}
