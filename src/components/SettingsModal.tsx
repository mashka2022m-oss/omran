import React, { useState } from 'react';
import {
  Settings,
  Users,
  Layers,
  Plus,
  Trash2,
  Edit,
  Shield,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  ArrowRightLeft,
  UserCheck,
  Building2,
  Phone,
  Key,
  BookOpen,
  Info
} from 'lucide-react';
import { TeacherAccount, Halaqah, Student, AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherAccount[];
  halaqahs: Halaqah[];
  students: Student[];
  settings: AppSettings;
  activeHalaqahId?: string;
  onSaveTeacher: (teacher: TeacherAccount) => Promise<void>;
  onDeleteTeacher: (teacherId: string) => Promise<void>;
  onSaveHalaqah: (halaqah: Halaqah) => Promise<void>;
  onDeleteHalaqah: (halaqahId: string) => Promise<void>;
  onTransferStudent: (studentId: string, targetHalaqahId: string, targetHalaqahName: string) => Promise<void>;
  onSwitchActiveHalaqah?: (halaqahId: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  teachers,
  halaqahs,
  students,
  settings,
  activeHalaqahId,
  onSaveTeacher,
  onDeleteTeacher,
  onSaveHalaqah,
  onDeleteHalaqah,
  onTransferStudent,
  onSwitchActiveHalaqah
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'halaqahs' | 'teachers' | 'transfer'>('halaqahs');

  // Halaqah Management State
  const [editingHalaqah, setEditingHalaqah] = useState<Partial<Halaqah> | null>(null);
  const [isNewHalaqah, setIsNewHalaqah] = useState(false);
  const [pendingTeacherMoveConfirm, setPendingTeacherMoveConfirm] = useState<{
    teacher: TeacherAccount;
    targetHalaqahName: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Teacher Management State
  const [editingTeacher, setEditingTeacher] = useState<Partial<TeacherAccount> | null>(null);
  const [isNewTeacher, setIsNewTeacher] = useState(false);

  // Transfer Student State
  const [transferStudentId, setTransferStudentId] = useState<string>('');
  const [transferTargetHalaqahId, setTransferTargetHalaqahId] = useState<string>('');

  // Status & Feedback
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmations
  const [deleteHalaqahConfirmId, setDeleteHalaqahConfirmId] = useState<string | null>(null);
  const [deleteTeacherConfirmId, setDeleteTeacherConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  // ----------------------------------------------------
  // Halaqah Handlers
  // ----------------------------------------------------
  const handleStartAddHalaqah = () => {
    setIsNewHalaqah(true);
    setEditingHalaqah({
      id: `halaqah-${Date.now()}`,
      name: '',
      description: '',
      primaryTeacherName: teachers[0]?.name || 'محمد منتصر',
      createdAt: new Date().toISOString()
    });
    setStatusMsg(null);
  };

  const handleStartEditHalaqah = (h: Halaqah) => {
    setIsNewHalaqah(false);
    setEditingHalaqah({ ...h });
    setStatusMsg(null);
  };

  const handleSaveHalaqahForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHalaqah || !editingHalaqah.name?.trim()) {
      setStatusMsg({ type: 'error', text: 'يرجى إدخال اسم الحلقة.' });
      return;
    }

    const halaqahName = editingHalaqah.name.trim();
    const halaqahId = editingHalaqah.id || `halaqah-${Date.now()}`;
    const selectedTeacherName = editingHalaqah.primaryTeacherName?.trim() || '';

    // Check if the selected teacher is already assigned to a DIFFERENT halaqah
    const matchedTeacher = teachers.find(
      t => t.name.trim().toLowerCase() === selectedTeacherName.toLowerCase() ||
           t.username.trim().toLowerCase() === selectedTeacherName.toLowerCase()
    );

    const isTeacherAlreadyInAnotherHalaqah =
      matchedTeacher &&
      matchedTeacher.halaqahId &&
      matchedTeacher.halaqahId !== halaqahId;

    const executeSave = async () => {
      try {
        setIsSubmitting(true);
        const halaqahObj: Halaqah = {
          id: halaqahId,
          name: halaqahName,
          description: editingHalaqah.description?.trim() || '',
          primaryTeacherName: selectedTeacherName,
          createdAt: editingHalaqah.createdAt || new Date().toISOString(),
          isDefault: editingHalaqah.isDefault ?? false
        };

        await onSaveHalaqah(halaqahObj);

        // If teacher was moved or assigned, update teacher's halaqah info
        if (matchedTeacher) {
          await onSaveTeacher({
            ...matchedTeacher,
            halaqahId: halaqahId,
            halaqahName: halaqahName
          });
        }

        setStatusMsg({
          type: 'success',
          text: isNewHalaqah
            ? `تمت إضافة الحلقة (${halaqahName}) وتعيين المعلم بنجاح!`
            : `تم حفظ بيانات الحلقة (${halaqahName}) بنجاح!`
        });
        setEditingHalaqah(null);
        setIsNewHalaqah(false);
        setPendingTeacherMoveConfirm(null);
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: err.message || 'حدث خطأ أثناء حفظ الحلقة.' });
      } finally {
        setIsSubmitting(false);
      }
    };

    if (isTeacherAlreadyInAnotherHalaqah && matchedTeacher) {
      const currentHalaqahName = matchedTeacher.halaqahName || 'حلقة أخرى';
      setPendingTeacherMoveConfirm({
        teacher: matchedTeacher,
        targetHalaqahName: halaqahName,
        onConfirm: executeSave
      });
      return;
    }

    await executeSave();
  };

  const handleDeleteHalaqah = async (hId: string) => {
    try {
      setIsSubmitting(true);
      await onDeleteHalaqah(hId);
      setDeleteHalaqahConfirmId(null);
      setStatusMsg({ type: 'success', text: 'تم حذف الحلقة بنجاح.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'فشل حذف الحلقة: ' + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Teacher Handlers
  // ----------------------------------------------------
  const handleStartAddTeacher = () => {
    setIsNewTeacher(true);
    setEditingTeacher({
      id: `teacher-${Date.now()}`,
      name: '',
      username: '',
      password: '123',
      phone: '0500000000',
      title: 'معلم ومحفظ',
      halaqahId: halaqahs[0]?.id || '',
      halaqahName: halaqahs[0]?.name || '',
      isPrimary: false,
      createdAt: new Date().toISOString()
    });
    setStatusMsg(null);
  };

  const handleStartEditTeacher = (t: TeacherAccount) => {
    setIsNewTeacher(false);
    setEditingTeacher({ ...t });
    setStatusMsg(null);
  };

  const handleSaveTeacherForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !editingTeacher.name?.trim() || !editingTeacher.username?.trim()) {
      setStatusMsg({ type: 'error', text: 'يرجى كتابة اسم المعلم واسم المستخدم للدخول.' });
      return;
    }

    // Check duplicate username if new
    if (isNewTeacher) {
      const exists = teachers.some(
        t => t.username.trim().toLowerCase() === editingTeacher.username?.trim().toLowerCase()
      );
      if (exists) {
        setStatusMsg({ type: 'error', text: 'اسم المستخدم مسجل لمعلم آخر بالفعل. يرجى اختيار اسم مستخدم مختلف.' });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const selectedHalaqah = halaqahs.find(h => h.id === editingTeacher.halaqahId);
      const fullTeacher: TeacherAccount = {
        id: editingTeacher.id || `teacher-${Date.now()}`,
        name: editingTeacher.name.trim(),
        username: editingTeacher.username.trim(),
        password: editingTeacher.password?.trim() || '123',
        phone: editingTeacher.phone?.trim() || '0500000000',
        title: editingTeacher.title?.trim() || 'معلم ومحفظ',
        halaqahId: editingTeacher.halaqahId || (selectedHalaqah ? selectedHalaqah.id : undefined),
        halaqahName: selectedHalaqah ? selectedHalaqah.name : editingTeacher.halaqahName,
        isPrimary: editingTeacher.isPrimary ?? false,
        createdAt: editingTeacher.createdAt || new Date().toISOString()
      };

      await onSaveTeacher(fullTeacher);
      setStatusMsg({
        type: 'success',
        text: isNewTeacher
          ? `تمت إضافة حساب المعلم (${fullTeacher.name}) بنجاح!`
          : `تم تحديث بيانات المعلم (${fullTeacher.name}) بنجاح!`
      });
      setEditingTeacher(null);
      setIsNewTeacher(false);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'حدث خطأ أثناء حفظ حساب المعلم.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (tId: string) => {
    try {
      setIsSubmitting(true);
      await onDeleteTeacher(tId);
      setDeleteTeacherConfirmId(null);
      setStatusMsg({ type: 'success', text: 'تم حذف حساب المعلم بنجاح.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'فشل حذف حساب المعلم: ' + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Student Transfer Handlers
  // ----------------------------------------------------
  const handleTransferStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStudentId || !transferTargetHalaqahId) {
      setStatusMsg({ type: 'error', text: 'يرجى اختيار الطالب والحلقة المراد النقل إليها.' });
      return;
    }

    const st = students.find(s => s.id === transferStudentId);
    const targetHalaqah = halaqahs.find(h => h.id === transferTargetHalaqahId);

    if (!st || !targetHalaqah) {
      setStatusMsg({ type: 'error', text: 'تعذر العثور على بيانات الطالب أو الحلقة المستهدفة.' });
      return;
    }

    if (st.halaqahId === targetHalaqah.id) {
      setStatusMsg({ type: 'error', text: 'الطالب موجود بالفعل في هذه الحلقة.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await onTransferStudent(st.id, targetHalaqah.id, targetHalaqah.name);
      setStatusMsg({
        type: 'success',
        text: `تم نقل الطالب (${st.name}) مع سجله وحفظه كاملاً إلى (${targetHalaqah.name}) بنجاح!`
      });
      setTransferStudentId('');
      setTransferTargetHalaqahId('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'حدث خطأ أثناء نقل الطالب: ' + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="w-full max-w-4xl bg-[#064e3b] border border-[#fbbf24]/40 rounded-[32px] p-5 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#065f46] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#fbbf24] text-[#064e3b] flex items-center justify-center font-bold shadow-[0_0_15px_rgba(251,191,36,0.3)] shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white flex items-center gap-2">
                <span>إعدادات النظام والحلقات والمعلمين</span>
              </h2>
              <p className="text-xs text-[#86efac]">
                إدارة الحلقات القرآنية، إضافة وحذف وتعديل المعلمين بلا حدود، ونقل الطلاب بسجلاتهم الكاملة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#86efac] hover:text-white hover:bg-[#022c22] transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#065f46] pb-3">
          <button
            onClick={() => {
              setActiveSubTab('halaqahs');
              setStatusMsg(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'halaqahs'
                ? 'bg-[#fbbf24] text-[#064e3b] shadow-md'
                : 'bg-[#022c22] text-[#86efac] hover:text-white hover:bg-[#022c22]/80 border border-[#065f46]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>الحلقات القرآنية ({halaqahs.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('teachers');
              setStatusMsg(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'teachers'
                ? 'bg-[#fbbf24] text-[#064e3b] shadow-md'
                : 'bg-[#022c22] text-[#86efac] hover:text-white hover:bg-[#022c22]/80 border border-[#065f46]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>حسابات المعلمين ({teachers.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('transfer');
              setStatusMsg(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'transfer'
                ? 'bg-[#fbbf24] text-[#064e3b] shadow-md'
                : 'bg-[#022c22] text-[#86efac] hover:text-white hover:bg-[#022c22]/80 border border-[#065f46]'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>نقل الطلاب بين الحلقات</span>
          </button>
        </div>

        {/* Global Feedback Alert */}
        {statusMsg && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
                : 'bg-red-500/20 text-red-200 border-red-500/40'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-TAB 1: HALAQAHS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeSubTab === 'halaqahs' && (
          <div className="space-y-6 flex-1">
            {/* Top Bar for Halaqahs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#022c22]/70 p-4 rounded-2xl border border-[#065f46]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#fbbf24]" />
                  <span>قائمة الحلقات المقامة في المنظومة</span>
                </h3>
                <p className="text-[11px] text-[#86efac] mt-0.5">
                  الحلقة الحالية: {settings.halaqahName} (معلمها محمد منتصر والمعلمون الشركاء)
                </p>
              </div>
              <button
                onClick={handleStartAddHalaqah}
                className="px-4 py-2 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة حلقة جديدة</span>
              </button>
            </div>

            {/* Halaqah Add/Edit Form */}
            {editingHalaqah && (
              <form
                onSubmit={handleSaveHalaqahForm}
                className="bg-[#022c22] border-2 border-[#fbbf24]/50 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-[#065f46] pb-2">
                  <h4 className="text-sm font-bold text-[#fbbf24] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>{isNewHalaqah ? 'بيانات الحلقة الجديدة' : 'تعديل بيانات الحلقة'}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingHalaqah(null);
                      setIsNewHalaqah(false);
                    }}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Halaqah Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#86efac] mb-1">
                      اسم الحلقة <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: حلقة عثمان بن عفان رضي الله عنه"
                      value={editingHalaqah.name || ''}
                      onChange={e => setEditingHalaqah({ ...editingHalaqah, name: e.target.value })}
                      className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-white text-xs focus:border-[#fbbf24] focus:outline-none"
                    />
                  </div>

                  {/* Teacher Selection */}
                  <div>
                    <label className="block text-xs font-bold text-[#86efac] mb-1">
                      اختيار معلم الحلقة <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={editingHalaqah.primaryTeacherName || ''}
                      onChange={e => setEditingHalaqah({ ...editingHalaqah, primaryTeacherName: e.target.value })}
                      className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-white text-xs focus:border-[#fbbf24] focus:outline-none cursor-pointer"
                    >
                      {teachers.map(t => {
                        const linkedHalaqah = t.halaqahName || (t.halaqahId ? halaqahs.find(h => h.id === t.halaqahId)?.name : null);
                        return (
                          <option key={t.id} value={t.name}>
                            {t.name} {linkedHalaqah ? `(مرتبط حالياً بـ: ${linkedHalaqah})` : '(معلم جديد غير مرتبط)'}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-[10px] text-[#86efac]/70 mt-1">
                      * إذا اخترت معلماً مرتبطاً بحلقة أخرى، سيتم سؤاله لنقله لهذه الحلقة الجديدة.
                    </p>
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#86efac] mb-1">
                      وصف الحلقة أو ملاحظات عنها (اختياري)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: حلقة المتقدمين في حفظ الأجزاء الأخيرة، دوام مسائي"
                      value={editingHalaqah.description || ''}
                      onChange={e => setEditingHalaqah({ ...editingHalaqah, description: e.target.value })}
                      className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-white text-xs focus:border-[#fbbf24] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#065f46]">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingHalaqah(null);
                      setIsNewHalaqah(false);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-[#064e3b] cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-[#fbbf24] text-[#064e3b] hover:bg-[#f59e0b] shadow-md cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ بيانات الحلقة'}
                  </button>
                </div>
              </form>
            )}

            {/* Prompt Dialog: Teacher Move Confirmation */}
            {pendingTeacherMoveConfirm && (
              <div className="bg-[#022c22] border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 space-y-3 animate-fadeIn shadow-2xl">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>المعلم ({pendingTeacherMoveConfirm.teacher.name}) مرتبط بحلقة ({pendingTeacherMoveConfirm.teacher.halaqahName || 'حلقة أخرى'})!</span>
                </div>
                <p className="text-xs text-[#f0f9f6] leading-relaxed">
                  هل تريد نقل هذا المعلم إلى حلقة <strong className="text-[#fbbf24]">({pendingTeacherMoveConfirm.targetHalaqahName})</strong> وتعيينه معلماً لها؟
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPendingTeacherMoveConfirm(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-[#064e3b] cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => pendingTeacherMoveConfirm.onConfirm()}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-[#fbbf24] text-[#064e3b] hover:bg-[#f59e0b] shadow-lg cursor-pointer"
                  >
                    نعم، انقله لهنا
                  </button>
                </div>
              </div>
            )}

            {/* List of Halaqahs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {halaqahs.map(h => {
                const halaqahStudents = students.filter(s => s.halaqahId === h.id);
                const halaqahTeachers = teachers.filter(t => t.halaqahId === h.id);
                const isCurrentActive = activeHalaqahId === h.id;

                return (
                  <div
                    key={h.id}
                    className={`bg-[#022c22]/90 border rounded-2xl p-4 transition-all flex flex-col justify-between ${
                      isCurrentActive
                        ? 'border-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.15)]'
                        : 'border-[#065f46] hover:border-[#fbbf24]/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>{h.name}</span>
                              {h.isDefault && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30">
                                  الأساسية
                                </span>
                              )}
                            </h4>
                          </div>
                          <p className="text-[11px] text-[#86efac] mt-1">
                            المعلم المسؤول: <strong className="text-white">{h.primaryTeacherName || 'الشيخ محمد منتصر'}</strong>
                          </p>
                          {h.description && (
                            <p className="text-[10px] text-slate-300 mt-0.5 line-clamp-1">
                              {h.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditHalaqah(h)}
                            title="تعديل الحلقة"
                            className="p-1.5 text-[#86efac] hover:text-[#fbbf24] hover:bg-[#064e3b] rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {!h.isDefault && halaqahs.length > 1 && (
                            <button
                              onClick={() => setDeleteHalaqahConfirmId(h.id)}
                              title="حذف الحلقة"
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="mt-3 grid grid-cols-2 gap-2 bg-[#064e3b]/40 rounded-xl p-2.5 text-center text-xs">
                        <div className="border-l border-[#065f46]">
                          <span className="text-[10px] text-[#86efac] block">عدد الطلاب</span>
                          <span className="font-bold text-[#fbbf24] text-sm">{halaqahStudents.length}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#86efac] block">المعلمون المرتبطون</span>
                          <span className="font-bold text-white text-sm">
                            {halaqahTeachers.length > 0 ? halaqahTeachers.length : (h.primaryTeacherName ? 1 : 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Confirm */}
                    {deleteHalaqahConfirmId === h.id && (
                      <div className="mt-3 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-xs space-y-2">
                        <p className="text-red-200">
                          هل أنت متأكد من حذف حلقة ({h.name})؟ الطلاب المنتسبون لها سيبقون مسجلين في المنظومة.
                        </p>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDeleteHalaqahConfirmId(null)}
                            className="px-3 py-1 rounded-lg text-[11px] bg-[#064e3b] text-white cursor-pointer"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHalaqah(h.id)}
                            className="px-3 py-1 rounded-lg text-[11px] font-bold bg-red-500 text-white cursor-pointer"
                          >
                            تأكيد الحذف
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Select / Active Toggle */}
                    {onSwitchActiveHalaqah && (
                      <div className="mt-3 pt-2 border-t border-[#065f46]/50 flex items-center justify-between">
                        <span className="text-[10px] text-[#86efac]">
                          {isCurrentActive ? '● الحلقة المعروضة حالياً' : 'عرض بيانات هذه الحلقة'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onSwitchActiveHalaqah(h.id)}
                          className={`text-xs px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                            isCurrentActive
                              ? 'bg-[#fbbf24] text-[#064e3b]'
                              : 'bg-[#064e3b] text-[#86efac] hover:text-white'
                          }`}
                        >
                          {isCurrentActive ? 'مُحددة' : 'تحديد كعرض نشط'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-TAB 2: TEACHERS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeSubTab === 'teachers' && (
          <div className="space-y-6 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#022c22]/70 p-4 rounded-2xl border border-[#065f46]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#fbbf24]" />
                  <span>قائمة المعلمين وحسابات الدخول</span>
                </h3>
                <p className="text-[11px] text-[#86efac] mt-0.5">
                  يمكن إضافة معلمين لا نهائي وتعديلهم وحذفهم وربطهم بالحلقات القرآنية
                </p>
              </div>
              <button
                onClick={handleStartAddTeacher}
                className="px-4 py-2 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة معلم جديد</span>
              </button>
            </div>

            {/* Teacher Add/Edit Form */}
            {editingTeacher && (
              <form
                onSubmit={handleSaveTeacherForm}
                className="bg-[#022c22] border-2 border-[#fbbf24]/50 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-[#065f46] pb-2">
                  <h4 className="text-sm font-bold text-[#fbbf24] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>{isNewTeacher ? 'إضافة معلم جديد' : 'تعديل بيانات المعلم'}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeacher(null);
                      setIsNewTeacher(false);
                    }}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#86efac] mb-1">
                      اسم المعلم الكامل <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: الشيخ أحمد البلوشي"
                      value={editingTeacher.name || ''}
                      onChange={e => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                      className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-white text-xs focus:border-[#fbbf24] focus:outline-none"
                    />
                  </div>

                  {/* Username for login */}
                  <div>
                    <label className="block text-xs font-bold text-[#86efac] mb-1">
                      اسم المستخدم للدخول <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: ahmad_quran أو أحمد"
                      value={editingTeacher.username || ''}
                      onChange={e => setEditingTeacher({ ...editingTeacher, username: e.target.value })}
                      className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-white text-xs focus:border-[#fbbf24] focus:outline-none"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-[#86efac] mb-1">
                      كلمة المرور للدخول <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="123"
                      value={editingTeacher.password || ''}
                      onChange={e => setEditingTeacher({ ...editingTeacher, password: e.target.value })}
                      className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-white text-xs focus:border-[#fbbf24] focus:outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-[#86efac] mb-1">
                      رقم الجوال للتواصل
                    </label>
                    <input
                      type="text"
                      placeholder="0500000000"
                      value={editingTeacher.phone || ''}
                      onChange={e => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                      className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-white text-xs focus:border-[#fbbf24] focus:outline-none"
                    />
                  </div>

                  {/* Assigned Halaqah */}
                  <div>
                    <label className="block text-xs font-bold text-[#86efac] mb-1">
                      الحلقة المرتبط بها (اختياري)
                    </label>
                    <select
                      value={editingTeacher.halaqahId || ''}
                      onChange={e => {
                        const hId = e.target.value;
                        const hObj = halaqahs.find(h => h.id === hId);
                        setEditingTeacher({
                          ...editingTeacher,
                          halaqahId: hId,
                          halaqahName: hObj ? hObj.name : ''
                        });
                      }}
                      className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-white text-xs focus:border-[#fbbf24] focus:outline-none cursor-pointer"
                    >
                      <option value="">-- غير مرتبط بحلقة حالياً --</option>
                      {halaqahs.map(h => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-[#86efac] mb-1">
                      الصفة / المسمى
                    </label>
                    <input
                      type="text"
                      placeholder="معلم ومحفظ"
                      value={editingTeacher.title || ''}
                      onChange={e => setEditingTeacher({ ...editingTeacher, title: e.target.value })}
                      className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-white text-xs focus:border-[#fbbf24] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#065f46]">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeacher(null);
                      setIsNewTeacher(false);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-[#064e3b] cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-[#fbbf24] text-[#064e3b] hover:bg-[#f59e0b] shadow-md cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ حساب المعلم'}
                  </button>
                </div>
              </form>
            )}

            {/* List of Teachers */}
            <div className="space-y-3">
              {teachers.map(t => {
                const assignedHalaqah = t.halaqahName || (t.halaqahId ? halaqahs.find(h => h.id === t.halaqahId)?.name : 'غير مرتبط');
                return (
                  <div
                    key={t.id}
                    className="bg-[#022c22]/90 border border-[#065f46] hover:border-[#fbbf24]/40 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-[#fbbf24] flex items-center justify-center font-bold border border-emerald-500/30 shrink-0">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{t.name}</h4>
                          {t.isPrimary && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30 font-bold">
                              المشرف الأول
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#064e3b] text-[#86efac] border border-[#065f46]">
                            الحلقة: {assignedHalaqah}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#86efac]/80 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 font-mono">
                            <Key className="w-3 h-3 text-[#fbbf24]" />
                            <span>المستخدم: {t.username}</span>
                          </span>
                          <span>•</span>
                          <span className="font-mono">المرور: {t.password}</span>
                          {t.phone && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-[#fbbf24]" />
                                <span>{t.phone}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleStartEditTeacher(t)}
                        title="تعديل حساب المعلم"
                        className="p-2 text-[#86efac] hover:text-[#fbbf24] hover:bg-[#064e3b] rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {!t.isPrimary && (
                        <button
                          onClick={() => setDeleteTeacherConfirmId(t.id)}
                          title="حذف حساب المعلم"
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Delete Confirm */}
                    {deleteTeacherConfirmId === t.id && (
                      <div className="w-full mt-2 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-xs space-y-2">
                        <p className="text-red-200">
                          هل أنت متأكد من حذف حساب المعلم ({t.name})؟ لن يتمكن من تسجيل الدخول بعدها.
                        </p>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDeleteTeacherConfirmId(null)}
                            className="px-3 py-1 rounded-lg text-[11px] bg-[#064e3b] text-white cursor-pointer"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeacher(t.id)}
                            className="px-3 py-1 rounded-lg text-[11px] font-bold bg-red-500 text-white cursor-pointer"
                          >
                            تأكيد الحذف
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-TAB 3: TRANSFER STUDENTS */}
        {/* ========================================================================= */}
        {activeSubTab === 'transfer' && (
          <div className="space-y-6 flex-1">
            <div className="bg-[#022c22]/70 p-4 rounded-2xl border border-[#065f46]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[#fbbf24]" />
                <span>نقل طالب إلى حلقة أخرى بكامل سجله القرآني</span>
              </h3>
              <p className="text-[11px] text-[#86efac] mt-1 leading-relaxed">
                عند نقل الطالب، يتم نقل سجله بالكامل (بيانات الحفظ الحالية، خطة الذكاء الاصطناعي، جميع سجلات الحضور والغياب، وتقييمات التسميع) لتظهر فورياً تحت إشراف معلّمي الحلقة الجديدة.
              </p>
            </div>

            <form
              onSubmit={handleTransferStudentSubmit}
              className="bg-[#022c22] border border-[#065f46] rounded-2xl p-5 space-y-4 shadow-xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Student */}
                <div>
                  <label className="block text-xs font-bold text-[#86efac] mb-1">
                    اختر الطالب المراد نقله <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={transferStudentId}
                    onChange={e => setTransferStudentId(e.target.value)}
                    className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2.5 text-white text-xs focus:border-[#fbbf24] focus:outline-none cursor-pointer"
                  >
                    <option value="">-- اختر الطالب --</option>
                    {students.map(s => {
                      const currentH = s.halaqahName || (s.halaqahId ? halaqahs.find(h => h.id === s.halaqahId)?.name : 'حلقة الزبير بن العوام');
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} (حالياً في: {currentH})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Select Target Halaqah */}
                <div>
                  <label className="block text-xs font-bold text-[#86efac] mb-1">
                    اختر الحلقة المراد النقل إليها <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={transferTargetHalaqahId}
                    onChange={e => setTransferTargetHalaqahId(e.target.value)}
                    className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2.5 text-white text-xs focus:border-[#fbbf24] focus:outline-none cursor-pointer"
                  >
                    <option value="">-- اختر الحلقة المستهدفة --</option>
                    {halaqahs.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} (المعلم: {h.primaryTeacherName || 'محمد منتصر'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Summary of Selected Student Details if chosen */}
              {transferStudentId && (
                (() => {
                  const sel = students.find(s => s.id === transferStudentId);
                  if (!sel) return null;
                  return (
                    <div className="bg-[#064e3b]/50 border border-[#065f46] rounded-xl p-3.5 text-xs text-[#86efac] space-y-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-white">بيانات الطالب المحدد:</span>
                        <span className="text-[#fbbf24] font-bold">{sel.name} ({sel.age} سنة)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>موضع الحفظ الحالي:</span>
                        <span className="text-white">سورة {sel.currentSurahName} - آية {sel.currentAyah}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ولي الأمر ورقم الجوال:</span>
                        <span className="text-white">{sel.parentName} ({sel.phone})</span>
                      </div>
                    </div>
                  );
                })()
              )}

              <div className="flex items-center justify-end pt-3 border-t border-[#065f46]">
                <button
                  type="submit"
                  disabled={isSubmitting || !transferStudentId || !transferTargetHalaqahId}
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#fbbf24] text-[#064e3b] hover:bg-[#f59e0b] shadow-lg cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{isSubmitting ? 'جارٍ النقل...' : 'نقل الطالب وحفظ سجله بالكامل'}</span>
                </button>
              </div>
            </form>

            {/* Quick Students Directory by Halaqah */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-[#86efac] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#fbbf24]" />
                <span>توزيع الطلاب الحالي حسب الحلقات</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {halaqahs.map(h => {
                  const list = students.filter(s => s.halaqahId === h.id);
                  return (
                    <div key={h.id} className="bg-[#022c22] border border-[#065f46] rounded-2xl p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-[#065f46] pb-1.5">
                        <span className="font-bold text-white">{h.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#064e3b] text-[#fbbf24] text-[10px] font-bold">
                          {list.length} طلاب
                        </span>
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                        {list.length === 0 ? (
                          <p className="text-[11px] text-slate-400 py-1">لا يوجد طلاب في هذه الحلقة بعد.</p>
                        ) : (
                          list.map(st => (
                            <div key={st.id} className="flex items-center justify-between text-[11px] text-slate-200 py-0.5">
                              <span>• {st.name}</span>
                              <span className="text-[10px] text-[#86efac]">سورة {st.currentSurahName}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
