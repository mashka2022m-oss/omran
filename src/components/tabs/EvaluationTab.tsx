import React, { useState, useEffect } from 'react';
import {
  Star,
  BookOpen,
  Sparkles,
  Award,
  CheckCircle2,
  Plus,
  Trash2,
  Pencil,
  AlertCircle,
  Clock,
  Volume2,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Calendar,
  History,
  Send,
  X,
  Layers,
  RotateCcw,
  Check,
  Compass,
  FileText,
  ArrowLeftRight,
  XCircle,
  Info,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Student,
  AttendanceRecord,
  StudentEvaluation,
  EvaluationCriteria,
  CriteriaType,
  QuranRecitationItem
} from '../../types';
import {
  QURAN_SURAHS,
  FAMOUS_RECITERS,
  REVIEW_TYPES,
  getSurahInfo,
  formatQuranPortion
} from '../../data/quranData';

interface EvaluationTabProps {
  students: Student[];
  attendance: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  criteria: EvaluationCriteria[];
  selectedStudentId?: string;
  onSaveEvaluation: (evaluation: StudentEvaluation) => Promise<void>;
  onSaveCriteria: (criteriaList: EvaluationCriteria[]) => Promise<void>;
  onDeleteCriteria: (id: string) => Promise<void>;
  onUpdateStudentAIPlan: (
    studentId: string,
    newAssignment: any,
    updatedPosition?: { surahNumber: number; surahName: string; ayah: number }
  ) => Promise<void>;
  onNavigateToWhatsApp?: (studentId: string) => void;
  onNavigateToBehavior?: (studentId: string) => void;
}

