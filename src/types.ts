export type UserRole = 'admin' | 'student';

export interface QuranComplex {
  id: string;
  name: string; // e.g. "مجمع النور القرآني"
  description?: string;
  supervisorTeacherId?: string; // ID of the supervisor teacher assigned to this complex
  supervisorTeacherName?: string; // Display name of supervisor teacher
  createdAt: string;
  updatedAt?: string;
  databaseConfig?: {
    isCustom?: boolean;
    projectId?: string;
    apiKey?: string;
    authDomain?: string;
    storageBucket?: string;
    appId?: string;
    enabledAt?: string;
    connectedEmail?: string;
    databaseId?: string;
  };
  // Independent Firebase database config if separated
  customFirebaseConfig?: {
    isEnabled: boolean;
    projectId: string;
    apiKey: string;
    firestoreDatabaseId?: string;
    storageBucket?: string;
    authDomain?: string;
    connectedAt?: string;
  };
}

export interface Halaqah {
  id: string;
  name: string; // e.g. "حلقة القرآن الكريم"
  description?: string;
  complexId?: string; // ID of the complex this halaqah belongs to
  complexName?: string; // Cached display name of the complex
  primaryTeacherName?: string;
  teacherIds?: string[]; // Teacher IDs linked to this halaqah
  teacherNames?: string[]; // Cached teacher names
  createdAt: string;
  isDefault?: boolean;
}

export interface TeacherAccount {
  id: string;
  name: string; // e.g. "المشرف العام", "الشيخ عبد الله بن فهد"
  username: string; // username used to log in
  password?: string; // password used to log in
  phone: string; // teacher's phone number
  title?: string; // e.g. "مشرف ومطور المنظومة", "المعلم المشرف", "معلم ومحفظ"
  isPrimary?: boolean;
  role?: 'teacher' | 'supervisor' | 'developer'; // رتبة المعلم: معلم عادي، مشرف، أو مبرمج ومطور
  complexId?: string; // Complex supervised by this teacher if applicable
  complexName?: string;
  complexIds?: string[]; // All complexes this teacher is linked to
  complexNames?: string[]; // Display names of those complexes
  halaqahId?: string; // Legacy single halaqah id
  halaqahName?: string; // Legacy single halaqah name
  halaqahIds?: string[]; // All halaqahs this teacher teaches (supports multiple halaqahs)
  halaqahNames?: string[]; // Display names of those halaqahs
  googleEmail?: string | null; // بريد حساب Google المرتبط بالمعلم
  googleUid?: string | null; // معرف Google UID
  googleName?: string | null; // اسم الحساب في Google
  googlePhotoUrl?: string | null; // صورة الحساب في Google
  isGoogleLinked?: boolean; // هل حساب المعلم موثق ومربوط بـ Google للتسجيل السريع
  createdAt: string;
}

/**
 * Check if user or teacher has developer / system administrator privileges.
 */
export const isTeacherDeveloper = (
  teacher?: TeacherAccount | null,
  userObj?: { username?: string; role?: string } | null
): boolean => {
  if (teacher) {
    if (teacher.role === 'developer') return true;
    const cleanUser = (teacher.username || '').trim().toLowerCase();
    if (
      cleanUser === 'admin' ||
      cleanUser === 'developer'
    ) {
      return true;
    }
  }
  if (userObj) {
    const cleanUser = (userObj.username || '').trim().toLowerCase();
    if (cleanUser === 'admin' || cleanUser === 'developer') {
      return true;
    }
  }
  return false;
};

/**
 * Standard utility to determine if a teacher account has supervisor rank and permissions.
 * If explicitly marked as 'developer', they have all supervisor permissions + developer features.
 * If explicitly marked as 'supervisor', they supervise their assigned complex and halaqahs.
 * If explicitly marked as 'teacher', they are strictly a regular teacher (not supervisor).
 */
