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
import { TeacherAccount, Student, Halaqah } from '../../types';

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
                <th className="p-4 text-center">رابط الدخول السريع</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/40 text-emerald-100">
              {filteredTeachers.map(teacher => {
                const isSuper =
                  teacher.role === 'supervisor' ||
                  teacher.isPrimary ||
                  teacher.username.trim().toLowerCase() === 'محمد منتصر' ||
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>مرتبط</span>
                        </span>
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
                <label className="block text-emerald-200 font-bold mb-1">اسم المعلم / المشرف:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الشيخ عبد الله بن محمد"
                  value={editingTeacherData.name || ''}
                  onChange={e => setEditingTeacherData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#064e3b]/70 border border-[#065f46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#fbbf24]"
                />
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
