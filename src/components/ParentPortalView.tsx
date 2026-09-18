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
  ChevronLeft
} from 'lucide-react';
import { Student, AttendanceRecord, StudentEvaluation, AppSettings, BehaviorViolation, Exam, ExamSubmission } from '../types';
import { StudentExamTaker } from './StudentExamTaker';
import { OmranDataService } from '../lib/firebase';

interface ParentPortalViewProps {
  student: Student;
  attendance: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  settings: AppSettings;
  violations?: BehaviorViolation[];
  exams?: Exam[];
  submissions?: ExamSubmission[];
  isLoggedInStudent?: boolean;
  onLogout?: () => void;
  onSaveSubmission?: (submission: ExamSubmission) => Promise<void>;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  student,
  attendance,
  evaluations,
  settings,
  violations = [],
  exams = [],
  submissions = [],
  isLoggedInStudent,
  onLogout,
  onSaveSubmission
}) => {
  const [activeTakingExam, setActiveTakingExam] = useState<Exam | null>(null);
  const [activeTakingAttemptNum, setActiveTakingAttemptNum] = useState<number>(1);
  const [viewingReviewSubmission, setViewingReviewSubmission] = useState<ExamSubmission | null>(null);
  const [openedGoogleFormExam, setOpenedGoogleFormExam] = useState<Exam | null>(null);

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
            {/* Prominent Account Badge */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#022c22] border border-[#fbbf24]/40 text-xs shadow-md">
              <User className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span className="text-[#86efac]">حسابك:</span>
              <span className="font-bold text-white">{student.name}</span>
              <span className="text-[#fbbf24] font-mono font-bold">- {student.password || '123'}</span>
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
                {student.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
                    {student.name}
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] text-xs font-bold border border-[#fbbf24]/30">
                    مستوى {student.level}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#86efac] text-xs font-bold border border-emerald-500/30 font-mono">
                    {student.name} - {student.password || '123'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#f0f9f6]/90 mt-1">
                  موضع الحفظ الحالي: <strong className="text-[#fbbf24]">سورة {student.currentSurahName} (الآية {student.currentAyah})</strong>
                </p>
                <p className="text-xs text-[#86efac]/80 mt-0.5">
                  ولي الأمر: {student.parentName}
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
                              if (exam.deliveryMode === 'google_form') {
                                const targetUrl = exam.googleFormResponderUrl || exam.googleFormUrl;
                                if (targetUrl) {
                                  window.open(targetUrl, '_blank');
                                  setOpenedGoogleFormExam(exam);
                                } else {
                                  alert('لم يتم ربط أو توليد رابط Google Form لهذا الاختبار بعد. يرجى التواصل مع المعلم.');
                                }
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

        {/* GOOGLE FORM OPENED MODAL */}
        {openedGoogleFormExam && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#022c22] border border-[#fbbf24]/50 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center mx-auto">
                <ExternalLink className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">
                تم توجيهك إلى نموذج Google Forms
              </h3>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                اختبار: <strong>"{openedGoogleFormExam.title}"</strong>
                <br />
                تم فتح صفحة نموذج الاختبار في علامة تبويب جديدة. يرجى الإجابة على الأسئلة بدقة وتسليم النموذج، وسيتم مزامنة نتيجتك واعتمادها في لوحة الشرف فور مراجعة المعلم.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const url = openedGoogleFormExam.googleFormResponderUrl || openedGoogleFormExam.googleFormUrl;
                    if (url) window.open(url, '_blank');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#fbbf24] text-[#064e3b] text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-[#f59e0b] cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>إعادة فتح النموذج</span>
                </button>
                <button
                  onClick={() => setOpenedGoogleFormExam(null)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 text-xs font-bold cursor-pointer"
                >
                  حسناً، تم
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
