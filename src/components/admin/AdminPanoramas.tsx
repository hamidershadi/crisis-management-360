import React, { useState } from 'react';
import { Panorama } from '../../types/database';
import { db } from '../../services/db';
import { resolvePanoramaUrl, getBundledFallbackUrl } from '../../assets/panoramas';
import { PanoramaViewer } from '../viewer/PanoramaViewer';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  X,
  FileImage,
  ExternalLink,
} from 'lucide-react';

export const AdminPanoramas: React.FC = () => {
  const [panoramas, setPanoramas] = useState<Panorama[]>(db.getPanoramas());
  const [previewPano, setPreviewPano] = useState<Panorama | null>(null);

  // Upload Form state
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');
  const [aspectRatioWarning, setAspectRatioWarning] = useState<string | null>(null);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const [detectedRatio, setDetectedRatio] = useState<number | null>(null);
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAspectRatioWarning(null);
    setFileSizeError(null);
    setSelectedFile(file);

    // 1. File size check (50MB = 50 * 1024 * 1024 bytes)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileSizeError('حجم فایل انتخاب‌شده بیش از ۵۰ مگابایت است. لطفاً فایل کم‌حجم‌تری انتخاب کنید.');
      return;
    }

    // 2. Read dimensions & check 2:1 ratio
    const objectUrl = URL.createObjectURL(file);
    setFilePreviewUrl(objectUrl);

    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setImageDims({ w, h });
      const ratio = w / h;
      setDetectedRatio(ratio);

      // Equirectangular standard is 2.0 (e.g., 4096x2048, 2048x1024)
      if (Math.abs(ratio - 2.0) > 0.05) {
        setAspectRatioWarning(
          `تصویر انتخاب‌شده نسبت استاندارد ۲:۱ ندارد (نسبت فعلی: ${ratio.toFixed(2)}:1 با ابعاد ${w}×${h}). استفاده از تصاویر غیر ۲:۱ ممکن است در نمایشگر ۳۶۰ درجه دچار کشیدگی قطبی شود، اما می‌توانید ادامه دهید.`
        );
      }
    };
    img.src = objectUrl;
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedFile || !filePreviewUrl) return;

    const newPano = db.createPanorama({
      title: title.trim(),
      file_url: filePreviewUrl,
      width: imageDims?.w || 4096,
      height: imageDims?.h || 2048,
      aspect_ratio: detectedRatio || 2.0,
      file_size_bytes: selectedFile.size,
      storage_path: `panoramas/stage-custom/${selectedFile.name}`,
    });

    setPanoramas(db.getPanoramas());
    setIsUploading(false);
    setTitle('');
    setSelectedFile(null);
    setFilePreviewUrl('');
    setAspectRatioWarning(null);
    setActionMessage({ text: 'تصویر ۳۶۰ با موفقیت افزوده شد.', type: 'success' });
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleDelete = (id: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این تصویر پانوراما را حذف کنید؟')) return;

    const res = db.deletePanorama(id);
    if (res.success) {
      setPanoramas(db.getPanoramas());
      setActionMessage({ text: 'تصویر با موفقیت حذف شد.', type: 'success' });
    } else {
      setActionMessage({ text: res.error || 'خطا در حذف تصویر', type: 'error' });
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div className="space-y-6 text-right">
      {/* Action alerts */}
      {actionMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">مدیریت تصاویر ۳۶۰ درجه (Equirectangular)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            بارگذاری و پیش‌نمایش فایل‌های پانورامای ۲:۱ جهت اتصال به مراحل تور مجازی
          </p>
        </div>

        <button
          onClick={() => setIsUploading(true)}
          className="px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 self-start transition-colors shadow-lg shadow-teal-500/20"
        >
          <Upload className="w-4 h-4" />
          <span>بارگذاری تصویر ۳۶۰ جدید</span>
        </button>
      </div>

      {/* Panoramas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {panoramas.map((pano) => {
          const sizeMb = (pano.file_size_bytes / (1024 * 1024)).toFixed(1);
          return (
            <div
              key={pano.id}
              className="glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all"
            >
              <div className="relative h-44 bg-slate-950 group overflow-hidden">
                <img
                  src={resolvePanoramaUrl(pano.file_url, pano.id)}
                  alt={pano.title}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = getBundledFallbackUrl(pano.file_url, pano.id);
                    if (fallback && target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPreviewPano(pano)}
                    className="p-2.5 bg-teal-400 text-slate-950 rounded-xl hover:bg-teal-300 transition-transform active:scale-95 shadow-lg"
                    title="پیش‌نمایش تعاملی ۳۶۰"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] bg-black/70 text-slate-200 backdrop-blur-sm font-mono" dir="ltr">
                  {pano.width} × {pano.height} ({pano.aspect_ratio}:1)
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-white">{pano.title}</h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate" dir="ltr">
                    {pano.storage_path}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10">
                  <span>حجم: {sizeMb} مگابایت</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewPano(pano)}
                      className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>تست ۳۶۰</span>
                    </button>
                    <button
                      onClick={() => handleDelete(pano.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                      title="حذف تصویر"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Modal with 2:1 Ratio Validator */}
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg glass-panel-card rounded-2xl border border-white/20 p-6 shadow-2xl relative text-right">
            <button
              onClick={() => {
                setIsUploading(false);
                setSelectedFile(null);
                setFilePreviewUrl('');
                setAspectRatioWarning(null);
              }}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-teal-400" />
              <span>بارگذاری تصویر ۳۶۰ درجه جدید</span>
            </h3>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  عنوان تصویر پانوراما *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: سرسرای اصلی عمارت مسعودیه"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  انتخاب فایل تصویر (JPG, PNG, WEBP حداکثر ۵۰ مگابایت) *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-400 file:mr-0 file:ml-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-400 file:text-slate-950 hover:file:bg-teal-300 cursor-pointer"
                />
              </div>

              {/* 2:1 Ratio Warning Alert */}
              {aspectRatioWarning && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>{aspectRatioWarning}</span>
                </div>
              )}

              {/* File Size Error */}
              {fileSizeError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{fileSizeError}</span>
                </div>
              )}

              {/* Image Preview */}
              {filePreviewUrl && imageDims && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>پیش‌نمایش تصویر:</span>
                    <span className="font-mono text-teal-300" dir="ltr">
                      {imageDims.w} × {imageDims.h} ({detectedRatio?.toFixed(2)}:1)
                    </span>
                  </div>
                  <img
                    src={filePreviewUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg border border-white/10"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !selectedFile || !!fileSizeError}
                  className="px-6 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-40 rounded-xl transition-colors shadow-lg shadow-teal-500/20"
                >
                  تأیید و ذخیره تصویر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 360 Panorama Preview Modal */}
      {previewPano && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full h-[85vh] max-w-5xl rounded-2xl overflow-hidden glass-panel-card border border-white/20 flex flex-col relative">
            <div className="p-3.5 px-5 bg-black/60 border-b border-white/10 flex items-center justify-between text-right">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-teal-400" />
                  <span>پیش‌نمایش تصویر ۳۶۰: {previewPano.title}</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  گردش با ماوس یا لمس · زوم با چرخ ماوس یا دو انگشت · حالت تمام‌صفحه
                </span>
              </div>
              <button
                onClick={() => setPreviewPano(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 w-full h-full relative">
              <PanoramaViewer
                panoramaUrl={previewPano.file_url}
                stageTitle={previewPano.title}
                stageDescription="حالت پیش‌نمایش مدیر سیستم (سه بعدی)"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
