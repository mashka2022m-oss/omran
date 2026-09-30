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
  Download
} from 'lucide-react';
import { Student, AttendanceRecord, StudentEvaluation, AppSettings } from '../../types';
import { getSurahInfo } from '../../data/quranData';

export type ReportDocumentType = 'individual' | 'all_students' | 'attendance';

interface PrintableQuranicReportProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: ReportDocumentType;
  students: Student[];
  selectedStudent?: Student;
  attendance: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  settings: AppSettings;
  teacherName: string;
  reportType?: 'weekly' | 'monthly';
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
  attendance,
  evaluations,
  settings,
  teacherName,
  reportType = 'weekly',
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

  // Trigger clean browser print dialog with isolated iframe (prevents background bleed and centers perfectly)
  const handlePrint = () => {
    const printEl = document.getElementById('printable-quranic-document');
    if (!printEl) {
      window.print();
      return;
    }

    // Create an isolated hidden iframe
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
        <title>وثيقة رسمية - منظومة عُمران</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 8mm 8mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif;
            direction: rtl;
            text-align: right;
          }
          .print-wrapper {
            width: 100%;
            max-width: 194mm;
            margin: 0 auto;
            background: #ffffff !important;
            padding: 4mm;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 5px 8px;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-bold { font-weight: 700; }
          .font-black { font-weight: 900; }
          .border { border: 1px solid #cbd5e1; }
          .rounded-xl { border-radius: 12px; }
          .rounded-lg { border-radius: 8px; }
          .rounded-full { border-radius: 9999px; }
          .p-2 { padding: 8px; }
          .p-3 { padding: 12px; }
          .mb-4 { margin-bottom: 16px; }
          .mt-4 { margin-top: 16px; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .gap-3 { gap: 12px; }
          .gap-4 { gap: 16px; }
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
        .slice(0, reportType === 'monthly' ? 25 : 10)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto no-print-overlay">
      {/* On-Screen Modal Container */}
      <div className="bg-[#022c22] border-2 border-[#fbbf24]/50 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-right">
        {/* Modal Top Control Bar (Screen Only - Hidden in Print) */}
        <div className="no-print bg-gradient-to-r from-[#064e3b] via-[#022c22] to-[#064e3b] px-6 py-4 border-b border-[#065f46] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24] flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                معاينة الوثيقة القرآنية واستخراج PDF
              </h3>
              <p className="text-[11px] text-[#86efac]">
                جاهزة للطباعة أو الحفظ كملف PDF عالي الجودة متوافق مع ورق A4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-[#064e3b] font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / استخراج PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="إغلاق المعاينة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#012019] flex justify-center">
          {/* ========================================================================= */}
          {/* THE OFFICIAL PRINTABLE QURANIC DOCUMENT (Styled for Screen & Print)      */}
          {/* ========================================================================= */}
          <div
            id="printable-quranic-document"
            className="omran-printable-document bg-white text-[#0f172a] w-full max-w-[210mm] p-6 sm:p-10 shadow-2xl relative font-sans border-4 border-[#064e3b] rounded-2xl print:rounded-none print:shadow-none print:p-0 print:border-none"
            dir="rtl"
          >
            {/* Islamic Double Decorative Outer Border */}
            <div className="border border-[#b45309] p-4 sm:p-6 rounded-xl relative">
              {/* Corner Ornaments */}
              <div className="absolute top-1 right-1 text-[#b45309] font-serif text-lg leading-none select-none">❖</div>
              <div className="absolute top-1 left-1 text-[#b45309] font-serif text-lg leading-none select-none">❖</div>
              <div className="absolute bottom-1 right-1 text-[#b45309] font-serif text-lg leading-none select-none">❖</div>
              <div className="absolute bottom-1 left-1 text-[#b45309] font-serif text-lg leading-none select-none">❖</div>

              {/* 1. TOP ORNATE BASMALA */}
              <div className="text-center mb-4">
                <span className="text-xs text-[#064e3b] font-serif">۩ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۩</span>
              </div>

              {/* 2. OFFICIAL EMBLEM & REPORT HEADER */}
              <div className="flex items-center justify-between border-b-2 border-[#064e3b] pb-4 mb-4 gap-4">
                {/* Right: Complex & Halaqah */}
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#064e3b] text-[#fbbf24] flex items-center justify-center font-bold text-sm">ع</span>
                    <strong className="text-sm font-black text-[#064e3b] font-heading block">
                      {settings.complexName || 'منظومة عُمران لإدارة المجمعات القرآنية'}
                    </strong>
                  </div>
                  <p className="text-xs text-slate-700 font-bold">
                    حلقة: <span className="text-[#064e3b]">{settings.halaqahName || 'الحلقة القرآنية'}</span>
                  </p>
                  <p className="text-xs text-slate-600">
                    المعلم المشرف: فضيلة الشيخ / <span className="font-bold text-[#064e3b]">{teacherName || settings.teacherName}</span>
                  </p>
                </div>

                {/* Center: Main Title Ribbon */}
                <div className="text-center">
                  <div className="inline-block bg-[#064e3b] text-[#fbbf24] px-4 py-1.5 rounded-xl border border-[#b45309] shadow-sm">
                    <h1 className="text-sm sm:text-base font-black font-heading tracking-wide">
                      {documentType === 'all_students'
                        ? 'كشف المتابعة الشامل لطلاب الحلقة القرآنية'
                        : documentType === 'attendance'
                        ? 'كشف رصد الحضور والمواظبة اليومي'
                        : reportType === 'monthly'
                        ? 'تقرير التقييم والإنجاز القرآني الشهري'
                        : 'تقرير التقييم والإنجاز القرآني الأسبوعي'}
                    </h1>
                  </div>
                  <p className="text-[10px] text-[#b45309] font-bold mt-1">
                    ﴿ وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ ﴾
                  </p>
                </div>

                {/* Left: Metadata & Date */}
                <div className="text-left text-xs space-y-0.5 text-slate-600">
                  <p className="font-bold text-[#064e3b]">التاريخ: <span className="text-slate-800">{todayFormatted}</span></p>
                  <p className="text-[11px] font-mono text-slate-500">موافق: {todayGregorian}</p>
                  <p className="text-[10px] font-mono text-[#b45309]">كود الوثيقة: OMR-{Date.now().toString().slice(-6)}</p>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* DOCUMENT CONTENT TYPE 1: INDIVIDUAL STUDENT REPORT                         */}
              {/* ========================================================================= */}
              {documentType === 'individual' && student && (
                <div className="space-y-4">
                  {/* Student Identity Box */}
                  <div className="bg-[#f0fdf4] border border-[#065f46]/30 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">اسم الطالب المكرم:</span>
                      <strong className="text-sm font-black text-[#064e3b]">{student.name}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">المستوى القرآني:</span>
                      <strong className="font-bold text-slate-800">{student.level}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">رقم هاتف ولي الأمر:</span>
                      <strong className="font-mono text-slate-800" dir="ltr">{student.parentPhone || 'غير مسجل'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">موضع الحفظ الحالي:</span>
                      <strong className="font-bold text-[#b45309]">
                        سورة {student.currentSurahName || studentSurah?.name || 'النبأ'} (آية {student.currentAyah || 1})
                      </strong>
                    </div>
                  </div>

                  {/* Attendance & Performance Summary Badges */}
                  <div className="grid grid-cols-4 gap-2.5 text-center text-xs">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <span className="text-[10px] text-slate-500 block">نسبة الحضور:</span>
                      <span className="text-base font-black text-[#064e3b] font-mono">{attendanceRate}%</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <span className="text-[10px] text-slate-500 block">أيام الحضور:</span>
                      <span className="text-base font-bold text-slate-800 font-mono">{presentsCount} يوم</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <span className="text-[10px] text-slate-500 block">أيام الغياب:</span>
                      <span className="text-base font-bold text-red-600 font-mono">{absentsCount} يوم</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <span className="text-[10px] text-slate-500 block">تقدم السورة الحالية:</span>
                      <span className="text-base font-black text-[#b45309] font-mono">{surahProgressPct}%</span>
                    </div>
                  </div>

                  {/* Recitations Log Table */}
                  <div>
                    <h4 className="text-xs font-bold text-[#064e3b] mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#b45309]" />
                      <span>سجل التسميع والمراجعة اليومي المسجل بالمنظومة:</span>
                    </h4>

                    {studentEvals.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl">
                        لا توجد سجلات تقييم مسجلة للطالب في هذه الفترة.
                      </div>
                    ) : (
                      <table className="w-full text-right text-xs border border-slate-300 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-[#064e3b] text-white text-[11px]">
                            <th className="p-2 border border-slate-300 w-24">التاريخ</th>
                            <th className="p-2 border border-slate-300">الحفظ الجديد</th>
                            <th className="p-2 border border-slate-300">المراجعة</th>
                            <th className="p-2 border border-slate-300 w-24 text-center">التقييم</th>
                            <th className="p-2 border border-slate-300">توجيه المعلم</th>
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

                            return (
                              <tr key={ev.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                <td className="p-2 border border-slate-300 font-mono text-[11px] text-slate-700">{ev.date}</td>
                                <td className="p-2 border border-slate-300 font-bold text-[#064e3b]">{newRec}</td>
                                <td className="p-2 border border-slate-300 text-slate-700">{revRec}</td>
                                <td className="p-2 border border-slate-300 text-center">
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                                    {ev.evaluationType || 'ممتاز'}
                                  </span>
                                </td>
                                <td className="p-2 border border-slate-300 text-[11px] text-slate-600">
                                  {ev.recitationDetails?.parentDailyDirective || ev.notes || 'ما شاء الله تبارك الله، واصل بهذا الإتقان.'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Teacher's Quranic Recommendation */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
                    <strong className="block text-[#b45309] font-bold mb-1">توجيه المعلم المحفّظ لولي الأمر:</strong>
                    يرجى حث الطالب على المتابعة اليومية والاستماع للتلاوات المتقنة لتثبيت الحفظ، فالمتابعة المنزلية ركيزة أساسية في رسوخ القرآن في صدر الطالب.
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* DOCUMENT CONTENT TYPE 2: ALL STUDENTS SUMMARY SHEET                        */}
              {/* ========================================================================= */}
              {documentType === 'all_students' && (
                <div className="space-y-4">
                  <div className="bg-[#f0fdf4] border border-[#065f46]/30 rounded-xl p-2.5 flex items-center justify-between text-xs text-slate-700">
                    <span>إجمالي طلاب الحلقة المقيدين: <strong className="text-[#064e3b] font-bold">{students.length} طالباً</strong></span>
                    <span>تاريخ الحصر: <strong className="font-mono">{todayFormatted}</strong></span>
                    <span>الحالة: <strong className="text-emerald-700">معتمد رسمياً</strong></span>
                  </div>

                  <table className="w-full text-right text-xs border border-slate-300 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-[#064e3b] text-white text-[11px]">
                        <th className="p-2 border border-slate-300 w-8 text-center">م</th>
                        <th className="p-2 border border-slate-300 w-36">اسم الطالب</th>
                        <th className="p-2 border border-slate-300 w-28 text-center">هاتف ولي الأمر</th>
                        <th className="p-2 border border-slate-300">الحفظ الجديد (الموضع)</th>
                        <th className="p-2 border border-slate-300">المراجعة المقررة</th>
                        <th className="p-2 border border-slate-300 w-24 text-center">تاريخ التسميع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((std, idx) => {
                        const recData = getStudentLatestRecitations ? getStudentLatestRecitations(std) : null;
                        const sInfo = getSurahInfo(std.currentSurah || 78);
                        const newText = recData?.latestNew || `سورة ${std.currentSurahName || sInfo.name} (آية ${std.currentAyah || 1})`;
                        const revText = recData?.latestReview || 'المراجعة الصغرى والكبرى';
                        const recDate = recData?.latestNewDate || selectedDate;

                        return (
                          <tr key={std.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="p-2 border border-slate-300 text-center font-bold text-slate-600 font-mono">{idx + 1}</td>
                            <td className="p-2 border border-slate-300 font-bold text-[#064e3b]">{std.name}</td>
                            <td className="p-2 border border-slate-300 text-center font-mono text-[11px] text-slate-600" dir="ltr">
                              {std.parentPhone || '—'}
                            </td>
                            <td className="p-2 border border-slate-300 text-slate-800 font-medium">{newText}</td>
                            <td className="p-2 border border-slate-300 text-slate-600 text-[11px]">{revText}</td>
                            <td className="p-2 border border-slate-300 text-center font-mono text-[10px] text-slate-500">{recDate}</td>
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
                  <div className="bg-[#f0fdf4] border border-[#065f46]/30 rounded-xl p-2.5 flex items-center justify-between text-xs text-slate-700">
                    <span>كشف رصد الحضور ليوم: <strong className="text-[#064e3b] font-bold">{selectedDate}</strong></span>
                    <span>عدد الطلاب: <strong className="text-[#064e3b] font-bold">{students.length} طالباً</strong></span>
                  </div>

                  <table className="w-full text-right text-xs border border-slate-300 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-[#064e3b] text-white text-[11px]">
                        <th className="p-2 border border-slate-300 w-8 text-center">م</th>
                        <th className="p-2 border border-slate-300">اسم الطالب</th>
                        <th className="p-2 border border-slate-300 w-24 text-center">حالة الحضور</th>
                        <th className="p-2 border border-slate-300">ملاحظات العذر / التبرير</th>
                        <th className="p-2 border border-slate-300 w-20 text-center">الاعتماد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((std, idx) => {
                        const att = attendance.find(a => a.studentId === std.id && a.date === selectedDate);
                        const status = att?.status || 'حاضر';
                        return (
                          <tr key={std.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="p-2 border border-slate-300 text-center font-bold text-slate-600 font-mono">{idx + 1}</td>
                            <td className="p-2 border border-slate-300 font-bold text-slate-800">{std.name}</td>
                            <td className="p-2 border border-slate-300 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                status === 'حاضر'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : status === 'غائب'
                                  ? 'bg-red-100 text-red-800 border-red-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="p-2 border border-slate-300 text-[11px] text-slate-600">{att?.note || '—'}</td>
                            <td className="p-2 border border-slate-300 text-center text-emerald-800 font-bold text-[10px]">معتمد</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. OFFICIAL ELECTRONIC CERTIFICATION & SEAL (بدون توقيع يدوي) */}
              <div className="mt-6 pt-4 border-t-2 border-[#064e3b] flex items-center justify-between text-xs">
                <div className="text-right space-y-1">
                  <div className="font-bold text-[#064e3b] text-xs">الاعتماد الإلكتروني الرسمي:</div>
                  <p className="text-[11px] text-slate-700">
                    هذه الوثيقة صادرة ومعتمدة إلكترونياً من <strong className="text-[#064e3b]">{settings.complexName || 'منظومة عُمران'}</strong>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    تاريخ الاعتماد: {todayFormatted} • موافق {todayGregorian}
                  </p>
                </div>

                {/* Official Circular Seal */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#b45309] flex flex-col items-center justify-center text-[#b45309] p-1 rotate-[-3deg]">
                    <span className="text-[8px] font-bold text-center">منظومة عُمران</span>
                    <span className="text-[7px] text-[#064e3b] font-bold">معتمد إلكترونياً</span>
                    <span className="text-[7px] text-slate-400 font-mono">{todayGregorian}</span>
                  </div>
                </div>
              </div>

              {/* 4. FOOTER VERSE & ATTESTATION */}
              <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 flex items-center justify-between">
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
