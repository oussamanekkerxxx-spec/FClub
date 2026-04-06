import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { reportError } from '@/lib/errors';

interface UploadOptions {
  bucket: string;
  /** Max file size in bytes. Defaults to 5 MB. */
  maxBytes?: number;
  /** Allowed MIME types (e.g. image/png). If omitted, all MIME types are allowed. */
  allowedMimeTypes?: string[];
  /** Allowed filename extensions (without dot). Used as fallback when MIME is absent. */
  allowedExtensions?: string[];
  /** Supabase profile field to update after upload (e.g. 'avatar_url') */
  profileField?: string;
  /** Called with the public URL after a successful upload */
  onSuccess?: (publicUrl: string) => void;
}

/**
 * Reusable hook for uploading files to Supabase Storage and
 * optionally writing the resulting URL back to the profiles table.
 *
 * Usage:
 *   const { uploading, upload } = useStorageUpload({
 *     bucket: 'avatars',
 *     maxBytes: 2 * 1024 * 1024,
 *     profileField: 'avatar_url',
 *     onSuccess: (url) => updateUser({ avatar: url }),
 *   });
 */
export function useStorageUpload({
  bucket,
  maxBytes = 5 * 1024 * 1024,
  allowedMimeTypes,
  allowedExtensions,
  profileField,
  onSuccess,
}: UploadOptions) {
  const [uploading, setUploading] = useState(false);

  const upload = async (
    file: File,
    userId: string,
    /** Storage path without extension, e.g. `${userId}/profile` */
    pathPrefix: string,
    successMessage = 'Uploaded!'
  ): Promise<string | null> => {
    if (file.size > maxBytes) {
      toast.error(`File must be under ${Math.round(maxBytes / (1024 * 1024))} MB`);
      return null;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const mimeAllowed = !allowedMimeTypes || allowedMimeTypes.includes(file.type);
    const extAllowed = !allowedExtensions || allowedExtensions.includes(ext);
    if (!mimeAllowed && !extAllowed) {
      toast.error('Unsupported file type.');
      return null;
    }

    setUploading(true);
    try {
      const safeExt = ext || 'bin';
      const path = `${pathPrefix}.${safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);

      if (profileField) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ [profileField]: publicUrl })
          .eq('id', userId);
        if (updateError) throw updateError;
      }

      onSuccess?.(publicUrl);
      toast.success(successMessage);
      return publicUrl;
    } catch (err) {
      reportError('storage.upload_failed', err, { bucket, pathPrefix });
      toast.error('Upload failed. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploading, upload };
}
