import React, { useState } from 'react';
import { db } from '../../services/db';
import { Database, Copy, Check, ShieldCheck, Download } from 'lucide-react';

export const AdminSqlSchema: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const sql = db.getSupabaseSqlSchema();

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tour360_supabase_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-400" />
            <span>پایگاه داده Supabase و قوانین Row Level Security (RLS)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            اسکریپت کامل DDL جداول PostgreSQL، کلیدهای خارجی Cascade/Restrict و سیاست‌های امنیتی RLS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="px-3.5 py-2 glass-panel text-slate-200 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>دانلود فایل SQL</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>کپی شد ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>کپی اسکریپت SQL</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-200 leading-relaxed">
        <div className="font-bold flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-teal-300" />
          <span>پوشش کامل ساختار درخواستی:</span>
        </div>
        شامل جداول profiles, stages, panoramas, hotspots, questions, question_options, user_answers,
        user_progress, quiz_attempts, activity_logs, site_content به همراه توابع اعتبارسنجی ادمین و
        تمامی Policyهای Row Level Security در Supabase.
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#090c10] shadow-2xl">
        <div className="px-4 py-2.5 bg-black/60 border-b border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono" dir="ltr">schema_and_rls.sql</span>
          <span>PostgreSQL 15+ / Supabase</span>
        </div>
        <pre
          className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed select-all"
          dir="ltr"
        >
          {sql}
        </pre>
      </div>
    </div>
  );
};
