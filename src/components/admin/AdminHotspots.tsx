import React, { useState } from 'react';
import { Hotspot, Stage, Question, Panorama } from '../../types/database';
import { db } from '../../services/db';
import { PanoramaViewer } from '../viewer/PanoramaViewer';
import {
  Plus,
  Crosshair,
  Edit2,
  Trash2,
  Link,
  Unlink,
  Eye,
  X,
  HelpCircle,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const AdminHotspots: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>(db.getStages());
  const [selectedStageId, setSelectedStageId] = useState<string>(stages[0]?.id || '');
  const [hotspots, setHotspots] = useState<Hotspot[]>(db.getAllHotspots());
  const [questions, setQuestions] = useState<Question[]>(db.getQuestions());

  // 3D Visual Placement Mode
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [clicked3DCoords, setClicked3DCoords] = useState<{ x: number; y: number; z: number } | null>(null);

  // Hotspot Create/Edit Dialog
  const [editingHotspot, setEditingHotspot] = useState<Partial<Hotspot> | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [createNewQuestionMode, setCreateNewQuestionMode] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptions, setNewOptions] = useState([
    { text: '', is_correct: true },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ]);

  // Preview Hotspots in 360 mode
  const [isPreviewingIn360, setIsPreviewingIn360] = useState(false);

  const currentStage = stages.find((s) => s.id === selectedStageId);
  const currentPanorama = currentStage ? db.getPanoramaById(currentStage.panorama_id) : undefined;
  const filteredHotspots = hotspots.filter((h) => !selectedStageId || h.stage_id === selectedStageId);
  const stageQuestions = questions.filter((q) => q.stage_id === selectedStageId);

  // When admin clicks in 3D viewer during placement mode
  const handleSphereClick = (coords: { x: number; y: number; z: number }) => {
    setClicked3DCoords(coords);
    setIsPlacementMode(false); // Stop placement, open hotspot creation modal
    setEditingHotspot({
      stage_id: selectedStageId,
      panorama_id: currentStage?.panorama_id,
      hotspot_type: 'question',
      title: 'نقطه سه‌بعدی جدید',
      description: '',
      pos_x: coords.x,
      pos_y: coords.y,
      pos_z: coords.z,
      is_active: true,
      order: filteredHotspots.length + 1,
    });
    setSelectedQuestionId('');
  };

  const handleSaveHotspot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotspot || !currentStage) return;

    let linkedQId = selectedQuestionId;

    // If admin chose to create a new question right here
    if (editingHotspot.hotspot_type === 'question' && createNewQuestionMode) {
      if (!newQuestionText.trim() || newOptions.some((o) => !o.text.trim())) {
        alert('لطفاً متن سؤال و هر ۴ گزینه را تکمیل نمایید.');
        return;
      }

      const createdQ = db.createQuestion(
        {
          stage_id: selectedStageId,
          question_text: newQuestionText.trim(),
          order: stageQuestions.length + 1,
          is_active: true,
        },
        newOptions.map((o) => ({ text: o.text.trim(), is_correct: o.is_correct }))
      );
      linkedQId = createdQ.id;
    }

    if (editingHotspot.id) {
      // Update existing
      db.updateHotspot(editingHotspot.id, editingHotspot);
      // Link or unlink question
      const existingQ = db.getQuestionByHotspotId(editingHotspot.id);
      if (existingQ && existingQ.id !== linkedQId) {
        db.updateQuestion(existingQ.id, { hotspot_id: null });
      }
      if (linkedQId) {
        db.updateQuestion(linkedQId, { hotspot_id: editingHotspot.id });
      }
    } else {
      // Create new hotspot with Raycast coords
      const newSpot = db.createHotspot(
        {
          stage_id: selectedStageId,
          panorama_id: currentStage.panorama_id,
          hotspot_type: editingHotspot.hotspot_type || 'question',
          title: editingHotspot.title || 'نقطه تعاملی',
          description: editingHotspot.description || '',
          pos_x: editingHotspot.pos_x ?? 0,
          pos_y: editingHotspot.pos_y ?? 0,
          pos_z: editingHotspot.pos_z ?? -440,
          is_active: editingHotspot.is_active ?? true,
          order: editingHotspot.order ?? 1,
        },
        linkedQId
      );
    }

    // Refresh state
    setHotspots(db.getAllHotspots());
    setQuestions(db.getQuestions());
    setEditingHotspot(null);
    setClicked3DCoords(null);
    setCreateNewQuestionMode(false);
    setNewQuestionText('');
  };

  const handleDeleteHotspot = (id: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این نقطه تعاملی را حذف کنید؟')) return;
    db.deleteHotspot(id);
    setHotspots(db.getAllHotspots());
    setQuestions(db.getQuestions());
  };

  const handleToggleActive = (spot: Hotspot) => {
    db.updateHotspot(spot.id, { is_active: !spot.is_active });
    setHotspots(db.getAllHotspots());
  };

  const handleUnlinkQuestion = (hotspotId: string) => {
    const q = db.getQuestionByHotspotId(hotspotId);
    if (q) {
      db.updateQuestion(q.id, { hotspot_id: null });
      setQuestions(db.getQuestions());
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header & Stage Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">مدیریت نقاط تعاملی سه‌بعدی (Hotspots)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            تعیین موقعیت سه‌بعدی با چرخش ۳۶۰ درجه و Raycasting، اتصال به سؤالات آزمون یا یادداشت‌ها
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Stage Selector */}
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

          {/* 3D Placement Mode Trigger Button */}
          <button
            onClick={() => setIsPlacementMode(true)}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Crosshair className="w-4 h-4" />
            <span>جانمایی بصری در ۳۶۰ درجه (Raycast)</span>
          </button>

          {/* 360 Full Preview of hotspots */}
          <button
            onClick={() => setIsPreviewingIn360(true)}
            className="px-3.5 py-2 glass-panel text-slate-200 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4 text-teal-400" />
            <span>مشاهده تور مرحله</span>
          </button>
        </div>
      </div>

      {/* Hotspots Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400">
                <th className="py-3 px-4 text-right">نوع</th>
                <th className="py-3 px-4 text-right">عنوان نقطه</th>
                <th className="py-3 px-4 text-right">مختصات فضایی (X, Y, Z)</th>
                <th className="py-3 px-4 text-right">سؤال متصل‌شده</th>
                <th className="py-3 px-4 text-center">وضعیت</th>
                <th className="py-3 px-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredHotspots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    نقطه تعاملی برای این مرحله تعریف نشده است. با زدن دکمه «جانمایی بصری در ۳۶۰ درجه» نقطه جدید اضافه کنید.
                  </td>
                </tr>
              ) : (
                filteredHotspots.map((spot) => {
                  const linkedQ = db.getQuestionByHotspotId(spot.id);
                  const isQuestion = spot.hotspot_type === 'question';

                  return (
                    <tr key={spot.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                            isQuestion
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                          }`}
                        >
                          {isQuestion ? (
                            <>
                              <HelpCircle className="w-3.5 h-3.5" /> سؤال آزمون
                            </>
                          ) : (
                            <>
                              <Info className="w-3.5 h-3.5" /> اطلاعات
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-white">
                        <div>{spot.title}</div>
                        {spot.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {spot.description}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300 tabular-nums" dir="ltr">
                        ({Math.round(spot.pos_x)}, {Math.round(spot.pos_y)}, {Math.round(spot.pos_z)})
                      </td>

                      <td className="py-3 px-4">
                        {isQuestion ? (
                          linkedQ ? (
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-300 truncate max-w-xs font-medium">
                                {linkedQ.question_text.slice(0, 38)}...
                              </span>
                              <button
                                onClick={() => handleUnlinkQuestion(spot.id)}
                                className="text-slate-400 hover:text-rose-400"
                                title="قطع اتصال سؤال"
                              >
                                <Unlink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-amber-400/80 italic text-[11px]">
                              بدون سؤال متصل (کلیک برای ویرایش)
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500 text-[11px]">ـ (محتوای متنی)</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(spot)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                            spot.is_active
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-white/5 text-slate-500'
                          }`}
                        >
                          {spot.is_active ? 'فعال' : 'غیرفعال'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              const q = db.getQuestionByHotspotId(spot.id);
                              setEditingHotspot({ ...spot });
                              setSelectedQuestionId(q?.id || '');
                            }}
                            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
                            title="ویرایش نقطه"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteHotspot(spot.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-white/10"
                            title="حذف نقطه"
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

      {/* 3D Placement Mode Modal: Three.js 360 viewer with Raycasting */}
      {isPlacementMode && currentPanorama && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <header className="px-6 py-3 bg-black/70 border-b border-white/10 flex items-center justify-between z-30">
            <div className="text-right">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-amber-400" />
                <span>حالت جانمایی نقطه سه‌بعدی با Raycasting</span>
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                محیط ۳۶۰ درجه را بچرخانید و روی هر موقعیتی که می‌خواهید نقطه تعاملی قرار گیرد کلیک کنید.
              </p>
            </div>
            <button
              onClick={() => setIsPlacementMode(false)}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white"
            >
              خروج از حالت جانمایی
            </button>
          </header>

          <div className="flex-1 w-full h-full relative">
            <PanoramaViewer
              panoramaUrl={currentPanorama.file_url}
              stageTitle={`جانمایی در: ${currentStage?.title}`}
              stageDescription="روی هر نقطه از تصویر کلیک کنید تا مختصات سه بعدی دریافت شود"
              hotspots={filteredHotspots}
              placementMode={true}
              onSphereClick={handleSphereClick}
              initialYaw={currentStage?.initial_yaw}
              initialPitch={currentStage?.initial_pitch}
            />
          </div>
        </div>
      )}

      {/* Create / Edit Hotspot Dialog */}
      {editingHotspot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl glass-panel-card rounded-2xl border border-white/20 p-6 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setEditingHotspot(null);
                setCreateNewQuestionMode(false);
              }}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>{editingHotspot.id ? 'ویرایش نقطه تعاملی' : 'ایجاد نقطه تعاملی سه‌بعدی جدید'}</span>
            </h3>

            <form onSubmit={handleSaveHotspot} className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  نوع نقطه تعاملی
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingHotspot({ ...editingHotspot, hotspot_type: 'question' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      editingHotspot.hotspot_type === 'question'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>سؤال چهارگزینه‌ای آزمون (؟)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingHotspot({ ...editingHotspot, hotspot_type: 'information' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      editingHotspot.hotspot_type === 'information'
                        ? 'border-teal-400 bg-teal-500/20 text-teal-300'
                        : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    <Info className="w-4 h-4" />
                    <span>اطلاعات و راهنما (i)</span>
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  عنوان نقطه تعاملی *
                </label>
                <input
                  type="text"
                  required
                  value={editingHotspot.title || ''}
                  onChange={(e) => setEditingHotspot({ ...editingHotspot, title: e.target.value })}
                  placeholder="مثال: مقرنس سقف و آیینه‌کاری"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  توضیحات تکمیلی
                </label>
                <textarea
                  rows={2}
                  value={editingHotspot.description || ''}
                  onChange={(e) => setEditingHotspot({ ...editingHotspot, description: e.target.value })}
                  placeholder="توضیحات نقطه یا نکته معماری..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* Coordinates info (Calculated by Three.js Raycaster) */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center justify-between">
                <span>مختصات محاسبه‌شده سه‌بعدی:</span>
                <span className="font-mono text-teal-400 font-bold" dir="ltr">
                  X: {Math.round(editingHotspot.pos_x || 0)} | Y: {Math.round(editingHotspot.pos_y || 0)} | Z: {Math.round(editingHotspot.pos_z || 0)}
                </span>
              </div>

              {/* If type is question: Connect to Question */}
              {editingHotspot.hotspot_type === 'question' && (
                <div className="pt-2 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-amber-300">
                      اتصال به سؤال آزمون این مرحله
                    </label>
                    <button
                      type="button"
                      onClick={() => setCreateNewQuestionMode(!createNewQuestionMode)}
                      className="text-[11px] text-teal-400 hover:text-teal-300 font-medium"
                    >
                      {createNewQuestionMode ? 'انتخاب از سؤالات موجود' : '+ تعریف سؤال جدید همینجا'}
                    </button>
                  </div>

                  {!createNewQuestionMode ? (
                    <div>
                      <select
                        value={selectedQuestionId}
                        onChange={(e) => setSelectedQuestionId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
                      >
                        <option value="" className="bg-slate-900 text-slate-400">
                          -- انتخاب سؤال از میان سؤالات مرحله ({stageQuestions.length} سؤال) --
                        </option>
                        {stageQuestions.map((q) => (
                          <option key={q.id} value={q.id} className="bg-slate-900 text-white">
                            {q.question_text.slice(0, 60)}...
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    /* Inline Question Creator with 4 Options */
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          متن سؤال جدید *
                        </label>
                        <input
                          type="text"
                          value={newQuestionText}
                          onChange={(e) => setNewQuestionText(e.target.value)}
                          placeholder="صورت سؤال آزمون را وارد کنید..."
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-medium text-slate-300">
                          چهار گزینه (گزینه صحیح را مشخص کنید) *
                        </label>
                        {newOptions.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="correct-opt"
                              checked={opt.is_correct}
                              onChange={() => {
                                setNewOptions(
                                  newOptions.map((o, idx) => ({ ...o, is_correct: idx === oIdx }))
                                );
                              }}
                              className="accent-teal-400"
                              title="پاسخ صحیح"
                            />
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const updated = [...newOptions];
                                updated[oIdx].text = e.target.value;
                                setNewOptions(updated);
                              }}
                              placeholder={`گزینه ${oIdx + 1}${opt.is_correct ? ' (پاسخ صحیح)' : ''}`}
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setEditingHotspot(null);
                    setCreateNewQuestionMode(false);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors shadow-lg shadow-teal-500/20"
                >
                  ذخیره نقطه تعاملی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 360 Stage Tour Full Preview Modal */}
      {isPreviewingIn360 && currentPanorama && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <header className="px-6 py-3 bg-black/70 border-b border-white/10 flex items-center justify-between z-30">
            <div className="text-right">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-400" />
                <span>پیش‌نمایش مرحله ۳۶۰ درجه: {currentStage?.title}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                تعداد نقاط تعاملی موجود در این مرحله: {filteredHotspots.length} نقطه
              </p>
            </div>
            <button
              onClick={() => setIsPreviewingIn360(false)}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white"
            >
              بستن پیش‌نمایش
            </button>
          </header>

          <div className="flex-1 w-full h-full relative">
            <PanoramaViewer
              panoramaUrl={currentPanorama.file_url}
              stageTitle={currentStage?.title}
              stageDescription={currentStage?.description}
              hotspots={filteredHotspots}
              initialYaw={currentStage?.initial_yaw}
              initialPitch={currentStage?.initial_pitch}
            />
          </div>
        </div>
      )}
    </div>
  );
};
