import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Tag, TagRelationship } from '@/types/tags';

export function usePopularTags(limit = 20) {
  return useQuery<Tag[]>({
    queryKey: ['tags', 'popular', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as Tag[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useSearchTags(query: string) {
  return useQuery<Tag[]>({
    queryKey: ['tags', 'search', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('usage_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data ?? []) as Tag[];
    },
    enabled: query.trim().length > 0,
  });
}

export function useProfileTags(profileId: string | undefined) {
  return useQuery<{ tag: Tag; relationship_type: TagRelationship }[]>({
    queryKey: ['profile', profileId, 'tags'],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from('profile_tags')
        .select(`
          relationship_type,
          tag:tags(*)
        `)
        .eq('profile_id', profileId);

      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        tag: row.tag as Tag,
        relationship_type: row.relationship_type as TagRelationship,
      }));
    },
    enabled: !!profileId,
  });
}

export function useUpdateProfileTags() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profileId,
      tags,
    }: {
      profileId: string;
      tags: { tag_id: string; relationship_type: TagRelationship }[];
    }) => {
      // Delete existing tags for this profile
      const { error: deleteError } = await supabase
        .from('profile_tags')
        .delete()
        .eq('profile_id', profileId);

      if (deleteError) throw deleteError;

      if (tags.length === 0) return;

      // Insert new tags
      const { error: insertError } = await supabase.from('profile_tags').insert(
        tags.map((t) => ({
          profile_id: profileId,
          tag_id: t.tag_id,
          relationship_type: t.relationship_type,
        }))
      );

      if (insertError) throw insertError;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['profile', variables.profileId, 'tags'] });
    },
  });
}

export function useCreateTag() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const canonical = name.trim().toLowerCase();
      const { data, error } = await supabase
        .from('tags')
        .insert({ name: canonical, canonical_name: canonical })
        .select()
        .single();

      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}
