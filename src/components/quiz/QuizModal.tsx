import React, { useState, useEffect } from 'react';
import { Question, QuestionOption, Stage } from '../../types/database';
import { sound } from '../../utils/audio';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Trophy,
  FastForward,
  ChevronLeft,
  HelpCircle,
} from 'lucide-react';

interface QuizModalProps {
  question: Question;
  stage: Stage;
  userId: string;
  questionNumber: number;
  totalQuestions: number;
  previouslyAnsweredOptionId?: string;
  isAlreadyCorrect?: boolean;
  onClose: () => void;
  onSubmitAnswer: (optionId: string) => {
    isCorrect: boolean;
    stageCompleted: boolean;
    stagePassed: boolean;
    correctCount: number;
    totalQuestions: number;
    explanation?: string;
  };
  onNextStage?: () => void;
  onRetryStage?: () => void;
  onGoToNextQuestion?: () => void;
  hasNextQuestionInStage?: boolean;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  question,
  stage,
  questionNumber,
  totalQuestions,
  previouslyAnsweredOptionId,
  isAlreadyCorrect = false,
  onClose,
  onSubmitAnswer,
  onNextStage,
  onRetryStage,
  onGoToNextQuestion,
  hasNextQuestionInStage = false,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    previouslyAnsweredOptionId || ''
  );
  const [submittedResult, setSubmittedResult] = useState<{
    isCorrect: boolean;
    stageCompleted: boolean;
    stagePassed: boolean;
    correctCount: number;
    totalQuestions: number;
    explanation?: string;
  } | null>(null);

  const [countdown, setCountdown] = useState<number | null>(null);

  // Sync state only if question changes (remounting or changing question ID)
  useEffect(() => {
    setSelectedOptionId(previouslyAnsweredOptionId || '');
    setSubmittedResult(null);
    setCountdown(null);
  }, [question.id]);

  // Strictly enforce exactly 4 options
  const options = (question.options || []).slice(0, 4);

  const handleSelectOption = (optionId: string) => {
    sound.playTap();
    setSelectedOptionId(optionId);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!selectedOptionId) return;

    sound.playTap();
    const result = onSubmitAnswer(selectedOptionId);
    setSubmittedResult(result);

    if (result.isCorrect) {
      sound.playSuccess();
      if (result.stagePassed && onNextStage) {
        // All 5 questions answered correctly! Start 2-second countdown to next 360 space
        setCountdown(2);
      }
    } else {
      sound.playError();
    }
  };

  // Handle auto-advance countdown timer for completing all 5 questions
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((c) => (c !== null ? c - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Countdown finished -> advance to next stage!
      if (onNextStage) {
        onNextStage();
      } else {
        onClose();
      }
    }
  }, [countdown, onNextStage, onClose]);

  const handleRetryChoice = () => {
    sound.playTap();
    setSubmittedResult(null);
    setSelectedOptionId('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="w-full sm:max-w-xl glass-panel-card rounded-t-3xl sm:rounded-2xl border-t sm:border border-white/20 p-5 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors focus:outline-none"
          title="بستن پنجره"
          aria-label="بستن پنجره"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header: Clean unboxed metadata */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5 pl-8 pr-1">
          <div className="flex items-center gap-2">
            <span className="text-teal-400 font-bold">{stage.title}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>
              سؤال <strong className="text-white tabular-nums">{questionNumber}</strong> از <strong className="text-white tabular-nums">{totalQuestions}</strong>
            </span>
          </div>
          {isAlreadyCorrect && (
            <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> پاسخ صحیح قبلی
            </span>
          )}
        </div>

        {/* Question Title */}
        <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed mb-4 text-right">
          {question.question_text}
        </h3>

        {/* Options List (Strictly 4 Options) */}
        {!submittedResult ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              {options.map((option, idx) => {
                const isSelected = selectedOptionId === option.id;
                const optionLetters = ['الف', 'ب', 'ج', 'د'];
                return (
                  <label
                    key={option.id}
                    className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl border text-right cursor-pointer transition-all min-h-[46px] ${
                      isSelected
                        ? 'border-teal-400 bg-teal-500/15 text-white shadow-md shadow-teal-950/40'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isSelected ? 'bg-teal-400 text-slate-950' : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {optionLetters[idx] || idx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-medium leading-relaxed">{option.option_text}</span>
                    </div>

                    <input
                      type="radio"
                      name="quiz-option"
                      value={option.id}
                      checked={isSelected}
                      onChange={() => {
                        sound.playTap();
                        setSelectedOptionId(option.id);
                      }}
                      className="sr-only"
                    />
                  </label>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-3 flex items-center justify-end gap-2.5 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={!selectedOptionId}
                className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-35 disabled:cursor-not-allowed rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>ثبت و بررسی پاسخ</span>
              </button>
            </div>
          </form>
        ) : (
          /* Result & Explanation Feedback Screen */
          <div className="space-y-4 animate-in fade-in duration-200 text-right">
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                submittedResult.isCorrect
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
              }`}
            >
              {submittedResult.isCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-sm text-white mb-1">
                  {submittedResult.isCorrect ? 'پاسخ شما کاملاً نجات‌بخش و صحیح است!' : 'متأسفانه این پاسخ نادرست است!'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {submittedResult.explanation ||
                    (submittedResult.isCorrect
                      ? 'اقدام اصولی انتخاب شد و این موقعیت خطرزا مهار گردید.'
                      : 'در شرایط بحران شهری، این رفتار ممکن است موجب خسارات ثانویه و خطر جانی شود.')}
                </p>
              </div>
            </div>

            {/* Case A: Stage Passed (ALL 5 Questions Correct!) */}
            {submittedResult.stagePassed && onNextStage ? (
              <div className="p-3.5 rounded-xl bg-teal-500/15 border border-teal-400/30 text-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm text-teal-300">
                    تبریک! تمام سؤالات این فضا با موفقیت پاسخ داده شد
                  </span>
                  {countdown !== null && (
                    <span className="px-2 py-0.5 rounded-lg bg-teal-400 text-slate-950 font-bold text-xs tabular-nums">
                      {countdown}s
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300">
                  انتقال خودکار به فضای بعدی در حال انجام است...
                </p>
              </div>
            ) : submittedResult.isCorrect ? (
              /* Case B: Correct, but more questions remaining in this stage */
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>پیشرفت این فضا:</span>
                  <span className="font-bold text-teal-300 tabular-nums">
                    {submittedResult.correctCount} از {submittedResult.totalQuestions}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-teal-400 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(submittedResult.correctCount / submittedResult.totalQuestions) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Case C: Wrong Answer */
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200">
                <p>برای پیشبرد مأموریت، لطفاً گزینه صحیح را مجدداً انتخاب و ثبت کنید.</p>
              </div>
            )}

            {/* Actions after submit */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              {!submittedResult.isCorrect ? (
                <button
                  onClick={handleRetryChoice}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تلاش مجدد</span>
                </button>
              ) : submittedResult.stagePassed && onNextStage ? (
                <button
                  onClick={() => {
                    setCountdown(null);
                    onNextStage();
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>فضای بعد</span>
                  <FastForward className="w-3.5 h-3.5" />
                </button>
              ) : onGoToNextQuestion && hasNextQuestionInStage ? (
                <button
                  onClick={onGoToNextQuestion}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>سؤال بعدی</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              ) : null}

              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
