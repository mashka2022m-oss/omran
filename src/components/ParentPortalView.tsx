import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  Volume2,
  LogOut,
  Layers,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Key,
  User,
  XCircle,
  Clock,
  FileText,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ChevronLeft,
  Trophy,
  Medal,
  Copy,
  Check
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  StudentEvaluation,
  AppSettings,
  BehaviorViolation,
  Exam,
  ExamSubmission,
  LeaderboardSettings,
  Halaqah
} from '../types';
import { StudentExamTaker } from './StudentExamTaker';
import { OmranDataService } from '../lib/firebase';
import { GoogleWorkspaceService } from '../lib/googleWorkspace';

interface ParentPortalViewProps {
  student: Student;
  attendance: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  settings: AppSettings;
  violations?: BehaviorViolation[];
  exams?: Exam[];
  submissions?: ExamSubmission[];
  students?: Student[];
  halaqahs?: Halaqah[];
  leaderboardSettings?: LeaderboardSettings;
  isLoggedInStudent?: boolean;
  onLogout?: () => void;
  onSaveSubmission?: (submission: ExamSubmission) => Promise<void>;
  onUpdateStudent?: (updatedStudent: Student) => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  student,
  attendance,
  evaluations,
  settings,
  violations = [],
  exams = [],
  submissions = [],
  students = [],
  halaqahs = [],
  leaderboardSettings,
  isLoggedInStudent,
  onLogout,
  onSaveSubmission,
  onUpdateStudent
}) => {
  const [activeTakingExam, setActiveTakingExam] = useState<Exam | null>(null);
  const [activeTakingAttemptNum, setActiveTakingAttemptNum] = useState<number>(1);
  const [viewingReviewSubmission, setViewingReviewSubmission] = useState<ExamSubmission | null>(null);
  const [openedGoogleFormExam, setOpenedGoogleFormExam] = useState<Exam | null>(null);
  const [googleFormModalData, setGoogleFormModalData] = useState<{
    exam: Exam;
    rawUrl: string;
    prefilledUrl: string;
    hasPrefill: boolean;
  } | null>(null);
  const [nameCopiedNotice, setNameCopiedNotice] = useState(false);

  // Student Google Authentication & Linking State
  const [currentStudent, setCurrentStudent] = useState<Student>(student);
  const [googleAuthGateExam, setGoogleAuthGateExam] = useState<Exam | null>(null);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [googleLinkError, setGoogleLinkError] = useState('');
  const [isCheckingGoogleScore, setIsCheckingGoogleScore] = useState(false);
  const [googleScoreFeedback, setGoogleScoreFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Synchronize internal student state if props change
  React.useEffect(() => {
    setCurrentStudent(student);
  }, [student]);

  const handleLinkGoogleAccount = async (targetExamAfterLink?: Exam | null) => {
    setIsLinkingGoogle(true);
    setGoogleLinkError('');
    try {
      const updated = await GoogleWorkspaceService.linkStudentGoogleAccount(currentStudent);
      setCurrentStudent(updated);
      if (onUpdateStudent) {
        onUpdateStudent(updated);
      }
      setGoogleAuthGateExam(null);

      // If linking was triggered by clicking an exam, launch it now!
      if (targetExamAfterLink) {
        if (targetExamAfterLink.deliveryMode === 'google_form') {
          handleLaunchGoogleForm(targetExamAfterLink, updated);
        } else {
          const mySubs = submissions.filter(s => s.examId === targetExamAfterLink.id && s.studentId === updated.id);
          setActiveTakingAttemptNum(mySubs.length + 1);
          setActiveTakingExam(targetExamAfterLink);
        }
      }
    } catch (err: any) {
      console.error('Failed to link Google account for student:', err);
      setGoogleLinkError(err?.message || 'تعذر استكمال تسجيل الدخول بحساب Google. تأكد من السماح بالنوافذ المنبثقة.');
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleCheckAndRecordGoogleScore = async (targetExam: Exam) => {
    setIsCheckingGoogleScore(true);
    setGoogleScoreFeedback(null);
    try {
      const result = await GoogleWorkspaceService.fetchAndRecordStudentGoogleFormScore(
        targetExam,
        currentStudent,
        submissions
      );
      if (result.found && result.submission) {
        if (onSaveSubmission) {
          await onSaveSubmission(result.submission);
        }
        setGoogleScoreFeedback({
          success: true,
          message: result.message
        });
      } else {
        setGoogleScoreFeedback({
          success: false,
          message: result.message
        });
      }
    } catch (err: any) {
      setGoogleScoreFeedback({
        success: false,
        message: err?.message || 'تعذر التحقق من درجات Google Forms حالياً.'
      });
    } finally {
      setIsCheckingGoogleScore(false);
    }
  };

  const studentAttendance = attendance.filter(a => a.studentId === student.id);
  const studentEvaluations = evaluations.filter(e => e.studentId === student.id);
  const studentViolations = violations.filter(
    v => v.studentId === student.id && (v.showInPortal ?? true)
  );

  // Available Exams for this Student
  const studentHalaqahId = student.halaqahId || '';
  const studentExams = exams.filter(ex => {
    // Check target halaqat
    const matchesHalaqah = ex.targetHalaqat.includes('all') || (studentHalaqahId && ex.targetHalaqat.includes(studentHalaqahId));
    if (!matchesHalaqah) return false;

    // Check scheduling (if scheduled for the future)
    if (ex.scheduleType === 'scheduled' && ex.startDate && new Date(ex.startDate) > new Date()) {
      return false;
    }
    return true;
  });

  const studentSubmissions = submissions.filter(s => s.studentId === student.id);

  // Sort evaluations from newest to oldest
  const sortedEvaluations = [...studentEvaluations].sort((a, b) => b.date.localeCompare(a.date));

  const presentsCount = studentAttendance.filter(a => a.status === 'حاضر').length;
  const attendanceRate =
    studentAttendance.length > 0
      ? Math.round((presentsCount / studentAttendance.length) * 100)
      : 100;

  // Honor Board / Leaderboard Calculation for Student Portal
  const activeScope = leaderboardSettings?.scope || 'all_unified';
  const isPerHalaqahScope = activeScope === 'per_halaqah';

  // Filter students based on supervisor's setting (all halaqat vs per halaqah)
  const poolStudents = students && students.length > 0 ? students : [student];
  const eligibleStudents = poolStudents.filter(s => {
    if (isPerHalaqahScope) {
      return s.halaqahId === student.halaqahId;
    }
    return true;
  });

  const studentRankList = eligibleStudents.map(st => {
    const stSubmissions = submissions.filter(sub => sub.studentId === st.id);
    const examPoints = stSubmissions.reduce((sum, s) => sum + (s.pointsGrantedForLeaderboard || 0), 0);
    const stEvaluations = evaluations.filter(ev => ev.studentId === st.id);
    const evalPoints = leaderboardSettings?.includeEvaluationScores
      ? stEvaluations.reduce((sum, ev) => sum + (ev.totalScore || 0), 0)
      : 0;
    const totalPoints = examPoints + evalPoints;
    const bestPercentage = stSubmissions.reduce((max, s) => Math.max(max, s.percentage || 0), 0);
    const halaqahName = st.halaqahName || halaqahs?.find(h => h.id === st.halaqahId)?.name || 'الحلقة';

    return {
      student: st,
      totalPoints,
      examPoints,
      evalPoints,
      completedExams: stSubmissions.length,
      bestPercentage,
      halaqahName
    };
  });

  studentRankList.sort((a, b) => b.totalPoints - a.totalPoints || b.bestPercentage - a.bestPercentage);

  const myRankIndex = studentRankList.findIndex(item => item.student.id === student.id);
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;
  const myRankingData = myRankIndex >= 0 ? studentRankList[myRankIndex] : null;
  const studentHalaqahObj = halaqahs?.find(h => h.id === student.halaqahId);
  const currentHalaqahTitle = student.halaqahName || studentHalaqahObj?.name || 'حلقتك القرآنية';

  // Handle Google Form exam launch with student name prefill and auto-clipboard
  const handleLaunchGoogleForm = (exam: Exam, targetStudent?: Student) => {
    const activeSt = targetStudent || currentStudent;
    const rawUrl = exam.googleFormResponderUrl || exam.googleFormUrl;
    if (!rawUrl) {
      alert('لم يتم ربط أو توليد رابط Google Form لهذا الاختبار بعد. يرجى التواصل مع المعلم.');
      return;
    }

    let prefilledUrl = rawUrl;
    let hasPrefill = false;

    if (exam.googleFormNameEntryId) {
      const entryKey = exam.googleFormNameEntryId.startsWith('entry.')
        ? exam.googleFormNameEntryId
        : `entry.${exam.googleFormNameEntryId}`;
      const joinChar = rawUrl.includes('?') ? '&' : '?';
      prefilledUrl = `${rawUrl}${joinChar}${entryKey}=${encodeURIComponent(activeSt.name)}`;
      hasPrefill = true;
    }

    // Auto-copy the registered student name to clipboard so student never misspells it
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(activeSt.name).then(() => {
        setNameCopiedNotice(true);
        setTimeout(() => setNameCopiedNotice(false), 4000);
      }).catch(() => {});
    }

    setGoogleFormModalData({
      exam,
      rawUrl,
      prefilledUrl,
      hasPrefill
    });
  };

  const handleLogoutAction = () => {
    if (onLogout) {
      onLogout();
    } else {
      window.history.replaceState({}, '', window.location.pathname);
      window.location.reload();
    }
  };

  if (activeTakingExam) {
    return (
      <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] p-4 sm:p-6 lg:p-8">
        <StudentExamTaker
          exam={activeTakingExam}
          student={student}
          currentAttemptNumber={activeTakingAttemptNum}
          onFinishSubmission={async sub => {
            if (onSaveSubmission) {
              await onSaveSubmission(sub);
            } else {
              await OmranDataService.saveSubmission(sub);
            }
            setActiveTakingExam(null);
          }}
          onCancel={() => setActiveTakingExam(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] p-4 sm:p-6 lg:p-8 relative z-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Portal Header */}
        <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#064e3b] flex items-center justify-center border border-[#fbbf24]/40 shadow-lg font-black shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-heading text-white flex items-center gap-2">
                بوابة المتابعة الحية لطلاب القرآن الكريم
              </h1>
              <p className="text-xs text-[#fbbf24] font-bold">
                {settings.halaqahName} • إشراف المعلم: {settings.teacherName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Google Account Status Badge */}
            {currentStudent.isGoogleLinked && currentStudent.googleEmail ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-xs shadow-sm" title={currentStudent.googleEmail}>
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-emerald-300 font-bold truncate max-w-[150px]">{currentStudent.googleEmail}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">موثق</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleLinkGoogleAccount(null)}
                disabled={isLinkingGoogle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-colors cursor-pointer"
                title="اضغط لربط حسابك بـ Google وتفعيل دخول الاختبارات"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isLinkingGoogle ? 'جاري الربط...' : 'ربط حساب Google'}</span>
              </button>
            )}

            {/* Prominent Account Badge */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#022c22] border border-[#fbbf24]/40 text-xs shadow-md">
              <User className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span className="text-[#86efac]">حسابك:</span>
              <span className="font-bold text-white">{currentStudent.name}</span>
              <span className="text-[#fbbf24] font-mono font-bold">- {currentStudent.password || '123'}</span>
            </div>

            {/* Logout Button Always Visible */}
            <button
              onClick={handleLogoutAction}
              className="px-4 py-2 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="تسجيل الخروج والعودة للشاشة الرئيسية"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {/* Student Profile Card Hero */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#064e3b] border border-[#fbbf24]/40 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#064e3b] text-2xl font-black font-heading flex items-center justify-center shadow-lg border border-[#fbbf24]/40 shrink-0">
                {currentStudent.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
                    {currentStudent.name}
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] text-xs font-bold border border-[#fbbf24]/30">
                    مستوى {currentStudent.level}
                  </span>
                  {currentStudent.isGoogleLinked && currentStudent.googleEmail && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>حساب Google موثق</span>
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#86efac] text-xs font-bold border border-emerald-500/30 font-mono">
                    {currentStudent.name} - {currentStudent.password || '123'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#f0f9f6]/90 mt-1">
                  موضع الحفظ الحالي: <strong className="text-[#fbbf24]">سورة {currentStudent.currentSurahName} (الآية {currentStudent.currentAyah})</strong>
                </p>
                <p className="text-xs text-[#86efac]/80 mt-0.5">
                  ولي الأمر: {currentStudent.parentName}
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 bg-[#022c22] sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-[#065f46]">
              <span className="text-xs text-[#86efac]">نسبة التزام الحضور:</span>
              <span className="text-2xl sm:text-3xl font-black text-[#fbbf24] font-heading">
                {attendanceRate}%
              </span>
            </div>
          </div>
        </div>

        {/* QURAN EXAMS & QUIZZES SECTION FOR STUDENTS */}
        <div className="bg-[#064e3b]/60 border border-[#fbbf24]/40 rounded-[32px] p-6 sm:p-8 space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#065f46]">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#fbbf24]" />
              <h3 className="text-base sm:text-lg font-bold font-heading text-white">
                الاختبارات والتقييمات القرآنية ({studentExams.length})
              </h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] font-bold border border-[#fbbf24]/30">
              الاختبارات الإلكترونية
            </span>
          </div>

          {studentExams.length === 0 ? (
            <div className="text-center py-8 text-xs text-emerald-200/80 bg-[#022c22]/50 p-6 rounded-2xl border border-emerald-800/60">
              لا توجد اختبارات متاحة لحلقتك حالياً. تابع مع المعلم عند إعلان اختبار جديد.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentExams.map(exam => {
                const mySubmissions = studentSubmissions.filter(s => s.examId === exam.id);
                const attemptsUsed = mySubmissions.length;
                const isLimited = exam.attemptLimitType === 'limited';
                const maxAttempts = exam.maxAttempts || 1;
                const hasReachedLimit = isLimited && attemptsUsed >= maxAttempts;
                const isExpired = exam.hasDeadline && exam.deadlineDate && new Date(exam.deadlineDate) < new Date();
                const canTake = !hasReachedLimit && !isExpired;

                const bestSubmission = mySubmissions.reduce<ExamSubmission | null>((best, cur) => {
                  if (!best || cur.totalScoreEarned > best.totalScoreEarned) return cur;
                  return best;
                }, null);

                return (
                  <div
                    key={exam.id}
                    className="p-5 rounded-2xl bg-[#022c22] border border-[#065f46] space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-700">
                            {exam.questions.length} أسئلة • {exam.totalPoints} درجات
                          </span>
                          {exam.deliveryMode === 'google_form' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/80 text-blue-200 font-bold border border-blue-600/50 flex items-center gap-1">
                              <ExternalLink className="w-3 h-3 text-blue-300" />
                              Google Forms
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold border border-emerald-600/40">
                              نظام المنصة
                            </span>
                          )}
                        </div>

                        {isExpired ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-600/40">
                            انتهى الموعد
                          </span>
                        ) : hasReachedLimit ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600/40 font-bold">
                            استنفدت المحاولات ({attemptsUsed}/{maxAttempts})
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                            متاح للبدء
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white line-clamp-1">{exam.title}</h4>
                      {exam.description && (
                        <p className="text-[11px] text-emerald-200/80 mt-1 line-clamp-2">{exam.description}</p>
                      )}

                      {bestSubmission && (
                        <div className="mt-3 p-2.5 rounded-xl bg-[#064e3b]/50 border border-emerald-800 text-xs flex items-center justify-between">
                          <span className="text-emerald-300">أفضل نتيجة محققة:</span>
                          <span className="font-bold text-[#fbbf24]">
                            {bestSubmission.totalScoreEarned} / {bestSubmission.maxPossibleScore} ({bestSubmission.percentage}%)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-emerald-900/60 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-emerald-300/80">
                        {isLimited ? `المحاولات المتبقية: ${Math.max(0, maxAttempts - attemptsUsed)}` : 'محاولات غير محدودة'}
                      </div>

                      <div className="flex items-center gap-2">
                        {mySubmissions.length > 0 && (
                          <button
                            onClick={() => setViewingReviewSubmission(bestSubmission)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <span>مراجعة النتيجة</span>
                          </button>
                        )}

                        {canTake && (
                          <button
                            onClick={() => {
                              // Mandatory Google verification gate:
                              // If student has not linked their Google account, block entry until authenticated
                              if (!currentStudent.isGoogleLinked || !currentStudent.googleEmail) {
                                setGoogleAuthGateExam(exam);
                                return;
                              }

                              if (exam.deliveryMode === 'google_form') {
                                handleLaunchGoogleForm(exam);
                              } else {
                                setActiveTakingAttemptNum(attemptsUsed + 1);
                                setActiveTakingExam(exam);
                              }
                            }}
                            className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all ${
                              exam.deliveryMode === 'google_form'
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : 'bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b]'
                            }`}
                          >
                            {exam.deliveryMode === 'google_form' ? (
                              <>
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>بدء الاختبار عبر Google Forms</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>ابدأ الاختبار الآن</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* HONOR BOARD / LEADERBOARD SECTION FOR STUDENTS ACCORDING TO SUPERVISOR CONFIG */}
        <div className="bg-[#064e3b]/60 border border-[#fbbf24]/40 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#065f46]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2">
                  <span>لوحة الشرف والتفوق القرآني</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#fbbf24] text-[#064e3b] font-black">
                    {isPerHalaqahScope ? 'ترتيب الحلقة محلياً' : 'الترتيب العام لجميع الحلقات'}
                  </span>
                </h3>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  {isPerHalaqahScope
                    ? `إعداد المشرف: يظهر هنا ترتيب وتنافس طلاب حلقة (${currentHalaqahTitle}) فقط.`
                    : 'إعداد المشرف: يظهر هنا الترتيب العام الموحد لجميع طلاب الحلقات بالمركز.'}
                </p>
              </div>
            </div>

            {/* Current Student Standing Pill */}
            {myRank && (
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#022c22] border border-[#fbbf24]/40 text-xs shadow-md">
                <Medal className="w-4 h-4 text-[#fbbf24]" />
                <span className="text-emerald-300">ترتيبك:</span>
                <span className="font-black text-[#fbbf24] text-sm font-heading">
                  المركز #{myRank}
                </span>
                <span className="text-emerald-400 font-mono font-bold">
                  ({myRankingData?.totalPoints || 0} نقطة)
                </span>
              </div>
            )}
          </div>

          {/* Top 3 Podium Cards */}
          {studentRankList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {studentRankList.slice(0, 3).map((item, idx) => {
                const isMe = item.student.id === student.id;
                const badges = [
                  { label: 'الأول 🥇', border: 'border-[#fbbf24]', bg: 'bg-[#fbbf24]/20', text: 'text-[#fbbf24]' },
                  { label: 'الثاني 🥈', border: 'border-slate-300', bg: 'bg-slate-300/20', text: 'text-slate-200' },
                  { label: 'الثالث 🥉', border: 'border-amber-600', bg: 'bg-amber-600/20', text: 'text-amber-300' }
                ];
                const badge = badges[idx] || badges[0];

                return (
                  <div
                    key={item.student.id}
                    className={`p-4 rounded-2xl border transition-all text-center relative overflow-hidden flex flex-col justify-between ${
                      isMe
                        ? 'bg-[#064e3b] border-[#fbbf24] ring-2 ring-[#fbbf24]/40 shadow-xl'
                        : 'bg-[#022c22]/90 border-[#065f46]'
                    }`}
                  >
                    {isMe && (
                      <span className="absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full bg-[#fbbf24] text-[#064e3b] font-black">
                        أنت
                      </span>
                    )}

                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-black mb-2 ${badge.bg} ${badge.text} border ${badge.border}`}>
                        {badge.label}
                      </span>
                      <h4 className="text-sm font-bold text-white truncate">{item.student.name}</h4>
                      <p className="text-[11px] text-emerald-300/70 mt-0.5">{item.halaqahName}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-emerald-800/60 flex items-center justify-around text-xs">
                      <div>
                        <span className="text-[10px] text-emerald-400/80 block">النقاط</span>
                        <strong className="text-[#fbbf24] font-mono text-sm">{item.totalPoints}</strong>
                      </div>
                      <div className="w-px h-6 bg-emerald-800/60" />
                      <div>
                        <span className="text-[10px] text-emerald-400/80 block">أفضل درجة</span>
                        <strong className="text-white font-mono text-xs">{item.bestPercentage}%</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Rank Table */}
          <div className="rounded-2xl border border-[#065f46] overflow-hidden bg-[#022c22]/70">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#064e3b]/80 text-emerald-200 border-b border-[#065f46] text-[11px]">
                  <tr>
                    <th className="p-3">الترتيب</th>
                    <th className="p-3">اسم الطالب</th>
                    {!isPerHalaqahScope && <th className="p-3">الحلقة</th>}
                    <th className="p-3 text-center">الاختبارات المنجزة</th>
                    <th className="p-3 text-center">أعلى نسبة</th>
                    <th className="p-3 text-left">إجمالي النقاط</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#065f46]/40 text-white">
                  {studentRankList.map((item, idx) => {
                    const isMe = item.student.id === student.id;
                    return (
                      <tr
                        key={item.student.id}
                        className={`transition-colors ${
                          isMe
                            ? 'bg-[#064e3b] font-bold text-[#fbbf24] border-l-4 border-l-[#fbbf24]'
                            : 'hover:bg-[#064e3b]/30'
                        }`}
                      >
                        <td className="p-3 font-mono">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black ${
                            idx === 0
                              ? 'bg-[#fbbf24] text-[#064e3b]'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-900'
                              : idx === 2
                              ? 'bg-amber-600 text-white'
                              : 'bg-[#022c22] text-emerald-300 border border-emerald-800'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span>{item.student.name}</span>
                            {isMe && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fbbf24] text-[#064e3b] font-black">
                                أنت
                              </span>
                            )}
                          </div>
                        </td>
                        {!isPerHalaqahScope && (
                          <td className="p-3 text-emerald-300/80 text-[11px]">{item.halaqahName}</td>
                        )}
                        <td className="p-3 text-center font-mono">{item.completedExams}</td>
                        <td className="p-3 text-center font-mono text-emerald-300">{item.bestPercentage}%</td>
                        <td className="p-3 text-left font-mono font-bold text-[#fbbf24] text-sm">
                          {item.totalPoints}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* REVIEW PREVIOUS ATTEMPT MODAL */}
        {viewingReviewSubmission && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#022c22] border border-[#fbbf24]/50 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#fbbf24]" />
                    <span>مراجعة درجات: {viewingReviewSubmission.examTitle}</span>
                  </h3>
                  <p className="text-xs text-emerald-300/80 mt-0.5">
                    الدرجة: {viewingReviewSubmission.totalScoreEarned} من {viewingReviewSubmission.maxPossibleScore} ({viewingReviewSubmission.percentage}%)
                  </p>
                </div>
                <button
                  onClick={() => setViewingReviewSubmission(null)}
                  className="p-2 rounded-xl text-emerald-300 hover:text-white cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {viewingReviewSubmission.answers.map((ans, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-[#064e3b]/40 border border-emerald-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-white">س {idx + 1}: {ans.questionTitle}</span>
                      <span className="text-[#fbbf24]">{ans.pointsEarned} / {ans.maxPoints} درجة</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#022c22] text-emerald-100">
                      <span className="text-emerald-400 font-bold block">إجابتك:</span>
                      <p className="text-white">{ans.studentAnswer || 'لم تتم الإجابة'}</p>
                    </div>
                    {ans.teacherFeedback && (
                      <div className="text-amber-300 bg-amber-950/40 p-2 rounded-xl border border-amber-500/20">
                        <strong>ملاحظة المعلم: </strong>{ans.teacherFeedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {viewingReviewSubmission.teacherGeneralFeedback && (
                <div className="p-3 rounded-2xl bg-[#064e3b]/60 border border-[#065f46] text-xs text-white">
                  <strong className="text-[#fbbf24]">توجيه عام من المعلم: </strong>
                  {viewingReviewSubmission.teacherGeneralFeedback}
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-emerald-800">
                <button
                  onClick={() => setViewingReviewSubmission(null)}
                  className="px-5 py-2 rounded-xl bg-[#fbbf24] text-[#064e3b] font-bold text-xs cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tomorrow's Target / Current Assignment Box */}
        <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 sm:p-8 space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#065f46]">
            <h3 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#fbbf24]" />
              <span>المقرر والتكليف القادم (خطة الغد)</span>
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] font-bold border border-[#fbbf24]/30">
              متابعة منزلية
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New Target */}
            <div className="bg-[#022c22] border border-[#065f46] rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#86efac]">
                <BookOpen className="w-4 h-4 text-[#fbbf24]" />
                <span>ورد الحفظ الجديد المطلوب غداً</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-white">
                {student.targetSurahName ? (
                  <>سورة {student.targetSurahName} (من آية {student.targetFromAyah || 1} إلى {student.targetToAyah || student.currentAyah})</>
                ) : (
                  'مواصلة الحفظ حسب توجيه المعلم'
                )}
              </p>
            </div>

            {/* Review Target */}
            <div className="bg-[#022c22] border border-[#065f46] rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#86efac]">
                <RotateCcw className="w-4 h-4 text-[#fbbf24]" />
                <span>مقرر المراجعة والتثبيت</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-white">
                {student.reviewSurahName ? (
                  <>سورة {student.reviewSurahName} (من آية {student.reviewFromAyah || 1} إلى {student.reviewToAyah || 1})</>
                ) : (
                  'تثبيت ومراجعة المحفوظ السابق'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Daily Recitation History */}
        <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#065f46]">
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#fbbf24]" />
              <span>سجل التسميع اليومي والتقييمات الأخيرة ({sortedEvaluations.length})</span>
            </h3>
            <span className="text-xs text-[#86efac] font-medium">
              أحدث التقييمات
            </span>
          </div>

          {sortedEvaluations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-300">
              لم يتم رصد تسميعات مسجلة بعد.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEvaluations.map(ev => {
                const evalDateArabic = new Intl.DateTimeFormat('ar-SA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }).format(new Date(ev.date));

                const newDidNotRecite = ev.recitationDetails?.newMemorizationDidNotRecite;
                const newDidNotReciteReason = ev.recitationDetails?.newMemorizationDidNotReciteReason;

                return (
                  <div
                    key={ev.id}
                    className="p-4 rounded-2xl bg-[#022c22] border border-[#065f46] space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#065f46]/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{evalDateArabic}</span>
                        <span className="text-slate-400 font-mono text-[11px]">({ev.date})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] font-bold border border-[#fbbf24]/30">
                          درجة التسميع: {ev.score}%
                        </span>
                        {ev.teacherName && (
                          <span className="text-[11px] text-[#86efac]/80">
                            بإشراف: {ev.teacherName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Recitation Content Details */}
                    <div className="space-y-2 text-xs">
                      {/* New Memorization */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-[#86efac] font-bold flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-[#fbbf24]" />
                          <span>ورد الحفظ الجديد:</span>
                        </span>
                        {newDidNotRecite ? (
                          <span className="text-amber-300 font-bold bg-amber-500/15 px-2.5 py-1 rounded-xl border border-amber-500/30 inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-amber-400" />
                            <span>لم يُسمّع ({newDidNotReciteReason || 'لم يحفظ'})</span>
                          </span>
                        ) : (
                          <span className="font-bold text-[#fbbf24] text-sm">
                            {ev.recitationDetails?.newMemorizationAchieved || 'تم التسميع بنجاح'}
                          </span>
                        )}
                      </div>

                      {/* Review Items */}
                      {ev.recitationDetails?.todayReviewItems && ev.recitationDetails.todayReviewItems.length > 0 ? (
                        <div className="pt-2 border-t border-[#065f46]/50 space-y-1.5">
                          <span className="text-[#86efac] font-bold flex items-center gap-1">
                            <RotateCcw className="w-3.5 h-3.5 text-[#fbbf24]" />
                            <span>المراجعة والتثبيت:</span>
                          </span>
                          <div className="space-y-1.5 pr-2">
                            {ev.recitationDetails.todayReviewItems.map((rev, rIdx) => (
                              <div key={rev.id || rIdx} className="flex flex-wrap items-center justify-between gap-1 text-[11px] bg-[#064e3b]/30 p-2 rounded-xl border border-[#065f46]/40">
                                <span className="text-white font-medium">
                                  • {rev.type}: سورة {rev.surahName} (آية {rev.fromAyah} إلى {rev.toAyah})
                                </span>
                                {rev.didNotRecite ? (
                                  <span className="text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">
                                    لم يُسمّع ({rev.didNotReciteReason || 'لم يحفظ'})
                                  </span>
                                ) : (
                                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>تم التسميع</span>
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : ev.recitationDetails?.reviewAchieved ? (
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 pt-2 border-t border-[#065f46]/50">
                          <span className="text-[#86efac] font-bold flex items-center gap-1">
                            <RotateCcw className="w-3.5 h-3.5 text-[#fbbf24]" />
                            <span>ما سمّعه في المراجعة والتثبيت:</span>
                          </span>
                          <span className="font-bold text-white text-right">
                            {ev.recitationDetails.reviewAchieved}
                          </span>
                        </div>
                      ) : null}

                      {/* Teacher Notes */}
                      {ev.recitationDetails?.teacherNotes && (
                        <div className="text-[#f0f9f6] pt-2 border-t border-[#065f46]/50 bg-[#064e3b]/30 p-2.5 rounded-xl">
                          <span className="text-[#fbbf24] font-bold flex items-center gap-1 mb-1">
                            <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
                            <span>ملاحظات وتوجيه المعلم:</span>
                          </span>
                          {ev.recitationDetails.teacherNotes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Behavioral & Pedagogical Guidance Section for Parents */}
        {studentViolations.length > 0 && (
          <div className="bg-[#064e3b]/60 border border-amber-500/40 rounded-[32px] p-6 space-y-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-[#065f46]">
              <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#fbbf24]" />
                <span>ملاحظات السلوك والتوجيه التربوي للحلقة ({studentViolations.length})</span>
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-[#fbbf24] border border-amber-500/30 font-bold">
                متابعة سلوكية وتربوية
              </span>
            </div>

            <div className="space-y-3">
              {studentViolations.map(viol => {
                const isResolved = viol.status === 'تم التوجيه والمعالجة';

                return (
                  <div
                    key={viol.id}
                    className="p-4 rounded-2xl bg-[#022c22] border border-[#065f46] space-y-2.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {viol.violationType}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            viol.severity === 'تنبيه'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {viol.severity}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#86efac]/80">
                        <span>تاريخ: {viol.date}</span>
                        {isResolved ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>تم التوجيه والمعالجة</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                            قيد المتابعة
                          </span>
                        )}
                      </div>
                    </div>

                    {viol.description && (
                      <div className="text-slate-200 leading-relaxed bg-[#064e3b]/30 p-2.5 rounded-xl border border-[#065f46]/50">
                        <strong className="text-[#86efac]">توجيه الشيخ وتفاصيل الملاحظة: </strong>
                        {viol.description}
                      </div>
                    )}

                    {viol.actionTaken && (
                      <div className="text-[#86efac]">
                        <strong className="text-emerald-300">الإجراء المتخذ: </strong>
                        {viol.actionTaken}
                      </div>
                    )}

                    {viol.messageText && (
                      <div className="text-slate-300 italic pt-1 border-t border-[#065f46]/60">
                        "{viol.messageText}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SMART GOOGLE FORM LAUNCH & PRE-FILL MODAL */}
        {googleFormModalData && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#022c22] border border-[#fbbf24]/60 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-5 text-right relative">
              <button
                onClick={() => setGoogleFormModalData(null)}
                className="absolute top-4 left-4 p-2 text-emerald-300 hover:text-white rounded-xl bg-emerald-950/40 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-emerald-800/80 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center justify-center shrink-0">
                  <ExternalLink className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-heading text-white">
                    بدء الاختبار عبر Google Forms
                  </h3>
                  <p className="text-xs text-[#fbbf24] font-bold mt-0.5">
                    {googleFormModalData.exam.title}
                  </p>
                </div>
              </div>

              {/* Student Identity Card & Auto-prefill Status */}
              <div className="p-4 rounded-2xl bg-[#064e3b]/60 border border-emerald-700/80 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-emerald-300 font-bold">
                    حسابك والاسم المعتمد في المنصة:
                  </span>
                  <button
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(currentStudent.name);
                        setNameCopiedNotice(true);
                        setTimeout(() => setNameCopiedNotice(false), 3000);
                      }
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {nameCopiedNotice ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#fbbf24]" />
                        <span className="text-[#fbbf24] font-bold">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ الاسم</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="text-base sm:text-lg font-black text-white font-heading bg-[#022c22] p-3 rounded-xl border border-emerald-600/50 flex items-center justify-between">
                    <span>{currentStudent.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                      مطابق لقوائم المركز
                    </span>
                  </div>
                  {currentStudent.googleEmail && (
                    <div className="text-xs text-emerald-300 bg-emerald-950/70 p-2 rounded-xl border border-emerald-700/50 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>الحساب المعتمد: <strong>{currentStudent.googleEmail}</strong></span>
                    </div>
                  )}
                </div>

                <div className="text-xs leading-relaxed text-emerald-100/90 pt-1">
                  <div className="flex items-start gap-2 text-emerald-300 bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-600/40">
                    <Sparkles className="w-4 h-4 text-[#fbbf24] shrink-0 mt-0.5" />
                    <span>
                      أجب على أسئلة النموذج بحسابك Google، وفور تسليمك اضغط على زر (احسب درجتي وسجلها) ليقوم النظام تلقائياً برصد درجتك دون الحاجة لمراجعة يدوية.
                    </span>
                  </div>
                </div>
              </div>

              {/* Automatic Scoring Feedback */}
              {googleScoreFeedback && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border ${
                    googleScoreFeedback.success
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
                      : 'bg-amber-950/80 border-amber-500/60 text-amber-200'
                  }`}
                >
                  {googleScoreFeedback.success ? (
                    <Award className="w-5 h-5 text-[#fbbf24] shrink-0" />
                  ) : (
                    <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold">{googleScoreFeedback.message}</p>
                    {googleScoreFeedback.success && (
                      <p className="text-[11px] text-[#86efac]">
                        تم تحديث درجاتك في المنصة ولوحة الشرف بنجاح!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => {
                    window.open(googleFormModalData.prefilledUrl, '_blank');
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-[#064e3b]" />
                  <span>1. فتح نموذج الاختبار في نافذة جديدة والبدء</span>
                </button>

                <button
                  onClick={() => handleCheckAndRecordGoogleScore(googleFormModalData.exam)}
                  disabled={isCheckingGoogleScore}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all disabled:opacity-60"
                >
                  {isCheckingGoogleScore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>جاري فحص إجاباتك من Google Forms وحساب الدرجة...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 text-emerald-200" />
                      <span>2. أنهيت الإرسال - احسب درجتي وسجلها تلقائياً الآن</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setGoogleFormModalData(null);
                    setGoogleScoreFeedback(null);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold cursor-pointer transition-colors text-center"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GOOGLE FORM SUBMITTED CONFIRMATION MODAL */}
        {openedGoogleFormExam && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#022c22] border border-[#fbbf24]/50 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-[#fbbf24]" />
              </div>
              <h3 className="text-lg font-bold text-white">
                بارك الله فيك ونفع بك!
              </h3>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                تم تسجيل فتحك لاختبار <strong>"{openedGoogleFormExam.title}"</strong>.
                <br />
                فور تسليمك للنموذج، يمكنك الضغط على زر حساب الدرجة لتسجيلها تلقائياً في حسابك.
              </p>

              {googleScoreFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs text-right border ${
                    googleScoreFeedback.success
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
                      : 'bg-amber-950/80 border-amber-500/60 text-amber-200'
                  }`}
                >
                  {googleScoreFeedback.message}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={() => handleCheckAndRecordGoogleScore(openedGoogleFormExam)}
                  disabled={isCheckingGoogleScore}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-60"
                >
                  {isCheckingGoogleScore ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>جاري الفحص...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>احسب درجتي وسجلها الآن</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    const url = openedGoogleFormExam.googleFormResponderUrl || openedGoogleFormExam.googleFormUrl;
                    if (url) window.open(url, '_blank');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح النموذج</span>
                </button>
                <button
                  onClick={() => {
                    setOpenedGoogleFormExam(null);
                    setGoogleScoreFeedback(null);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#fbbf24] text-[#064e3b] text-xs font-black cursor-pointer shadow-md hover:bg-[#f59e0b]"
                >
                  تم، العودة للحساب
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MANDATORY GOOGLE AUTH GATEKEEPER MODAL BEFORE EXAM ENTRY */}
        {googleAuthGateExam && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#022c22] border border-[#fbbf24]/60 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-[#fbbf24] border border-[#fbbf24]/40 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white font-heading">
                تسجيل الدخول بـ Google مطلوب لدخول الاختبار
              </h3>

              <div className="p-3.5 rounded-2xl bg-[#064e3b]/70 border border-emerald-700/60 text-right space-y-2">
                <p className="text-xs text-emerald-100 font-semibold leading-relaxed">
                  أهلاً بك يا <strong>{currentStudent.name}</strong>! لدخول اختبار:
                  <span className="block text-[#fbbf24] font-bold mt-1 text-sm">"{googleAuthGateExam.title}"</span>
                </p>
                <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                  يشترط النظام تسجيل الدخول بحساب Google المعتمد لديك، حتى يتسنى التحقق من هويتك وتوثيق إجاباتك ورصد درجاتك في سجلك تلقائياً دون أي تدخل يدوي.
                </p>
              </div>

              {googleLinkError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs text-right">
                  {googleLinkError}
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => handleLinkGoogleAccount(googleAuthGateExam)}
                  disabled={isLinkingGoogle}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer disabled:opacity-60"
                >
                  {isLinkingGoogle ? (
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-emerald-600 rounded-full animate-spin" />
                      <span>جاري التحقق بحساب Google...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>تسجيل الدخول بحساب Google والبدء الآن</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setGoogleAuthGateExam(null);
                    setGoogleLinkError('');
                  }}
                  disabled={isLinkingGoogle}
                  className="w-full py-2 px-4 rounded-xl text-emerald-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  إلغاء والعودة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
