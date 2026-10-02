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
import { Student, AttendanceRecord, StudentEvaluation, AppSettings, getStudentParentPhone, QuranComplex } from '../../types';
import { getSurahInfo } from '../../data/quranData';
import { calculateStudentCompletedPages } from '../../data/quranPagesData';

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
  complex?: QuranComplex | null;
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
  complex,
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
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-9999';
    iframe.style.border = 'none';
    iframe.id = 'omran-print-frame';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    // Collect parent stylesheets to ensure any base classes are available
    const parentStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>وثيقة رسمية - ${complex?.name || 'المجمع القرآني'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
        ${parentStyles}
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm 6mm 6mm 6mm;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #064e3b !important;
            font-family: 'Cairo', 'Amiri', -apple-system, BlinkMacSystemFont, sans-serif !important;
            direction: rtl !important;
            text-align: right !important;
            font-size: 9pt;
            line-height: 1.35;
          }
          .print-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          /* CRITICAL RESET: Headings, Paragraphs, SVGs */
          h1, h2, h3, h4, h5, h6 {
            margin: 0 !important;
            padding: 0 !important;
            font-weight: 800 !important;
            line-height: 1.2 !important;
          }
          p {
            margin: 0 !important;
            padding: 0 !important;
          }
          svg {
            width: 12px !important;
            height: 12px !important;
            max-width: 12px !important;
            max-height: 12px !important;
            display: inline-block !important;
            vertical-align: middle !important;
          }

          /* OUTER & INNER LUXURY ISLAMIC FRAMES */
          .omran-doc-outer {
            border: 2.5px solid #064e3b !important;
            border-radius: 8px !important;
            padding: 2.5mm !important;
            background: #ffffff !important;
            box-shadow: none !important;
            width: 100% !important;
          }
          .omran-doc-inner {
            border: 1.5px solid #b45309 !important;
            border-radius: 6px !important;
            padding: 3.5mm !important;
            background: #ffffff !important;
            position: relative !important;
          }

          /* CORNER ORNAMENTS: Absolute positioning so they NEVER push content down */
          .corner-glyph {
            position: absolute !important;
            color: #b45309 !important;
            font-size: 13px !important;
            line-height: 1 !important;
            font-family: serif !important;
            user-select: none !important;
            z-index: 10 !important;
          }
          .corner-tr { top: 3px !important; right: 4px !important; }
          .corner-tl { top: 3px !important; left: 4px !important; }
          .corner-br { bottom: 3px !important; right: 4px !important; }
          .corner-bl { bottom: 3px !important; left: 4px !important; }

          /* 1. TOP BASMALA */
          .basmala-banner {
            text-align: center !important;
            margin: 0 0 3px 0 !important;
            padding: 0 !important;
          }
          .basmala-text {
            font-size: 10pt !important;
            font-family: 'Amiri', serif !important;
            font-weight: bold !important;
            color: #064e3b !important;
            letter-spacing: 0.5px !important;
            display: inline-block !important;
          }

          /* 2. OFFICIAL EMBLEM & REPORT HEADER */
          .header-row {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            border-bottom: 2px solid #064e3b !important;
            padding-bottom: 5px !important;
            margin-bottom: 6px !important;
            gap: 8px !important;
          }
          .header-org {
            text-align: right !important;
            font-size: 8pt !important;
            line-height: 1.35 !important;
            flex: 1 1 0 !important;
          }
          .org-title {
            font-size: 9pt !important;
            font-weight: 900 !important;
            color: #064e3b !important;
            display: block !important;
          }
          .org-sub {
            font-size: 7.5pt !important;
            color: #334155 !important;
            display: block !important;
          }
          .header-center {
            text-align: center !important;
            flex: 0 0 auto !important;
          }
          .report-title-badge {
            display: inline-block !important;
            background-color: #064e3b !important;
            color: #fbbf24 !important;
            padding: 4px 12px !important;
            border-radius: 6px !important;
            border: 1.5px solid #b45309 !important;
          }
          .report-title-badge h1 {
            font-size: 10.5pt !important;
            font-weight: 900 !important;
            color: #fbbf24 !important;
            margin: 0 !important;
            letter-spacing: 0.2px !important;
          }
          .quran-ayah-motto {
            font-size: 7pt !important;
            color: #b45309 !important;
            font-weight: 700 !important;
            margin-top: 2px !important;
          }
          .header-meta {
            text-align: left !important;
            font-size: 7.5pt !important;
            line-height: 1.35 !important;
            color: #475569 !important;
            flex: 1 1 0 !important;
          }

          /* 3. STUDENT IDENTITY BOX */
          .student-identity-box {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 6px !important;
            background-color: #f0fdf4 !important;
            border: 1.5px solid #065f46 !important;
            border-radius: 6px !important;
            padding: 5px 8px !important;
            margin-bottom: 6px !important;
            font-size: 8pt !important;
          }
          .identity-col {
            text-align: right !important;
          }
          .identity-lbl {
            font-size: 6.5pt !important;
            color: #64748b !important;
            font-weight: 700 !important;
            display: block !important;
          }
          .identity-val {
            font-size: 8pt !important;
            font-weight: 900 !important;
            color: #064e3b !important;
            display: block !important;
          }

          /* 4. HIGH IMPACT VISUAL STATS BADGES - STRICT 4 COLUMNS */
          .stats-grid-4 {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 5px !important;
            margin-bottom: 6px !important;
          }
          .stat-card-green {
            background-color: #f0fdf4 !important;
            border: 1px solid #16a34a !important;
            border-radius: 6px !important;
            padding: 4px !important;
            text-align: center !important;
          }
          .stat-card-gold {
            background-color: #fefce8 !important;
            border: 1px solid #f59e0b !important;
            border-radius: 6px !important;
            padding: 4px !important;
            text-align: center !important;
          }
          .stat-num {
            font-size: 13pt !important;
            font-weight: 900 !important;
            font-family: monospace, sans-serif !important;
            line-height: 1.1 !important;
            display: block !important;
            margin: 1px 0 !important;
          }
          .stat-lbl {
            font-size: 7pt !important;
            font-weight: 700 !important;
            color: #475569 !important;
            display: block !important;
          }
          .stat-sub {
            font-size: 6.5pt !important;
            color: #64748b !important;
            display: block !important;
          }

          /* 5. DATA TABLES & HEADINGS */
          .section-heading {
            font-size: 8.5pt !important;
            font-weight: 800 !important;
            color: #064e3b !important;
            margin-bottom: 4px !important;
            display: flex !important;
            align-items: center !important;
            gap: 4px !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-bottom: 6px !important;
            page-break-inside: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          th {
            background-color: #064e3b !important;
            color: #fbbf24 !important;
            font-weight: 800 !important;
            border: 1px solid #065f46 !important;
            padding: 4px 6px !important;
            font-size: 8pt !important;
            text-align: right !important;
          }
          td {
            border: 1px solid #cbd5e1 !important;
            padding: 3.5px 5px !important;
            font-size: 7.5pt !important;
            text-align: right !important;
            color: #0f172a !important;
            line-height: 1.25 !important;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc !important;
          }
          tr:nth-child(odd) td {
            background-color: #ffffff !important;
          }
          .badge-pill {
            display: inline-block !important;
            padding: 1px 6px !important;
            border-radius: 9999px !important;
            font-size: 7pt !important;
            font-weight: 800 !important;
          }
          .badge-green {
            background-color: #dcfce7 !important;
            color: #14532d !important;
            border: 1px solid #86efac !important;
          }
          .badge-amber {
            background-color: #fef3c7 !important;
            color: #78350f !important;
            border: 1px solid #fcd34d !important;
          }
          .badge-red {
            background-color: #fee2e2 !important;
            color: #7f1d1d !important;
            border: 1px solid #fca5a5 !important;
          }

          /* 6. ADVICE / RECOMMENDATION BOX */
          .advice-banner {
            background-color: #fefce8 !important;
            border: 1.2px solid #f59e0b !important;
            border-radius: 5px !important;
            padding: 4px 8px !important;
            font-size: 7.5pt !important;
            color: #78350f !important;
            line-height: 1.35 !important;
            margin-bottom: 6px !important;
            page-break-inside: avoid !important;
          }

          /* 7. OFFICIAL ACCREDITATION SEAL */
          .seal-row {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            border-top: 1.5px solid #064e3b !important;
            padding-top: 4px !important;
            margin-top: 5px !important;
            page-break-inside: avoid !important;
          }
          .seal-info {
            font-size: 7.5pt !important;
            color: #334155 !important;
            line-height: 1.3 !important;
          }
          .seal-badge {
            width: 46px !important;
            height: 46px !important;
            border-radius: 50% !important;
            border: 1.5px double #b45309 !important;
            background-color: #fefce8 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            padding: 2px !important;
            flex-shrink: 0 !important;
          }

          /* 8. FOOTER */
          .doc-footer {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            border-top: 1px solid #e2e8f0 !important;
            padding-top: 3px !important;
            margin-top: 4px !important;
            font-size: 6.5pt !important;
            color: #64748b !important;
            page-break-inside: avoid !important;
          }
        </style>
      </head>
      <body>
        <div class="print-wrapper">
          ${printEl.outerHTML}
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
        .slice(0, reportType === 'monthly' ? 20 : reportType === 'weekly' ? 8 : 14)
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
  const singleStudentPages = calculateStudentCompletedPages(student, evaluations);
  const totalPagesCompleted = singleStudentPages.totalPagesCount;

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
                وثيقة قرآنية رسمية معتمدة للمجمع • جاهزة للطباعة بدقة عالية
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
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-[#011a14] flex justify-center items-start">
          {/* THE OFFICIAL PRINTABLE QURANIC DOCUMENT */}
          <div
            id="printable-quranic-document"
            className="omran-doc-outer bg-white text-[#064e3b] w-full max-w-[210mm] p-2.5 sm:p-3 shadow-2xl relative font-sans border-2 border-[#064e3b] rounded-xl"
            dir="rtl"
          >
            {/* Islamic Gold Decorative Outer Frame */}
            <div className="omran-doc-inner border-[1.5px] border-[#b45309] p-3 sm:p-3.5 rounded-lg relative bg-white">
              {/* Ornate Corner Motif Glyphs */}
              <div className="corner-glyph corner-tr select-none">❖</div>
              <div className="corner-glyph corner-tl select-none">❖</div>
              <div className="corner-glyph corner-br select-none">❖</div>
              <div className="corner-glyph corner-bl select-none">❖</div>

              {/* 1. TOP BASMALA */}
              <div className="basmala-banner text-center mb-1">
                <span className="basmala-text font-serif font-bold">
                  ۩ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۩
                </span>
              </div>

              {/* 2. OFFICIAL EMBLEM & REPORT HEADER */}
              <div className="header-row flex items-center justify-between border-b-2 border-[#064e3b] pb-2 mb-2 gap-3">
                {/* Right: Complex & Halaqah */}
                <div className="header-org text-right space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    {complex?.logoUrl ? (
                      <img
                        src={complex.logoUrl}
                        alt="شعار المجمع"
                        style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '4px' }}
                      />
                    ) : (
                      <span className="w-5 h-5 rounded-md bg-[#064e3b] text-[#fbbf24] flex items-center justify-center font-bold text-xs shadow-sm border border-[#fbbf24]/50">
                        {complex?.name ? complex.name.replace(/^(مجمع|مراكز|حلقات)\s+/i, '').charAt(0) || 'ق' : 'ق'}
                      </span>
                    )}
                    <strong className="org-title font-heading">
                      {complex?.name || settings.complexName || 'مجمع تحفيظ القرآن الكريم'}
                    </strong>
                  </div>
                  <p className="org-sub font-bold text-slate-800">
                    حلقة: <span className="text-[#064e3b] font-black">{settings.halaqahName || 'الحلقة القرآنية'}</span>
                  </p>
                  <p className="org-sub text-slate-700">
                    المعلم المشرف: فضيلة الشيخ / <span className="font-bold text-[#064e3b]">{teacherName || settings.teacherName}</span>
                  </p>
                </div>

                {/* Center: Main Title Ribbon */}
                <div className="header-center text-center">
                  <div className="report-title-badge shadow-sm">
                    <h1 className="font-heading">
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
                  <p className="quran-ayah-motto font-bold">
                    ﴿ وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ ﴾
                  </p>
                </div>

                {/* Left: Metadata & Date */}
                <div className="header-meta text-left space-y-0.5">
                  <p className="font-bold text-[#064e3b]">التاريخ: <span className="text-slate-800">{todayFormatted}</span></p>
                  <p className="font-mono text-slate-600">موافق: {todayGregorian}</p>
                  <p className="font-mono text-[#b45309] font-bold">كود: DOC-{Date.now().toString().slice(-6)}</p>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* DOCUMENT CONTENT TYPE 1: INDIVIDUAL STUDENT REPORT                         */}
              {/* ========================================================================= */}
              {documentType === 'individual' && student && (
                <div className="space-y-2">
                  {/* Student Identity Box */}
                  <div className="student-identity-box">
                    <div className="identity-col">
                      <span className="identity-lbl">اسم الطالب المكرم:</span>
                      <strong className="identity-val">{student.name}</strong>
                    </div>
                    <div className="identity-col">
                      <span className="identity-lbl">المستوى القرآني:</span>
                      <strong className="identity-val text-slate-800">{student.level}</strong>
                    </div>
                    <div className="identity-col">
                      <span className="identity-lbl">رقم هاتف ولي الأمر:</span>
                      <strong className="identity-val font-mono text-slate-900" dir="ltr">{getStudentParentPhone(student) || 'غير مسجل'}</strong>
                    </div>
                    <div className="identity-col">
                      <span className="identity-lbl">موضع الحفظ الحالي:</span>
                      <strong className="identity-val text-[#b45309]">
                        سورة {student.currentSurahName || studentSurah?.name || 'النبأ'} (آية {student.currentAyah || 1})
                      </strong>
                    </div>
                  </div>

                  {/* High Impact Visual Stats Badges - Strict 4 columns */}
                  <div className="stats-grid-4">
                    <div className="stat-card-green">
                      <span className="stat-lbl">نسبة المواظبة والحضور:</span>
                      <span className="stat-num text-[#15803d]">{attendanceRate}%</span>
                      <span className="stat-sub">({presentsCount} من {totalDaysRecorded} يوم)</span>
                    </div>

                    <div className="stat-card-gold">
                      <span className="stat-lbl">الآيات التي سمعها:</span>
                      <span className="stat-num text-[#b45309]">{totalVersesHeard}</span>
                      <span className="stat-sub">آية مسجلة ومحفوظة</span>
                    </div>

                    <div className="stat-card-green">
                      <span className="stat-lbl">الأوجه المحفوظة:</span>
                      <span className="stat-num text-[#064e3b]">{totalPagesCompleted}</span>
                      <span className="stat-sub">وجهاً من مصحف المدينة</span>
                    </div>

                    <div className="stat-card-gold">
                      <span className="stat-lbl">رصيد النقاط المحققة:</span>
                      <span className="stat-num text-[#b45309]">{student.points || 0}</span>
                      <span className="stat-sub">نقطة في معايير التميز</span>
                    </div>
                  </div>

                  {/* Recitations Log Table with Emerald and Gold Theme */}
                  <div>
                    <h4 className="section-heading">
                      <BookOpen style={{ width: '13px', height: '13px' }} className="text-[#b45309]" />
                      <span>سجل التسميع والمراجعة والتقييمات بالمنظومة:</span>
                    </h4>

                    {studentEvals.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                        لا توجد سجلات تقييم مسجلة للطالب في هذه الفترة.
                      </div>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: '75px' }}>التاريخ</th>
                            <th>الحفظ الجديد</th>
                            <th>المراجعة والتثبيت</th>
                            <th style={{ width: '70px', textAlign: 'center' }}>التقييم</th>
                            <th>توجيه المعلم</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentEvals.map((ev, i) => {
                            const newRec = ev.recitationDetails?.todayNewItem
                              ? `سورة ${getSurahInfo(ev.recitationDetails.todayNewItem.surahNumber).name} (${ev.recitationDetails.todayNewItem.fromAyah || 1}-${ev.recitationDetails.todayNewItem.toAyah || 1})`
                              : ev.recitationDetails?.newMemorizationAchieved || '—';

                            const revRec = ev.recitationDetails?.todayReviewItems && ev.recitationDetails.todayReviewItems.length > 0
                              ? ev.recitationDetails.todayReviewItems.map(item => {
                                  const s1 = getSurahInfo(item.surahNumber || 78);
                                  const s2 = item.toSurahNumber ? getSurahInfo(item.toSurahNumber) : s1;
                                  if (item.toSurahNumber && item.toSurahNumber !== item.surahNumber) {
                                    return `من سورة ${s1.name} (آية ${item.fromAyah || 1}) إلى سورة ${s2.name} (آية ${item.toAyah || 1})`;
                                  }
                                  return `سورة ${s1.name} (${item.fromAyah || 1}-${item.toAyah || 1})`;
                                }).join(' • ')
                              : ev.recitationDetails?.reviewAchieved || '—';

                            const firstCritScore = Object.values(ev.criteriaValues || {})[0];

                            return (
                              <tr key={ev.id || i}>
                                <td style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{ev.date}</td>
                                <td style={{ fontWeight: 'bold', color: '#064e3b' }}>{newRec}</td>
                                <td>{revRec}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className="badge-pill badge-green">
                                    {firstCritScore ? `${firstCritScore}` : 'متميز'}
                                  </span>
                                </td>
                                <td>
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
                  <div className="advice-banner">
                    <strong style={{ display: 'block', color: '#b45309', marginBottom: '2px', fontWeight: 'bold' }}>
                      توجيه المعلم المحفّظ لولي الأمر:
                    </strong>
                    يرجى حث الطالب على المتابعة اليومية والاستماع للتلاوات المتقنة لتثبيت الحفظ، فالمتابعة المنزلية ركيزة أساسية في رسوخ القرآن الكريم في صدر الطالب.
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* DOCUMENT CONTENT TYPE 2: CUSTOM / ALL STUDENTS ROSTER                     */}
              {/* ========================================================================= */}
              {(documentType === 'custom' || documentType === 'all_students') && (
                <div className="space-y-2">
                  <div className="student-identity-box flex items-center justify-between" style={{ display: 'flex' }}>
                    <span>عدد الطلاب المشمولين بالتقرير: <strong className="text-[#064e3b] font-black">{targetStudents.length} طالباً</strong></span>
                    <span>تاريخ الإصدار: <strong className="font-mono text-[#064e3b]">{todayFormatted}</strong></span>
                    <span>الحالة: <strong className="text-emerald-700">معتمد رسمياً</strong></span>
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '28px', textAlign: 'center' }}>م</th>
                        <th>اسم الطالب</th>
                        {customFields.includeParentPhone && (
                          <th style={{ width: '90px', textAlign: 'center' }}>هاتف ولي الأمر</th>
                        )}
                        {customFields.includeMemorization && (
                          <th>الموضع الحالي (الحفظ والمراجعة)</th>
                        )}
                        {customFields.includeAttendance && (
                          <th style={{ width: '70px', textAlign: 'center' }}>نسبة الحضور</th>
                        )}
                        {customFields.includePagesAndVerses && (
                          <th style={{ width: '70px', textAlign: 'center' }}>الأوجه المنجزة</th>
                        )}
                        {customFields.includeEvaluations && (
                          <th style={{ width: '65px', textAlign: 'center' }}>آخر تقييم</th>
                        )}
                        {customFields.includeTeacherNotes && (
                          <th>ملاحظات وتوجيه</th>
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

                        const stdProgress = calculateStudentCompletedPages(std, evaluations);
                        const pagesCount = stdProgress.totalPagesCount;

                        return (
                          <tr key={std.id}>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace' }}>{idx + 1}</td>
                            <td style={{ fontWeight: 'bold', color: '#064e3b' }}>{std.name}</td>
                            {customFields.includeParentPhone && (
                              <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold' }} dir="ltr">
                                {getStudentParentPhone(std) || '—'}
                              </td>
                            )}
                            {customFields.includeMemorization && (
                              <td>
                                <span style={{ fontWeight: 'bold', color: '#064e3b', display: 'block' }}>{newText}</span>
                                <span style={{ fontSize: '6.5pt', color: '#64748b' }}>{revText}</span>
                              </td>
                            )}
                            {customFields.includeAttendance && (
                              <td style={{ textAlign: 'center' }}>
                                <span className="badge-pill badge-green">
                                  {attPct}%
                                </span>
                              </td>
                            )}
                            {customFields.includePagesAndVerses && (
                              <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#b45309', fontFamily: 'monospace' }}>
                                {pagesCount} وجه
                              </td>
                            )}
                            {customFields.includeEvaluations && (
                              <td style={{ textAlign: 'center' }}>
                                <span className="badge-pill badge-amber">
                                  {evalScore}
                                </span>
                              </td>
                            )}
                            {customFields.includeTeacherNotes && (
                              <td>{note}</td>
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
                <div className="space-y-2">
                  <div className="student-identity-box flex items-center justify-between" style={{ display: 'flex' }}>
                    <span>كشف رصد الحضور والمواظبة ليوم: <strong className="text-[#064e3b] font-black">{selectedDate}</strong></span>
                    <span>عدد الطلاب: <strong className="text-[#064e3b] font-black">{students.length} طالباً</strong></span>
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '28px', textAlign: 'center' }}>م</th>
                        <th>اسم الطالب</th>
                        <th style={{ width: '75px', textAlign: 'center' }}>حالة الحضور</th>
                        <th>ملاحظات العذر / التبرير</th>
                        <th style={{ width: '60px', textAlign: 'center' }}>الاعتماد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((std, idx) => {
                        const att = attendance.find(a => a.studentId === std.id && a.date === selectedDate);
                        const status = att?.status || 'حاضر';
                        return (
                          <tr key={std.id}>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace' }}>{idx + 1}</td>
                            <td style={{ fontWeight: 'bold' }}>{std.name}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`badge-pill ${
                                status === 'حاضر'
                                  ? 'badge-green'
                                  : status === 'غائب'
                                  ? 'badge-red'
                                  : 'badge-amber'
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td>{att?.note || '—'}</td>
                            <td style={{ textAlign: 'center', color: '#15803d', fontWeight: 'bold' }}>معتمد</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. OFFICIAL ELECTRONIC CERTIFICATION & GOLD SEAL */}
              <div className="seal-row">
                <div className="seal-info">
                  <div style={{ fontWeight: 'bold', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <ShieldCheck style={{ width: '13px', height: '13px' }} className="text-[#b45309]" />
                    <span>الاعتماد الرسمي لإدارة {complex?.name || 'المجمع القرآني'}:</span>
                  </div>
                  <p style={{ fontSize: '7.5pt', color: '#1e293b' }}>
                    هذه الوثيقة صادرة ومعتمدة رسمياً من إدارة {complex?.name || 'المجمع القرآني'}
                  </p>
                </div>

                {/* Bottom Left: Official Stamp or Seal Badge */}
                <div className="seal-badge" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {complex?.stampUrl ? (
                    <img
                      src={complex.stampUrl}
                      alt="ختم المجمع"
                      style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '50%' }}
                    />
                  ) : (
                    <span style={{ fontSize: '7.5pt', color: '#b45309', fontWeight: '900', lineHeight: 1.2 }}>معتمد رسمياً</span>
                  )}
                </div>
              </div>

              {/* 4. FOOTER VERSE */}
              <div className="doc-footer">
                <span>﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾</span>
                <span>صفحة 1 من 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
