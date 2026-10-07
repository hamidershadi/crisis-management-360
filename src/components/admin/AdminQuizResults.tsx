import React, { useState } from 'react';
import { db } from '../../services/db';
import { QuizAttempt } from '../../types/database';
import { Trophy, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';

export const AdminQuizResults: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all');
  const attempts = db.getQuizAttempts();

  const filtered = attempts.filter((att) => {
    const matchesSearch =
      !searchTerm ||
      att.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.stage_title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'passed' && att.is_passed) ||
      (filterStatus === 'failed' && !att.is_passed);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">نتایج و کارنامه آزمون‌های کاربران</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ثبت تمام تلاش‌ها، تعداد پاسخ‌های صحیح، نمره مرحله و وضعیت قبولی (حداقل ۴ از ۵)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی کاربر یا مرحله..."
              className="px-3.5 py-2 pr-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 w-52"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          {/* Status filter buttons */}
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                filterStatus === 'all' ? 'bg-teal-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              همه ({attempts.length})
            </button>
            <button
              onClick={() => setFilterStatus('passed')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                filterStatus === 'passed' ? 'bg-emerald-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              قبول‌شده ({attempts.filter((a) => a.is_passed).length})
            </button>
            <button
              onClick={() => setFilterStatus('failed')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                filterStatus === 'failed' ? 'bg-rose-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              مردود ({attempts.filter((a) => !a.is_passed).length})
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400">
                <th className="py-3 px-4 text-right">کاربر</th>
                <th className="py-3 px-4 text-right">ایمیل</th>
                <th className="py-3 px-4 text-right">مرحله تور</th>
                <th className="py-3 px-4 text-center">نوبت تلاش</th>
                <th className="py-3 px-4 text-center">تعداد پاسخ صحیح</th>
                <th className="py-3 px-4 text-center">وضعیت نتیجه</th>
                <th className="py-3 px-4 text-left">تاریخ ثبت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    نتیجه‌ای برای این جستجو یافت نشد.
                  </td>
                </tr>
              ) : (
                filtered.map((att) => (
                  <tr key={att.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {att.user_name || 'کاربر سامانه'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]" dir="ltr">
                      {att.user_email}
                    </td>
                    <td className="py-3 px-4 font-medium text-teal-300">{att.stage_title}</td>
                    <td className="py-3 px-4 text-center tabular-nums">نوبت {att.attempt_number}</td>
                    <td className="py-3 px-4 text-center font-bold text-white tabular-nums">
                      {att.correct_answers} از {att.total_questions}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {att.is_passed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" /> قبول (عبور از مرحله)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <XCircle className="w-3.5 h-3.5" /> مردود (نیاز به آزمون مجدد)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-left text-slate-400 font-mono text-[11px]" dir="ltr">
                      {new Date(att.created_at).toLocaleString('fa-IR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
