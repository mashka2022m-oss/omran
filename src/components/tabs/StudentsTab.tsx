import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Trash2,
  Edit,
  Phone,
  BookOpen,
  Lock,
  Unlock,
  Sparkles,
  Shield,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Eye,
  Layers,
  ArrowRightLeft,
  CheckSquare,
  Square,
  RefreshCw
} from 'lucide-react';
import { Student, StudentLevel, AppSettings, Halaqah } from '../../types';
import { QURAN_SURAHS } from '../../data/quranData';

interface StudentsTabProps {
  students: Student[];
  settings: AppSettings;
  halaqahs?: Halaqah[];
  activeHalaqahId?: string;
  isSupervisor?: boolean;
  onAddStudent: (studentData: Partial<Student>) => Promise<boolean>;
  onUpdateStudent: (student: Student) => Promise<boolean>;
  onDeleteStudent: (studentId: string) => Promise<boolean>;
  onToggleRegistration: () => void;
  onTriggerAIPlan: (student: Student) => Promise<void>;
  onTransferStudent?: (studentId: string, targetHalaqahId: string, targetHalaqahName: string) => Promise<void>;
  onBatchTransferStudents?: (studentIds: string[], targetHalaqahId: string, targetHalaqahName: string) => Promise<void>;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  students,
  settings,
  halaqahs = [],
  activeHalaqahId,
  isSupervisor = false,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onToggleRegistration,
  onTriggerAIPlan,
  onTransferStudent,
  onBatchTransferStudents
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');

