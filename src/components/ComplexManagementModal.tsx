import React, { useState } from 'react';
import {
  Building2,
  X,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Users,
  ShieldCheck,
  Check,
  AlertTriangle,
  ArrowRightLeft,
  Database,
  ExternalLink,
  BookOpen,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { QuranComplex, Halaqah, TeacherAccount, Student, getThreePartNameValidation } from '../types';

interface ComplexManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  complexes: QuranComplex[];
  halaqahs: Halaqah[];
  teachers: TeacherAccount[];
  students: Student[];
  onSaveComplex: (complex: QuranComplex) => Promise<void>;
  onDeleteComplex: (complexId: string) => Promise<void>;
  onSaveHalaqah: (halaqah: Halaqah) => Promise<void>;
  onDeleteHalaqah: (halaqahId: string) => Promise<void>;
  onSaveTeacher: (teacher: TeacherAccount) => Promise<void>;
  onOpenDatabaseSettings?: () => void;
}

export const ComplexManagementModal: React.FC<ComplexManagementModalProps> = ({
  isOpen,
  onClose,
  complexes,
  halaqahs,
  teachers,
  students,
  onSaveComplex,
  onDeleteComplex,
  onSaveHalaqah,
  onDeleteHalaqah,
  onSaveTeacher,
  onOpenDatabaseSettings
}) => {
  // Tabs: 'complexes' | 'unassigned' | 'new_complex' | 'new_halaqah'
  const [activeView, setActiveView] = useState<'list' | 'new_complex' | 'new_halaqah'>('list');

  // Complex edit / create state
  const [editingComplex, setEditingComplex] = useState<Partial<QuranComplex> | null>(null);
  const [isNewComplex, setIsNewComplex] = useState(false);

  // Quick Supervisor creation toggle inside Complex form
  const [isCreatingNewSupervisor, setIsCreatingNewSupervisor] = useState(false);
  const [newSupervisorData, setNewSupervisorData] = useState({
    name: '',
    username: '',
    password: '123',
    phone: '0500000000'
  });

  // Halaqah edit / create state
  const [editingHalaqah, setEditingHalaqah] = useState<Partial<Halaqah> | null>(null);
  const [targetComplexIdForNewHalaqah, setTargetComplexIdForNewHalaqah] = useState<string>('');

  // Moving halaqah state
  const [transferringHalaqahId, setTransferringHalaqahId] = useState<string | null>(null);
  const [selectedDestinationComplexId, setSelectedDestinationComplexId] = useState<string>('');

  // Confirmation modals
  const [complexToDelete, setComplexToDelete] = useState<QuranComplex | null>(null);
  const [halaqahToDelete, setHalaqahToDelete] = useState<Halaqah | null>(null);

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Compute unassigned halaqahs
  const unassignedHalaqahs = halaqahs.filter(h => !h.complexId);

  // Handlers for Complex
  const handleOpenAddComplex = () => {
    setIsNewComplex(true);
    setEditingComplex({
      id: `complex-${Date.now()}`,
      name: '',
      description: '',
      supervisorTeacherId: teachers.find(t => t.role === 'supervisor' || t.role === 'developer')?.id || teachers[0]?.id || '',
      supervisorTeacherName: teachers.find(t => t.role === 'supervisor' || t.role === 'developer')?.name || teachers[0]?.name || '',
      createdAt: new Date().toISOString()
    });
    setIsCreatingNewSupervisor(false);
    setActiveView('new_complex');
    setStatusMsg(null);
  };

  const handleOpenEditComplex = (complex: QuranComplex) => {
    setIsNewComplex(false);
    setEditingComplex({ ...complex });
    setIsCreatingNewSupervisor(false);
    setActiveView('new_complex');
    setStatusMsg(null);
  };

  const handleSaveComplexSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComplex || !editingComplex.name?.trim()) {
      setStatusMsg({ type: 'error', text: 'يرجى إدخال اسم المجمع القرآني.' });
      return;
    }

    try {
      setIsSubmitting(true);
      let supId = editingComplex.supervisorTeacherId;
      let supName = editingComplex.supervisorTeacherName;

      // If creating a brand new supervisor on the fly
      if (isCreatingNewSupervisor) {
        if (!newSupervisorData.name.trim() || !newSupervisorData.username.trim()) {
          setStatusMsg({ type: 'error', text: 'يرجى إدخال اسم المعلم المشرف الجديد واسم المستخدم.' });
          setIsSubmitting(false);
          return;
        }

        const supNameVal = getThreePartNameValidation(newSupervisorData.name, 'مشرف');
        if (!supNameVal.isValid) {
          setStatusMsg({ type: 'error', text: supNameVal.message || 'الاسم الثلاثي للمعلم المشرف إلزامي.' });
          setIsSubmitting(false);
          return;
        }

        const newTeacher: TeacherAccount = {
          id: `teacher-${Date.now()}`,
          name: newSupervisorData.name.trim(),
          username: newSupervisorData.username.trim(),
          password: newSupervisorData.password.trim() || '123',
          phone: newSupervisorData.phone.trim() || '0500000000',
          title: `مشرف ${editingComplex.name.trim()}`,
          role: 'supervisor',
          isPrimary: false,
          complexId: editingComplex.id,
          complexName: editingComplex.name.trim(),
          createdAt: new Date().toISOString()
        };

        await onSaveTeacher(newTeacher);
        supId = newTeacher.id;
        supName = newTeacher.name;
      } else {
        const found = teachers.find(t => t.id === supId);
        if (found) {
          supName = found.name;
        }
      }

      const fullComplex: QuranComplex = {
        id: editingComplex.id || `complex-${Date.now()}`,
        name: editingComplex.name.trim(),
        description: editingComplex.description?.trim() || '',
        supervisorTeacherId: supId,
        supervisorTeacherName: supName,
        databaseConfig: editingComplex.databaseConfig,
        createdAt: editingComplex.createdAt || new Date().toISOString()
      };

      await onSaveComplex(fullComplex);
      setStatusMsg({ type: 'success', text: `تم حفظ بيانات المجمع (${fullComplex.name}) بنجاح!` });
      setActiveView('list');
      setEditingComplex(null);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'حدث خطأ أثناء حفظ المجمع.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComplexConfirmed = async () => {
    if (!complexToDelete) return;
    try {
      setIsSubmitting(true);
      await onDeleteComplex(complexToDelete.id);
      setStatusMsg({ type: 'success', text: `تم حذف المجمع (${complexToDelete.name}) وفك ارتباط حلقاته بأمان.` });
      setComplexToDelete(null);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'حدث خطأ أثناء حذف المجمع.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Adding / Editing Halaqah within a Complex
  const handleOpenAddHalaqahToComplex = (complexId?: string) => {
    const parentComplex = complexes.find(c => c.id === complexId);
    setTargetComplexIdForNewHalaqah(complexId || '');
    setEditingHalaqah({
      id: `halaqah-${Date.now()}`,
      name: '',
      description: '',
      complexId: complexId || undefined,
      complexName: parentComplex?.name || undefined,
      primaryTeacherName: parentComplex?.supervisorTeacherName || teachers[0]?.name || '',
      createdAt: new Date().toISOString()
    });
    setActiveView('new_halaqah');
    setStatusMsg(null);
  };

  const handleSaveHalaqahSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHalaqah || !editingHalaqah.name?.trim()) {
      setStatusMsg({ type: 'error', text: 'يرجى إدخال اسم الحلقة القرآنية.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const parentComplex = complexes.find(c => c.id === editingHalaqah.complexId);

      const fullHalaqah: Halaqah = {
        id: editingHalaqah.id || `halaqah-${Date.now()}`,
        name: editingHalaqah.name.trim(),
        description: editingHalaqah.description?.trim() || '',
        complexId: editingHalaqah.complexId || undefined,
        complexName: parentComplex?.name || undefined,
        primaryTeacherName: editingHalaqah.primaryTeacherName?.trim() || parentComplex?.supervisorTeacherName || '',
        createdAt: editingHalaqah.createdAt || new Date().toISOString(),
        isDefault: editingHalaqah.isDefault ?? false
      };

      await onSaveHalaqah(fullHalaqah);
      setStatusMsg({ type: 'success', text: `تم حفظ الحلقة (${fullHalaqah.name}) وتثبيتها بنجاح!` });
      setActiveView('list');
      setEditingHalaqah(null);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'حدث خطأ أثناء حفظ الحلقة.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferHalaqahSubmit = async (halaqahId: string, destComplexId: string) => {
    try {
      setIsSubmitting(true);
      const halaqah = halaqahs.find(h => h.id === halaqahId);
      if (!halaqah) return;

      const targetComplex = complexes.find(c => c.id === destComplexId);
      const updatedHalaqah: Halaqah = {
        ...halaqah,
        complexId: destComplexId === 'none' ? undefined : destComplexId,
        complexName: destComplexId === 'none' ? undefined : targetComplex?.name
      };

      await onSaveHalaqah(updatedHalaqah);
      setStatusMsg({
        type: 'success',
        text: `تم نقل الحلقة (${halaqah.name}) إلى ${destComplexId === 'none' ? 'حلقات غير مرتبطة بمجمع' : targetComplex?.name} بنجاح!`
      });
      setTransferringHalaqahId(null);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'تعذر نقل الحلقة.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHalaqahConfirmed = async () => {
    if (!halaqahToDelete) return;
    try {
      setIsSubmitting(true);
      await onDeleteHalaqah(halaqahToDelete.id);
      setStatusMsg({ type: 'success', text: `تم حذف الحلقة (${halaqahToDelete.name}) بنجاح.` });
      setHalaqahToDelete(null);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'حدث خطأ أثناء حذف الحلقة.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto" dir="rtl">
      <div className="bg-[#022c22] border-2 border-amber-500/40 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#f0f9f6]">
        
        {/* Header with Programmer Badge */}
        <div className="bg-gradient-to-r from-[#064e3b] via-[#022c22] to-[#064e3b] p-4 sm:p-6 border-b border-[#065f46] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-[#064e3b] flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.35)] shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black font-heading text-[#fbbf24]">
                  إدارة المجمعات القرآنية والحلقات
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-400/30 text-amber-300 border border-amber-400/40 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  الإدارة المركزية وتطوير المنصة
                </span>
              </div>
              <p className="text-xs text-[#86efac] mt-0.5">
                تأسيس المجمعات، تعيين المشرفين، نقل وتوزيع الحلقات، وفصل قواعد البيانات السحابية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDatabaseSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDatabaseSettings();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#064e3b] hover:bg-emerald-700 text-amber-300 text-xs font-bold border border-amber-400/30 transition-all cursor-pointer"
                title="الانتقال إلى إعدادات وفصل قواعد البيانات"
              >
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>فصل قواعد البيانات</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-bar / Actions */}
        <div className="px-4 sm:px-6 py-3 bg-[#064e3b]/40 border-b border-[#065f46] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('list')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'list'
                  ? 'bg-amber-400 text-[#064e3b] shadow-md'
                  : 'bg-[#064e3b] text-[#86efac] hover:text-white'
              }`}
            >
              قائمة المجمعات ({complexes.length})
            </button>

            {unassignedHalaqahs.length > 0 && (
              <span className="text-[11px] px-2.5 py-1 rounded-xl bg-rose-950/60 text-rose-300 border border-rose-600/40 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                {unassignedHalaqahs.length} حلقة غير مرتبطة بمجمع
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAddHalaqahToComplex()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#064e3b] hover:bg-emerald-700 text-[#86efac] hover:text-white text-xs font-bold border border-[#065f46] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة حلقة</span>
            </button>

            <button
              onClick={handleOpenAddComplex}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-[#064e3b] text-xs font-black shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>إضافة مجمع جديد</span>
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div
            className={`mx-4 sm:mx-6 mt-3 p-3 rounded-2xl text-xs font-bold flex items-center justify-between ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/50'
                : 'bg-rose-950/90 text-rose-200 border border-rose-500/50'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-xs opacity-75 hover:opacity-100 underline cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* Modal Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* VIEW 1: CREATE / EDIT COMPLEX FORM */}
          {activeView === 'new_complex' && editingComplex && (
            <form onSubmit={handleSaveComplexSubmit} className="max-w-2xl mx-auto bg-[#064e3b]/40 border border-[#065f46] rounded-3xl p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#065f46]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#fbbf24]" />
                  <h3 className="text-base font-bold text-white font-heading">
                    {isNewComplex ? 'تأسيس مجمع قرآني جديد' : `تعديل بيانات: ${editingComplex.name}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  إلغاء والعودة
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-200 mb-1.5">
                  اسم المجمع القرآني: <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مجمع الفرقان القرآني"
                  value={editingComplex.name || ''}
                  onChange={e => setEditingComplex(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#022c22] border border-[#065f46] rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold outline-none focus:border-[#fbbf24]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-200 mb-1.5">
                  وصف ونبذة عن المجمع:
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: المجمع النموذجي لحلقات تحفيظ القرآن الكريم والعلوم الشرعية"
                  value={editingComplex.description || ''}
                  onChange={e => setEditingComplex(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[#022c22] border border-[#065f46] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#fbbf24]"
                />
              </div>

              {/* Supervisor Assignment Section */}
              <div className="bg-[#022c22]/90 border border-[#065f46] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300">المعلم المشرف المسؤول عن المجمع:</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreatingNewSupervisor(!isCreatingNewSupervisor)}
                    className="text-xs text-[#86efac] hover:text-white flex items-center gap-1 underline cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isCreatingNewSupervisor ? 'اختيار معلم موجود' : 'إنشاء وتعيين معلم مشرف جديد'}</span>
                  </button>
                </div>

                {!isCreatingNewSupervisor ? (
                  <div>
                    <select
                      value={editingComplex.supervisorTeacherId || ''}
                      onChange={e => {
                        const t = teachers.find(teach => teach.id === e.target.value);
                        setEditingComplex(prev => ({
                          ...prev,
                          supervisorTeacherId: e.target.value,
                          supervisorTeacherName: t ? t.name : ''
                        }));
                      }}
                      className="w-full bg-[#064e3b]/80 border border-[#065f46] rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-[#fbbf24] cursor-pointer"
                    >
                      <option value="">-- اختر المعلم المشرف من القائمة --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.title || (t.role === 'developer' ? 'مبرمج ومشرف' : t.role === 'supervisor' ? 'مشرف' : 'معلم')})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="bg-[#064e3b]/40 p-3.5 rounded-xl border border-amber-500/30 space-y-3">
                    <p className="text-[11px] text-amber-200">
                      سيتم إنشاء حساب جديد برتبة "معلم مشرف" وتعيينه مسؤولاً عن هذا المجمع فور الحفظ:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] text-emerald-200 font-bold">اسم المعلم المشرف الثلاثي * (إلزامي):</label>
                          {newSupervisorData.name.trim().length > 0 && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                              getThreePartNameValidation(newSupervisorData.name, 'مشرف').isValid
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {getThreePartNameValidation(newSupervisorData.name, 'مشرف').isValid ? 'ثلاثي معتمد' : 'يلزم 3 مقاطع'}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          required={isCreatingNewSupervisor}
                          placeholder="مثال: إبراهيم خالد المنصوري أو عبد الله بن علي الكعبي"
                          value={newSupervisorData.name}
                          onChange={e => setNewSupervisorData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-[#022c22] border border-[#065f46] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#fbbf24]"
                        />
                        <p className="text-[9px] text-[#86efac]/70 mt-0.5">
                          * يشترط إدخال الاسم الثلاثي كاملاً للمشرف.
                        </p>
                      </div>
                      <div>
                        <label className="block text-[11px] text-emerald-200 font-bold mb-1">اسم المستخدم (للدخول):</label>
                        <input
                          type="text"
                          required={isCreatingNewSupervisor}
                          placeholder="username"
                          value={newSupervisorData.username}
                          onChange={e => setNewSupervisorData(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full bg-[#022c22] border border-[#065f46] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#fbbf24]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-emerald-200 font-bold mb-1">كلمة المرور:</label>
                        <input
                          type="text"
                          required={isCreatingNewSupervisor}
                          placeholder="123"
                          value={newSupervisorData.password}
                          onChange={e => setNewSupervisorData(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full bg-[#022c22] border border-[#065f46] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#fbbf24]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-emerald-200 font-bold mb-1">رقم الواتساب:</label>
                        <input
                          type="text"
                          placeholder="0500000000"
                          value={newSupervisorData.phone}
                          onChange={e => setNewSupervisorData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full bg-[#022c22] border border-[#065f46] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#fbbf24]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-[#064e3b] text-xs font-black shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : isNewComplex ? 'إضافة وتأسيس المجمع' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 2: CREATE / EDIT HALAQAH FORM */}
          {activeView === 'new_halaqah' && editingHalaqah && (
            <form onSubmit={handleSaveHalaqahSubmit} className="max-w-xl mx-auto bg-[#064e3b]/40 border border-[#065f46] rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#065f46]">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white font-heading">
                    {editingHalaqah.name ? `تعديل الحلقة: ${editingHalaqah.name}` : 'إضافة حلقة قرآنية جديدة'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  إلغاء والعودة
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-200 mb-1.5">
                  اسم الحلقة القرآنية: <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حلقة الإمام الشاطبي رحمه الله"
                  value={editingHalaqah.name || ''}
                  onChange={e => setEditingHalaqah(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#022c22] border border-[#065f46] rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold outline-none focus:border-[#fbbf24]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-200 mb-1.5">
                  المجمع القرآني التابعة له:
                </label>
                <select
                  value={editingHalaqah.complexId || ''}
                  onChange={e => setEditingHalaqah(prev => ({ ...prev, complexId: e.target.value || undefined }))}
                  className="w-full bg-[#022c22] border border-[#065f46] rounded-xl px-3 py-2 text-xs text-[#fbbf24] font-bold outline-none focus:border-[#fbbf24] cursor-pointer"
                >
                  <option value="">-- حلقة مستقلة (غير مرتبطة بمجمع حالياً) --</option>
                  {complexes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-200 mb-1.5">
                  معلم الحلقة ومحفظها:
                </label>
                <select
                  value={editingHalaqah.primaryTeacherName || ''}
                  onChange={e => setEditingHalaqah(prev => ({ ...prev, primaryTeacherName: e.target.value }))}
                  className="w-full bg-[#022c22] border border-[#065f46] rounded-xl px-3 py-2 text-xs text-white font-semibold outline-none focus:border-[#fbbf24] cursor-pointer"
                >
                  <option value="">-- اختر معلم الحلقة --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.title || (t.role === 'developer' ? 'مبرمج' : t.role === 'supervisor' ? 'مشرف' : 'معلم')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-200 mb-1.5">
                  وصف الحلقة:
                </label>
                <input
                  type="text"
                  placeholder="مثال: حلقة للمستوى المتوسط والمتقدم"
                  value={editingHalaqah.description || ''}
                  onChange={e => setEditingHalaqah(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[#022c22] border border-[#065f46] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#fbbf24]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white text-xs font-black shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الحلقة'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: MAIN LIST OF COMPLEXES & HALAQAHS */}
          {activeView === 'list' && (
            <div className="space-y-6">
              
              {/* SECTION A: COMPLEXES LIST */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>المجمعات القرآنية المعتمدة ({complexes.length}):</span>
                  </h3>
                  <span className="text-[11px] text-[#86efac]">
                    كل مجمع يضم حلقاته ومعلميه وطلابه ويمكن فصل قاعدة بياناته
                  </span>
                </div>

                {complexes.length === 0 ? (
                  <div className="text-center py-8 bg-[#064e3b]/30 rounded-3xl border border-[#065f46] space-y-3">
                    <Building2 className="w-10 h-10 text-amber-400/60 mx-auto" />
                    <p className="text-sm font-bold text-white">لا توجد مجمعات مضافة حالياً</p>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto">
                      يمكنك الضغط على زر "إضافة مجمع جديد" في الأعلى لإنشاء مجمع وتعيين معلم مشرف له.
                    </p>
                    <button
                      onClick={handleOpenAddComplex}
                      className="px-4 py-2 rounded-xl bg-amber-400 text-[#064e3b] text-xs font-black shadow-md cursor-pointer"
                    >
                      + إضافة أول مجمع قرآني
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {complexes.map(complex => {
                      const complexHalaqahs = halaqahs.filter(h => h.complexId === complex.id);
                      const complexHalaqahIds = new Set(complexHalaqahs.map(h => h.id));
                      const complexStudents = students.filter(s => s.halaqahId && complexHalaqahIds.has(s.halaqahId));

                      return (
                        <div
                          key={complex.id}
                          className="bg-[#022c22]/90 border border-[#065f46] hover:border-amber-400/60 rounded-3xl p-4 sm:p-5 shadow-xl transition-all space-y-4"
                        >
                          {/* Complex Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#065f46]/70">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0">
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-base font-extrabold text-white font-heading">
                                    {complex.name}
                                  </h4>
                                  {complex.databaseConfig?.isCustom ? (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-200 border border-blue-500/40 font-mono">
                                      قاعدة بيانات منفصلة ({complex.databaseConfig.projectId})
                                    </span>
                                  ) : (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-200 border border-emerald-500/40">
                                      قاعدة بيانات سحابية مركزية
                                    </span>
                                  )}
                                </div>
                                {complex.description && (
                                  <p className="text-xs text-slate-300 mt-0.5">{complex.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1 text-[11px] text-[#86efac]">
                                  <span>
                                    المشرف المسؤول: <strong className="text-amber-300">{complex.supervisorTeacherName || 'غير محدد'}</strong>
                                  </span>
                                  <span>•</span>
                                  <span>{complexHalaqahs.length} حلقات</span>
                                  <span>•</span>
                                  <span>{complexStudents.length} طالباً</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions on Complex */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              <button
                                onClick={() => handleOpenAddHalaqahToComplex(complex.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-[#064e3b] hover:bg-emerald-700 text-[#86efac] hover:text-white text-xs font-bold border border-[#065f46] flex items-center gap-1 transition-all cursor-pointer"
                                title="إضافة حلقة جديدة مباشرة تحت هذا المجمع"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>إضافة حلقة</span>
                              </button>

                              <button
                                onClick={() => handleOpenEditComplex(complex)}
                                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                                title="تعديل المجمع"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setComplexToDelete(complex)}
                                className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-900 text-red-300 hover:text-white transition-all cursor-pointer"
                                title="حذف المجمع"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Halaqahs Inside this Complex */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-emerald-200 font-bold px-1">
                              <span>الحلقات التابعة لهذا المجمع ({complexHalaqahs.length}):</span>
                            </div>

                            {complexHalaqahs.length === 0 ? (
                              <div className="p-3 rounded-2xl bg-[#064e3b]/20 border border-dashed border-[#065f46] text-center text-xs text-slate-400">
                                لا توجد حلقات مسندة لهذا المجمع بعد. اضغط على "+ إضافة حلقة" لإضافة حلقات إليه.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {complexHalaqahs.map(h => {
                                  const hStudentsCount = students.filter(s => s.halaqahId === h.id).length;
                                  const isMoving = transferringHalaqahId === h.id;

                                  return (
                                    <div
                                      key={h.id}
                                      className="p-3 rounded-2xl bg-[#064e3b]/40 border border-[#065f46] flex flex-col justify-between gap-2.5 hover:bg-[#064e3b]/60 transition-colors"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                                            <span className="text-xs font-bold text-white line-clamp-1">{h.name}</span>
                                          </div>
                                          <div className="text-[10px] text-[#86efac] mt-1 space-x-1 space-x-reverse">
                                            <span>المحفظ: {h.primaryTeacherName || 'غير مسند'}</span>
                                            <span>•</span>
                                            <span>{hStudentsCount} طلاب</span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            onClick={() => {
                                              setEditingHalaqah({ ...h });
                                              setActiveView('new_halaqah');
                                            }}
                                            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                            title="تعديل الحلقة"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>

                                          <button
                                            onClick={() => setHalaqahToDelete(h)}
                                            className="p-1 rounded-lg hover:bg-red-900/60 text-red-300 transition-colors cursor-pointer"
                                            title="حذف الحلقة"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Move to another complex control */}
                                      <div className="pt-2 border-t border-[#065f46]/50 flex items-center justify-between gap-2">
                                        {!isMoving ? (
                                          <button
                                            onClick={() => {
                                              setTransferringHalaqahId(h.id);
                                              setSelectedDestinationComplexId(complex.id);
                                            }}
                                            className="text-[10px] text-amber-300 hover:text-white flex items-center gap-1 underline cursor-pointer"
                                          >
                                            <ArrowRightLeft className="w-3 h-3" />
                                            <span>نقل لمجمع آخر</span>
                                          </button>
                                        ) : (
                                          <div className="flex items-center gap-1.5 w-full">
                                            <select
                                              value={selectedDestinationComplexId}
                                              onChange={e => setSelectedDestinationComplexId(e.target.value)}
                                              className="w-full text-[10px] bg-[#022c22] border border-amber-400/50 rounded-lg px-2 py-1 text-white font-bold"
                                            >
                                              <option value="none">فك الارتباط (حلقة غير مرتبطة)</option>
                                              {complexes.map(c => (
                                                <option key={c.id} value={c.id}>
                                                  {c.name}
                                                </option>
                                              ))}
                                            </select>
                                            <button
                                              onClick={() => handleTransferHalaqahSubmit(h.id, selectedDestinationComplexId)}
                                              disabled={isSubmitting}
                                              className="px-2 py-1 bg-amber-400 text-[#064e3b] text-[10px] font-black rounded-lg shrink-0 cursor-pointer"
                                            >
                                              تأكيد
                                            </button>
                                            <button
                                              onClick={() => setTransferringHalaqahId(null)}
                                              className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                                            >
                                              إلغاء
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION B: UNASSIGNED HALAQAHS (حلقات غير مرتبطة بمجمع) */}
              {unassignedHalaqahs.length > 0 && (
                <div className="bg-rose-950/30 border-2 border-rose-500/40 rounded-3xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <h4 className="text-sm sm:text-base font-black text-rose-200 font-heading">
                        حلقات غير مرتبطة بمجمعات ({unassignedHalaqahs.length})
                      </h4>
                    </div>
                    <span className="text-[11px] text-rose-300">
                      يمكنك ربط هذه الحلقات بأي مجمع قرآني بضغطة زر
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {unassignedHalaqahs.map(h => {
                      const hStudentsCount = students.filter(s => s.halaqahId === h.id).length;
                      return (
                        <div
                          key={h.id}
                          className="p-3 rounded-2xl bg-[#022c22] border border-rose-500/40 flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="text-xs font-bold text-white">{h.name}</p>
                            <p className="text-[10px] text-slate-300">
                              {h.primaryTeacherName || 'بدون معلم'} • {hStudentsCount} طلاب
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <select
                              onChange={e => {
                                if (e.target.value) {
                                  handleTransferHalaqahSubmit(h.id, e.target.value);
                                }
                              }}
                              defaultValue=""
                              className="text-[11px] bg-[#064e3b] border border-amber-400/50 text-amber-300 font-bold rounded-xl px-2.5 py-1.5 cursor-pointer"
                            >
                              <option value="" disabled>ربط بمجمع...</option>
                              {complexes.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#064e3b]/50 border-t border-[#065f46] flex items-center justify-between text-xs text-[#86efac]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#fbbf24]" />
            <span>نظام إدارة المجمعات القرآنية الموزعة والفرعية لمنظومة عمران</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>

      {/* CONFIRM DELETE COMPLEX MODAL */}
      {complexToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#022c22] border-2 border-rose-600 rounded-3xl p-6 max-w-md w-full text-right space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-lg font-bold text-white">تأكيد حذف المجمع القرآني</h3>
            </div>
            <p className="text-xs text-rose-200 leading-relaxed">
              هل أنت متأكد من حذف مجمع <strong className="text-white">({complexToDelete.name})</strong>؟
              <br />
              <span className="text-slate-300 mt-1 block">
                ملاحظة: حذف المجمع لن يحذف حلقاته أو طلابه، بل سيتم فك ارتباط الحلقات لتصبح غير مرتبطة بمجمع حتى تعيد تعيينها.
              </span>
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setComplexToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteComplexConfirmed}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'جاري الحذف...' : 'نعم، احذف المجمع'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE HALAQAH MODAL */}
      {halaqahToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#022c22] border-2 border-rose-600 rounded-3xl p-6 max-w-md w-full text-right space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-lg font-bold text-white">تأكيد حذف الحلقة القرآنية</h3>
            </div>
            <p className="text-xs text-rose-200 leading-relaxed">
              هل أنت متأكد من حذف حلقة <strong className="text-white">({halaqahToDelete.name})</strong>؟
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setHalaqahToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteHalaqahConfirmed}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'جاري الحذف...' : 'نعم، احذف الحلقة'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
