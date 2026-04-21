import { useEffect, useRef, useState } from 'react';
import { UploadCloud, Loader2, Film } from 'lucide-react';
import { uploadVideo, deleteObject } from '@/api/media';
import { toast } from 'react-toastify';

// Reads the duration of a local (pre-upload) video file by loading it
// into a transient HTMLVideoElement. Used to give the admin a preview
// and to compute `durationSec` without relying on the backend.
function probeVideoMetadata(file) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = objectUrl;
    video.onloadedmetadata = () => {
      resolve({
        durationSec: Math.round(video.duration || 0),
        objectUrl,
      });
    };
    video.onerror = () => resolve({ durationSec: 0, objectUrl });
  });
}

export default function VideoUploader({
  value,
  durationSec = 0,
  onChange,
  label = 'Video',
  maxMb = 500,
}) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  // Pre-upload preview URL (blob: ...) so the admin can watch the clip
  // before we push it to R2.
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`File too large (max ${maxMb} MB)`);
      return;
    }

    const meta = await probeVideoMetadata(file);
    setPreviewUrl(meta.objectUrl);

    setProgress(0);
    setIsUploading(true);
    try {
      const previousKey = value;
      const { url } = await uploadVideo(file, { onProgress: setProgress });
      onChange({ url, durationSec: meta.durationSec });
      if (previousKey) deleteObject(previousKey);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Video upload failed');
      setPreviewUrl('');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleClear = async () => {
    if (!value && !previewUrl) return;
    const removed = value;
    setPreviewUrl('');
    onChange({ url: '', durationSec: 0 });
    if (removed) deleteObject(removed);
  };

  const playableSrc = previewUrl || value;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        {playableSrc ? (
          <button type="button" onClick={handleClear} className="text-xs text-rose-500 hover:text-rose-600">Remove</button>
        ) : null}
      </div>
      <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleFile} />

      {playableSrc ? (
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-black">
          <video src={playableSrc} controls className="w-full max-h-64 bg-black" />
          {isUploading ? (
            <div className="p-2 text-xs text-white bg-black/80 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading… {progress}%
            </div>
          ) : durationSec ? (
            <div className="p-2 text-xs text-slate-400 bg-black/80 flex items-center gap-2">
              <Film className="w-3.5 h-3.5" /> Duration: {Math.floor(durationSec / 60)}m {durationSec % 60}s
            </div>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePick}
          disabled={isUploading}
          className="w-full h-40 rounded-xl border-2 border-dashed border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 flex flex-col items-center justify-center text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <span>Uploading... {progress}%</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-6 h-6 mb-2" />
              <span>Click to upload video</span>
              <span className="text-xs text-slate-400 mt-1">MP4 / WEBM / MOV up to {maxMb} MB</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
