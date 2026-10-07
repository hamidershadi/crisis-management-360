import React from 'react';
import { db } from '../../services/db';
import {
  Layers,
  Image as ImageIcon,
  Crosshair,
  HelpCircle,
  Users,
  Trophy,
  CheckCircle2,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tabId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const stages = db.getStages();
  const panoramas = db.getPanoramas();
  const hotspots = db.getAllHotspots();
  const questions = db.getQuestions();
  const profiles = db.getProfiles();
  const attempts = db.getQuizAttempts();
  const logs = db.getActivityLogs().slice(0, 7);

  const passedAttempts = attempts.filter((a) => a.is_passed).length;
  const passRate = attempts.length > 0 ? Math.round((passedAttempts / attempts.length) * 100) : 100;

  const statCards = [
    {
      title: 'مراحل فعال تور',
      value: stages.length,
      unit: 'مرحله',
      icon: Layers,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10 border-teal-500/20',
      tab: 'stages',
    },
    {
      title: 'تصاویر ۳۶۰ درجه',
      value: panoramas.length,
      unit: 'پانوراما',
      icon: ImageIcon,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10 border-sky-500/20',
      tab: 'panoramas',
    },
    {
      title: 'نقاط تعاملی (Hotspots)',
      value: hotspots.length,
      unit: 'نقطه سه‌بعدی',
      icon: Crosshair,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      tab: 'hotspots',
    },
    {
      title: 'سؤالات چهارگزینه‌ای',
      value: questions.length,
      unit: 'سؤال فعال',
      icon: HelpCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      tab: 'questions',
    },
    {
      title: 'کاربران ثبت‌نام‌شده',
      value: profiles.length,
      unit: 'کاربر',
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      tab: 'users',
    },
    {
      title: 'نرخ قبولی آزمون‌ها',
      value: `${passRate}٪`,
      unit: `${attempts.length} آزمون ثبت‌شده`,
      icon: Trophy,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      tab: 'results',
    },
  ];

  return (
    <div className="space-y-8 text-right">
      {/* Top Welcome Card */}
      <div className="glass-panel rounded-2xl border border-white/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">داشبورد مدیریت سامانه تور مجازی ۳۶۰ درجه</h2>
          <p className="text-xs text-slate-400 mt-1">
            وضعیت کلی پایگاه داده، تصاویر، مراحل، نرخ قبولی کاربران در آزمون و گزارش رخدادها
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-300 font-medium">موتور Three.js و پایگاه داده فعال است</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              onClick={() => onNavigateTab(card.tab)}
              className={`p-5 rounded-2xl border ${card.bgColor} text-right transition-all hover:scale-[1.02] flex flex-col justify-between group shadow-lg`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${card.color}`} />
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </div>

              <div>
                <div className="text-2xl font-black text-white tabular-nums tracking-tight">
                  {card.value}
                </div>
                <div className="text-xs font-semibold text-slate-300 mt-0.5">{card.title}</div>
                <div className="text-[10px] text-slate-400 mt-1">{card.unit}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Two Columns: Recent Activities & Quick Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              <span>آخرین گزارش فعالیت‌های ثبت‌شده</span>
            </h3>
            <button
              onClick={() => onNavigateTab('logs')}
              className="text-xs text-teal-400 hover:text-teal-300"
            >
              مشاهده همه
            </button>
          </div>

          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300"
              >
                <div className="space-y-0.5 max-w-sm">
                  <div className="font-medium text-white">{log.details}</div>
                  <div className="text-[11px] text-slate-400">{log.user_email}</div>
                </div>

                <span className="text-[10px] text-slate-500 font-mono shrink-0 tabular-nums" dir="ltr">
                  {new Date(log.created_at).toLocaleTimeString('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Architecture & Rules Summary */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>قوانین سیستمی تور و آزمون چهارگزینه‌ای</span>
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <strong className="text-teal-300 block mb-1">معماری تصویر ۳۶۰ درجه:</strong>
              تصاویر از نوع کره درونی (SphereGeometry با MeshBasicMaterial و FrontSide اینورت‌شده) در
              Three.js به مرکزیت دوربین بارگذاری می‌شوند.
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <strong className="text-amber-300 block mb-1">فرآیند افزودن نقطه سؤال (Hotspot):</strong>
              ادمین با چرخاندن ۳۶۰ درجه و کلیک روی موقعیت، مختصات سه‌بعدی را با Raycaster دریافت نموده
              و به سؤال مرحله پیوند می‌دهد.
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <strong className="text-emerald-300 block mb-1">قانون عبور از مرحله:</strong>
              هر مرحله ۵ سؤال دارد؛ پاسخ صحیح به حداقل ۴ سؤال (۸۰٪) شرط باز شدن مرحله بعدی توسط بک‌اند
              است.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
