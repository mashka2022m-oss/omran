import React, { useState } from 'react';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  Calendar,
  Clock,
  ExternalLink,
  Trash2,
  Edit3,
  Search,
  Eye,
  Check,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  BarChart3,
  RefreshCw,
  Trophy,
  Filter,
  Users,
  Settings,
  AlertCircle,
  BookOpen,
  Send,
  FileSpreadsheet,
  Link,
  ShieldCheck,
  CheckSquare,
  Hourglass,
  Timer,
  Copy,
  AlertTriangle,
  Flame,
  Medal,
  Crown,
  Download
} from 'lucide-react';
import {
  Exam,
  ExamQuestion,
  ExamQuestionType,
  ExamSubmission,
  ExamTimeLimitMode,
  Student,
  Halaqah,
  LeaderboardSettings,
  LeaderboardScope,
  GoogleOAuthConfig
} from '../../types';
import { GoogleWorkspaceService } from '../../lib/googleWorkspace';
import { OmranDataService } from '../../lib/firebase';
import { StudentExamTaker } from '../StudentExamTaker';

interface ExamsTabProps {
  exams: Exam[];
  submissions: ExamSubmission[];
  students: Student[];
  halaqahs: Halaqah[];
  currentUserId: string;
  currentUserName: string;
  isSupervisor: boolean;
  googleAuthConfig?: GoogleOAuthConfig;
  leaderboardSettings?: LeaderboardSettings;
  onSaveExam: (exam: Exam) => Promise<void>;
  onDeleteExam: (examId: string) => Promise<void>;
  onSaveSubmission: (submission: ExamSubmission) => Promise<void>;
  onSaveLeaderboardSettings: (settings: LeaderboardSettings) => Promise<void>;
  onRefreshGoogleAuth?: () => Promise<void>;
}

