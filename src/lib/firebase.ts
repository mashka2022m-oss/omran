import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Student,
  AttendanceRecord,
  StudentEvaluation,
  EvaluationCriteria,
  AppSettings,
  ChatMessage,
  UserAccount,
  TeacherAccount,
  BehaviorViolation,
  FullBackupData,
  Halaqah,
  Exam,
  ExamQuestion,
  ExamSubmission,
  LeaderboardSettings,
  GoogleOAuthConfig,
  SurahRecording,
  RecordingsConfig,
  StudentListeningLog
} from '../types';

export { firebaseConfig };

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

export const DEFAULT_RECORDINGS_CONFIG: RecordingsConfig = {
  isPublishedToStudents: false,
  updatedAt: new Date().toISOString()
};

export const DEFAULT_LEADERBOARD_SETTINGS: LeaderboardSettings = {
  scope: 'all_unified',
  includeExamPoints: true,
  includeEvaluationScores: true,
  updatedAt: new Date().toISOString()
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Initial Default Evaluation Criteria
export const DEFAULT_CRITERIA: EvaluationCriteria[] = [
  {
    id: 'crit-memorization',
    name: 'حفظ الورد الجديد',
    type: 'score',
    maxScore: 10,
    isDefault: true
  },
  {
    id: 'crit-review',
    name: 'مراجعة الماضي',
    type: 'score',
    maxScore: 10,
    isDefault: true
  },
  {
    id: 'crit-tajweed',
    name: 'التجويد ومخارج الحروف',
    type: 'stars',
    isDefault: false
  },
  {
    id: 'crit-behavior',
    name: 'الآداب وحسن الاستماع',
    type: 'options',
    options: ['متميز ومؤدب', 'جيد ومتعاون', 'يحتاج إلى تنبيه'],
    isDefault: false
  }
];

export const DEFAULT_HALAQAHS: Halaqah[] = [
  {
    id: 'halaqah-zubeir',
    name: 'حلقة الزبير بن العوام رضي الله عنه',
    description: 'الحلقة الأساسية التابعة لمنظومة عمران',
    primaryTeacherName: 'الشيخ محمد منتصر',
    createdAt: new Date().toISOString(),
    isDefault: true
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  allowStudentRegistration: true,
  workDaysPerWeek: 5,
  workDaysNames: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
  halaqahName: 'حلقة الزبير بن العوام رضي الله عنه',
  teacherName: 'الشيخ محمد منتصر'
};

// Initial Registered Teachers (Default Teacher Accounts)
export const INITIAL_TEACHERS: TeacherAccount[] = [
  {
    id: 'teacher-1',
    name: 'الشيخ محمد منتصر',
    username: 'محمد منتصر',
    password: '123',
    phone: '0500000000',
    title: 'المشرف الأساسي والمعلم الأول',
    isPrimary: true,
    halaqahId: 'halaqah-zubeir',
    halaqahName: 'حلقة الزبير بن العوام رضي الله عنه',
    createdAt: new Date().toISOString()
  }
];

// Initial Seed Students for demonstration
export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1',
    name: 'عبد الرحمن أحمد السعيد',
    password: '123',
    phone: '0501234567',
    age: 12,
    parentName: 'أحمد السعيد',
    parentPhones: ['966501234567', '966551234567'],
    currentSurah: 2,
    currentSurahName: 'البقرة',
    currentAyah: 45,
    dailyNewTarget: 'وجه كامل',
    dailyReviewTarget: 'نصف جزء',
    level: 'قوي',
    halaqahId: 'halaqah-zubeir',
    halaqahName: 'حلقة الزبير بن العوام رضي الله عنه',
    aiPlan: {
      roadmapSummary: 'خطة حفظ سورة البقرة بمعدل وجه يومياً مع مراجعة نصف جزء من جزء عم وتبارك.',
      currentDailyAssignment: {
        newMemorization: 'سورة البقرة: الآيات (46 - 52)',
        review: 'سورة النبأ وسورة النازعات كاملتين',
        suggestedSheikh: 'الشيخ محمود خليل الحصري (المصحف المعلم)',
        tajweedFocus: 'تطبيق أحكام النون الساكنة والتنوين (الإدغام بغنة)',
        dailyNote: 'كرر كل آية 5 مرات بالربط مع الآية التي قبلها قبل التسميع على المعلم.'
      },
      difficultyAdjustment: 'وتيرة ممتازة تناسب قدرات الطالب العالية',
      estimatedDaysToFinishJuz: 22,
      lastUpdated: new Date().toISOString()
    },
    notes: 'طالب مجتهد وحافظ متميز',
    createdAt: new Date().toISOString()
  },
  {
    id: 'std-2',
    name: 'يوسف عمر الكردي',
    password: '123',
    phone: '0507654321',
    age: 10,
    parentName: 'عمر الكردي',
    parentPhones: ['966507654321'],
    currentSurah: 78,
    currentSurahName: 'النبأ',
    currentAyah: 16,
    dailyNewTarget: 'نصف وجه',
    dailyReviewTarget: 'سورة واحدة',
    level: 'متوسط',
    halaqahId: 'halaqah-zubeir',
    halaqahName: 'حلقة الزبير بن العوام رضي الله عنه',
    aiPlan: {
      roadmapSummary: 'إتمام جزء عم خلال 3 أسابيع بمعدل 6 إلى 8 آيات يومياً مع تكرار الاستماع.',
      currentDailyAssignment: {
        newMemorization: 'سورة النبأ: الآيات (17 - 30)',
        review: 'سورة الإخلاص والفلق والناس وقريش',
        suggestedSheikh: 'الشيخ محمد صديق المنشاوي (المعلم)',
        tajweedFocus: 'قلقلة حروف (قطب جد) والمد المتصل',
        dailyNote: 'استمع للشيخ المنشاوي 3 مرات وركز على نطق الحركات بدقة.'
      },
      difficultyAdjustment: 'خطة متوازنة لتعزيز الثقة والتجويد',
      estimatedDaysToFinishJuz: 18,
      lastUpdated: new Date().toISOString()
    },
    notes: 'يحتاج تركيز على المدود',
    createdAt: new Date().toISOString()
  },
  {
    id: 'std-3',
    name: 'بلال خالد القحطاني',
    password: '123',
    phone: '0509876543',
    age: 8,
    parentName: 'خالد القحطاني',
    parentPhones: ['966509876543'],
    currentSurah: 93,
    currentSurahName: 'الضحى',
    currentAyah: 1,
    dailyNewTarget: '3 آيات',
    dailyReviewTarget: 'سورة قصيرة',
    level: 'ضعيف',
    halaqahId: 'halaqah-zubeir',
    halaqahName: 'حلقة الزبير بن العوام رضي الله عنه',
    aiPlan: {
      roadmapSummary: 'خطة تشجيعية وتيسيرية لقصار السور بمعدل 3 آيات يومياً مع تقنية التكرار المرحلي.',
      currentDailyAssignment: {
        newMemorization: 'سورة الضحى كاملة (11 آية)',
        review: 'سورة الشرح والتين والعلق',
        suggestedSheikh: 'الشيخ مشاري بن راشد العفاسي',
        tajweedFocus: 'مخارج الحروف الأساسية والوضوح',
        dailyNote: 'قسّم السورة إلى مقطعين، 5 آيات صباحاً و6 آيات مساءً مع الوالد.'
      },
      difficultyAdjustment: 'تم تيسير الورد وتقسيمه ليناسب عمر الطالب وقدرته',
      estimatedDaysToFinishJuz: 45,
      lastUpdated: new Date().toISOString()
    },
    notes: 'يحتاج تشجيع ومكافآت مستمرة',
    createdAt: new Date().toISOString()
  }
];