export const isTeacherSupervisor = (teacher?: TeacherAccount | null): boolean => {
  if (!teacher) return false;
  const cleanUser = (teacher.username || '').trim().toLowerCase();

  // Developer has full supervisor permissions
  if (teacher.role === 'developer') {
    return true;
  }

  // Admin user is supervisor and developer
  if (cleanUser === 'admin' || cleanUser === 'developer') {
    return true;
  }

  // Explicit teacher role = regular teacher (NOT supervisor)
  if (teacher.role === 'teacher') {
    return false;
  }

  // Explicit supervisor role
  if (teacher.role === 'supervisor') {
    return true;
  }

  // Legacy isPrimary fallback
  return Boolean(teacher.isPrimary);
};

/**
 * Normalizes text for resilient comparisons (trim, lowercasing, diacritics/spacing tolerance).
 */
export const normalizeTeacherText = (text?: string | null): string => {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove Arabic diacritics
    .replace(/\s+/g, ' ');
};

/**
 * Checks if two teacher references match (by ID, full name, username, or phone).
 */
export const isSameTeacher = (
  teacher?: { id?: string; name?: string; username?: string; phone?: string } | null,
  target?: { id?: string; name?: string; username?: string; phone?: string } | null
): boolean => {
  if (!teacher || !target) return false;
  if (teacher.id && target.id && teacher.id === target.id) return true;

  const tName = normalizeTeacherText(teacher.name);
  const targetName = normalizeTeacherText(target.name);
  if (tName && targetName && tName === targetName) return true;

  const tUser = normalizeTeacherText(teacher.username);
  const targetUser = normalizeTeacherText(target.username);
  if (tUser && targetUser && tUser === targetUser) return true;

  if (teacher.phone && target.phone && teacher.phone.trim() === target.phone.trim()) return true;

  return false;
};

/**
 * Resolves all QuranComplexes that a teacher is associated with or has been added to.
 * Checks direct complex assignment, supervisor appointment, halaqah assignments across complexes,
 * and teacher accounts in other complexes that share the same name/username/phone.
 */
export const getTeacherAllComplexes = (
  teacher?: TeacherAccount | null,
  allTeachers: TeacherAccount[] = [],
  complexes: QuranComplex[] = [],
  halaqahs: Halaqah[] = [],
  isDev: boolean = false
): QuranComplex[] => {
  if (complexes.length === 0) return [];

  // Developer / System Administrator has access to all complexes
  if (isDev || isTeacherDeveloper(teacher)) {
    return complexes;
  }

  if (!teacher) {
    return complexes.slice(0, 1);
  }

  const teacherNameNorm = normalizeTeacherText(teacher.name);
  const teacherUserNorm = normalizeTeacherText(teacher.username);

  // Find all sibling teacher accounts that share this teacher's identity (same name, username, or phone)
  const matchingTeacherAccounts = allTeachers.filter(t => isSameTeacher(teacher, t));
  const matchingTeacherIds = new Set<string>(matchingTeacherAccounts.map(t => t.id));
  matchingTeacherIds.add(teacher.id);

  const matchedComplexIds = new Set<string>();

  for (const complex of complexes) {
    let isMatched = false;

    // 1. Direct match on complexId or complexIds list
    if (teacher.complexId === complex.id) isMatched = true;
    if (teacher.complexIds?.includes(complex.id)) isMatched = true;

    // 2. Supervisor of this complex
    if (complex.supervisorTeacherId && matchingTeacherIds.has(complex.supervisorTeacherId)) isMatched = true;
    if (complex.supervisorTeacherName && (
      normalizeTeacherText(complex.supervisorTeacherName) === teacherNameNorm ||
      normalizeTeacherText(complex.supervisorTeacherName) === teacherUserNorm
    )) {
      isMatched = true;
    }

    // 3. Matched sibling teacher account assigned in this complex
    for (const acc of matchingTeacherAccounts) {
      if (acc.complexId === complex.id || acc.complexIds?.includes(complex.id)) {
        isMatched = true;
        break;
      }
    }

    // 4. Halaqahs in this complex where this teacher is assigned (by ID or by name)
    const complexHalaqahs = halaqahs.filter(h => {
      const cId = h.complexId || (complexes[0] ? complexes[0].id : '');
      return cId === complex.id;
    });

    for (const h of complexHalaqahs) {
      if (h.teacherIds && h.teacherIds.some(tid => matchingTeacherIds.has(tid))) {
        isMatched = true;
        break;
      }
      if (h.primaryTeacherName) {
        const primNorm = normalizeTeacherText(h.primaryTeacherName);
        if (primNorm === teacherNameNorm || primNorm === teacherUserNorm) {
          isMatched = true;
          break;
        }
      }
      if (h.teacherNames) {
        if (h.teacherNames.some(tn => {
          const norm = normalizeTeacherText(tn);
          return norm === teacherNameNorm || norm === teacherUserNorm;
        })) {
          isMatched = true;
          break;
        }
      }
    }

    if (isMatched) {
      matchedComplexIds.add(complex.id);
    }
  }

  // Filter complexes matching the resolved IDs
  const result = complexes.filter(c => matchedComplexIds.has(c.id));

  // If no specific complex matched, fallback to single complex or first complex
  if (result.length === 0 && complexes.length > 0) {
    return [complexes[0]];
  }

  return result;
};

