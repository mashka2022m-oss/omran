import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Award,
  Sparkles,
  BookOpen,
  Users,
  CheckCircle2,
  Filter,
  Activity,
  Layers,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { Student, StudentEvaluation, AttendanceRecord, AppSettings } from '../../types';

interface ReportsChartsViewProps {
  students: Student[];
  evaluations: StudentEvaluation[];
  attendance: AttendanceRecord[];
  settings: AppSettings;
  selectedStudentId?: string;
}

export const ReportsChartsView: React.FC<ReportsChartsViewProps> = ({
  students,
  evaluations,
  attendance,
  settings,
  selectedStudentId: initialStudentId
}) => {
  const [activeChartMode, setActiveChartMode] = useState<'timeline' | 'comparison' | 'single_student'>('timeline');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [selectedStudentForChart, setSelectedStudentForChart] = useState<string>(
    initialStudentId || (students[0]?.id || '')
  );

  // Instantly update selected student when students list changes (e.g. activeHalaqahId switch)
  useEffect(() => {
    if (students.length > 0) {
      if (!selectedStudentForChart || !students.some(s => s.id === selectedStudentForChart)) {
        setSelectedStudentForChart(students[0].id);
      }
    } else {
      setSelectedStudentForChart('');
    }
  }, [students, selectedStudentForChart]);

  // Filter evaluations by time range
  const filteredEvaluations = useMemo(() => {
    if (timeRange === 'all') {
      return [...evaluations].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    }

    const daysCount = timeRange === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysCount);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    return evaluations
      .filter(e => e.date && e.date >= cutoffStr)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [evaluations, timeRange]);

  // Map of student IDs to Student objects for instant lookup
  const studentsMap = useMemo(() => {
    const map: Record<string, Student> = {};
    students.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [students]);

  // Aggregate KPI summary metrics from evaluations in Firestore
  const kpiMetrics = useMemo(() => {
    let totalNewMemorizationCount = 0;
    let totalReviewCount = 0;
    let totalPointsAccumulated = 0;
    const evaluatedStudentIds = new Set<string>();

    filteredEvaluations.forEach(ev => {
      evaluatedStudentIds.add(ev.studentId);

      // Check New Memorization
      const hasNewItem = Boolean(ev.recitationDetails?.todayNewItem?.surahNumber);
      const hasNewText = Boolean(
        ev.recitationDetails?.newMemorizationAchieved &&
        ev.recitationDetails.newMemorizationAchieved.trim().length > 0 &&
        !ev.recitationDetails.newMemorizationAchieved.includes('لم يسمّع') &&
        !ev.recitationDetails.newMemorizationAchieved.includes('لم يسمع')
      );
      if (hasNewItem || hasNewText) {
        totalNewMemorizationCount += 1;
      }

      // Check Review
      const hasReviewItems = Boolean(
        (ev.recitationDetails?.todayReviewItems && ev.recitationDetails.todayReviewItems.length > 0) ||
        ev.recitationDetails?.todayReviewItem?.surahNumber
      );
      const hasReviewText = Boolean(
        ev.recitationDetails?.reviewAchieved &&
        ev.recitationDetails.reviewAchieved.trim().length > 0 &&
        !ev.recitationDetails.reviewAchieved.includes('لم يراجع')
      );
      if (hasReviewItems || hasReviewText) {
        totalReviewCount += (ev.recitationDetails?.todayReviewItems?.length || 1);
      }

      // Points earned
      const pts = ev.recitationDetails?.pointsEarnedToday || 0;
      totalPointsAccumulated += pts;
    });

    return {
      totalEvaluations: filteredEvaluations.length,
      totalNewMemorizationCount,
      totalReviewCount,
      totalPointsAccumulated,
      activeStudentsCount: evaluatedStudentIds.size
    };
  }, [filteredEvaluations]);

  // 1. Timeline Data: Group by Date for AreaChart
  const timelineChartData = useMemo(() => {
    const dateMap: Record<string, {
      date: string;
      formattedDate: string;
      newMemorization: number;
      review: number;
      points: number;
      studentsCount: number;
    }> = {};

    filteredEvaluations.forEach(ev => {
      const d = ev.date || 'غير محدد';
      if (!dateMap[d]) {
        let formatted = d;
        try {
          const parts = d.split('-');
          if (parts.length === 3) {
            formatted = `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}`;
          }
        } catch {
          formatted = d;
        }

        dateMap[d] = {
          date: d,
          formattedDate: formatted,
          newMemorization: 0,
          review: 0,
          points: 0,
          studentsCount: 0
        };
      }

      const entry = dateMap[d];
      entry.studentsCount += 1;

      // Count new memorization
      const hasNewItem = Boolean(ev.recitationDetails?.todayNewItem?.surahNumber);
      const hasNewText = Boolean(
        ev.recitationDetails?.newMemorizationAchieved &&
        !ev.recitationDetails.newMemorizationAchieved.includes('لم يسم')
      );
      if (hasNewItem || hasNewText) {
        entry.newMemorization += (ev.recitationDetails?.pagesCompletedToday?.length || 1);
      }

      // Count review
      const hasReviewItems = Boolean(
        (ev.recitationDetails?.todayReviewItems && ev.recitationDetails.todayReviewItems.length > 0) ||
        ev.recitationDetails?.todayReviewItem?.surahNumber
      );
      const hasReviewText = Boolean(
        ev.recitationDetails?.reviewAchieved &&
        !ev.recitationDetails.reviewAchieved.includes('لم يراجع')
      );
      if (hasReviewItems || hasReviewText) {
        entry.review += (ev.recitationDetails?.todayReviewItems?.length || 1);
      }

      entry.points += (ev.recitationDetails?.pointsEarnedToday || 0);
    });

    const list = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

    // If list is empty, generate friendly empty days for visual aesthetics
    if (list.length === 0) {
      return [
        { date: 'اليوم', formattedDate: 'اليوم', newMemorization: 0, review: 0, points: 0, studentsCount: 0 }
      ];
    }

    return list;
  }, [filteredEvaluations]);

  // 2. Student Comparison Data: BarChart by student
  const studentComparisonData = useMemo(() => {
    return students.map(student => {
      const studentEvals = filteredEvaluations.filter(e => e.studentId === student.id);
      let newCount = 0;
      let reviewCount = 0;
      let pointsTotal = 0;

      studentEvals.forEach(ev => {
        const hasNew = Boolean(
          ev.recitationDetails?.todayNewItem?.surahNumber ||
          (ev.recitationDetails?.newMemorizationAchieved && !ev.recitationDetails.newMemorizationAchieved.includes('لم يسم'))
        );
        if (hasNew) newCount += (ev.recitationDetails?.pagesCompletedToday?.length || 1);

        const hasRev = Boolean(
          (ev.recitationDetails?.todayReviewItems && ev.recitationDetails.todayReviewItems.length > 0) ||
          ev.recitationDetails?.todayReviewItem ||
          (ev.recitationDetails?.reviewAchieved && !ev.recitationDetails.reviewAchieved.includes('لم يراجع'))
        );
        if (hasRev) reviewCount += (ev.recitationDetails?.todayReviewItems?.length || 1);

        pointsTotal += (ev.recitationDetails?.pointsEarnedToday || 0);
      });

      return {
        id: student.id,
        name: student.name.split(' ')[0] || student.name, // First name for neat X-axis display
        fullName: student.name,
        newMemorization: newCount,
        review: reviewCount,
        points: pointsTotal,
        totalSessions: studentEvals.length
      };
    }).sort((a, b) => (b.newMemorization + b.review) - (a.newMemorization + a.review));
  }, [students, filteredEvaluations]);

  // 3. Single Student Detailed Timeline & Progress Curve
  const singleStudentData = useMemo(() => {
    const student = students.find(s => s.id === selectedStudentForChart);
    if (!student) return { timeline: [], student: null, totals: { newCount: 0, reviewCount: 0, points: 0 } };

    const studentEvals = filteredEvaluations
      .filter(e => e.studentId === student.id)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    let runningTotalNew = 0;
    let runningTotalReview = 0;
    let runningTotalPoints = 0;

    const timeline = studentEvals.map(ev => {
      const hasNew = Boolean(
        ev.recitationDetails?.todayNewItem?.surahNumber ||
        (ev.recitationDetails?.newMemorizationAchieved && !ev.recitationDetails.newMemorizationAchieved.includes('لم يسم'))
      );
      const newAmt = hasNew ? (ev.recitationDetails?.pagesCompletedToday?.length || 1) : 0;
      runningTotalNew += newAmt;

      const hasRev = Boolean(
        (ev.recitationDetails?.todayReviewItems && ev.recitationDetails.todayReviewItems.length > 0) ||
        ev.recitationDetails?.todayReviewItem ||
        (ev.recitationDetails?.reviewAchieved && !ev.recitationDetails.reviewAchieved.includes('لم يراجع'))
      );
      const revAmt = hasRev ? (ev.recitationDetails?.todayReviewItems?.length || 1) : 0;
      runningTotalReview += revAmt;

      const pts = ev.recitationDetails?.pointsEarnedToday || 0;
      runningTotalPoints += pts;

      let formattedDate = ev.date;
      try {
        const parts = ev.date.split('-');
        if (parts.length === 3) formattedDate = `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}`;
      } catch {}

      return {
        date: ev.date,
        formattedDate,
        sessionNew: newAmt,
        sessionReview: revAmt,
        cumulativeNew: runningTotalNew,
        cumulativeReview: runningTotalReview,
        pointsEarned: pts,
        cumulativePoints: runningTotalPoints,
        newAchievedText: ev.recitationDetails?.newMemorizationAchieved || '',
        reviewAchievedText: ev.recitationDetails?.reviewAchieved || ''
      };
    });

    return {
      student,
      timeline,
      totals: {
        newCount: runningTotalNew,
        reviewCount: runningTotalReview,
        points: runningTotalPoints,
        evaluationsCount: studentEvals.length
      }
    };
  }, [students, filteredEvaluations, selectedStudentForChart]);

  // Overall Effort Distribution for PieChart
  const distributionPieData = useMemo(() => {
    return [
      { name: 'الحفظ الجديد', value: kpiMetrics.totalNewMemorizationCount || 1, color: '#10b981' },
      { name: 'المراجعة والتثبيت', value: kpiMetrics.totalReviewCount || 1, color: '#fbbf24' }
    ];
  }, [kpiMetrics]);

  // Custom Glassmorphic Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#022c22]/95 border-2 border-amber-400/60 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs text-white space-y-1.5 min-w-[170px]" dir="rtl">
          <div className="font-bold text-amber-300 border-b border-[#065f46] pb-1 flex items-center justify-between">
            <span>{label}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: item.color || item.fill || '#fbbf24' }}
                />
                <span className="text-[#86efac]">{item.name}:</span>
              </div>
              <span className="font-bold font-mono text-white">{item.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner & Control Bar */}
      <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 shadow-xl backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black font-heading text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-[#fbbf24]" />
            <span>لوحة التحليل البياني لتطور الحفظ والمراجعة (Recharts)</span>
          </h3>
          <p className="text-xs text-[#86efac]/90 mt-1">
            متابعة إحصائية تفاعلية تعتمد على سجلات التقييم والتسميع المحفوظة حياً في قواعد بيانات Firestore
          </p>
        </div>

        {/* Time Range Filter Controls */}
        <div className="flex items-center gap-2 bg-[#022c22] border border-[#065f46] p-1.5 rounded-2xl text-xs">
          <span className="text-xs text-[#86efac] px-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>النطاق:</span>
          </span>
          <button
            type="button"
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              timeRange === '7d'
                ? 'bg-[#fbbf24] text-[#064e3b] shadow-md font-black'
                : 'text-[#86efac]/70 hover:text-white'
            }`}
          >
            آخر ٧ أيام
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              timeRange === '30d'
                ? 'bg-[#fbbf24] text-[#064e3b] shadow-md font-black'
                : 'text-[#86efac]/70 hover:text-white'
            }`}
          >
            آخر ٣٠ يوماً
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              timeRange === 'all'
                ? 'bg-[#fbbf24] text-[#064e3b] shadow-md font-black'
                : 'text-[#86efac]/70 hover:text-white'
            }`}
          >
            كامل السجل
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="bg-[#064e3b]/50 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-lg space-y-1 relative overflow-hidden"
        >
          <div className="text-xs text-[#86efac] flex items-center justify-between">
            <span>جلسات الحفظ الجديد</span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
            {kpiMetrics.totalNewMemorizationCount}
          </div>
          <p className="text-[10px] text-slate-300">أوجه ومقاطع جديدة مُنجزة</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-[#064e3b]/50 border border-amber-400/40 rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-lg space-y-1 relative overflow-hidden"
        >
          <div className="text-xs text-amber-200 flex items-center justify-between">
            <span>جلسات المراجعة</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
            {kpiMetrics.totalReviewCount}
          </div>
          <p className="text-[10px] text-slate-300">مراجعة وتثبيت ما تم حفظه</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="bg-[#064e3b]/50 border border-blue-400/40 rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-lg space-y-1 relative overflow-hidden"
        >
          <div className="text-xs text-blue-200 flex items-center justify-between">
            <span>إجمالي جلسات التقييم</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-300 font-mono">
            {kpiMetrics.totalEvaluations}
          </div>
          <p className="text-[10px] text-slate-300">تقييمات مسجلة في Firestore</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="bg-[#064e3b]/50 border border-amber-500/40 rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-lg space-y-1 relative overflow-hidden"
        >
          <div className="text-xs text-[#fbbf24] flex items-center justify-between">
            <span>الطلاب النشطون</span>
            <Users className="w-4 h-4 text-[#fbbf24]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {kpiMetrics.activeStudentsCount} / {students.length}
          </div>
          <p className="text-[10px] text-slate-300">طالباً تم تقييمهم خلال الفترة</p>
        </motion.div>
      </div>

      {/* Chart View Mode Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-[#022c22] border border-[#065f46] rounded-2xl flex-wrap">
        <button
          type="button"
          onClick={() => setActiveChartMode('timeline')}
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeChartMode === 'timeline'
              ? 'bg-[#fbbf24] text-[#064e3b] shadow-md font-black'
              : 'text-[#86efac]/70 hover:text-white hover:bg-[#064e3b]/40'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>المسار الزمني لتطور الحفظ والمراجعة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveChartMode('comparison')}
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeChartMode === 'comparison'
              ? 'bg-[#fbbf24] text-[#064e3b] shadow-md font-black'
              : 'text-[#86efac]/70 hover:text-white hover:bg-[#064e3b]/40'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>مقارنة إنجاز طلاب الحلقة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveChartMode('single_student')}
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeChartMode === 'single_student'
              ? 'bg-[#fbbf24] text-[#064e3b] shadow-md font-black'
              : 'text-[#86efac]/70 hover:text-white hover:bg-[#064e3b]/40'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>منحنى التطور لطالب محدد</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: TIMELINE AREA CHART (المسار الزمني عبر الأيام)                    */}
      {/* ========================================================================= */}
      {activeChartMode === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Area Chart Card */}
          <div className="lg:col-span-2 bg-[#064e3b]/70 border border-[#fbbf24]/30 rounded-[32px] p-6 sm:p-7 shadow-2xl backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#065f46] pb-3">
              <div>
                <h4 className="text-base sm:text-lg font-bold text-white font-heading flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#fbbf24]" />
                  <span>المسار الزمني لمجموع الحفظ والمراجعة بالحلقة</span>
                </h4>
                <p className="text-xs text-[#86efac]/80 mt-0.5">
                  رصد التراكم اليومي لجلسات التسميع الجديد والمراجعة المسجلة في Firestore
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                  <span>الحفظ الجديد</span>
                </span>
                <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                  <span>المراجعة والتثبيت</span>
                </span>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-72 sm:h-80 w-full pt-2" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorReview" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#065f46" opacity={0.5} />
                  <XAxis
                    dataKey="formattedDate"
                    stroke="#86efac"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#86efac"
                    fontSize={11}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="newMemorization"
                    name="الحفظ الجديد"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorNew)"
                  />
                  <Area
                    type="monotone"
                    dataKey="review"
                    name="المراجعة والتثبيت"
                    stroke="#fbbf24"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorReview)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Effort Breakdown Pie Card */}
          <div className="bg-[#064e3b]/70 border border-[#fbbf24]/30 rounded-[32px] p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-base font-bold text-white font-heading flex items-center gap-2 border-b border-[#065f46] pb-3">
                <Sparkles className="w-5 h-5 text-[#fbbf24]" />
                <span>توزيع جهود الحلقة القرآنية</span>
              </h4>
              <p className="text-xs text-[#86efac]/80 mt-2">
                النسبة المئوية بين مقدار الحفظ الجديد مقابل مقادير المراجعة المستمرة
              </p>
            </div>

            <div className="h-56 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#022c22" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-[#86efac]">إجمالي الجلسات</span>
                <span className="text-lg font-black font-mono text-white">
                  {kpiMetrics.totalNewMemorizationCount + kpiMetrics.totalReviewCount}
                </span>
              </div>
            </div>

            <div className="bg-[#022c22] p-3.5 rounded-2xl border border-[#065f46] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>الحفظ الجديد:</span>
                </span>
                <span className="font-mono font-bold text-white">{kpiMetrics.totalNewMemorizationCount} جلسة</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-amber-300 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>المراجعة والتثبيت:</span>
                </span>
                <span className="font-mono font-bold text-white">{kpiMetrics.totalReviewCount} جلسة</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: STUDENT COMPARISON BAR CHART (مقارنة طلاب الحلقة)                */}
      {/* ========================================================================= */}
      {activeChartMode === 'comparison' && (
        <div className="bg-[#064e3b]/70 border border-[#fbbf24]/30 rounded-[32px] p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#065f46] pb-3">
            <div>
              <h4 className="text-base sm:text-lg font-bold text-white font-heading flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#fbbf24]" />
                <span>مقارنة إنجاز طلاب الحلقة في الحفظ والمراجعة</span>
              </h4>
              <p className="text-xs text-[#86efac]/80 mt-0.5">
                رسم بياني تفاعلي يبيّن عدد مرات تسميع الحفظ الجديد مقابل مقاطع المراجعة لكل طالب
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
                <span>الحفظ الجديد</span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                <span className="w-3 h-3 rounded-md bg-amber-400 inline-block" />
                <span>المراجعة</span>
              </span>
            </div>
          </div>

          {studentComparisonData.length === 0 ? (
            <div className="text-center py-12 text-slate-300 text-xs">
              لا توجد بيانات كافية لعرض المقارنة.
            </div>
          ) : (
            <div className="h-80 sm:h-96 w-full pt-3" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={studentComparisonData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#065f46" opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    stroke="#86efac"
                    fontSize={11}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#86efac"
                    fontSize={11}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                  />
                  <Bar
                    dataKey="newMemorization"
                    name="الحفظ الجديد"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="review"
                    name="المراجعة والتثبيت"
                    fill="#fbbf24"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quick Info footer */}
          <div className="p-3.5 bg-[#022c22] rounded-2xl border border-[#065f46] text-xs text-slate-300 flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Info className="w-4 h-4 text-amber-400" />
              <span>ملاحظة: البيانات مرتبة تنازلياً بحسب إجمالي نشاط الطالب وتسميعه الفعلي.</span>
            </span>
            <span className="text-[#86efac] font-bold">
              إجمالي الطلاب المدرجين: {studentComparisonData.length} طالب
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: SINGLE STUDENT PROGRESSION (منحنى تطور طالب محدد)                 */}
      {/* ========================================================================= */}
      {activeChartMode === 'single_student' && (
        <div className="space-y-6">
          {/* Student Selector Card */}
          <div className="bg-[#064e3b]/70 border border-[#fbbf24]/30 rounded-[32px] p-6 shadow-xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs text-[#86efac] font-bold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                <span>اختر الطالب لعرض منحنى تطوره القرآني بالتفصيل:</span>
              </span>
              <h4 className="text-lg font-black text-white font-heading">
                {singleStudentData.student?.name || 'اختر طالباً'}
              </h4>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedStudentForChart}
                onChange={e => setSelectedStudentForChart(e.target.value)}
                disabled={students.length === 0}
                className="bg-[#022c22] border-2 border-amber-400/50 text-amber-200 text-xs sm:text-sm font-bold rounded-2xl py-2.5 px-4 outline-none focus:border-amber-400 cursor-pointer disabled:opacity-50"
                dir="rtl"
              >
                {students.length === 0 ? (
                  <option value="">لا يوجد طلاب في هذه الحلقة</option>
                ) : (
                  students.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#022c22] text-white">
                      {s.name} (مستوى {s.level})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Student Detailed Metrics & LineChart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#064e3b]/70 border border-[#fbbf24]/30 rounded-[32px] p-6 sm:p-7 shadow-2xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-[#065f46] pb-3">
                <div>
                  <h4 className="text-base font-bold text-white font-heading flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                    <span>المنحنى التراكمي لإنجاز الطالب عبر جلسات التسميع</span>
                  </h4>
                  <p className="text-xs text-[#86efac]/80 mt-0.5">
                    معدل النمو التصاعدي في الحفظ الجديد والمراجعة حسب تاريخ كل جلسة
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30 font-mono">
                  {singleStudentData.totals.evaluationsCount} جلسات مسجلة
                </span>
              </div>

              {singleStudentData.timeline.length === 0 ? (
                <div className="text-center py-16 text-slate-300 text-xs bg-[#022c22]/50 rounded-2xl border border-[#065f46]">
                  لا توجد سجلات تقييم مسجلة لهذا الطالب خلال النطاق الزمني المحدد.
                </div>
              ) : (
                <div className="h-72 sm:h-80 w-full pt-2" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={singleStudentData.timeline}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#065f46" opacity={0.5} />
                      <XAxis
                        dataKey="formattedDate"
                        stroke="#86efac"
                        fontSize={11}
                      />
                      <YAxis
                        stroke="#86efac"
                        fontSize={11}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }} />
                      <Line
                        type="monotone"
                        dataKey="cumulativeNew"
                        name="تراكم الحفظ الجديد"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981' }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulativeReview"
                        name="تراكم المراجعة"
                        stroke="#fbbf24"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#fbbf24' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Student Info Card */}
            <div className="bg-[#064e3b]/70 border border-[#fbbf24]/30 rounded-[32px] p-6 shadow-2xl backdrop-blur-md space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3 border-b border-[#065f46] pb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-[#064e3b] flex items-center justify-center font-black text-lg shadow-md shrink-0">
                    {singleStudentData.student?.name.charAt(0) || 'ط'}
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-white font-heading">
                      {singleStudentData.student?.name}
                    </h5>
                    <span className="text-xs text-[#86efac]">
                      المستوى: {singleStudentData.student?.level || 'متوسط'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#022c22] border border-[#065f46] flex items-center justify-between">
                    <span className="text-[#86efac]">موضع الحفظ الحالي:</span>
                    <span className="font-bold text-amber-300">
                      سورة {singleStudentData.student?.currentSurahName || 'النبأ'} ({singleStudentData.student?.currentAyah || 1})
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#022c22] border border-[#065f46] flex items-center justify-between">
                    <span className="text-[#86efac]">إجمالي نقاط الأوجه:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {singleStudentData.student?.totalPagePoints || 0} نقطة
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#022c22] border border-[#065f46] flex items-center justify-between">
                    <span className="text-[#86efac]">مرات الحفظ المسجلة:</span>
                    <span className="font-bold text-white font-mono">
                      {singleStudentData.totals.newCount} مرة
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#022c22] border border-[#065f46] flex items-center justify-between">
                    <span className="text-[#86efac]">مرات المراجعة المسجلة:</span>
                    <span className="font-bold text-white font-mono">
                      {singleStudentData.totals.reviewCount} مرة
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#065f46]">
                <div className="text-[11px] text-[#86efac]/80 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>البيانات متصلة مباشرة بسجلات التقييم الحية في Firestore.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
