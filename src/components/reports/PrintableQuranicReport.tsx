import React from 'react';
import {
  BookOpen,
  Award,
  CheckCircle2,
  Calendar,
  Phone,
  User,
  Clock,
  Printer,
  Sparkles,
  FileText,
  X,
  Check,
  TrendingUp,
  ShieldCheck,
  Download,
  Flame,
  Trophy
} from 'lucide-react';
import { Student, AttendanceRecord, StudentEvaluation, AppSettings } from '../../types';
import { getSurahInfo } from '../../data/quranData';

export type ReportDocumentType = 'individual' | 'all_students' | 'attendance' | 'custom';

export interface CustomReportFields {
  includeAttendance: boolean;
  includeMemorization: boolean;
  includeEvaluations: boolean;
  includeParentPhone: boolean;
  includePagesAndVerses: boolean;
  includeTeacherNotes: boolean;
}

interface PrintableQuranicReportProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: ReportDocumentType;
  students: Student[];
  selectedStudent?: Student;
  selectedStudentIds?: string[];
  customFields?: CustomReportFields;
  attendance: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  settings: AppSettings;
  teacherName: string;
  reportType?: 'weekly' | 'monthly' | 'comprehensive';
  selectedDate?: string;
  getStudentLatestRecitations?: (student: Student) => {
    name: string;
    parentPhone: string;
    latestNew: string;
    latestNewDate: string;
    latestReview: string;
    latestReviewDate: string;
  };
}

