import React, { useState } from 'react';
import { db } from '../../services/db';
import { Profile } from '../../types/database';
import {
  User,
  LogIn,
  UserPlus,
  Shield,
  X,
  Sparkles,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  ExternalLink,
  Edit3,
  Save,
  Trophy,
  Check,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile | null;
  isMandatory?: boolean;
  onAdminLoginSuccess?: () => void;
  onOpenUserPanel?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isMandatory = false,
  onAdminLoginSuccess,
  onOpenUserPanel,
}) => {
  const [mode, setMode] = useState<'register' | 'login' | 'profile'>(
    currentUser ? 'profile' : 'register'
  );
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditingInModal, setIsEditingInModal] = useState(false);

  if (!isOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setErrorMessage('لطفاً نام و نام خانوادگی خود را وارد نمایید.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('لطفاً یک آدرس ایمیل معتبر وارد نمایید.');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('لطفاً شماره تماس معتبر (حداقل ۱۰ یا ۱۱ رقم، مانند ۰۹۱۲...) وارد نمایید.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('رمز عبور باید حداقل ۴ نویسه باشد.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('تکرار رمز عبور با رمز عبور واردشده همخوانی ندارد.');
      return;
    }

    const res = db.register(cleanName, cleanEmail, cleanPhone, password);
    if (res.success) {
      setSuccessMessage('ثبت‌نام شما با موفقیت انجام شد. به سامانه خوش آمدید.');
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMessage(res.error || 'خطا در ثبت‌نام کاربر');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('لطفاً ایمیل خود را وارد نمایید.');
      return;
    }
    if (!password) {
      setErrorMessage('لطفاً رمز عبور خود را وارد نمایید.');
      return;
    }

    const res = db.login(cleanEmail, password);
    if (res.success && res.user) {
      setPassword('');
      // Check role returned from DB
      if (res.user.role === 'admin') {
        setSuccessMessage('ورود موفق مدیر سیستم. در حال انتقال به پنل مدیریت...');
        setTimeout(() => {
          onClose();
          if (onAdminLoginSuccess) {
            onAdminLoginSuccess();
          }
        }, 600);
      } else {
        setSuccessMessage('ورود موفقیت‌آمیز بود. در حال ورود به محیط ۳۶۰ درجه...');
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } else {
      setPassword('');
      setErrorMessage(res.error || 'اطلاعات ورود نامعتبر است.');
    }
  };

  const handleLogout = () => {
    db.logout();
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhone('');
    setMode('register');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const isCurrentSuperAdmin =
    currentUser?.role === 'admin' &&
    currentUser?.email.toLowerCase() === 'hamide67@gmail.com';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-right ${
        isMandatory ? 'pointer-events-auto' : ''
      }`}
    >
      <div className="w-full max-w-md glass-panel-card rounded-3xl border border-teal-500/30 p-6 sm:p-8 shadow-2xl relative text-right">
        {/* Close Button only if not mandatory */}
        {!isMandatory && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Branding */}
        <div className="mb-6 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
            <UserPlus className="w-4 h-4 text-teal-400" />
            <span>سامانه ارزیابی عملیات بحران شهری</span>
          </div>
          <h3 className="text-lg font-black text-white">
            {currentUser
              ? 'پروفایل کاربری'
              : mode === 'register'
              ? 'ثبت‌نام اولیه امدادگر'
              : 'ورود به حساب کاربری'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {currentUser
              ? 'مشاهده مشخصات کاربری و وضعیت دسترسی به سامانه'
              : mode === 'register'
              ? 'جهت شرکت در تور ۳۶۰ درجه، ارزیابی سوانح و ذخیره گواهی نجات، ثبت‌نام الزامی است.'
              : 'ورود به سامانه با استفاده از ایمیل و رمز عبور اختصاصی'}
          </p>
        </div>

        {/* Tab selection if not viewing profile */}
        {!currentUser && (
          <div className="flex border-b border-white/10 mb-6 pb-2 gap-4 text-xs font-bold">
            <button
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`pb-2 transition-colors border-b-2 -mb-2.5 cursor-pointer ${
                mode === 'register'
                  ? 'border-teal-400 text-teal-300 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ثبت‌نام (کاربر جدید)
            </button>
            <button
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`pb-2 transition-colors border-b-2 -mb-2.5 cursor-pointer ${
                mode === 'login'
                  ? 'border-teal-400 text-teal-300 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ورود به حساب کاربری
            </button>
          </div>
        )}

        {/* Feedback messages */}
        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Mode: Register */}
        {mode === 'register' && !currentUser && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                نام و نام خانوادگی *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: علیرضا رضایی"
                  className="w-full px-3.5 py-2.5 pr-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 transition-colors"
                />
                <User className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                آدرس ایمیل *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 transition-colors text-right"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute top-3 left-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                شماره تماس / موبایل *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 transition-colors text-right font-mono"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute top-3 left-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                رمز عبور *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل ۴ کاراکتر"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 pl-9 pr-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 transition-colors text-right"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-white absolute top-2 left-2 cursor-pointer"
                  title={showPassword ? 'مخفی کردن' : 'نمایش رمز'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                تکرار رمز عبور *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="تکرار رمز عبور"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 pl-9 pr-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 transition-colors text-right"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>ثبت‌نام و ورود به تور ۳۶۰ درجه</span>
              <Sparkles className="w-4 h-4 text-slate-950" />
            </button>
          </form>
        )}

        {/* Mode: Login */}
        {mode === 'login' && !currentUser && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                آدرس ایمیل *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 text-right"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute top-3 left-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                رمز عبور *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور خود را وارد کنید"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 pl-9 pr-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 text-right"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-white absolute top-2 left-2 cursor-pointer"
                  title={showPassword ? 'مخفی کردن' : 'نمایش رمز'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <LogIn className="w-4 h-4 text-slate-950" />
              <span>ورود به سامانه</span>
            </button>
          </form>
        )}

        {/* Mode: Profile Details */}
        {currentUser && (
          <div className="space-y-4">
            {/* Quick Status and Name Box */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-base shrink-0 border border-teal-500/30">
                    {currentUser.full_name.slice(0, 1)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{currentUser.full_name}</h4>
                    <div className="text-xs text-slate-400 font-mono" dir="ltr">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                {!isEditingInModal && (
                  <button
                    onClick={() => {
                      setFullName(currentUser.full_name);
                      setPhone(currentUser.phone || '');
                      setIsEditingInModal(true);
                      setErrorMessage(null);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>تغییر نام</span>
                  </button>
                )}
              </div>

              {/* Inline Form to change name & surname */}
              {isEditingInModal ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const cleanName = fullName.trim();
                    if (!cleanName) {
                      setErrorMessage('نام و نام خانوادگی الزامی است.');
                      return;
                    }
                    const res = db.updateProfile(currentUser.id, {
                      full_name: cleanName,
                      phone: phone.trim() || undefined,
                    });
                    if (res.success) {
                      setSuccessMessage('نام و مشخصات شما با موفقیت ذخیره شد.');
                      setIsEditingInModal(false);
                      setTimeout(() => setSuccessMessage(null), 3000);
                    } else {
                      setErrorMessage(res.error || 'خطا در ویرایش نام');
                    }
                  }}
                  className="pt-2 border-t border-white/10 space-y-3 animate-in fade-in duration-200"
                >
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
                        className="w-full px-3 py-2 pr-8 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-teal-400"
                      />
                      <User className="w-3.5 h-3.5 text-slate-400 absolute top-2.5 right-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      شماره تماس
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        dir="ltr"
                        className="w-full px-3 py-2 pl-8 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-teal-400 text-right font-mono"
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute top-2.5 left-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-teal-500/20"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>ذخیره تغییرات</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingInModal(false)}
                      className="px-3 py-2 text-slate-400 hover:text-white text-xs rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {currentUser.phone && (
                    <div className="text-xs text-teal-300 font-mono" dir="ltr">
                      📞 {currentUser.phone}
                    </div>
                  )}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                    <span>سطح دسترسی شما:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-lg text-[11px] ${
                        isCurrentSuperAdmin
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                      }`}
                    >
                      {isCurrentSuperAdmin ? 'مدیر سیستم (Admin)' : 'امدادگر داوطلب (User)'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Direct Button to User Panel & Score Overview */}
            {onOpenUserPanel && (
              <button
                onClick={() => {
                  onClose();
                  onOpenUserPanel();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20 active:scale-95"
              >
                <Trophy className="w-4 h-4" />
                <span>مشاهده پنل کاربری، کارنامه و مدیریت امتیازات</span>
              </button>
            )}

            {/* If Admin: Direct Button to Admin Panel */}
            {isCurrentSuperAdmin && onAdminLoginSuccess && (
              <button
                onClick={() => {
                  onClose();
                  onAdminLoginSuccess();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-950/40"
              >
                <Shield className="w-4 h-4 text-purple-300" />
                <span>ورود به پنل مدیریت (/admin)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/30 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از حساب کاربری</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
