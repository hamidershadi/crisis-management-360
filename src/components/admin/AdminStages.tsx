import React, { useState } from 'react';
import { Stage, Panorama } from '../../types/database';
import { db } from '../../services/db';
import { resolvePanoramaUrl, getBundledFallbackUrl } from '../../assets/panoramas';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Layers, Eye, X, Check } from 'lucide-react';

export const AdminStages: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>(db.getStages());
  const [panoramas, setPanoramas] = useState<Panorama[]>(db.getPanoramas());
  const [editingStage, setEditingStage] = useState<Partial<Stage> | null>(null);

  const handleOpenCreate = () => {
    setEditingStage({
      title: `مرحله ${stages.length + 1}: `,
      description: '',
      order: stages.length + 1,
      panorama_id: panoramas[0]?.id || '',
      is_active: true,
      initial_yaw: 0,
      initial_pitch: 0,
      initial_fov: 75,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage || !editingStage.title?.trim() || !editingStage.panorama_id) return;

    if (editingStage.id) {
      db.updateStage(editingStage.id, editingStage);
    } else {
      db.createStage({
        title: editingStage.title.trim(),
        description: editingStage.description || '',
        order: editingStage.order || stages.length + 1,
        panorama_id: editingStage.panorama_id,
        is_active: editingStage.is_active ?? true,
        initial_yaw: editingStage.initial_yaw || 0,
        initial_pitch: editingStage.initial_pitch || 0,
        initial_fov: editingStage.initial_fov || 75,
      });
    }

    setStages(db.getStages());
    setEditingStage(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('آیا از حذف این مرحله و تمام نقاط و سؤالات مربوط به آن اطمینان دارید؟')) return;
    const res = db.deleteStage(id);
    if (res.success) {
      setStages(db.getStages());
    } else {
      alert(res.error || 'خطا در حذف مرحله');
    }
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= stages.length) return;

    const current = stages[index];
    const target = stages[newIdx];

    const tempOrder = current.order;
    db.updateStage(current.id, { order: target.order });
    db.updateStage(target.id, { order: tempOrder });

    setStages(db.getStages());
  };

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">مدیریت مراحل تور مجازی ۳۶۰ درجه</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            تعیین توالی مراحل، پانورامای اختصاصی هر مرحله و زاویه دید اولیه دوربین Three.js
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>ایجاد مرحله جدید</span>
        </button>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400">
                <th className="py-3 px-4 text-center">ترتیب</th>
                <th className="py-3 px-4 text-right">عنوان مرحله</th>
                <th className="py-3 px-4 text-right">تصویر ۳۶۰ متصل</th>
                <th className="py-3 px-4 text-right">زاویه اولیه (Yaw / Pitch)</th>
                <th className="py-3 px-4 text-center">نقاط تعاملی</th>
                <th className="py-3 px-4 text-center">وضعیت</th>
                <th className="py-3 px-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stages.map((stage, idx) => {
                const pano = db.getPanoramaById(stage.panorama_id);
                const stageHotspots = db.getHotspots(stage.id);

                return (
                  <tr key={stage.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleMoveOrder(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                          title="انتقال به بالا"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold tabular-nums text-teal-400 px-1">
                          {stage.order}
                        </span>
                        <button
                          onClick={() => handleMoveOrder(idx, 'down')}
                          disabled={idx === stages.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                          title="انتقال به پایین"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-white">
                      <div>{stage.title}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                        {stage.description}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {pano ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={resolvePanoramaUrl(pano.file_url, pano.id)}
                            alt=""
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              const target = e.currentTarget;
                              const fallback = getBundledFallbackUrl(pano.file_url, pano.id);
                              if (fallback && target.src !== fallback) {
                                target.src = fallback;
                              }
                            }}
                            className="w-10 h-7 object-cover rounded border border-white/10"
                          />
                          <span className="truncate max-w-[140px] text-slate-300 font-medium">
                            {pano.title}
                          </span>
                        </div>
                      ) : (
                        <span className="text-rose-400">تصویر یافت نشد</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300 tabular-nums" dir="ltr">
                      Yaw: {stage.initial_yaw}° / Pitch: {stage.initial_pitch}°
                    </td>

                    <td className="py-3 px-4 text-center tabular-nums font-semibold text-slate-200">
                      {stageHotspots.length} نقطه
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          stage.is_active
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-white/5 text-slate-500'
                        }`}
                      >
                        {stage.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingStage({ ...stage })}
                          className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
                          title="ویرایش مرحله"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(stage.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-white/10"
                          title="حذف مرحله"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Stage Modal */}
      {editingStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg glass-panel-card rounded-2xl border border-white/20 p-6 shadow-2xl relative text-right">
            <button
              onClick={() => setEditingStage(null)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              <span>{editingStage.id ? 'ویرایش مشخصات مرحله' : 'ایجاد مرحله جدید'}</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  عنوان مرحله *
                </label>
                <input
                  type="text"
                  required
                  value={editingStage.title || ''}
                  onChange={(e) => setEditingStage({ ...editingStage, title: e.target.value })}
                  placeholder="مثال: مرحله ۴: آب‌انبار تاریخی"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  توضیحات و راهنمای مرحله
                </label>
                <textarea
                  rows={2}
                  value={editingStage.description || ''}
                  onChange={(e) => setEditingStage({ ...editingStage, description: e.target.value })}
                  placeholder="راهنمای کاربر درباره معماری یا اهداف آزمون..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  انتخاب تصویر ۳۶۰ درجه (Panorama) *
                </label>
                <select
                  required
                  value={editingStage.panorama_id || ''}
                  onChange={(e) => setEditingStage({ ...editingStage, panorama_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
                >
                  {panoramas.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    زاویه افقی (Yaw)
                  </label>
                  <input
                    type="number"
                    value={editingStage.initial_yaw ?? 0}
                    onChange={(e) =>
                      setEditingStage({ ...editingStage, initial_yaw: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    زاویه عمودی (Pitch)
                  </label>
                  <input
                    type="number"
                    value={editingStage.initial_pitch ?? 0}
                    onChange={(e) =>
                      setEditingStage({ ...editingStage, initial_pitch: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    میدان دید (FOV)
                  </label>
                  <input
                    type="number"
                    value={editingStage.initial_fov ?? 75}
                    onChange={(e) =>
                      setEditingStage({ ...editingStage, initial_fov: parseInt(e.target.value, 10) || 75 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="stage-active-toggle"
                  checked={editingStage.is_active ?? true}
                  onChange={(e) => setEditingStage({ ...editingStage, is_active: e.target.checked })}
                  className="accent-teal-400 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="stage-active-toggle" className="text-xs text-slate-300 cursor-pointer">
                  این مرحله فعال و در دسترس کاربران باشد
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingStage(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors shadow-lg shadow-teal-500/20"
                >
                  ذخیره مرحله
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