// Initial Sample Behavior Violations
export const INITIAL_VIOLATIONS: BehaviorViolation[] = [
  {
    id: 'viol-sample-1',
    studentId: 'std-3',
    studentName: 'عبدالرحمن الدوسري',
    date: new Date().toISOString().split('T')[0],
    time: '16:45',
    violationType: 'الكلام الجانبي والتشويش أثناء التلاوة',
    severity: 'تنبيه',
    description: 'التحدث مع الزملاء أثناء ورد التسميع بالحلقة وتشتيت انتباه المجموعة.',
    actionTaken: 'تنبيه شفهي وتوجيه تربوي مع تذكير بآداب مجلس القرآن الكريم.',
    pointsDeducted: 1,
    status: 'تم التوجيه والمعالجة',
    parentNotified: true,
    parentNotificationDate: new Date().toISOString().split('T')[0],
    parentNotificationPhone: '0503344556',
    messageText: 'السلام عليكم ورحمة الله وبركاته.. ولي أمر الطالب الفاضل عبدالرحمن حفظه الله، نحيطكم علماً بأنه تم توجيه الطالب اليوم برفق حول التحدث الجانبي أثناء التسميع، ونشكر كريم تعاونكم في حثه على أدب مجالس القرآن الكريم، بارك الله فيكم ونفع به.',
    teacherName: 'محمد منتصر',
    showInPortal: true,
    createdAt: new Date().toISOString()
  }
];

// Initial Rich Seed Quran Exams with Questions, Timers, and Answers
export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-sample-tajweed-1',
    title: 'اختبار أحكام النون الساكنة والتنوين والمدود القرآنية',
    description: 'اختبار تقييمي شامل وممتع لأحكام التجويد الأساسية: الإظهار، الإدغام، الإقلاب، الإخفاء، والمد المتصل والمنفصل.',
    scheduleType: 'now',
    startDate: new Date().toISOString(),
    hasDeadline: false,
    attemptLimitType: 'unlimited',
    maxAttempts: 3,
    timeLimitMode: 'total',
    totalTimeMinutes: 10,
    questionTimeSeconds: 30,
    gradeVisibility: 'immediate',
    grantsLeaderboardPoints: true,
    totalPoints: 25,
    targetHalaqat: ['all'],
    questions: [
      {
        id: 'q-tajweed-1',
        title: 'ما هو الحكم التجويدي في قوله تعالى: (مِن بَعْدِ) ؟',
        type: 'multiple_choice',
        options: ['إقلاب', 'إظهار حلقي', 'إدغام بغنة', 'إخفاء حقيقي'],
        correctAnswer: 'إقلاب',
        points: 5,
        explanation: 'حكم النون الساكنة إذا جاء بعدها حرف الباء هو الإقلاب، حيث تُقلب النون ميماً مخفاة بغنة.'
      },
      {
        id: 'q-tajweed-2',
        title: 'حروف الإظهار الحلقي مجموعة في أوائل كلمات: (أخي هاك علماً حازه غير خاسر).',
        type: 'true_false',
        options: ['صح', 'خطأ'],
        correctAnswer: 'صح',
        points: 5,
        explanation: 'نعم، حروف الإظهار الحلقي الستة هي: الهمزة، والهاء، والعين، والحاء، والغين، والخاء.'
      },
      {
        id: 'q-tajweed-3',
        title: 'ما نوع المد في قوله تعالى: (جَآءَ) ؟',
        type: 'multiple_choice',
        options: ['مد متصل واجب', 'مد منفصل جائز', 'مد لازم كلمي', 'مد عارض للسكون'],
        correctAnswer: 'مد متصل واجب',
        points: 5,
        explanation: 'المد المتصل هو أن يجتمع حرف المد والهمزة في كلمة واحدة، وحكمه الوجوب ويمد 4 أو 5 حركات.'
      },
      {
        id: 'q-tajweed-4',
        title: 'أي من الحروف التالية يُعد من حروف الإدغام بغير غنة؟',
        type: 'multiple_choice',
        options: ['الراء واللام (ر، ل)', 'الياء والنون (ي، ن)', 'الميم والواو (م، و)', 'الكاف والقاف (ك، ق)'],
        correctAnswer: 'الراء واللام (ر، ل)',
        points: 5,
        explanation: 'حروف الإدغام بغير غنة هما اللام والراء فقط (ل، ر).'
      },
      {
        id: 'q-tajweed-5',
        title: 'في قوله تعالى: (أَنفُسَكُمْ) الحكم التجويدي للنون الساكنة هو الإخفاء الحقيقي عند حرف الفاء.',
        type: 'true_false',
        options: ['صح', 'خطأ'],
        correctAnswer: 'صح',
        points: 5,
        explanation: 'حرف الفاء من حروف الإخفاء الحقيقي الـ 15، فينطق بالنون بصفة بين الإظهار والإدغام مع بقاء الغنة.'
      }
    ],
    createdById: 'teacher-1',
    createdByName: 'الشيخ محمد منتصر',
    createdAt: new Date().toISOString()
  },
  {
    id: 'exam-sample-fatihah-juzamma',
    title: 'اختبار معاني وتفسير سورة الفاتحة وقصار السور',
    description: 'اختبار تدبر وفهم معاني الآيات العظيمة في سورة الفاتحة وقصار سور جزء عم المبارك.',
    scheduleType: 'now',
    startDate: new Date().toISOString(),
    hasDeadline: false,
    attemptLimitType: 'unlimited',
    maxAttempts: 2,
    timeLimitMode: 'total',
    totalTimeMinutes: 8,
    gradeVisibility: 'immediate',
    grantsLeaderboardPoints: true,
    totalPoints: 20,
    targetHalaqat: ['all'],
    questions: [
      {
        id: 'q-fatihah-1',
        title: 'ما معنى قوله تعالى في سورة الفاتحة: (الصِّرَاطَ الْمُسْتَقِيمَ) ؟',
        type: 'multiple_choice',
        options: ['طريق الإسلام والحق الواضح الموصل لرضوان الله', 'طريق التجارة والرزق', 'طريق السفر بين البلدان', 'أبواب الجنة فقط'],
        correctAnswer: 'طريق الإسلام والحق الواضح الموصل لرضوان الله',
        points: 5,
        explanation: 'الصراط المستقيم هو دين الإسلام والتمسك بكتاب الله وسنة رسوله صلى الله عليه وسلم.'
      },
      {
        id: 'q-fatihah-2',
        title: 'سورة الإخلاص تعدل ثلث القرآن الكريم في الأجر والفضل.',
        type: 'true_false',
        options: ['صح', 'خطأ'],
        correctAnswer: 'صح',
        points: 5,
        explanation: 'ثبت في الصحيحين عن النبي صلى الله عليه وسلم أن قل هو الله أحد تعدل ثلث القرآن لاشتمالها على توحيد الله وتمجيده.'
      },
      {
        id: 'q-fatihah-3',
        title: 'في سورة الفلق، ما معنى قوله تعالى: (وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ) ؟',
        type: 'multiple_choice',
        options: ['من شر الليل المظلم إذا دخل واشتد ظلامه', 'من شر الرياح الشديدة', 'من شر الجبال العالية', 'من شر حرارة الشمس'],
        correctAnswer: 'من شر الليل المظلم إذا دخل واشتد ظلامه',
        points: 5,
        explanation: 'الغاسق هو الليل، وإذا وقب أي دخل واشتدت ظلمته وتنتشر فيه الهوام والشرور.'
      },
      {
        id: 'q-fatihah-4',
        title: 'في سورة الكوثر، المقصود بـ (الْكَوْثَرَ) هو الخير الكثير ومنه نهر في الجنة أعطاه الله لنبيه ﷺ.',
        type: 'true_false',
        options: ['صح', 'خطأ'],
        correctAnswer: 'صح',
        points: 5,
        explanation: 'الكوثر هو الخير العظيم والوفير في الدنيا والآخرة، ومنه النهر العظيم في الجنة.'
      }
    ],
    createdById: 'teacher-1',
    createdByName: 'الشيخ محمد منتصر',
    createdAt: new Date().toISOString()
  }
];

