import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { StoryMediaType } from '@/types/stories';
import { toast } from 'sonner';

export interface PostStoryPayload {
  mediaType: StoryMediaType;
  file?: File; // required if image or video
  caption?: string; // used for all types (text goes here if text type)
  backgroundGradient?: string; // fallback
  clubId?: string;
}

export function useStoryComposer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const postStory = async (payload: PostStoryPayload) => {
    if (!user) {
      toast.error('You must be logged in to post a story.');
      return false;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let mediaUrl: string | undefined;

      if ((payload.mediaType === 'image' || payload.mediaType === 'video') && payload.file) {
        // Upload to Cloudinary
        if (payload.file.size > 50 * 1024 * 1024) {
          throw new Error('File too large. Maximum size is 50MB.');
        }

        const result = await uploadToCloudinary(payload.file, setUploadProgress);
        mediaUrl = result.url;
      }

      const insertData = {
        author_id: user.id,
        club_id: payload.clubId,
        media_type: payload.mediaType,
        media_url: mediaUrl,
        caption: payload.caption,
        background_gradient: payload.backgroundGradient,
      };

      const { error } = await supabase.from('stories').insert(insertData);

      if (error) {
        throw error;
      }

      // Invalidate the active stories cache so the new story shows up
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.active() });

      toast.success('Story posted successfully!');
      return true;
    } catch (err: any) {
      toast.error('Failed to post story: ' + (err.message || 'Unknown error'));
      return false;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    postStory,
    isUploading,
    uploadProgress,
  };
}