/**
 * Resolves the specific QuranComplex that a teacher supervises or belongs to (primary).
 */
export const getTeacherComplex = (
  teacher?: TeacherAccount | null,
  complexes: QuranComplex[] = [],
  halaqahs: Halaqah[] = [],
  allTeachers: TeacherAccount[] = []
): QuranComplex | null => {
  const all = getTeacherAllComplexes(teacher, allTeachers, complexes, halaqahs);
  return all.length > 0 ? all[0] : null;
};

/**
 * Resolves halaqahs belonging to a teacher inside a specific complex.
 */
export const getTeacherHalaqahsInComplex = (
  teacher: TeacherAccount | null | undefined,
  complexId: string,
  halaqahs: Halaqah[],
  allTeachers: TeacherAccount[] = [],
  isSupervisorOfThisComplex: boolean = false
): Halaqah[] => {
  const complexHalaqahs = halaqahs.filter(h => {
    const cId = h.complexId || '';
    return cId === complexId;
  });

  if (isSupervisorOfThisComplex || !teacher) {
    return complexHalaqahs;
  }

  const teacherNameNorm = normalizeTeacherText(teacher.name);
  const teacherUserNorm = normalizeTeacherText(teacher.username);
  const matchingAccounts = allTeachers.filter(t => isSameTeacher(teacher, t));
  const matchingIds = new Set<string>(matchingAccounts.map(t => t.id));
  matchingIds.add(teacher.id);

  return complexHalaqahs.filter(h => {
    if (h.teacherIds && h.teacherIds.some(id => matchingIds.has(id))) return true;
    if (h.primaryTeacherName) {
      const primNorm = normalizeTeacherText(h.primaryTeacherName);
      if (primNorm === teacherNameNorm || primNorm === teacherUserNorm) return true;
    }
    if (h.teacherNames && h.teacherNames.some(tn => {
      const norm = normalizeTeacherText(tn);
      return norm === teacherNameNorm || norm === teacherUserNorm;
    })) {
      return true;
    }
    return false;
  });
};

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  studentId?: string;
  phone: string;
  createdAt: string;
}

export type StudentLevel = 'ضعيف' | 'متوسط' | 'قوي';

export interface QuranRecitationItem {
  id: string;
  type: string; // e.g. "حفظ جديد" | "مراجعة صغرى" | "مراجعة كبرى" | "مراجعة تراكمية" | "تثبيت مصحف" | "اختبار مرحلي" | "سورة مخصصة"
  surahNumber: number; // Start surah number (1-114)
  surahName: string;   // Start surah name
  fromAyah: number;    // Start ayah
  toSurahNumber?: number; // End surah number (1-114) - if reciting across multiple surahs
  toSurahName?: string;   // End surah name
  toAyah: number;      // End ayah
  isFullSurah?: boolean;
  notes?: string;
  didNotRecite?: boolean; // خيار لم يُسمّع
  didNotReciteReason?: string; // سبب عدم التسميع (لم يحفظ، غياب، أو سبب مخصص من المعلم)
}