// Helper to format Arabic date preview
function formatArabicDateTime(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export const ExamsTab: React.FC<ExamsTabProps> = ({
  exams,
  submissions,
  students,
  halaqahs,
  currentUserId,
  currentUserName,
  isSupervisor,
  googleAuthConfig,
  leaderboardSettings = {
    scope: 'all_unified',
    includeExamPoints: true,
    includeEvaluationScores: true,
    updatedAt: new Date().toISOString()
  },
  onSaveExam,
  onDeleteExam,
  onSaveSubmission,
  onSaveLeaderboardSettings,
  onRefreshGoogleAuth
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'exams' | 'submissions' | 'leaderboard' | 'google_sheets'>('exams');
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [selectedExamForSubmissions, setSelectedExamForSubmissions] = useState<string>('all');
  const [filterHalaqah, setFilterHalaqah] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; linkUrl?: string } | null>(null);

  // Deletion Confirmation Modal State
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Correction Modal State
  const [selectedSubmissionForGrading, setSelectedSubmissionForGrading] = useState<ExamSubmission | null>(null);
  const [gradingDraftScores, setGradingDraftScores] = useState<Record<string, number>>({});
  const [gradingDraftFeedbacks, setGradingDraftFeedbacks] = useState<Record<string, string>>({});
  const [gradingGeneralFeedback, setGradingGeneralFeedback] = useState('');

  // Preview / Test Exam State for Teacher
  const [previewingExam, setPreviewingExam] = useState<Exam | null>(null);
  const [previewInteractive, setPreviewInteractive] = useState(false);

  // New Exam Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formScheduleType, setFormScheduleType] = useState<'now' | 'scheduled'>('now');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [formHasDeadline, setFormHasDeadline] = useState(false);
  const [formDeadlineDate, setFormDeadlineDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [formAttemptType, setFormAttemptType] = useState<'unlimited' | 'limited'>('unlimited');
  const [formMaxAttempts, setFormMaxAttempts] = useState(1);
  const [formTimeLimitMode, setFormTimeLimitMode] = useState<ExamTimeLimitMode>('none');
  const [formTotalTimeMinutes, setFormTotalTimeMinutes] = useState<number>(15);
  const [formQuestionTimeSeconds, setFormQuestionTimeSeconds] = useState<number>(30);
  const [formGradeVisibility, setFormGradeVisibility] = useState<'immediate' | 'after_deadline' | 'manual'>('immediate');
  const [formGrantsPoints, setFormGrantsPoints] = useState(true);
  const [formTargetHalaqat, setFormTargetHalaqat] = useState<string[]>(['all']);

  // Questions List in Exam Builder
  const [questions, setQuestions] = useState<ExamQuestion[]>([
    {
      id: 'q-1',
      title: 'ما هي أول سورة نزلت في القرآن الكريم؟',
      type: 'multiple_choice',
      options: ['سورة الفاتحة', 'سورة العلق', 'سورة المدثر', 'سورة البقرة'],
      correctAnswer: 'سورة العلق',
      points: 5,
      explanation: 'نزلت أول خمس آيات من سورة العلق في غار حراء (اقرأ باسم ربك الذي خلق).'
    }
  ]);

  // Open Exam Editor
  const handleOpenCreateModal = (examToEdit?: Exam) => {
    if (examToEdit) {
      setEditingExamId(examToEdit.id);
      setFormTitle(examToEdit.title);
      setFormDescription(examToEdit.description || '');
      setFormScheduleType(examToEdit.scheduleType);
      setFormStartDate(examToEdit.startDate || new Date().toISOString().slice(0, 16));
      setFormHasDeadline(examToEdit.hasDeadline);
      setFormDeadlineDate(examToEdit.deadlineDate || new Date().toISOString().slice(0, 16));
      setFormAttemptType(examToEdit.attemptLimitType);
      setFormMaxAttempts(examToEdit.maxAttempts || 1);
      setFormTimeLimitMode(examToEdit.timeLimitMode || 'none');
      setFormTotalTimeMinutes(examToEdit.totalTimeMinutes || 15);
      setFormQuestionTimeSeconds(examToEdit.questionTimeSeconds || 30);
      setFormGradeVisibility(examToEdit.gradeVisibility);
      setFormGrantsPoints(examToEdit.grantsLeaderboardPoints);
      setFormTargetHalaqat(examToEdit.targetHalaqat || ['all']);
      setQuestions(JSON.parse(JSON.stringify(examToEdit.questions || [])));
    } else {
      setEditingExamId(null);
      setFormTitle('');
      setFormDescription('');
      setFormScheduleType('now');
      setFormStartDate(new Date().toISOString().slice(0, 16));
      setFormHasDeadline(false);
      setFormDeadlineDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
      setFormAttemptType('unlimited');
      setFormMaxAttempts(1);
      setFormTimeLimitMode('none');
      setFormTotalTimeMinutes(15);
      setFormQuestionTimeSeconds(30);
      setFormGradeVisibility('immediate');
      setFormGrantsPoints(true);
      setFormTargetHalaqat(['all']);
      setQuestions([
        {
          id: `q-${Date.now()}-1`,
          title: '',
          type: 'multiple_choice',
          options: ['الخيار 1', 'الخيار 2', 'الخيار 3'],
          correctAnswer: 'الخيار 1',
          points: 5
        }
      ]);
    }
    setIsCreatingExam(true);
  };

  // Add a new question to current exam draft
  const handleAddQuestion = (type: ExamQuestionType = 'multiple_choice') => {
    const newQ: ExamQuestion = {
      id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: '',
      type,
      options: type === 'true_false' ? ['صح', 'خطأ'] : type === 'multiple_choice' ? ['الخيار 1', 'الخيار 2', 'الخيار 3'] : undefined,
      correctAnswer: type === 'true_false' ? 'صح' : type === 'multiple_choice' ? 'الخيار 1' : undefined,
      points: 5
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestion = (qId: string, updates: Partial<ExamQuestion>) => {
    setQuestions(questions.map(q => (q.id === qId ? { ...q, ...updates } : q)));
  };

  const handleRemoveQuestion = (qId: string) => {
    if (questions.length <= 1) {
      alert('يجب أن يحتوي الاختبار على سؤال واحد على الأقل.');
      return;
    }
    setQuestions(questions.filter(q => q.id !== qId));
  };

  // Save Exam directly to Firestore
  const handleSaveExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('يرجى كتابة اسم الاختبار (إلزامي).');
      return;
    }

    if (questions.length === 0) {
      alert('يرجى إضافة سؤال واحد على الأقل للاختبار.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].title.trim()) {
        alert(`يرجى كتابة نص السؤال رقم (${i + 1}).`);
        return;
      }
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
      const examId = editingExamId || `exam-${Date.now()}`;

      const examObj: Exam = {
        id: examId,
        title: formTitle.trim(),
        description: formDescription.trim(),
        scheduleType: formScheduleType,
        startDate: formScheduleType === 'scheduled' ? formStartDate : new Date().toISOString(),
        hasDeadline: formHasDeadline,
        deadlineDate: formHasDeadline ? formDeadlineDate : undefined,
        attemptLimitType: formAttemptType,
        maxAttempts: formAttemptType === 'limited' ? Number(formMaxAttempts) : undefined,
        timeLimitMode: formTimeLimitMode,
        totalTimeMinutes: formTimeLimitMode === 'total' ? Math.max(1, Number(formTotalTimeMinutes)) : undefined,
        questionTimeSeconds: formTimeLimitMode === 'per_question' ? Math.max(5, Number(formQuestionTimeSeconds)) : undefined,
        gradeVisibility: formGradeVisibility,
        grantsLeaderboardPoints: formGrantsPoints,
        totalPoints,
        targetHalaqat: formTargetHalaqat.length > 0 ? formTargetHalaqat : ['all'],
        questions,
        createdById: currentUserId,
        createdByName: currentUserName,
        createdAt: editingExamId
          ? (exams.find(ex => ex.id === editingExamId)?.createdAt || new Date().toISOString())
          : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSaveExam(examObj);
      setIsCreatingExam(false);
      setStatusMessage({
        type: 'success',
        text: `تم حفظ واختبار "${examObj.title}" بنجاح في قاعدة البيانات السحابية وهو متاح للطلاب الآن.`
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      console.error('Error saving exam:', err);
      setStatusMessage({ type: 'error', text: `حدث خطأ أثناء حفظ الاختبار: ${err.message || err}` });
    } finally {
      setIsSaving(false);
    }
  };

  // Perform Real Cloud Deletion
  const handleConfirmDeleteExam = async () => {
    if (!examToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteExam(examToDelete.id);
      setStatusMessage({
        type: 'success',
        text: `تم حذف اختبار "${examToDelete.title}" وكافة بياناته من قاعدة البيانات السحابية بنجاح.`
      });
      setExamToDelete(null);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Error deleting exam:', err);
      setStatusMessage({
        type: 'error',
        text: `حدث خطأ أثناء حذف الاختبار: ${err.message || err}`
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Connect Google Account for Sheets Export
  const handleConnectGoogle = async () => {
    setIsSaving(true);
    try {
      const { email } = await GoogleWorkspaceService.linkGoogleAccount();
      if (onRefreshGoogleAuth) await onRefreshGoogleAuth();
      setStatusMessage({
        type: 'success',
        text: `تم ربط وتفويض حساب Google (${email}) بنجاح لتصدير الجداول سحابياً.`
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      console.error('Google connect error:', err);
      setStatusMessage({
        type: 'error',
        text: `تعذر ربط حساب Google: ${err.message || 'يرجى المحاولة مرة أخرى.'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Export Results to Google Sheets
  const handleExportToGoogleSheet = async (targetExam?: Exam) => {
    const relevantSubmissions = targetExam
      ? submissions.filter(s => s.examId === targetExam.id)
      : submissions;

    if (relevantSubmissions.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'لا توجد تسليمات مسجلة لتصديرها حالياً.'
      });
      setTimeout(() => setStatusMessage(null), 4000);
      return;
    }

    setIsExportingSheets(true);
    setStatusMessage(null);

    try {
      const title = targetExam ? targetExam.title : 'كافة اختبارات المنصة';
      const result = await GoogleWorkspaceService.exportExamResultsToGoogleSheet(title, relevantSubmissions);

      setStatusMessage({
        type: 'success',
        text: `تم إنشاء جدول Google Sheets وتصدير (${relevantSubmissions.length}) تسليم بنجاح!`,
        linkUrl: result.spreadsheetUrl
      });
    } catch (err: any) {
      console.error('Export to Google Sheets error:', err);
      // If not connected, invite to connect or fallback to CSV
      setStatusMessage({
        type: 'error',
        text: err.message || 'تعذر التصدير إلى Google Sheets. يرجى التأكد من ربط حساب Google.'
      });
    } finally {
      setIsExportingSheets(false);
    }
  };

  // Instant CSV / Excel Download Fallback
  const handleDownloadCSV = (targetExam?: Exam) => {
    const relevantSubmissions = targetExam
      ? submissions.filter(s => s.examId === targetExam.id)
      : submissions;

    if (relevantSubmissions.length === 0) {
      alert('لا توجد تسليمات مسجلة للتحميل.');
      return;
    }

    const headers = [
      'اسم الطالب',
      'الحلقة',
      'عنوان الاختبار',
      'رقم المحاولة',
      'تاريخ التسليم',
      'الدرجة المحصلة',
      'الدرجة القصوى',
      'النسبة المئوية',
      'نقاط لوحة الشرف',
      'حالة التصحيح',
      'ملاحظات المعلم'
    ];

    const rows = relevantSubmissions.map(sub => [
      `"${sub.studentName}"`,
      `"${sub.halaqahName || 'الحلقة'}"`,
      `"${sub.examTitle}"`,
      sub.attemptNumber,
      `"${new Date(sub.submittedAt).toLocaleString('ar-SA')}"`,
      sub.totalScoreEarned,
      sub.maxPossibleScore,
      `"${sub.percentage}%"`,
      sub.pointsGrantedForLeaderboard,
      sub.status === 'completed' ? '"معتمد"' : '"بانتظار التصحيح"',
      `"${(sub.teacherGeneralFeedback || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `نتائج_${targetExam ? targetExam.title : 'كافة_الاختبارات'}_عمران.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Submission Grading Modal
  const handleOpenGrading = (sub: ExamSubmission) => {
    setSelectedSubmissionForGrading(sub);
    const initialScores: Record<string, number> = {};
    const initialFeedbacks: Record<string, string> = {};

    sub.answers.forEach(ans => {
      initialScores[ans.questionId] = ans.pointsEarned;
      initialFeedbacks[ans.questionId] = ans.teacherFeedback || '';
    });

    setGradingDraftScores(initialScores);
    setGradingDraftFeedbacks(initialFeedbacks);
    setGradingGeneralFeedback(sub.teacherGeneralFeedback || '');
  };

  // Save Graded Submission
  const handleSaveGrading = async () => {
    if (!selectedSubmissionForGrading) return;
    setIsSaving(true);

    try {
      const updatedAnswers = selectedSubmissionForGrading.answers.map(ans => {
        const assignedScore = gradingDraftScores[ans.questionId] !== undefined
          ? Number(gradingDraftScores[ans.questionId])
          : ans.pointsEarned;
        const feedback = gradingDraftFeedbacks[ans.questionId] || '';

        return {
          ...ans,
          pointsEarned: Math.min(Math.max(0, assignedScore), ans.maxPoints),
          teacherFeedback: feedback
        };
      });

      const totalEarned = updatedAnswers.reduce((sum, a) => sum + a.pointsEarned, 0);
      const maxScore = selectedSubmissionForGrading.maxPossibleScore || 1;
      const percentage = Math.round((totalEarned / maxScore) * 100);

      const updatedSub: ExamSubmission = {
        ...selectedSubmissionForGrading,
        answers: updatedAnswers,
        totalScoreEarned: totalEarned,
        percentage,
        pointsGrantedForLeaderboard: totalEarned,
        status: 'completed',
        gradedAt: new Date().toISOString(),
        gradedByTeacherName: currentUserName,
        teacherGeneralFeedback: gradingGeneralFeedback
      };

      await onSaveSubmission(updatedSub);
      setSelectedSubmissionForGrading(null);
      setStatusMessage({ type: 'success', text: 'تم اعتماد وتصحيح تسليم الطالب وحفظ الدرجات سحابياً بنجاح.' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Error saving submission grading:', err);
      alert('حدث خطأ أثناء حفظ التصحيح.');
    } finally {
      setIsSaving(false);
    }
  };

  // Leaderboard Calculation
  const calculateLeaderboardData = () => {
    const studentScoresMap: Record<string, {
      student: Student;
      totalExamPoints: number;
      completedExamsCount: number;
      bestPercentage: number;
      halaqahName: string;
    }> = {};

    students.forEach(s => {
      studentScoresMap[s.id] = {
        student: s,
        totalExamPoints: 0,
        completedExamsCount: 0,
        bestPercentage: 0,
        halaqahName: s.halaqahName || halaqahs.find(h => h.id === s.halaqahId)?.name || 'الحلقة'
      };
    });

    submissions.forEach(sub => {
      if (studentScoresMap[sub.studentId]) {
        studentScoresMap[sub.studentId].totalExamPoints += (sub.pointsGrantedForLeaderboard || 0);
        studentScoresMap[sub.studentId].completedExamsCount += 1;
        if (sub.percentage > studentScoresMap[sub.studentId].bestPercentage) {
          studentScoresMap[sub.studentId].bestPercentage = sub.percentage;
        }
      }
    });

    const list = Object.values(studentScoresMap);
    list.sort((a, b) => b.totalExamPoints - a.totalExamPoints || b.bestPercentage - a.bestPercentage);
    return list;
  };

  const leaderboardList = calculateLeaderboardData();

  // Filtered Exams
  const filteredExams = exams.filter(ex => {
    if (filterHalaqah !== 'all') {
      const matches = ex.targetHalaqat.includes('all') || ex.targetHalaqat.includes(filterHalaqah);
      if (!matches) return false;
    }
    if (searchQuery.trim()) {
      return ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex.description && ex.description.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return true;
  });

  // Filtered Submissions
  const filteredSubmissions = submissions.filter(sub => {
    if (selectedExamForSubmissions !== 'all' && sub.examId !== selectedExamForSubmissions) return false;
    if (filterHalaqah !== 'all' && sub.halaqahId !== filterHalaqah) return false;
    if (searchQuery.trim()) {
      return sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.examTitle.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#064e3b] via-[#022c22] to-[#064e3b] border border-[#fbbf24]/30 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/40 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>نظام الاختبارات والتقييمات المتكامل</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
              منظومة الاختبارات والتقييمات القرآنية السحابية
            </h2>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-2xl">
              إنشاء اختبارات إلكترونية تفاعلية، تحديد المؤقتات والمحاولات، تصحيح المقالي، مزامنة النتائج سحابياً، وتصديرها إلى Google Sheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleExportToGoogleSheet()}
              disabled={isExportingSheets}
              className="px-4 py-2.5 rounded-2xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 font-bold text-xs sm:text-sm flex items-center gap-2 border border-emerald-600/50 shadow-md transition-all cursor-pointer"
              title="تصدير النتائج إلى جدول Google Sheets"
            >
              <FileSpreadsheet className={`w-4 h-4 text-[#fbbf24] ${isExportingSheets ? 'animate-spin' : ''}`} />
              <span>{isExportingSheets ? 'جارٍ تصدير Sheets...' : 'تصدير إلى Google Sheets'}</span>
            </button>

            <button
              onClick={() => handleOpenCreateModal()}
              className="px-5 py-2.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5 text-[#064e3b]" />
              <span>إنشاء اختبار جديد</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-emerald-800/60">
          <button
            onClick={() => setActiveSubTab('exams')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'exams'
                ? 'bg-[#fbbf24] text-[#064e3b] shadow-md shadow-amber-500/20'
                : 'bg-[#022c22] text-emerald-200 hover:text-white hover:bg-emerald-900/60 border border-emerald-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>قائمة الاختبارات ({exams.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('submissions')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'submissions'
                ? 'bg-[#fbbf24] text-[#064e3b] shadow-md shadow-amber-500/20'
                : 'bg-[#022c22] text-emerald-200 hover:text-white hover:bg-emerald-900/60 border border-emerald-800/60'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>التسليمات والتصحيح ({submissions.length})</span>
            {submissions.filter(s => s.status === 'needs_grading').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'leaderboard'
                ? 'bg-[#fbbf24] text-[#064e3b] shadow-md shadow-amber-500/20'
                : 'bg-[#022c22] text-emerald-200 hover:text-white hover:bg-emerald-900/60 border border-emerald-800/60'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>لوحة الشرف والأوائل</span>
          </button>

          <button
            onClick={() => setActiveSubTab('google_sheets')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'google_sheets'
                ? 'bg-[#fbbf24] text-[#064e3b] shadow-md shadow-amber-500/20'
                : 'bg-[#022c22] text-emerald-200 hover:text-white hover:bg-emerald-900/60 border border-emerald-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Google Sheets</span>
            {googleAuthConfig?.isLinked ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                حساب متصل
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                ربط الحساب
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Status Message Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between gap-3 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>

          {statusMessage.linkUrl && (
            <a
              href={statusMessage.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-[#fbbf24] text-[#064e3b] font-black text-xs flex items-center gap-1.5 shadow-md hover:bg-[#f59e0b] shrink-0"
            >
              <span>فتح جدول Google Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* SUBTAB 1: EXAMS LIST */}
      {activeSubTab === 'exams' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#022c22]/80 border border-[#065f46] p-4 rounded-2xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-emerald-400 absolute right-3.5 top-3.5" />
              <input
                type="text"
                placeholder="بحث باسم الاختبار أو الوصف..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 rounded-xl bg-[#064e3b]/60 border border-[#065f46] text-white text-xs placeholder:text-emerald-300/50 focus:border-[#fbbf24] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-emerald-200 font-bold shrink-0">تصفية الحلقة:</span>
              <select
                value={filterHalaqah}
                onChange={e => setFilterHalaqah(e.target.value)}
                className="text-xs text-emerald-100 bg-[#064e3b]/80 border border-[#065f46] rounded-xl px-3 py-2 focus:border-[#fbbf24] focus:outline-none cursor-pointer"
              >
                <option value="all">جميع الحلقات</option>
                {halaqahs.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exams Grid */}
          {filteredExams.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-[#022c22]/50 border border-[#065f46] space-y-3">
              <FileText className="w-14 h-14 text-emerald-500/40 mx-auto" />
              <h3 className="text-base font-bold text-white">لا توجد اختبارات مسجلة حالياً</h3>
              <p className="text-xs text-emerald-200/70 max-w-sm mx-auto">
                قم بالضغط على زر "إنشاء اختبار جديد" لإعداد اختبار إلكتروني تفاعلي للطلاب في المنصة.
              </p>
              <button
                onClick={() => handleOpenCreateModal()}
                className="px-5 py-2 rounded-xl bg-[#fbbf24] text-[#064e3b] font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء اختبار الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredExams.map(exam => {
                const examSubmissions = submissions.filter(s => s.examId === exam.id);
                const isExpired = exam.hasDeadline && exam.deadlineDate && new Date(exam.deadlineDate) < new Date();

                return (
                  <div
                    key={exam.id}
                    className="rounded-3xl bg-[#022c22]/90 border border-[#065f46] p-5 shadow-xl hover:border-[#fbbf24]/50 transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isExpired ? (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-600/40">
                              انتهى موعد التسليم
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              متاح ونشط للطلاب
                            </span>
                          )}

                          {exam.grantsLeaderboardPoints && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <Award className="w-3 h-3 text-amber-400" />
                              {exam.totalPoints} نقطة شرف
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-emerald-300/80 font-bold">
                          {exam.questions.length} أسئلة • {exam.totalPoints} درجة
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-bold text-white line-clamp-1">{exam.title}</h3>
                      {exam.description && (
                        <p className="text-xs text-emerald-200/80 mt-1 line-clamp-2">{exam.description}</p>
                      )}

                      {/* Info Pills */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-emerald-900/60 text-[11px] text-emerald-200/90">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            المحاولات: {exam.attemptLimitType === 'limited' ? `${exam.maxAttempts} محاولات` : 'غير محدود'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Hourglass className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            {exam.timeLimitMode === 'total'
                              ? `الوقت: ${exam.totalTimeMinutes || 15} دقيقة`
                              : exam.timeLimitMode === 'per_question'
                              ? `الوقت: ${exam.questionTimeSeconds || 30} ث/سؤال`
                              : 'الوقت: غير مقيد'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            {exam.hasDeadline && exam.deadlineDate
                              ? `الانتهاء: ${formatArabicDateTime(exam.deadlineDate)}`
                              : 'متاح دائماً'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            التسليمات: {examSubmissions.length} طالب
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            النتيجة: {exam.gradeVisibility === 'immediate' ? 'فوري' : exam.gradeVisibility === 'after_deadline' ? 'بعد الانتهاء' : 'بعد التصحيح'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            {exam.targetHalaqat.includes('all') ? 'جميع الحلقات' : `${exam.targetHalaqat.length} حلقات`}
                          </span>
                        </div>
                      </div>

                      {/* Google Sheets Export Actions for this exam */}
                      <div className="mt-4 pt-3 border-t border-emerald-900/60 flex flex-wrap items-center justify-between gap-2">
                        <button
                          onClick={() => handleExportToGoogleSheet(exam)}
                          disabled={isExportingSheets}
                          className="text-[11px] px-3 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 flex items-center gap-1.5 transition-all cursor-pointer font-bold"
                          title="تصدير نتائج هذا الاختبار إلى Google Sheets"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-[#fbbf24]" />
                          <span>تصدير لـ Google Sheets</span>
                        </button>

                        <button
                          onClick={() => handleDownloadCSV(exam)}
                          className="text-[11px] px-3 py-1.5 rounded-xl bg-[#064e3b] hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 flex items-center gap-1.5 transition-all cursor-pointer"
                          title="تحميل النتائج كملف Excel / CSV"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>تحميل CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-emerald-900/80">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewingExam(exam)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-700 text-emerald-100 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#fbbf24]" />
                          <span>معاينة وتجربة</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedExamForSubmissions(exam.id);
                            setActiveSubTab('submissions');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#064e3b] hover:bg-emerald-800 text-[#fbbf24] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>التسليمات ({examSubmissions.length})</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenCreateModal(exam)}
                          className="p-2 rounded-xl text-emerald-300 hover:text-[#fbbf24] hover:bg-emerald-900/60 transition-all cursor-pointer"
                          title="تعديل الاختبار"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExamToDelete(exam)}
                          className="p-2 rounded-xl text-rose-300 hover:text-rose-100 hover:bg-rose-950/60 transition-all cursor-pointer"
                          title="حذف الاختبار"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: SUBMISSIONS & GRADING */}
      {activeSubTab === 'submissions' && (
        <div className="space-y-4">
          {/* Submissions Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#022c22]/80 border border-[#065f46] p-4 rounded-2xl">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-200 font-bold shrink-0">تحديد الاختبار:</span>
                <select
                  value={selectedExamForSubmissions}
                  onChange={e => setSelectedExamForSubmissions(e.target.value)}
                  className="text-xs text-emerald-100 bg-[#064e3b]/80 border border-[#065f46] rounded-xl px-3 py-2 focus:border-[#fbbf24] focus:outline-none cursor-pointer"
                >
                  <option value="all">جميع الاختبارات</option>
                  {exams.map(ex => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-200 font-bold shrink-0">الحلقة:</span>
                <select
                  value={filterHalaqah}
                  onChange={e => setFilterHalaqah(e.target.value)}
                  className="text-xs text-emerald-100 bg-[#064e3b]/80 border border-[#065f46] rounded-xl px-3 py-2 focus:border-[#fbbf24] focus:outline-none cursor-pointer"
                >
                  <option value="all">جميع الحلقات</option>
                  {halaqahs.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleExportToGoogleSheet()}
                disabled={isExportingSheets}
                className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileSpreadsheet className={`w-3.5 h-3.5 text-[#fbbf24] ${isExportingSheets ? 'animate-spin' : ''}`} />
                <span>تصدير لـ Google Sheets</span>
              </button>

              <button
                onClick={() => handleDownloadCSV()}
                className="px-3 py-2 rounded-xl bg-[#064e3b] hover:bg-emerald-800 text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>تحميل Excel / CSV</span>
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-emerald-400 absolute right-3.5 top-3.5" />
              <input
                type="text"
                placeholder="بحث باسم الطالب أو الاختبار..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 rounded-xl bg-[#064e3b]/60 border border-[#065f46] text-white text-xs placeholder:text-emerald-300/50 focus:border-[#fbbf24] focus:outline-none"
              />
            </div>
          </div>

          {/* Submissions List */}
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-[#022c22]/50 border border-[#065f46] space-y-3">
              <CheckSquare className="w-14 h-14 text-emerald-500/40 mx-auto" />
              <h3 className="text-base font-bold text-white">لا توجد تسليمات مسجلة لهذا الاختبار</h3>
              <p className="text-xs text-emerald-200/70 max-w-sm mx-auto">
                عندما يُرسل الطلاب إجاباتهم عبر المنصة، ستظهر محاولاتهم وإجاباتهم هنا للتصحيح واعتماد الدرجات سحابياً.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-[#065f46] bg-[#022c22]/80">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#064e3b] text-emerald-100 border-b border-[#065f46] font-bold">
                  <tr>
                    <th className="p-4">اسم الطالب</th>
                    <th className="p-4">الاختبار</th>
                    <th className="p-4">الحلقة</th>
                    <th className="p-4">المحاولة</th>
                    <th className="p-4">تاريخ التسليم</th>
                    <th className="p-4">الدرجة والنقاط</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/40 text-emerald-100">
                  {filteredSubmissions.map(sub => {
                    const hasPendingEssay = sub.answers.some(a => a.questionType === 'essay' && sub.status === 'needs_grading');

                    return (
                      <tr key={sub.id} className="hover:bg-emerald-900/30 transition-all">
                        <td className="p-4 font-bold text-white">{sub.studentName}</td>
                        <td className="p-4 text-emerald-200">{sub.examTitle}</td>
                        <td className="p-4 text-emerald-300/80">{sub.halaqahName}</td>
                        <td className="p-4 font-semibold text-amber-300">#{sub.attemptNumber}</td>
                        <td className="p-4 text-emerald-300/80">
                          {formatArabicDateTime(sub.submittedAt)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-[#fbbf24] text-sm">{sub.totalScoreEarned}</span>
                            <span className="text-emerald-400 text-xs">/ {sub.maxPossibleScore}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-200">
                              {sub.percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          {hasPendingEssay ? (
                            <span className="text-[10px] px-2 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-600/40 font-bold">
                              بانتظار تصحيح المقالي
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/40 font-bold">
                              مكتمل ومصحح
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenGrading(sub)}
                            className="px-3 py-1.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-xs transition-all cursor-pointer shadow-md"
                          >
                            تصحيح ومراجعة
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: LEADERBOARD & RANKINGS */}
      {activeSubTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Supervisor Controls Banner */}
          {isSupervisor && (
            <div className="p-5 rounded-3xl bg-[#022c22] border border-[#fbbf24]/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-[#fbbf24]">
                  <Settings className="w-4 h-4" />
                  <span>إعدادات المشرف للوحة الشرف والترتيب العام</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs text-emerald-200 font-bold mb-1">
                    نطاق لوحة الشرف بين الحلقات:
                  </label>
                  <select
                    value={leaderboardSettings.scope}
                    onChange={async e => {
                      const newSettings: LeaderboardSettings = {
                        ...leaderboardSettings,
                        scope: e.target.value as LeaderboardScope,
                        updatedAt: new Date().toISOString()
                      };
                      await onSaveLeaderboardSettings(newSettings);
                    }}
                    className="w-full text-xs text-emerald-100 bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2.5 focus:border-[#fbbf24] focus:outline-none cursor-pointer"
                  >
                    <option value="all_unified">جميع الحلقات في صعيد واحد (ترتيب عام موحد)</option>
                    <option value="per_halaqah">كل حلقة منفصلة لحالها في لوحة الشرف</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-2 text-xs text-emerald-100 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={leaderboardSettings.includeExamPoints}
                      onChange={async e => {
                        const newSettings = {
                          ...leaderboardSettings,
                          includeExamPoints: e.target.checked,
                          updatedAt: new Date().toISOString()
                        };
                        await onSaveLeaderboardSettings(newSettings);
                      }}
                      className="rounded accent-emerald-500 w-4 h-4"
                    />
                    <span>احتساب نقاط الاختبارات في لوحة الشرف</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Cards */}
          <div className="rounded-3xl border border-[#065f46] bg-[#022c22]/90 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#fbbf24]" />
                <span>لوحة شرف الأبطال المتصدرين في الاختبارات والنقاط</span>
              </h3>
              <span className="text-xs text-emerald-300/80 font-bold">
                {leaderboardList.length} طالب مسجل
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {leaderboardList.slice(0, 20).map((item, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;
                const isThird = idx === 2;

                return (
                  <div
                    key={item.student.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isFirst
                        ? 'bg-amber-950/40 border-[#fbbf24] shadow-lg shadow-amber-500/10'
                        : isSecond
                        ? 'bg-emerald-900/40 border-emerald-400/50'
                        : isThird
                        ? 'bg-emerald-950/60 border-emerald-600/40'
                        : 'bg-[#064e3b]/30 border-emerald-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                          isFirst
                            ? 'bg-[#fbbf24] text-[#064e3b] shadow-md'
                            : isSecond
                            ? 'bg-emerald-400 text-[#064e3b]'
                            : isThird
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                        }`}
                      >
                        {isFirst ? <Crown className="w-4 h-4 text-[#064e3b]" /> : idx + 1}
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{item.student.name}</span>
                          {isFirst && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fbbf24] text-[#064e3b] font-black flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              الأول على المركز
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-emerald-300/80 mt-0.5">
                          {item.halaqahName} • أنجز {item.completedExamsCount} اختبارات
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <div className="text-base font-black text-[#fbbf24]">
                          {item.totalExamPoints}{' '}
                          <span className="text-[11px] font-normal text-emerald-300">نقطة</span>
                        </div>
                        <div className="text-[10px] text-emerald-400">
                          أعلى نسبة: {item.bestPercentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: GOOGLE SHEETS EXPORT */}
      {activeSubTab === 'google_sheets' && (
        <div className="p-6 rounded-3xl border border-[#065f46] bg-[#022c22]/90 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#fbbf24]" />
                <span>تصدير بيانات ونتائج الاختبارات إلى Google Sheets</span>
              </h3>
              <p className="text-xs text-emerald-200/80 mt-1 max-w-xl">
                قم بربط حساب Google لتوليد جداول إلكترونية متزامنة سحابياً فورياً لدرجات الطلاب ونتائج الاختبارات والتقييمات، مع إمكانية التحميل المباشر بصيغة Excel/CSV.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleConnectGoogle}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-emerald-600/50 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#fbbf24]" />
                <span>{googleAuthConfig?.isLinked ? 'تحديث ربط حساب Google' : 'ربط حساب Google'}</span>
              </button>

              <button
                onClick={() => handleExportToGoogleSheet()}
                disabled={isExportingSheets}
                className="px-5 py-2.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تصدير كافة النتائج الآن</span>
              </button>
            </div>
          </div>

          {/* Connection Status Card */}
          <div className="p-5 rounded-2xl bg-[#064e3b]/50 border border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  googleAuthConfig?.isLinked ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <div>
                <h4 className="text-xs font-bold text-white">
                  حالة الاتصال: {googleAuthConfig?.isLinked ? 'متصل ومحفوظ سحابياً' : 'غير متصل'}
                </h4>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">
                  {googleAuthConfig?.connectedEmail || 'لم يتم ربط بريد إلكتروني بعد (يمكنك التصدير كملف CSV محلياً بدون ربط)'}
                </p>
              </div>
            </div>

            {googleAuthConfig?.connectedAt && (
              <span className="text-[10px] text-emerald-400/80">
                تاريخ الربط: {formatArabicDateTime(googleAuthConfig.connectedAt)}
              </span>
            )}
          </div>

          {/* Quick Export Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-[#064e3b]/30 border border-emerald-800/80 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>تصدير كافة تسليمات المنصة ({submissions.length} تسليم)</span>
              </h4>
              <p className="text-xs text-emerald-300/80">
                توليد جدول شامل يحتوي على اسم الطالب، الحلقة، اسم الاختبار، رقم المحاولة، والدرجات المحصلة.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleExportToGoogleSheet()}
                  disabled={isExportingSheets}
                  className="px-4 py-2 rounded-xl bg-[#fbbf24] text-[#064e3b] text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer hover:bg-[#f59e0b]"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>تصدير إلى Google Sheets</span>
                </button>
                <button
                  onClick={() => handleDownloadCSV()}
                  className="px-4 py-2 rounded-xl bg-emerald-900 text-emerald-200 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-800 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل ملف CSV</span>
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#064e3b]/30 border border-emerald-800/80 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#fbbf24]" />
                <span>الحفظ السحابي التلقائي (Firebase)</span>
              </h4>
              <p className="text-xs text-emerald-300/80">
                كافة الاختبارات والأسئلة والتسليمات ودرجات الطلاب محفوظة سحابياً في Firestore ويتم مزامنتها لحظياً دون الحاجة لأي حفظ يدوي.
              </p>
              <div className="pt-2 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>قاعدة البيانات السحابية تعمل بنجاح وبأعلى كفاءة</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT EXAM MODAL */}
      {isCreatingExam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#022c22] border border-[#065f46] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#fbbf24]" />
                  <span>{editingExamId ? 'تعديل بيانات الاختبار' : 'إنشاء وتجهيز اختبار إلكتروني جديد'}</span>
                </h3>
                <p className="text-xs text-emerald-300/80 mt-1">
                  إعداد أسئلة الاختبار، التوقيت، الحلقات المستهدفة والمحاولات سحابياً
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingExam(false)}
                className="p-2 rounded-xl text-emerald-300 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExamSubmit} className="space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-emerald-200 mb-1">
                    اسم / عنوان الاختبار <span className="text-rose-400">* (إلزامي)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الاختبار الفصلي في جزء عم - أحكام التجويد"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#064e3b] border border-[#065f46] text-white text-xs placeholder:text-emerald-300/50 focus:border-[#fbbf24] focus:outline-none font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-emerald-200 mb-1">
                    وصف أو تعليمات الاختبار
                  </label>
                  <textarea
                    rows={2}
                    placeholder="تعليمات الاختبار، المنهج المحدد، أو تنبيهات هامة للطلاب..."
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-[#064e3b] border border-[#065f46] text-white text-xs placeholder:text-emerald-300/50 focus:border-[#fbbf24] focus:outline-none"
                  />
                </div>

                {/* Scheduling */}
                <div>
                  <label className="block text-xs font-bold text-emerald-200 mb-1">
                    موعد ظهور الاختبار للطلاب
                  </label>
                  <select
                    value={formScheduleType}
                    onChange={e => setFormScheduleType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#064e3b] border border-[#065f46] text-white text-xs focus:border-[#fbbf24] focus:outline-none cursor-pointer"
                  >
                    <option value="now">يظهر الآن مباشرة للطلاب</option>
                    <option value="scheduled">مجدول (تاريخ ووقت محدد للظهور)</option>
                  </select>
                </div>

                {formScheduleType === 'scheduled' && (
                  <div>
                    <label className="block text-xs font-bold text-[#fbbf24] mb-1">
                      تاريخ ووقت ظهور الاختبار:
                    </label>
                    <input
                      type="datetime-local"
                      value={formStartDate}
                      onChange={e => setFormStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#064e3b] border border-[#fbbf24]/50 text-white text-xs focus:border-[#fbbf24] focus:outline-none"
                    />
                  </div>
                )}

                {/* Deadline */}
                <div>
                  <label className="block text-xs font-bold text-emerald-200 mb-1">
                    موعد انتهاء الاختبار
                  </label>
                  <select
                    value={formHasDeadline ? 'deadline' : 'forever'}
                    onChange={e => setFormHasDeadline(e.target.value === 'deadline')}
                    className="w-full px-3 py-2 rounded-xl bg-[#064e3b] border border-[#065f46] text-white text-xs focus:border-[#fbbf24] focus:outline-none cursor-pointer"
                  >
                    <option value="forever">متاح للأبد (بدون موعد انتهاء)</option>
                    <option value="deadline">له موعد انتهاء محدد وبعدها يقفل</option>
                  </select>
                </div>

                {formHasDeadline && (
                  <div>
                    <label className="block text-xs font-bold text-[#fbbf24] mb-1">
                      تاريخ ووقت انتهاء الاختبار:
                    </label>
                    <input
                      type="datetime-local"
                      value={formDeadlineDate}
                      onChange={e => setFormDeadlineDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#064e3b] border border-[#fbbf24]/50 text-white text-xs focus:border-[#fbbf24] focus:outline-none"
                    />
                  </div>
                )}

                {/* Attempts */}
                <div>
                  <label className="block text-xs font-bold text-emerald-200 mb-1">
                    عدد المحاولات المسموحة لكل طالب
                  </label>
                  <select
                    value={formAttemptType}
                    onChange={e => setFormAttemptType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#064e3b] border border-[#065f46] text-white text-xs focus:border-[#fbbf24] focus:outline-none cursor-pointer"
                  >
                    <option value="unlimited">محاولات غير محدودة</option>
                    <option value="limited">عدد محاولات محدد فقط</option>
                  </select>
                </div>

                {formAttemptType === 'limited' && (
                  <div>
                    <label className="block text-xs font-bold text-[#fbbf24] mb-1">
                      أقصى عدد محاولات مسموح بها:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={formMaxAttempts}
                      onChange={e => setFormMaxAttempts(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-xl bg-[#064e3b] border border-[#065f46] text-white text-xs focus:border-[#fbbf24] focus:outline-none font-bold"
                    />
                  </div>
                )}

                {/* Grade Visibility */}
                <div>
                  <label className="block text-xs font-bold text-emerald-200 mb-1">
                    ظهور النتيجة للطالب بعد الحل
                  </label>
                  <select
                    value={formGradeVisibility}
                    onChange={e => setFormGradeVisibility(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#064e3b] border border-[#065f46] text-white text-xs focus:border-[#fbbf24] focus:outline-none cursor-pointer"
                  >
                    <option value="immediate">مباشرة وفوري بعد التسليم</option>
                    <option value="after_deadline">بعد نهاية موعد الاختبار</option>
                    <option value="manual">بعد تصحيح واعتماد المعلم للمقالي</option>
                  </select>
                </div>
              </div>

              {/* Exam Timing & Duration Settings */}
              <div className="p-5 rounded-2xl bg-[#064e3b]/60 border border-[#065f46] space-y-4">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-[#fbbf24]" />
                  <div>
                    <h4 className="text-xs font-bold text-white">خيارات توقيت ومدة الاختبار (Timer)</h4>
                    <p className="text-[11px] text-emerald-300/80">
                      يمكنك جعل الاختبار مفتوحاً بدون وقت، أو تحديد وقت كلي للاختبار، أو وقت محدد لكل سؤال
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormTimeLimitMode('none')}
                    className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                      formTimeLimitMode === 'none'
                        ? 'bg-[#fbbf24] text-[#064e3b] border-[#fbbf24] shadow-md font-bold'
                        : 'bg-[#022c22] border-emerald-800 text-emerald-200 hover:bg-emerald-900/50'
                    }`}
                  >
                    <div className="text-xs font-black mb-1">بدون مؤقت زمني</div>
                    <div className={`text-[10px] ${formTimeLimitMode === 'none' ? 'text-emerald-950 font-semibold' : 'text-emerald-400/80'}`}>
                      يحل الطالب الاختبار بأريحية تامة دون عد تنازلي.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTimeLimitMode('total')}
                    className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                      formTimeLimitMode === 'total'
                        ? 'bg-[#fbbf24] text-[#064e3b] border-[#fbbf24] shadow-md font-bold'
                        : 'bg-[#022c22] border-emerald-800 text-emerald-200 hover:bg-emerald-900/50'
                    }`}
                  >
                    <div className="text-xs font-black mb-1">وقت كلي لكامل الاختبار</div>
                    <div className={`text-[10px] ${formTimeLimitMode === 'total' ? 'text-emerald-950 font-semibold' : 'text-emerald-400/80'}`}>
                      مؤقت عام ينتهي عنده الاختبار ويُسلم تلقائياً.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTimeLimitMode('per_question')}
                    className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                      formTimeLimitMode === 'per_question'
                        ? 'bg-[#fbbf24] text-[#064e3b] border-[#fbbf24] shadow-md font-bold'
                        : 'bg-[#022c22] border-emerald-800 text-emerald-200 hover:bg-emerald-900/50'
                    }`}
                  >
                    <div className="text-xs font-black mb-1">وقت مخصص لكل سؤال</div>
                    <div className={`text-[10px] ${formTimeLimitMode === 'per_question' ? 'text-emerald-950 font-semibold' : 'text-emerald-400/80'}`}>
                      عداد ثوانٍ لكل سؤال، ينتقل تلقائياً للسؤال التالي.
                    </div>
                  </button>
                </div>

                {formTimeLimitMode === 'total' && (
                  <div className="p-3.5 rounded-xl bg-[#022c22] border border-emerald-700/60 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-[#fbbf24]">
                        إجمالي وقت الاختبار (بالدقائق):
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[5, 10, 15, 20, 30, 45, 60].map(mins => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setFormTotalTimeMinutes(mins)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              formTotalTimeMinutes === mins
                                ? 'bg-[#fbbf24] text-[#064e3b]'
                                : 'bg-emerald-900/70 text-emerald-300 hover:bg-emerald-800'
                            }`}
                          >
                            {mins}د
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={300}
                        value={formTotalTimeMinutes}
                        onChange={e => setFormTotalTimeMinutes(Math.max(1, Number(e.target.value)))}
                        className="w-28 px-3 py-1.5 rounded-lg bg-[#064e3b] border border-[#065f46] text-white text-xs text-center font-bold focus:border-[#fbbf24] focus:outline-none"
                      />
                      <span className="text-xs text-emerald-300">دقيقة (سيتم تسليم الاختبار تلقائياً بعد انتهاء هذه المدة)</span>
                    </div>
                  </div>
                )}

                {formTimeLimitMode === 'per_question' && (
                  <div className="p-3.5 rounded-xl bg-[#022c22] border border-emerald-700/60 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-[#fbbf24]">
                        الوقت الافتراضي لكل سؤال (بالثواني):
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[15, 20, 30, 45, 60, 90, 120].map(secs => (
                          <button
                            key={secs}
                            type="button"
                            onClick={() => setFormQuestionTimeSeconds(secs)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              formQuestionTimeSeconds === secs
                                ? 'bg-[#fbbf24] text-[#064e3b]'
                                : 'bg-emerald-900/70 text-emerald-300 hover:bg-emerald-800'
                            }`}
                          >
                            {secs}ث
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={5}
                        max={600}
                        value={formQuestionTimeSeconds}
                        onChange={e => setFormQuestionTimeSeconds(Math.max(5, Number(e.target.value)))}
                        className="w-28 px-3 py-1.5 rounded-lg bg-[#064e3b] border border-[#065f46] text-white text-xs text-center font-bold focus:border-[#fbbf24] focus:outline-none"
                      />
                      <span className="text-xs text-emerald-300">ثانية لكل سؤال (يمكنك تخصيص وقت استثنائي لأي سؤال أدناه)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Target Halaqat Selection */}
              <div className="p-4 rounded-2xl bg-[#064e3b]/50 border border-[#065f46] space-y-2">
                <label className="block text-xs font-bold text-[#fbbf24]">
                  تحديد الحلقات المستهدفة للاختبار
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFormTargetHalaqat(['all'])}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      formTargetHalaqat.includes('all')
                        ? 'bg-[#fbbf24] text-[#064e3b]'
                        : 'bg-emerald-900/60 text-emerald-200 border border-emerald-700'
                    }`}
                  >
                    جميع الحلقات
                  </button>

                  {halaqahs.map(h => {
                    const isSelected = formTargetHalaqat.includes(h.id);
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          let next = formTargetHalaqat.filter(x => x !== 'all');
                          if (isSelected) {
                            next = next.filter(x => x !== h.id);
                            if (next.length === 0) next = ['all'];
                          } else {
                            next.push(h.id);
                          }
                          setFormTargetHalaqat(next);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected && !formTargetHalaqat.includes('all')
                            ? 'bg-[#fbbf24] text-[#064e3b]'
                            : 'bg-emerald-900/60 text-emerald-200 border border-emerald-700'
                        }`}
                      >
                        {h.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-4 pt-4 border-t border-emerald-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#fbbf24]" />
                    <span>أسئلة الاختبار ({questions.length})</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('multiple_choice')}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-800 text-emerald-100 text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>اختيار من متعدد</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('true_false')}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-800 text-emerald-100 text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>صح وخطأ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('essay')}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-800 text-emerald-100 text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>سؤال مقالي</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl bg-[#064e3b]/40 border border-emerald-700/80 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#fbbf24]">
                          السؤال {idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-emerald-300">الدرجات:</span>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={q.points}
                            onChange={e =>
                              handleUpdateQuestion(q.id, { points: Math.max(1, Number(e.target.value)) })
                            }
                            className="w-16 px-2 py-1 rounded bg-[#022c22] border border-[#065f46] text-white text-xs text-center font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(q.id)}
                            className="p-1.5 rounded-lg text-rose-300 hover:bg-rose-950/60"
                            title="حذف السؤال"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="اكتب نص السؤال هنا..."
                        value={q.title}
                        onChange={e => handleUpdateQuestion(q.id, { title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#022c22] border border-[#065f46] text-white text-xs focus:border-[#fbbf24] focus:outline-none"
                      />

                      {/* Multiple Choice Options */}
                      {q.type === 'multiple_choice' && (
                        <div className="space-y-2 pt-1">
                          <span className="text-[11px] text-emerald-300 font-bold block">
                            الخيارات (حدد الإجابة الصحيحة):
                          </span>
                          {(q.options || []).map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={q.correctAnswer === opt}
                                onChange={() => handleUpdateQuestion(q.id, { correctAnswer: opt })}
                                className="accent-amber-400 w-4 h-4 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={e => {
                                  const nextOptions = [...(q.options || [])];
                                  const oldVal = nextOptions[oIdx];
                                  nextOptions[oIdx] = e.target.value;
                                  const updates: Partial<ExamQuestion> = { options: nextOptions };
                                  if (q.correctAnswer === oldVal) {
                                    updates.correctAnswer = e.target.value;
                                  }
                                  handleUpdateQuestion(q.id, updates);
                                }}
                                className="flex-1 px-3 py-1.5 rounded-lg bg-[#022c22] border border-[#065f46] text-white text-xs"
                              />
                              {(q.options || []).length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextOptions = (q.options || []).filter((_, i) => i !== oIdx);
                                    handleUpdateQuestion(q.id, {
                                      options: nextOptions,
                                      correctAnswer: q.correctAnswer === opt ? nextOptions[0] : q.correctAnswer
                                    });
                                  }}
                                  className="p-1 text-rose-400 hover:text-rose-200"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const nextOptions = [...(q.options || []), `الخيار ${(q.options || []).length + 1}`];
                              handleUpdateQuestion(q.id, { options: nextOptions });
                            }}
                            className="text-[11px] text-[#fbbf24] hover:underline font-bold pt-1 block cursor-pointer"
                          >
                            + إضافة خيار جديد
                          </button>
                        </div>
                      )}

                      {/* True / False Options */}
                      {q.type === 'true_false' && (
                        <div className="flex items-center gap-4 pt-1">
                          <span className="text-[11px] text-emerald-300 font-bold">الإجابة الصحيحة:</span>
                          <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer">
                            <input
                              type="radio"
                              name={`correct-tf-${q.id}`}
                              checked={q.correctAnswer === 'صح'}
                              onChange={() => handleUpdateQuestion(q.id, { correctAnswer: 'صح' })}
                              className="accent-amber-400"
                            />
                            <span>صح</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer">
                            <input
                              type="radio"
                              name={`correct-tf-${q.id}`}
                              checked={q.correctAnswer === 'خطأ'}
                              onChange={() => handleUpdateQuestion(q.id, { correctAnswer: 'خطأ' })}
                              className="accent-amber-400"
                            />
                            <span>خطأ</span>
                          </label>
                        </div>
                      )}

                      {/* Essay Info */}
                      {q.type === 'essay' && (
                        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200">
                          هذا السؤال مقالي (كتابي)، سيقوم المعلم بمراجعته وتصحيحه يدوياً في قسم التسليمات.
                        </div>
                      )}

                      <div>
                        <input
                          type="text"
                          placeholder="توضيح أو تغذية راجعة للإجابة الصحيحة (اختياري)..."
                          value={q.explanation || ''}
                          onChange={e => handleUpdateQuestion(q.id, { explanation: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#022c22]/70 border border-emerald-900 text-emerald-100 text-xs placeholder:text-emerald-500/50"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-emerald-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingExam(false)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-900/60 text-emerald-200 text-xs font-bold hover:bg-emerald-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#fbbf24] text-[#064e3b] text-xs font-black shadow-lg hover:bg-[#f59e0b] cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSaving ? 'جارٍ الحفظ السحابي...' : 'حفظ ونشر الاختبار الآن'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#022c22] border border-rose-600/50 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-950 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تأكيد حذف الاختبار سحابياً</h3>
              <p className="text-xs text-rose-200/80 mt-1">
                هل أنت متأكد من رغبتك في حذف اختبار "{examToDelete.title}"؟ سيتم حذفه نهائياً من قاعدة البيانات السحابية.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setExamToDelete(null)}
                className="px-4 py-2 rounded-xl bg-emerald-900/60 text-emerald-200 text-xs font-bold cursor-pointer hover:bg-emerald-800"
              >
                تراجع
              </button>
              <button
                onClick={handleConfirmDeleteExam}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg cursor-pointer"
              >
                {isDeleting ? 'جارٍ الحذف...' : 'نعم، حذف الاختبار'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSION GRADING MODAL */}
      {selectedSubmissionForGrading && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#022c22] border border-[#065f46] rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-[#fbbf24]" />
                  <span>تصحيح تسليم الطالب: {selectedSubmissionForGrading.studentName}</span>
                </h3>
                <p className="text-xs text-emerald-300/80 mt-1">
                  الاختبار: {selectedSubmissionForGrading.examTitle} • المحاولة رقم #{selectedSubmissionForGrading.attemptNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmissionForGrading(null)}
                className="p-2 rounded-xl text-emerald-300 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Questions Inspection */}
            <div className="space-y-4">
              {selectedSubmissionForGrading.answers.map((ans, idx) => (
                <div
                  key={ans.questionId}
                  className="p-4 rounded-2xl bg-[#064e3b]/40 border border-emerald-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      س {idx + 1}: {ans.questionTitle}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-emerald-300">الدرجة:</span>
                      <input
                        type="number"
                        min={0}
                        max={ans.maxPoints}
                        value={gradingDraftScores[ans.questionId] ?? ans.pointsEarned}
                        onChange={e =>
                          setGradingDraftScores({
                            ...gradingDraftScores,
                            [ans.questionId]: Number(e.target.value)
                          })
                        }
                        className="w-16 px-2 py-1 rounded bg-[#022c22] border border-[#065f46] text-white text-xs text-center font-bold"
                      />
                      <span className="text-xs text-emerald-400">/ {ans.maxPoints}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#022c22] border border-emerald-900/60 text-xs">
                    <span className="text-emerald-400 font-bold block mb-1">إجابة الطالب:</span>
                    <p className="text-white whitespace-pre-wrap">{ans.studentAnswer || 'لم تتم الإجابة'}</p>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="ملاحظات وتوجيه المعلم على هذا السؤال..."
                      value={gradingDraftFeedbacks[ans.questionId] || ''}
                      onChange={e =>
                        setGradingDraftFeedbacks({
                          ...gradingDraftFeedbacks,
                          [ans.questionId]: e.target.value
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#022c22] border border-emerald-900 text-emerald-100 text-xs placeholder:text-emerald-500/50"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* General Feedback */}
            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                توجيه وكلمة عامة للطالب على المحاولة:
              </label>
              <textarea
                rows={2}
                placeholder="أحسنت يا بطل، بارك الله فيك ونفع بك..."
                value={gradingGeneralFeedback}
                onChange={e => setGradingGeneralFeedback(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#064e3b] border border-[#065f46] text-white text-xs focus:border-[#fbbf24] focus:outline-none"
              />
            </div>

            {/* Save Grading Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-emerald-800">
              <button
                type="button"
                onClick={() => setSelectedSubmissionForGrading(null)}
                className="px-4 py-2 rounded-xl bg-emerald-900/60 text-emerald-200 text-xs font-bold"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={handleSaveGrading}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-[#fbbf24] text-[#064e3b] text-xs font-black shadow-lg cursor-pointer"
              >
                اعتماد وتحديث الدرجات سحابياً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW / TEST EXAM MODAL FOR TEACHER */}
      {previewingExam && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#022c22] border border-[#fbbf24]/50 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#fbbf24] text-[#064e3b] font-black">
                    معاينة المعلم
                  </span>
                  {previewingExam.timeLimitMode === 'total' && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-800 text-amber-300 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      مؤقت كلي: {previewingExam.totalTimeMinutes || 15} دقيقة
                    </span>
                  )}
                  {previewingExam.timeLimitMode === 'per_question' && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-800 text-amber-300 font-bold flex items-center gap-1">
                      <Hourglass className="w-3 h-3 text-amber-400" />
                      مؤقت لكل سؤال: {previewingExam.questionTimeSeconds || 30} ثانية
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{previewingExam.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewInteractive(!previewInteractive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewInteractive
                      ? 'bg-[#fbbf24] text-[#064e3b]'
                      : 'bg-emerald-900/60 text-emerald-200 border border-emerald-700'
                  }`}
                >
                  {previewInteractive ? 'وضع التصفح السريع' : 'تجربة كطالب في المنصة'}
                </button>

                <button
                  onClick={() => {
                    setPreviewingExam(null);
                    setPreviewInteractive(false);
                  }}
                  className="p-2 rounded-xl text-emerald-300 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {previewInteractive ? (
              <StudentExamTaker
                exam={previewingExam}
                student={{
                  id: 'preview-teacher',
                  name: `تجربة المعلم (${currentUserName})`,
                  halaqahId: halaqahs[0]?.id || 'halaqah-1',
                  halaqahName: halaqahs[0]?.name || 'الحلقة',
                  points: 0,
                  level: 'المستوى الأول',
                  attendanceCount: 0,
                  completedParts: 0
                }}
                currentAttemptNumber={1}
                onFinishSubmission={async sub => {
                  alert(`تمت تجربة الاختبار بنجاح! الدرجة المحسوبة: ${sub.totalScoreEarned} من ${sub.maxPossibleScore} (${sub.percentage}%)`);
                  setPreviewingExam(null);
                  setPreviewInteractive(false);
                }}
                onCancel={() => {
                  setPreviewInteractive(false);
                }}
              />
            ) : (
              <div className="space-y-4">
                {previewingExam.description && (
                  <div className="p-4 rounded-2xl bg-[#064e3b]/50 text-xs text-emerald-200 border border-emerald-800">
                    <span className="text-[#fbbf24] font-bold block mb-1">تعليمات الاختبار:</span>
                    {previewingExam.description}
                  </div>
                )}

                <div className="space-y-3">
                  {previewingExam.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl bg-[#064e3b]/30 border border-emerald-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#fbbf24]">
                          السؤال {idx + 1} ({q.type === 'multiple_choice' ? 'اختيار من متعدد' : q.type === 'true_false' ? 'صح وخطأ' : 'سؤال مقالي'})
                        </span>
                        <span className="text-emerald-300 font-bold">{q.points} درجات</span>
                      </div>

                      <h4 className="text-sm font-bold text-white">{q.title}</h4>

                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = q.correctAnswer === opt;
                            return (
                              <div
                                key={oIdx}
                                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                                  isCorrect
                                    ? 'bg-emerald-900/80 border-emerald-400 text-emerald-200 font-bold'
                                    : 'bg-[#022c22] border-emerald-900 text-emerald-300/80'
                                }`}
                              >
                                {isCorrect ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-emerald-700 shrink-0" />
                                )}
                                <span>{opt}</span>
                                {isCorrect && (
                                  <span className="text-[10px] text-[#fbbf24] mr-auto font-black">
                                    (الإجابة النموذجية)
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.explanation && (
                        <div className="p-2.5 rounded-xl bg-[#022c22]/60 text-[11px] text-emerald-300/90 border border-emerald-800/50 mt-2">
                          <span className="text-amber-400 font-bold">توضيح:</span> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
