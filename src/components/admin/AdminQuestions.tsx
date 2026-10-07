import React, { useState, useEffect } from 'react';
import { Question, Stage, Hotspot, QuestionOption } from '../../types/database';
import { db } from '../../services/db';
import { Plus, Edit2, Trash2, HelpCircle, CheckCircle2, Link, X, AlertCircle } from 'lucide-react';

export const AdminQuestions: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>(db.getStages());
  const [selectedStageId, setSelectedStageId] = useState<string>(stages[0]?.id || '');
  const [questions, setQuestions] = useState<Question[]>(db.getQuestions());
  const [editingQuestion, setEditingQuestion] = useState<{
    id?: string;
    stage_id: string;
    hotspot_id?: string | null;
    question_text: string;
    explanation?: string;
    is_active: boolean;
    order: number;
    options: { id?: string; text: string; is_correct: boolean }[];
  } | null>(null);

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setQuestions(db.getQuestions());
      setStages(db.getStages());
    });
    return unsub;
  }, []);

  const filteredQuestions = questions.filter(
    (q) => !selectedStageId || q.stage_id === selectedStageId
  );
  const stageHotspots = db.getHotspots(selectedStageId).filter((h) => h.hotspot_type === 'question');

  const handleOpenCreate = () => {
    setEditingQuestion({
      stage_id: selectedStageId || stages[0]?.id || '',
      hotspot_id: null,
      question_text: '',
      explanation: '',
      is_active: true,
      order: filteredQuestions.length + 1,
      options: [
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ],
    });
  };

  const handleOpenEdit = (q: Question) => {
    const opts = (q.options || []).slice(0, 4).map((o) => ({
      id: o.id,
      text: o.option_text,
      is_correct: o.is_correct,
    }));

    // Ensure exactly 4 options
    while (opts.length < 4) {
      opts.push({ id: `opt_new_${opts.length}`, text: '', is_correct: false });
    }

    setEditingQuestion({
      id: q.id,
      stage_id: q.stage_id,
      hotspot_id: q.hotspot_id,
      question_text: q.question_text,
      explanation: q.explanation || '',
      is_active: q.is_active,
      order: q.order,
      options: opts,
    });
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    if (!editingQuestion.question_text.trim()) {
      alert('لطفاً صورت سؤال را وارد کنید.');
      return;
    }

    if (editingQuestion.options.some((o) => !o.text.trim())) {
      alert('هر ۴ گزینه سؤال باید دارای متن باشند.');
      return;
    }

    if (!editingQuestion.options.some((o) => o.is_correct)) {
      alert('لطفاً یکی از ۴ گزینه را به عنوان پاسخ صحیح مشخص کنید.');
      return;
    }

    if (editingQuestion.id) {
      // Update
      db.updateQuestion(
        editingQuestion.id,
        {
          stage_id: editingQuestion.stage_id,
          hotspot_id: editingQuestion.hotspot_id || null,
          question_text: editingQuestion.question_text.trim(),
          explanation: editingQuestion.explanation?.trim(),
          is_active: editingQuestion.is_active,
          order: editingQuestion.order,
        },
        editingQuestion.options.map((o) => ({
          id: o.id,
          text: o.text.trim(),
          is_correct: o.is_correct,
        }))
      );
    } else {
      // Create
      db.createQuestion(
        {
          stage_id: editingQuestion.stage_id,
          hotspot_id: editingQuestion.hotspot_id || null,
          question_text: editingQuestion.question_text.trim(),
          explanation: editingQuestion.explanation?.trim(),
          is_active: editingQuestion.is_active,
          order: editingQuestion.order,
        },
        editingQuestion.options.map((o) => ({
          text: o.text.trim(),
          is_correct: o.is_correct,
        }))
      );
    }

    setQuestions(db.getQuestions());
    setEditingQuestion(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این سؤال را حذف کنید؟')) return;
    db.deleteQuestion(id);
    setQuestions(db.getQuestions());
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">مدیریت سؤالات چهارگزینه‌ای آزمون</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            تعریف سؤالات استاندارد چهارگزینه‌ای و اتصال به نقاط سه‌بعدی تصویر ۳۶۰ درجه
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedStageId}
            onChange={(e) => setSelectedStageId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
          >
            {stages.map((stg) => (
              <option key={stg.id} value={stg.id} className="bg-slate-900 text-white">
                {stg.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن سؤال جدید</span>
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400">
                <th className="py-3 px-4 text-right">شماره</th>
                <th className="py-3 px-4 text-right">صورت سؤال</th>
                <th className="py-3 px-4 text-right">گزینه‌ها</th>
                <th className="py-3 px-4 text-right">نقطه ۳۶۰ متصل‌شده</th>
                <th className="py-3 px-4 text-center">وضعیت</th>
                <th className="py-3 px-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    سؤالی برای این مرحله ثبت نشده است.
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((q, idx) => {
                  const linkedHotspot = q.hotspot_id ? db.getHotspotById(q.hotspot_id) : undefined;
                  const correctOption = q.options?.find((o) => o.is_correct);

                  return (
                    <tr key={q.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 tabular-nums font-semibold text-teal-400">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4 font-medium text-white max-w-sm">
                        <div className="leading-relaxed">{q.question_text}</div>
                        {q.explanation && (
                          <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                            پاسخ‌نامه: {q.explanation}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className="text-[11px] text-slate-400">
                            گزینه صحیح:{' '}
                            <strong className="text-emerald-300 font-medium">
                              {correctOption?.option_text || 'تعیین نشده'}
                            </strong>
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {linkedHotspot ? (
                          <span className="inline-flex items-center gap-1 text-teal-300 font-medium text-xs">
                            <Link className="w-3.5 h-3.5" />
                            <span>{linkedHotspot.title}</span>
                          </span>
                        ) : (
                          <span className="text-amber-400/80 text-[11px] italic">
                            متصل نشده به نقطه ۳۶۰
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            q.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-500'
                          }`}
                        >
                          {q.is_active ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(q)}
                            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
                            title="ویرایش سؤال"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-white/10"
                            title="حذف سؤال"
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

      {/* Create / Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl glass-panel-card rounded-2xl border border-white/20 p-6 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingQuestion(null)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-teal-400" />
              <span>{editingQuestion.id ? 'ویرایش سؤال آزمون' : 'تعریف سؤال چهارگزینه‌ای جدید'}</span>
            </h3>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              {/* Stage & Hotspot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    مرحله تور *
                  </label>
                  <select
                    value={editingQuestion.stage_id}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, stage_id: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
                  >
                    {stages.map((stg) => (
                      <option key={stg.id} value={stg.id} className="bg-slate-900 text-white">
                        {stg.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    نقطه ۳۶۰ متصل (اختیاری)
                  </label>
                  <select
                    value={editingQuestion.hotspot_id || ''}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        hotspot_id: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
                  >
                    <option value="" className="bg-slate-900 text-slate-400">
                      -- بدون اتصال به نقطه --
                    </option>
                    {stageHotspots.map((h) => (
                      <option key={h.id} value={h.id} className="bg-slate-900 text-white">
                        {h.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  متن سؤال *
                </label>
                <textarea
                  required
                  rows={3}
                  value={editingQuestion.question_text}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, question_text: e.target.value })
                  }
                  placeholder="صورت سؤال چهارگزینه‌ای را تایپ کنید..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  پاسخ‌نامه تشریحی و توضیح برای کاربر
                </label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation || ''}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                  }
                  placeholder="علت درستی گزینه یا نکته آموزشی که بعد از پاسخ نمایش داده می‌شود..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <label className="block text-xs font-semibold text-amber-300">
                  چهار گزینه آزمون (گزینه صحیح را با دکمه رادیویی علامت بزنید) *
                </label>

                {editingQuestion.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="correct-option-group"
                      checked={opt.is_correct}
                      onChange={() => {
                        const updated = editingQuestion.options.map((o, idx) => ({
                          ...o,
                          is_correct: idx === oIdx,
                        }));
                        setEditingQuestion({ ...editingQuestion, options: updated });
                      }}
                      className="accent-teal-400 w-4 h-4 cursor-pointer"
                      title="انتخاب به عنوان پاسخ صحیح"
                    />
                    <span className="text-xs font-semibold text-slate-400 w-6">
                      {['الف', 'ب', 'ج', 'د'][oIdx]}:
                    </span>
                    <input
                      type="text"
                      required
                      value={opt.text}
                      onChange={(e) => {
                        const updated = [...editingQuestion.options];
                        updated[oIdx].text = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: updated });
                      }}
                      placeholder={`متن گزینه ${oIdx + 1}${opt.is_correct ? ' (پاسخ صحیح)' : ''}`}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs text-white border transition-colors ${
                        opt.is_correct
                          ? 'bg-teal-500/10 border-teal-500/50'
                          : 'bg-white/5 border-white/10'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors shadow-lg shadow-teal-500/20"
                >
                  ذخیره سؤال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
