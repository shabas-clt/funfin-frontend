import { useState, useRef } from 'react';
import { Upload, X, FileVideo, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function VideoUpload({ 
  value, 
  onChange, 
  disabled = false,
  maxSize = 250 * 1024 * 1024, // 250MB
  acceptedFormats = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov']
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    if (!file) return { valid: false, error: 'No file selected' };
    
    if (!acceptedFormats.includes(file.type)) {
      return { 
        valid: false, 
        error: `Invalid file type. Accepted formats: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}` 
      };
    }
    
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File too large. Maximum size: ${formatFileSize(maxSize)}` 
      };
    }
    
    return { valid: true };
  };

  const handleFileSelect = async (file) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned URL
      const response = await fetch('/api/v1/admin/courses/introduction-video/presign', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, videoUrl } = await response.json();

      // Step 2: Upload directly to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video');
      }

      // Step 3: Update form with video URL
      onChange(videoUrl);
      toast.success('Video uploaded successfully');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload video');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled || uploading) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Introduction Video
        </label>
        {value && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || uploading}
            className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 text-sm disabled:opacity-50 transition-colors"
          >
            <X className="w-4 h-4 inline mr-1" />
            Remove
          </button>
        )}
      </div>

      {value ? (
        // Video Preview
        <div className="bg-slate-50 dark:bg-neutral-900 rounded-lg p-4 border-2 border-dashed border-slate-200 dark:border-neutral-700">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center">
                <FileVideo className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Introduction Video</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Video uploaded successfully</p>
              <div className="mt-2">
                <video
                  src={value}
                  controls
                  className="w-full max-w-md h-32 rounded border border-slate-200 dark:border-neutral-700"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Upload Area
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            disabled || uploading
              ? 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 cursor-not-allowed'
              : 'border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-600 cursor-pointer'
          }`}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileInputChange}
            disabled={disabled || uploading}
            className="hidden"
          />

          {uploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Uploading video...</p>
              {uploadProgress > 0 && (
                <div className="w-full bg-slate-200 dark:bg-neutral-800 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="mx-auto h-8 w-8 text-slate-400" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Video files up to {formatFileSize(maxSize)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-indigo-800 dark:text-indigo-200">
            <p className="font-medium">Introduction Video Guidelines:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• This video will be accessible to all logged-in users without purchase</li>
              <li>• Maximum file size: {formatFileSize(maxSize)}</li>
              <li>• Supported formats: {acceptedFormats.map(f => f.split('/')[1]).join(', ')}</li>
              <li>• Use this to provide a preview or introduction to your course content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
