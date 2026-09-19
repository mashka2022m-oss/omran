import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Shield,
  ShieldCheck,
  Key,
  Copy,
  Check,
  Plus,
  Edit2,
  Trash2,
  Search,
  ExternalLink,
  Phone,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { TeacherAccount, Student, Halaqah, getThreePartNameValidation } from '../../types';
import { GoogleWorkspaceService } from '../../lib/googleWorkspace';

interface AccountsTabProps {
  teachers: TeacherAccount[];
  students: Student[];
  halaqahs: Halaqah[];
  onSaveTeacher: (teacher: TeacherAccount) => Promise<void>;
  onDeleteTeacher: (teacherId: string) => Promise<void>;
  onUpdateStudent: (student: Student) => Promise<void>;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  teachers,
  students,
  halaqahs,
  onSaveTeacher,
  onDeleteTeacher,
  onUpdateStudent
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'teachers' | 'students'>('teachers');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Teacher modal / edit state
  const [isEditingTeacher, setIsEditingTeacher] = useState(false);
  const [editingTeacherData, setEditingTeacherData] = useState<Partial<TeacherAccount> | null>(null);
  const [isNewTeacher, setIsNewTeacher] = useState(false);
  const [selectedHalaqahIds, setSelectedHalaqahIds] = useState<string[]>([]);
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherAccount | null>(null);

  // Student password edit modal state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkingTeacherId, setLinkingTeacherId] = useState<string | null>(null);
  const [unlinkingStudentId, setUnlinkingStudentId] = useState<string | null>(null);

  // Lock background scrolling when any modal is open
  useEffect(() => {
    const isAnyModalOpen = isEditingTeacher || editingStudent !== null || teacherToDelete !== null;
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isEditingTeacher, editingStudent, teacherToDelete]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getOrigin = () => {
    return window.location.origin + window.location.pathname;
  };

  // -------------------------------------------------------------
  // TEACHER HANDLERS
  // -------------------------------------------------------------
  const handleOpenAddTeacher = () => {
    setIsNewTeacher(true);
    setEditingTeacherData({
      id: `teacher-${Date.now()}`,
      name: '',
      username: '',
      password: '123',
      phone: '',
      title: 'معلم حلقة ومحفظ',
      role: 'teacher',
      isPrimary: false,
      halaqahIds: halaqahs.length > 0 ? [halaqahs[0].id] : [],
      createdAt: new Date().toISOString()
    });
    setSelectedHalaqahIds(halaqahs.length > 0 ? [halaqahs[0].id] : []);
    setIsEditingTeacher(true);
    setStatusMsg(null);
  };

  const handleOpenEditTeacher = (t: TeacherAccount) => {
    setIsNewTeacher(false);
    setEditingTeacherData({ ...t });
    const hIds = t.halaqahIds || (t.halaqahId ? [t.halaqahId] : []);
    setSelectedHalaqahIds(hIds);
    setIsEditingTeacher(true);
    setStatusMsg(null);
  };

  const handleToggleHalaqah = (hId: string) => {
    setSelectedHalaqahIds(prev =>
      prev.includes(hId) ? prev.filter(id => id !== hId) : [...prev, hId]
    );
  };

  const handleSaveTeacherForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacherData || !editingTeacherData.name?.trim() || !editingTeacherData.username?.trim()) {
      setStatusMsg({ type: 'error', text: 'يرجى إدخال اسم المعلم واسم المستخدم للدخول.' });
      return;
    }

    const isSuper = editingTeacherData.role === 'supervisor';
    const nameVal = getThreePartNameValidation(editingTeacherData.name, isSuper ? 'مشرف' : 'معلم');
    if (!nameVal.isValid) {
      setStatusMsg({ type: 'error', text: nameVal.message || 'الاسم الثلاثي إلزامي.' });
      return;
    }

