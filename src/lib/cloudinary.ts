const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
}

export type FileKind = 'video' | 'pdf' | 'document' | 'slides' | 'spreadsheet' | 'image' | 'audio' | 'other';

/** Detect file_kind from file for learning files system */
export function detectFileKind(file: File): FileKind {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  
  // PDF
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }
  
  // Slides (PowerPoint)
  if (
    name.endsWith('.ppt') || name.endsWith('.pptx') ||
    type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return 'slides';
  }
  
  // Spreadsheets (Excel)
  if (
    name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv') ||
    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    type === 'text/csv'
  ) {
    return 'spreadsheet';
  }
  
  // Documents (Word)
  if (
    name.endsWith('.doc') || name.endsWith('.docx') ||
    name.endsWith('.txt') || name.endsWith('.rtf') ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type === 'text/plain'
  ) {
    return 'document';
  }
  
  // Video
  if (type.startsWith('video/')) {
    return 'video';
  }
  
  // Audio
  if (type.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.webm') || name.endsWith('.m4a')) {
    return 'audio';
  }
  
  // Image
  if (type.startsWith('image/')) {
    return 'image';
  }
  
  return 'other';
}

/** Determine the Cloudinary resource_type path segment from the file's MIME type.
 *  Cloudinary routes both video AND audio through the `/video/upload` endpoint. */
function getResourceType(file: File): 'image' | 'video' | 'raw' {
  const fileKind = detectFileKind(file);
  if (fileKind === 'video' || fileKind === 'audio') return 'video';
  if (fileKind === 'image') return 'image';
  return 'raw';
}

export function uploadToCloudinary(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    return Promise.reject(
      new Error('Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET in .env'),
    );
  }

  const MAX_BYTES = 100 * 1024 * 1024; // 100 MB
  if (file.size > MAX_BYTES) {
    return Promise.reject(new Error('File is too large. Maximum size is 100 MB.'));
  }

  const resourceType = getResourceType(file);
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 400) {
          reject(new Error(data?.error?.message ?? `Upload failed (${xhr.status})`));
        } else {
          resolve({
            url: data.secure_url,
            publicId: data.public_id,
            resourceType: data.resource_type ?? resourceType,
          });
        }
      } catch {
        reject(new Error('Unexpected response from Cloudinary'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));

    xhr.open('POST', endpoint);
    xhr.send(formData);
  });
}
