// Database types for Supabase tables used by the app.
// Regenerate with:
// npm run supabase:gen:types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      skills: {
        Row: {
          id: string;
          slug: string | null;
          teacher_id: string;
          title: string;
          category: string;
          description: string | null;
          philosophy: string | null;
          who_for: string | null;
          what_session_looks_like: string | null;
          price_per_hour: number;
          currency: string;
          format: string | null;
          location: string | null;
          neighborhood: string | null;
          languages: string[] | null;
          level: string | null;
          avg_rating: number;
          reviews_count: number;
          tags: string[] | null;
          cover_gradient: string | null;
          cover_image_url: string | null;
          is_free: boolean;
          is_group: boolean;
          max_headcount: number | null;
          current_headcount: number | null;
          availability_note: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug?: string | null;
          teacher_id: string;
          title: string;
          category: string;
          description?: string | null;
          philosophy?: string | null;
          who_for?: string | null;
          what_session_looks_like?: string | null;
          price_per_hour?: number;
          currency?: string;
          format?: string | null;
          location?: string | null;
          neighborhood?: string | null;
          languages?: string[] | null;
          level?: string | null;
          avg_rating?: number;
          reviews_count?: number;
          tags?: string[] | null;
          cover_gradient?: string | null;
          cover_image_url?: string | null;
          is_free?: boolean;
          is_group?: boolean;
          max_headcount?: number | null;
          current_headcount?: number | null;
          availability_note?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['skills']['Insert']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          avatar_url: string | null;
          bio: string | null;
          neighborhood: string | null;
          city: string | null;
          trust_tier: number;
          trust_score: number;
          sessions_completed: number | null;
          reviews_count: number | null;
        };
        Insert: {
          id: string;
          first_name?: string;
          last_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          neighborhood?: string | null;
          city?: string | null;
          trust_tier?: number;
          trust_score?: number;
          sessions_completed?: number | null;
          reviews_count?: number | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