    // Check duplicate username if adding new
    if (isNewTeacher) {
      const exists = teachers.some(
        t => t.username.trim().toLowerCase() === editingTeacherData.username?.trim().toLowerCase()
      );
      if (exists) {
        setStatusMsg({ type: 'error', text: 'اسم المستخدم مسجل لمعلم آخر بالفعل. يرجى اختيار اسم مستخدم مختلف.' });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const isSuper = editingTeacherData.role === 'supervisor';
      const resolvedHalaqahNames = halaqahs
        .filter(h => selectedHalaqahIds.includes(h.id))
        .map(h => h.name);

      const fullTeacher: TeacherAccount = {
        id: editingTeacherData.id || `teacher-${Date.now()}`,
        name: editingTeacherData.name.trim(),
        username: editingTeacherData.username.trim(),
        password: editingTeacherData.password?.trim() || '123',
        phone: editingTeacherData.phone?.trim() || '0500000000',
        title: editingTeacherData.title?.trim() || (isSuper ? 'المشرف العام' : 'معلم حلقة'),
        role: editingTeacherData.role || 'teacher',
        isPrimary: isSuper,
        halaqahId: selectedHalaqahIds[0] || '',
        halaqahName: resolvedHalaqahNames[0] || '',
        halaqahIds: selectedHalaqahIds,
        halaqahNames: resolvedHalaqahNames,
        googleEmail: editingTeacherData.googleEmail,
        googleUid: editingTeacherData.googleUid,
        googleName: editingTeacherData.googleName,
        googlePhotoUrl: editingTeacherData.googlePhotoUrl,
        isGoogleLinked: editingTeacherData.isGoogleLinked ?? false,
        createdAt: editingTeacherData.createdAt || new Date().toISOString()
      };

      await onSaveTeacher(fullTeacher);
      setStatusMsg({
        type: 'success',
        text: `تم حفظ بيانات حساب ${fullTeacher.name} بنجاح ومزامنته سحابياً!`
      });
      setIsEditingTeacher(false);
      setEditingTeacherData(null);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'حدث خطأ أثناء حفظ حساب المعلم.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkTeacherGoogle = async (teacher: TeacherAccount) => {
    setLinkingTeacherId(teacher.id);
    try {
      const updated = await GoogleWorkspaceService.linkTeacherGoogleAccount(teacher);
      await onSaveTeacher(updated);
      if (editingTeacherData && editingTeacherData.id === teacher.id) {
        setEditingTeacherData(updated);
      }
      setStatusMsg({
        type: 'success',
        text: `تم ربط حساب Google (${updated.googleEmail}) بالمعلم ${teacher.name} بنجاح!`
      });
    } catch (err: any) {
      console.warn('Link teacher Google error:', err);
      setStatusMsg({
        type: 'error',
        text: err?.message || 'تعذر ربط حساب Google بالمعلم. يرجى المحاولة مرة أخرى.'
      });
    } finally {
      setLinkingTeacherId(null);
    }
  };

  const handleUnlinkTeacherGoogle = async (teacher: TeacherAccount) => {
    setLinkingTeacherId(teacher.id);
    try {
      const updated = await GoogleWorkspaceService.unlinkTeacherGoogleAccount(teacher);
      await onSaveTeacher(updated);
      if (editingTeacherData && editingTeacherData.id === teacher.id) {
        setEditingTeacherData(updated);
      }
      setStatusMsg({
        type: 'success',
        text: `تم فصل حساب Google عن المعلم ${teacher.name} بنجاح!`
      });
    } catch (err: any) {
      console.warn('Unlink teacher Google error:', err);
      setStatusMsg({
        type: 'error',
        text: err?.message || 'تعذر فصل حساب Google.'
      });
    } finally {
      setLinkingTeacherId(null);
    }
  };

  const handleToggleSupervisorRole = async (teacher: TeacherAccount) => {
    try {
      const newRole = teacher.role === 'supervisor' || teacher.isPrimary ? 'teacher' : 'supervisor';
      const isSuper = newRole === 'supervisor';
      const updated: TeacherAccount = {
        ...teacher,
        role: newRole,
        isPrimary: isSuper,
        title: isSuper ? 'معلم مشرف' : 'معلم حلقة'
      };
      await onSaveTeacher(updated);
      setStatusMsg({
        type: 'success',
        text: `تم تغيير صلاحية (${teacher.name}) إلى: ${isSuper ? 'معلم مشرف (صلاحيات كاملة)' : 'معلم حلقة'}`
      });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'فشل تغيير الصلاحية: ' + e?.message });
    }
  };

  const handleConfirmDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    try {
      setIsSubmitting(true);
      await onDeleteTeacher(teacherToDelete.id);
      setStatusMsg({
        type: 'success',
        text: `تم حذف حساب المعلم (${teacherToDelete.name}) بنجاح.`
      });
      setTeacherToDelete(null);
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'فشل حذف الحساب: ' + e?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // STUDENT HANDLERS
  // -------------------------------------------------------------
  const handleOpenEditStudent = (s: Student) => {
    setEditingStudent(s);
    setNewStudentPassword(s.password || '123');
    setNewStudentPhone(s.phone || '');
    setStatusMsg(null);
  };

  const handleSaveStudentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      setIsSubmitting(true);
      const updated: Student = {
        ...editingStudent,
        password: newStudentPassword.trim() || '123',
        phone: newStudentPhone.trim() || editingStudent.phone
      };
      await onUpdateStudent(updated);
      setStatusMsg({
        type: 'success',
        text: `تم تحديث بيانات دخول الطالب (${updated.name}) بنجاح!`
      });
      setEditingStudent(null);
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'فشل تحديث بيانات الطالب: ' + e?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlinkStudentGoogle = async (student: Student) => {
    try {
      setUnlinkingStudentId(student.id);
      const updated = await GoogleWorkspaceService.unlinkStudentGoogleAccount(student);
      await onUpdateStudent(updated);
      if (editingStudent && editingStudent.id === student.id) {
        setEditingStudent(updated);
      }
      setStatusMsg({
        type: 'success',
        text: `تم فصل حساب Google (${student.googleEmail || ''}) عن الطالب (${student.name}) بنجاح!`
      });
    } catch (e: any) {
      console.error('Unlink student Google error:', e);
      setStatusMsg({ type: 'error', text: 'فشل فصل حساب Google: ' + (e?.message || String(e)) });
    } finally {
      setUnlinkingStudentId(null);
    }
  };

  // Filtered lists
  const filteredTeachers = teachers.filter(
    t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery)
  );

  const filteredStudents = students.filter(
    s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#064e3b] border border-[#fbbf24]/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#fbbf24] text-[#064e3b] flex items-center justify-center font-black shadow-lg shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black font-heading text-[#fbbf24] flex items-center gap-2">
                إدارة الحسابات والصلاحيات السحابية
              </h2>
              <p className="text-xs text-[#86efac] mt-0.5">
                ميزة المشرف العام: إدارة حسابات المعلمين والطلاب وتحديد أدوار المشرفين ونسخ روابط الدخول المباشرة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddTeacher}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] text-xs font-black shadow-lg cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة معلم / مشرف جديد</span>
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`mt-4 p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-fadeIn ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-[#86efac]'
                : 'bg-red-950/80 border-red-500/50 text-red-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* Sub-tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#022c22]/80 border border-[#065f46] p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('teachers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'teachers'
                ? 'bg-[#fbbf24] text-[#064e3b] font-black shadow-md'
                : 'text-[#86efac] hover:bg-[#064e3b]/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>حسابات المعلمين والمشرفين ({teachers.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'students'
                ? 'bg-[#fbbf24] text-[#064e3b] font-black shadow-md'
                : 'text-[#86efac] hover:bg-[#064e3b]/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>حسابات وبوابات الطلاب ({students.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#86efac] absolute right-3.5 top-3" />
          <input
            type="text"
            placeholder="بحث بالاسم أو المعرف أو الهاتف..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-[#064e3b]/60 border border-[#065f46] rounded-xl text-xs text-white placeholder-[#86efac]/50 focus:border-[#fbbf24] focus:outline-none"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. TEACHERS & SUPERVISORS TABLE                               */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'teachers' && (
        <div className="overflow-x-auto rounded-3xl border border-[#065f46] bg-[#022c22]/90 shadow-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#064e3b] text-emerald-100 border-b border-[#065f46] font-bold">
              <tr>
                <th className="p-4">اسم المعلم / الحساب</th>
                <th className="p-4">اسم المستخدم</th>
                <th className="p-4">كلمة المرور</th>
                <th className="p-4">رقم الهاتف</th>
                <th className="p-4">الدور والصلاحية</th>
                <th className="p-4">الحلقات المخصصة</th>
                <th className="p-4 text-center">حساب Google والتسجيل السريع</th>
                <th className="p-4 text-center">رابط الدخول السريع</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/40 text-emerald-100">
              {filteredTeachers.map(teacher => {
                const isSuper =
                  teacher.role === 'supervisor' ||
                  teacher.role === 'developer' ||
                  teacher.isPrimary ||
                  teacher.username.trim().toLowerCase() === 'admin';

                const teacherLoginUrl = `${getOrigin()}?u=${encodeURIComponent(teacher.username)}`;

                const assignedHNames =
                  teacher.halaqahNames && teacher.halaqahNames.length > 0
                    ? teacher.halaqahNames
                    : teacher.halaqahIds && teacher.halaqahIds.length > 0
                    ? halaqahs.filter(h => teacher.halaqahIds?.includes(h.id)).map(h => h.name)
                    : teacher.halaqahName
                    ? [teacher.halaqahName]
                    : ['جميع الحلقات'];

                return (
                  <tr key={teacher.id} className="hover:bg-emerald-900/20 transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-700/50 text-[#fbbf24] flex items-center justify-center font-black shrink-0">
                          {teacher.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{teacher.name}</span>
                            {isSuper && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-[#fbbf24] border border-amber-500/30 font-bold">
                                مشرف عام
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#86efac]/80">{teacher.title || 'محفظ ومربي'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono font-bold text-emerald-200">{teacher.username}</td>

                    <td className="p-4">
                      <span className="px-2 py-1 rounded-lg bg-[#064e3b] font-mono text-[#fbbf24] border border-[#065f46]">
                        {teacher.password || '123'}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-emerald-200">{teacher.phone || '-'}</td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleSupervisorRole(teacher)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                          isSuper
                            ? 'bg-amber-500/20 text-[#fbbf24] border-amber-500/40 hover:bg-amber-500/30'
                            : 'bg-emerald-800/40 text-emerald-300 border-emerald-600/40 hover:bg-emerald-800/60'
                        }`}
                        title="اضغط لتبديل الدور بين معلم ومشرف"
                      >
                        <Shield className="w-3 h-3" />
                        <span>{isSuper ? 'معلم مشرف' : 'معلم حلقة'}</span>
                      </button>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {isSuper ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-700/40 font-bold">
                            كامل الحلقات (مشرف)
                          </span>
                        ) : assignedHNames.length > 0 ? (
                          assignedHNames.map((name, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded bg-[#064e3b] text-[#86efac] border border-[#065f46]"
                            >
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-red-300">غير محدد</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      {teacher.isGoogleLinked ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-900/70 text-emerald-200 border border-emerald-500/50 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[130px] font-mono">{teacher.googleEmail}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUnlinkTeacherGoogle(teacher)}
                            disabled={linkingTeacherId === teacher.id}
                            className="text-[10px] text-red-400 hover:text-red-300 underline cursor-pointer disabled:opacity-50"
                          >
                            {linkingTeacherId === teacher.id ? 'جاري الفصل...' : 'فصل حساب Google'}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleLinkTeacherGoogle(teacher)}
                          disabled={linkingTeacherId === teacher.id}
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-300 shadow-sm inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                          title="ربط حساب Google لهذا المعلم لتسجيل الدخول السريع"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          <span>{linkingTeacherId === teacher.id ? 'جاري الربط...' : 'ربط Google'}</span>
                        </button>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => copyToClipboard(teacherLoginUrl, teacher.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#064e3b] hover:bg-emerald-700 text-[#86efac] hover:text-white border border-[#065f46] text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                        title="نسخ رابط الدخول المباشر لهذا المعلم"
                      >
                        {copiedId === teacher.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ الرابط</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditTeacher(teacher)}
                          className="p-1.5 rounded-lg bg-emerald-800/60 hover:bg-emerald-700 text-[#86efac] hover:text-white transition-all cursor-pointer"
                          title="تعديل بيانات الحساب"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setTeacherToDelete(teacher)}
                          className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-800 text-red-300 hover:text-white transition-all cursor-pointer"
                          title="حذف الحساب"
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
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. STUDENTS ACCOUNTS TABLE                                     */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'students' && (
        <div className="overflow-x-auto rounded-3xl border border-[#065f46] bg-[#022c22]/90 shadow-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#064e3b] text-emerald-100 border-b border-[#065f46] font-bold">
              <tr>
                <th className="p-4">اسم الطالب</th>
                <th className="p-4">معرّف الطالب (ID)</th>
                <th className="p-4">رمز / كلمة المرور</th>
                <th className="p-4">الحلقة</th>
                <th className="p-4">هاتف التواصل</th>
                <th className="p-4">حساب Google</th>
                <th className="p-4 text-center">رابط البوابة المباشر</th>
                <th className="p-4 text-center">تعديل الدخول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/40 text-emerald-100">
              {filteredStudents.map(student => {
                const portalUrl = `${getOrigin()}?portal=${encodeURIComponent(student.id)}`;
                const halaqahObj = halaqahs.find(h => h.id === student.halaqahId);
                const halaqahName = halaqahObj ? halaqahObj.name : student.halaqahName || 'غير مسند';

                return (
                  <tr key={student.id} className="hover:bg-emerald-900/20 transition-all">
                    <td className="p-4">
                      <div className="font-bold text-white">{student.name}</div>
                      <div className="text-[10px] text-[#86efac]/70">المستوى: {student.level}</div>
                    </td>

                    <td className="p-4 font-mono text-emerald-200">{student.id}</td>

                    <td className="p-4">
                      <span className="px-2 py-1 rounded-lg bg-[#064e3b] font-mono text-[#fbbf24] border border-[#065f46]">
                        {student.password || '123'}
                      </span>
                    </td>

                    <td className="p-4 text-emerald-200">{halaqahName}</td>

                    <td className="p-4 font-mono text-emerald-200">{student.phone}</td>

                    <td className="p-4">
                      {student.isGoogleLinked ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold" title={student.googleEmail || ''}>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[110px]">{student.googleEmail || 'مرتبط'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUnlinkStudentGoogle(student)}
                            disabled={unlinkingStudentId === student.id}
                            className="px-2 py-0.5 rounded-lg bg-red-950/70 hover:bg-red-800 text-red-300 hover:text-white border border-red-500/40 text-[10px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            title="فصل حساب Google عن هذا الطالب"
                          >
                            <Trash2 className="w-2.5 h-2.5 shrink-0" />
                            <span>{unlinkingStudentId === student.id ? 'جاري الفصل...' : 'فصل الحساب'}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-300/60">غير مرتبط</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => copyToClipboard(portalUrl, student.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#064e3b] hover:bg-emerald-700 text-[#86efac] hover:text-white border border-[#065f46] text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                        title="نسخ رابط الدخول المباشر لبوابة الطالب"
                      >
                        {copiedId === student.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ رابط البوابة</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleOpenEditStudent(student)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer"
                        title="تعديل كلمة مرور ورقم هاتف الطالب"
                      >
                        تعديل
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT TEACHER OR SUPERVISOR                       */}
      {/* ------------------------------------------------------------- */}
      {isEditingTeacher && editingTeacherData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain" dir="rtl">
          <div className="relative my-auto bg-[#022c22] border border-[#fbbf24]/50 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#065f46] shrink-0">
              <div className="flex items-center gap-2 text-base font-bold text-[#fbbf24] font-heading">
                <Users className="w-5 h-5" />
                <span>{isNewTeacher ? 'إضافة حساب معلم أو مشرف جديد' : 'تعديل بيانات الحساب والصلاحيات'}</span>
              </div>
              <button
                onClick={() => {
                  setIsEditingTeacher(false);
                  setEditingTeacherData(null);
                }}
                className="text-emerald-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeacherForm} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-emerald-200 font-bold">اسم المعلم / المشرف الثلاثي * (إلزامي):</label>
                  {editingTeacherData.name && editingTeacherData.name.trim().length > 0 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                      getThreePartNameValidation(editingTeacherData.name, editingTeacherData.role === 'supervisor' ? 'مشرف' : 'معلم').isValid
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {getThreePartNameValidation(editingTeacherData.name, editingTeacherData.role === 'supervisor' ? 'مشرف' : 'معلم').isValid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
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
                  placeholder="مثال: الشيخ عبد الله بن محمد الدوسري"
                  value={editingTeacherData.name || ''}
                  onChange={e => setEditingTeacherData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#064e3b]/70 border border-[#065f46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#fbbf24]"
                />
                <p className="text-[10px] text-[#86efac]/70 mt-1">
                  * يشترط تسجيل الاسم الثلاثي كاملاً (الاسم، اسم الأب، واسم العائلة).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-200 font-bold mb-1">اسم المستخدم (للدخول):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: abdullah"
                    value={editingTeacherData.username || ''}
                    onChange={e => setEditingTeacherData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full bg-[#064e3b]/70 border border-[#065f46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#fbbf24]"
                  />
                </div>

                <div>
                  <label className="block text-emerald-200 font-bold mb-1">كلمة المرور:</label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    value={editingTeacherData.password || ''}
                    onChange={e => setEditingTeacherData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-[#064e3b]/70 border border-[#065f46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#fbbf24]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-200 font-bold mb-1">رقم الهاتف (الواتساب):</label>
                  <input
                    type="text"
                    placeholder="0500000000"
                    value={editingTeacherData.phone || ''}
                    onChange={e => setEditingTeacherData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-[#064e3b]/70 border border-[#065f46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#fbbf24]"
                  />
                </div>

                <div>
                  <label className="block text-emerald-200 font-bold mb-1">نوع الدور والصلاحية:</label>
                  <select
                    value={editingTeacherData.role || 'teacher'}
                    onChange={e =>
                      setEditingTeacherData(prev => ({
                        ...prev,
                        role: e.target.value as 'supervisor' | 'teacher',
                        isPrimary: e.target.value === 'supervisor'
                      }))
                    }
                    className="w-full bg-[#064e3b]/70 border border-[#065f46] rounded-xl px-3 py-2 text-[#fbbf24] font-bold outline-none focus:border-[#fbbf24]"
                  >
                    <option value="teacher">معلم حلقة (مخصص لحلقاته فقط)</option>
                    <option value="supervisor">معلم مشرف (صلاحيات كاملة لكل الحلقات والإعدادات)</option>
                  </select>
                </div>
              </div>

              {/* Halaqahs assignment */}
              {editingTeacherData.role !== 'supervisor' && (
                <div className="space-y-2 pt-1">
                  <label className="block text-emerald-200 font-bold">الحلقات المسندة لهذا المعلم:</label>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-[#064e3b]/40 rounded-xl border border-[#065f46]">
                    {halaqahs.map(h => {
                      const isChecked = selectedHalaqahIds.includes(h.id);
                      return (
                        <label
                          key={h.id}
                          onClick={() => handleToggleHalaqah(h.id)}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-emerald-800/40 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded accent-amber-400"
                          />
                          <span className="text-white text-xs">{h.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Google Account Linking in Modal */}
              <div className="bg-[#022c22]/70 border border-[#065f46] rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="text-xs font-bold text-emerald-100">ربط حساب Google للدخول السريع:</span>
                  </div>
                  {editingTeacherData.isGoogleLinked ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                      مرتبط
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400/60 font-medium">غير متصل</span>
                  )}
                </div>

                {editingTeacherData.isGoogleLinked ? (
                  <div className="flex items-center justify-between text-xs bg-[#064e3b]/50 p-2.5 rounded-xl border border-[#065f46]">
                    <span className="text-emerald-200 font-mono text-[11px] truncate max-w-[200px]">
                      {editingTeacherData.googleEmail}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeacherData(prev => ({
                          ...prev,
                          isGoogleLinked: false,
                          googleEmail: undefined,
                          googleUid: undefined,
                          googleName: undefined,
                          googlePhotoUrl: undefined
                        }));
                      }}
                      className="text-[11px] text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                    >
                      فصل حساب Google
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-emerald-300/80">
                      يمكن لهذا المعلم تسجيل الدخول فوراً بضغطة زر عبر حسابه في Google.
                    </span>
                    {!isNewTeacher && (
                      <button
                        type="button"
                        onClick={() => handleLinkTeacherGoogle(editingTeacherData as TeacherAccount)}
                        disabled={linkingTeacherId === editingTeacherData.id}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300 shadow-sm inline-flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {linkingTeacherId === editingTeacherData.id ? 'جاري الربط...' : 'ربط الآن'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#065f46]">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black cursor-pointer shadow-lg transition-all"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الحساب سحابياً'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingTeacher(false);
                    setEditingTeacherData(null);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-[#064e3b] hover:bg-emerald-800 text-emerald-200 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT STUDENT PASSWORD                                  */}
      {/* ------------------------------------------------------------- */}
      {editingStudent && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain" dir="rtl">
          <div className="relative my-auto bg-[#022c22] border border-[#fbbf24]/50 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#065f46] shrink-0">
              <div className="flex items-center gap-2 text-base font-bold text-[#fbbf24] font-heading">
                <Key className="w-5 h-5" />
                <span>تعديل بيانات دخول الطالب</span>
              </div>
              <button onClick={() => setEditingStudent(null)} className="text-emerald-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudentPassword} className="space-y-4 text-xs">
              <div className="p-3 bg-[#064e3b]/40 rounded-xl border border-[#065f46]">
                <div className="text-white font-bold">{editingStudent.name}</div>
                <div className="text-[11px] text-[#86efac] mt-0.5">معرف الطالب: {editingStudent.id}</div>
              </div>

              <div>
                <label className="block text-emerald-200 font-bold mb-1">رمز / كلمة مرور الدخول:</label>
                <input
                  type="text"
                  required
                  value={newStudentPassword}
                  onChange={e => setNewStudentPassword(e.target.value)}
                  className="w-full bg-[#064e3b]/70 border border-[#065f46] rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-[#fbbf24]"
                />
              </div>

              <div>
                <label className="block text-emerald-200 font-bold mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  value={newStudentPhone}
                  onChange={e => setNewStudentPhone(e.target.value)}
                  className="w-full bg-[#064e3b]/70 border border-[#065f46] rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-[#fbbf24]"
                />
              </div>

              {/* Google Account Linking / Unlinking for Supervisor */}
              <div className="p-3 bg-[#064e3b]/40 rounded-xl border border-[#065f46] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-200">حساب Google المرتبط:</span>
                  {editingStudent.isGoogleLinked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {editingStudent.googleEmail || 'مرتبط'}
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-400/60">غير مرتبط بأي حساب Google</span>
                  )}
                </div>

                {editingStudent.isGoogleLinked && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleUnlinkStudentGoogle(editingStudent)}
                      disabled={unlinkingStudentId === editingStudent.id}
                      className="w-full py-2 px-3 rounded-lg bg-red-950/80 hover:bg-red-800 text-red-200 hover:text-white border border-red-500/40 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{unlinkingStudentId === editingStudent.id ? 'جاري فصل الحساب...' : 'فصل حساب Google عن هذا الطالب'}</span>
                    </button>
                    <p className="text-[10px] text-emerald-300/70 mt-1 text-center">
                      فصل الحساب يتيح للطالب أو طالب آخر ربط هذا البريد بحساب جديد دون تعارض.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black cursor-pointer shadow-lg transition-all"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="py-2.5 px-4 rounded-xl bg-[#064e3b] hover:bg-emerald-800 text-emerald-200 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DELETE TEACHER CONFIRMATION                            */}
      {/* ------------------------------------------------------------- */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overscroll-contain" dir="rtl">
          <div className="bg-[#022c22] border border-red-500/50 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تأكيد حذف حساب المعلم</h3>
              <p className="text-xs text-emerald-200/80 mt-1">
                هل أنت متأكد من حذف حساب المعلم ({teacherToDelete.name})؟ لن يتمكن من تسجيل الدخول بعد الآن.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmDeleteTeacher}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-lg"
              >
                {isSubmitting ? 'جاري الحذف...' : 'نعم، حذف الحساب'}
              </button>
              <button
                onClick={() => setTeacherToDelete(null)}
                className="py-2.5 px-4 rounded-xl bg-[#064e3b] text-emerald-200 text-xs font-bold hover:text-white cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