  // Bulk Selection & Transfer State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkTransferModalOpen, setIsBulkTransferModalOpen] = useState(false);
  const [bulkTargetHalaqahId, setBulkTargetHalaqahId] = useState<string>('');
  const [isBulkTransferring, setIsBulkTransferring] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredStudents.map(s => s.id);
    setSelectedStudentIds(allFilteredIds);
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds([]);
  };

  const handleBulkTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0 || !bulkTargetHalaqahId) {
      setBulkFeedback({ type: 'error', text: 'يرجى اختيار الحلقة المستهدفة لنقل الطلاب إليها.' });
      return;
    }

    const targetHalaqah = halaqahs.find(h => h.id === bulkTargetHalaqahId);
    const targetName = targetHalaqah ? targetHalaqah.name : 'الحلقة المختارة';

    setIsBulkTransferring(true);
    setBulkFeedback(null);
    try {
      if (onBatchTransferStudents) {
        await onBatchTransferStudents(selectedStudentIds, bulkTargetHalaqahId, targetName);
      } else if (onTransferStudent) {
        for (const sId of selectedStudentIds) {
          await onTransferStudent(sId, bulkTargetHalaqahId, targetName);
        }
      }
      setBulkFeedback({
        type: 'success',
        text: `تم نقل (${selectedStudentIds.length}) طلاب بنجاح إلى "${targetName}" وحفظ كافة سجلاتهم سحابياً!`
      });
      setTimeout(() => {
        setSelectedStudentIds([]);
        setIsBulkTransferModalOpen(false);
        setBulkFeedback(null);
        setBulkTargetHalaqahId('');
      }, 1500);
    } catch (err: any) {
      setBulkFeedback({
        type: 'error',
        text: err.message || 'حدث خطأ أثناء نقل الطلاب سحابياً.'
      });
    } finally {
      setIsBulkTransferring(false);
    }
  };
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingPlanStudent, setViewingPlanStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [quickAssignStudent, setQuickAssignStudent] = useState<Student | null>(null);
  const [quickSelectedHalaqahId, setQuickSelectedHalaqahId] = useState<string>('');
  const [isQuickAssigning, setIsQuickAssigning] = useState(false);
  
  // Form fields
  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('123');
  const [formPhone, setFormPhone] = useState('');
  const [formAge, setFormAge] = useState<number>(11);
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhones, setFormParentPhones] = useState<string[]>(['']);
  const [formSurahNum, setFormSurahNum] = useState<number>(78);
  const [formAyah, setFormAyah] = useState<number>(1);
  const [formDailyNew, setFormDailyNew] = useState<string>('نصف وجه');
  const [formDailyReview, setFormDailyReview] = useState<string>('وجه واحد');
  const [formLevel, setFormLevel] = useState<StudentLevel>('متوسط');
  const [formHalaqahId, setFormHalaqahId] = useState<string>(activeHalaqahId || halaqahs[0]?.id || '');
  const [formNotes, setFormNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Open add modal
  const openAddModal = () => {
    setEditingStudent(null);
    setFormName('');
    setFormPassword('123');
    setFormPhone('');
    setFormAge(11);
    setFormParentName('');
    setFormParentPhones(['']);
    setFormSurahNum(78);
    setFormAyah(1);
    setFormDailyNew('نصف وجه');
    setFormDailyReview('وجه واحد');
    setFormLevel('متوسط');
    setFormHalaqahId(activeHalaqahId && activeHalaqahId !== 'all' ? activeHalaqahId : '');
    setFormNotes('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormPassword(student.password || '123');
    setFormPhone(student.phone);
    setFormAge(student.age || 10);
    setFormParentName(student.parentName || '');
    setFormParentPhones(student.parentPhones && student.parentPhones.length > 0 ? [...student.parentPhones] : ['']);
    setFormSurahNum(student.currentSurah || 78);
    setFormAyah(student.currentAyah || 1);
    setFormDailyNew(student.dailyNewTarget || 'نصف وجه');
    setFormDailyReview(student.dailyReviewTarget || 'وجه واحد');
    setFormLevel(student.level || 'متوسط');
    setFormHalaqahId(student.halaqahId || '');
    setFormNotes(student.notes || '');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleAddParentPhone = () => {
    setFormParentPhones([...formParentPhones, '']);
  };

  const handleRemoveParentPhone = (idx: number) => {
    const updated = formParentPhones.filter((_, i) => i !== idx);
    setFormParentPhones(updated.length > 0 ? updated : ['']);
  };

  const handleParentPhoneChange = (idx: number, val: string) => {
    const updated = [...formParentPhones];
    updated[idx] = val;
    setFormParentPhones(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('يرجى كتابة اسم الطالب');
      return;
    }

    const selectedSurah = QURAN_SURAHS.find(s => s.number === Number(formSurahNum));
    const validParentPhones = formParentPhones.map(p => p.trim()).filter(p => p.length > 0);
    const chosenHalaqah = halaqahs.find(h => h.id === formHalaqahId);
    const assignedHalaqahName = chosenHalaqah ? chosenHalaqah.name : '';

    setIsSubmitting(true);
    try {
      if (editingStudent) {
        const updated: Student = {
          ...editingStudent,
          name: formName.trim(),
          password: formPassword.trim() || '123',
          phone: formPhone.trim(),
          age: formAge,
          parentName: formParentName.trim() || `ولي أمر ${formName.trim()}`,
          parentPhones: validParentPhones.length > 0 ? validParentPhones : [formPhone.trim()],
          currentSurah: Number(formSurahNum),
          currentSurahName: selectedSurah?.name || 'النبأ',
          currentAyah: Number(formAyah),
          dailyNewTarget: formDailyNew,
          dailyReviewTarget: formDailyReview,
          level: formLevel,
          halaqahId: formHalaqahId,
          halaqahName: assignedHalaqahName,
          notes: formNotes
        };
        await onUpdateStudent(updated);
      } else {
        await onAddStudent({
          name: formName.trim(),
          password: formPassword.trim() || '123',
          phone: formPhone.trim(),
          age: formAge,
          parentName: formParentName.trim() || `ولي أمر ${formName.trim()}`,
          parentPhones: validParentPhones.length > 0 ? validParentPhones : [formPhone.trim()],
          currentSurah: Number(formSurahNum),
          currentSurahName: selectedSurah?.name || 'النبأ',
          currentAyah: Number(formAyah),
          dailyNewTarget: formDailyNew,
          dailyReviewTarget: formDailyReview,
          level: formLevel,
          halaqahId: formHalaqahId,
          halaqahName: assignedHalaqahName,
          notes: formNotes
        });
      }
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء الحفظ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Assign Handler
  const handleQuickAssign = async () => {
    if (!quickAssignStudent || !quickSelectedHalaqahId) return;
    setIsQuickAssigning(true);
    try {
      const chosen = halaqahs.find(h => h.id === quickSelectedHalaqahId);
      const chosenName = chosen ? chosen.name : '';
      if (onTransferStudent) {
        await onTransferStudent(quickAssignStudent.id, quickSelectedHalaqahId, chosenName);
      } else {
        await onUpdateStudent({
          ...quickAssignStudent,
          halaqahId: quickSelectedHalaqahId,
          halaqahName: chosenName
        });
      }
      setQuickAssignStudent(null);
      setQuickSelectedHalaqahId('');
    } catch (e: any) {
      console.error('Quick assign error:', e);
    } finally {
      setIsQuickAssigning(false);
    }
  };

  const unassignedStudentsCount = students.filter(
    s => !s.halaqahId || s.halaqahId.trim() === '' || s.halaqahId === 'unassigned' || s.halaqahId === 'none'
  ).length;
  const assignedStudentsCount = students.length - unassignedStudentsCount;

  // Filter students
  const filteredStudents = students.filter(student => {
    const isAssigned = Boolean(
      student.halaqahId &&
      student.halaqahId.trim() !== '' &&
      student.halaqahId !== 'unassigned' &&
      student.halaqahId !== 'none'
    );

    if (assignmentFilter === 'assigned' && !isAssigned) return false;
    if (assignmentFilter === 'unassigned' && isAssigned) return false;

    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.currentSurahName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone?.includes(searchTerm);
    const matchesLevel = levelFilter === 'all' || student.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#064e3b]/60 border border-[#065f46] p-6 rounded-[32px] shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <span>إدارة الطلاب والتسجيل الذكي</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] font-sans border border-[#fbbf24]/40 font-bold">
              {students.length} طالب
            </span>
          </h2>
          <p className="text-xs text-[#86efac]/90 mt-1">
            تسجيل الطلاب وتحديد مستوياتهم ومواضع حفظهم ومتابعة مقرراتهم المنهجية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Registration Lock Toggle */}
          <button
            onClick={onToggleRegistration}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
              settings.allowStudentRegistration
                ? 'bg-[#fbbf24]/15 border-[#fbbf24]/40 text-[#fbbf24] hover:bg-[#fbbf24]/25'
                : 'bg-red-500/15 border-red-500/40 text-red-300 hover:bg-red-500/25'
            }`}
            title={
              settings.allowStudentRegistration
                ? 'التسجيل الذاتي مفتوح للطلاب (انقر للقفل)'
                : 'التسجيل الذاتي مغلق حالياً (انقر للفتح)'
            }
          >
            {settings.allowStudentRegistration ? (
              <>
                <Unlock className="w-4 h-4 text-[#fbbf24]" />
                <span>إنشاء الحسابات: مفتوح</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-red-400" />
                <span>إنشاء الحسابات: مغلق</span>
              </>
            )}
          </button>

          {/* Add Student Button */}
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة طالب جديد</span>
          </button>
        </div>
      </div>

      {/* Search & Level Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو السورة أو رقم الهاتف..."
            className="w-full bg-[#064e3b]/50 border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-4 pr-11 text-sm text-[#f0f9f6] placeholder-[#86efac]/40 outline-none"
            dir="rtl"
          />
          <Search className="w-4 h-4 text-[#86efac]/60 absolute right-4 top-3.5" />
        </div>

        <div className="flex items-center gap-2 bg-[#064e3b]/50 border border-[#065f46] p-1.5 rounded-2xl flex-wrap">
          <span className="text-xs text-[#86efac] px-2 font-bold">المستوى:</span>
          {(['all', 'قوي', 'متوسط', 'ضعيف'] as const).map(lvl => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                levelFilter === lvl
                  ? 'bg-[#fbbf24] text-[#064e3b] font-black shadow-sm'
                  : 'text-[#86efac]/80 hover:text-white'
              }`}
            >
              {lvl === 'all' ? 'الكل' : lvl}
            </button>
          ))}
        </div>

        {/* Assignment Status Filter */}
        <div className="flex items-center gap-2 bg-[#064e3b]/50 border border-[#065f46] p-1.5 rounded-2xl flex-wrap">
          <span className="text-xs text-[#86efac] px-2 font-bold">الحلقة:</span>
          <button
            onClick={() => setAssignmentFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              assignmentFilter === 'all'
                ? 'bg-[#fbbf24] text-[#064e3b] font-black shadow-sm'
                : 'text-[#86efac]/80 hover:text-white'
            }`}
          >
            الكل ({students.length})
          </button>
          <button
            onClick={() => setAssignmentFilter('assigned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              assignmentFilter === 'assigned'
                ? 'bg-emerald-500 text-white font-black shadow-sm'
                : 'text-[#86efac]/80 hover:text-white'
            }`}
          >
            المرفقين ({assignedStudentsCount})
          </button>
          <button
            onClick={() => setAssignmentFilter('unassigned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              assignmentFilter === 'unassigned'
                ? 'bg-amber-500 text-[#022c22] font-black shadow-sm'
                : unassignedStudentsCount > 0
                ? 'text-amber-300 bg-amber-500/20 hover:bg-amber-500/30'
                : 'text-[#86efac]/80 hover:text-white'
            }`}
          >
            <span>غير المرفقين ({unassignedStudentsCount})</span>
            {unassignedStudentsCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
          </button>
        </div>
      </div>

      {/* Unassigned Students Alert Banner for Supervisor */}
      {unassignedStudentsCount > 0 && isSupervisor && assignmentFilter !== 'unassigned' && (
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/15 to-[#064e3b] border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200">
                تنبيه: يوجد {unassignedStudentsCount} طالب غير مرفق في أي حلقة قرآنية
              </h4>
              <p className="text-xs text-[#86efac]/90 mt-0.5">
                الطلاب غير المرفقين يظهر لهم في بوابتهم (لم يتم إرفاقك بعد)، ولن يظهروا للمعلمين في الحلقات إلا عند إرفاقهم بحلقة محددة.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAssignmentFilter('unassigned')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#022c22] font-black text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-md cursor-pointer transition-all"
          >
            <span>عرض وتعيين غير المرفقين ({unassignedStudentsCount})</span>
          </button>
        </div>
      )}

      {/* Bulk Selection and Batch Transfer Bar */}
      <div className="bg-[#022c22]/90 border border-[#065f46] rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? handleDeselectAll : handleSelectAllFiltered}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#064e3b] text-[#86efac] hover:text-white border border-[#065f46] flex items-center gap-2 cursor-pointer transition-colors"
          >
            {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
              <>
                <CheckSquare className="w-4 h-4 text-[#fbbf24]" />
                <span>إلغاء تحديد الكل ({selectedStudentIds.length})</span>
              </>
            ) : (
              <>
                <Square className="w-4 h-4" />
                <span>تحديد جميع المعروضين ({filteredStudents.length})</span>
              </>
            )}
          </button>

          {selectedStudentIds.length > 0 && (
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-xs text-slate-400 hover:text-red-300 underline cursor-pointer px-1"
            >
              مسح التحديد
            </button>
          )}

          <div className="text-xs">
            {selectedStudentIds.length > 0 ? (
              <span className="px-3 py-1 rounded-xl bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24] font-bold">
                تم تحديد <strong>{selectedStudentIds.length}</strong> طالب لنقلهم سحابياً
              </span>
            ) : (
              <span className="text-[#86efac]/70 text-[11px] hidden sm:inline">
                حدد الطلاب بالضغط على زر التحديد في بطاقة أي طالب لنقلهم دفعة واحدة
              </span>
            )}
          </div>
        </div>

        {/* Transfer Action Button */}
        <button
          type="button"
          disabled={selectedStudentIds.length === 0}
          onClick={() => {
            const otherHalaqah = halaqahs.find(h => h.id !== activeHalaqahId) || halaqahs[0];
            setBulkTargetHalaqahId(otherHalaqah ? otherHalaqah.id : '');
            setBulkFeedback(null);
            setIsBulkTransferModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#064e3b] hover:from-[#f59e0b] hover:to-[#fbbf24] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-amber-950/30 shrink-0"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>نقل الطلاب المحددين ({selectedStudentIds.length}) إلى حلقة أخرى</span>
        </button>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full bg-[#064e3b]/40 border border-[#065f46] rounded-[32px] p-12 text-center">
            <BookOpen className="w-12 h-12 text-[#86efac]/40 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white">لا يوجد طلاب مطابقون للبحث</h4>
            <p className="text-xs text-[#86efac]/70 mt-1">
              تأكد من كتابة الاسم بشكل صحيح أو أضف طالباً جديداً
            </p>
          </div>
        ) : (
          filteredStudents.map(student => {
            const isSelected = selectedStudentIds.includes(student.id);

            return (
              <div
                key={student.id}
                className={`border rounded-[32px] p-5 flex flex-col justify-between gap-4 transition-all hover:shadow-2xl hover:shadow-emerald-950/50 ${
                  isSelected
                    ? 'bg-[#064e3b]/90 border-[#fbbf24] ring-2 ring-[#fbbf24]/50 shadow-lg shadow-amber-950/40'
                    : 'bg-[#064e3b]/55 border-[#065f46] hover:border-[#fbbf24]/50'
                }`}
              >
                {/* Card Top */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {/* Selection Checkbox */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentIds(prev =>
                            prev.includes(student.id)
                              ? prev.filter(id => id !== student.id)
                              : [...prev, student.id]
                          );
                        }}
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#fbbf24] text-[#064e3b] border-[#fbbf24] shadow-sm'
                            : 'bg-[#022c22] text-slate-400 hover:text-white border-[#065f46] hover:border-[#fbbf24]/50'
                        }`}
                        title={isSelected ? 'إلغاء تحديد الطالب' : 'تحديد الطالب للنقل'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div className="w-12 h-12 rounded-2xl bg-[#022c22] border border-[#065f46] text-[#fbbf24] flex items-center justify-center text-lg font-black shadow-inner shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{student.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[#86efac]/80 flex-wrap">
                          <span>{student.age} سنة</span>
                          <span>•</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              student.level === 'قوي'
                                ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30'
                                : student.level === 'متوسط'
                                ? 'bg-emerald-500/20 text-[#86efac] border border-emerald-500/30'
                                : 'bg-amber-600/20 text-amber-300 border border-amber-600/30'
                            }`}
                          >
                            {student.level}
                          </span>
                          {(!student.halaqahId || student.halaqahId.trim() === '' || student.halaqahId === 'unassigned' || student.halaqahId === 'none') ? (
                            <>
                              <span>•</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/25 text-amber-300 border border-amber-500/50">
                                ⚠️ غير مرفق بحلقة
                              </span>
                            </>
                          ) : (
                            student.halaqahName && (
                              <>
                                <span>•</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#022c22] text-[#86efac] border border-[#065f46]">
                                  {student.halaqahName}
                                </span>
                              </>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(student)}
                      title="تعديل بيانات الطالب"
                      className="p-2 rounded-xl text-[#86efac] hover:text-[#fbbf24] hover:bg-[#022c22] transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setStudentToDelete(student)}
                      title="حذف الطالب"
                      className="p-2 rounded-xl text-[#86efac] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Details */}
                <div className="mt-4 bg-[#022c22]/70 border border-[#065f46] rounded-2xl p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[#f0f9f6]">
                    <span className="text-[#86efac] font-medium">موضع الحفظ الحالي:</span>
                    <span className="font-bold text-[#fbbf24]">
                      سورة {student.currentSurahName} (الآية {student.currentAyah})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#f0f9f6]">
                    <span className="text-[#86efac] font-medium">طاقة الحفظ اليومي:</span>
                    <span className="text-emerald-300 font-semibold">{student.dailyNewTarget}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#f0f9f6]">
                    <span className="text-[#86efac] font-medium">طاقة المراجعة:</span>
                    <span className="text-teal-300 font-semibold">{student.dailyReviewTarget}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#f0f9f6] pt-1.5 border-t border-[#065f46]/60">
                    <span className="text-[#86efac] font-medium">ولي الأمر:</span>
                    <span className="text-white font-medium">{student.parentName}</span>
                  </div>
                  {student.parentPhones && student.parentPhones.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#86efac]/80 overflow-hidden pt-0.5">
                      <Phone className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
                      <span className="truncate" dir="ltr">
                        {student.parentPhones.join(' • ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Assign Action for Unassigned Students */}
                {(!student.halaqahId || student.halaqahId.trim() === '' || student.halaqahId === 'unassigned' || student.halaqahId === 'none') && isSupervisor && (
                  <button
                    onClick={() => {
                      setQuickAssignStudent(student);
                      setQuickSelectedHalaqahId(halaqahs[0]?.id || '');
                    }}
                    className="w-full mt-3 py-2 px-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                    <span>إرفاق هذا الطالب بحلقة قرآنية الآن</span>
                  </button>
                )}
              </div>

              {/* Plan Banner / Action */}
              <div className="pt-2 border-t border-[#065f46]/60 flex items-center justify-between gap-2">
                {student.aiPlan ? (
                  <button
                    onClick={() => setViewingPlanStudent(student)}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#fbbf24]/20 to-[#064e3b] hover:from-[#fbbf24]/30 hover:to-[#064e3b] border border-[#fbbf24]/40 text-[#fbbf24] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#fbbf24]" />
                    <span>عرض الخطة المنهجية</span>
                  </button>
                ) : (
                  <div className="flex-1 py-2 px-3 rounded-2xl bg-[#022c22]/50 border border-[#065f46] text-[#86efac]/70 text-[11px] text-center">
                    الخطة المنهجية معتمدة
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#064e3b] border border-[#fbbf24]/30 rounded-2xl sm:rounded-[32px] shadow-2xl shadow-emerald-950/90 flex flex-col max-h-[92vh] my-auto overflow-hidden animate-fadeIn">
            {/* Pinned Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#065f46] shrink-0 bg-[#064e3b]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#fbbf24] text-[#064e3b] flex items-center justify-center font-bold shadow-md shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-heading text-[#fbbf24]">
                    {editingStudent ? 'تعديل بيانات الطالب' : 'تسجيل طالب جديد في الحلقة'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#86efac]">
                    إدخال بيانات الطالب لضبط خطة الحفظ والمتابعة القرآنية المنهجية
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-[#86efac] hover:text-white hover:bg-[#022c22] cursor-pointer transition-colors"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                {formError && (
                  <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Row 1: Student Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                      اسم الطالب الثلاثي <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="مثال: عبد الله محمد القاسمي"
                      className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3.5 text-sm text-[#f0f9f6] outline-none transition-colors"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                      العمر (سنوات)
                    </label>
                    <input
                      type="number"
                      min={4}
                      max={40}
                      value={formAge}
                      onChange={e => setFormAge(Number(e.target.value))}
                      className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3.5 text-sm text-[#f0f9f6] outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Row 2: Credentials & Student Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                      كلمة مرور حساب الطالب <span className="text-xs text-[#86efac]/70">(للبوابة)</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formPassword}
                      onChange={e => setFormPassword(e.target.value)}
                      placeholder="كلمة مرور للدخول"
                      className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3.5 text-sm text-[#f0f9f6] outline-none transition-colors"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                      رقم هاتف الطالب <span className="text-xs text-[#86efac]/70">(اختياري)</span>
                    </label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                      className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3.5 text-sm text-[#f0f9f6] outline-none transition-colors"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Row 3: Parent Info & Multiple Parent Phones */}
                <div className="bg-[#022c22]/80 border border-[#065f46] rounded-2xl p-3.5 sm:p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                      اسم ولي الأمر
                    </label>
                    <input
                      type="text"
                      value={formParentName}
                      onChange={e => setFormParentName(e.target.value)}
                      placeholder="اسم والد الطالب / ولي أمره"
                      className="w-full bg-[#064e3b]/80 border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3.5 text-sm text-[#f0f9f6] outline-none transition-colors"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                      <label className="text-xs font-semibold text-[#86efac] text-right">
                        أرقام هواتف أولياء الأمور (لواتساب المتابعة)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddParentPhone}
                        className="text-[11px] text-[#fbbf24] hover:text-[#f59e0b] flex items-center gap-1 font-bold cursor-pointer py-1 px-2 rounded-lg hover:bg-[#064e3b]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة رقم هاتف آخر</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formParentPhones.map((phone, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="tel"
                            value={phone}
                            onChange={e => handleParentPhoneChange(idx, e.target.value)}
                            placeholder="رقم الواتساب (مثال: 966501234567)"
                            className="flex-1 bg-[#064e3b]/80 border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3.5 text-sm text-[#f0f9f6] outline-none transition-colors"
                            dir="ltr"
                          />
                          {formParentPhones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveParentPhone(idx)}
                              className="p-2 text-[#86efac] hover:text-red-400 hover:bg-[#022c22] rounded-xl cursor-pointer shrink-0"
                              title="حذف هذا الرقم"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 4: Quran Position (Surah & Ayah) */}
                <div className="bg-[#022c22]/80 border border-[#065f46] rounded-2xl p-3.5 sm:p-4 space-y-3">
                  <div className="text-xs font-bold text-[#fbbf24] flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>موضع الحفظ الحالي للقرآن الكريم</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                        اختر السورة
                      </label>
                      <select
                        value={formSurahNum}
                        onChange={e => setFormSurahNum(Number(e.target.value))}
                        className="w-full bg-[#064e3b]/80 border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3 text-sm text-[#f0f9f6] outline-none"
                      >
                        {QURAN_SURAHS.map(s => (
                          <option key={s.number} value={s.number} className="bg-[#064e3b] text-white">
                            {s.number}. سورة {s.name} ({s.numberOfAyahs} آية - الجزء {s.juz})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                        رقم الآية التي وصل إليها
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={286}
                        value={formAyah}
                        onChange={e => setFormAyah(Number(e.target.value))}
                        className="w-full bg-[#064e3b]/80 border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3 text-sm text-[#f0f9f6] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 5: Capabilities & Level */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                      طاقة الحفظ الجديد يومياً
                    </label>
                    <select
                      value={formDailyNew}
                      onChange={e => setFormDailyNew(e.target.value)}
                      className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3 text-sm text-[#f0f9f6] outline-none"
                    >
                      <option value="3 آيات" className="bg-[#064e3b]">3 آيات</option>
                      <option value="5 آيات" className="bg-[#064e3b]">5 آيات</option>
                      <option value="نصف وجه" className="bg-[#064e3b]">نصف وجه</option>
                      <option value="وجه كامل" className="bg-[#064e3b]">وجه كامل</option>
                      <option value="وجهين" className="bg-[#064e3b]">وجهين</option>
                      <option value="سورة قصيرة كاملة" className="bg-[#064e3b]">سورة قصيرة كاملة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                      طاقة المراجعة يومياً
                    </label>
                    <select
                      value={formDailyReview}
                      onChange={e => setFormDailyReview(e.target.value)}
                      className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3 text-sm text-[#f0f9f6] outline-none"
                    >
                      <option value="سورة قصيرة" className="bg-[#064e3b]">سورة قصيرة</option>
                      <option value="وجه واحد" className="bg-[#064e3b]">وجه واحد</option>
                      <option value="ربع حزب" className="bg-[#064e3b]">ربع حزب</option>
                      <option value="نصف حزب" className="bg-[#064e3b]">نصف حزب</option>
                      <option value="حزب كامل" className="bg-[#064e3b]">حزب كامل</option>
                      <option value="نصف جزء" className="bg-[#064e3b]">نصف جزء</option>
                      <option value="جزء كامل" className="bg-[#064e3b]">جزء كامل</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                      مستوى الطالب <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formLevel}
                      onChange={e => setFormLevel(e.target.value as StudentLevel)}
                      className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3 text-sm text-[#fbbf24] outline-none font-bold"
                    >
                      <option value="ضعيف" className="bg-[#064e3b]">ضعيف (يحتاج تيسير وتكرار)</option>
                      <option value="متوسط" className="bg-[#064e3b]">متوسط (وتيرة متوازنة)</option>
                      <option value="قوي" className="bg-[#064e3b]">قوي (متميز وسريع الحفظ)</option>
                    </select>
                  </div>
                </div>

                {/* Halaqah Selection (if multi-halaqah exists) */}
                {halaqahs.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                      الحلقة التابع لها الطالب
                    </label>
                    <select
                      value={formHalaqahId}
                      onChange={e => setFormHalaqahId(e.target.value)}
                      className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3 text-sm text-[#f0f9f6] outline-none cursor-pointer"
                    >
                      <option value="" className="bg-[#064e3b] text-amber-300 font-bold">
                        ⚠️ غير مرفق بحلقة بعد (في قائمة الانتظار)
                      </option>
                      {halaqahs.map(h => (
                        <option key={h.id} value={h.id} className="bg-[#064e3b] text-white">
                          {h.name} (المعلم: {h.primaryTeacherName || 'محمد منتصر'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Row 6: Notes */}
                <div>
                  <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                    ملاحظات المعلم (نقاط القوة، الصعوبات، أحكام التجويد)
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    placeholder="اكتب أي ملاحظات خاصة حول الطالب، الحفظ، ومخارج الحروف..."
                    className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3 text-sm text-[#f0f9f6] outline-none resize-none"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Pinned Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-[#065f46] shrink-0 bg-[#022c22]/95">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-[#86efac] hover:text-white hover:bg-[#064e3b] text-xs font-bold cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 text-[#064e3b] text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center gap-2 cursor-pointer transition-all"
                >
                  {isSubmitting ? (
                    <span>جاري حفظ البيانات...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-[#064e3b]" />
                      <span>{editingStudent ? 'حفظ التعديلات' : 'تسجيل واعتماد الطالب في الحلقة'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Plan Modal */}
      {viewingPlanStudent && viewingPlanStudent.aiPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#064e3b] border border-[#fbbf24]/40 rounded-2xl sm:rounded-[32px] shadow-2xl shadow-emerald-950/80 flex flex-col max-h-[90vh] my-auto overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#065f46] shrink-0 bg-[#064e3b]">
              <div className="flex items-center gap-2 text-[#fbbf24] font-bold font-heading text-sm sm:text-base">
                <BookOpen className="w-5 h-5 text-[#fbbf24] shrink-0" />
                <span className="line-clamp-1">الخطة المنهجية للطالب: {viewingPlanStudent.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setViewingPlanStudent(null)}
                className="p-1.5 text-[#86efac] hover:text-white rounded-xl cursor-pointer hover:bg-[#022c22]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-[#022c22]/80 border border-[#065f46]">
                <span className="text-[11px] font-bold text-[#fbbf24] block mb-1">
                  خارطة الطريق الاستراتيجية:
                </span>
                <p className="text-[#f0f9f6] leading-relaxed">
                  {viewingPlanStudent.aiPlan.roadmapSummary}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#022c22]/80 border border-[#065f46] space-y-2.5">
                <span className="text-[11px] font-bold text-[#86efac] block">
                  الورد اليومي المقرر حالياً:
                </span>
                <div className="flex items-center justify-between text-[#f0f9f6] flex-wrap gap-1">
                  <span className="text-[#86efac] font-medium">الحفظ الجديد:</span>
                  <span className="font-bold text-[#fbbf24]">
                    {viewingPlanStudent.aiPlan.currentDailyAssignment?.newMemorization}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#f0f9f6] flex-wrap gap-1">
                  <span className="text-[#86efac] font-medium">المراجعة والتثبيت:</span>
                  <span className="font-bold text-emerald-300">
                    {viewingPlanStudent.aiPlan.currentDailyAssignment?.review}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#f0f9f6] flex-wrap gap-1">
                  <span className="text-[#86efac] font-medium">القارئ المقترح للاستماع:</span>
                  <span className="font-bold text-[#fbbf24]">
                    {viewingPlanStudent.aiPlan.currentDailyAssignment?.suggestedSheikh}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#065f46] text-[#f0f9f6]">
                  <span className="text-[#fbbf24] font-semibold">توجيه منزلي: </span>
                  {viewingPlanStudent.aiPlan.currentDailyAssignment?.dailyNote}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#86efac] px-2 flex-wrap gap-2">
                <span>تعديل الصعوبة: {viewingPlanStudent.aiPlan.difficultyAdjustment}</span>
                <span>الأيام المقدرة لختم الجزء: ~{viewingPlanStudent.aiPlan.estimatedDaysToFinishJuz} يوم</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-[#065f46] shrink-0 bg-[#022c22]/95 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingPlanStudent(null)}
                className="px-6 py-2.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-xs cursor-pointer shadow-md"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm bg-[#064e3b] border border-red-500/50 rounded-2xl sm:rounded-[32px] p-5 sm:p-7 shadow-2xl space-y-4 text-center my-auto animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">تأكيد حذف الطالب نهائياً</h3>
              <p className="text-xs text-[#86efac]/90 mt-2 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف حساب الطالب <span className="text-[#fbbf24] font-black">"{studentToDelete.name}"</span> نهائياً؟
                <br />
                <span className="text-red-300 text-[11px]">سيتم حذف كافة سجلات التسميع والحضور والخطة الخاصة به.</span>
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2 flex-col sm:flex-row">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="w-full sm:flex-1 py-2.5 rounded-2xl text-xs font-bold bg-[#022c22] text-[#86efac] hover:text-white border border-[#065f46] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (studentToDelete) {
                    const id = studentToDelete.id;
                    setStudentToDelete(null);
                    await onDeleteStudent(id);
                  }
                }}
                className="w-full sm:flex-1 py-2.5 rounded-2xl text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow-lg cursor-pointer transition-all"
              >
                نعم، تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Assign Halaqah Modal */}
      {quickAssignStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#064e3b] border border-amber-500/40 rounded-3xl p-6 shadow-2xl shadow-emerald-950/90 flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-[#065f46] pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">إرفاق الطالب بحلقة قرآنية</h3>
                <p className="text-xs text-[#86efac]/80 mt-0.5">
                  الطالب: <span className="text-amber-300 font-bold">{quickAssignStudent.name}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#86efac]/90 leading-relaxed">
              اختر الحلقة القرآنية التي ترغب في إلحاق الطالب بها. بعد التأكيد، سيتم الحفظ سحابياً في قاعدة البيانات وسيتمكن الطالب من الدخول لمعلمه ومتابعة الحفظ فوراً.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#86efac] text-right">
                اختر الحلقة القرآنية:
              </label>
              <select
                value={quickSelectedHalaqahId || (halaqahs[0]?.id || '')}
                onChange={e => setQuickSelectedHalaqahId(e.target.value)}
                className="w-full bg-[#022c22] border border-[#065f46] focus:border-amber-400 rounded-2xl py-3 px-3.5 text-sm text-[#f0f9f6] outline-none cursor-pointer font-bold"
              >
                {halaqahs.map(h => (
                  <option key={h.id} value={h.id} className="bg-[#064e3b] text-white">
                    {h.name} — المعلم: {h.primaryTeacherName || 'محمد منتصر'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isQuickAssigning}
                onClick={() => {
                  setQuickAssignStudent(null);
                  setQuickSelectedHalaqahId('');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#022c22] text-[#86efac] hover:text-white border border-[#065f46] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isQuickAssigning}
                onClick={() => {
                  const targetId = quickSelectedHalaqahId || (halaqahs[0]?.id || '');
                  if (targetId) {
                    setQuickSelectedHalaqahId(targetId);
                    handleQuickAssign();
                  }
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-[#022c22] shadow-lg cursor-pointer transition-all flex items-center gap-1.5"
              >
                {isQuickAssigning ? (
                  <span>جاري الإرفاق السحابي...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>تأكيد الإرفاق والحفظ السحابي</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Transfer Modal */}
      {isBulkTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#064e3b] border border-[#fbbf24]/40 rounded-3xl p-6 shadow-2xl shadow-emerald-950/90 flex flex-col gap-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#065f46] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24] flex items-center justify-center shrink-0">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">نقل جماعي للطلاب المحددين</h3>
                  <p className="text-xs text-[#86efac]/90 mt-0.5">
                    سيتم نقل جميع الطلاب المحددين وتحديث بياناتهم في السحابة فوراً
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBulkTransferModalOpen(false);
                  setBulkFeedback(null);
                }}
                className="p-1.5 rounded-lg text-[#86efac] hover:text-white hover:bg-[#022c22] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                  bulkFeedback.type === 'success'
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200'
                    : 'bg-red-500/20 border border-red-500/40 text-red-200'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bulkFeedback.text}</span>
              </div>
            )}

            {/* Selected Students Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#86efac]">
                <span>الطلاب المختارون للنقل ({selectedStudentIds.length}):</span>
                <span className="text-[11px] text-amber-300">
                  {selectedStudentIds.length} طالب
                </span>
              </div>

              <div className="max-h-36 overflow-y-auto bg-[#022c22]/90 border border-[#065f46] rounded-2xl p-2.5 flex flex-wrap gap-1.5">
                {selectedStudentIds.map(sId => {
                  const st = students.find(s => s.id === sId);
                  if (!st) return null;
                  return (
                    <span
                      key={st.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#064e3b] text-white border border-[#065f46] text-xs"
                    >
                      <span className="font-bold">{st.name}</span>
                      <span className="text-[10px] text-[#86efac]">
                        ({st.halaqahName || 'غير مرفق'})
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedStudentIds(prev => prev.filter(id => id !== st.id))}
                        className="text-slate-400 hover:text-red-300 cursor-pointer"
                        title="إزالة من التحديد"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Target Halaqah Select */}
            <form onSubmit={handleBulkTransferSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#86efac] text-right">
                  اختر الحلقة المستهدفة لنقل الطلاب إليها:
                </label>
                <select
                  value={bulkTargetHalaqahId}
                  onChange={e => setBulkTargetHalaqahId(e.target.value)}
                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-3 px-3.5 text-sm text-[#f0f9f6] outline-none cursor-pointer font-bold"
                >
                  <option value="" disabled>-- اختر الحلقة المستهدفة --</option>
                  {halaqahs.map(h => (
                    <option key={h.id} value={h.id} className="bg-[#064e3b] text-white">
                      {h.name} {h.primaryTeacherName ? `(المعلم: ${h.primaryTeacherName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-[#022c22]/60 border border-[#065f46] rounded-xl text-[11px] text-[#86efac]/80 leading-relaxed">
                ℹ️ سيتم نقل جميع الطلاب المحددين إلى الحلقة المختارة سحابياً عبر قاعدة بيانات Firebase، مع الاحتفاظ بكامل سجلات التسميع والتقييمات والخطط اليومية دون أي فقدان.
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isBulkTransferring}
                  onClick={() => {
                    setIsBulkTransferModalOpen(false);
                    setBulkFeedback(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#022c22] text-[#86efac] hover:text-white border border-[#065f46] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isBulkTransferring || selectedStudentIds.length === 0 || !bulkTargetHalaqahId}
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#064e3b] shadow-lg shadow-amber-950/30 cursor-pointer transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isBulkTransferring ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري النقل السحابي...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-4 h-4" />
                      <span>تأكيد نقل {selectedStudentIds.length} طالب سحابياً</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
