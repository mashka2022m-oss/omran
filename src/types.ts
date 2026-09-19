export type UserRole = 'admin' | 'student';

export interface Halaqah {
  id: string;
  name: string; // e.g. "حلقة الصحابي الزبير بن العوام رضي الله عنه"
  description?: string;
  primaryTeacherName?: string;
  teacherIds?: string[]; // Teacher IDs linked to this halaqah
  teacherNames?: string[]; // Cached teacher names
  createdAt: string;
  isDefault?: boolean;
}

export interface TeacherAccount {
  id: string;
  name: string; // e.g. "الشيخ محمد منتصر", "الشيخ عبد الله بن فهد"
  username: string; // username used to log in
  password?: string; // password used to log in
  phone: string; // teacher's phone number
  title?: string; // e.g. "المعلم الأساسي", "معلم شريك / ثانٍ", "محفظ ومساعد"
  isPrimary?: boolean;
  role?: 'teacher' | 'supervisor'; // رتبة المعلم: معلم عادي أو مشرف
  halaqahId?: string; // Legacy single halaqah id
  halaqahName?: string; // Legacy single halaqah name
  halaqahIds?: string[]; // All halaqahs this teacher teaches (supports multiple halaqahs)
  halaqahNames?: string[]; // Display names of those halaqahs
  googleEmail?: string; // بريد حساب Google المرتبط بالمعلم
  googleUid?: string; // معرف Google UID
  googleName?: string; // اسم الحساب في Google
  googlePhotoUrl?: string; // صورة الحساب في Google
  isGoogleLinked?: boolean; // هل حساب المعلم موثق ومربوط بـ Google للتسجيل السريع
  createdAt: string;
}

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
  googleEmail?: string; // بريد حساب Google المرتبط بالطالب
  googleUid?: string; // معرف Google UID المرتبط
  googleName?: string; // اسم الحساب في Google
  googlePhotoUrl?: string; // صورة الحساب في Google
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