export const EvaluationTab: React.FC<EvaluationTabProps> = ({
  students,
  attendance,
  evaluations,
  criteria,
  selectedStudentId,
  onSaveEvaluation,
  onSaveCriteria,
  onDeleteCriteria,
  onUpdateStudentAIPlan,
  onNavigateToWhatsApp,
  onNavigateToBehavior
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Selected Date for evaluation view & entry (Default: Today)
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Active student selection
  const [activeStudentId, setActiveStudentId] = useState<string>(
    selectedStudentId || (students.length > 0 ? students[0].id : '')
  );

  const activeStudent = students.find(s => s.id === activeStudentId);

  // History Drawer toggle
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);

  // Auto-fill notice from yesterday
  const [autoFilledNotice, setAutoFilledNotice] = useState<string>('');

  // "لم يُسمّع" (Did not recite) for Today's New Memorization
  const [todayNewDidNotRecite, setTodayNewDidNotRecite] = useState<boolean>(false);
  const [todayNewDidNotReciteReason, setTodayNewDidNotReciteReason] = useState<string>('');

  // ----------------------------------------------------
  // 1. RECITATION STATE (ما سمعه الطالب)
  // Supports multi-surah ranges
  // ----------------------------------------------------
  // Today's New Memorization
  const [todayNewSurah, setTodayNewSurah] = useState<number>(78);
  const [todayNewFromAyah, setTodayNewFromAyah] = useState<number>(1);
  const [todayNewToSurah, setTodayNewToSurah] = useState<number>(78);
  const [todayNewToAyah, setTodayNewToAyah] = useState<number>(10);

  // Today's Review Items
  const [todayReviews, setTodayReviews] = useState<QuranRecitationItem[]>([
    {
      id: 'rev_1',
      type: REVIEW_TYPES[0],
      surahNumber: 78,
      surahName: 'النبأ',
      fromAyah: 1,
      toSurahNumber: 78,
      toSurahName: 'النبأ',
      toAyah: 40,
      isFullSurah: true
    }
  ]);

  // ----------------------------------------------------
  // 2. TOMORROW'S REQUIRED ASSIGNMENT (مقرر الغد يحدده المعلم)
  // Supports multi-surah ranges & persistent multiple review items
  // ----------------------------------------------------
  const [tomNewSurah, setTomNewSurah] = useState<number>(78);
  const [tomNewFromAyah, setTomNewFromAyah] = useState<number>(11);
  const [tomNewToSurah, setTomNewToSurah] = useState<number>(78);
  const [tomNewToAyah, setTomNewToAyah] = useState<number>(20);

  // Tomorrow's Review Items (can have multiple items: review, cumulative, test, etc.)
  const [tomReviews, setTomReviews] = useState<QuranRecitationItem[]>([
    {
      id: 'tom_rev_1',
      type: REVIEW_TYPES[0],
      surahNumber: 79,
      surahName: 'النازعات',
      fromAyah: 1,
      toSurahNumber: 79,
      toSurahName: 'النازعات',
      toAyah: 46,
      isFullSurah: true
    }
  ]);

  const [selectedSheikh, setSelectedSheikh] = useState<string>(FAMOUS_RECITERS[0].name);
  const [dailyHomeNote, setDailyHomeNote] = useState<string>(
    'الاستماع للقارئ المتقن 3 مرات، وتكرار الآيات غيباً 5 مرات قبل النوم والتسميع على ولي الأمر.'
  );

  // Criteria values & Teacher notes
  const [criteriaValues, setCriteriaValues] = useState<Record<string, any>>({});
  const [teacherNotes, setTeacherNotes] = useState<string>('أداء طيب ومتقن ما شاء الله، نسأل الله له التوفيق والرفعة.');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Criteria Management Modal state
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [editingCriteriaId, setEditingCriteriaId] = useState<string | null>(null);
  const [critToDelete, setCritToDelete] = useState<EvaluationCriteria | null>(null);
  const [newCritName, setNewCritName] = useState('');
  const [newCritType, setNewCritType] = useState<CriteriaType>('score');
  const [newCritMaxScore, setNewCritMaxScore] = useState<number>(10);
  const [newCritOptions, setNewCritOptions] = useState<string>('ممتاز, جيد جدا, جيد, ضعيف');

  // Attendance status of active student on the selected date
  const selectedDateAtt = attendance.find(
    a => a.date === selectedDate && a.studentId === activeStudentId
  );
  const isAbsent = selectedDateAtt?.status === 'غائب';
  const isExcused = selectedDateAtt?.status === 'معتذر';

  // Metadata Helpers
  const startTodaySurahInfo = getSurahInfo(todayNewSurah);
  const endTodaySurahInfo = getSurahInfo(todayNewToSurah);

  const startTomNewSurahInfo = getSurahInfo(tomNewSurah);
  const endTomNewSurahInfo = getSurahInfo(tomNewToSurah);

  const firstTomRev = tomReviews[0];
  const startTomRevSurahInfo = getSurahInfo(firstTomRev?.surahNumber || 79);
  const endTomRevSurahInfo = getSurahInfo(firstTomRev?.toSurahNumber || firstTomRev?.surahNumber || 79);

  // All evaluations for the currently active student (sorted latest first)
  const studentEvaluationsHistory = evaluations
    .filter(e => e.studentId === activeStudentId)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Initialize or load student evaluation when active student or selected date changes
  useEffect(() => {
    if (!activeStudent) return;
    setAutoFilledNotice('');

    // 1. Check if an evaluation already exists for the selectedDate
    const existing = evaluations.find(
      e => e.date === selectedDate && e.studentId === activeStudent.id
    );

    if (existing) {
      setCriteriaValues(existing.criteriaValues || {});
      setTeacherNotes(existing.recitationDetails?.teacherNotes || '');

      // Load today's new item
      if (existing.recitationDetails?.todayNewItem) {
        const item = existing.recitationDetails.todayNewItem;
        const sNum = item.surahNumber || 78;
        const toSNum = item.toSurahNumber || sNum;
        setTodayNewSurah(sNum);
        setTodayNewFromAyah(item.fromAyah || 1);
        setTodayNewToSurah(toSNum);
        setTodayNewToAyah(item.toAyah || 10);
        setTodayNewDidNotRecite(!!item.didNotRecite);
        setTodayNewDidNotReciteReason(item.didNotReciteReason || '');
      } else {
        setTodayNewDidNotRecite(false);
        setTodayNewDidNotReciteReason('');
      }

      // Load today's review items
      if (existing.recitationDetails?.todayReviewItems && existing.recitationDetails.todayReviewItems.length > 0) {
        setTodayReviews(existing.recitationDetails.todayReviewItems);
      }

      // Load tomorrow's assignment recorded on that day
      if (existing.recitationDetails?.tomorrowNewItem) {
        const tNew = existing.recitationDetails.tomorrowNewItem;
        const sNum = tNew.surahNumber || 78;
        const toSNum = tNew.toSurahNumber || sNum;
        setTomNewSurah(sNum);
        setTomNewFromAyah(tNew.fromAyah || 1);
        setTomNewToSurah(toSNum);
        setTomNewToAyah(tNew.toAyah || 10);
      }
      if (existing.recitationDetails?.tomorrowReviewItems && existing.recitationDetails.tomorrowReviewItems.length > 0) {
        setTomReviews(existing.recitationDetails.tomorrowReviewItems);
      } else if (existing.recitationDetails?.tomorrowReviewItem) {
        setTomReviews([existing.recitationDetails.tomorrowReviewItem]);
      }
      if (existing.recitationDetails?.tomorrowSuggestedSheikh) {
        setSelectedSheikh(existing.recitationDetails.tomorrowSuggestedSheikh);
      }
      if (existing.recitationDetails?.tomorrowDailyNote) {
        setDailyHomeNote(existing.recitationDetails.tomorrowDailyNote);
      }
    } else {
      // 2. No evaluation exists for this date yet!
      setTodayNewDidNotRecite(false);
      setTodayNewDidNotReciteReason('');

      // Check for the LAST ACTUAL recitation record before selectedDate,
      // intentionally bypassing empty days, unexpected trips, or sudden holidays!
      const actualPastEvals = evaluations
        .filter(e => e.studentId === activeStudent.id && e.date < selectedDate && (
          e.recitationDetails?.tomorrowNewItem ||
          e.recitationDetails?.todayNewItem ||
          e.recitationDetails?.newMemorizationAchieved
        ))
        .sort((a, b) => b.date.localeCompare(a.date));

      const latestActualRecord = actualPastEvals[0];

      // If in previous record student DID NOT recite, re-assign the exact same portion today
      if (latestActualRecord && latestActualRecord.recitationDetails?.todayNewItem?.didNotRecite) {
        const unrecited = latestActualRecord.recitationDetails.todayNewItem;
        const sNum = unrecited.surahNumber || 78;
        const toSNum = unrecited.toSurahNumber || sNum;
        const fAyah = unrecited.fromAyah || 1;
        const tAyah = unrecited.toAyah || 10;

        setTodayNewSurah(sNum);
        setTodayNewFromAyah(fAyah);
        setTodayNewToSurah(toSNum);
        setTodayNewToAyah(tAyah);

        setAutoFilledNotice(`تم تثبيت نفس الورد المقرر ليوم (${latestActualRecord.date}) نظراً لعدم تسميع الطالب له سابقاً: ${getSurahInfo(sNum).name} (${fAyah}-${tAyah})`);

        // Tomorrow new also set to repeat until recited
        setTomNewSurah(sNum);
        setTomNewFromAyah(fAyah);
        setTomNewToSurah(toSNum);
        setTomNewToAyah(tAyah);

        // Load reviews
        const prevReviews = latestActualRecord.recitationDetails?.tomorrowReviewItems ||
          latestActualRecord.recitationDetails?.todayReviewItems ||
          activeStudent.persistentReviewItems;
        if (prevReviews && prevReviews.length > 0) {
          setTodayReviews(prevReviews.map((r, idx) => ({ ...r, id: `rev_${Date.now()}_${idx}`, didNotRecite: false, didNotReciteReason: undefined })));
          setTomReviews(prevReviews.map((r, idx) => ({ ...r, id: `tom_rev_${Date.now()}_${idx}` })));
        }
      } else if (latestActualRecord && latestActualRecord.recitationDetails?.tomorrowNewItem) {
        // AUTOMATIC PLAN LOADING FROM LAST ACTUAL RECORD'S PLANNED TOMORROW!
        const yNew = latestActualRecord.recitationDetails.tomorrowNewItem;
        const sNum = yNew.surahNumber || 78;
        const toSNum = yNew.toSurahNumber || sNum;
        const fAyah = yNew.fromAyah || 1;
        const tAyah = yNew.toAyah || 10;

        setTodayNewSurah(sNum);
        setTodayNewFromAyah(fAyah);
        setTodayNewToSurah(toSNum);
        setTodayNewToAyah(tAyah);

        const loadedPortionText = formatQuranPortion(
          getSurahInfo(sNum).name,
          fAyah,
          tAyah,
          getSurahInfo(sNum).numberOfAyahs,
          'حفظ جديد',
          getSurahInfo(toSNum).name,
          getSurahInfo(toSNum).numberOfAyahs
        );

        setAutoFilledNotice(`تم ضبط المقرر تلقائياً بناءً على آخر تسجيل تسميع للطالب بتاريخ (${latestActualRecord.date}): ${loadedPortionText}`);

        // Load review items: if tomorrowReviewItems existed in last record, or student's persistentReviewItems
        const loadedReviews = latestActualRecord.recitationDetails?.tomorrowReviewItems ||
          (latestActualRecord.recitationDetails?.tomorrowReviewItem ? [latestActualRecord.recitationDetails.tomorrowReviewItem] : null) ||
          activeStudent.persistentReviewItems;

        if (loadedReviews && loadedReviews.length > 0) {
          setTodayReviews(loadedReviews.map((r, idx) => ({
            ...r,
            id: `rev_auto_${Date.now()}_${idx}`,
            didNotRecite: false,
            didNotReciteReason: undefined
          })));

          // Prepare tomorrow's reviews by advancing any cumulative review automatically!
          setTomReviews(loadedReviews.map((r, idx) => {
            if (r.type === 'مراجعة تراكمية') {
              const itemSurah = r.toSurahNumber || r.surahNumber;
              const itemAyah = r.toAyah;
              const sInfo = getSurahInfo(itemSurah);
              const revStep = 15;
              if (itemAyah < sInfo.numberOfAyahs) {
                return {
                  ...r,
                  id: `tom_rev_${Date.now()}_${idx}`,
                  fromAyah: itemAyah + 1,
                  toAyah: Math.min(itemAyah + revStep, sInfo.numberOfAyahs),
                  isFullSurah: false
                };
              } else {
                const nextS = itemSurah < 114 ? itemSurah + 1 : 1;
                const nextInfo = getSurahInfo(nextS);
                return {
                  ...r,
                  id: `tom_rev_${Date.now()}_${idx}`,
                  surahNumber: nextS,
                  surahName: nextInfo.name,
                  fromAyah: 1,
                  toSurahNumber: nextS,
                  toSurahName: nextInfo.name,
                  toAyah: Math.min(revStep, nextInfo.numberOfAyahs),
                  isFullSurah: revStep >= nextInfo.numberOfAyahs
                };
              }
            }
            return {
              ...r,
              id: `tom_rev_${Date.now()}_${idx}`
            };
          }));
        }

        // Auto-calculate tomorrow's continuation step
        const toSurahInfo = getSurahInfo(toSNum);
        const step = activeStudent.level === 'ضعيف' ? 4 : activeStudent.level === 'قوي' ? 12 : 7;
        if (tAyah < toSurahInfo.numberOfAyahs) {
          setTomNewSurah(toSNum);
          setTomNewFromAyah(tAyah + 1);
          setTomNewToSurah(toSNum);
          setTomNewToAyah(Math.min(tAyah + step, toSurahInfo.numberOfAyahs));
        } else {
          const nextSurahNum = toSNum < 114 ? toSNum + 1 : 1;
          const nextInfo = getSurahInfo(nextSurahNum);
          setTomNewSurah(nextSurahNum);
          setTomNewFromAyah(1);
          setTomNewToSurah(nextSurahNum);
          setTomNewToAyah(Math.min(step, nextInfo.numberOfAyahs));
        }
      } else if (latestActualRecord && latestActualRecord.recitationDetails?.todayNewItem) {
        // Fallback to continuing directly from what student recited on their last active recitation session
        const lastRecited = latestActualRecord.recitationDetails.todayNewItem;
        const curSurah = lastRecited.toSurahNumber || lastRecited.surahNumber || 78;
        const lastAyah = lastRecited.toAyah || 1;
        const curSurahInfo = getSurahInfo(curSurah);
        const step = activeStudent.level === 'ضعيف' ? 4 : activeStudent.level === 'قوي' ? 12 : 7;

        let startS = curSurah;
        let startA = lastAyah + 1;
        let endS = curSurah;
        let endA = lastAyah + step;

        if (startA > curSurahInfo.numberOfAyahs) {
          startS = curSurah < 114 ? curSurah + 1 : 1;
          startA = 1;
          endS = startS;
          endA = Math.min(step, getSurahInfo(startS).numberOfAyahs);
        } else {
          endA = Math.min(endA, curSurahInfo.numberOfAyahs);
        }

        setTodayNewSurah(startS);
        setTodayNewFromAyah(startA);
        setTodayNewToSurah(endS);
        setTodayNewToAyah(endA);

        const loadedPortionText = formatQuranPortion(
          getSurahInfo(startS).name,
          startA,
          endA,
          getSurahInfo(startS).numberOfAyahs,
          'حفظ جديد',
          getSurahInfo(endS).name,
          getSurahInfo(endS).numberOfAyahs
        );

        setAutoFilledNotice(`تم ضبط المقرر تلقائياً استناداً إلى آخر جلسة تسميع مسجلة بتاريخ (${latestActualRecord.date}): ${loadedPortionText}`);

        // Set tomorrow from today
        const tomStep = step;
        const endInfo = getSurahInfo(endS);
        if (endA < endInfo.numberOfAyahs) {
          setTomNewSurah(endS);
          setTomNewFromAyah(endA + 1);
          setTomNewToSurah(endS);
          setTomNewToAyah(Math.min(endA + tomStep, endInfo.numberOfAyahs));
        } else {
          const nextS = endS < 114 ? endS + 1 : 1;
          setTomNewSurah(nextS);
          setTomNewFromAyah(1);
          setTomNewToSurah(nextS);
          setTomNewToAyah(Math.min(tomStep, getSurahInfo(nextS).numberOfAyahs));
        }

        setTomReviews([
          {
            id: `tom_rev_${Date.now()}`,
            type: REVIEW_TYPES[0],
            surahNumber: startS,
            surahName: getSurahInfo(startS).name,
            fromAyah: startA,
            toSurahNumber: endS,
            toSurahName: endInfo.name,
            toAyah: endA,
            isFullSurah: false
          }
        ]);
      } else {
        // Fallback default initialization from student profile
        const studentSurah = activeStudent.currentSurah || 78;
        const studentAyah = activeStudent.currentAyah || 1;
        const surahInfo = getSurahInfo(studentSurah);
        const totalAyahs = surahInfo.numberOfAyahs;

        const step = activeStudent.level === 'ضعيف' ? 4 : activeStudent.level === 'قوي' ? 12 : 7;
        const endAyah = Math.min(studentAyah + step - 1, totalAyahs);

        setTodayNewSurah(studentSurah);
        setTodayNewFromAyah(studentAyah);
        setTodayNewToSurah(studentSurah);
        setTodayNewToAyah(endAyah);

        // Default review (check persistent items first)
        if (activeStudent.persistentReviewItems && activeStudent.persistentReviewItems.length > 0) {
          setTodayReviews(activeStudent.persistentReviewItems.map((r, idx) => ({ ...r, id: `rev_${Date.now()}_${idx}` })));
          setTomReviews(activeStudent.persistentReviewItems.map((r, idx) => ({ ...r, id: `tom_rev_${Date.now()}_${idx}` })));
        } else {
          const revSurah = studentSurah < 114 ? studentSurah + 1 : 113;
          const revInfo = getSurahInfo(revSurah);
          setTodayReviews([
            {
              id: `rev_${Date.now()}`,
              type: REVIEW_TYPES[0],
              surahNumber: revSurah,
              surahName: revInfo.name,
              fromAyah: 1,
              toSurahNumber: revSurah,
              toSurahName: revInfo.name,
              toAyah: revInfo.numberOfAyahs,
              isFullSurah: true
            }
          ]);

          setTomReviews([
            {
              id: `tom_rev_${Date.now()}`,
              type: REVIEW_TYPES[0],
              surahNumber: studentSurah,
              surahName: surahInfo.name,
              fromAyah: 1,
              toSurahNumber: studentSurah,
              toSurahName: surahInfo.name,
              toAyah: endAyah,
              isFullSurah: endAyah >= totalAyahs
            }
          ]);
        }

        if (endAyah < totalAyahs) {
          setTomNewSurah(studentSurah);
          setTomNewFromAyah(endAyah + 1);
          setTomNewToSurah(studentSurah);
          setTomNewToAyah(Math.min(endAyah + step, totalAyahs));
        } else {
          const nextSurahNum = studentSurah < 114 ? studentSurah + 1 : 1;
          const nextSurahInfo = getSurahInfo(nextSurahNum);
          setTomNewSurah(nextSurahNum);
          setTomNewFromAyah(1);
          setTomNewToSurah(nextSurahNum);
          setTomNewToAyah(Math.min(step, nextSurahInfo.numberOfAyahs));
        }
      }

      // Initialize criteria defaults
      const defaults: Record<string, any> = {};
      criteria.forEach(c => {
        if (c.type === 'stars') defaults[c.id] = 5;
        if (c.type === 'score') defaults[c.id] = c.maxScore || 10;
        if (c.type === 'options' && c.options && c.options.length > 0) defaults[c.id] = c.options[0];
        if (c.type === 'text') defaults[c.id] = '';
      });
      setCriteriaValues(defaults);
      setTeacherNotes('أداء طيب ومتقن ما شاء الله، نسأل الله له التوفيق والرفعة.');
    }
  }, [activeStudentId, selectedDate, evaluations, criteria]);

  // Date Navigation Helpers
  const handleDateShift = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const getDayBeforeYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return d.toISOString().split('T')[0];
  };

  // Handlers for Today's New
  const handleTodayStartSurahChange = (surahNum: number) => {
    setTodayNewSurah(surahNum);
    const info = getSurahInfo(surahNum);
    setTodayNewFromAyah(1);
    if (todayNewToSurah === todayNewSurah) {
      setTodayNewToSurah(surahNum);
      setTodayNewToAyah(Math.min(10, info.numberOfAyahs));
    }
  };

  const handleTodayEndSurahChange = (surahNum: number) => {
    setTodayNewToSurah(surahNum);
    const info = getSurahInfo(surahNum);
    setTodayNewToAyah(Math.min(10, info.numberOfAyahs));
  };

  // Handlers for Tomorrow's New
  const handleTomNewStartSurahChange = (surahNum: number) => {
    setTomNewSurah(surahNum);
    const info = getSurahInfo(surahNum);
    setTomNewFromAyah(1);
    if (tomNewToSurah === tomNewSurah) {
      setTomNewToSurah(surahNum);
      setTomNewToAyah(Math.min(10, info.numberOfAyahs));
    }
  };

  const handleTomNewEndSurahChange = (surahNum: number) => {
    setTomNewToSurah(surahNum);
    const info = getSurahInfo(surahNum);
    setTomNewToAyah(Math.min(10, info.numberOfAyahs));
  };

  // Add Review Item for Today
  const handleAddReviewItem = () => {
    const defaultSurahNum = 114;
    const info = getSurahInfo(defaultSurahNum);
    const newItem: QuranRecitationItem = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: REVIEW_TYPES[2] || 'مراجعة تراكمية',
      surahNumber: defaultSurahNum,
      surahName: info.name,
      fromAyah: 1,
      toSurahNumber: defaultSurahNum,
      toSurahName: info.name,
      toAyah: info.numberOfAyahs,
      isFullSurah: true
    };
    setTodayReviews(prev => [...prev, newItem]);
  };

  // Update Review Item for Today
  const handleUpdateReviewItem = (id: string, updates: Partial<QuranRecitationItem>) => {
    setTodayReviews(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          if (updates.surahNumber !== undefined) {
            const sInfo = getSurahInfo(updates.surahNumber);
            updated.surahName = sInfo.name;
            updated.fromAyah = 1;
            if (updated.toSurahNumber === undefined || updated.toSurahNumber === item.surahNumber) {
              updated.toSurahNumber = updates.surahNumber;
              updated.toSurahName = sInfo.name;
              updated.toAyah = sInfo.numberOfAyahs;
            }
          }
          if (updates.toSurahNumber !== undefined) {
            const toSInfo = getSurahInfo(updates.toSurahNumber);
            updated.toSurahName = toSInfo.name;
            updated.toAyah = toSInfo.numberOfAyahs;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Remove Review Item for Today
  const handleRemoveReviewItem = (id: string) => {
    setTodayReviews(prev => prev.filter(item => item.id !== id));
  };

  // Add Review Item for Tomorrow
  const handleAddTomReviewItem = () => {
    const defaultSurahNum = 114;
    const info = getSurahInfo(defaultSurahNum);
    const newItem: QuranRecitationItem = {
      id: `tom_rev_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: REVIEW_TYPES[2] || 'مراجعة تراكمية',
      surahNumber: defaultSurahNum,
      surahName: info.name,
      fromAyah: 1,
      toSurahNumber: defaultSurahNum,
      toSurahName: info.name,
      toAyah: info.numberOfAyahs,
      isFullSurah: true
    };
    setTomReviews(prev => [...prev, newItem]);
  };

  // Update Review Item for Tomorrow
  const handleUpdateTomReviewItem = (id: string, updates: Partial<QuranRecitationItem>) => {
    setTomReviews(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          if (updates.surahNumber !== undefined) {
            const sInfo = getSurahInfo(updates.surahNumber);
            updated.surahName = sInfo.name;
            updated.fromAyah = 1;
            if (updated.toSurahNumber === undefined || updated.toSurahNumber === item.surahNumber) {
              updated.toSurahNumber = updates.surahNumber;
              updated.toSurahName = sInfo.name;
              updated.toAyah = sInfo.numberOfAyahs;
            }
          }
          if (updates.toSurahNumber !== undefined) {
            const toSInfo = getSurahInfo(updates.toSurahNumber);
            updated.toSurahName = toSInfo.name;
            updated.toAyah = toSInfo.numberOfAyahs;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Remove Review Item for Tomorrow
  const handleRemoveTomReviewItem = (id: string) => {
    setTomReviews(prev => prev.filter(item => item.id !== id));
  };

  // Auto-progress Tomorrow Assignment (Progression & Cumulative Updates)
  const handleAutoProgressTomorrow = () => {
    const curEndSurahInfo = getSurahInfo(todayNewToSurah);
    const totalAyahs = curEndSurahInfo.numberOfAyahs;
    const step = activeStudent?.level === 'ضعيف' ? 4 : activeStudent?.level === 'قوي' ? 12 : 7;

    if (todayNewDidNotRecite) {
      // Keep tomorrow's new memorization at the exact same portion because student did not recite it
      setTomNewSurah(todayNewSurah);
      setTomNewFromAyah(todayNewFromAyah);
      setTomNewToSurah(todayNewToSurah);
      setTomNewToAyah(todayNewToAyah);
    } else {
      if (todayNewToAyah < totalAyahs) {
        setTomNewSurah(todayNewToSurah);
        setTomNewFromAyah(todayNewToAyah + 1);
        setTomNewToSurah(todayNewToSurah);
        setTomNewToAyah(Math.min(todayNewToAyah + step, totalAyahs));
      } else {
        const nextSurahNum = todayNewToSurah < 114 ? todayNewToSurah + 1 : 1;
        const nextInfo = getSurahInfo(nextSurahNum);
        setTomNewSurah(nextSurahNum);
        setTomNewFromAyah(1);
        setTomNewToSurah(nextSurahNum);
        setTomNewToAyah(Math.min(step, nextInfo.numberOfAyahs));
      }
    }

    // Auto-update tomorrow's review items:
    setTomReviews(prev => {
      if (prev.length === 0) {
        const sInfo = getSurahInfo(todayNewSurah);
        const toInfo = getSurahInfo(todayNewToSurah);
        return [{
          id: `tom_rev_${Date.now()}`,
          type: REVIEW_TYPES[0],
          surahNumber: todayNewSurah,
          surahName: sInfo.name,
          fromAyah: todayNewFromAyah,
          toSurahNumber: todayNewToSurah,
          toSurahName: toInfo.name,
          toAyah: todayNewToAyah,
          isFullSurah: todayNewSurah === todayNewToSurah && todayNewFromAyah === 1 && todayNewToAyah >= sInfo.numberOfAyahs
        }];
      }

      return prev.map(item => {
        // If minor review, update to review what was recited today (if recited)
        if (item.type === 'مراجعة صغرى' && !todayNewDidNotRecite) {
          const sInfo = getSurahInfo(todayNewSurah);
          const toInfo = getSurahInfo(todayNewToSurah);
          return {
            ...item,
            surahNumber: todayNewSurah,
            surahName: sInfo.name,
            fromAyah: todayNewFromAyah,
            toSurahNumber: todayNewToSurah,
            toSurahName: toInfo.name,
            toAyah: todayNewToAyah,
            isFullSurah: todayNewSurah === todayNewToSurah && todayNewFromAyah === 1 && todayNewToAyah >= sInfo.numberOfAyahs
          };
        }

        // If cumulative review, advance to the next range!
        if (item.type === 'مراجعة تراكمية') {
          const itemSurah = item.toSurahNumber || item.surahNumber;
          const itemAyah = item.toAyah;
          const sInfo = getSurahInfo(itemSurah);
          const revStep = 15;
          if (itemAyah < sInfo.numberOfAyahs) {
            return {
              ...item,
              fromAyah: itemAyah + 1,
              toAyah: Math.min(itemAyah + revStep, sInfo.numberOfAyahs),
              isFullSurah: false
            };
          } else {
            const nextS = itemSurah < 114 ? itemSurah + 1 : 1;
            const nextInfo = getSurahInfo(nextS);
            return {
              ...item,
              surahNumber: nextS,
              surahName: nextInfo.name,
              fromAyah: 1,
              toSurahNumber: nextS,
              toSurahName: nextInfo.name,
              toAyah: Math.min(revStep, nextInfo.numberOfAyahs),
              isFullSurah: revStep >= nextInfo.numberOfAyahs
            };
          }
        }

        return item;
      });
    });
  };

  // Save complete evaluation and update student's current position permanently
  const handleSaveEvaluationRecord = async () => {
    if (!activeStudent) return;
    setIsSaving(true);
    setSaveSuccessMsg('');

    try {
      const todayStartSurahInfo = getSurahInfo(todayNewSurah);
      const todayEndSurahInfo = getSurahInfo(todayNewToSurah);

      const todayNewFormatted = formatQuranPortion(
        todayStartSurahInfo.name,
        todayNewFromAyah,
        todayNewToAyah,
        todayStartSurahInfo.numberOfAyahs,
        'حفظ جديد',
        todayEndSurahInfo.name,
        todayEndSurahInfo.numberOfAyahs
      );

      const reviewStrings = todayReviews.map(r => {
        const sInfo = getSurahInfo(r.surahNumber);
        const toInfo = r.toSurahNumber ? getSurahInfo(r.toSurahNumber) : sInfo;
        const portionText = formatQuranPortion(
          sInfo.name,
          r.fromAyah,
          r.toAyah,
          sInfo.numberOfAyahs,
          r.type,
          toInfo.name,
          toInfo.numberOfAyahs
        );
        return r.didNotRecite ? `${portionText} (لم يُسمّع: ${r.didNotReciteReason || 'لم يتقن'})` : portionText;
      });
      const reviewAchievedSummary = reviewStrings.length > 0 ? reviewStrings.join(' • ') : 'أتم المراجعة والتثبيت المقرر';

      const tomStartSurahInfo = getSurahInfo(tomNewSurah);
      const tomEndSurahInfo = getSurahInfo(tomNewToSurah);

      const tomNewFormatted = formatQuranPortion(
        tomStartSurahInfo.name,
        tomNewFromAyah,
        tomNewToAyah,
        tomStartSurahInfo.numberOfAyahs,
        'حفظ جديد',
        tomEndSurahInfo.name,
        tomEndSurahInfo.numberOfAyahs
      );

      const tomRevStrings = tomReviews.map(r => {
        const sInfo = getSurahInfo(r.surahNumber);
        const toInfo = r.toSurahNumber ? getSurahInfo(r.toSurahNumber) : sInfo;
        return formatQuranPortion(
          sInfo.name,
          r.fromAyah,
          r.toAyah,
          sInfo.numberOfAyahs,
          r.type,
          toInfo.name,
          toInfo.numberOfAyahs
        );
      });
      const tomRevFormatted = tomRevStrings.length > 0 ? tomRevStrings.join(' • ') : 'المراجعة المقررة';

      const todayNewItem: QuranRecitationItem = {
        id: `new_${Date.now()}`,
        type: 'حفظ جديد',
        surahNumber: todayNewSurah,
        surahName: todayStartSurahInfo.name,
        fromAyah: todayNewFromAyah,
        toSurahNumber: todayNewToSurah,
        toSurahName: todayEndSurahInfo.name,
        toAyah: todayNewToAyah,
        isFullSurah: todayNewSurah === todayNewToSurah && todayNewFromAyah === 1 && todayNewToAyah >= todayStartSurahInfo.numberOfAyahs,
        didNotRecite: todayNewDidNotRecite,
        didNotReciteReason: todayNewDidNotRecite ? (todayNewDidNotReciteReason || 'لم يحفظ الورد المقرر') : undefined
      };

      const tomorrowNewItem: QuranRecitationItem = {
        id: `tom_new_${Date.now()}`,
        type: 'حفظ جديد',
        surahNumber: tomNewSurah,
        surahName: tomStartSurahInfo.name,
        fromAyah: tomNewFromAyah,
        toSurahNumber: tomNewToSurah,
        toSurahName: tomEndSurahInfo.name,
        toAyah: tomNewToAyah,
        isFullSurah: tomNewSurah === tomNewToSurah && tomNewFromAyah === 1 && tomNewToAyah >= tomStartSurahInfo.numberOfAyahs
      };

      const fullEvaluation: StudentEvaluation = {
        id: `eval_${selectedDate}_${activeStudent.id}`,
        date: selectedDate,
        studentId: activeStudent.id,
        criteriaValues,
        recitationDetails: {
          newMemorizationAchieved: todayNewDidNotRecite
            ? `⚠️ لم يُسمّع: ${todayNewFormatted} (${todayNewDidNotReciteReason || 'لم يحفظ الورد'})`
            : todayNewFormatted,
          reviewAchieved: reviewAchievedSummary,
          teacherNotes,
          todayNewItem,
          todayReviewItems: todayReviews,
          tomorrowNewItem,
          tomorrowReviewItem: tomReviews[0] || null,
          tomorrowReviewItems: tomReviews,
          tomorrowSuggestedSheikh: selectedSheikh,
          tomorrowDailyNote: dailyHomeNote
        },
        evaluatedAt: new Date().toISOString()
      };

      // 1. Save evaluation
      await onSaveEvaluation(fullEvaluation);

      // 2. Update student assignment & current position permanently
      const newDailyAssignment = {
        newMemorization: tomNewFormatted,
        review: tomRevFormatted,
        suggestedSheikh: selectedSheikh,
        dailyNote: dailyHomeNote,
        newItem: tomorrowNewItem,
        reviewItem: tomReviews[0] || null,
        reviewItems: tomReviews
      };

      // Update student's current position:
      // If student did not recite, keep current position unchanged!
      const targetSurahNumber = todayNewDidNotRecite ? (activeStudent.currentSurah || 78) : todayNewToSurah;
      const targetSurahName = todayNewDidNotRecite ? (activeStudent.currentSurahName || getSurahInfo(targetSurahNumber).name) : todayEndSurahInfo.name;
      const targetAyah = todayNewDidNotRecite ? (activeStudent.currentAyah || 1) : todayNewToAyah;

      await onUpdateStudentAIPlan(activeStudent.id, newDailyAssignment, {
        surahNumber: targetSurahNumber,
        surahName: targetSurahName,
        ayah: targetAyah
      });

      setSaveSuccessMsg(
        todayNewDidNotRecite
          ? `تم حفظ التقييم وتثبيت موضع الطالب عند سورة ${targetSurahName} (الآية ${targetAyah}) لعدم التسميع بنجاح!`
          : `تم حفظ التسميع والتقييم ليوم (${selectedDate}) وتحديث موضع الطالب إلى سورة ${todayEndSurahInfo.name} (الآية ${todayNewToAyah}) بنجاح!`
      );

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 }
      });
    } catch (e: any) {
      console.error('Save evaluation error:', e);
      setSaveSuccessMsg('حدث خطأ أثناء حفظ التقييم.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveSuccessMsg(''), 4500);
    }
  };

  // Criteria Management Handlers
  const handleOpenAddCriteria = () => {
    setEditingCriteriaId(null);
    setNewCritName('');
    setNewCritType('score');
    setNewCritMaxScore(10);
    setNewCritOptions('ممتاز, جيد جدا, جيد, ضعيف');
    setIsCriteriaModalOpen(true);
  };

  const handleOpenEditCriteria = (crit: EvaluationCriteria) => {
    setEditingCriteriaId(crit.id);
    setNewCritName(crit.name);
    setNewCritType(crit.type);
    setNewCritMaxScore(crit.maxScore || 10);
    setNewCritOptions(crit.options ? crit.options.join(', ') : '');
    setIsCriteriaModalOpen(true);
  };

  const handleSaveCriteriaForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCritName.trim()) return;

    const optionsArray =
      newCritType === 'options'
        ? newCritOptions
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        : undefined;

    let updatedList: EvaluationCriteria[];

    if (editingCriteriaId) {
      updatedList = criteria.map(c =>
        c.id === editingCriteriaId
          ? {
              ...c,
              name: newCritName.trim(),
              type: newCritType,
              maxScore: newCritType === 'score' ? newCritMaxScore : undefined,
              options: optionsArray
            }
          : c
      );
    } else {
      const newCrit: EvaluationCriteria = {
        id: `crit_${Date.now()}`,
        name: newCritName.trim(),
        type: newCritType,
        maxScore: newCritType === 'score' ? newCritMaxScore : undefined,
        options: optionsArray,
        isDefault: false
      };
      updatedList = [...criteria, newCrit];
    }

    await onSaveCriteria(updatedList);
    setIsCriteriaModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Date / Criteria Controls */}
      <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#fbbf24]" />
            <span>تسجيل التسميع وتقييم الطلاب وتحديد مقرر الغد</span>
          </h2>
          <p className="text-xs text-[#86efac]/90 mt-1">
            تسجيل التسميع الفعلي والرجوع للأيام السابقة، وضبط مقرر الغد تلقائياً بالذكاء الاصطناعي مع تحديث موضع الحفظ فوراً
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              showHistoryDrawer
                ? 'bg-[#fbbf24] text-[#064e3b] border-[#fbbf24] font-black shadow-md'
                : 'bg-[#022c22] hover:bg-[#064e3b] text-[#86efac] border-[#065f46]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>أرشيف الأيام السابقة للطالب ({studentEvaluationsHistory.length})</span>
          </button>

          <button
            onClick={handleOpenAddCriteria}
            className="px-3.5 py-2 rounded-2xl bg-[#022c22] hover:bg-[#022c22]/80 border border-[#065f46] text-[#fbbf24] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
          >
            <Sliders className="w-4 h-4 text-[#fbbf24]" />
            <span>معايير التقييم</span>
          </button>
        </div>
      </div>

      {/* 📅 DATE SELECTOR & NAVIGATION BAR */}
      <div className="bg-[#022c22]/90 border border-[#065f46] rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-[#86efac] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#fbbf24]" />
            <span>تاريخ التسميع المعروض:</span>
          </span>

          <div className="flex items-center gap-1.5 bg-[#064e3b]/80 p-1 rounded-xl border border-[#065f46]">
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-[#fbbf24] text-[#064e3b] font-black shadow-sm'
                  : 'text-[#86efac] hover:text-white'
              }`}
            >
              اليوم ({todayStr})
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(getYesterdayStr())}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDate === getYesterdayStr()
                  ? 'bg-[#fbbf24] text-[#064e3b] font-black shadow-sm'
                  : 'text-[#86efac] hover:text-white'
              }`}
            >
              الأمس
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(getDayBeforeYesterdayStr())}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDate === getDayBeforeYesterdayStr()
                  ? 'bg-[#fbbf24] text-[#064e3b] font-black shadow-sm'
                  : 'text-[#86efac] hover:text-white'
              }`}
            >
              قبل أمس
            </button>
          </div>

          {/* Custom Date Input */}
          <div className="flex items-center gap-1 bg-[#064e3b] px-2.5 py-1 rounded-xl border border-[#065f46]">
            <span className="text-[11px] text-[#86efac]">تاريخ مخصص:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-white outline-none font-bold cursor-pointer"
            />
          </div>
        </div>

        {/* Previous / Next Day Steppers */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => handleDateShift(-1)}
            className="px-2.5 py-1.5 rounded-xl bg-[#064e3b] hover:bg-[#065f46] text-[#86efac] hover:text-white text-xs font-bold flex items-center gap-1 border border-[#065f46] cursor-pointer transition-colors"
            title="الانتقال لليوم السابق"
          >
            <ChevronRight className="w-4 h-4" />
            <span>اليوم السابق</span>
          </button>

          <button
            type="button"
            onClick={() => handleDateShift(1)}
            className="px-2.5 py-1.5 rounded-xl bg-[#064e3b] hover:bg-[#065f46] text-[#86efac] hover:text-white text-xs font-bold flex items-center gap-1 border border-[#065f46] cursor-pointer transition-colors"
            title="الانتقال لليوم التالي"
          >
            <span>اليوم التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Past Date Notice Banner */}
      {selectedDate !== todayStr && (
        <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#fbbf24] shrink-0" />
            <span>
              أنت الآن تستعرض سجل تسميع يوم <span className="text-white underline font-black">{selectedDate}</span> {evaluations.some(e => e.date === selectedDate && e.studentId === activeStudentId) ? '(سجل تم حفظه مسبقاً)' : '(لم يتم رصد تسميع في هذا اليوم بعد)'}.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className="px-3 py-1 rounded-xl bg-[#fbbf24] text-[#064e3b] font-black text-xs shrink-0 cursor-pointer shadow-sm hover:bg-[#f59e0b]"
          >
            العودة لتسميع اليوم
          </button>
        </div>
      )}

      {/* Auto-filled from yesterday notice */}
      {autoFilledNotice && selectedDate === todayStr && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#fbbf24] shrink-0" />
            <span>{autoFilledNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setAutoFilledNotice('')}
            className="text-xs text-emerald-300 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Expandable History Drawer (Previous Days Archive) */}
      {showHistoryDrawer && activeStudent && (
        <div className="bg-[#022c22] border border-[#fbbf24]/30 rounded-3xl p-5 space-y-4 animate-fadeIn shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#065f46]">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#fbbf24]" />
              <h3 className="text-sm font-bold text-white font-heading">
                سجل التسميعات السابقة للطالب: <span className="text-[#fbbf24]">{activeStudent.name}</span> ({studentEvaluationsHistory.length} يوم مسجل)
              </h3>
            </div>
            <button
              onClick={() => setShowHistoryDrawer(false)}
              className="p-1 text-[#86efac] hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {studentEvaluationsHistory.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#86efac]/70">
              لا توجد سجلات تسميع سابقة مسجلة لهذا الطالب حتى الآن.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-1">
              {studentEvaluationsHistory.map(ev => {
                const isCurrentView = ev.date === selectedDate;
                return (
                  <div
                    key={ev.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2 text-right ${
                      isCurrentView
                        ? 'bg-[#064e3b] border-[#fbbf24] shadow-md ring-1 ring-[#fbbf24]'
                        : 'bg-[#064e3b]/40 border-[#065f46] hover:bg-[#064e3b]/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#fbbf24] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#86efac]" />
                        <span>{ev.date}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(ev.date)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-lg font-bold cursor-pointer transition-colors ${
                          isCurrentView
                            ? 'bg-[#fbbf24] text-[#064e3b] font-black'
                            : 'bg-[#022c22] text-[#86efac] hover:text-white border border-[#065f46]'
                        }`}
                      >
                        {isCurrentView ? 'المعروض حالياً' : 'عرض هذا اليوم'}
                      </button>
                    </div>

                    <div className="text-[11px] text-[#f0f9f6] space-y-1">
                      <div>
                        <span className="text-[#86efac] font-bold">الجديد: </span>
                        <span>{ev.recitationDetails?.newMemorizationAchieved || 'لم يحدد'}</span>
                      </div>
                      <div>
                        <span className="text-[#86efac] font-bold">المراجعة: </span>
                        <span className="line-clamp-1">{ev.recitationDetails?.reviewAchieved || 'لم يحدد'}</span>
                      </div>
                      {ev.recitationDetails?.teacherNotes && (
                        <div className="text-[10px] text-amber-200/90 italic line-clamp-1">
                          "{ev.recitationDetails.teacherNotes}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Students List */}
        <div className="lg:col-span-4 bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-5 space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#065f46]">
            <h3 className="text-sm font-bold text-white font-heading">
              قائمة طلاب الحلقة ({students.length})
            </h3>
            <span className="text-[11px] text-[#86efac] font-bold">
              تاريخ: {selectedDate}
            </span>
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {students.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#86efac]/70">
                لا يوجد طلاب مسجلين في الحلقة حالياً.
              </div>
            ) : (
              students.map(student => {
                const isSelected = student.id === activeStudentId;
                const studentAtt = attendance.find(
                  a => a.date === selectedDate && a.studentId === student.id
                );
                const isStudentAbsent = studentAtt?.status === 'غائب';
                const isStudentExcused = studentAtt?.status === 'معتذر';
                const hasEvaluatedOnSelectedDate = evaluations.some(
                  e => e.date === selectedDate && e.studentId === student.id
                );

                return (
                  <button
                    key={student.id}
                    onClick={() => setActiveStudentId(student.id)}
                    className={`w-full p-3.5 rounded-2xl text-right transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#fbbf24] text-[#064e3b] font-black shadow-[0_0_15px_rgba(251,191,36,0.3)] border border-[#fbbf24]'
                        : isStudentAbsent
                        ? 'bg-[#022c22]/40 text-[#86efac]/40 border border-[#065f46]/40 opacity-60'
                        : isStudentExcused
                        ? 'bg-[#022c22]/60 text-emerald-300 border border-[#065f46] opacity-80'
                        : 'bg-[#022c22] hover:bg-[#022c22]/80 text-[#f0f9f6] border border-[#065f46]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-[#064e3b] text-[#fbbf24]'
                            : 'bg-[#064e3b] text-[#fbbf24] border border-[#065f46]'
                        }`}
                      >
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs line-clamp-1">{student.name}</div>
                        <div
                          className={`text-[10px] mt-0.5 ${
                            isSelected ? 'text-[#064e3b]/80' : 'text-[#86efac]/80'
                          }`}
                        >
                          سورة {student.currentSurahName || getSurahInfo(student.currentSurah || 78).name} (آية {student.currentAyah || 1})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasEvaluatedOnSelectedDate && (
                        <span
                          className={`p-1 rounded-lg ${
                            isSelected ? 'bg-[#064e3b]/20 text-[#064e3b]' : 'text-[#fbbf24]'
                          }`}
                          title={`تم تسجيل التسميع في ${selectedDate}`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                      {isStudentAbsent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-red-500/20 text-red-300 font-bold">
                          غائب
                        </span>
                      )}
                      {isStudentExcused && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/20 text-[#86efac] font-bold">
                          معتذر
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Teacher Recitation & Assignment Workspace */}
        <div className="lg:col-span-8">
          {!activeStudent ? (
            <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-12 text-center text-[#86efac]/60 backdrop-blur-md">
              اختر طالباً من القائمة للبدء في تسجيل التسميع ومقرر الغد
            </div>
          ) : (
            <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
              {/* Header: Student Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#065f46]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#064e3b] flex items-center justify-center font-bold text-lg shadow-lg">
                    {activeStudent.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white font-heading">
                        {activeStudent.name}
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] font-bold border border-[#fbbf24]/40">
                        مستوى: {activeStudent.level}
                      </span>
                    </div>
                    <p className="text-xs text-[#86efac]/90 mt-0.5">
                      موضع الحفظ الحالي: سورة {activeStudent.currentSurahName || getSurahInfo(activeStudent.currentSurah || 78).name} (الآية {activeStudent.currentAyah || 1})
                    </p>
                  </div>
                </div>

                {isAbsent ? (
                  <div className="px-3.5 py-2 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>الطالب مسجل غائب في {selectedDate}</span>
                  </div>
                ) : isExcused ? (
                  <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-[#86efac] text-xs font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>الطالب معتذر ({selectedDateAtt?.note || 'عذر مقبول'})</span>
                  </div>
                ) : null}
              </div>

              {/* ============================================================ */}
              {/* SECTION 1: TODAY'S RECITATION (ما تم تسميعه بالتفصيل) */}
              {/* ============================================================ */}
              <div className="bg-[#022c22] border border-[#065f46] rounded-3xl p-5 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#065f46]">
                  <h4 className="text-sm font-bold text-[#fbbf24] font-heading flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#fbbf24]" />
                    <span>1. ما سمّعه الطالب في الحلقة (التسميع الفعلي):</span>
                  </h4>
                  <span className="text-[11px] text-[#86efac] font-bold">
                    تاريخ التسميع: {selectedDate}
                  </span>
                </div>

                {/* 1.1 New Memorization (Flexible Multi-Surah Range) */}
                <div className="space-y-3 bg-[#064e3b]/40 p-4 rounded-2xl border border-[#065f46]">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />
                      <span>الحفظ الجديد (بداية ونهاية التسميع):</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setTodayNewToSurah(todayNewSurah);
                          setTodayNewFromAyah(1);
                          setTodayNewToAyah(startTodaySurahInfo.numberOfAyahs);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-[#022c22] hover:bg-[#064e3b] text-[#fbbf24] border border-[#065f46] text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        كامل سورة {startTodaySurahInfo.name} ({startTodaySurahInfo.numberOfAyahs} آية)
                      </button>
                      {todayNewSurah !== todayNewToSurah && (
                        <button
                          type="button"
                          onClick={() => {
                            setTodayNewToSurah(todayNewSurah);
                            setTodayNewToAyah(startTodaySurahInfo.numberOfAyahs);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-[#022c22] text-[#86efac] border border-[#065f46] text-[11px] font-bold cursor-pointer"
                        >
                          نفس السورة
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Multi-Surah Range Selector Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#022c22]/70 p-3.5 rounded-2xl border border-[#065f46]">
                    {/* START POINT */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-[#fbbf24]">نقطة البداية (من):</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[#86efac] block mb-1">من سورة:</label>
                          <select
                            value={todayNewSurah}
                            onChange={e => handleTodayStartSurahChange(Number(e.target.value))}
                            className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2.5 text-xs text-white outline-none"
                          >
                            {QURAN_SURAHS.map(s => (
                              <option key={s.number} value={s.number}>
                                {s.number}. سورة {s.name} ({s.numberOfAyahs} آية)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#86efac] block mb-1">من الآية:</label>
                          <select
                            value={todayNewFromAyah}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setTodayNewFromAyah(val);
                              if (todayNewSurah === todayNewToSurah && todayNewToAyah < val) {
                                setTodayNewToAyah(val);
                              }
                            }}
                            className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2.5 text-xs text-white outline-none"
                          >
                            {Array.from({ length: startTodaySurahInfo.numberOfAyahs }, (_, i) => i + 1).map(ayahNum => (
                              <option key={ayahNum} value={ayahNum}>
                                آية {ayahNum}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* END POINT */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-[#86efac]">نقطة النهاية (إلى):</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[#86efac] block mb-1">إلى سورة:</label>
                          <select
                            value={todayNewToSurah}
                            onChange={e => handleTodayEndSurahChange(Number(e.target.value))}
                            className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2.5 text-xs text-white outline-none"
                          >
                            {QURAN_SURAHS.map(s => (
                              <option key={s.number} value={s.number}>
                                {s.number}. سورة {s.name} ({s.numberOfAyahs} آية)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#86efac] block mb-1">
                            إلى الآية (حتى {endTodaySurahInfo.numberOfAyahs}):
                          </label>
                          <select
                            value={todayNewToAyah}
                            onChange={e => setTodayNewToAyah(Number(e.target.value))}
                            className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2.5 text-xs text-white outline-none"
                          >
                            {Array.from({ length: endTodaySurahInfo.numberOfAyahs }, (_, i) => i + 1)
                              .filter(ayahNum => todayNewSurah !== todayNewToSurah || ayahNum >= todayNewFromAyah)
                              .map(ayahNum => (
                                <option key={ayahNum} value={ayahNum}>
                                  آية {ayahNum}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live preview banner */}
                  <div className="p-3 rounded-2xl bg-[#022c22] border border-[#065f46] text-xs text-[#fbbf24] flex items-center justify-between">
                    <span className="text-[#86efac] font-bold">صيغة التسميع المعتمدة:</span>
                    <span className="font-bold text-sm">
                      {formatQuranPortion(
                        startTodaySurahInfo.name,
                        todayNewFromAyah,
                        todayNewToAyah,
                        startTodaySurahInfo.numberOfAyahs,
                        'حفظ جديد',
                        endTodaySurahInfo.name,
                        endTodaySurahInfo.numberOfAyahs
                      )}
                    </span>
                  </div>

                  {/* Did not recite toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#022c22]/90 border border-[#065f46]">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold select-none">
                      <input
                        type="checkbox"
                        checked={todayNewDidNotRecite}
                        onChange={e => setTodayNewDidNotRecite(e.target.checked)}
                        className="w-4 h-4 rounded text-red-500 bg-[#064e3b] border-[#065f46] focus:ring-red-400 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className={todayNewDidNotRecite ? "text-red-400 font-black" : "text-emerald-200"}>
                        لم يُسمّع الطالب هذا الورد اليوم (تثبيت نفس الورد لليوم التالي وعدم تقدمه)
                      </span>
                    </label>
                    {todayNewDidNotRecite && (
                      <div className="flex-1 max-w-sm">
                        <input
                          type="text"
                          value={todayNewDidNotReciteReason}
                          onChange={e => setTodayNewDidNotReciteReason(e.target.value)}
                          placeholder="سبب عدم التسميع (مثال: لم يحفظ، تعثر شديد، غياب...)"
                          className="w-full bg-[#064e3b] border border-red-500/40 focus:border-red-400 rounded-xl py-1.5 px-3 text-xs text-red-200 outline-none placeholder:text-red-300/40"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 1.2 Today's Reviews */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#86efac]" />
                      <span>المراجعة والتثبيت والاختبارات ({todayReviews.length}):</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddReviewItem}
                      className="px-3 py-1.5 rounded-xl bg-[#064e3b] hover:bg-[#064e3b]/80 border border-[#065f46] text-[#86efac] hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة مراجعة أو اختبار آخر</span>
                    </button>
                  </div>

                  {todayReviews.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#064e3b]/20 border border-dashed border-[#065f46] text-center text-xs text-[#86efac]/70">
                      لا توجد مراجعات مسجلة. اضغط على "إضافة مراجعة" لإضافة موضع مراجعة أو اختبار.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayReviews.map((rev, index) => {
                        const revStartSurahInfo = getSurahInfo(rev.surahNumber);
                        const revEndSurahInfo = rev.toSurahNumber ? getSurahInfo(rev.toSurahNumber) : revStartSurahInfo;

                        return (
                          <div
                            key={rev.id}
                            className="bg-[#064e3b]/30 p-4 rounded-2xl border border-[#065f46] space-y-3 relative"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-[#86efac]">
                                  بند مراجعة #{index + 1}
                                </span>
                                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold select-none">
                                  <input
                                    type="checkbox"
                                    checked={!!rev.didNotRecite}
                                    onChange={e => handleUpdateReviewItem(rev.id, {
                                      didNotRecite: e.target.checked,
                                      didNotReciteReason: e.target.checked ? (rev.didNotReciteReason || 'لم يتقن الورد') : undefined
                                    })}
                                    className="w-3.5 h-3.5 rounded text-red-500 bg-[#022c22] border-[#065f46]"
                                  />
                                  <span className={rev.didNotRecite ? "text-red-400 font-bold" : "text-[#86efac]/80"}>
                                    لم يُسمّع
                                  </span>
                                </label>
                                {rev.didNotRecite && (
                                  <input
                                    type="text"
                                    value={rev.didNotReciteReason || ''}
                                    onChange={e => handleUpdateReviewItem(rev.id, { didNotReciteReason: e.target.value })}
                                    placeholder="السبب..."
                                    className="bg-[#022c22] border border-red-500/40 rounded-lg py-0.5 px-2 text-[11px] text-red-200 outline-none w-28 placeholder:text-red-300/40"
                                  />
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateReviewItem(rev.id, {
                                      toSurahNumber: rev.surahNumber,
                                      toSurahName: revStartSurahInfo.name,
                                      fromAyah: 1,
                                      toAyah: revStartSurahInfo.numberOfAyahs,
                                      isFullSurah: true
                                    })
                                  }
                                  className="px-2 py-0.5 rounded-lg bg-[#022c22] text-[#fbbf24] text-[10px] font-bold border border-[#065f46] cursor-pointer"
                                >
                                  كامل السورة ({revStartSurahInfo.numberOfAyahs})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveReviewItem(rev.id)}
                                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                                  title="حذف هذا البند"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                              {/* Review Type */}
                              <div className="sm:col-span-1">
                                <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                                  نوع المراجعة:
                                </label>
                                <select
                                  value={rev.type}
                                  onChange={e => handleUpdateReviewItem(rev.id, { type: e.target.value })}
                                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                                >
                                  {REVIEW_TYPES.map(t => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Start Surah */}
                              <div>
                                <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                                  من سورة:
                                </label>
                                <select
                                  value={rev.surahNumber}
                                  onChange={e => handleUpdateReviewItem(rev.id, { surahNumber: Number(e.target.value) })}
                                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                                >
                                  {QURAN_SURAHS.map(s => (
                                    <option key={s.number} value={s.number}>
                                      {s.number}. {s.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* From Ayah */}
                              <div>
                                <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                                  من الآية:
                                </label>
                                <select
                                  value={rev.fromAyah}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    handleUpdateReviewItem(rev.id, {
                                      fromAyah: val,
                                      toAyah: (rev.toSurahNumber || rev.surahNumber) === rev.surahNumber && rev.toAyah < val ? val : rev.toAyah
                                    });
                                  }}
                                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                                >
                                  {Array.from({ length: revStartSurahInfo.numberOfAyahs }, (_, i) => i + 1).map(ayahNum => (
                                    <option key={ayahNum} value={ayahNum}>
                                      آية {ayahNum}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* End Surah */}
                              <div>
                                <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                                  إلى سورة:
                                </label>
                                <select
                                  value={rev.toSurahNumber || rev.surahNumber}
                                  onChange={e => handleUpdateReviewItem(rev.id, { toSurahNumber: Number(e.target.value) })}
                                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                                >
                                  {QURAN_SURAHS.map(s => (
                                    <option key={s.number} value={s.number}>
                                      {s.number}. {s.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* To Ayah */}
                              <div>
                                <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                                  إلى الآية:
                                </label>
                                <select
                                  value={rev.toAyah}
                                  onChange={e => handleUpdateReviewItem(rev.id, { toAyah: Number(e.target.value) })}
                                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                                >
                                  {Array.from({ length: revEndSurahInfo.numberOfAyahs }, (_, i) => i + 1)
                                    .filter(ayahNum => (rev.toSurahNumber || rev.surahNumber) !== rev.surahNumber || ayahNum >= rev.fromAyah)
                                    .map(ayahNum => (
                                      <option key={ayahNum} value={ayahNum}>
                                        آية {ayahNum}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>

                            <div className="text-[11px] text-[#fbbf24] bg-[#022c22] p-2.5 rounded-xl border border-[#065f46] font-bold">
                              {formatQuranPortion(
                                revStartSurahInfo.name,
                                rev.fromAyah,
                                rev.toAyah,
                                revStartSurahInfo.numberOfAyahs,
                                rev.type,
                                revEndSurahInfo.name,
                                revEndSurahInfo.numberOfAyahs
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ============================================================ */}
              {/* SECTION 2: TOMORROW'S ASSIGNMENT & MULTI-REVIEWS             */}
              {/* ============================================================ */}
              <div className="bg-[#022c22] border border-[#065f46] rounded-3xl p-5 space-y-5 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#065f46]">
                  <div>
                    <h4 className="text-sm font-bold text-[#fbbf24] font-heading flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#fbbf24]" />
                      <span>2. المقرر المطلوب تسميعه غداً (حفظ جديد + مراجعات وتراكميات محفوظة):</span>
                    </h4>
                    <p className="text-[11px] text-[#86efac]/80 mt-0.5">
                      يبقى الورد والمراجعات والتراكميات محفوظة للغد وثابتة للأبد حتى يقوم المعلم بتعديلها أو حذفها
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoProgressTomorrow}
                    className="px-3.5 py-2 rounded-2xl bg-[#064e3b] hover:bg-[#047857] border border-[#065f46] text-[#fbbf24] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="تحديث تدرج الورد والتراكمي لغد تلقائياً"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#fbbf24]" />
                    <span>تدرج الورد والتراكمي لغد تلقائياً</span>
                  </button>
                </div>

                {/* 2.1 Tomorrow's New Memorization */}
                <div className="space-y-3 bg-[#064e3b]/40 p-4 rounded-2xl border border-[#065f46]">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />
                      <span>ورد الحفظ الجديد المطلوب لغد (بداية ونهاية المقرر):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTomNewToSurah(tomNewSurah);
                        setTomNewFromAyah(1);
                        setTomNewToAyah(startTomNewSurahInfo.numberOfAyahs);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-[#022c22] text-[#fbbf24] border border-[#065f46] text-[11px] font-bold cursor-pointer"
                    >
                      كامل سورة {startTomNewSurahInfo.name} ({startTomNewSurahInfo.numberOfAyahs})
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#022c22]/70 p-3.5 rounded-2xl border border-[#065f46]">
                    {/* START POINT */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-[#fbbf24]">نقطة البداية (من):</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[#86efac] block mb-1">من سورة:</label>
                          <select
                            value={tomNewSurah}
                            onChange={e => handleTomNewStartSurahChange(Number(e.target.value))}
                            className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2.5 text-xs text-white outline-none"
                          >
                            {QURAN_SURAHS.map(s => (
                              <option key={s.number} value={s.number}>
                                {s.number}. {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#86efac] block mb-1">من الآية:</label>
                          <select
                            value={tomNewFromAyah}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setTomNewFromAyah(val);
                              if (tomNewSurah === tomNewToSurah && tomNewToAyah < val) {
                                setTomNewToAyah(val);
                              }
                            }}
                            className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2.5 text-xs text-white outline-none"
                          >
                            {Array.from({ length: startTomNewSurahInfo.numberOfAyahs }, (_, i) => i + 1).map(ayahNum => (
                              <option key={ayahNum} value={ayahNum}>
                                آية {ayahNum}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* END POINT */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-[#86efac]">نقطة النهاية (إلى):</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[#86efac] block mb-1">إلى سورة:</label>
                          <select
                            value={tomNewToSurah}
                            onChange={e => handleTomNewEndSurahChange(Number(e.target.value))}
                            className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2.5 text-xs text-white outline-none"
                          >
                            {QURAN_SURAHS.map(s => (
                              <option key={s.number} value={s.number}>
                                {s.number}. {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#86efac] block mb-1">
                            إلى الآية (حتى {endTomNewSurahInfo.numberOfAyahs}):
                          </label>
                          <select
                            value={tomNewToAyah}
                            onChange={e => setTomNewToAyah(Number(e.target.value))}
                            className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2.5 text-xs text-white outline-none"
                          >
                            {Array.from({ length: endTomNewSurahInfo.numberOfAyahs }, (_, i) => i + 1)
                              .filter(ayahNum => tomNewSurah !== tomNewToSurah || ayahNum >= tomNewFromAyah)
                              .map(ayahNum => (
                                <option key={ayahNum} value={ayahNum}>
                                  آية {ayahNum}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#022c22] border border-[#065f46] text-xs text-[#fbbf24] flex items-center justify-between">
                    <span className="text-[#86efac] font-bold">المقرر الجديد لغد:</span>
                    <span className="font-bold text-sm">
                      {formatQuranPortion(
                        startTomNewSurahInfo.name,
                        tomNewFromAyah,
                        tomNewToAyah,
                        startTomNewSurahInfo.numberOfAyahs,
                        'حفظ جديد',
                        endTomNewSurahInfo.name,
                        endTomNewSurahInfo.numberOfAyahs
                      )}
                    </span>
                  </div>
                </div>

                {/* 2.2 Tomorrow's Reviews (Multi-item) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#86efac]" />
                      <span>ورد المراجعة والتثبيت والاختبارات لغد ({tomReviews.length}):</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddTomReviewItem}
                      className="px-3 py-1.5 rounded-xl bg-[#064e3b] hover:bg-[#064e3b]/80 border border-[#065f46] text-[#86efac] hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة مراجعة أو اختبار لغد</span>
                    </button>
                  </div>

                  {tomReviews.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#064e3b]/20 border border-dashed border-[#065f46] text-center text-xs text-[#86efac]/70">
                      لا توجد مراجعات مقررة لغد. اضغط على "إضافة مراجعة أو اختبار لغد" لتحديد المقرر.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tomReviews.map((rev, index) => {
                        const revStartSurahInfo = getSurahInfo(rev.surahNumber);
                        const revEndSurahInfo = rev.toSurahNumber ? getSurahInfo(rev.toSurahNumber) : revStartSurahInfo;

                        return (
                          <div
                            key={rev.id}
                            className="bg-[#064e3b]/30 p-4 rounded-2xl border border-[#065f46] space-y-3 relative"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-bold text-[#86efac]">
                                مقرر مراجعة لغد #{index + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateTomReviewItem(rev.id, {
                                      toSurahNumber: rev.surahNumber,
                                      toSurahName: revStartSurahInfo.name,
                                      fromAyah: 1,
                                      toAyah: revStartSurahInfo.numberOfAyahs,
                                      isFullSurah: true
                                    })
                                  }
                                  className="px-2 py-0.5 rounded-lg bg-[#022c22] text-[#fbbf24] text-[10px] font-bold border border-[#065f46] cursor-pointer"
                                >
                                  كامل السورة ({revStartSurahInfo.numberOfAyahs})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTomReviewItem(rev.id)}
                                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                                  title="حذف هذا المقرر لغد"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                              {/* Review Type */}
                              <div className="sm:col-span-1">
                                <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                                  نوع المراجعة:
                                </label>
                                <select
                                  value={rev.type}
                                  onChange={e => handleUpdateTomReviewItem(rev.id, { type: e.target.value })}
                                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                                >
                                  {REVIEW_TYPES.map(t => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Start Surah */}
                              <div>
                                <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                                  من سورة:
                                </label>
                                <select
                                  value={rev.surahNumber}
                                  onChange={e => handleUpdateTomReviewItem(rev.id, { surahNumber: Number(e.target.value) })}
                                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                                >
                                  {QURAN_SURAHS.map(s => (
                                    <option key={s.number} value={s.number}>
                                      {s.number}. {s.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* From Ayah */}
                              <div>
                                <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                                  من الآية:
                                </label>
                                <select
                                  value={rev.fromAyah}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    handleUpdateTomReviewItem(rev.id, {
                                      fromAyah: val,
                                      toAyah: (rev.toSurahNumber || rev.surahNumber) === rev.surahNumber && rev.toAyah < val ? val : rev.toAyah
                                    });
                                  }}
                                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                                >
                                  {Array.from({ length: revStartSurahInfo.numberOfAyahs }, (_, i) => i + 1).map(ayahNum => (
                                    <option key={ayahNum} value={ayahNum}>
                                      آية {ayahNum}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* End Surah */}
                              <div>
                                <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                                  إلى سورة:
                                </label>
                                <select
                                  value={rev.toSurahNumber || rev.surahNumber}
                                  onChange={e => handleUpdateTomReviewItem(rev.id, { toSurahNumber: Number(e.target.value) })}
                                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                                >
                                  {QURAN_SURAHS.map(s => (
                                    <option key={s.number} value={s.number}>
                                      {s.number}. {s.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* To Ayah */}
                              <div>
                                <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                                  إلى الآية:
                                </label>
                                <select
                                  value={rev.toAyah}
                                  onChange={e => handleUpdateTomReviewItem(rev.id, { toAyah: Number(e.target.value) })}
                                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                                >
                                  {Array.from({ length: revEndSurahInfo.numberOfAyahs }, (_, i) => i + 1)
                                    .filter(ayahNum => (rev.toSurahNumber || rev.surahNumber) !== rev.surahNumber || ayahNum >= rev.fromAyah)
                                    .map(ayahNum => (
                                      <option key={ayahNum} value={ayahNum}>
                                        آية {ayahNum}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>

                            <div className="text-[11px] text-[#fbbf24] bg-[#022c22] p-2.5 rounded-xl border border-[#065f46] font-bold">
                              {formatQuranPortion(
                                revStartSurahInfo.name,
                                rev.fromAyah,
                                rev.toAyah,
                                revStartSurahInfo.numberOfAyahs,
                                rev.type,
                                revEndSurahInfo.name,
                                revEndSurahInfo.numberOfAyahs
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2.3 Reciter & Daily Home Directive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#86efac] block mb-1 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-[#fbbf24]" />
                      <span>القارئ المقترح للاستماع له بالمنزل:</span>
                    </label>
                    <select
                      value={selectedSheikh}
                      onChange={e => setSelectedSheikh(e.target.value)}
                      className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3 text-xs text-white outline-none"
                    >
                      {FAMOUS_RECITERS.map(r => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#86efac] block mb-1 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#fbbf24]" />
                      <span>توجيه المتابعة المنزلية لولي الأمر:</span>
                    </label>
                    <input
                      type="text"
                      value={dailyHomeNote}
                      onChange={e => setDailyHomeNote(e.target.value)}
                      placeholder="اكتب التوجيه المنزلي..."
                      className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3 text-xs text-white outline-none"
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* SECTION 3: EVALUATION CRITERIA & TEACHER NOTES               */}
              {/* ============================================================ */}
              <div className="bg-[#022c22] border border-[#065f46] rounded-3xl p-5 space-y-4">
                <div className="text-xs font-bold text-[#fbbf24] flex items-center gap-2 pb-2 border-b border-[#065f46]">
                  <Award className="w-4 h-4 text-[#fbbf24]" />
                  <span>3. تقييم المعايير وملاحظات المعلم:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {criteria.map(crit => {
                    const val = criteriaValues[crit.id];

                    return (
                      <div key={crit.id} className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#86efac] block text-right">
                          {crit.name}:
                        </label>

                        {/* Stars */}
                        {crit.type === 'stars' && (
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map(starNum => (
                              <button
                                key={starNum}
                                type="button"
                                onClick={() =>
                                  setCriteriaValues(prev => ({
                                    ...prev,
                                    [crit.id]: starNum
                                  }))
                                }
                                className="p-1 rounded-lg transition-transform hover:scale-110 cursor-pointer"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    starNum <= (Number(val) || 5)
                                      ? 'fill-[#fbbf24] text-[#fbbf24]'
                                      : 'text-[#064e3b]'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Score */}
                        {crit.type === 'score' && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={crit.maxScore || 10}
                              value={val !== undefined ? val : crit.maxScore || 10}
                              onChange={e =>
                                setCriteriaValues(prev => ({
                                  ...prev,
                                  [crit.id]: Number(e.target.value)
                                }))
                              }
                              className="w-20 bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3 text-sm text-center text-[#fbbf24] font-black outline-none"
                            />
                            <span className="text-xs text-[#86efac]">
                              / {crit.maxScore || 10} درجات
                            </span>
                          </div>
                        )}

                        {/* Options */}
                        {crit.type === 'options' && crit.options && (
                          <div className="flex flex-wrap gap-1.5">
                            {crit.options.map(opt => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() =>
                                  setCriteriaValues(prev => ({
                                    ...prev,
                                    [crit.id]: opt
                                  }))
                                }
                                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                  val === opt
                                    ? 'bg-[#fbbf24] text-[#064e3b] font-black shadow-md'
                                    : 'bg-[#064e3b] text-[#86efac] hover:text-white border border-[#065f46]'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Text */}
                        {crit.type === 'text' && (
                          <input
                            type="text"
                            value={val || ''}
                            onChange={e =>
                              setCriteriaValues(prev => ({
                                ...prev,
                                [crit.id]: e.target.value
                              }))
                            }
                            placeholder="ملاحظة حول هذا المعيار..."
                            className="w-full bg-[#064e3b] border border-[#065f46] rounded-2xl py-2 px-3.5 text-xs text-[#f0f9f6] outline-none"
                            dir="rtl"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Teacher remarks */}
                <div className="pt-2">
                  <label className="text-xs font-semibold text-[#86efac] block mb-1 text-right">
                    ملاحظات وتوجيهات الشيخ/المعلم الخاصة بالطالب اليوم:
                  </label>
                  <textarea
                    rows={2}
                    value={teacherNotes}
                    onChange={e => setTeacherNotes(e.target.value)}
                    placeholder="مثال: أحسنت في إتقان الوقف والابتداء، راعِ تفخيم حروف الاستعلاء في سورة النمل..."
                    className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3.5 text-xs text-[#f0f9f6] outline-none resize-none"
                    dir="rtl"
                  />
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="p-4 rounded-2xl bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24] text-xs sm:text-sm font-bold text-center animate-fadeIn flex items-center justify-center gap-2">
                  <Check className="w-5 h-5 text-[#fbbf24]" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#065f46]">
                <div className="flex flex-wrap items-center gap-2">
                  {onNavigateToWhatsApp && (
                    <button
                      type="button"
                      onClick={() => onNavigateToWhatsApp(activeStudent.id)}
                      className="px-4 py-3 rounded-2xl bg-[#022c22] hover:bg-[#022c22]/80 border border-[#065f46] text-[#fbbf24] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4 text-[#fbbf24]" />
                      <span>رسالة واتساب اليومية</span>
                    </button>
                  )}

                  {onNavigateToBehavior && (
                    <button
                      type="button"
                      onClick={() => onNavigateToBehavior(activeStudent.id)}
                      className="px-4 py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>تسجيل مخالفة/ملاحظة سلوكية</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveEvaluationRecord}
                  className="px-8 py-3.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 text-[#064e3b] text-sm font-black shadow-[0_0_25px_rgba(251,191,36,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isSaving ? (
                    <span>جاري حفظ السجل وتحديث البيانات...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-[#064e3b]" />
                      <span>حفظ التسميع والتقييم وتثبيت مقرر الغد</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Criteria Modal */}
      {isCriteriaModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="relative w-full max-w-md bg-[#064e3b] border border-[#fbbf24]/40 rounded-2xl sm:rounded-[32px] shadow-2xl flex flex-col max-h-[92vh] my-auto overflow-hidden overscroll-contain animate-fadeIn">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#065f46] shrink-0 bg-[#064e3b]">
              <h3 className="text-sm sm:text-base font-bold text-[#fbbf24] font-heading">
                {editingCriteriaId ? 'تعديل معيار التقييم' : 'إضافة معيار تقييم جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCriteriaModalOpen(false)}
                className="p-1.5 text-[#86efac] hover:text-white rounded-lg cursor-pointer hover:bg-[#022c22]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCriteriaForm} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#86efac] mb-1.5 text-right">
                    اسم المعيار <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCritName}
                    onChange={e => setNewCritName(e.target.value)}
                    placeholder="مثال: أحكام التجويد، الصوت والترتيل، الآداب"
                    className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3.5 text-xs text-[#f0f9f6] outline-none"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#86efac] mb-1.5 text-right">
                    نوع التقييم
                  </label>
                  <select
                    value={newCritType}
                    onChange={e => setNewCritType(e.target.value as CriteriaType)}
                    className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3.5 text-xs text-[#f0f9f6] outline-none"
                  >
                    <option value="score">تقييم بالدرجات (مثلاً من 10 أو 7 أو 100)</option>
                    <option value="stars">تقييم بالنجوم (1 إلى 5 نجوم)</option>
                    <option value="options">خيارات مخصصة (ممتاز، جيد، إلخ)</option>
                    <option value="text">ملاحظات نصية حرة</option>
                  </select>
                </div>

                {newCritType === 'score' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#86efac] mb-1.5 text-right">
                      الدرجة العظمى (الحد الأقصى)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={newCritMaxScore}
                      onChange={e => setNewCritMaxScore(Number(e.target.value))}
                      className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3.5 text-xs text-[#f0f9f6] outline-none"
                    />
                  </div>
                )}

                {newCritType === 'options' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#86efac] mb-1.5 text-right">
                      الخيارات المتاحة (افصل بينها بفاصلة ,)
                    </label>
                    <input
                      type="text"
                      value={newCritOptions}
                      onChange={e => setNewCritOptions(e.target.value)}
                      placeholder="مثال: ممتاز, جيد جدا, جيد, ضعيف"
                      className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3.5 text-xs text-[#f0f9f6] outline-none"
                      dir="rtl"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 p-4 sm:p-5 border-t border-[#065f46] shrink-0 bg-[#022c22]/95">
                <button
                  type="button"
                  onClick={() => setIsCriteriaModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-[#86efac] hover:bg-[#064e3b] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] text-xs font-black shadow-md cursor-pointer"
                >
                  {editingCriteriaId ? 'حفظ التعديلات' : 'إضافة المعيار'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Criteria Confirmation Modal */}
      {critToDelete && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="relative w-full max-w-sm bg-[#064e3b] border border-red-500/50 rounded-2xl sm:rounded-[32px] p-5 sm:p-6 shadow-2xl space-y-4 text-center my-auto overscroll-contain animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">تأكيد حذف معيار التقييم</h3>
              <p className="text-xs text-[#86efac]/90 mt-1">
                هل أنت متأكد من رغبتك في حذف معيار <span className="text-[#fbbf24] font-bold">"{critToDelete.name}"</span>؟
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2 flex-col sm:flex-row">
              <button
                type="button"
                onClick={() => setCritToDelete(null)}
                className="w-full sm:flex-1 py-2.5 rounded-2xl text-xs font-bold bg-[#022c22] text-[#86efac] hover:text-white border border-[#065f46] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (critToDelete) {
                    const id = critToDelete.id;
                    setCritToDelete(null);
                    await onDeleteCriteria(id);
                  }
                }}
                className="w-full sm:flex-1 py-2.5 rounded-2xl text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow-lg cursor-pointer transition-all"
              >
                نعم، احذف المعيار
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
