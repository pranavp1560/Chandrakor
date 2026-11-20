import React, { useState, useRef } from 'react';
import { UploadCloud, X, Star, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@chandrakor/supabase-client';

export interface UploadedImage {
  id?: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  is_primary: boolean;
  file?: File;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxFiles?: number;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxFiles = 6,
}) => {
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList) => {
    setErrorMsg(null);
    const filesToUpload = Array.from(fileList);

    if (images.length + filesToUpload.length > maxFiles) {
      setErrorMsg(`Maximum ${maxFiles} images allowed per saree product.`);
      return;
    }

    setUploading(true);
    const newImages: UploadedImage[] = [...images];

    for (const file of filesToUpload) {
      // Validate MIME
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setErrorMsg(`Invalid file type: ${file.name}. Only JPG, PNG, WEBP, and AVIF are permitted.`);
        continue;
      }

      // Validate Size
      if (file.size > MAX_FILE_SIZE) {
        setErrorMsg(`File too large: ${file.name} exceeds maximum 5MB size limit.`);
        continue;
      }

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `sarees/${fileName}`;

        const { data, error } = await supabase.storage
          .from('products')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error('Storage upload error:', error);
          setErrorMsg(`Upload failed for ${file.name}: ${error.message}`);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        const isFirst = newImages.length === 0;
        newImages.push({
          image_url: publicUrl,
          alt_text: file.name,
          display_order: newImages.length + 1,
          is_primary: isFirst,
        });
      } catch (err: any) {
        console.error('Upload exception:', err);
        setErrorMsg(err.message || 'An error occurred while uploading.');
      }
    }

    onChange(newImages);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    onChange(updated);
  };

  const handleRemove = async (index: number) => {
    const target = images[index];
    const updated = images.filter((_, i) => i !== index);

    // If removed was primary, make first remaining primary
    if (target.is_primary && updated.length > 0) {
      updated[0].is_primary = true;
    }

    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Upload Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 hover:border-brand-burgundy rounded-lg p-6 text-center cursor-pointer bg-slate-50 hover:bg-slate-100/70 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-brand-burgundy/10 text-brand-burgundy flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
          </div>
          <div>
            <span className="text-xs font-semibold text-brand-burgundy">
              {uploading ? 'Uploading to Supabase Storage...' : 'Click to upload saree images'}
            </span>
            <span className="text-xs text-slate-500 block">or drag and drop files here</span>
          </div>
          <span className="text-[10px] text-slate-400">
            JPG, PNG, WEBP up to 5MB each. (Up to {maxFiles} images)
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`relative group rounded border overflow-hidden aspect-[3/4] bg-slate-100 ${
                img.is_primary ? 'border-brand-burgundy ring-2 ring-brand-burgundy/20' : 'border-slate-200'
              }`}
            >
              <img
                src={img.image_url}
                alt={img.alt_text || 'Product image'}
                className="w-full h-full object-cover"
              />

              {/* Badges */}
              {img.is_primary && (
                <span className="absolute top-1.5 left-1.5 bg-brand-burgundy text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shadow">
                  Primary
                </span>
              )}

              {/* Action Buttons overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className="p-1.5 bg-white text-slate-700 hover:text-brand-burgundy rounded shadow text-xs font-medium flex items-center gap-1"
                    title="Set as Primary Image"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-1.5 bg-white text-red-600 hover:bg-red-50 rounded shadow"
                  title="Remove Image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
