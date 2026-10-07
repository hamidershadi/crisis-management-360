import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Profile, Stage } from '../../types/database';
import { resolvePanoramaUrl, getBundledFallbackUrl } from '../../assets/panoramas';
import { sound } from '../../utils/audio';
import {
  User,
  Trophy,
  Award,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  Edit3,
  Save,
  Check,
  Phone,
  Mail,
  Shield,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  Compass,
  Star,
  Flame,
  Building2,
  Home,
  LogOut,
} from 'lucide-react';

interface UserProfilePanelProps {
  currentUser: Profile | null;
  onNavigateToTour: (stage?: Stage) => void;
  onBackToApp: () => void;
  onOpenAuthModal?: () => void;
}

export const UserProfilePanel: React.FC<UserProfilePanelProps> = ({
  currentUser,
  onNavigateToTour,
  onBackToApp,
  onOpenAuthModal,
}) => {
  const [profile, setProfile] = useState<Profile | null>(currentUser);
  const stages = db.getStages();

  // Edit Name & Phone Form State
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if currentUser changes
  useEffect(() => {
    setProfile(currentUser);
    if (currentUser) {
      setFullName(currentUser.full_name);
      setPhone(currentUser.phone || '');
      setPassword('');
    }
  }, [currentUser]);

  // Handle Profile Update
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaveError(null);
    setSaveSuccess(null);

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();

    if (!cleanName) {
      setSaveError('لطفاً نام و نام خانوادگی خود را وارد نمایید.');
      return;
    }

    setIsSaving(true);
    sound.playTap();

    const updates: Partial<Profile> = {
      full_name: cleanName,
      phone: cleanPhone || undefined,
    };

    if (cleanPassword && cleanPassword.length >= 4) {
      updates.password = cleanPassword;
    }

    const res = db.updateProfile(profile.id, updates);

    setIsSaving(false);
    if (res.success && res.user) {
      sound.playSuccess();
      setProfile(res.user);
      setSaveSuccess('نام و مشخصات شما با موفقیت ذخیره شد.');
      setIsEditing(false);
      setTimeout(() => {
        setSaveSuccess(null);
      }, 4000);
    } else {
      sound.playError();
      setSaveError(res.error || 'خطا در ذخیره‌سازی اطلاعات');
    }
  };

  const handleResetStage = (stageId: string, stageTitle: string) => {
    if (!profile) return;
    if (confirm(`آیا مایلید تمام پاسخ‌ها و پیشرفت مرحله «${stageTitle}» را بازنشانی کرده و مجدداً ارزیابی را انجام دهید؟`)) {
      sound.playTap();
      db.resetStageProgress(profile.id, stageId);
      // Force trigger state update
      setProfile({ ...db.getCurrentUser()! });
    }
  };

  // Calculations for current user
  const effectiveUserId = profile?.id || 'demo';
  let totalCorrect = 0;
  let totalQuestions = 0;
  let completedStagesCount = 0;

  const stageProgressList = stages.map((stg) => {
    const status = db.getUserStageStatus(effectiveUserId, stg.id);
    totalCorrect += status.correctCount;
    totalQuestions += status.totalQuestions;
    if (status.isCompleted) completedStagesCount++;
    return {
      stage: stg,
      status,
      pano: db.getPanoramaById(stg.panorama_id),
    };
  });

  const overallPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const isAllCompleted = completedStagesCount === stages.length && stages.length > 0;

  // Operational Rank Title
  let operationalRank = 'امدادگر مبتدی';
  let operationalBadgeColor = 'from-slate-600 to-slate-800 text-slate-200 border-slate-500/30';
  if (totalCorrect >= 15) {
    operationalRank = 'فرمانده ارشد نجات و مدیریت بحران';
    operationalBadgeColor = 'from-amber-500/30 to-yellow-600/30 text-amber-300 border-amber-400/50';
  } else if (totalCorrect >= 10) {
    operationalRank = 'امدادگر ارشد واکنش سریع';
    operationalBadgeColor = 'from-teal-500/30 to-emerald-600/30 text-teal-300 border-teal-400/50';
  } else if (totalCorrect >= 5) {
    operationalRank = 'کارشناس تریاژ و ارزیابی میدانی';
    operationalBadgeColor = 'from-blue-500/30 to-indigo-600/30 text-blue-300 border-blue-400/50';
  }

  const stageIcons = [
    <Flame key="1" className="w-5 h-5 text-rose-400" />,
    <Building2 key="2" className="w-5 h-5 text-amber-400" />,
    <Home key="3" className="w-5 h-5 text-teal-400" />,
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-in fade-in duration-200 text-right">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
            <User className="w-4 h-4" />
            <span>پنل کاربری و کارنامه امدادگری</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            مدیریت مشخصات، سوابق و امتیازات بحران
          </h1>
          <p className="text-xs text-slate-400">
            مشاهده وضعیت پیشرفت در ۳ فضای بحران، مدیریت امتیازات کسب‌شده و ویرایش نام و نام خانوادگی
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateToTour()}
            className="px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>ورود به تور ۳۶۰ درجه</span>
            <Play className="w-3.5 h-3.5 fill-slate-950" />
          </button>
          <button
            onClick={onBackToApp}
            className="px-4 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            بازگشت به معرفی
          </button>
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-3 animate-in slide-in-from-top duration-200 shadow-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-bold">{saveSuccess}</span>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ========================================================= */}
        {/* COLUMN 1: Profile & Identity Card (Edit Full Name)       */}
        {/* ========================================================= */}
        <div className="space-y-6">
          <div className="glass-panel-card p-6 rounded-3xl border border-white/10 shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-teal-400" />
                <span>شناسنامه کاربری</span>
              </span>
              <span
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${
                  profile?.role === 'admin'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                }`}
              >
                {profile?.role === 'admin' ? 'مدیر سیستم' : 'کاربر عادی'}
              </span>
            </div>

            {/* Avatar & Name Header */}
            <div className="flex items-center gap-4 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500/30 to-emerald-500/30 border border-teal-400/40 flex items-center justify-center text-teal-200 font-black text-2xl shadow-xl shrink-0">
                {profile ? profile.full_name.slice(0, 1) : 'ک'}
              </div>
              <div className="space-y-1 min-w-0">
                <h2 className="text-base sm:text-lg font-black text-white truncate">
                  {profile?.full_name || 'کاربر مهمان'}
                </h2>
                <div className="text-xs text-slate-400 font-mono truncate" dir="ltr">
                  {profile?.email || 'بدون ایمیل'}
                </div>
                {profile?.phone && (
                  <div className="text-xs text-teal-300 font-mono" dir="ltr">
                    📞 {profile.phone}
                  </div>
                )}
              </div>
            </div>

            {/* Operational Rank Badge */}
            <div className={`p-4 rounded-2xl border bg-gradient-to-r ${operationalBadgeColor} space-y-1.5`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>سطح مهارت بحران:</span>
                </span>
                <span className="tabular-nums font-black">{totalCorrect} / ۱۵ امتیاز</span>
              </div>
              <div className="font-extrabold text-xs sm:text-sm">{operationalRank}</div>
            </div>

            {/* Edit Name & Info Form */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-teal-400" />
                  <span>تغییر نام و نام خانوادگی</span>
                </h3>
                {!isEditing ? (
                  <button
                    onClick={() => {
                      sound.playTap();
                      setIsEditing(true);
                      setSaveError(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>ویرایش نام</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setSaveError(null);
                      if (profile) {
                        setFullName(profile.full_name);
                        setPhone(profile.phone || '');
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                )}
              </div>

              {saveError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{saveError}</span>
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-3.5 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      نام و نام خانوادگی جدید *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="نام و نام خانوادگی کامل"
                        className="w-full px-3.5 py-2.5 pr-9 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-teal-400 transition-colors"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      شماره تماس / موبایل
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                        dir="ltr"
                        className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-teal-400 transition-colors font-mono text-right"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute top-3 left-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      تغییر رمز عبور (اختیاری)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="رمز عبور جدید"
                        dir="ltr"
                        className="w-full px-3.5 py-2.5 pl-9 pr-9 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-teal-400 transition-colors text-right"
                      />
                      <Key className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-white absolute top-2 left-2 cursor-pointer"
                        title={showPassword ? 'مخفی کردن' : 'نمایش'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره تغییرات نام و مشخصات'}</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-2 text-xs text-slate-300 bg-white/5 p-3.5 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">نام کامل:</span>
                    <span className="font-bold text-white">{profile?.full_name || 'ثبت‌نشده'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">شماره موبایل:</span>
                    <span className="font-mono text-teal-300" dir="ltr">{profile?.phone || 'ثبت‌نشده'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">ایمیل حساب:</span>
                    <span className="font-mono text-slate-300 text-[11px]" dir="ltr">{profile?.email || '—'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Logout Action */}
            <div className="pt-2">
              <button
                onClick={() => {
                  db.logout();
                  if (onOpenAuthModal) onOpenAuthModal();
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج از این حساب</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 2 & 3: Score Management & Completed Stages         */}
        {/* ========================================================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overall Score KPI Box */}
          <div className="glass-panel-card p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>کارنامه و مدیریت امتیازات آزمون بحران</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  وضعیت آمادگی عملیاتی: {overallPercentage}٪
                </h3>
                <p className="text-xs text-slate-300">
                  برای بازگشایی و پایان سناریو، کسب ۵ پاسخ صحیح در هر یک از فضاها الزامی است.
                </p>
              </div>

              {/* Progress Ring / Counter */}
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 shrink-0">
                <div className="text-center">
                  <div className="text-2xl font-black text-teal-300 tabular-nums">{totalCorrect}</div>
                  <div className="text-[10px] text-slate-400">پاسخ صحیح</div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-black text-white tabular-nums">{totalQuestions}</div>
                  <div className="text-[10px] text-slate-400">کل سؤالات</div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-black text-amber-300 tabular-nums">{completedStagesCount}/۳</div>
                  <div className="text-[10px] text-slate-400">فضاهای تکمیل‌شده</div>
                </div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-2 relative z-10 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">میزان تسلط و پاک‌سازی کل سناریو:</span>
                <span className="font-bold text-teal-300 tabular-nums">{overallPercentage}٪ کامل شده</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500 shadow-lg shadow-teal-500/50"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
            </div>

            {/* Mission Completion Badge if all completed */}
            {isAllCompleted && (
              <div className="p-4 rounded-2xl bg-gradient-to-l from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-400/40 text-emerald-100 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-spin-slow" />
                  <div>
                    <div className="font-black text-white">تبریک! گواهینامه نجات کامل سناریو صادر شد.</div>
                    <div className="text-[11px] text-emerald-200/90">شما با پاسخ صحیح به هر ۱۵ سؤال، مسیر را تا پناهگاه امن ایمن‌سازی کردید.</div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-400 text-slate-950 font-black text-xs shrink-0">
                  ۱۰۰٪ ممتاز
                </span>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* STAGES BREAKDOWN & CARDS (مراحلی که طی کرده است)          */}
          {/* ========================================================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-400" />
                <span>مراحل سناریو و جزئیات نمرات هر فضا</span>
              </h3>
              <span className="text-xs text-slate-400">
                {completedStagesCount} از ۳ فضا با موفقیت گذرانده شد
              </span>
            </div>

            <div className="space-y-4">
              {stageProgressList.map((item, idx) => {
                const { stage, status, pano } = item;
                const isPassed = status.isCompleted;
                const isUnlocked = status.isUnlocked;
                const stagePercent = status.totalQuestions > 0
                  ? Math.round((status.correctCount / status.totalQuestions) * 100)
                  : 0;

                return (
                  <div
                    key={stage.id}
                    className={`glass-panel p-5 rounded-2xl border transition-all ${
                      isPassed
                        ? 'border-emerald-500/30 bg-emerald-950/10'
                        : isUnlocked
                        ? 'border-teal-500/30 bg-teal-950/10 shadow-lg shadow-teal-950/20'
                        : 'border-white/5 bg-white/5 opacity-70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-start sm:items-center gap-4">
                        {/* Thumbnail / Icon */}
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-slate-900 flex items-center justify-center">
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
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            stageIcons[idx]
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="w-6 h-6 rounded-lg bg-black/60 text-white font-black text-xs flex items-center justify-center border border-white/20">
                              {idx + 1}
                            </span>
                          </div>
                        </div>

                        {/* Title and Descriptions */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm sm:text-base text-white">
                              {stage.title}
                            </h4>
                            {isPassed ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>تکمیل‌شده (عبور موفق)</span>
                              </span>
                            ) : isUnlocked ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                                در حال انجام
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-slate-400 border border-white/10 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                <span>قفل</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 line-clamp-1">
                            {stage.description}
                          </p>
                          <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-0.5">
                            <span>
                              نمره: <strong className="text-teal-300 font-bold tabular-nums">{status.correctCount}</strong> از{' '}
                              <strong className="text-white font-bold tabular-nums">{status.totalQuestions}</strong> سؤال صحیح
                            </span>
                            <span>•</span>
                            <span>شرط قبولی: ۵ از ۵ (۱۰۰٪)</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                        {/* Reset Progress to Retry */}
                        {status.correctCount > 0 && (
                          <button
                            onClick={() => handleResetStage(stage.id, stage.title)}
                            className="px-3 py-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 border border-white/5 cursor-pointer"
                            title="بازنشانی نمره و تلاش مجدد برای این مرحله"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">آزمون مجدد</span>
                          </button>
                        )}

                        {/* Jump to 360 Tour */}
                        <button
                          onClick={() => {
                            sound.playTap();
                            onNavigateToTour(stage);
                          }}
                          disabled={!isUnlocked}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isUnlocked
                              ? 'bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-md shadow-teal-500/20 active:scale-95'
                              : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                          }`}
                        >
                          <span>{isPassed ? 'مرور فضای ۳۶۰' : 'ورود و ارزیابی'}</span>
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    </div>

                    {/* Stage Progress Bar */}
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>پیشرفت پاسخ‌دهی به سؤالات:</span>
                        <span className="font-bold text-slate-200 tabular-nums">
                          {status.correctCount} از {status.totalQuestions} ({stagePercent}٪)
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isPassed ? 'bg-emerald-400' : 'bg-teal-400'
                          }`}
                          style={{ width: `${stagePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
