import { useRef, useState } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { uploadImage, deleteObject } from '@/api/media';
import { toast } from 'react-toastify';

export default function ImageUploader({ value, onChange, label = 'Cover Image', accept = 'image/*', maxMb = 10 }) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`File too large (max ${maxMb} MB)`);
      return;
    }

    setProgress(0);
    setIsUploading(true);
    try {
      const previousKey = value;
      const { url } = await uploadImage(file, { onProgress: setProgress });
      onChange(url);
      // If the admin was replacing an existing image, drop the old one.
      if (previousKey) deleteObject(previousKey);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Image upload failed');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleClear = async () => {
    if (!value) return;
    const removed = value;
    onChange('');
    deleteObject(removed);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        {value ? (
          <button type="button" onClick={handleClear} className="text-xs text-rose-500 hover:text-rose-600">Remove</button>
        ) : null}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900">
          <img src={value} alt="preview" className="w-full h-40 object-cover" />
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
              <span>Click to upload image</span>
              <span className="text-xs text-slate-400 mt-1">JPG / PNG / WEBP up to {maxMb} MB</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
