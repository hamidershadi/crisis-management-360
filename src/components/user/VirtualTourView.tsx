import React, { useState, useEffect } from 'react';
import { Stage, Hotspot, Question } from '../../types/database';
import { db } from '../../services/db';
import { resolvePanoramaUrl } from '../../assets/panoramas';
import { sound } from '../../utils/audio';
import { PanoramaViewer } from '../viewer/PanoramaViewer';
import { QuizModal } from '../quiz/QuizModal';
import { InfoModal } from '../hotspots/InfoModal';
import {
  ArrowRight,
  RotateCcw,
  Sparkles,
  Trophy,
  CheckCircle2,
  ChevronLeft,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Compass,
  Play,
  Flame,
  Building2,
  Home,
  Check,
  X,
  FastForward,
  Lock,
  ListOrdered,
} from 'lucide-react';

interface VirtualTourViewProps {
  stage?: Stage;
  initialStage?: Stage;
  userId: string;
  onBackToDashboard: () => void;
  onSelectStage?: (stage: Stage) => void;
  onOpenUserPanel?: () => void;
}

export const VirtualTourView: React.FC<VirtualTourViewProps> = ({
  stage,
  initialStage,
  userId,
  onBackToDashboard,
  onSelectStage,
  onOpenUserPanel,
}) => {
  const allStages = db.getStages();
  const [currentStage, setCurrentStage] = useState<Stage>(() => {
    const candidate = stage || initialStage || db.getUserLatestAvailableStage(userId);
    const status = db.getUserStageStatus(userId, candidate.id);
    return status.isUnlocked ? candidate : db.getUserLatestAvailableStage(userId);
  });

  useEffect(() => {
    if (stage && stage.id !== currentStage.id) {
      const status = db.getUserStageStatus(userId, stage.id);
      if (status.isUnlocked) {
        setCurrentStage(stage);
      } else {
        sound.playError();
        setLockedToast(`فضای «${stage.title}» قفل است (نیاز به ۵ پاسخ صحیح در فضای قبلی)`);
        setTimeout(() => setLockedToast(null), 3500);
      }
    }
  }, [stage, userId]);

  // Preload all 3 360 images for zero-lag instant transitions
  useEffect(() => {
    allStages.forEach((stg) => {
      const p = db.getPanoramaById(stg.panorama_id);
      const url = p?.file_url || resolvePanoramaUrl(stg.panorama_id);
      if (url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
      }
    });
  }, []);

  const [activeQuizQuestion, setActiveQuizQuestion] = useState<Question | null>(null);
  const [activeInfoHotspot, setActiveInfoHotspot] = useState<Hotspot | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Seamless Story Transition State
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');
  const [showAutoAdvanceBanner, setShowAutoAdvanceBanner] = useState<{
    text: string;
    nextTitle: string;
  } | null>(null);

  // Toast alert for locked stage click
  const [lockedToast, setLockedToast] = useState<string | null>(null);

  // Final mission completion debrief modal
  const [showMissionCompleteModal, setShowMissionCompleteModal] = useState(false);

  // Quick intro hint modal on first view
  const [showIntroCard, setShowIntroCard] = useState<boolean>(() => {
    return !sessionStorage.getItem('tour_intro_dismissed');
  });

  const panorama = db.getPanoramaById(currentStage.panorama_id);
  const hotspots = db.getHotspots(currentStage.id);
  const stageQuestions = db.getQuestions(currentStage.id);
  const stageStatus = db.getUserStageStatus(userId, currentStage.id);

  const currentStageIndex = allStages.findIndex((s) => s.id === currentStage.id);
  const isFinalSpace = currentStageIndex === allStages.length - 1;
  const nextStage = !isFinalSpace ? allStages[currentStageIndex + 1] : null;

  // The next unanswered question for this current stage
  const nextUnansweredQuestion =
    stageQuestions.find((q) => !db.isQuestionAnsweredCorrectly(userId, q.id)) ||
    stageQuestions[0];

  // Seamlessly transition to a stage inside the same 360 viewer with cinematic fade
  const executeSeamlessTransition = (targetStage: Stage, customMessage?: string) => {
    sound.playTransition();
    setIsTransitioning(true);
    setTransitionMessage(
      customMessage || `در حال ورود به ${targetStage.title}... انتقال پیوسته در فضای ۳۶۰ درجه`
    );
    setActiveQuizQuestion(null);
    setActiveInfoHotspot(null);
    setShowAutoAdvanceBanner(null);

    // Wait for black fade out and camera zoom
    setTimeout(() => {
      setCurrentStage(targetStage);
      setRefreshKey((k) => k + 1);

      // Fade in after texture applies
      setTimeout(() => {
        setIsTransitioning(false);
      }, 700);
    }, 600);
  };

  const handleHotspotClick = (hotspot: Hotspot) => {
    if (isTransitioning) return;
    sound.playTap();

    if (hotspot.hotspot_type === 'question') {
      const q = db.getQuestionByHotspotId(hotspot.id);
      if (q) {
        setActiveQuizQuestion(q);
      }
    } else {
      setActiveInfoHotspot(hotspot);
    }
  };

  const handleSubmitAnswer = (optionId: string) => {
    if (!activeQuizQuestion) {
      return {
        isCorrect: false,
        stageCompleted: false,
        stagePassed: false,
        correctCount: 0,
        totalQuestions: 5,
      };
    }

    const result = db.submitAnswer(userId, currentStage.id, activeQuizQuestion.id, optionId);
    setRefreshKey((k) => k + 1);

    // STRICT USER REQUIREMENT:
    // Only when ALL 5 questions in the current stage are answered correctly (stagePassed === true)
    // does the automatic transition to the next 360 space trigger!
    if (result.stagePassed) {
      if (nextStage) {
        setShowAutoAdvanceBanner({
          text: `تمام ۵ سؤال ${currentStage.title} با موفقیت و صحیح پاسخ داده شد!`,
          nextTitle: nextStage.title,
        });

        // Trigger automatic seamless fade transition after 2 seconds
        setTimeout(() => {
          executeSeamlessTransition(nextStage);
        }, 2200);
      } else {
        // Final stage completed (Reached Safe Shelter!)
        setTimeout(() => {
          sound.playSuccess();
          setShowMissionCompleteModal(true);
        }, 1500);
      }
    }

    return result;
  };

  const handleGoToNextQuestion = () => {
    if (!activeQuizQuestion) return;
    const activeIdx = stageQuestions.findIndex((q) => q.id === activeQuizQuestion.id);

    // Find next question in stage that is not yet answered correctly
    const nextQ =
      stageQuestions.slice(activeIdx + 1).find((q) => !db.isQuestionAnsweredCorrectly(userId, q.id)) ||
      stageQuestions.find((q) => q.id !== activeQuizQuestion.id && !db.isQuestionAnsweredCorrectly(userId, q.id)) ||
      (activeIdx < stageQuestions.length - 1 ? stageQuestions[activeIdx + 1] : undefined);

    if (nextQ) {
      sound.playTap();
      setActiveQuizQuestion(nextQ);
    }
  };

  const handleRestartEntireTour = () => {
    if (confirm('آیا می‌خواهید سناریوی بحران را از ابتدای «کوچه تخریب‌شده» مجدداً شروع کنید؟')) {
      allStages.forEach((s) => db.resetStageProgress(userId, s.id));
      setRefreshKey((k) => k + 1);
      executeSeamlessTransition(allStages[0], 'شروع مجدد سناریوی پیوسته از کوچه تخریب‌شده...');
    }
  };

  const handleResetStage = () => {
    if (confirm('آیا مایلید ارزیابی این محیط را دوباره از ابتدا انجام دهید؟')) {
      db.resetStageProgress(userId, currentStage.id);
      setRefreshKey((k) => k + 1);
    }
  };

  const isHotspotAnswered = (hotspotId: string) => {
    return db.isHotspotAnsweredCorrectly(userId, hotspotId);
  };

  const currentQIndex = activeQuizQuestion
    ? stageQuestions.findIndex((q) => q.id === activeQuizQuestion.id) + 1
    : 1;

  const previouslyAnsweredOption = activeQuizQuestion
    ? db.getUserAnswers(userId, currentStage.id).find((a) => a.question_id === activeQuizQuestion.id)?.selected_option_id
    : undefined;

  const isCurrentQCorrect = activeQuizQuestion
    ? db.isQuestionAnsweredCorrectly(userId, activeQuizQuestion.id)
    : false;

  const stageShortTitles = ['۱. کوچه تخریب‌شده', '۲. ساختمان آسیب‌دیده', '۳. پناهگاه امن'];

  // Check if there is another question after the current one
  const hasNextQuestionInStage = Boolean(
    activeQuizQuestion &&
    stageQuestions.some(
      (q) => q.id !== activeQuizQuestion.id && !db.isQuestionAnsweredCorrectly(userId, q.id)
    )
  );

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-black flex flex-col select-none">
      {/* Sleek Floating Top HUD (Unified, Zero Clutter) */}
      <header className="absolute top-3 inset-x-2 sm:inset-x-5 z-30 flex items-center justify-between gap-2 pointer-events-auto">
        {/* Right: Stage Title & Quick Space Switcher */}
        <div className="flex items-center gap-2 px-3 py-1.5 glass-panel-card rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl shrink-0">
          <span className="text-xs font-bold text-white whitespace-nowrap">
            {stageShortTitles[currentStageIndex] || currentStage.title}
          </span>
          <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
            {allStages.map((stg, sIdx) => {
              const isActive = stg.id === currentStage.id;
              const isPassed = db.getUserStageStatus(userId, stg.id).isCompleted;
              const isUnlocked = db.getUserStageStatus(userId, stg.id).isUnlocked;

              return (
                <button
                  key={stg.id}
                  onClick={() => {
                    if (isUnlocked && !isActive) {
                      executeSeamlessTransition(stg);
                    } else if (!isUnlocked) {
                      sound.playError();
                      setLockedToast(`فضای ${sIdx + 1} قفل است (نیاز به ۵ پاسخ صحیح در فضای قبلی)`);
                      setTimeout(() => setLockedToast(null), 3000);
                    }
                  }}
                  className={`w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-500/30'
                      : isPassed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/5 text-slate-500 hover:text-slate-300'
                  }`}
                  title={stg.title}
                >
                  {sIdx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: 5 Questions Quick Stepper (Compact & Minimal) */}
        {!isTransitioning && stageQuestions.length > 0 && (
          <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 glass-panel-card rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
            {stageQuestions.map((q, idx) => {
              const isCorrect = db.isQuestionAnsweredCorrectly(userId, q.id);
              const isCurrent = activeQuizQuestion?.id === q.id;

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    sound.playTap();
                    setActiveQuizQuestion(q);
                  }}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                    isCorrect
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : isCurrent
                      ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/40 ring-2 ring-teal-300/50'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  }`}
                  title={q.question_text}
                >
                  {isCorrect ? (
                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Left: Quick Actions (Score Tracker + Reset + Exit) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenUserPanel && (
            <button
              onClick={onOpenUserPanel}
              className="px-2.5 py-1.5 glass-panel-card rounded-2xl border border-white/10 text-xs font-bold text-teal-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer shadow-xl backdrop-blur-xl"
              title="مشاهده کارنامه امتیازات"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="tabular-nums">{stageStatus.correctCount}/۵</span>
            </button>
          )}

          <button
            onClick={handleRestartEntireTour}
            className="p-2 glass-panel-card rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer shadow-xl backdrop-blur-xl"
            title="شروع مجدد از ابتدای کوچه"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              sound.playTap();
              onBackToDashboard();
            }}
            className="p-2 glass-panel-card rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer shadow-xl backdrop-blur-xl"
            title="بازگشت به معرفی سناریو"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 360 Panorama Viewer */}
      <div className="flex-1 w-full h-full relative" key={`${currentStage.id}_${refreshKey}`}>
        <PanoramaViewer
          panoramaUrl={panorama?.file_url || resolvePanoramaUrl(currentStage.panorama_id)}
          stageTitle={currentStage.title}
          stageDescription={currentStage.description}
          hotspots={hotspots}
          onHotspotClick={handleHotspotClick}
          initialYaw={currentStage.initial_yaw}
          initialPitch={currentStage.initial_pitch}
          initialFov={currentStage.initial_fov}
          answeredQuestionsCount={stageStatus.correctCount}
          totalQuestionsCount={stageQuestions.length || 5}
          isAnsweredCorrectly={isHotspotAnswered}
          isTransitioning={isTransitioning}
          transitionMessage={transitionMessage}
        />
      </div>

      {/* Floating Locked Warning Toast */}
      {lockedToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs rounded-2xl shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{lockedToast}</span>
        </div>
      )}

      {/* Auto-Advance Floating Story Alert (Shows right after 5th correct answer) */}
      {showAutoAdvanceBanner && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-4 glass-panel-card rounded-2xl border border-teal-400/60 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-top-4 duration-300 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2 text-sm font-black text-teal-300">
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow" />
            <span>{showAutoAdvanceBanner.text}</span>
          </div>
          <p className="text-xs text-slate-300">
            در حال انتقال خودکار به فضای بعدی: <strong className="text-white font-bold">{showAutoAdvanceBanner.nextTitle}</strong>...
          </p>
        </div>
      )}

      {/* Welcome / Quick Mission Guidance Overlay (One-click Dismiss) */}
      {showIntroCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-right">
          <div className="w-full max-w-md glass-panel-card rounded-3xl border border-teal-400/30 p-6 sm:p-7 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-2.5 text-teal-300 font-bold text-sm">
              <Compass className="w-5 h-5" />
              <span>قوانین تور پیوسته مدیریت بحران</span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white leading-snug">
              پاسخ صحیح به ۵ سؤال در هر فضا الزامی است
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              برای عبور از هر فضا و ورود به مرحله بعدی، باید به <strong className="text-teal-300 underline font-bold">هر ۵ سؤال</strong> آن مرحله پاسخ صحیح بدهید:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span><strong>فضای اول:</strong> کوچه تخریب‌شده</span>
                <span className="text-amber-300 font-mono">۵ سؤال صحیح</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span><strong>فضای دوم:</strong> ساختمان آسیب‌دیده</span>
                <span className="text-amber-300 font-mono">۵ سؤال صحیح</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span><strong>فضای سوم:</strong> پناهگاه امن بحران</span>
                <span className="text-amber-300 font-mono">۵ سؤال صحیح</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-200 leading-relaxed">
              ⚡ به محض پاسخ صحیح به پنجمین سؤال، سیستم به صورت کاملاً خودکار شما را به فضای ۳۶۰ بعدی منتقل می‌کند.
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  sound.playTap();
                  setShowIntroCard(false);
                  sessionStorage.setItem('tour_intro_dismissed', 'true');
                }}
                className="w-full py-3 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95"
              >
                متوجه شدم، ورود به تور ۳۶۰ درجه
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal (In-scene modal with immediate feedback and question flow) */}
      {activeQuizQuestion && (
        <QuizModal
          key={activeQuizQuestion.id}
          question={activeQuizQuestion}
          stage={currentStage}
          userId={userId}
          questionNumber={currentQIndex}
          totalQuestions={stageQuestions.length}
          previouslyAnsweredOptionId={previouslyAnsweredOption}
          isAlreadyCorrect={isCurrentQCorrect}
          onClose={() => setActiveQuizQuestion(null)}
          onSubmitAnswer={handleSubmitAnswer}
          onNextStage={() => {
            if (nextStage) {
              executeSeamlessTransition(nextStage);
            }
          }}
          onRetryStage={handleResetStage}
          onGoToNextQuestion={handleGoToNextQuestion}
          hasNextQuestionInStage={hasNextQuestionInStage}
        />
      )}

      {/* Info Modal */}
      {activeInfoHotspot && (
        <InfoModal
          hotspot={activeInfoHotspot}
          onClose={() => setActiveInfoHotspot(null)}
        />
      )}

      {/* Final Mission Completion Modal (Safe Shelter Reached!) */}
      {showMissionCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300 text-right">
          <div className="w-full max-w-lg glass-panel-card rounded-3xl border border-teal-400/40 p-6 sm:p-8 shadow-2xl relative space-y-5 text-right">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center mx-auto shadow-xl">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                پایان موفقیت‌آمیز سناریوی مدیریت بحران!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                شما با موفقیت به <strong className="text-teal-300">تمام ۱۵ سؤال (۵ سؤال در هر فضا)</strong> پاسخ صحیح داده، مسیر را از کوچه تخریب‌شده و ساختمان آسیب‌دیده طی کرده و به پناهگاه امن رسیدید.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>تعداد پاسخ‌های صحیح ثبت‌شده:</span>
                <span className="font-bold text-teal-300 tabular-nums">۱۵ از ۱۵ سؤال (۱۰۰٪)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>فضاهای پاک‌سازی‌شده:</span>
                <span className="font-bold text-white tabular-nums">۳ از ۳ محیط ۳۶۰ درجه</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>وضعیت گواهی عملیاتی:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> تأییدشده با نمره کامل
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  sound.playTap();
                  setShowMissionCompleteModal(false);
                  onBackToDashboard();
                }}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-all shadow-lg shadow-teal-500/20"
              >
                مشاهده کارنامه در داشبورد
              </button>

              <button
                onClick={() => {
                  sound.playTap();
                  setShowMissionCompleteModal(false);
                  handleRestartEntireTour();
                }}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-white bg-white/10 hover:bg-white/15 rounded-xl transition-colors"
              >
                شروع مجدد تور از ابتدا
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
