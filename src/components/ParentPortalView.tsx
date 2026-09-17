import React from 'react';
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
  Clock
} from 'lucide-react';
import { Student, AttendanceRecord, StudentEvaluation, AppSettings, BehaviorViolation } from '../types';

interface ParentPortalViewProps {
  student: Student;
  attendance: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  settings: AppSettings;
  violations?: BehaviorViolation[];
  isLoggedInStudent?: boolean;
  onLogout?: () => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  student,
  attendance,
  evaluations,
  settings,
  violations = [],
  isLoggedInStudent,
  onLogout
}) => {
  const studentAttendance = attendance.filter(a => a.studentId === student.id);
  const studentEvaluations = evaluations.filter(e => e.studentId === student.id);
  const studentViolations = violations.filter(
    v => v.studentId === student.id && (v.showInPortal ?? true)
  );

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

        {/* Tomorrow's Target / Current Assignment Box */}
        <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 sm:p-8 space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#065f46]">
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#fbbf24]" />
              <span>مقرر الحفظ والمراجعة المطلوب لغدٍ بإذن الله تعالى</span>
            </h3>
            <span className="text-xs px-3 py-1 rounded-xl bg-[#fbbf24]/20 text-[#fbbf24] font-bold border border-[#fbbf24]/30">
              معتمد من المعلم
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#022c22] border border-[#065f46]">
              <span className="text-xs font-bold text-[#fbbf24] block mb-1">
                📖 ورد الحفظ الجديد لغد:
              </span>
              <span className="text-base font-bold text-white font-heading">
                {student.aiPlan?.currentDailyAssignment?.newMemorization ||
                  `سورة ${student.currentSurahName} (الآيات القادمة)`}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#022c22] border border-[#065f46]">
              <span className="text-xs font-bold text-[#86efac] block mb-1">
                🔄 ورد المراجعة والتثبيت لغد:
              </span>
              <span className="text-base font-bold text-white font-heading">
                {student.aiPlan?.currentDailyAssignment?.review ||
                  `مراجعة وتثبيت السور السابقة`}
              </span>
            </div>
          </div>

          {student.aiPlan?.currentDailyAssignment?.suggestedSheikh && (
            <div className="p-4 rounded-2xl bg-[#022c22] border border-[#065f46] flex items-center gap-3 text-xs text-[#f0f9f6]">
              <Volume2 className="w-5 h-5 text-[#fbbf24] shrink-0" />
              <div>
                <span className="font-semibold text-[#86efac] block">القارئ المقترح للاستماع بالمنزل:</span>
                <span className="font-bold text-[#fbbf24] text-sm">
                  {student.aiPlan.currentDailyAssignment.suggestedSheikh}
                </span>
              </div>
            </div>
          )}

          {student.aiPlan?.currentDailyAssignment?.dailyNote && (
            <div className="p-4 rounded-2xl bg-[#022c22] border border-[#065f46] text-xs text-[#86efac]">
              <strong className="text-[#fbbf24]">📝 توجيه المتابعة المنزلية: </strong>
              {student.aiPlan.currentDailyAssignment.dailyNote}
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* FULL RECITATION & EVALUATION HISTORY (من أول يوم تم التسجيل له)   */}
        {/* ================================================================ */}
        <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 sm:p-8 space-y-5 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#065f46]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#fbbf24]/20 text-[#fbbf24] flex items-center justify-center border border-[#fbbf24]/30 shadow-md">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-heading text-white">
                  سجل التسميع اليومي الشامل (من أول يوم تسجيل)
                </h3>
                <p className="text-xs text-[#86efac]">
                  عرض تاريخي لجميع جلسات التسميع والمراجعات المسجلة للطالب ({sortedEvaluations.length} جلسة)
                </p>
              </div>
            </div>
          </div>

          {sortedEvaluations.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#022c22]/60 border border-dashed border-[#065f46] text-center text-xs text-[#86efac]/70">
              لم يتم تسجيل جلسات تسميع للطالب بعد. سيظهر السجل التاريخي الكامل فور اعتماد المعلم لأول تسميع.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEvaluations.map((ev, idx) => {
                const isLatest = idx === 0;
                const newDidNotRecite = ev.recitationDetails?.todayNewItem?.didNotRecite;
                const newDidNotReciteReason = ev.recitationDetails?.todayNewItem?.didNotReciteReason;

                return (
                  <div
                    key={ev.id || `${ev.date}_${idx}`}
                    className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
                      isLatest
                        ? 'bg-[#022c22] border-[#fbbf24]/50 shadow-md'
                        : 'bg-[#022c22]/70 border-[#065f46]'
                    }`}
                  >
                    {/* Date and Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#065f46]/70">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#fbbf24]" />
                          <span>تاريخ التسميع: <strong>{ev.date}</strong></span>
                        </span>
                        {isLatest && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] font-bold border border-[#fbbf24]/30">
                            أحدث تسجيل
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Recitation Content */}
                    <div className="space-y-2.5 text-xs">
                      {/* New Memorization */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-[#86efac] font-bold">📖 ورد الحفظ الجديد:</span>
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
                          <span className="text-[#86efac] font-bold block">🔄 المراجعة والتثبيت:</span>
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
                          <span className="text-[#86efac] font-bold">🔄 ما سمّعه في المراجعة والتثبيت:</span>
                          <span className="font-bold text-white text-right">
                            {ev.recitationDetails.reviewAchieved}
                          </span>
                        </div>
                      ) : null}

                      {/* Teacher Notes */}
                      {ev.recitationDetails?.teacherNotes && (
                        <div className="text-[#f0f9f6] pt-2 border-t border-[#065f46]/50 bg-[#064e3b]/30 p-2.5 rounded-xl">
                          <span className="text-[#fbbf24] font-bold">💡 ملاحظات وتوجيه المعلم: </span>
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
      </div>
    </div>
  );
};
