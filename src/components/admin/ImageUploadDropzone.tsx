import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  Trash2, 
  RefreshCw, 
  Link as LinkIcon, 
  ExternalLink,
  Sparkles,
  X
} from 'lucide-react';

interface ImageUploadDropzoneProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  value,
  onChange,
  label = 'Product Showcase & Thumbnail Image',
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  
  // Cloudinary Settings (Pre-configured with defaults & stored in localStorage for convenience)
  const metaEnv = (import.meta as any).env || {};
  const defaultCloudName = metaEnv.VITE_CLOUDINARY_CLOUD_NAME || 'khuivafq';
  const defaultUploadPreset = metaEnv.VITE_CLOUDINARY_UPLOAD_PRESET || 'zohaib_digiforge';

  const [cloudName, setCloudName] = useState(() => localStorage.getItem('cloudinary_cloud_name') || defaultCloudName);
  const [uploadPreset, setUploadPreset] = useState(() => localStorage.getItem('cloudinary_upload_preset') || defaultUploadPreset);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cloudName) localStorage.setItem('cloudinary_cloud_name', cloudName);
    if (uploadPreset) localStorage.setItem('cloudinary_upload_preset', uploadPreset);
  }, [cloudName, uploadPreset]);

  // Compress / Convert to optimized Base64 Fallback
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Direct Cloudinary Upload via Unsigned Upload Preset
  const uploadToCloudinary = async (file: File): Promise<string> => {
    if (!cloudName.trim() || !uploadPreset.trim()) {
      throw new Error('Cloudinary credentials missing');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset.trim());

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.secure_url) {
              resolve(response.secure_url);
            } else {
              reject(new Error('No secure_url returned by Cloudinary'));
            }
          } catch (e) {
            reject(new Error('Invalid response from Cloudinary'));
          }
        } else {
          try {
            const errorResp = JSON.parse(xhr.responseText);
            reject(new Error(errorResp.error?.message || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error connecting to Cloudinary'));
      xhr.send(formData);
    });
  };

  // Main Handle File
  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Image size is too large. Please select an image under 15MB.');
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    setUploadProgress(15);

    try {
      if (cloudName.trim() && uploadPreset.trim()) {
        // Cloudinary upload
        const secureUrl = await uploadToCloudinary(file);
        onChange(secureUrl);
        setUploadProgress(100);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      } else {
        // Direct Optimized Base64 Fallback
        setUploadProgress(60);
        const base64 = await convertFileToBase64(file);
        onChange(base64);
        setUploadProgress(100);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (err: any) {
      console.warn('Cloudinary upload failed, falling back to local image data:', err);
      // Fallback gracefully so admin work isn't blocked
      try {
        const base64 = await convertFileToBase64(file);
        onChange(base64);
        setErrorMessage(
          err.message?.includes('credentials')
            ? 'Uploaded locally! Add Cloudinary Cloud Name & Preset in Settings if you want cloud URLs.'
            : `Cloudinary notice: ${err.message}. Saved as local image.`
        );
      } catch (fallbackErr) {
        setErrorMessage('Failed to load image file. Please try another image.');
      }
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Drag & Drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Clipboard Paste Support
  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      handleFileProcess(e.clipboardData.files[0]);
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`} onPaste={handlePaste}>
      
      {/* Header with Mode Switchers */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#28B9FF]" />
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-2">
          {/* Cloudinary Status Indicator */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
              cloudName && uploadPreset
                ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Configure Cloudinary Unsigned Upload Preset"
          >
            <Settings className="w-3 h-3" />
            <span>{cloudName && uploadPreset ? 'Cloudinary Connected' : 'Setup Cloudinary'}</span>
          </button>

          {/* Toggle URL vs Drag & Drop */}
          <button
            type="button"
            onClick={() => setManualMode(!manualMode)}
            className="text-[10px] text-slate-400 hover:text-[#28B9FF] flex items-center gap-1 font-semibold"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{manualMode ? 'Switch to Drag & Drop' : 'Paste Direct URL'}</span>
          </button>
        </div>
      </div>

      {/* CLOUDINARY QUICK CONFIG DRAWER */}
      {showSettings && (
        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/50 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-purple-800/30 pb-2">
            <div className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Cloudinary Direct Drag &amp; Drop Settings</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-purple-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-purple-300/80 leading-relaxed">
            Drag and dropped images will upload straight to your free Cloudinary account and return a permanent CDN URL!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                Cloud Name *
              </label>
              <input
                type="text"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                placeholder="e.g. dxyz1234"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-purple-800/60 text-white text-xs mt-1 focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                Unsigned Upload Preset *
              </label>
              <input
                type="text"
                value={uploadPreset}
                onChange={(e) => setUploadPreset(e.target.value)}
                placeholder="e.g. digiforge_preset"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-purple-800/60 text-white text-xs mt-1 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[10px] text-purple-400">
            <span>Free Cloudinary setup takes 1 minute in Cloudinary Settings &gt; Upload &gt; Add upload preset (Unsigned)</span>
            <a
              href="https://cloudinary.com/documentation/upload_presets#creating_unsigned_upload_presets"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-purple-300 hover:underline font-bold"
            >
              <span>Guide</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* MANUAL URL INPUT MODE */}
      {manualMode ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://res.cloudinary.com/... or any image link"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-[#0D6EFD] focus:outline-none font-mono"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 shrink-0"
                title="Clear URL"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* DRAG & DROP UPLOAD ZONE */
        <div className="space-y-2">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-4 sm:p-5 transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
              isDragging
                ? 'border-[#28B9FF] bg-[#28B9FF]/10 scale-[1.01]'
                : value
                ? 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                : 'border-slate-800 bg-slate-950/90 hover:border-[#28B9FF]/60 hover:bg-slate-900/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              className="hidden"
            />

            {/* If uploading */}
            {isUploading ? (
              <div className="py-4 space-y-3 w-full max-w-xs">
                <RefreshCw className="w-8 h-8 text-[#28B9FF] animate-spin mx-auto" />
                <div className="text-xs font-bold text-white">
                  {cloudName && uploadPreset ? 'Uploading directly to Cloudinary...' : 'Processing image file...'}
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{uploadProgress}% complete</div>
              </div>
            ) : value ? (
              /* Image Uploaded State */
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-between" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 w-full min-w-0">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 shadow-md">
                    <img
                      src={value}
                      alt="Thumbnail Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0 text-left space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                      <span>Image Ready &amp; Attached</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs font-mono">
                      {value.startsWith('data:') ? 'Local High-Res Data Image' : value}
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 transition-colors"
                      >
                        Replace Image
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange('')}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[10px] font-bold text-red-400 border border-red-500/20 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty Dropzone State */
              <div className="py-2 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-[#28B9FF] flex items-center justify-center mx-auto group-hover:scale-110 group-hover:border-[#28B9FF]/40 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    <span className="text-[#28B9FF] underline cursor-pointer">Click to browse</span> or drag and drop image here
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Supports PNG, JPG, WEBP, SVG or GIF (Max 15MB) • You can also paste directly (Ctrl+V)
                  </div>
                </div>
                {cloudName && uploadPreset && (
                  <div className="inline-flex items-center gap-1 text-[10px] text-purple-300 font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>Auto-uploads to Cloudinary CDN</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessToast && (
        <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[#22C55E] text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Image uploaded and linked successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <div className="leading-tight">{errorMessage}</div>
        </div>
      )}
    </div>
  );
};