export interface DailyAssignment {
  newMemorization: string; // الحفظ الجديد المقرر
  review: string; // ورد المراجعة المقرر
  suggestedSheikh: string; // الشيخ المقترح للاستماع
  tajweedFocus?: string; // تركيز التجويد
  dailyNote: string; // توجيه المعلم المنزلي
  // Detailed items
  newItem?: QuranRecitationItem;
  reviewItem?: QuranRecitationItem;
  reviewItems?: QuranRecitationItem[];
}

export interface StudentAIPlan {
  roadmapSummary: string;
  currentDailyAssignment: DailyAssignment;
  difficultyAdjustment: string;
  estimatedDaysToFinishJuz: number;
  lastUpdated: string;
}

export interface Student {
  id: string;
  name: string;
  password: string;
  phone: string;
  age: number;
  parentName: string;
  parentPhones: string[];
  currentSurah: number; // 1 - 114
  currentSurahName: string;
  currentAyah: number;
  dailyNewTarget: string;
  dailyReviewTarget: string;
  level: StudentLevel;
  aiPlan?: StudentAIPlan;
  persistentReviewItems?: QuranRecitationItem[]; // بنود المراجعة والتراكمي والاختبار المحفوظة دائماً للطالب
  notes?: string;
  halaqahId?: string; // ID of the halaqah this student belongs to
  halaqahName?: string; // Cached display name of halaqah
  googleEmail?: string | null; // بريد حساب Google المرتبط بالطالب
  googleUid?: string | null; // معرف Google UID المرتبط
  googleName?: string | null; // اسم الحساب في Google
  googlePhotoUrl?: string | null; // صورة الحساب في Google
  isGoogleLinked?: boolean; // هل حساب الطالب موثق ومربوط بـ Google
  completedNewPages?: number[]; // الأوجه المكتملة في الحفظ الجديد (5 نقاط لكل وجه)
  completedReviewPages?: number[]; // الأوجه المكتملة في المراجعة (نقطة واحدة لكل وجه)
  totalPagePoints?: number; // إجمالي نقاط الأوجه المكتملة
  listeningPoints?: number; // نقاط إتمام واجبات الاستماع
  points?: number; // إجمالي النقاط الكلي للطالب
  createdAt: string;
}

export type AttendanceStatus = 'حاضر' | 'غائب' | 'متأخر' | 'معتذر';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  status: AttendanceStatus;
  note?: string;
  savedAt: string;
}

export type CriteriaType = 'stars' | 'score' | 'options' | 'text';

export interface EvaluationCriteria {
  id: string;
  name: string; // e.g. "حفظ", "مراجعة", "تجويد", "أخلاق وسلوك"
  type: CriteriaType;
  maxScore?: number;
  options?: string[];
  isDefault?: boolean;
}

export interface StudentEvaluation {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  criteriaValues: Record<string, any>;
  recitationDetails: {
    // Today's recitation (ما تم تسميعه اليوم)
    newMemorizationAchieved: string;
    reviewAchieved: string;
    teacherNotes: string;
    todayNewItem?: QuranRecitationItem;
    todayReviewItems?: QuranRecitationItem[];
    // Tomorrow's required assignment (مقرر الغد الذي حدده المعلم)
    tomorrowNewItem?: QuranRecitationItem;
    tomorrowReviewItem?: QuranRecitationItem;
    tomorrowReviewItems?: QuranRecitationItem[];
    tomorrowSuggestedSheikh?: string;
    tomorrowDailyNote?: string;
    tomorrowListeningAssignment?: {
      surahNumber: number;
      surahName: string;
      requiredListeningCount: number;
      youtubeUrl?: string;
      youtubeVideoId?: string;
    };
    pagesCompletedToday?: number[];
    pointsEarnedToday?: number;
  };
  aiFeedback?: {
    studentProgressStatus: 'متقدم' | 'منتظم' | 'متأخر' | 'يحتاج مساعدة';
    analysis: string;
    nextDayPlan: DailyAssignment;
    reasoning: string;
  };
  evaluatedAt: string;
}

