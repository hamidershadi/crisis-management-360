import React, { useState } from 'react';
import { db } from '../../services/db';
import { Profile, UserRole } from '../../types/database';
import {
  Users,
  Shield,
  User,
  RotateCcw,
  UserPlus,
  Edit3,
  Trash2,
  Search,
  Check,
  X,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Key,
  Copy,
  AlertTriangle,
  Sparkles,
  Trophy,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>(db.getProfiles());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  
  // Modals state
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Edit form state
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Create form state
  const [createFullName, setCreateFullName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<UserRole>('user');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Feedback toast
  const [feedbackToast, setFeedbackToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const stages = db.getStages();
  const currentUser = db.getCurrentUser();

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ text, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const reloadProfiles = () => {
    setProfiles(db.getProfiles());
  };

  // Open Edit Modal
  const handleOpenEdit = (profile: Profile) => {
    setEditingUser(profile);
    setEditFullName(profile.full_name);
    setEditEmail(profile.email);
    setEditPhone(profile.phone || '');
    setEditPassword(profile.password || '');
    setEditRole(profile.role);
    setShowEditPassword(false);
    setEditError(null);
    setEditSuccess(null);
  };

  // Submit Edit Form
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);

    const cleanName = editFullName.trim();
    const cleanEmail = editEmail.trim();
    const cleanPhone = editPhone.trim();
    const cleanPassword = editPassword.trim();

    if (!cleanName) {
      setEditError('نام و نام خانوادگی الزامی است.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setEditError('آدرس ایمیل واردشده معتبر نیست.');
      return;
    }

    const res = db.updateProfile(editingUser.id, {
      full_name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: cleanPassword || undefined,
      role: editRole,
    });

    if (!res.success) {
      setEditError(res.error || 'خطا در ویرایش کاربر');
      return;
    }

    reloadProfiles();
    setEditSuccess('اطلاعات کاربر با موفقیت به‌روزرسانی شد.');
    showToast(`اطلاعات "${cleanName}" با موفقیت ذخیره شد.`);

    setTimeout(() => {
      setEditingUser(null);
    }, 700);
  };

  // Submit Create Form
  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const cleanName = createFullName.trim();
    const cleanEmail = createEmail.trim();
    const cleanPhone = createPhone.trim();
    const cleanPassword = createPassword.trim();

    if (!cleanName) {
      setCreateError('نام و نام خانوادگی الزامی است.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setCreateError('آدرس ایمیل نامعتبر است.');
      return;
    }

    const res = db.createUser({
      full_name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: cleanPassword || '123456',
      role: createRole,
    });

    if (!res.success) {
      setCreateError(res.error || 'خطا در ایجاد کاربر');
      return;
    }

    reloadProfiles();
    showToast(`کاربر جدید "${cleanName}" با موفقیت ایجاد شد.`);
    setIsCreateModalOpen(false);

    // Reset create fields
    setCreateFullName('');
    setCreateEmail('');
    setCreatePhone('');
    setCreatePassword('');
    setCreateRole('user');
  };

  // Quick Role Toggle
  const handleRoleToggle = (profile: Profile) => {
    const isSelf = profile.id === currentUser?.id;
    const newRole: UserRole = profile.role === 'admin' ? 'user' : 'admin';

    if (isSelf && profile.role === 'admin') {
      if (!confirm('آیا مطمئن هستید که می‌خواهید نقش مدیریت خود را به کاربر عادی تغییر دهید؟ با این کار دسترسی شما به پنل مدیریت بسته خواهد شد.')) {
        return;
      }
    }

    const res = db.updateProfile(profile.id, { role: newRole });
    if (res.success) {
      reloadProfiles();
      showToast(`نقش "${profile.full_name}" به ${newRole === 'admin' ? 'مدیر سیستم' : 'کاربر عادی'} تغییر کرد.`);
    } else {
      showToast(res.error || 'خطا در تغییر نقش', 'error');
    }
  };

  // Delete User
  const handleDeleteUser = (profile: Profile) => {
    if (profile.id === currentUser?.id) {
      alert('امکان حذف حسابی که در حال حاضر با آن وارد پنل مدیریت شده‌اید وجود ندارد.');
      return;
    }

    if (confirm(`آیا از حذف کامل کاربر "${profile.full_name}" (${profile.email}) اطمینان دارید؟ تمامی پیشرفت‌ها و سوابق این کاربر حذف خواهند شد.`)) {
      const res = db.deleteProfile(profile.id);
      if (res.success) {
        reloadProfiles();
        showToast(`کاربر "${profile.full_name}" حذف شد.`);
      } else {
        showToast(res.error || 'خطا در حذف کاربر', 'error');
      }
    }
  };

  // Reset Progress
  const handleResetUserProgress = (userId: string, userName: string) => {
    if (confirm(`آیا می‌خواهید پیشرفت آزمون کاربر "${userName}" در تمام مراحل بازنشانی شود؟`)) {
      stages.forEach((s) => {
        db.resetStageProgress(userId, s.id);
      });
      reloadProfiles();
      showToast(`پیشرفت آزمون‌های "${userName}" با موفقیت بازنشانی شد.`);
    }
  };

  // Copy Email Helper
  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter & Search profiles
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phone && p.phone.includes(searchQuery));

    const matchesRole =
      roleFilter === 'all' ? true : p.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Counters
  const totalCount = profiles.length;
  const adminCount = profiles.filter((p) => p.role === 'admin').length;
  const userCount = profiles.filter((p) => p.role === 'user').length;
  const completedAllCount = profiles.filter((p) => {
    return stages.every((s) => db.getUserStageStatus(p.id, s.id).isCompleted);
  }).length;

  return (
    <div className="space-y-6 text-right animate-in fade-in duration-200">
      {/* Toast Notification */}
      {feedbackToast && (
        <div
          className={`fixed bottom-6 left-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold backdrop-blur-md animate-in slide-in-from-bottom duration-200 ${
            feedbackToast.type === 'error'
              ? 'bg-rose-950/90 border border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/90 border border-emerald-500/40 text-emerald-200'
          }`}
        >
          <span>{feedbackToast.text}</span>
        </div>
      )}

      {/* Top Header & Stat Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            <span>مدیریت و ویرایش جامع کاربران و مدیران</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            امکان ویرایش کامل مشخصات کلیه حساب‌ها (نام، ایمیل، شماره تماس، رمز عبور و سطح دسترسی)
          </p>
        </div>

        <button
          onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>افزودن کاربر جدید</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">کل کاربران ثبت‌شده</div>
            <div className="text-base font-black text-white tabular-nums">{totalCount} نفر</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">مدیران سیستم (Admin)</div>
            <div className="text-base font-black text-purple-300 tabular-nums">{adminCount} مدیر</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">امدادگران داوطلب (User)</div>
            <div className="text-base font-black text-blue-300 tabular-nums">{userCount} امدادگر</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">اتمام موفق کل سناریو</div>
            <div className="text-base font-black text-amber-300 tabular-nums">{completedAllCount} نفر</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو بر اساس نام، ایمیل یا شماره تماس..."
            className="w-full px-3.5 py-2 pr-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
          <span className="text-slate-400 text-[11px] ml-1">فیلتر نقش:</span>
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              roleFilter === 'all'
                ? 'bg-teal-400 text-slate-950 font-bold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            همه ({totalCount})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              roleFilter === 'admin'
                ? 'bg-purple-500 text-white font-bold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            مدیران ({adminCount})
          </button>
          <button
            onClick={() => setRoleFilter('user')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              roleFilter === 'user'
                ? 'bg-blue-500 text-white font-bold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            کاربران عادی ({userCount})
          </button>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400">
                <th className="py-3.5 px-4 text-right">مشخصات کاربر</th>
                <th className="py-3.5 px-4 text-right">آدرس ایمیل</th>
                <th className="py-3.5 px-4 text-right">شماره موبایل</th>
                <th className="py-3.5 px-4 text-center">رمز عبور</th>
                <th className="py-3.5 px-4 text-center">نقش کاربری</th>
                <th className="py-3.5 px-4 text-center">پیشرفت آزمون‌ها</th>
                <th className="py-3.5 px-left text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    کاربری با مشخصات جستجو شده یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => {
                  let completedCount = 0;
                  stages.forEach((s) => {
                    if (db.getUserStageStatus(p.id, s.id).isCompleted) completedCount++;
                  });

                  const isCurrentLoggedIn = p.id === currentUser?.id;

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors hover:bg-white/5 ${
                        isCurrentLoggedIn ? 'bg-purple-950/20' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                              p.role === 'admin'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                            }`}
                          >
                            {p.full_name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{p.full_name}</span>
                              {isCurrentLoggedIn && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/30 text-purple-200 border border-purple-500/40">
                                  حساب شما
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                              ID: {p.id.slice(0, 14)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-300 text-[11px]" dir="ltr">
                            {p.email}
                          </span>
                          <button
                            onClick={() => handleCopyEmail(p.email, p.id)}
                            className="p-1 text-slate-500 hover:text-white rounded hover:bg-white/10 transition-colors"
                            title="کپی آدرس ایمیل"
                          >
                            {copiedId === p.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-teal-300 text-[11px]" dir="ltr">
                        {p.phone || <span className="text-slate-500 font-sans italic">ثبت نشده</span>}
                      </td>

                      {/* Password Security Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className="inline-flex items-center gap-1 font-mono text-emerald-400 text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                          title="رمز عبور با استاندارد رمزنگاری امن SHA-256 هش شده است"
                        >
                          <Lock className="w-2.5 h-2.5 text-emerald-400" />
                          <span>رمزنگاری امن</span>
                        </span>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleRoleToggle(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                            p.role === 'admin'
                              ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 shadow-sm'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                          }`}
                          title="کلیک برای تغییر سریع نقش کاربری"
                        >
                          {p.role === 'admin' ? (
                            <>
                              <Shield className="w-3.5 h-3.5 text-purple-300" />
                              <span>مدیر سیستم</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>کاربر عادی</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Progress */}
                      <td className="py-3.5 px-4 text-center tabular-nums font-semibold text-white">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] ${
                            completedCount === stages.length
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : completedCount > 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'text-slate-400'
                          }`}
                        >
                          {completedCount} از {stages.length} مرحله
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Full Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="px-2.5 py-1 text-[11px] font-bold text-teal-300 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            title="ویرایش کامل مشخصات (نام، ایمیل، موبایل، رمز عبور)"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>ویرایش کامل</span>
                          </button>

                          {/* Reset progress */}
                          <button
                            onClick={() => handleResetUserProgress(p.id, p.full_name)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                            title="بازنشانی پیشرفت آزمون‌ها"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => handleDeleteUser(p)}
                            disabled={isCurrentLoggedIn}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrentLoggedIn
                                ? 'text-slate-600 cursor-not-allowed opacity-40'
                                : 'text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 cursor-pointer'
                            }`}
                            title={isCurrentLoggedIn ? 'امکان حذف حساب کاربری خودتان وجود ندارد' : 'حذف کاربر'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: Full Edit User (Includes editing Admin themselves)     */}
      {/* ============================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-right">
          <div className="w-full max-w-lg glass-panel-card rounded-3xl border border-teal-500/30 p-6 sm:p-8 shadow-2xl relative space-y-5">
            {/* Close Button */}
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                <Edit3 className="w-4 h-4 text-teal-400" />
                <span>ویرایش اطلاعات کاربر</span>
              </div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>{editingUser.full_name}</span>
                {editingUser.id === currentUser?.id && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    حساب کاربری فعلی شما
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                می‌توانید تمامی مشخصات هویتی، اطلاعات تماس، کلمه عبور و سطح دسترسی این کاربر را تغییر دهید.
              </p>
            </div>

            {/* Warning for editing self */}
            {editingUser.id === currentUser?.id && (
              <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-2 leading-relaxed">
                <Sparkles className="w-4 h-4 text-purple-300 shrink-0" />
                <span>
                  نکته: با تغییر ایمیل یا رمز عبور حساب خود، ورودهای بعدی شما با مشخصات جدید انجام خواهد شد و نشست فعلی به‌طور آنی آپدیت می‌شود.
                </span>
              </div>
            )}

            {/* Error / Success Feedback */}
            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>{editSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  نام و نام خانوادگی *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="نام کامل"
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
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="email@example.com"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 transition-colors text-right"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute top-3 left-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  شماره تماس / موبایل
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 transition-colors text-right font-mono"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute top-3 left-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  کلمه عبور (جهت ورود به حساب)
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="رمز عبور کاربر"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 pl-9 pr-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 transition-colors text-right"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="p-1 text-slate-400 hover:text-white absolute top-2 left-2 cursor-pointer"
                    title={showEditPassword ? 'مخفی کردن' : 'نمایش رمز'}
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">
                  سطح دسترسی (نقش کاربری)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditRole('admin')}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2.5 ${
                      editRole === 'admin'
                        ? 'bg-purple-500/20 border-purple-500/50 text-white shadow-lg shadow-purple-950/40'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Shield className={`w-4 h-4 ${editRole === 'admin' ? 'text-purple-300' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-xs text-white">مدیر سیستم (Admin)</div>
                      <div className="text-[10px] text-slate-400">دسترسی به پنل مدیریت و تور</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('user')}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2.5 ${
                      editRole === 'user'
                        ? 'bg-teal-500/20 border-teal-500/50 text-white shadow-lg shadow-teal-950/40'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <User className={`w-4 h-4 ${editRole === 'user' ? 'text-teal-300' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-xs text-white">کاربر عادی (User)</div>
                      <div className="text-[10px] text-slate-400">دسترسی به تور و آزمون‌ها</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-lg shadow-teal-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>ذخیره تغییرات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Create New User                                         */}
      {/* ============================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-right">
          <div className="w-full max-w-lg glass-panel-card rounded-3xl border border-teal-500/30 p-6 sm:p-8 shadow-2xl relative space-y-5">
            {/* Close Button */}
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                <UserPlus className="w-4 h-4 text-teal-400" />
                <span>تعریف کاربر جدید توسط مدیر</span>
              </div>
              <h3 className="text-lg font-black text-white">افزودن حساب کاربری جدید</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                حساب کاربری جدید برای امدادگر یا مدیر کمکی با رمز عبور دلخواه ایجاد کنید.
              </p>
            </div>

            {/* Error Feedback */}
            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  نام و نام خانوادگی *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={createFullName}
                    onChange={(e) => setCreateFullName(e.target.value)}
                    placeholder="مثال: مریم کاظمی"
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
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="user@example.com"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 transition-colors text-right"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute top-3 left-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  شماره تماس / موبایل
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 transition-colors text-right font-mono"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute top-3 left-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  کلمه عبور اختصاصی *
                </label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    required
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="حداقل ۴ کاراکتر"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 pl-9 pr-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 transition-colors text-right"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="p-1 text-slate-400 hover:text-white absolute top-2 left-2 cursor-pointer"
                    title={showCreatePassword ? 'مخفی کردن' : 'نمایش رمز'}
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">
                  سطح دسترسی (نقش)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateRole('admin')}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2.5 ${
                      createRole === 'admin'
                        ? 'bg-purple-500/20 border-purple-500/50 text-white shadow-lg shadow-purple-950/40'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Shield className={`w-4 h-4 ${createRole === 'admin' ? 'text-purple-300' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-xs text-white">مدیر سیستم (Admin)</div>
                      <div className="text-[10px] text-slate-400">دسترسی به پنل مدیریت</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateRole('user')}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2.5 ${
                      createRole === 'user'
                        ? 'bg-teal-500/20 border-teal-500/50 text-white shadow-lg shadow-teal-950/40'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <User className={`w-4 h-4 ${createRole === 'user' ? 'text-teal-300' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-xs text-white">کاربر عادی (User)</div>
                      <div className="text-[10px] text-slate-400">دسترسی به تور مجازی</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-lg shadow-teal-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>ثبت و ایجاد کاربر</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
