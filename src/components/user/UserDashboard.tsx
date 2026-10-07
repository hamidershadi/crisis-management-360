import React from 'react';
import { Stage } from '../../types/database';
import { db } from '../../services/db';
import { resolvePanoramaUrl, getBundledFallbackUrl } from '../../assets/panoramas';
import {
  Play,
  CheckCircle2,
  Lock,
  ChevronLeft,
  Trophy,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface UserDashboardProps {
  userId: string;
  onSelectStage: (stage: Stage) => void;
  onResumeTour: () => void;
  onOpenUserPanel?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  userId,
  onSelectStage,
  onResumeTour,
  onOpenUserPanel,
}) => {
  const stages = db.getStages();
  const latestStage = db.getUserLatestAvailableStage(userId);

  // Overall progress
  let totalCorrect = 0;
  let completedSpaces = 0;
  stages.forEach((s) => {
    const status = db.getUserStageStatus(userId, s.id);
    totalCorrect += status.correctCount;
    if (status.isCompleted) completedSpaces++;
  });

  const storySteps = [
    { title: 'کوچه تخریب‌شده', sub: 'ارزیابی خطرات اولیه و معبر' },
    { title: 'ساختمان آسیب‌دیده', sub: 'جست‌وجو و کنترل آوار' },
    { title: 'پناهگاه امن', sub: 'تثبیت و تریاژ مصدومان' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-in fade-in duration-200 text-right">
      {/* Minimal Hero Header */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="text-xs font-semibold text-teal-400">
            شبیه‌ساز سه‌بعدی واقعیت مجازی
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            تور مجازی تعاملی مدیریت بحران
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            در شرایط واقعی زلزله و تخریب شهری تصمیم‌گیری کنید؛ خطرات محیطی را شناسایی کرده و با انتخاب‌های اصولی، مسیر را تا پناهگاه امن ادامه دهید.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onResumeTour}
              className="px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-2xl shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer"
            >
              <span>{totalCorrect > 0 ? 'ادامه سناریو' : 'ورود به تور ۳۶۰'}</span>
              <Play className="w-4 h-4 fill-slate-950" />
            </button>

            {onOpenUserPanel && (
              <button
                onClick={onOpenUserPanel}
                className="px-5 py-3.5 text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>کارنامه امتیازات ({totalCorrect}/۱۵)</span>
              </button>
            )}
          </div>
        </div>

        {/* Minimal 3-Stage Progress Bar */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {storySteps.map((step, idx) => {
              const stage = stages[idx];
              const status = stage ? db.getUserStageStatus(userId, stage.id) : null;
              const isCurrent = latestStage.id === stage?.id;

              return (
                <div
                  key={idx}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all text-right ${
                    status?.isCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                      : isCurrent
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-200'
                      : 'bg-white/5 border-white/5 opacity-60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold tabular-nums">گام {idx + 1}</span>
                    {status?.isCompleted && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-white truncate">{step.title}</div>
                  <div className="text-[10px] text-slate-400 hidden sm:block truncate mt-0.5">{step.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3 Spaces Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-bold text-white">فضاهای ۳۶۰ درجه سناریو</h2>
          <span className="text-xs text-slate-400">۳ مرحله متوالی و پیوسته</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stages.map((stage, index) => {
            const pano = db.getPanoramaById(stage.panorama_id);
            const status = db.getUserStageStatus(userId, stage.id);

            return (
              <div
                key={stage.id}
                className="glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all group"
              >
                <div className="relative h-40 bg-slate-900 overflow-hidden">
                  {pano?.file_url ? (
                    <img
                      src={resolvePanoramaUrl(pano.file_url, stage.panorama_id)}
                      alt={stage.title}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback = getBundledFallbackUrl(pano.file_url, stage.panorama_id);
                        if (fallback && target.src !== fallback) {
                          target.src = fallback;
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e1217] via-transparent to-black/30" />

                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-black/70 text-white backdrop-blur-md">
                    فضای {index + 1}
                  </div>

                  <div className="absolute top-2.5 left-2.5">
                    {status.isCompleted ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/90 text-slate-950 backdrop-blur-md">
                        تکمیل شد ✓
                      </span>
                    ) : status.isUnlocked ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/90 text-slate-950 backdrop-blur-md">
                        در دسترس
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 backdrop-blur-md border border-white/10 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> قفل
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-white">{stage.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {stage.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px]">
                      پاسخ‌های صحیح:{' '}
                      <strong className="text-teal-300 tabular-nums font-bold">
                        {status.correctCount}/۵
                      </strong>
                    </span>

                    {status.isUnlocked ? (
                      <button
                        onClick={() => onSelectStage(stage)}
                        className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>ورود</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500">نیاز به تکمیل فضای قبل</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