export interface AppSettings {
  allowStudentRegistration: boolean;
  workDaysPerWeek: number;
  workDaysNames: string[];
  halaqahName: string;
  teacherName: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionTaken?: string;
}

export type ViolationSeverity = 'تنبيه' | 'بسيطة' | 'متوسطة' | 'جسيمة';

export interface BehaviorViolation {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  time?: string;
  violationType: string;
  severity: ViolationSeverity;
  description: string;
  actionTaken: string;
  pointsDeducted?: number;
  status: 'تم الإشعار' | 'قيد المتابعة' | 'تم التوجيه والمعالجة';
  parentNotified: boolean;
  parentNotificationDate?: string;
  parentNotificationPhone?: string;
  messageText?: string;
  teacherName?: string;
  showInPortal?: boolean;
  createdAt: string;
}

export interface FullBackupData {
  version: string;
  exportDate: string;
  complexes?: QuranComplex[];
  students: Student[];
  attendance: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  evaluationCriteria: EvaluationCriteria[];
  settings: AppSettings;
  chatMessages: ChatMessage[];
  userAccounts: UserAccount[];
  teachers?: TeacherAccount[];
  halaqahs?: Halaqah[];
  violations?: BehaviorViolation[];
  exams?: Exam[];
  submissions?: ExamSubmission[];
  leaderboardSettings?: LeaderboardSettings;
  googleOAuth?: GoogleOAuthConfig;
  recordings?: SurahRecording[];
  recordingsConfig?: RecordingsConfig;
  listeningLogs?: StudentListeningLog[];
}

export interface ComplexBackupData {
  version: string;
  exportDate: string;
  complex: QuranComplex;
  halaqahs: Halaqah[];
  students: Student[];
  attendance: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  violations?: BehaviorViolation[];
  exams?: Exam[];
}

export type ExamQuestionType = 'multiple_choice' | 'true_false' | 'essay' | 'short_answer';

export interface ExamQuestion {
  id: string;
  title: string; // نص السؤال
  type: ExamQuestionType;
  options?: string[]; // خيارات الإجابة
  correctAnswer?: string | number; // الإجابة الصحيحة للتقييم التلقائي
  points: number; // درجة / نقاط السؤال
  explanation?: string; // توضيح أو إجابة نموذجية
  timeLimitSeconds?: number; // وقت السؤال المخصص بالثواني (اختياري)
}

export type ExamScheduleType = 'now' | 'scheduled';
export type ExamGradeVisibility = 'immediate' | 'after_deadline' | 'manual';
export type ExamTimeLimitMode = 'none' | 'total' | 'per_question';
export type ExamDeliveryMode = 'platform' | 'google_form';

