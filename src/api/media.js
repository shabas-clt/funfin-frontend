import { api } from './axios';

export async function uploadImage(file, { onProgress } = {}) {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/uploads/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => {
          if (!e.total) return;
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      : undefined,
  });
  return { url: res.url, key: res.public_id };
}

export async function uploadVideo(file, { onProgress } = {}) {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/uploads/video', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => {
          if (!e.total) return;
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      : undefined,
  });
  return { url: res.url, key: res.public_id };
}

// Fire-and-forget delete. If an admin removes a file from the form
// before submitting the course, we try to clean up the orphaned object
// in R2. A failure here is logged but not surfaced to the user, since
// there's nothing they can do about it and the worst case is a dangling
// file we can sweep later.
export async function deleteObject(keyOrUrl) {
  if (!keyOrUrl) return;
  try {
    await api.delete('/uploads/object', { data: { key: keyOrUrl } });
  } catch (err) {
    console.warn('uploads/object delete failed', err);
  }
}
