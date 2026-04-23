export type StoryMediaType = 'image' | 'video' | 'text';

export interface Story {
  id: string;
  author_id: string;
  club_id?: string;
  media_type: StoryMediaType;
  media_url?: string;
  caption?: string;
  background_gradient?: string;
  created_at: string;
  expires_at: string;
}

export interface StoryWithAuthor extends Story {
  author: {
    first_name: string;
    last_name: string | null;
    avatar_url: string;
  };
  has_viewed?: boolean;
}

export interface UserStoryGroup {
  author_id: string;
  author: {
    first_name: string;
    last_name: string | null;
    avatar_url: string;
  };
  stories: StoryWithAuthor[];
  has_unread: boolean;
}
