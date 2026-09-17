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
  Halaqah
} from '../types';

export { firebaseConfig };

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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
      'omran_halaqahs_data'
    ];
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }
  } catch (e) {
    // Ignore in case localStorage is disabled or restricted
  }
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

  // Save Teacher directly in Firestore
  static async saveTeacher(teacher: TeacherAccount): Promise<void> {
    try {
      await setDoc(doc(db, 'teachers', teacher.id), teacher);
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
          await setDoc(doc(db, 'halaqahs', h.id), h);
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
      await setDoc(doc(db, 'halaqahs', halaqah.id), halaqah);
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

  // Save Student directly in Firestore
  static async saveStudent(student: Student): Promise<void> {
    try {
      await setDoc(doc(db, 'students', student.id), student);
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

  // Export Full Database (Complete Cloud Firestore Backup)
  static async exportFullBackup(): Promise<FullBackupData> {
    const [students, attendance, evaluations, evaluationCriteria, settings, chatMessages, teachers, halaqahs, violations] =
      await Promise.all([
        this.loadStudents(),
        this.loadAttendance(),
        this.loadEvaluations(),
        this.loadCriteria(),
        this.loadSettings(),
        this.loadChats(),
        this.loadTeachers(),
        this.loadHalaqahs(),
        this.loadViolations()
      ]);

    return {
      version: '1.5.0',
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

  // Import / Restore Full Database directly into Firestore
  static async importFullBackup(backup: FullBackupData): Promise<{
    studentsCount: number;
    attendanceCount: number;
    evaluationsCount: number;
    criteriaCount: number;
    teachersCount: number;
    halaqahsCount?: number;
    violationsCount?: number;
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
    const chatList = Array.isArray(backup.chatMessages) ? backup.chatMessages : [];
    const teachersList = Array.isArray(backup.teachers) && backup.teachers.length > 0
      ? backup.teachers
      : INITIAL_TEACHERS;
    const halaqahsList = Array.isArray(backup.halaqahs) && backup.halaqahs.length > 0
      ? backup.halaqahs
      : DEFAULT_HALAQAHS;
    const violationsList = Array.isArray(backup.violations) ? backup.violations : [];

    // Persist directly to Firestore concurrently
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
      if (settingsData) {
        promises.push(setDoc(doc(db, 'settings', 'main'), settingsData));
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
      violationsCount: violationsList.length
    };
  }
}
