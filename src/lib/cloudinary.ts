const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
}

/** Determine the Cloudinary resource_type path segment from the file's MIME type. */
function getResourceType(file: File): 'image' | 'video' | 'raw' {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'raw';
  if (file.type.startsWith('video/')) return 'video';
  return 'image';
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
