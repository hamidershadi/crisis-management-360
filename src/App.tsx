/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { Profile, Stage } from './types/database';
import { UserDashboard } from './components/user/UserDashboard';
import { VirtualTourView } from './components/user/VirtualTourView';
import { UserProfilePanel } from './components/user/UserProfilePanel';
import { AdminLayout } from './components/admin/AdminLayout';
import { AuthModal } from './components/auth/AuthModal';
import {
  Compass,
  Shield,
  User,
  BookOpen,
  X,
  AlertOctagon,
  Trophy,
  Edit3,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(db.getCurrentUser());
  const [currentView, setCurrentView] = useState<'dashboard' | 'tour' | 'admin' | 'user-panel'>('tour');
  const [activeStage, setActiveStage] = useState<Stage>(db.getStages()[0]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [unauthorizedNotice, setUnauthorizedNotice] = useState<string | null>(null);

  // Check if current authenticated user has verified Admin role
  const isSuperAdmin = currentUser?.role === 'admin';

  // Subscribe to DB state updates
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      const u = db.getCurrentUser();
      setCurrentUser(u);
    });
    return unsubscribe;
  }, []);

  // Sync /admin route from URL on mount and browser navigation (Route Guard)
  useEffect(() => {
    const checkRouteSecurity = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const requestedAdmin =
        path === '/admin' ||
        path.startsWith('/admin/') ||
        hash === '#/admin' ||
        hash === '#admin';

      const user = db.getCurrentUser();
      const userIsAdmin = user?.role === 'admin';

      if (requestedAdmin) {
        if (userIsAdmin) {
          setCurrentView('admin');
        } else {
          // Block access immediately, reset URL to '/' and show unauthorized notice
          window.history.replaceState(null, '', '/');
          setCurrentView('tour');
          setUnauthorizedNotice(
            '⛔ دسترسی غیرمجاز: دسترسی به مسیر /admin مسدود شد. این بخش منحصراً در اختیار مدیر سیستم است و شما به صفحه اصلی هدایت شدید.'
          );
        }
      } else {
        if (currentView === 'admin' && !userIsAdmin) {
          setCurrentView('tour');
        }
      }
    };

    checkRouteSecurity();

    window.addEventListener('popstate', checkRouteSecurity);
    window.addEventListener('hashchange', checkRouteSecurity);
    return () => {
      window.removeEventListener('popstate', checkRouteSecurity);
      window.removeEventListener('hashchange', checkRouteSecurity);
    };
  }, [currentUser]);

  // Auto-dismiss unauthorized notice
  useEffect(() => {
    if (unauthorizedNotice) {
      const timer = setTimeout(() => {
        setUnauthorizedNotice(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [unauthorizedNotice]);

  const handleSelectStage = (stage: Stage) => {
    setActiveStage(stage);
    setCurrentView('tour');
    if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
    }
  };

  const handleResumeTour = () => {
    const latestStage = db.getUserLatestAvailableStage(currentUser?.id || 'demo');
    setActiveStage(latestStage);
    setCurrentView('tour');
    if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
    }
  };

  const handleNavigateToAdmin = () => {
    if (isSuperAdmin) {
      window.history.pushState(null, '', '/admin');
      setCurrentView('admin');
    }
  };

  const handleBackToTour = () => {
    window.history.pushState(null, '', '/');
    setCurrentView('tour');
  };

  // If Admin view is active and user is strictly admin:
  if (currentView === 'admin') {
    if (!isSuperAdmin) {
      window.history.replaceState(null, '', '/');
      setCurrentView('tour');
      return null;
    }
    return <AdminLayout onBackToApp={handleBackToTour} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0e13] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Unauthorized Access Security Banner */}
      {unauthorizedNotice && (
        <div className="bg-rose-950/90 border-b border-rose-500/40 text-rose-200 px-4 py-3 text-xs flex items-center justify-between sticky top-0 z-50 backdrop-blur-md animate-in slide-in-from-top duration-200 shadow-xl">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-semibold leading-relaxed">{unauthorizedNotice}</span>
          </div>
          <button
            onClick={() => setUnauthorizedNotice(null)}
            className="p-1 hover:bg-rose-900/50 rounded-lg text-rose-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 
        Top Bar:
        Zone 1: Single text element wordmark
        Zone 2: Clean navigation links
        Zone 3: Actions (Admin button ONLY for verified admin; User profile)
      */}
      <header className="h-16 px-4 sm:px-8 glass-panel border-b border-white/10 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl">
        {/* Zone 1: Wordmark */}
        <button
          onClick={() => {
            window.history.pushState(null, '', '/');
            setCurrentView('tour');
          }}
          className="text-base sm:text-lg font-black tracking-tight text-white hover:text-teal-300 transition-colors whitespace-nowrap shrink-0 text-right cursor-pointer"
        >
          تور مجازی مدیریت بحران
        </button>

        {/* Zone 2: Clean Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <button
            onClick={() => {
              window.history.pushState(null, '', '/');
              setCurrentView('tour');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
              currentView === 'tour' ? 'text-teal-400 font-bold' : ''
            }`}
          >
            تور ۳۶۰
          </button>
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
              currentView === 'dashboard' ? 'text-teal-400 font-bold' : ''
            }`}
          >
            معرفی سناریو
          </button>
          <button
            onClick={() => {
              if (currentUser) {
                setCurrentView('user-panel');
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              currentView === 'user-panel' ? 'text-teal-400 font-bold' : ''
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>کارنامه و امتیازات</span>
          </button>
          <button
            onClick={() => setShowRulesModal(true)}
            className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            قوانین
          </button>
          <button
            onClick={() => setShowAboutModal(true)}
            className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            درباره
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Admin Panel button - EXCLUSIVELY rendered if user role is admin and email is hamide67@gmail.com */}
          {isSuperAdmin && (
            <button
              onClick={handleNavigateToAdmin}
              className="px-3.5 py-2 text-xs font-bold text-purple-200 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shadow-lg shadow-purple-950/40 cursor-pointer"
              title="ورود به پنل مدیریت (/admin)"
            >
              <Shield className="w-3.5 h-3.5 text-purple-300" />
              <span>پنل مدیریت</span>
            </button>
          )}

          {/* User profile / Login trigger */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentView('user-panel')}
                className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  currentView === 'user-panel'
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-md shadow-teal-950/40 font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
                title="مشاهده پنل کاربری، کارنامه و تغییر نام"
              >
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline font-bold">{currentUser.full_name}</span>
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 cursor-pointer"
                title="تنظیمات حساب کاربری و خروج"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span>ورود / ثبت‌نام</span>
            </button>
          )}
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 w-full relative">
        {currentView === 'dashboard' && (
          <UserDashboard
            userId={currentUser?.id || 'demo'}
            onSelectStage={handleSelectStage}
            onResumeTour={handleResumeTour}
            onOpenUserPanel={() => {
              if (currentUser) {
                setCurrentView('user-panel');
              } else {
                setIsAuthModalOpen(true);
              }
            }}
          />
        )}

        {currentView === 'tour' && (
          <VirtualTourView
            stage={activeStage}
            userId={currentUser?.id || 'demo'}
            onBackToDashboard={() => setCurrentView('dashboard')}
            onSelectStage={handleSelectStage}
            onOpenUserPanel={() => {
              if (currentUser) {
                setCurrentView('user-panel');
              } else {
                setIsAuthModalOpen(true);
              }
            }}
          />
        )}

        {currentView === 'user-panel' && (
          <UserProfilePanel
            currentUser={currentUser}
            onNavigateToTour={(stage) => {
              if (stage) setActiveStage(stage);
              setCurrentView('tour');
            }}
            onBackToApp={() => setCurrentView('dashboard')}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 text-right">
          <div className="w-full max-w-lg glass-panel-card rounded-2xl border border-white/20 p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowRulesModal(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-400" />
              <span>قوانین تور پیوسته مدیریت بحران</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <strong className="text-teal-300 block mb-1">سناریوی یکپارچه و متوالی:</strong>
                این تور شامل ۳ فضای واقعی بحران شهری است: کوچه تخریب‌شده ➔ ساختمان آسیب‌دیده ➔ پناهگاه امن. تمام جابجایی‌ها به صورت پیوسته و خودکار درون همان نمایشگر انجام می‌پذیرد.
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                <strong className="block mb-1 font-bold">شرط انتقال خودکار به فضای بعدی:</strong>
                در هر فضا ۵ موقعیت ارزیابی بحران وجود دارد؛ کاربر باید به <strong className="underline font-bold">هر ۵ سؤال پاسخ صحیح بدهد (۵ از ۵)</strong>. در غیر این صورت ورود به مرحله بعد امکان‌پذیر نیست. با ثبت پنجمین پاسخ صحیح، سیستم بدون نیاز به کلیک جداگانه، تصویر فضای بعدی را در همان نمایشگر بارگذاری می‌کند.
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <strong className="text-emerald-300 block mb-1">ذخیره خودکار پیشرفت (Resume):</strong>
                در هر لحظه از خروج، آخرین وضعیت نجات و پاسخ‌های ثبت‌شده ذخیره شده و می‌توانید سناریو را از همان نقطه ادامه دهید.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors cursor-pointer"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 text-right">
          <div className="w-full max-w-lg glass-panel-card rounded-2xl border border-white/20 p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-teal-400" />
              <span>درباره سناریوی شبیه‌سازی مدیریت بحران ۳۶۰ درجه</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                این وب‌اپلیکیشن یک شبیه‌ساز واقعیت مجازی داستان‌محور برای آموزش تصمیم‌گیری در بحران‌های شهری (زلزله و تخریب زیرساخت) است.
              </p>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 font-mono text-[11px]" dir="ltr">
                <div>• Spaces: Damaged Street ➔ Damaged Building ➔ Safe Command Shelter</div>
                <div>• Seamless In-Viewer Transition: Automatic Fade Transition between Panoramas</div>
                <div>• Three.js WebGL: Spherical Inverted Geometry with Raycasting Hotspots</div>
                <div>• Security: Role-Based Access Control (Admin / User) with PostgreSQL RLS</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAboutModal(false)}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Dock (Visible on mobile outside 360 viewer) */}
      {currentView !== 'tour' && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-[#0b0e13]/95 border-t border-white/10 backdrop-blur-xl flex items-center justify-around px-2 text-[11px] font-semibold text-slate-400">
          <button
            onClick={() => {
              window.history.pushState(null, '', '/');
              setCurrentView('tour');
            }}
            className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer hover:text-white"
          >
            <Compass className="w-4 h-4 text-teal-400" />
            <span>تور ۳۶۰</span>
          </button>

          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              currentView === 'dashboard' ? 'text-teal-400 font-bold' : 'hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>معرفی</span>
          </button>

          <button
            onClick={() => {
              if (currentUser) {
                setCurrentView('user-panel');
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              currentView === 'user-panel' ? 'text-teal-400 font-bold' : 'hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>کارنامه</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={handleNavigateToAdmin}
              className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-purple-300 font-bold hover:text-white transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>مدیریت</span>
            </button>
          )}
        </nav>
      )}

      {/* Auth / Profile Modal: Mandatory at the beginning if user has not registered yet */}
      <AuthModal
        isOpen={!currentUser || isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        isMandatory={!currentUser}
        onAdminLoginSuccess={handleNavigateToAdmin}
        onOpenUserPanel={() => setCurrentView('user-panel')}
      />
    </div>
  );
}