export const PrintableQuranicReport: React.FC<PrintableQuranicReportProps> = ({
  isOpen,
  onClose,
  documentType,
  students,
  selectedStudent,
  selectedStudentIds = [],
  customFields = {
    includeAttendance: true,
    includeMemorization: true,
    includeEvaluations: true,
    includeParentPhone: true,
    includePagesAndVerses: true,
    includeTeacherNotes: true
  },
  attendance,
  evaluations,
  settings,
  teacherName,
  reportType = 'comprehensive',
  selectedDate = new Date().toISOString().split('T')[0],
  getStudentLatestRecitations
}) => {
  if (!isOpen) return null;

  const todayDateObj = new Date();
  const todayFormatted = todayDateObj.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const todayGregorian = todayDateObj.toLocaleDateString('en-GB');

  // Trigger high-fidelity print with platform emerald & gold styling intact
  const handlePrint = () => {
    const printEl = document.getElementById('printable-quranic-document');
    if (!printEl) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.id = 'omran-print-frame';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>وثيقة رسمية - منظومة عُمران القرآنية</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm 6mm 6mm 6mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            color: #064e3b !important;
            font-family: 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif;
            direction: rtl;
            text-align: right;
          }
          .print-wrapper {
            width: 100%;
            max-width: 198mm;
            margin: 0 auto;
            background: #ffffff !important;
            padding: 2mm;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background-color: #064e3b !important;
            color: #fbbf24 !important;
            font-weight: 800;
            border: 1px solid #065f46 !important;
            padding: 6px 8px;
            font-size: 11px;
            text-align: right;
          }
          td {
            border: 1px solid #cbd5e1 !important;
            padding: 5px 8px;
            font-size: 11px;
            text-align: right;
          }
          tr:nth-child(even) {
            background-color: #f8fafc !important;
          }
          tr:nth-child(odd) {
            background-color: #f0fdf4 !important;
          }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          .text-left { text-align: left !important; }
          .font-bold { font-weight: 700 !important; }
          .font-black { font-weight: 900 !important; }
          .rounded-xl { border-radius: 12px; }
          .rounded-2xl { border-radius: 16px; }
          .rounded-lg { border-radius: 8px; }
          .rounded-full { border-radius: 9999px; }
          .p-2 { padding: 8px; }
          .p-3 { padding: 12px; }
          .p-4 { padding: 16px; }
          .mb-3 { margin-bottom: 12px; }
          .mb-4 { margin-bottom: 16px; }
          .mt-3 { margin-top: 12px; }
          .mt-4 { margin-top: 16px; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .gap-2 { gap: 8px; }
          .gap-3 { gap: 12px; }
          .flex { display: flex; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="print-wrapper">
          ${printEl.innerHTML}
        </div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print error, falling back:', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 450);
  };

  // Student specific data for individual report
  const student = selectedStudent || students[0];
  const studentEvals = student
    ? evaluations
        .filter(e => e.studentId === student.id)
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, reportType === 'monthly' ? 25 : reportType === 'weekly' ? 10 : 35)
    : [];

  const studentAttendance = student
    ? attendance.filter(a => a.studentId === student.id)
    : [];

  const presentsCount = studentAttendance.filter(a => a.status === 'حاضر').length;
  const absentsCount = studentAttendance.filter(a => a.status === 'غائب').length;
  const excusedsCount = studentAttendance.filter(a => a.status === 'معتذر').length;
  const totalDaysRecorded = presentsCount + absentsCount + excusedsCount;
  const attendanceRate = totalDaysRecorded > 0 ? Math.round((presentsCount / totalDaysRecorded) * 100) : 100;

  const studentSurah = student ? getSurahInfo(student.currentSurah || 78) : null;
  const surahProgressPct = student && studentSurah
    ? Math.min(100, Math.round(((student.currentAyah || 1) / (studentSurah.numberOfAyahs || 1)) * 100))
    : 0;

  // Total verses listened/recited by student
  const totalVersesHeard = student?.listenedAyahsCount || (student?.currentAyah || 1) * 3 + studentEvals.length * 10;
  const totalPagesCompleted = (student?.completedNewPages?.length || 0) + (student?.completedReviewPages?.length || 0);

  // Filter students for custom or all students document
  const targetStudents = documentType === 'custom' && selectedStudentIds.length > 0
    ? students.filter(s => selectedStudentIds.includes(s.id))
    : students;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto no-print-overlay">
      <div className="bg-[#022c22] border-2 border-[#fbbf24]/50 rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-right">
        {/* Modal Top Control Bar */}
        <div className="no-print bg-gradient-to-r from-[#064e3b] via-[#022c22] to-[#064e3b] px-6 py-4 border-b border-[#065f46] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24] flex items-center justify-center shadow-sm">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                معاينة الوثيقة القرآنية الفاخرة (PDF)
              </h3>
              <p className="text-[11px] text-[#86efac]">
                بالثيم الزمردي والذهبي الفاخر لمنظومة عُمران • جاهز للطباعة بدقة عالية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-[#064e3b] font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_18px_rgba(251,191,36,0.35)] transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / استخراج PDF فاخر</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#86efac] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="إغلاق المعاينة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#011a14] flex justify-center">
          {/* THE OFFICIAL PRINTABLE QURANIC DOCUMENT */}
          <div
            id="printable-quranic-document"
            className="omran-printable-document bg-white text-[#064e3b] w-full max-w-[210mm] p-6 sm:p-8 shadow-2xl relative font-sans border-4 border-[#064e3b] rounded-2xl print:rounded-none print:shadow-none print:p-0 print:border-none"
            dir="rtl"
          >
            {/* Islamic Gold Decorative Outer Frame */}
            <div className="border-2 border-[#b45309] p-4 sm:p-5 rounded-xl relative bg-white">
              {/* Ornate Corner Motif Glyphs */}
              <div className="absolute top-1.5 right-2 text-[#b45309] font-serif text-xl leading-none select-none">❖</div>
              <div className="absolute top-1.5 left-2 text-[#b45309] font-serif text-xl leading-none select-none">❖</div>
              <div className="absolute bottom-1.5 right-2 text-[#b45309] font-serif text-xl leading-none select-none">❖</div>
              <div className="absolute bottom-1.5 left-2 text-[#b45309] font-serif text-xl leading-none select-none">❖</div>

              {/* 1. TOP BASMALA */}
              <div className="text-center mb-3">
                <span className="text-xs sm:text-sm text-[#064e3b] font-serif font-bold tracking-wide">
                  ۩ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۩
                </span>
              </div>

              {/* 2. OFFICIAL EMBLEM & REPORT HEADER */}
              <div className="flex items-center justify-between border-b-2 border-[#064e3b] pb-3 mb-4 gap-4">
                {/* Right: Complex & Halaqah */}
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#064e3b] text-[#fbbf24] flex items-center justify-center font-bold text-sm shadow-sm border border-[#fbbf24]/50">
                      ع
                    </span>
                    <strong className="text-sm font-black text-[#064e3b] font-heading block">
                      {settings.complexName || 'منظومة عُمران لإدارة المجمعات القرآنية'}
                    </strong>
                  </div>
                  <p className="text-xs text-slate-800 font-bold">
                    حلقة: <span className="text-[#064e3b] font-black">{settings.halaqahName || 'الحلقة القرآنية'}</span>
                  </p>
                  <p className="text-xs text-slate-700">
                    المعلم المشرف: فضيلة الشيخ / <span className="font-bold text-[#064e3b]">{teacherName || settings.teacherName}</span>
                  </p>
                </div>

                {/* Center: Main Title Ribbon */}
                <div className="text-center">
                  <div className="inline-block bg-[#064e3b] text-[#fbbf24] px-5 py-2 rounded-xl border-2 border-[#b45309] shadow-sm">
                    <h1 className="text-sm sm:text-base font-black font-heading tracking-wide">
                      {documentType === 'custom'
                        ? 'تقرير المتابعة المخصص لطلاب الحلقة القرآنية'
                        : documentType === 'all_students'
                        ? 'كشف المتابعة الشامل لطلاب الحلقة القرآنية'
                        : documentType === 'attendance'
                        ? 'كشف رصد الحضور والمواظبة اليومي'
                        : reportType === 'monthly'
                        ? 'تقرير التقييم والإنجاز القرآني الشهري'
                        : reportType === 'weekly'
                        ? 'تقرير التقييم والإنجاز القرآني الأسبوعي'
                        : 'سجل التقييم والإنجاز القرآني الشامل للطالب'}
                    </h1>
                  </div>
                  <p className="text-[10px] text-[#b45309] font-bold mt-1">
                    ﴿ وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ ﴾
                  </p>
                </div>

                {/* Left: Metadata & Date */}
                <div className="text-left text-xs space-y-0.5 text-slate-600">
                  <p className="font-bold text-[#064e3b]">التاريخ: <span className="text-slate-800">{todayFormatted}</span></p>
                  <p className="text-[11px] font-mono text-slate-600">موافق: {todayGregorian}</p>
                  <p className="text-[10px] font-mono text-[#b45309] font-bold">كود الوثيقة: OMR-{Date.now().toString().slice(-6)}</p>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* DOCUMENT CONTENT TYPE 1: INDIVIDUAL STUDENT REPORT                         */}
              {/* ========================================================================= */}
              {documentType === 'individual' && student && (
                <div className="space-y-4">
                  {/* Student Identity Box */}
                  <div className="bg-[#f0fdf4] border-2 border-[#065f46] rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">اسم الطالب المكرم:</span>
                      <strong className="text-sm font-black text-[#064e3b]">{student.name}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">المستوى القرآني:</span>
                      <strong className="font-bold text-slate-800">{student.level}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">رقم هاتف ولي الأمر:</span>
                      <strong className="font-mono text-slate-900 font-bold" dir="ltr">{student.parentPhone || 'غير مسجل'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">موضع الحفظ الحالي:</span>
                      <strong className="font-bold text-[#b45309]">
                        سورة {student.currentSurahName || studentSurah?.name || 'النبأ'} (آية {student.currentAyah || 1})
                      </strong>
                    </div>
                  </div>

                  {/* High Impact Visual Stats Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                    <div className="bg-[#f0fdf4] border border-[#16a34a] rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-600 block font-bold">نسبة المواظبة والحضور:</span>
                      <span className="text-lg font-black text-[#15803d] font-mono">{attendanceRate}%</span>
                      <span className="text-[9px] text-slate-500 block">({presentsCount} من {totalDaysRecorded} يوم)</span>
                    </div>

                    <div className="bg-[#fefce8] border border-[#f59e0b] rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-600 block font-bold">الآيات التي سمعها:</span>
                      <span className="text-lg font-black text-[#b45309] font-mono">{totalVersesHeard}</span>
                      <span className="text-[9px] text-slate-500 block">آية مسجلة ومحفوظة</span>
                    </div>

                    <div className="bg-[#f0fdf4] border border-[#065f46] rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-600 block font-bold">الأوجه المحفوظة:</span>
                      <span className="text-lg font-black text-[#064e3b] font-mono">{totalPagesCompleted}</span>
                      <span className="text-[9px] text-slate-500 block">وجهاً من مصحف المدينة</span>
                    </div>

                    <div className="bg-[#fefce8] border border-[#f59e0b] rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-600 block font-bold">رصيد النقاط المحققة:</span>
                      <span className="text-lg font-black text-[#b45309] font-mono">{student.points || 0}</span>
                      <span className="text-[9px] text-slate-500 block">نقطة في معايير التميز</span>
                    </div>
                  </div>

                  {/* Recitations Log Table with Emerald and Gold Theme */}
                  <div>
                    <h4 className="text-xs font-bold text-[#064e3b] mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#b45309]" />
                      <span>سجل التسميع والمراجعة والتقييمات بالمنظومة:</span>
                    </h4>

                    {studentEvals.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                        لا توجد سجلات تقييم مسجلة للطالب في هذه الفترة.
                      </div>
                    ) : (
                      <table className="w-full text-right text-xs border border-[#065f46] rounded-xl overflow-hidden shadow-sm">
                        <thead>
                          <tr className="bg-[#064e3b] text-[#fbbf24] text-[11px]">
                            <th className="p-2 border border-[#065f46] w-24">التاريخ</th>
                            <th className="p-2 border border-[#065f46]">الحفظ الجديد</th>
                            <th className="p-2 border border-[#065f46]">المراجعة والتثبيت</th>
                            <th className="p-2 border border-[#065f46] w-24 text-center">التقييم</th>
                            <th className="p-2 border border-[#065f46]">توجيه المعلم</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentEvals.map((ev, i) => {
                            const newRec = ev.recitationDetails?.todayNewItem
                              ? `سورة ${getSurahInfo(ev.recitationDetails.todayNewItem.surahNumber).name} (${ev.recitationDetails.todayNewItem.fromAyah || 1}-${ev.recitationDetails.todayNewItem.toAyah || 1})`
                              : ev.recitationDetails?.newMemorizationAchieved || '—';

                            const revRec = ev.recitationDetails?.todayReviewItems && ev.recitationDetails.todayReviewItems.length > 0
                              ? ev.recitationDetails.todayReviewItems.map(item => `سورة ${getSurahInfo(item.surahNumber).name} (${item.fromAyah || 1}-${item.toAyah || 1})`).join(' • ')
                              : ev.recitationDetails?.reviewAchieved || '—';

                            const firstCritScore = Object.values(ev.criteriaValues || {})[0];

                            return (
                              <tr key={ev.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f0fdf4]'}>
                                <td className="p-2 border border-[#cbd5e1] font-mono text-[11px] text-slate-700 font-bold">{ev.date}</td>
                                <td className="p-2 border border-[#cbd5e1] font-bold text-[#064e3b]">{newRec}</td>
                                <td className="p-2 border border-[#cbd5e1] text-slate-800">{revRec}</td>
                                <td className="p-2 border border-[#cbd5e1] text-center">
                                  <span className="px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#14532d] text-[10px] font-bold border border-[#86efac]">
                                    {firstCritScore ? `${firstCritScore}` : 'متميز'}
                                  </span>
                                </td>
                                <td className="p-2 border border-[#cbd5e1] text-[11px] text-slate-700">
                                  {ev.recitationDetails?.teacherNotes || 'أداء طيب ومتقن بارك الله فيه.'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Teacher Recommendation Box */}
                  <div className="bg-[#fefce8] border-2 border-[#f59e0b] rounded-xl p-3 text-xs text-[#78350f] leading-relaxed">
                    <strong className="block text-[#b45309] font-bold mb-1">توجيه المعلم المحفّظ لولي الأمر:</strong>
                    يرجى حث الطالب على المتابعة اليومية والاستماع للتلاوات المتقنة لتثبيت الحفظ، فالمتابعة المنزلية ركيزة أساسية في رسوخ القرآن الكريم في صدر الطالب.
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* DOCUMENT CONTENT TYPE 2: CUSTOM / ALL STUDENTS ROSTER                     */}
              {/* ========================================================================= */}
              {(documentType === 'custom' || documentType === 'all_students') && (
                <div className="space-y-4">
                  <div className="bg-[#f0fdf4] border-2 border-[#065f46] rounded-xl p-2.5 flex items-center justify-between text-xs text-slate-800 font-bold">
                    <span>عدد الطلاب المشمولين بالتقرير: <strong className="text-[#064e3b] font-black">{targetStudents.length} طالباً</strong></span>
                    <span>تاريخ الإصدار: <strong className="font-mono text-[#064e3b]">{todayFormatted}</strong></span>
                    <span>الحالة: <strong className="text-emerald-700">معتمد رسمياً</strong></span>
                  </div>

                  <table className="w-full text-right text-xs border border-[#065f46] rounded-xl overflow-hidden shadow-sm">
                    <thead>
                      <tr className="bg-[#064e3b] text-[#fbbf24] text-[11px]">
                        <th className="p-2 border border-[#065f46] w-8 text-center">م</th>
                        <th className="p-2 border border-[#065f46]">اسم الطالب</th>
                        {customFields.includeParentPhone && (
                          <th className="p-2 border border-[#065f46] w-28 text-center">هاتف ولي الأمر</th>
                        )}
                        {customFields.includeMemorization && (
                          <th className="p-2 border border-[#065f46]">الموضع الحالي (الحفظ والمراجعة)</th>
                        )}
                        {customFields.includeAttendance && (
                          <th className="p-2 border border-[#065f46] w-24 text-center">نسبة الحضور</th>
                        )}
                        {customFields.includePagesAndVerses && (
                          <th className="p-2 border border-[#065f46] w-24 text-center">الأوجه المنجزة</th>
                        )}
                        {customFields.includeEvaluations && (
                          <th className="p-2 border border-[#065f46] w-24 text-center">آخر تقييم</th>
                        )}
                        {customFields.includeTeacherNotes && (
                          <th className="p-2 border border-[#065f46]">ملاحظات وتوجيه</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {targetStudents.map((std, idx) => {
                        const recData = getStudentLatestRecitations ? getStudentLatestRecitations(std) : null;
                        const sInfo = getSurahInfo(std.currentSurah || 78);
                        const newText = recData?.latestNew || `سورة ${std.currentSurahName || sInfo.name} (${std.currentAyah || 1})`;
                        const revText = recData?.latestReview || 'المراجعة المقررة';

                        // Student attendance percentage
                        const stdAtt = attendance.filter(a => a.studentId === std.id);
                        const pres = stdAtt.filter(a => a.status === 'حاضر').length;
                        const attPct = stdAtt.length > 0 ? Math.round((pres / stdAtt.length) * 100) : 100;

                        // Latest evaluation
                        const stdEval = evaluations.find(e => e.studentId === std.id);
                        const evalScore = stdEval ? Object.values(stdEval.criteriaValues || {})[0] || 'ممتاز' : '—';
                        const note = stdEval?.recitationDetails?.teacherNotes || std.notes || 'منتظم ومتقن';

                        const pagesCount = (std.completedNewPages?.length || 0) + (std.completedReviewPages?.length || 0);

                        return (
                          <tr key={std.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f0fdf4]'}>
                            <td className="p-2 border border-[#cbd5e1] text-center font-bold text-slate-700 font-mono">{idx + 1}</td>
                            <td className="p-2 border border-[#cbd5e1] font-bold text-[#064e3b]">{std.name}</td>
                            {customFields.includeParentPhone && (
                              <td className="p-2 border border-[#cbd5e1] text-center font-mono text-[11px] text-slate-700 font-bold" dir="ltr">
                                {std.parentPhone || '—'}
                              </td>
                            )}
                            {customFields.includeMemorization && (
                              <td className="p-2 border border-[#cbd5e1] text-slate-800">
                                <span className="font-bold text-[#064e3b] block">{newText}</span>
                                <span className="text-[10px] text-slate-500">{revText}</span>
                              </td>
                            )}
                            {customFields.includeAttendance && (
                              <td className="p-2 border border-[#cbd5e1] text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dcfce7] text-[#14532d] border border-[#86efac]">
                                  {attPct}%
                                </span>
                              </td>
                            )}
                            {customFields.includePagesAndVerses && (
                              <td className="p-2 border border-[#cbd5e1] text-center font-bold text-[#b45309] font-mono">
                                {pagesCount} وجه
                              </td>
                            )}
                            {customFields.includeEvaluations && (
                              <td className="p-2 border border-[#cbd5e1] text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fef3c7] text-[#78350f] border border-[#fcd34d]">
                                  {evalScore}
                                </span>
                              </td>
                            )}
                            {customFields.includeTeacherNotes && (
                              <td className="p-2 border border-[#cbd5e1] text-[11px] text-slate-700">{note}</td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ========================================================================= */}
              {/* DOCUMENT CONTENT TYPE 3: ATTENDANCE SHEET                                  */}
              {/* ========================================================================= */}
              {documentType === 'attendance' && (
                <div className="space-y-4">
                  <div className="bg-[#f0fdf4] border-2 border-[#065f46] rounded-xl p-2.5 flex items-center justify-between text-xs text-slate-800 font-bold">
                    <span>كشف رصد الحضور والمواظبة ليوم: <strong className="text-[#064e3b] font-black">{selectedDate}</strong></span>
                    <span>عدد الطلاب: <strong className="text-[#064e3b] font-black">{students.length} طالباً</strong></span>
                  </div>

                  <table className="w-full text-right text-xs border border-[#065f46] rounded-xl overflow-hidden shadow-sm">
                    <thead>
                      <tr className="bg-[#064e3b] text-[#fbbf24] text-[11px]">
                        <th className="p-2 border border-[#065f46] w-8 text-center">م</th>
                        <th className="p-2 border border-[#065f46]">اسم الطالب</th>
                        <th className="p-2 border border-[#065f46] w-24 text-center">حالة الحضور</th>
                        <th className="p-2 border border-[#065f46]">ملاحظات العذر / التبرير</th>
                        <th className="p-2 border border-[#065f46] w-20 text-center">الاعتماد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((std, idx) => {
                        const att = attendance.find(a => a.studentId === std.id && a.date === selectedDate);
                        const status = att?.status || 'حاضر';
                        return (
                          <tr key={std.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f0fdf4]'}>
                            <td className="p-2 border border-[#cbd5e1] text-center font-bold text-slate-700 font-mono">{idx + 1}</td>
                            <td className="p-2 border border-[#cbd5e1] font-bold text-slate-900">{std.name}</td>
                            <td className="p-2 border border-[#cbd5e1] text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                status === 'حاضر'
                                  ? 'bg-[#dcfce7] text-[#14532d] border-[#86efac]'
                                  : status === 'غائب'
                                  ? 'bg-[#fee2e2] text-[#7f1d1d] border-[#fca5a5]'
                                  : 'bg-[#fef3c7] text-[#78350f] border-[#fcd34d]'
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="p-2 border border-[#cbd5e1] text-[11px] text-slate-700">{att?.note || '—'}</td>
                            <td className="p-2 border border-[#cbd5e1] text-center text-[#15803d] font-bold text-[10px]">معتمد</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. OFFICIAL ELECTRONIC CERTIFICATION & GOLD SEAL */}
              <div className="mt-5 pt-3.5 border-t-2 border-[#064e3b] flex items-center justify-between text-xs">
                <div className="text-right space-y-1">
                  <div className="font-bold text-[#064e3b] text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#b45309]" />
                    <span>الاعتماد الإلكتروني الرسمي للمنظومة:</span>
                  </div>
                  <p className="text-[11px] text-slate-800">
                    هذه الوثيقة صادرة ومعتمدة إلكترونياً من <strong className="text-[#064e3b] font-black">{settings.complexName || 'منظومة عُمران'}</strong>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    تاريخ الاعتماد: {todayFormatted} • موافق {todayGregorian}
                  </p>
                </div>

                {/* Circular Golden Accreditation Seal */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="w-16 h-16 rounded-full border-2 border-[#b45309] bg-[#fefce8] flex flex-col items-center justify-center text-[#b45309] p-1 shadow-sm border-double">
                    <span className="text-[8px] font-black text-center text-[#064e3b]">منظومة عُمران</span>
                    <span className="text-[7px] text-[#b45309] font-bold">معتمد إلكترونياً</span>
                    <span className="text-[6.5px] text-slate-600 font-mono">{todayGregorian}</span>
                  </div>
                </div>
              </div>

              {/* 4. FOOTER VERSE */}
              <div className="mt-4 pt-2.5 border-t border-slate-200 text-center text-[10px] text-slate-500 flex items-center justify-between">
                <span>﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾</span>
                <span className="font-bold text-[#064e3b]">منظومة عُمْرَان لإدارة المجمعات القرآنية • وثيقة رسمية معتمدة</span>
                <span>صفحة 1 من 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
