export interface Tag {
  id: string;
  name: string;
  canonical_name: string;
  category: 'skill' | 'interest' | 'hobby' | null;
  usage_count: number;
  created_at: string;
}

export type TagRelationship = 'teach' | 'learn' | 'interest';

export interface ProfileTag {
  profile_id: string;
  tag_id: string;
  relationship_type: TagRelationship;
  tag?: Tag;
}
