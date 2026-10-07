import React from 'react';
import { Hotspot } from '../../types/database';
import { X, Info, Compass, Landmark } from 'lucide-react';

interface InfoModalProps {
  hotspot: Hotspot;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ hotspot, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full sm:max-w-lg glass-panel-card rounded-t-3xl sm:rounded-2xl border-t sm:border border-white/20 p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto text-right">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          title="بستن"
          aria-label="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge & Title */}
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 mb-2">
          <Info className="w-4 h-4" />
          <span>اطلاعات معماری و تاریخی</span>
        </div>

        <h3 className="text-lg font-bold text-white mb-4 leading-snug">
          {hotspot.title}
        </h3>

        {/* Description Body */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm leading-relaxed mb-6">
          {hotspot.description || 'توضیحات تکمیلی برای این نقطه ثبت نشده است.'}
        </div>

        {/* 3D Coordinate coordinates info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-white/10">
          <span>مختصات فضایی Three.js:</span>
          <span className="font-mono text-slate-300 tabular-nums" dir="ltr">
            ({Math.round(hotspot.pos_x)}, {Math.round(hotspot.pos_y)}, {Math.round(hotspot.pos_z)})
          </span>
        </div>

        {/* Action Button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors shadow-lg shadow-teal-500/20"
          >
            ادامه تور ۳۶۰ درجه
          </button>
        </div>
      </div>
    </div>
  );
};
