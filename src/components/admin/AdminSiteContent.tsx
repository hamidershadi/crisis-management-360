import React, { useState } from 'react';
import { db } from '../../services/db';
import { SiteContent } from '../../types/database';
import { FileText, Save, Check } from 'lucide-react';

export const AdminSiteContent: React.FC = () => {
  const [contentList, setContentList] = useState<SiteContent[]>(db.getSiteContent());
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const handleUpdate = (item: SiteContent) => {
    db.updateSiteContent(item.key, item.content, item.title);
    setContentList(db.getSiteContent());
    setSavedKey(item.key);
    setTimeout(() => setSavedKey(null), 2500);
  };

  return (
    <div className="space-y-6 text-right">
      <div>
        <h2 className="text-lg font-bold text-white">مدیریت محتوای سایت و قوانین آزمون</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          ویرایش متن راهنمای تور، قانون عبور از مرحله و معرفی پلتفرم
        </p>
      </div>

      <div className="space-y-4">
        {contentList.map((item) => (
          <div
            key={item.id}
            className="glass-panel rounded-2xl border border-white/10 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-teal-300 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>{item.title}</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500" dir="ltr">
                key: {item.key}
              </span>
            </div>

            <textarea
              rows={3}
              value={item.content}
              onChange={(e) => {
                const updated = contentList.map((c) =>
                  c.id === item.id ? { ...c, content: e.target.value } : c
                );
                setContentList(updated);
              }}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-teal-400"
            />

            <div className="flex items-center justify-end">
              <button
                onClick={() => handleUpdate(item)}
                className="px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
              >
                {savedKey === item.key ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ذخیره شد ✓</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>ذخیره تغییرات</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
