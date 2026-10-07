import React, { useState } from 'react';
import { db } from '../../services/db';
import { ActivityLog } from '../../types/database';
import { Activity, Search, ShieldCheck } from 'lucide-react';

export const AdminActivityLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const logs = db.getActivityLogs();

  const filtered = logs.filter(
    (l) =>
      !searchTerm ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">گزارش فعالیت‌های سامانه (Audit & Activity Logs)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ثبت تمامی لاگ‌های حساس: ورود، خروج، ایجاد نقطه سه‌بعدی، پاسخ به سؤالات و عبور از مراحل
          </p>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی لاگ..."
            className="px-3.5 py-2 pr-9 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400 w-64"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400">
                <th className="py-3 px-4 text-right">نوع عملیات (Action)</th>
                <th className="py-3 px-4 text-right">جزئیات رویداد</th>
                <th className="py-3 px-4 text-right">کاربر مسئول</th>
                <th className="py-3 px-4 text-left">زمان وقوع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    گزارشی برای نمایش وجود ندارد.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const isSecurityAlert = log.details.includes('[هشدار امنیتی]');
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-white/5 transition-colors ${
                        isSecurityAlert ? 'bg-rose-500/10 border-l-2 border-rose-500' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded font-semibold ${
                            isSecurityAlert
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-white/10 text-teal-300'
                          }`}
                          dir="ltr"
                        >
                          {isSecurityAlert ? 'security_alert' : log.action}
                        </span>
                      </td>

                      <td className={`py-3 px-4 font-medium ${isSecurityAlert ? 'text-rose-200' : 'text-white'}`}>
                        {log.details}
                      </td>

                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]" dir="ltr">
                        {log.user_email}
                      </td>

                    <td className="py-3 px-4 text-left text-slate-400 font-mono text-[11px] tabular-nums" dir="ltr">
                      {new Date(log.created_at).toLocaleString('fa-IR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
