export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: 'member';
  created_at: string;
}

export interface Suggestion {
  id: string;
  name: string;
  meaning: string;
  tagline?: string;
  domain_status?: 'available' | 'taken' | 'unknown' | string;
  tags?: string[];
  created_by_id: string;
  created_by_name: string;
  status: 'active' | 'archived';
  created_at: string;
  comments_count?: number;
  votes_summary?: {
    total_votes: number;
    average_score: number;
    user_scores: Record<string, number>;
  };
}

export interface VotingSession {
  id: string;
  title: string;
  description?: string;
  created_by_id: string;
  created_by_name: string;
  status: 'active' | 'completed';
  max_score: number;
  included_suggestion_ids: string[];
  started_at: string;
  ended_at?: string | null;
  winner_suggestion_id?: string | null;
  total_participants_voted?: number;
  user_voted_ids?: string[];
}

export interface Vote {
  id: string;
  session_id: string;
  suggestion_id: string;
  user_id: string;
  user_name: string;
  score: number; // 1 - 10
  note?: string;
  created_at: string;
}

export interface Comment {
  id: string;
  suggestion_id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: string;
}

export interface LeaderboardItem {
  suggestion: Suggestion;
  rank: number;
  total_score: number;
  average_score: number;
  vote_count: number;
  voters: {
    user_id: string;
    user_name: string;
    score: number;
    note?: string;
  }[];
}
