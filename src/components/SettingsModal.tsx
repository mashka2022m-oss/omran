import React, { useState, useMemo, useEffect } from 'react';
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
  Info,
  CheckSquare,
  Square,
  Palette,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  Eye,
  Check
} from 'lucide-react';
import { TeacherAccount, Halaqah, Student, AppSettings, QuranComplex, ComplexThemeConfig, isTeacherSupervisor, getThreePartNameValidation } from '../types';
import { ISLAMIC_THEME_PRESETS, generateHarmoniousIslamicPalette, IslamicThemePreset, hexToRgb, lightenHex } from '../lib/themeUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherAccount[];
  halaqahs: Halaqah[];
  complexes?: QuranComplex[];
  activeComplex?: QuranComplex | null;
  students: Student[];
  settings: AppSettings;
  activeHalaqahId?: string;
  isDeveloper?: boolean;
  complexName?: string;
  onSaveTeacher: (teacher: TeacherAccount) => Promise<void>;
  onDeleteTeacher: (teacherId: string) => Promise<void>;
  onSaveHalaqah: (halaqah: Halaqah) => Promise<void>;
  onDeleteHalaqah: (halaqahId: string) => Promise<void>;
  onTransferStudent: (studentId: string, targetHalaqahId: string, targetHalaqahName: string) => Promise<void>;
  onBatchTransferStudents?: (studentIds: string[], targetHalaqahId: string, targetHalaqahName: string) => Promise<void>;
  onSwitchActiveHalaqah?: (halaqahId: string) => void;
  onSaveComplex?: (complex: QuranComplex) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  teachers,
  halaqahs,
  complexes = [],
  activeComplex,
  students,
  settings,
  activeHalaqahId,
  isDeveloper = false,
  complexName,
  onSaveTeacher,
  onDeleteTeacher,
  onSaveHalaqah,
  onDeleteHalaqah,
  onTransferStudent,
  onBatchTransferStudents,
  onSwitchActiveHalaqah,
  onSaveComplex
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'theme' | 'halaqahs' | 'teachers' | 'transfer'>('theme');

  // Complex Theme & Branding State
  const [selectedThemeComplexId, setSelectedThemeComplexId] = useState<string>(() => {
    return activeComplex?.id || complexes[0]?.id || '';
  });

  const targetThemeComplex = useMemo(() => {
    return complexes.find(c => c.id === selectedThemeComplexId) || activeComplex || complexes[0] || null;
  }, [complexes, selectedThemeComplexId, activeComplex]);

  const [themeComplexName, setThemeComplexName] = useState<string>(() => targetThemeComplex?.name || '');
  const [themeLogoUrl, setThemeLogoUrl] = useState<string>(() => targetThemeComplex?.logoUrl || '');
  const [themeStampUrl, setThemeStampUrl] = useState<string>(() => targetThemeComplex?.stampUrl || '');
  const [themeColors, setThemeColors] = useState<ComplexThemeConfig>(() => {
    return targetThemeComplex?.theme || ISLAMIC_THEME_PRESETS[0].colors;
  });

  const [fileError, setFileError] = useState<string | null>(null);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [themeSuccessMsg, setThemeSuccessMsg] = useState<string | null>(null);

  // Sync state whenever targetThemeComplex changes
  useEffect(() => {
    if (targetThemeComplex) {
      setThemeComplexName(targetThemeComplex.name || '');
      setThemeLogoUrl(targetThemeComplex.logoUrl || '');
      setThemeStampUrl(targetThemeComplex.stampUrl || '');
      setThemeColors(targetThemeComplex.theme || ISLAMIC_THEME_PRESETS[0].colors);
      setFileError(null);
    }
  }, [targetThemeComplex?.id]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxBytes = 5 * 1024 * 1024; // 5MB strict limit
    if (file.size > maxBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setFileError(`⚠️ شرط إلزامي: حجم صورة الشعار (${sizeMB} ميجابايت) يتجاوز الحد الأقصى (5 ميجابايت). يرجى اختيار ملف أصغر حجماً.`);
      e.target.value = '';
      return;
    }
    setFileError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setThemeLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxBytes = 5 * 1024 * 1024; // 5MB strict limit
    if (file.size > maxBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setFileError(`⚠️ شرط إلزامي: حجم صورة الختم (${sizeMB} ميجابايت) يتجاوز الحد الأقصى (5 ميجابايت). يرجى اختيار ملف أصغر حجماً.`);
      e.target.value = '';
      return;
    }
    setFileError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setThemeStampUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTheme = async () => {
    if (!targetThemeComplex) return;
    if (!onSaveComplex) {
      setStatusMsg({ type: 'error', text: 'خاصية حفظ بيانات المجمع غير متوفرة.' });
      return;
    }
    try {
      setIsSavingTheme(true);
      setFileError(null);
      const updated: QuranComplex = {
        ...targetThemeComplex,
        name: themeComplexName.trim() || targetThemeComplex.name,
        logoUrl: themeLogoUrl || undefined,
        stampUrl: themeStampUrl || undefined,
        theme: themeColors,
        updatedAt: new Date().toISOString()
      };
      await onSaveComplex(updated);
      setThemeSuccessMsg(`تم حفظ وتطبيق هوية وثيم "${updated.name}" بنجاح! تم اعتماد اسم المجمع والشعار والختم والألوان بالكامل.`);
      setTimeout(() => setThemeSuccessMsg(null), 5000);
    } catch (err: any) {
      setFileError(err?.message || 'حدث خطأ أثناء حفظ ثيم المجمع');
    } finally {
      setIsSavingTheme(false);
    }
  };

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
  const [transferMode, setTransferMode] = useState<'batch' | 'single'>('batch');
  const [transferStudentId, setTransferStudentId] = useState<string>('');
  const [selectedTransferStudentIds, setSelectedTransferStudentIds] = useState<string[]>([]);
  const [transferFilterSourceHalaqahId, setTransferFilterSourceHalaqahId] = useState<string>('all');
  const [transferTargetHalaqahId, setTransferTargetHalaqahId] = useState<string>('');

  // Status & Feedback
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmations
  const [deleteHalaqahConfirmId, setDeleteHalaqahConfirmId] = useState<string | null>(null);
  const [deleteTeacherConfirmId, setDeleteTeacherConfirmId] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ----------------------------------------------------
  // Halaqah Handlers
  // ----------------------------------------------------
  const handleStartAddHalaqah = () => {
    setIsNewHalaqah(true);
    const defaultComplex = complexes[0];
    setEditingHalaqah({
      id: `halaqah-${Date.now()}`,
      name: '',
      description: '',
      complexId: defaultComplex?.id,
      complexName: defaultComplex?.name,
      primaryTeacherName: teachers[0]?.name || 'المعلم المشرف',
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
        const targetComplex = complexes.find(c => c.id === editingHalaqah.complexId) || complexes[0];
        const halaqahObj: Halaqah = {
          id: halaqahId,
          name: halaqahName,
          description: editingHalaqah.description?.trim() || '',
          primaryTeacherName: selectedTeacherName,
          complexId: targetComplex?.id || editingHalaqah.complexId || undefined,
          complexName: targetComplex?.name || editingHalaqah.complexName || undefined,
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
    const defaultComplex = complexes[0];
    setEditingTeacher({
      id: `teacher-${Date.now()}`,
      name: '',
      username: '',
      password: '123',
      phone: '0500000000',
      title: 'معلم ومحفظ',
      role: 'teacher',
      complexId: defaultComplex?.id,
      complexName: defaultComplex?.name,
      halaqahIds: halaqahs.length > 0 ? [halaqahs[0].id] : [],
      halaqahNames: halaqahs.length > 0 ? [halaqahs[0].name] : [],
      halaqahId: halaqahs[0]?.id || '',
      halaqahName: halaqahs[0]?.name || '',
      isPrimary: false,
      createdAt: new Date().toISOString()
    });
    setStatusMsg(null);
  };

  const handleStartEditTeacher = (t: TeacherAccount) => {
    setIsNewTeacher(false);
    const assignedIds = t.halaqahIds && t.halaqahIds.length > 0
      ? t.halaqahIds
      : (t.halaqahId ? [t.halaqahId] : []);
    const assignedNames = halaqahs
      .filter(h => assignedIds.includes(h.id))
      .map(h => h.name);

    setEditingTeacher({
      ...t,
      halaqahIds: assignedIds,
      halaqahNames: assignedNames
    });
    setStatusMsg(null);
  };

  const handleSaveTeacherForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !editingTeacher.name?.trim() || !editingTeacher.username?.trim()) {
      setStatusMsg({ type: 'error', text: 'يرجى كتابة اسم المعلم واسم المستخدم للدخول.' });
      return;
    }

    const nameVal = getThreePartNameValidation(editingTeacher.name, 'معلم');
    if (!nameVal.isValid) {
      setStatusMsg({ type: 'error', text: nameVal.message || 'الاسم الثلاثي للمعلم إلزامي.' });
      return;
    }

    const cleanTeacherName = editingTeacher.name.trim();
    const normTeacherName = cleanTeacherName.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');

    // Check duplicate teacher name
    const duplicateTeacher = teachers.find(
      t => t.id !== editingTeacher.id &&
           t.name.trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي') === normTeacherName
    );
    if (duplicateTeacher) {
      setStatusMsg({
        type: 'error',
        text: `عذراً، هذا الاسم (${cleanTeacherName}) مسجل مسبقاً لمعلم أو مشرف في المنظومة! يرجى كتابة الاسم الرباعي أو إضافة اسم العائلة والجد لتجنب تطابق الأسماء.`
      });
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
      const selectedHalaqahIds = editingTeacher.halaqahIds || [];
      const selectedHalaqahs = halaqahs.filter(h => selectedHalaqahIds.includes(h.id));
      const selectedHalaqahNames = selectedHalaqahs.map(h => h.name);

      const cleanUser = (editingTeacher.username || '').trim().toLowerCase();
      const cleanName = (editingTeacher.name || '').trim().toLowerCase();
      const isDevOrAdmin =
        cleanUser === 'admin' ||
        cleanUser === 'developer' ||
        editingTeacher.id === 'teacher-1' ||
        editingTeacher.role === 'developer';

      const isSuper = isDevOrAdmin || editingTeacher.role === 'supervisor';
      const selectedComplex = complexes.find(c => c.id === editingTeacher.complexId) || complexes[0];

      const fullTeacher: TeacherAccount = {
        id: editingTeacher.id || `teacher-${Date.now()}`,
        name: editingTeacher.name.trim(),
        username: editingTeacher.username.trim(),
        password: editingTeacher.password?.trim() || '123',
        phone: editingTeacher.phone?.trim() || '0500000000',
        title: editingTeacher.title?.trim() || (isDevOrAdmin ? 'المشرف والمطور العام' : (isSuper ? 'معلم مشرف' : 'معلم ومحفظ')),
        role: isSuper ? 'supervisor' : 'teacher',
        isPrimary: isDevOrAdmin,
        complexId: editingTeacher.complexId || selectedComplex?.id,
        complexName: selectedComplex?.name || editingTeacher.complexName,
        halaqahIds: selectedHalaqahIds,
        halaqahNames: selectedHalaqahNames,
        halaqahId: selectedHalaqahIds[0] || '',
        halaqahName: selectedHalaqahNames[0] || '',
        createdAt: editingTeacher.createdAt || new Date().toISOString()
      };

      await onSaveTeacher(fullTeacher);

      // Synchronize halaqahs in Firestore
      for (const h of halaqahs) {
        const isAssigned = selectedHalaqahIds.includes(h.id);
        const currentTeacherIds = h.teacherIds || [];
        const currentTeacherNames = h.teacherNames || [];
        const hasTeacher = currentTeacherIds.includes(fullTeacher.id);

        if (isAssigned && !hasTeacher) {
          await onSaveHalaqah({
            ...h,
            teacherIds: [...currentTeacherIds, fullTeacher.id],
            teacherNames: [...currentTeacherNames, fullTeacher.name]
          });
        } else if (!isAssigned && hasTeacher) {
          await onSaveHalaqah({
            ...h,
            teacherIds: currentTeacherIds.filter(id => id !== fullTeacher.id),
            teacherNames: currentTeacherNames.filter(name => name !== fullTeacher.name)
          });
        }
      }

      setStatusMsg({
        type: 'success',
        text: isNewTeacher
          ? `تمت إضافة حساب المعلم (${fullTeacher.name}) وتحديث ارتباط الحلقات بنجاح!`
          : `تم تحديث بيانات المعلم (${fullTeacher.name}) وارتباط الحلقات بنجاح!`
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
    if (!transferTargetHalaqahId) {
      setStatusMsg({ type: 'error', text: 'يرجى اختيار الحلقة المراد النقل إليها.' });
      return;
    }

    const targetHalaqah = halaqahs.find(h => h.id === transferTargetHalaqahId);
    if (!targetHalaqah) {
      setStatusMsg({ type: 'error', text: 'تعذر العثور على بيانات الحلقة المستهدفة.' });
      return;
    }

    if (transferMode === 'batch') {
      if (selectedTransferStudentIds.length === 0) {
        setStatusMsg({ type: 'error', text: 'يرجى تحديد طالب واحد على الأقل لنقله سحابياً.' });
        return;
      }

      try {
        setIsSubmitting(true);
        if (onBatchTransferStudents) {
          await onBatchTransferStudents(selectedTransferStudentIds, targetHalaqah.id, targetHalaqah.name);
        } else {
          for (const sId of selectedTransferStudentIds) {
            await onTransferStudent(sId, targetHalaqah.id, targetHalaqah.name);
          }
        }
        setStatusMsg({
          type: 'success',
          text: `تم نقل (${selectedTransferStudentIds.length}) طلاب بنجاح إلى (${targetHalaqah.name}) ومزامنتهم سحابياً في Firestore!`
        });
        setSelectedTransferStudentIds([]);
        setTransferTargetHalaqahId('');
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: 'حدث خطأ أثناء نقل الطلاب سحابياً: ' + err.message });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!transferStudentId) {
        setStatusMsg({ type: 'error', text: 'يرجى اختيار الطالب المراد نقله.' });
        return;
      }

      const st = students.find(s => s.id === transferStudentId);
      if (!st) {
        setStatusMsg({ type: 'error', text: 'تعذر العثور على بيانات الطالب.' });
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
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain" dir="rtl">
      <div className="w-full max-w-4xl bg-[#064e3b] border border-[#fbbf24]/40 rounded-[32px] p-5 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
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
              setActiveSubTab('theme');
              setStatusMsg(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'theme'
                ? 'bg-[#fbbf24] text-[#064e3b] shadow-md ring-2 ring-[#fbbf24]/50'
                : 'bg-[#022c22] text-[#86efac] hover:text-white hover:bg-[#022c22]/80 border border-[#065f46]'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>قسم المجمع</span>
          </button>

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
        {/* SUB-TAB 0: COMPLEX SECTION (قسم المجمع: الهوية، الشعار، الختم، والألوان)     */}
        {/* ========================================================================= */}
        {activeSubTab === 'theme' && (
          <div className="space-y-6 flex-1 text-right">
            {/* Header Banner */}
            <div className="bg-[#022c22]/70 p-4 sm:p-5 rounded-2xl border border-[#065f46] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 font-heading">
                  <Palette className="w-5 h-5 text-[#fbbf24]" />
                  <span>قسم المجمع: الهوية والشعار والختم وألوان المنصة</span>
                </h3>
                <p className="text-xs text-[#86efac] mt-1 leading-relaxed">
                  ارفع شعار المجمع (صورة تبويب المتصفح) وختم المجمع الرسمي للشهادات والتقارير (بحد أقصى 5 ميجابايت إلزامياً)، وخصص ألوان المنصة بالكامل مع معاينة حية ومباشرة.
                </p>
              </div>

              {/* Complex selector if developer or multiple complexes exist */}
              {complexes.length > 1 && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-[#fbbf24] font-bold">المجمع المستهدف:</span>
                  <select
                    value={selectedThemeComplexId}
                    onChange={e => setSelectedThemeComplexId(e.target.value)}
                    className="bg-[#064e3b] border border-[#fbbf24]/50 rounded-xl px-3 py-1.5 text-xs text-white font-bold cursor-pointer outline-none"
                  >
                    {complexes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Complex Name Field */}
            <div className="bg-[#022c22]/80 border border-[#065f46] rounded-2xl p-4 sm:p-5 space-y-2">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#fbbf24]" />
                <span>اسم مجمع التحفيظ الرسمي</span>
              </label>
              <p className="text-[11px] text-[#86efac]/80 leading-relaxed">
                هذا الاسم سيظهر في الشريط العلوي للمنصة، وعنوان تبويب المتصفح، وكافة الشهادات والتقارير المستخرجة بدلاً من أي اسم آخر.
              </p>
              <input
                type="text"
                value={themeComplexName}
                onChange={e => setThemeComplexName(e.target.value)}
                placeholder="مثال: مجمع تحفيظ القرآن الكريم"
                className="w-full bg-[#064e3b]/70 border border-[#fbbf24]/50 rounded-xl px-4 py-2.5 text-sm text-white font-bold outline-none focus:ring-2 focus:ring-[#fbbf24]"
              />
            </div>

            {/* Error or Success notification */}
            {fileError && (
              <div className="p-3.5 rounded-2xl text-xs flex items-center gap-2 bg-red-500/20 text-red-200 border border-red-500/40">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{fileError}</span>
              </div>
            )}
            {themeSuccessMsg && (
              <div className="p-3.5 rounded-2xl text-xs flex items-center gap-2 bg-emerald-500/20 text-emerald-200 border border-emerald-500/40">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{themeSuccessMsg}</span>
              </div>
            )}

            {/* Logo and Stamp Uploads Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Upload Logo */}
              <div className="bg-[#022c22]/80 border border-[#065f46] rounded-2xl p-4 sm:p-5 space-y-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#fbbf24]" />
                      <span>شعار المجمع (Logo)</span>
                    </h4>
                    <span className="text-[10px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 font-mono">
                      الحد الأقصى: 5MB
                    </span>
                  </div>
                  <p className="text-[11px] text-[#86efac]/80 mt-1 leading-relaxed">
                    يُعتمد كأيقونة لتبويب المتصفح (Favicon)، وشعار لشريط العنوان الأعلى والشهادات والتقارير.
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="w-20 h-20 rounded-2xl bg-[#064e3b] border-2 border-dashed border-[#fbbf24]/50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {themeLogoUrl ? (
                      <img
                        src={themeLogoUrl}
                        alt="شعار المجمع"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="text-center p-2 text-[#86efac]/60">
                        <ImageIcon className="w-6 h-6 mx-auto mb-0.5 opacity-60" />
                        <span className="text-[9px] block">لا يوجد شعار</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#fbbf24] hover:bg-amber-400 text-[#064e3b] text-xs font-black cursor-pointer shadow-md transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{themeLogoUrl ? 'تغيير الشعار' : 'رفع شعار المجمع'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>

                    {themeLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setThemeLogoUrl('')}
                        className="block text-[11px] text-red-300 hover:text-red-100 hover:underline cursor-pointer"
                      >
                        إزالة الشعار والعودة للافتراضي
                      </button>
                    )}
                    <span className="text-[10px] text-slate-400 block">
                      صيغ الصور المدعومة: PNG, JPG, WEBP, SVG
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Upload Stamp */}
              <div className="bg-[#022c22]/80 border border-[#065f46] rounded-2xl p-4 sm:p-5 space-y-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#fbbf24]" />
                      <span>ختم المجمع الرسمي (Official Stamp)</span>
                    </h4>
                    <span className="text-[10px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 font-mono">
                      الحد الأقصى: 5MB
                    </span>
                  </div>
                  <p className="text-[11px] text-[#86efac]/80 mt-1 leading-relaxed">
                    يُعتمد كختم رسمي وحيد للمجمع في الشهادات والتقارير المستخرجة بدلاً من ختم المنظومة القديم.
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="w-20 h-20 rounded-full bg-[#064e3b] border-2 border-dashed border-[#fbbf24]/50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {themeStampUrl ? (
                      <img
                        src={themeStampUrl}
                        alt="ختم المجمع"
                        className="w-full h-full object-contain p-1 rounded-full"
                      />
                    ) : (
                      <div className="text-center p-2 text-[#86efac]/60">
                        <Shield className="w-6 h-6 mx-auto mb-0.5 opacity-60" />
                        <span className="text-[9px] block">لا يوجد ختم</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-[#064e3b] text-xs font-black cursor-pointer shadow-md transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{themeStampUrl ? 'تغيير الختم' : 'رفع ختم المجمع'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStampChange}
                        className="hidden"
                      />
                    </label>

                    {themeStampUrl && (
                      <button
                        type="button"
                        onClick={() => setThemeStampUrl('')}
                        className="block text-[11px] text-red-300 hover:text-red-100 hover:underline cursor-pointer"
                      >
                        إزالة الختم والاعتماد النصي
                      </button>
                    )}
                    <span className="text-[10px] text-slate-400 block">
                      صورة شفافة (PNG مفرغة) لأفضل نتيجة رسمية
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Islamic Presets */}
            <div className="bg-[#022c22]/80 border border-[#065f46] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#065f46]/70 pb-2.5">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#fbbf24]" />
                    <span>قوالب الهوية الإسلامية الفاخرة (10 أنماط ملكية بنقرة واحدة)</span>
                  </h4>
                  <p className="text-[11px] text-[#86efac]/80 mt-0.5">
                    أنماط لونية مدروسة بعناية فائقة تضمن تباين الحروف وظهور الأزرار والبطاقات دون أن تختفي في الخلفية.
                  </p>
                </div>
                <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30 self-start sm:self-auto font-bold">
                  تباين معتمد 100%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {ISLAMIC_THEME_PRESETS.map((preset) => {
                  const isSelected =
                    themeColors.backgroundColor === preset.colors.backgroundColor &&
                    themeColors.accentColor === preset.colors.accentColor;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setThemeColors({ ...preset.colors })}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer select-none flex flex-col justify-between gap-2.5 relative group ${
                        isSelected
                          ? 'border-[#fbbf24] bg-[#064e3b] shadow-xl ring-2 ring-[#fbbf24]/60 scale-[1.02]'
                          : 'border-[#065f46] bg-[#022c22] hover:border-amber-400/50 hover:bg-[#064e3b]/30'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute -top-2 -left-2 bg-[#fbbf24] text-[#064e3b] rounded-full p-0.5 shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}

                      {/* Visual 3-color palette chip */}
                      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-black/30 border border-white/10 w-fit">
                        <div
                          className="w-5 h-5 rounded-lg border border-white/20 shadow-sm shrink-0"
                          style={{ backgroundColor: preset.colors.backgroundColor }}
                          title="لون الخلفية"
                        />
                        <div
                          className="w-5 h-5 rounded-lg border border-white/20 shadow-sm shrink-0"
                          style={{ backgroundColor: preset.colors.cardColor || preset.colors.secondaryColor }}
                          title="لون البطاقات"
                        />
                        <div
                          className="w-5 h-5 rounded-lg border border-white/20 shadow-sm shrink-0"
                          style={{ backgroundColor: preset.colors.accentColor }}
                          title="لون التمييز والأزرار"
                        />
                      </div>

                      <div>
                        <span className="font-extrabold text-xs text-white block truncate">{preset.name}</span>
                        <span className="text-[10px] text-[#86efac]/80 block line-clamp-2 mt-0.5 leading-relaxed">
                          {preset.subtitle}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section: Smart Color Harmonizer (مُولّد التناغم اللوني الذكي) */}
            <div className="bg-[#022c22]/80 border border-[#065f46] rounded-2xl p-4 sm:p-5 space-y-4 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#065f46]/70 pb-2.5">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#fbbf24]" />
                    <span>مُوَلّد التناغم اللوني الذكي (Smart Color Harmonizer)</span>
                  </h4>
                  <p className="text-[11px] text-[#86efac]/80 mt-0.5">
                    اختر اللون الأساسي ولون التمييز بنقرة واحدة، وسيقوم النظام فوراً بحساب درجات البطاقات والأزرار ونسب التباين تلقائياً.
                  </p>
                </div>
              </div>

              {/* Quick Base Hues */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#86efac] block">
                  1. اختر درجة اللون الأساسي للمجمع:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { label: 'زمردي نبوي', hex: '#022c22' },
                    { label: 'كحلي ملكي', hex: '#030f1c' },
                    { label: 'فيروزي أصفهاني', hex: '#031a1b' },
                    { label: 'عنابي راقي', hex: '#1c050d' },
                    { label: 'شوكولاتي أندلسي', hex: '#150d06' },
                    { label: 'بنفسجي أموي', hex: '#150a24' },
                    { label: 'زيتوني شامي', hex: '#0c190f' },
                    { label: 'فحمي كعبوي', hex: '#09090b' },
                    { label: 'لازوردي نيلي', hex: '#021626' },
                    { label: 'نحاسي عتيق', hex: '#190e06' }
                  ].map((hue) => (
                    <button
                      key={hue.hex}
                      type="button"
                      onClick={() => {
                        const generated = generateHarmoniousIslamicPalette(hue.hex, themeColors.accentColor || '#fbbf24');
                        setThemeColors(generated);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-amber-400 bg-[#064e3b]/50 hover:bg-[#064e3b] transition-all text-xs text-white font-bold cursor-pointer"
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-white/30" style={{ backgroundColor: hue.hex }} />
                      <span>{hue.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Accent Swatches */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#86efac] block">
                  2. اختر لون التمييز للأزرار والنجوم والأوسمة (Accent):
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { label: 'ذهب مكي مشرق', hex: '#fbbf24' },
                    { label: 'عنبر مدني دافئ', hex: '#f59e0b' },
                    { label: 'أزرق سماوي ساطع', hex: '#38bdf8' },
                    { label: 'تركواز برّاق', hex: '#2dd4bf' },
                    { label: 'ورد ياقوتي', hex: '#fb7185' },
                    { label: 'أرجواني زهري', hex: '#e879f9' },
                    { label: 'ليموني زيتوني', hex: '#a3e635' },
                    { label: 'أصفر خالص', hex: '#eab308' },
                    { label: 'برتقالي عنبري', hex: '#fb923c' }
                  ].map((accent) => (
                    <button
                      key={accent.hex}
                      type="button"
                      onClick={() => {
                        setThemeColors(prev => ({
                          ...prev,
                          accentColor: accent.hex
                        }));
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-bold cursor-pointer ${
                        themeColors.accentColor === accent.hex
                          ? 'border-amber-400 bg-amber-400/20 text-white ring-1 ring-amber-400'
                          : 'border-white/10 bg-[#064e3b]/50 hover:border-amber-400/60 text-white'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm" style={{ backgroundColor: accent.hex }} />
                      <span>{accent.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Custom Color Fine-Tuning */}
              <div className="pt-2 border-t border-[#065f46]/60">
                <span className="text-[11px] font-bold text-[#86efac] block mb-2">
                  3. التعديل الدقيق لكل مكوّن لوني على حدة:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* 1. Canvas Background */}
                  <div className="bg-[#064e3b]/50 p-2.5 rounded-xl border border-[#065f46] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#86efac] block">خلفية الواجهة (Canvas)</label>
                      <span className="text-[9px] text-slate-400">الخلفية الكبرى</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeColors.backgroundColor}
                        onChange={e => setThemeColors({ ...themeColors, backgroundColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={themeColors.backgroundColor}
                        onChange={e => setThemeColors({ ...themeColors, backgroundColor: e.target.value })}
                        className="flex-1 bg-[#022c22] border border-[#065f46] rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* 2. Cards & Navbar */}
                  <div className="bg-[#064e3b]/50 p-2.5 rounded-xl border border-[#065f46] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#86efac] block">البطاقات والأشرطة (Cards)</label>
                      <span className="text-[9px] text-amber-300 font-bold">أفتح من الخلفية</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeColors.cardColor || themeColors.secondaryColor}
                        onChange={e => setThemeColors({
                          ...themeColors,
                          cardColor: e.target.value,
                          secondaryColor: e.target.value,
                          surfaceColor: `rgba(${hexToRgb(e.target.value)}, 0.7)`
                        })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={themeColors.cardColor || themeColors.secondaryColor}
                        onChange={e => setThemeColors({
                          ...themeColors,
                          cardColor: e.target.value,
                          secondaryColor: e.target.value,
                          surfaceColor: `rgba(${hexToRgb(e.target.value)}, 0.7)`
                        })}
                        className="flex-1 bg-[#022c22] border border-[#065f46] rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* 3. Accent / Gold */}
                  <div className="bg-[#064e3b]/50 p-2.5 rounded-xl border border-[#065f46] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#86efac] block">التمييز والأزرار (Accent)</label>
                      <span className="text-[9px] text-[#fbbf24] font-bold">ذهبي / ساطع</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeColors.accentColor}
                        onChange={e => setThemeColors({ ...themeColors, accentColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={themeColors.accentColor}
                        onChange={e => setThemeColors({ ...themeColors, accentColor: e.target.value })}
                        className="flex-1 bg-[#022c22] border border-[#065f46] rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* 4. Primary Dark Accent */}
                  <div className="bg-[#064e3b]/50 p-2.5 rounded-xl border border-[#065f46] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#86efac] block">اللون العميق (Primary)</label>
                      <span className="text-[9px] text-slate-400">خطوط التدرج</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeColors.primaryColor}
                        onChange={e => setThemeColors({ ...themeColors, primaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={themeColors.primaryColor}
                        onChange={e => setThemeColors({ ...themeColors, primaryColor: e.target.value })}
                        className="flex-1 bg-[#022c22] border border-[#065f46] rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* 5. Text */}
                  <div className="bg-[#064e3b]/50 p-2.5 rounded-xl border border-[#065f46] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#86efac] block">لون النصوص (Text)</label>
                      <span className="text-[9px] text-slate-400">عالي التباين</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeColors.textColor || '#f0f9f6'}
                        onChange={e => setThemeColors({ ...themeColors, textColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={themeColors.textColor || '#f0f9f6'}
                        onChange={e => setThemeColors({ ...themeColors, textColor: e.target.value })}
                        className="flex-1 bg-[#022c22] border border-[#065f46] rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Live Realtime Preview (المعاينة الحية الفورية الشاملة للمنصة) */}
            <div className="bg-[#011a14] border-2 border-amber-400/50 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#065f46] pb-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#fbbf24]" />
                  <span className="text-xs sm:text-sm font-bold text-white">
                    معاينة حية مباشرة: شريط التنقل، والأزرار، والبطاقات، والحلقات بالألوان المختارة
                  </span>
                </div>
                <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold self-start sm:self-auto">
                  تحديث لحظي فوري
                </span>
              </div>

              {/* Mockup Canvas */}
              <div
                className="rounded-2xl p-4 sm:p-5 space-y-4 border transition-colors shadow-lg"
                style={{
                  backgroundColor: themeColors.backgroundColor,
                  borderColor: themeColors.primaryColor,
                  color: themeColors.textColor || '#f0f9f6'
                }}
              >
                {/* 1. Mockup Header / Navbar */}
                <div
                  className="p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-md"
                  style={{
                    backgroundColor: themeColors.cardColor || themeColors.secondaryColor,
                    borderColor: lightenHex(themeColors.secondaryColor, 0.15)
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 shadow-sm border"
                      style={{
                        backgroundColor: themeColors.accentColor,
                        borderColor: themeColors.accentColor,
                        color: themeColors.primaryColor
                      }}
                    >
                      {themeLogoUrl ? (
                        <img src={themeLogoUrl} alt="شعار" className="w-full h-full object-cover" />
                      ) : (
                        <span>{targetThemeComplex?.name ? targetThemeComplex.name.charAt(0) : 'ق'}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5
                          className="text-sm sm:text-base font-extrabold font-heading"
                          style={{ color: themeColors.accentColor }}
                        >
                          {themeComplexName || targetThemeComplex?.name || 'مجمع تحفيظ القرآن الكريم'}
                        </h5>
                        
                        {/* Switcher Pill inside Navbar */}
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-lg border font-bold flex items-center gap-1 shadow-sm"
                          style={{
                            backgroundColor: `${themeColors.primaryColor}bb`,
                            borderColor: `${themeColors.accentColor}66`,
                            color: themeColors.accentColor
                          }}
                        >
                          <Building2 className="w-3 h-3" />
                          <span>التبديل بين المجمعات</span>
                        </span>
                      </div>
                      <span className="text-[10px] opacity-80 block mt-0.5">
                        لوحة تحكم المشرف • إدارة الحلقات القرآنية
                      </span>
                    </div>
                  </div>

                  {/* Right Action Buttons inside Mockup Navbar */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl text-xs font-black shadow-md cursor-default pointer-events-none flex items-center gap-1.5"
                      style={{
                        backgroundColor: themeColors.accentColor,
                        color: themeColors.primaryColor
                      }}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>المجمعات</span>
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl text-xs font-black shadow-md cursor-default pointer-events-none flex items-center gap-1.5"
                      style={{
                        backgroundColor: themeColors.accentColor,
                        color: themeColors.primaryColor
                      }}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>الإعدادات</span>
                    </button>
                  </div>
                </div>

                {/* 2. Mockup Welcome Banner */}
                <div
                  className="p-4 sm:p-5 rounded-2xl border shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  style={{
                    background: `linear-gradient(to right, ${themeColors.secondaryColor}, ${themeColors.primaryColor}, ${themeColors.secondaryColor})`,
                    borderColor: lightenHex(themeColors.secondaryColor, 0.2)
                  }}
                >
                  <div>
                    <span
                      className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mb-1.5"
                      style={{
                        backgroundColor: `${themeColors.accentColor}25`,
                        borderColor: `${themeColors.accentColor}55`,
                        color: themeColors.accentColor
                      }}
                    >
                      لوحة المتابعة المشتركة
                    </span>
                    <h6 className="text-sm sm:text-base font-bold text-white">
                      مرحباً بك، <span style={{ color: themeColors.accentColor }}>المشرف العام</span>
                    </h6>
                    <p className="text-xs opacity-80 mt-0.5">
                      تسميع وحفظ اليوم في حلقات {themeComplexName || 'المجمع'}.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl text-xs font-black shadow-md cursor-default pointer-events-none flex items-center gap-1"
                      style={{
                        backgroundColor: themeColors.accentColor,
                        color: themeColors.primaryColor
                      }}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>تسجيل حضور اليوم</span>
                    </button>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold border shadow-sm cursor-default pointer-events-none flex items-center gap-1"
                      style={{
                        backgroundColor: themeColors.cardColor || `${themeColors.secondaryColor}`,
                        borderColor: `${themeColors.accentColor}66`,
                        color: themeColors.accentColor
                      }}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>تقييم التسميع</span>
                    </button>
                  </div>
                </div>

                {/* 3. Mockup Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    className="p-3.5 rounded-2xl border space-y-1 shadow-sm"
                    style={{
                      backgroundColor: themeColors.cardColor || themeColors.secondaryColor,
                      borderColor: lightenHex(themeColors.secondaryColor, 0.18)
                    }}
                  >
                    <span className="text-[11px] opacity-80 block">إجمالي طلاب المجمع</span>
                    <strong
                      className="text-xl font-black block font-mono"
                      style={{ color: themeColors.accentColor }}
                    >
                      {students.length || 24} طالباً
                    </strong>
                    <span className="text-[10px] opacity-70 block">سجلات نشطة ومحدثة</span>
                  </div>

                  <div
                    className="p-3.5 rounded-2xl border space-y-1 shadow-sm"
                    style={{
                      backgroundColor: themeColors.cardColor || themeColors.secondaryColor,
                      borderColor: lightenHex(themeColors.secondaryColor, 0.18)
                    }}
                  >
                    <span className="text-[11px] opacity-80 block">الحلقات النشطة</span>
                    <strong
                      className="text-xl font-black block font-mono"
                      style={{ color: themeColors.accentColor }}
                    >
                      {halaqahs.length || 3} حلقات
                    </strong>
                    <span className="text-[10px] opacity-70 block">توزيع منهجي معتمد</span>
                  </div>

                  <div
                    className="p-3.5 rounded-2xl border space-y-1 shadow-sm flex items-center justify-between"
                    style={{
                      backgroundColor: themeColors.cardColor || themeColors.secondaryColor,
                      borderColor: lightenHex(themeColors.secondaryColor, 0.18)
                    }}
                  >
                    <div>
                      <span className="text-[11px] opacity-80 block">ختم المجمع الرسمي</span>
                      <span className="text-xs font-bold block mt-1" style={{ color: themeColors.accentColor }}>
                        {themeStampUrl ? 'ختم رسمي مرفوع ✓' : 'ختم قياسي معتمد'}
                      </span>
                    </div>
                    <div
                      className="w-11 h-11 rounded-full border-2 flex items-center justify-center overflow-hidden shrink-0 shadow-inner"
                      style={{
                        backgroundColor: `${themeColors.primaryColor}80`,
                        borderColor: themeColors.accentColor
                      }}
                    >
                      {themeStampUrl ? (
                        <img src={themeStampUrl} alt="ختم" className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <Shield className="w-5 h-5" style={{ color: themeColors.accentColor }} />
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Contrast Confirmation Banner */}
                <div
                  className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                  style={{
                    backgroundColor: `${themeColors.primaryColor}cc`,
                    borderColor: `${themeColors.accentColor}55`,
                    color: themeColors.textColor || '#ffffff'
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" style={{ color: themeColors.accentColor }} />
                    <span>ضمان التباين: الأزرار والبطاقات والأشرطة متميزة تماماً عن الخلفية ومريحة للعين.</span>
                  </span>
                  <span className="font-bold text-[11px]" style={{ color: themeColors.accentColor }}>
                    من الألف إلى الياء ✓
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-[#065f46]">
              <p className="text-xs text-[#86efac]/80">
                بالضغط على حفظ، سيتم اعتماد الشعار والختم والألوان في كامل أقسام المنصة، والشهادات، وتبويب المتصفح.
              </p>
              <button
                type="button"
                onClick={handleSaveTheme}
                disabled={isSavingTheme}
                className="px-6 py-3 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.35)] transition-all cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: themeColors.accentColor,
                  color: themeColors.primaryColor
                }}
              >
                {isSavingTheme ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" style={{ color: themeColors.primaryColor }} />
                    <span>جاري حفظ الثيم...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" style={{ color: themeColors.primaryColor }} />
                    <span>حفظ ثيم وهوية المجمع</span>
                  </>
                )}
              </button>
            </div>
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
                  الحلقة الحالية: {settings.halaqahName || 'الحلقة القرآنية'}
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

                  {/* Complex Selection */}
                  {complexes && complexes.length > 0 && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-amber-300 mb-1">
                        المجمع القرآني التابعة له الحلقة:
                      </label>
                      {isDeveloper && complexes.length > 1 ? (
                        <select
                          value={editingHalaqah.complexId || complexes[0].id}
                          onChange={e => {
                            const targetC = complexes.find(c => c.id === e.target.value);
                            setEditingHalaqah({
                              ...editingHalaqah,
                              complexId: e.target.value || undefined,
                              complexName: targetC?.name || undefined
                            });
                          }}
                          className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-white text-xs focus:border-[#fbbf24] focus:outline-none cursor-pointer"
                        >
                          {complexes.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full bg-[#064e3b]/80 border border-[#065f46] rounded-xl px-3 py-2 text-amber-300 font-bold text-xs flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{complexes.find(c => c.id === editingHalaqah.complexId)?.name || complexes[0]?.name || complexName || 'المجمع القرآني الحالي'}</span>
                        </div>
                      )}
                    </div>
                  )}

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
                const halaqahTeachers = teachers.filter(
                  t => (t.halaqahIds && t.halaqahIds.includes(h.id)) ||
                       t.halaqahId === h.id ||
                       (h.teacherIds && h.teacherIds.includes(t.id)) ||
                       (h.primaryTeacherName && t.name.trim().toLowerCase() === h.primaryTeacherName.trim().toLowerCase())
                );
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
                            المعلم المسؤول: <strong className="text-white">{h.primaryTeacherName || 'المعلم المشرف'}</strong>
                          </p>
                          {h.description && (
                            <p className="text-[10px] text-slate-300 mt-0.5 line-clamp-1">
                              {h.description}
                            </p>
                          )}

                          {/* Teachers Badges for this halaqah */}
                          <div className="flex items-center gap-1 flex-wrap mt-2">
                            <span className="text-[10px] text-[#fbbf24] font-bold">المعلمون:</span>
                            {halaqahTeachers.length > 0 ? (
                              halaqahTeachers.map(t => (
                                <span
                                  key={t.id}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-[#064e3b] text-[#86efac] border border-[#065f46]"
                                >
                                  {t.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-amber-300/80 italic">
                                لم يُعيَّن معلمون بعد
                              </span>
                            )}
                          </div>
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#86efac]">
                        اسم المعلم الثلاثي <span className="text-red-400">* (إلزامي)</span>
                      </label>
                      {editingTeacher.name && editingTeacher.name.trim().length > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                          getThreePartNameValidation(editingTeacher.name, 'معلم').isValid
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {getThreePartNameValidation(editingTeacher.name, 'معلم').isValid ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>ثلاثي معتمد</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              <span>يلزم 3 مقاطع</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="مثال: أحمد عبد الرحمن البلوشي أو عبد الله بن فهد الدوسري"
                      value={editingTeacher.name || ''}
                      onChange={e => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                      className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-white text-xs focus:border-[#fbbf24] focus:outline-none"
                    />
                    <p className="text-[10px] text-[#86efac]/70 mt-1">
                      * يجب كتابة الاسم الثلاثي كاملاً (الاسم، واسم الأب، واسم العائلة).
                    </p>
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

                  {/* Role / Rank */}
                  <div>
                    <label className="block text-xs font-bold text-[#86efac] mb-1">
                      الرتبة والصلاحية السحابية
                    </label>
                    <select
                      value={editingTeacher.role || (editingTeacher.isPrimary ? 'supervisor' : 'teacher')}
                      disabled={
                        editingTeacher.id === 'teacher-1' ||
                        editingTeacher.role === 'developer'
                      }
                      onChange={e =>
                        setEditingTeacher({
                          ...editingTeacher,
                          role: e.target.value as 'supervisor' | 'teacher'
                        })
                      }
                      className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-[#fbbf24] font-bold text-xs focus:border-[#fbbf24] focus:outline-none disabled:opacity-60"
                    >
                      <option value="teacher">معلم عادي (مخصص لحلقاته فقط)</option>
                      <option value="supervisor">معلم مشرف (مشرف على مجمعه القرآني فقط)</option>
                    </select>
                  </div>

                  {/* Complex Selection for Teacher */}
                  {complexes && complexes.length > 0 && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-amber-300 mb-1">
                        المجمع القرآني التابع له المعلم:
                      </label>
                      {isDeveloper && complexes.length > 1 ? (
                        <select
                          value={editingTeacher.complexId || complexes[0]?.id}
                          onChange={e => {
                            const targetC = complexes.find(c => c.id === e.target.value);
                            setEditingTeacher({
                              ...editingTeacher,
                              complexId: e.target.value,
                              complexName: targetC?.name
                            });
                          }}
                          className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-white text-xs focus:border-[#fbbf24] focus:outline-none cursor-pointer"
                        >
                          {complexes.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full bg-[#064e3b]/80 border border-[#065f46] rounded-xl px-3 py-2 text-amber-300 font-bold text-xs flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{complexes.find(c => c.id === editingTeacher.complexId)?.name || complexes[0]?.name || complexName || 'المجمع القرآني'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Multi-Halaqah Assignment */}
                  <div className="sm:col-span-2 space-y-2.5 bg-[#064e3b]/50 p-4 rounded-2xl border border-[#065f46]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="block text-xs font-bold text-[#fbbf24]">
                          الحلقات المسندة لهذا المعلم (يمكن تعيينه في أكثر من حلقة)
                        </label>
                        <p className="text-[11px] text-[#86efac]/90">
                          المعلم المعين في أكثر من حلقة سيتمكن من التبديل بينها في شريط التصفح، وكل حلقة ستعرض طلابها فقط. وإذا لم يُعين في أي حلقة سيظهر له: «لم يتم تعيينك في حلقة بعد».
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTeacher({
                              ...editingTeacher,
                              halaqahIds: halaqahs.map(h => h.id),
                              halaqahNames: halaqahs.map(h => h.name)
                            });
                          }}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-[#022c22] text-[#86efac] hover:text-white border border-[#065f46] cursor-pointer transition-colors"
                        >
                          تحديد الكل
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTeacher({
                              ...editingTeacher,
                              halaqahIds: [],
                              halaqahNames: []
                            });
                          }}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-950/50 text-amber-300 hover:text-white border border-amber-600/50 cursor-pointer transition-colors"
                        >
                          إلغاء التعيين (غير مسند)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {halaqahs.map(h => {
                        const isChecked = editingTeacher.halaqahIds?.includes(h.id) ?? false;
                        const count = students.filter(s => s.halaqahId === h.id).length;
                        return (
                          <label
                            key={h.id}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-[#fbbf24]/15 border-[#fbbf24] text-white shadow-sm'
                                : 'bg-[#022c22]/80 border-[#065f46] text-[#86efac] hover:border-emerald-500/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const current = editingTeacher.halaqahIds || [];
                                  const nextIds = isChecked
                                    ? current.filter(id => id !== h.id)
                                    : [...current, h.id];
                                  const nextNames = halaqahs
                                    .filter(item => nextIds.includes(item.id))
                                    .map(item => item.name);
                                  setEditingTeacher({
                                    ...editingTeacher,
                                    halaqahIds: nextIds,
                                    halaqahNames: nextNames
                                  });
                                }}
                                className="w-4 h-4 rounded text-[#fbbf24] focus:ring-[#fbbf24] bg-[#022c22] border-[#065f46] cursor-pointer"
                              />
                              <div className="text-right">
                                <span className="text-xs font-bold block">{h.name}</span>
                                <span className="text-[10px] text-slate-300">
                                  المشرف: {h.primaryTeacherName || 'المعلم المشرف'}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#022c22] text-[#fbbf24] border border-[#065f46] font-mono">
                              {count} طلاب
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {(!editingTeacher.halaqahIds || editingTeacher.halaqahIds.length === 0) && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>
                          تنبيه: هذا المعلم غير مسند لأي حلقة حالياً. عند تسجيل دخوله ستظهر له رسالة: <strong>«لم يتم تعيينك في حلقة بعد»</strong>.
                        </span>
                      </div>
                    )}
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
                const assignedHalaqahIds = t.halaqahIds && t.halaqahIds.length > 0
                  ? t.halaqahIds
                  : (t.halaqahId ? [t.halaqahId] : []);
                const assignedHalaqahs = halaqahs.filter(h => assignedHalaqahIds.includes(h.id));
                return (
                  <div
                    key={t.id}
                    className="bg-[#022c22]/90 border border-[#065f46] hover:border-[#fbbf24]/40 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-[#fbbf24] flex items-center justify-center font-bold border border-emerald-500/30 shrink-0">
                        {t.name.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{t.name}</h4>
                          {isTeacherSupervisor(t) ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30 font-bold">
                              {t.role === 'developer' || t.id === 'teacher-1'
                                ? 'مشرف المنصة'
                                : 'مشرف المجمع'}
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#86efac] border border-emerald-500/30 font-bold">
                              معلم عادي
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#064e3b] text-slate-300 border border-[#065f46]">
                            {t.title || (isTeacherSupervisor(t) ? 'معلم مشرف' : 'معلم ومحفظ')}
                          </span>
                        </div>

                        {/* Assigned Halaqahs Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {assignedHalaqahs.length > 0 ? (
                            assignedHalaqahs.map(h => (
                              <span
                                key={h.id}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-[#064e3b] text-[#86efac] border border-[#065f46] flex items-center gap-1"
                              >
                                <Layers className="w-2.5 h-2.5 text-[#fbbf24]" />
                                <span>{h.name}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5" />
                              <span>لم يتم تعيينه في حلقة بعد</span>
                            </span>
                          )}
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
        {/* SUB-TAB 3: TRANSFER STUDENTS (SINGLE OR MULTIPLE / BULK) */}
        {/* ========================================================================= */}
        {activeSubTab === 'transfer' && (
          <div className="space-y-6 flex-1">
            <div className="bg-[#022c22]/70 p-4 rounded-2xl border border-[#065f46]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-[#fbbf24]" />
                    <span>نقل الطلاب بين الحلقات مع كامل السجلات سحابياً</span>
                  </h3>
                  <p className="text-[11px] text-[#86efac] mt-1 leading-relaxed">
                    يتم نقل الطلاب مع سجلاتهم بالكامل (الحفظ، التقييمات، الحضور، السلوك) وتحديثها فورياً في السحابة تحت إشراف معلّمي الحلقة الجديدة.
                  </p>
                </div>

                {/* Mode Selector */}
                <div className="flex items-center gap-1.5 bg-[#064e3b] p-1 rounded-xl border border-[#065f46] shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setTransferMode('batch')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      transferMode === 'batch'
                        ? 'bg-[#fbbf24] text-[#064e3b] shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>نقل متعدد (مجموعة)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferMode('single')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      transferMode === 'single'
                        ? 'bg-[#fbbf24] text-[#064e3b] shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>طالب فردي</span>
                  </button>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleTransferStudentSubmit}
              className="bg-[#022c22] border border-[#065f46] rounded-2xl p-5 space-y-4 shadow-xl"
            >
              {/* TARGET HALAQAH SELECTION (ALWAYS REQUIRED) */}
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
                      {h.name} (المعلمون: {h.teacherNames?.join('، ') || h.primaryTeacherName || 'غير محدد'})
                    </option>
                  ))}
                </select>
              </div>

              {/* BATCH MODE: MULTI-SELECT CHECKLIST */}
              {transferMode === 'batch' && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#065f46] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">تحديد الطلاب المراد نقلهم:</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#064e3b] text-[#fbbf24] text-[11px] font-bold">
                        {selectedTransferStudentIds.length} محدد
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Filter by source halaqah */}
                      <select
                        value={transferFilterSourceHalaqahId}
                        onChange={e => setTransferFilterSourceHalaqahId(e.target.value)}
                        className="bg-[#064e3b] border border-[#065f46] text-xs text-white rounded-lg px-2 py-1 focus:outline-none"
                      >
                        <option value="all">كل الحلقات</option>
                        {halaqahs.map(h => (
                          <option key={h.id} value={h.id}>من: {h.name}</option>
                        ))}
                      </select>

                      {/* Select/Deselect All */}
                      <button
                        type="button"
                        onClick={() => {
                          const eligible = students.filter(s =>
                            (transferFilterSourceHalaqahId === 'all' || s.halaqahId === transferFilterSourceHalaqahId) &&
                            s.halaqahId !== transferTargetHalaqahId
                          );
                          const allIds = eligible.map(s => s.id);
                          const areAllSelected = allIds.every(id => selectedTransferStudentIds.includes(id));
                          if (areAllSelected) {
                            setSelectedTransferStudentIds(prev => prev.filter(id => !allIds.includes(id)));
                          } else {
                            setSelectedTransferStudentIds(prev => Array.from(new Set([...prev, ...allIds])));
                          }
                        }}
                        className="text-[11px] font-bold text-[#fbbf24] hover:underline cursor-pointer"
                      >
                        تحديد/إلغاء الكل
                      </button>
                    </div>
                  </div>

                  {/* Students Grid Checklist */}
                  <div className="max-h-60 overflow-y-auto space-y-1.5 p-1 bg-[#064e3b]/30 rounded-xl border border-[#065f46]">
                    {(() => {
                      const filtered = students.filter(s =>
                        transferFilterSourceHalaqahId === 'all' || s.halaqahId === transferFilterSourceHalaqahId
                      );

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-6 text-xs text-slate-400">
                            لا يوجد طلاب مطابقين للفلتر المختار.
                          </div>
                        );
                      }

                      return filtered.map(st => {
                        const isSelected = selectedTransferStudentIds.includes(st.id);
                        const isAlreadyInTarget = transferTargetHalaqahId && st.halaqahId === transferTargetHalaqahId;
                        const currentHName = st.halaqahName || halaqahs.find(h => h.id === st.halaqahId)?.name || 'غير محدد';

                        return (
                          <div
                            key={st.id}
                            onClick={() => {
                              if (isAlreadyInTarget) return;
                              setSelectedTransferStudentIds(prev =>
                                prev.includes(st.id) ? prev.filter(id => id !== st.id) : [...prev, st.id]
                              );
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isAlreadyInTarget
                                ? 'opacity-40 bg-slate-900/30 border-slate-700 cursor-not-allowed'
                                : isSelected
                                ? 'bg-[#064e3b] border-[#fbbf24] shadow-sm'
                                : 'bg-[#022c22]/60 border-[#065f46] hover:bg-[#064e3b]/50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#fbbf24] shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span>{st.name}</span>
                                  {isAlreadyInTarget && (
                                    <span className="text-[10px] text-amber-300 font-normal">(في الحلقة المستهدفة)</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-[#86efac]">
                                  حفظ: سورة {st.currentSurahName} (آية {st.currentAyah})
                                </div>
                              </div>
                            </div>

                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#022c22] text-slate-300 border border-[#065f46]">
                              {currentHName}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* SINGLE MODE */}
              {transferMode === 'single' && (
                <div>
                  <label className="block text-xs font-bold text-[#86efac] mb-1">
                    اختر الطالب المراد نقله <span className="text-red-400">*</span>
                  </label>
                  <select
                    required={transferMode === 'single'}
                    value={transferStudentId}
                    onChange={e => setTransferStudentId(e.target.value)}
                    className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2.5 text-white text-xs focus:border-[#fbbf24] focus:outline-none cursor-pointer"
                  >
                    <option value="">-- اختر الطالب --</option>
                    {students.map(s => {
                      const currentH = s.halaqahName || (s.halaqahId ? halaqahs.find(h => h.id === s.halaqahId)?.name : 'حلقة عامة');
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} (حالياً في: {currentH})
                        </option>
                      );
                    })}
                  </select>

                  {/* Summary of Selected Student Details if chosen */}
                  {transferStudentId && (
                    (() => {
                      const sel = students.find(s => s.id === transferStudentId);
                      if (!sel) return null;
                      return (
                        <div className="mt-3 bg-[#064e3b]/50 border border-[#065f46] rounded-xl p-3.5 text-xs text-[#86efac] space-y-1">
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
                </div>
              )}

              <div className="flex items-center justify-end pt-3 border-t border-[#065f46]">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !transferTargetHalaqahId ||
                    (transferMode === 'batch' ? selectedTransferStudentIds.length === 0 : !transferStudentId)
                  }
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#fbbf24] text-[#064e3b] hover:bg-[#f59e0b] shadow-lg cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'جارٍ النقل سحابياً...'
                      : transferMode === 'batch'
                      ? `نقل الطلاب المحددين (${selectedTransferStudentIds.length}) سحابياً`
                      : 'نقل الطالب وحفظ سجله بالكامل'}
                  </span>
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