export interface Exam {
  id: string;
  title: string; // اسم الاختبار (إلزامي)
  description?: string; // وصف أو تعليمات الاختبار
  deliveryMode?: ExamDeliveryMode; // 'platform' (داخل المنصة) | 'google_form' (عبر نموذج Google Forms)
  autoCreateGoogleForm?: boolean; // هل يتم إنشاء وتوليد نموذج جوجل فورم وجدول الشيت تلقائياً عند الحفظ
  scheduleType: ExamScheduleType; // فوري أو مجدول
  startDate?: string; // تاريخ ووقت الظهور
  hasDeadline: boolean; // هل له موعد انتهاء أم للأبد
  deadlineDate?: string; // موعد الانتهاء
  attemptLimitType: 'unlimited' | 'limited'; // عدد المحاولات
  maxAttempts?: number; // عدد المحاولات المسموحة (إذا كانت محددة)
  timeLimitMode?: ExamTimeLimitMode; // نمط المؤقت الزمني: بدون / وقت كلي للاختبار / وقت مخصص لكل سؤال
  totalTimeMinutes?: number; // إجمالي وقت الاختبار بالدقائق (إذا تم اختيار وقت كلي)
  questionTimeSeconds?: number; // الوقت الافتراضي لكل سؤال بالثواني (إذا تم اختيار وقت لكل سؤال)
  gradeVisibility: ExamGradeVisibility; // ظهور النتيجة: فوري / بعد انتهاء الموعد / بعد تصحيح المعلم
  grantsLeaderboardPoints: boolean; // هل يمنح نقاطاً للوحة الشرف
  totalPoints: number; // إجمالي نقاط ودرجات الاختبار
  targetHalaqat: string[]; // ['all'] أو مصفوفة معرفات الحلقات المستهدفة
  questions: ExamQuestion[]; // قائمة الأسئلة
  googleFormId?: string; // معرف Google Form المرتبط
  googleFormUrl?: string; // رابط النموذج للتعديل
  googleFormResponderUrl?: string; // رابط النموذج للطلاب
  googleSpreadsheetId?: string; // معرف Google Sheets المرتبط
  googleSpreadsheetUrl?: string; // رابط جدول الردود
  googleFormNameEntryId?: string; // معرف حقل اسم الطالب في Google Form لتعبئته تلقائياً
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExamSubmissionAnswer {
  questionId: string;
  questionTitle: string;
  questionType: ExamQuestionType;
  studentAnswer: string;
  isAutoGraded: boolean;
  isCorrect?: boolean;
  pointsEarned: number;
  maxPoints: number;
  teacherFeedback?: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentGoogleEmail?: string;
  googleEmail?: string;
  googleUid?: string;
  halaqahId: string;
  halaqahName: string;
  attemptNumber: number; // رقم المحاولة
  answers: ExamSubmissionAnswer[];
  totalScoreEarned: number;
  maxPossibleScore: number;
  percentage: number;
  pointsGrantedForLeaderboard: number;
  status: 'completed' | 'needs_grading'; // needs_grading if essay questions are pending
  submittedAt: string;
  gradedAt?: string;
  gradedByTeacherName?: string;
  teacherGeneralFeedback?: string;
}

export type LeaderboardScope = 'per_halaqah' | 'all_unified' | 'custom_groups';

export interface LeaderboardGroup {
  id: string;
  name: string;
  halaqahIds: string[];
}

export interface LeaderboardSettings {
  scope: LeaderboardScope;
  customGroups?: LeaderboardGroup[];
  includeExamPoints: boolean;
  includeEvaluationScores: boolean;
  updatedAt: string;
}

export interface GoogleOAuthConfig {
  connectedEmail?: string;
  connectedAt?: string;
  isLinked: boolean;
  lastSyncAt?: string;
  accessToken?: string;
  savedInCloud?: boolean;
}

export interface SurahRecordingSegment {
  ayahNumber: number;
  ayahText?: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  formattedStart?: string;
  formattedEnd?: string;
}

export interface SurahRecording {
  id: string;
  surahNumber: number;
  surahName: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  title?: string;
  reciterName?: string;
  status: 'processing' | 'ready';
  segments: SurahRecordingSegment[];
  defaultListeningCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecordingsConfig {
  isPublishedToStudents: boolean;
  updatedAt: string;
}

export interface StudentListeningLog {
  id: string;
  studentId: string;
  studentName: string;
  halaqahId?: string;
  surahNumber: number;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  targetCount: number;
  completedCount: number;
  isFullyCompleted: boolean;
  date: string; // YYYY-MM-DD
  timestamp: string;
}

/**
 * التحقق الصارم من الاسم الثلاثي (الاسم الأول واسم الأب واسم الجد/العائلة)
 * إلزامي لجميع الطلاب والمعلمين والمشرفين
 */
export function getThreePartNameValidation(
  rawName?: string | null,
  roleLabel: 'طالب' | 'معلم' | 'مشرف' | 'شخص' = 'شخص'
): { isValid: boolean; partsCount: number; message?: string } {
  const trimmed = (rawName || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      partsCount: 0,
      message: `اسم ال${roleLabel} إلزامي ولا يمكن تركه فارغاً.`
    };
  }