// Clear any legacy local storage data to ensure pure Firebase Firestore operation
export function clearLegacyLocalStorage() {
  try {
    const keysToRemove = [
      'omran_students_data',
      'omran_attendance_data',
      'omran_evaluations_data',
      'omran_criteria_data',
      'omran_settings_data',
      'omran_chats_data',
      'omran_teachers_data',
      'omran_violations_data',
      'omran_halaqahs_data',
      'omran_exams_data',
      'omran_submissions_data',
      'omran_leaderboard_data',
      'omran_google_tokens',
      'omran_google_config'
    ];
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }
  } catch (e) {
    // Ignore in case localStorage is disabled or restricted
  }
}

// Deep sanitize any object before sending to Firestore so no 'undefined' fields ever reach setDoc
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  return JSON.parse(JSON.stringify(obj, (_, v) => (v === undefined ? null : v)));
}

// Firestore Realtime Cloud Service (Direct Cloud-Only Architecture)
export class OmranDataService {
  // Check Connection and Seed initial data in Firestore if empty
  static async testConnection() {
    clearLegacyLocalStorage();
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'test/connection');
    }
    await this.seedInitialDataIfEmpty();
    return true;
  }

  // Seed baseline data directly into Firestore on first deployment
  static async seedInitialDataIfEmpty() {
    try {
      // 1. Halaqahs
      const halaqahSnap = await getDocs(collection(db, 'halaqahs'));
      if (halaqahSnap.empty) {
        for (const h of DEFAULT_HALAQAHS) {
          await setDoc(doc(db, 'halaqahs', h.id), h);
        }
      }

      // 2. Teachers
      const teachSnap = await getDocs(collection(db, 'teachers'));
      if (teachSnap.empty) {
        for (const t of INITIAL_TEACHERS) {
          await setDoc(doc(db, 'teachers', t.id), t);
        }
      }

      // 3. Students
      const snap = await getDocs(collection(db, 'students'));
      if (snap.empty) {
        for (const s of INITIAL_STUDENTS) {
          await setDoc(doc(db, 'students', s.id), s);
        }
      }

      // 4. Criteria
      const critSnap = await getDocs(collection(db, 'criteria'));
      if (critSnap.empty) {
        for (const c of DEFAULT_CRITERIA) {
          await setDoc(doc(db, 'criteria', c.id), c);
        }
      }

      // 5. Settings
      const setSnap = await getDoc(doc(db, 'settings', 'main'));
      if (!setSnap.exists()) {
        await setDoc(doc(db, 'settings', 'main'), DEFAULT_SETTINGS);
      } else {
        const currentSet = setSnap.data() as AppSettings;
        if (!currentSet.halaqahName || currentSet.halaqahName.includes('الشاطبي')) {
          const updatedSet: AppSettings = {
            ...currentSet,
            halaqahName: 'حلقات الصحابي الزبير بن العوام رضي الله عنه'
          };
          await setDoc(doc(db, 'settings', 'main'), updatedSet);
        }
      }

      // 6. Seed Quran Exams if empty
      const examSnap = await getDocs(collection(db, 'exams'));
      if (examSnap.empty) {
        for (const ex of INITIAL_EXAMS) {
          await setDoc(doc(db, 'exams', ex.id), ex);
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'seedInitialData');
    }
  }

  // Load Teachers directly from Firestore
  static async loadTeachers(): Promise<TeacherAccount[]> {
    try {
      const snap = await getDocs(collection(db, 'teachers'));
      const list: TeacherAccount[] = [];
      snap.forEach(d => list.push(d.data() as TeacherAccount));
      if (list.length === 0) {
        for (const t of INITIAL_TEACHERS) {
          await setDoc(doc(db, 'teachers', t.id), t);
        }
        return INITIAL_TEACHERS;
      }
      return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'teachers');
      return [];
    }
  }

  static async getTeachers(): Promise<TeacherAccount[]> {
    return this.loadTeachers();
  }

  // Save Teacher directly in Firestore
  static async saveTeacher(teacher: TeacherAccount): Promise<void> {
    try {
      const clean = cleanFirestoreData(teacher);
      await setDoc(doc(db, 'teachers', teacher.id), clean);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `teachers/${teacher.id}`);
      throw e;
    }
  }

  // Delete Teacher directly from Firestore
  static async deleteTeacher(teacherId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'teachers', teacherId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `teachers/${teacherId}`);
      throw e;
    }
  }

  // Load Halaqahs directly from Firestore
  static async loadHalaqahs(): Promise<Halaqah[]> {
    try {
      const snap = await getDocs(collection(db, 'halaqahs'));
      const list: Halaqah[] = [];
      snap.forEach(d => list.push(d.data() as Halaqah));
      if (list.length === 0) {
        for (const h of DEFAULT_HALAQAHS) {
          const cleanH = cleanFirestoreData(h);
          await setDoc(doc(db, 'halaqahs', h.id), cleanH);
        }
        return DEFAULT_HALAQAHS;
      }
      return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'halaqahs');
      return DEFAULT_HALAQAHS;
    }
  }

  // Save Halaqah directly in Firestore
  static async saveHalaqah(halaqah: Halaqah): Promise<void> {
    try {
      const clean = cleanFirestoreData(halaqah);
      await setDoc(doc(db, 'halaqahs', halaqah.id), clean);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `halaqahs/${halaqah.id}`);
      throw e;
    }
  }

  // Delete Halaqah directly from Firestore
  static async deleteHalaqah(halaqahId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'halaqahs', halaqahId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `halaqahs/${halaqahId}`);
      throw e;
    }
  }

  // Transfer Student to another Halaqah directly in Firestore (preserves full records)
  static async transferStudentToHalaqah(
    studentId: string,
    targetHalaqahId: string,
    targetHalaqahName: string
  ): Promise<Student | null> {
    try {
      const studentRef = doc(db, 'students', studentId);
      const studentSnap = await getDoc(studentRef);
      if (!studentSnap.exists()) return null;
      const data = studentSnap.data() as Student;
      const updatedStudent: Student = {
        ...data,
        halaqahId: targetHalaqahId,
        halaqahName: targetHalaqahName
      };
      await setDoc(studentRef, updatedStudent);
      return updatedStudent;
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `students/${studentId}`);
      throw e;
    }
  }

  // Transfer Multiple Students to another Halaqah directly in Firestore (batch transfer)
  static async transferMultipleStudentsToHalaqah(
    studentIds: string[],
    targetHalaqahId: string,
    targetHalaqahName: string
  ): Promise<void> {
    try {
      for (const sId of studentIds) {
        const studentRef = doc(db, 'students', sId);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          const data = studentSnap.data() as Student;
          const updatedStudent: Student = {
            ...data,
            halaqahId: targetHalaqahId,
            halaqahName: targetHalaqahName
          };
          await setDoc(studentRef, updatedStudent);
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `students/batch_transfer`);
      throw e;
    }
  }

  // Load Students directly from Firestore
  static async loadStudents(): Promise<Student[]> {
    try {
      const snap = await getDocs(collection(db, 'students'));
      const list: Student[] = [];
      snap.forEach(d => list.push(d.data() as Student));
      if (list.length === 0) {
        for (const s of INITIAL_STUDENTS) {
          await setDoc(doc(db, 'students', s.id), s);
        }
        return INITIAL_STUDENTS;
      }
      return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'students');
      return [];
    }
  }

  static async getStudents(): Promise<Student[]> {
    return this.loadStudents();
  }

  // Save Student directly in Firestore
  static async saveStudent(student: Student): Promise<void> {
    try {
      const clean = cleanFirestoreData(student);
      await setDoc(doc(db, 'students', student.id), clean);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `students/${student.id}`);
      throw e;
    }
  }

  // Delete Student directly from Firestore
  static async deleteStudent(studentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'students', studentId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `students/${studentId}`);
      throw e;
    }
  }

  // Load Attendance directly from Firestore
  static async loadAttendance(): Promise<AttendanceRecord[]> {
    try {
      const snap = await getDocs(collection(db, 'attendance'));
      const list: AttendanceRecord[] = [];
      snap.forEach(d => list.push(d.data() as AttendanceRecord));
      return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'attendance');
      return [];
    }
  }

  // Save Batch Attendance directly in Firestore
  static async saveAttendanceRecords(records: AttendanceRecord[]): Promise<void> {
    try {
      for (const rec of records) {
        await setDoc(doc(db, 'attendance', rec.id), rec);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'attendance');
      throw e;
    }
  }

  // Load Evaluations directly from Firestore
  static async loadEvaluations(): Promise<StudentEvaluation[]> {
    try {
      const snap = await getDocs(collection(db, 'evaluations'));
      const list: StudentEvaluation[] = [];
      snap.forEach(d => list.push(d.data() as StudentEvaluation));
      return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'evaluations');
      return [];
    }
  }

  // Save Evaluation directly in Firestore
  static async saveEvaluation(evaluation: StudentEvaluation): Promise<void> {
    try {
      await setDoc(doc(db, 'evaluations', evaluation.id), evaluation);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `evaluations/${evaluation.id}`);
      throw e;
    }
  }

  // Load Criteria directly from Firestore
  static async loadCriteria(): Promise<EvaluationCriteria[]> {
    try {
      const snap = await getDocs(collection(db, 'criteria'));
      const list: EvaluationCriteria[] = [];
      snap.forEach(d => list.push(d.data() as EvaluationCriteria));
      if (list.length === 0) {
        for (const c of DEFAULT_CRITERIA) {
          await setDoc(doc(db, 'criteria', c.id), c);
        }
        return DEFAULT_CRITERIA;
      }
      return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'criteria');
      return DEFAULT_CRITERIA;
    }
  }

  // Save Criteria List directly in Firestore
  static async saveCriteriaList(list: EvaluationCriteria[]): Promise<void> {
    try {
      for (const item of list) {
        await setDoc(doc(db, 'criteria', item.id), item);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'criteria');
      throw e;
    }
  }

  // Delete Criteria directly from Firestore
  static async deleteCriteria(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'criteria', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `criteria/${id}`);
      throw e;
    }
  }

  // Load Settings directly from Firestore
  static async loadSettings(): Promise<AppSettings> {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'main'));
      if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
      }
      await setDoc(doc(db, 'settings', 'main'), DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'settings/main');
      return DEFAULT_SETTINGS;
    }
  }

  // Save Settings directly in Firestore
  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await setDoc(doc(db, 'settings', 'main'), settings);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/main');
      throw e;
    }
  }

  // Load Chats directly from Firestore
  static async loadChats(): Promise<ChatMessage[]> {
    try {
      const snap = await getDocs(collection(db, 'chats'));
      const list: ChatMessage[] = [];
      snap.forEach(d => list.push(d.data() as ChatMessage));
      list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'chats');
      return [];
    }
  }

  // Save Chat Message directly in Firestore
  static async saveChatMessage(msg: ChatMessage): Promise<void> {
    try {
      await setDoc(doc(db, 'chats', msg.id), msg);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `chats/${msg.id}`);
      throw e;
    }
  }

  // Clear Chats directly from Firestore
  static async clearChats(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'chats'));
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'chats');
      throw e;
    }
  }

  // Load Behavior Violations directly from Firestore
  static async loadViolations(): Promise<BehaviorViolation[]> {
    try {
      const snap = await getDocs(collection(db, 'violations'));
      const list: BehaviorViolation[] = [];
      snap.forEach(d => list.push(d.data() as BehaviorViolation));
      list.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'violations');
      return [];
    }
  }

  // Save Behavior Violation directly in Firestore
  static async saveViolation(violation: BehaviorViolation): Promise<void> {
    try {
      const cleanViolation = JSON.parse(JSON.stringify(violation));
      await setDoc(doc(db, 'violations', violation.id), cleanViolation);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `violations/${violation.id}`);
      throw e;
    }
  }

  // Delete Behavior Violation directly from Firestore
  static async deleteViolation(violationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'violations', violationId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `violations/${violationId}`);
      throw e;
    }
  }

  // Real-time listener for violations
  static subscribeViolations(callback: (violations: BehaviorViolation[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'violations'), snap => {
        const list: BehaviorViolation[] = [];
        snap.forEach(d => list.push(d.data() as BehaviorViolation));
        list.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
        callback(list);
      }, err => {
        handleFirestoreError(err, OperationType.LIST, 'violations');
      });
    } catch (e) {
      return () => {};
    }
  }

  // Find student by ID or name or phone directly from Firestore (for live portal access)
  static async findStudentByIdOrQuery(lookup: string): Promise<Student | null> {
    if (!lookup) return null;
    const clean = decodeURIComponent(lookup).trim();
    const cleanNoSpaces = clean.replace(/\s+/g, '');

    // 1. Direct document fetch by ID
    try {
      const docSnap = await getDoc(doc(db, 'students', clean));
      if (docSnap.exists()) {
        return docSnap.data() as Student;
      }
    } catch (e) {
      // Continue to query
    }

    // 2. Query Firestore entire collection
    try {
      const snap = await getDocs(collection(db, 'students'));
      for (const d of snap.docs) {
        const s = d.data() as Student;
        if (
          s.id === clean ||
          s.id.toLowerCase() === clean.toLowerCase() ||
          s.name.trim() === clean ||
          s.name.replace(/\s+/g, '') === cleanNoSpaces ||
          s.phone.replace(/\D/g, '') === clean.replace(/\D/g, '') ||
          (s.parentPhones && s.parentPhones.some(p => p.replace(/\D/g, '') === clean.replace(/\D/g, '')))
        ) {
          return s;
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'students');
    }

    return null;
  }

  // Real-time Firestore Subscriptions for instant multi-device / multi-teacher sync
  static subscribeStudents(callback: (students: Student[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'students'), snap => {
        const list: Student[] = [];
        snap.forEach(d => list.push(d.data() as Student));
        callback(list);
      }, err => {
        handleFirestoreError(err, OperationType.LIST, 'students');
      });
    } catch (e) {
      return () => {};
    }
  }

  static subscribeAttendance(callback: (attendance: AttendanceRecord[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'attendance'), snap => {
        const list: AttendanceRecord[] = [];
        snap.forEach(d => list.push(d.data() as AttendanceRecord));
        callback(list);
      }, err => {
        handleFirestoreError(err, OperationType.LIST, 'attendance');
      });
    } catch (e) {
      return () => {};
    }
  }

  static subscribeEvaluations(callback: (evaluations: StudentEvaluation[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'evaluations'), snap => {
        const list: StudentEvaluation[] = [];
        snap.forEach(d => list.push(d.data() as StudentEvaluation));
        callback(list);
      }, err => {
        handleFirestoreError(err, OperationType.LIST, 'evaluations');
      });
    } catch (e) {
      return () => {};
    }
  }

  static subscribeCriteria(callback: (criteria: EvaluationCriteria[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'criteria'), snap => {
        const list: EvaluationCriteria[] = [];
        snap.forEach(d => list.push(d.data() as EvaluationCriteria));
        callback(list);
      }, err => {
        handleFirestoreError(err, OperationType.LIST, 'criteria');
      });
    } catch (e) {
      return () => {};
    }
  }

  static subscribeSettings(callback: (settings: AppSettings) => void): () => void {
    try {
      return onSnapshot(doc(db, 'settings', 'main'), snap => {
        if (snap.exists()) {
          callback(snap.data() as AppSettings);
        }
      }, err => {
        handleFirestoreError(err, OperationType.GET, 'settings/main');
      });
    } catch (e) {
      return () => {};
    }
  }

  static subscribeTeachers(callback: (teachers: TeacherAccount[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'teachers'), snap => {
        const list: TeacherAccount[] = [];
        snap.forEach(d => list.push(d.data() as TeacherAccount));
        callback(list);
      }, err => {
        handleFirestoreError(err, OperationType.LIST, 'teachers');
      });
    } catch (e) {
      return () => {};
    }
  }

  static subscribeHalaqahs(callback: (halaqahs: Halaqah[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'halaqahs'), snap => {
        const list: Halaqah[] = [];
        snap.forEach(d => list.push(d.data() as Halaqah));
        callback(list);
      }, err => {
        handleFirestoreError(err, OperationType.LIST, 'halaqahs');
      });
    } catch (e) {
      return () => {};
    }
  }

  // Helper to sanitize exams and prevent undefined questions
  static sanitizeExam(raw: any): Exam {
    const rawQuestions = Array.isArray(raw?.questions)
      ? raw.questions
      : typeof raw?.questions === 'object' && raw?.questions !== null
      ? Object.values(raw.questions)
      : [];

    const cleanQuestions: ExamQuestion[] = rawQuestions.map((q: any, idx: number) => ({
      id: q?.id || `q-${raw?.id || 'exam'}-${idx + 1}`,
      title: q?.title || `سؤال رقم ${idx + 1}`,
      type: q?.type || 'multiple_choice',
      options: Array.isArray(q?.options)
        ? q.options
        : q?.type === 'true_false'
        ? ['صح', 'خطأ']
        : ['الخيار 1', 'الخيار 2', 'الخيار 3'],
      correctAnswer: q?.correctAnswer !== undefined ? q.correctAnswer : (q?.type === 'true_false' ? 'صح' : undefined),
      points: Number(q?.points) || 5,
      explanation: q?.explanation || '',
      timeLimitSeconds: q?.timeLimitSeconds ? Number(q.timeLimitSeconds) : undefined
    }));

    return {
      id: raw?.id || `exam-${Date.now()}`,
      title: raw?.title || 'اختبار قرآني',
      description: raw?.description || '',
      scheduleType: raw?.scheduleType || 'now',
      startDate: raw?.startDate || new Date().toISOString(),
      hasDeadline: Boolean(raw?.hasDeadline),
      deadlineDate: raw?.deadlineDate || undefined,
      attemptLimitType: raw?.attemptLimitType || 'unlimited',
      maxAttempts: raw?.maxAttempts ? Number(raw.maxAttempts) : 1,
      timeLimitMode: raw?.timeLimitMode || 'total',
      totalTimeMinutes: raw?.totalTimeMinutes ? Number(raw.totalTimeMinutes) : 10,
      questionTimeSeconds: raw?.questionTimeSeconds ? Number(raw.questionTimeSeconds) : 30,
      gradeVisibility: raw?.gradeVisibility || 'immediate',
      grantsLeaderboardPoints: raw?.grantsLeaderboardPoints ?? true,
      totalPoints: Number(raw?.totalPoints) || cleanQuestions.reduce((s, q) => s + q.points, 0) || 20,
      targetHalaqat: Array.isArray(raw?.targetHalaqat) && raw.targetHalaqat.length > 0 ? raw.targetHalaqat : ['all'],
      deliveryMode: raw?.deliveryMode || (raw?.googleFormResponderUrl || raw?.googleFormId ? 'google_form' : 'platform'),
      autoCreateGoogleForm: raw?.autoCreateGoogleForm ?? true,
      questions: cleanQuestions.length > 0 ? cleanQuestions : INITIAL_EXAMS[0].questions,
      googleFormId: raw?.googleFormId,
      googleFormUrl: raw?.googleFormUrl,
      googleFormResponderUrl: raw?.googleFormResponderUrl,
      googleSpreadsheetId: raw?.googleSpreadsheetId,
      googleSpreadsheetUrl: raw?.googleSpreadsheetUrl,
      googleFormNameEntryId: raw?.googleFormNameEntryId,
      createdById: raw?.createdById || 'teacher-1',
      createdByName: raw?.createdByName || 'الشيخ المعلم',
      createdAt: raw?.createdAt || new Date().toISOString(),
      updatedAt: raw?.updatedAt
    };
  }

  // Load Exams directly from Firestore
  static async loadExams(): Promise<Exam[]> {
    try {
      const snap = await getDocs(collection(db, 'exams'));
      const list: Exam[] = [];
      snap.forEach(d => {
        const raw = d.data();
        list.push(this.sanitizeExam({ ...raw, id: d.id || raw.id }));
      });

      if (list.length === 0) {
        for (const ex of INITIAL_EXAMS) {
          await setDoc(doc(db, 'exams', ex.id), ex);
        }
        return INITIAL_EXAMS;
      }

      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'exams');
      return INITIAL_EXAMS;
    }
  }

  // Save Exam directly in Firestore
  static async saveExam(exam: Exam): Promise<void> {
    try {
      const sanitized = this.sanitizeExam(exam);
      const cleanExam = JSON.parse(JSON.stringify(sanitized));
      await setDoc(doc(db, 'exams', exam.id), cleanExam);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `exams/${exam.id}`);
      throw e;
    }
  }

  // Delete Exam directly from Firestore
  static async deleteExam(examId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'exams', examId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `exams/${examId}`);
      throw e;
    }
  }

  // Subscribe to Exams in real time
  static subscribeExams(callback: (exams: Exam[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'exams'), snap => {
        const list: Exam[] = [];
        snap.forEach(d => {
          const raw = d.data();
          list.push(OmranDataService.sanitizeExam({ ...raw, id: d.id || raw.id }));
        });
        if (list.length === 0) {
          callback(INITIAL_EXAMS);
          return;
        }
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      }, err => {
        handleFirestoreError(err, OperationType.LIST, 'exams');
      });
    } catch (e) {
      return () => {};
    }
  }

  // Load Exam Submissions directly from Firestore
  static async loadSubmissions(examId?: string): Promise<ExamSubmission[]> {
    try {
      const q = examId
        ? query(collection(db, 'exam_submissions'), where('examId', '==', examId))
        : collection(db, 'exam_submissions');
      const snap = await getDocs(q);
      const list: ExamSubmission[] = [];
      snap.forEach(d => list.push(d.data() as ExamSubmission));
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'exam_submissions');
      return [];
    }
  }

  // Save Exam Submission directly in Firestore
  static async saveSubmission(submission: ExamSubmission): Promise<void> {
    try {
      const cleanSubmission = JSON.parse(JSON.stringify(submission));
      await setDoc(doc(db, 'exam_submissions', submission.id), cleanSubmission);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `exam_submissions/${submission.id}`);
      throw e;
    }
  }

  // Delete Submission
  static async deleteSubmission(submissionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'exam_submissions', submissionId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `exam_submissions/${submissionId}`);
      throw e;
    }
  }

  // Subscribe to Exam Submissions in real time
  static subscribeSubmissions(callback: (submissions: ExamSubmission[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'exam_submissions'), snap => {
        const list: ExamSubmission[] = [];
        snap.forEach(d => list.push(d.data() as ExamSubmission));
        list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        callback(list);
      }, err => {
        handleFirestoreError(err, OperationType.LIST, 'exam_submissions');
      });
    } catch (e) {
      return () => {};
    }
  }

  // Load Leaderboard Settings
  static async loadLeaderboardSettings(): Promise<LeaderboardSettings> {
    try {
      const snap = await getDoc(doc(db, 'settings', 'leaderboard'));
      if (snap.exists()) {
        return snap.data() as LeaderboardSettings;
      }
      await setDoc(doc(db, 'settings', 'leaderboard'), DEFAULT_LEADERBOARD_SETTINGS);
      return DEFAULT_LEADERBOARD_SETTINGS;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'settings/leaderboard');
      return DEFAULT_LEADERBOARD_SETTINGS;
    }
  }

  // Save Leaderboard Settings
  static async saveLeaderboardSettings(settings: LeaderboardSettings): Promise<void> {
    try {
      await setDoc(doc(db, 'settings', 'leaderboard'), settings);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/leaderboard');
      throw e;
    }
  }

  // Subscribe to Leaderboard Settings
  static subscribeLeaderboardSettings(callback: (settings: LeaderboardSettings) => void): () => void {
    try {
      return onSnapshot(doc(db, 'settings', 'leaderboard'), snap => {
        if (snap.exists()) {
          callback(snap.data() as LeaderboardSettings);
        }
      }, err => {
        handleFirestoreError(err, OperationType.GET, 'settings/leaderboard');
      });
    } catch (e) {
      return () => {};
    }
  }

  // Load Google OAuth Configuration
  static async loadGoogleOAuthConfig(): Promise<GoogleOAuthConfig> {
    try {
      const snap = await getDoc(doc(db, 'settings', 'google_oauth'));
      if (snap.exists()) {
        return snap.data() as GoogleOAuthConfig;
      }
      return { isLinked: false };
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'settings/google_oauth');
      return { isLinked: false };
    }
  }

  // Save Google OAuth Configuration
  static async saveGoogleOAuthConfig(config: GoogleOAuthConfig): Promise<void> {
    try {
      await setDoc(doc(db, 'settings', 'google_oauth'), config);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/google_oauth');
      throw e;
    }
  }

  // Subscribe to Google OAuth Configuration in Real-time
  static subscribeGoogleOAuthConfig(callback: (config: GoogleOAuthConfig) => void): () => void {
    try {
      return onSnapshot(doc(db, 'settings', 'google_oauth'), snap => {
        if (snap.exists()) {
          callback(snap.data() as GoogleOAuthConfig);
        } else {
          callback({ isLinked: false });
        }
      }, err => {
        handleFirestoreError(err, OperationType.GET, 'settings/google_oauth');
      });
    } catch (e) {
      return () => {};
    }
  }

  // ==========================================
  // SURAH RECORDINGS MANAGEMENT (Supervisor Only)
  // ==========================================

  // Load All Surah Recordings
  static async loadRecordings(): Promise<SurahRecording[]> {
    try {
      const snap = await getDocs(collection(db, 'surah_recordings'));
      const list: SurahRecording[] = [];
      snap.forEach(d => list.push(d.data() as SurahRecording));
      return list.sort((a, b) => a.surahNumber - b.surahNumber);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'surah_recordings');
      return [];
    }
  }

  // Save / Update Surah Recording
  static async saveRecording(recording: SurahRecording): Promise<void> {
    try {
      const clean = cleanFirestoreData(recording);
      await setDoc(doc(db, 'surah_recordings', recording.id), clean);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `surah_recordings/${recording.id}`);
      throw e;
    }
  }

  // Delete Surah Recording
  static async deleteRecording(recordingId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'surah_recordings', recordingId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `surah_recordings/${recordingId}`);
      throw e;
    }
  }

  // Subscribe to Surah Recordings in Realtime
  static subscribeRecordings(callback: (recordings: SurahRecording[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'surah_recordings'), snap => {
        const list: SurahRecording[] = [];
        snap.forEach(d => list.push(d.data() as SurahRecording));
        callback(list.sort((a, b) => a.surahNumber - b.surahNumber));
      }, err => {
        handleFirestoreError(err, OperationType.LIST, 'surah_recordings');
      });
    } catch (e) {
      return () => {};
    }
  }

  // Load Recordings Config (Publish toggle)
  static async loadRecordingsConfig(): Promise<RecordingsConfig> {
    try {
      const snap = await getDoc(doc(db, 'settings', 'recordings_config'));
      if (snap.exists()) {
        return snap.data() as RecordingsConfig;
      }
      return DEFAULT_RECORDINGS_CONFIG;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'settings/recordings_config');
      return DEFAULT_RECORDINGS_CONFIG;
    }
  }

  // Save Recordings Config
  static async saveRecordingsConfig(config: RecordingsConfig): Promise<void> {
    try {
      const clean = cleanFirestoreData(config);
      await setDoc(doc(db, 'settings', 'recordings_config'), clean);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/recordings_config');
      throw e;
    }
  }

  // Subscribe to Recordings Config
  static subscribeRecordingsConfig(callback: (config: RecordingsConfig) => void): () => void {
    try {
      return onSnapshot(doc(db, 'settings', 'recordings_config'), snap => {
        if (snap.exists()) {
          callback(snap.data() as RecordingsConfig);
        } else {
          callback(DEFAULT_RECORDINGS_CONFIG);
        }
      }, err => {
        handleFirestoreError(err, OperationType.GET, 'settings/recordings_config');
      });
    } catch (e) {
      return () => {};
    }
  }

  // ==========================================
  // STUDENT LISTENING LOGS
  // ==========================================

  // Load Listening Logs
  static async loadListeningLogs(studentId?: string): Promise<StudentListeningLog[]> {
    try {
      let q;
      if (studentId) {
        q = query(collection(db, 'listening_logs'), where('studentId', '==', studentId));
      } else {
        q = collection(db, 'listening_logs');
      }
      const snap = await getDocs(q);
      const list: StudentListeningLog[] = [];
      snap.forEach(d => list.push(d.data() as StudentListeningLog));
      return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'listening_logs');
      return [];
    }
  }

  // Save / Update Student Listening Log
  static async saveListeningLog(log: StudentListeningLog): Promise<void> {
    try {
      const clean = cleanFirestoreData(log);
      await setDoc(doc(db, 'listening_logs', log.id), clean);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `listening_logs/${log.id}`);
      throw e;
    }
  }

  // Subscribe to Listening Logs
  static subscribeListeningLogs(callback: (logs: StudentListeningLog[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'listening_logs'), snap => {
        const list: StudentListeningLog[] = [];
        snap.forEach(d => list.push(d.data() as StudentListeningLog));
        callback(list.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      }, err => {
        handleFirestoreError(err, OperationType.LIST, 'listening_logs');
      });
    } catch (e) {
      return () => {};
    }
  }

  // Export Full Database (Complete Cloud Firestore Backup)
  static async exportFullBackup(): Promise<FullBackupData> {
    const [
      students,
      attendance,
      evaluations,
      evaluationCriteria,
      settings,
      chatMessages,
      teachers,
      halaqahs,
      violations,
      exams,
      submissions,
      leaderboardSettings,
      googleOAuth,
      recordings,
      recordingsConfig,
      listeningLogs
    ] = await Promise.all([
      this.loadStudents(),
      this.loadAttendance(),
      this.loadEvaluations(),
      this.loadCriteria(),
      this.loadSettings(),
      this.loadChats(),
      this.loadTeachers(),
      this.loadHalaqahs(),
      this.loadViolations(),
      this.loadExams(),
      this.loadSubmissions(),
      this.loadLeaderboardSettings(),
      this.loadGoogleOAuthConfig(),
      this.loadRecordings(),
      this.loadRecordingsConfig(),
      this.loadListeningLogs()
    ]);

    return {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      students,
      attendance,
      evaluations,
      evaluationCriteria,
      settings,
      chatMessages,
      teachers,
      halaqahs,
      violations,
      exams,
      submissions,
      leaderboardSettings,
      googleOAuth,
      recordings,
      recordingsConfig,
      listeningLogs,
      userAccounts: [
        {
          id: 'admin-1',
          username: settings.teacherName || 'محمد منتصر',
          role: 'admin',
          phone: '0500000000',
          createdAt: new Date().toISOString()
        }
      ]
    };
  }

  // Import / Restore Full Database directly into Firestore (replaces existing data)
  static async importFullBackup(backup: FullBackupData): Promise<{
    studentsCount: number;
    attendanceCount: number;
    evaluationsCount: number;
    criteriaCount: number;
    teachersCount: number;
    halaqahsCount?: number;
    violationsCount?: number;
    examsCount?: number;
    submissionsCount?: number;
    recordingsCount?: number;
  }> {
    if (!backup || typeof backup !== 'object') {
      throw new Error('ملف النسخة الاحتياطية غير صالح أو تالف.');
    }

    const studentsList = Array.isArray(backup.students) ? backup.students : [];
    const attendanceList = Array.isArray(backup.attendance) ? backup.attendance : [];
    const evaluationsList = Array.isArray(backup.evaluations) ? backup.evaluations : [];
    const criteriaList = Array.isArray(backup.evaluationCriteria) && backup.evaluationCriteria.length > 0
      ? backup.evaluationCriteria
      : DEFAULT_CRITERIA;
    const settingsData = backup.settings || DEFAULT_SETTINGS;
    const teachersList = Array.isArray(backup.teachers) && backup.teachers.length > 0
      ? backup.teachers
      : INITIAL_TEACHERS;
    const halaqahsList = Array.isArray(backup.halaqahs) && backup.halaqahs.length > 0
      ? backup.halaqahs
      : DEFAULT_HALAQAHS;
    const violationsList = Array.isArray(backup.violations) ? backup.violations : [];
    const examsList = Array.isArray(backup.exams) ? backup.exams : [];
    const submissionsList = Array.isArray(backup.submissions) ? backup.submissions : [];
    const leaderboardSettings = backup.leaderboardSettings || DEFAULT_LEADERBOARD_SETTINGS;
    const recordingsList = Array.isArray(backup.recordings) ? backup.recordings : [];
    const recordingsConfig = backup.recordingsConfig || DEFAULT_RECORDINGS_CONFIG;
    const listeningLogsList = Array.isArray(backup.listeningLogs) ? backup.listeningLogs : [];

    // Helper to safely clear collections to guarantee complete replacement of data
    const clearCol = async (colName: string) => {
      try {
        const snap = await getDocs(collection(db, colName));
        const delP: Promise<any>[] = [];
        snap.forEach(d => delP.push(deleteDoc(d.ref)));
        await Promise.all(delP);
      } catch (err) {
        console.warn(`Could not clear col ${colName}`, err);
      }
    };

    // Clear prior data to ensure full replacement
    await Promise.all([
      clearCol('students'),
      clearCol('attendance'),
      clearCol('evaluations'),
      clearCol('criteria'),
      clearCol('teachers'),
      clearCol('halaqahs'),
      clearCol('violations'),
      clearCol('exams'),
      clearCol('exam_submissions'),
      clearCol('surah_recordings'),
      clearCol('listening_logs')
    ]);

    // Persist new data directly to Firestore concurrently
    try {
      const promises: Promise<any>[] = [];

      for (const s of studentsList) {
        if (s?.id) promises.push(setDoc(doc(db, 'students', s.id), s));
      }
      for (const a of attendanceList) {
        if (a?.id) promises.push(setDoc(doc(db, 'attendance', a.id), a));
      }
      for (const ev of evaluationsList) {
        if (ev?.id) promises.push(setDoc(doc(db, 'evaluations', ev.id), ev));
      }
      for (const c of criteriaList) {
        if (c?.id) promises.push(setDoc(doc(db, 'criteria', c.id), c));
      }
      for (const t of teachersList) {
        if (t?.id) promises.push(setDoc(doc(db, 'teachers', t.id), t));
      }
      for (const h of halaqahsList) {
        if (h?.id) promises.push(setDoc(doc(db, 'halaqahs', h.id), h));
      }
      for (const v of violationsList) {
        if (v?.id) promises.push(setDoc(doc(db, 'violations', v.id), v));
      }
      for (const ex of examsList) {
        if (ex?.id) promises.push(setDoc(doc(db, 'exams', ex.id), ex));
      }
      for (const sub of submissionsList) {
        if (sub?.id) promises.push(setDoc(doc(db, 'exam_submissions', sub.id), sub));
      }
      for (const rec of recordingsList) {
        if (rec?.id) promises.push(setDoc(doc(db, 'surah_recordings', rec.id), rec));
      }
      for (const log of listeningLogsList) {
        if (log?.id) promises.push(setDoc(doc(db, 'listening_logs', log.id), log));
      }

      if (settingsData) {
        promises.push(setDoc(doc(db, 'settings', 'main'), settingsData));
      }
      if (leaderboardSettings) {
        promises.push(setDoc(doc(db, 'settings', 'leaderboard'), leaderboardSettings));
      }
      if (backup.googleOAuth) {
        promises.push(setDoc(doc(db, 'settings', 'google_oauth'), backup.googleOAuth));
      }
      if (recordingsConfig) {
        promises.push(setDoc(doc(db, 'settings', 'recordings_config'), recordingsConfig));
      }

      await Promise.all(promises);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'importFullBackup');
      throw e;
    }

    return {
      studentsCount: studentsList.length,
      attendanceCount: attendanceList.length,
      evaluationsCount: evaluationsList.length,
      criteriaCount: criteriaList.length,
      teachersCount: teachersList.length,
      halaqahsCount: halaqahsList.length,
      violationsCount: violationsList.length,
      examsCount: examsList.length,
      submissionsCount: submissionsList.length,
      recordingsCount: recordingsList.length
    };
  }
}