  // Split by whitespace
  const rawTokens = trimmed.split(/\s+/).filter(Boolean);

  if (rawTokens.length < 3) {
    return {
      isValid: false,
      partsCount: rawTokens.length,
      message: `الاسم الثلاثي إلزامي: يجب كتابة اسم ال${roleLabel} كاملاً من 3 مقاطع على الأقل (الاسم الأول، اسم الأب، واسم العائلة/الجد، مثلاً: محمد أحمد علي أو عبد الله بن راشد القحطاني).`
    };
  }

  // Check valid letters (Arabic or Latin letters, apostrophe, dash)
  const validLettersRegex = /^[\p{L}\p{M}'-]+$/u;
  const invalidTokens = rawTokens.filter(t => !validLettersRegex.test(t));
  if (invalidTokens.length > 0) {
    return {
      isValid: false,
      partsCount: rawTokens.length - invalidTokens.length,
      message: `يرجى إدخال اسم ال${roleLabel} بالحروف الأبجدية فقط وتجنب الأرقام والرموز الخاصة.`
    };
  }

  // Disallow single-character abbreviations
  const shortTokens = rawTokens.filter(t => t.length < 2 && t !== 'و');
  if (shortTokens.length > 0) {
    return {
      isValid: false,
      partsCount: 0,
      message: `يرجى كتابة مقاطع الاسم كاملة وتجنب الاختصارات بحرف واحد.`
    };
  }

  // Common Arabic prefixes and connectors
  const prefixes = new Set([
    'عبد', 'ابو', 'أبو', 'ابي', 'أبي', 'ابا', 'أبا', 'ام', 'أم',
    'آل', 'ذو', 'ذا', 'ذي', 'بدر', 'نور', 'شمس', 'علاء', 'سيف',
    'تقي', 'حسام', 'بهاء', 'ضياء', 'عماد', 'كمال', 'جمال', 'صلاح', 'سراج', 'نجم', 'أمة', 'امه'
  ]);
  const connectors = new Set(['بن', 'ابن', 'بنت', 'ولد']);
  const religiousSuffixes = new Set(['الله', 'الرحمن', 'الدين', 'الإسلام', 'الاسلام', 'الحق']);

  const groupedParts: string[] = [];
  for (let i = 0; i < rawTokens.length; i++) {
    const current = rawTokens[i];
    const next = rawTokens[i + 1];

    if (connectors.has(current)) {
      if (next) {
        groupedParts.push(`${current} ${next}`);
        i++;
      }
      continue;
    }

    if (prefixes.has(current) && next) {
      groupedParts.push(`${current} ${next}`);
      i++;
      continue;
    }

    if (next && religiousSuffixes.has(next)) {
      groupedParts.push(`${current} ${next}`);
      i++;
      continue;
    }

    groupedParts.push(current);
  }

  if (groupedParts.length < 3) {
    return {
      isValid: false,
      partsCount: groupedParts.length,
      message: `الاسم المدخل ثنائي فقط ("${trimmed}"). يلزم إدخال اسم ال${roleLabel} الثلاثي كاملاً بإضافة اسم الجد أو العائلة/القبيلة.`
    };
  }

  return { isValid: true, partsCount: groupedParts.length };
}

export function isValidThreePartName(
  rawName?: string | null,
  roleLabel: 'طالب' | 'معلم' | 'مشرف' | 'شخص' = 'شخص'
): boolean {
  return getThreePartNameValidation(rawName, roleLabel).isValid;
}

