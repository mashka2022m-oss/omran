import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  Users,
  UserCheck,
  BookOpen,
  MessageCircle,
  Award,
  Sparkles,
  Database,
  Sliders,
  LogOut,
  Calendar,
  Lock,
  Unlock,
  ShieldAlert,
  Layers,
  FileText,
  Headphones,
  UserCog
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  StudentEvaluation,
  EvaluationCriteria,
  AppSettings,
  ChatMessage,
  UserRole,
  TeacherAccount,
  BehaviorViolation,
  Halaqah,
  Exam,
  ExamSubmission,
  LeaderboardSettings,
  GoogleOAuthConfig,
  SurahRecording,
  RecordingsConfig,
  isTeacherSupervisor,
  isTeacherDeveloper,
  getTeacherComplex,
  QuranComplex
} from './types';
import {
  OmranDataService,
  DEFAULT_CRITERIA,
  DEFAULT_SETTINGS,
  DEFAULT_HALAQAHS,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  DEFAULT_RECORDINGS_CONFIG
} from './lib/firebase';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { CloudLoadingScreen } from './components/CloudLoadingScreen';
import { ParentPortalView } from './components/ParentPortalView';
import { TeacherManagementModal } from './components/TeacherManagementModal';
import { SettingsModal } from './components/SettingsModal';
import { ComplexManagementModal } from './components/ComplexManagementModal';
import { UnassignedTeacherView } from './components/UnassignedTeacherView';
import { UnassignedStudentView } from './components/UnassignedStudentView';
import { getSurahInfo } from './data/quranData';
import { HomeTab } from './components/tabs/HomeTab';
import { StudentsTab } from './components/tabs/StudentsTab';
import { AttendanceTab } from './components/tabs/AttendanceTab';
import { EvaluationTab } from './components/tabs/EvaluationTab';
import { BehaviorTab } from './components/tabs/BehaviorTab';
import { ParentsWhatsAppTab } from './components/tabs/ParentsWhatsAppTab';
import { ReportsTab } from './components/tabs/ReportsTab';
import { DataBackupTab } from './components/tabs/DataBackupTab';
import { ExamsTab } from './components/tabs/ExamsTab';
import { AccountsTab } from './components/tabs/AccountsTab';
import { RecordingsTab } from './components/tabs/RecordingsTab';

export function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role: UserRole;
    studentId?: string;
    teacherId?: string;
  } | null>(() => {
    const saved = localStorage.getItem('omran_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Check URL portal query param for direct parent portal link (?portal=std-1 or ?id=std-1)
  const [portalStudentId, setPortalStudentId] = useState<string | null>(null);
  const [directPortalStudent, setDirectPortalStudent] = useState<Student | null>(null);

  // Active Tab for Admin
  const [activeTab, setActiveTab] = useState<string>('home');
  const [targetStudentForEval, setTargetStudentForEval] = useState<string | undefined>();
  const [targetStudentForWhatsApp, setTargetStudentForWhatsApp] = useState<string | undefined>();
  const [targetStudentForBehavior, setTargetStudentForBehavior] = useState<string | undefined>();

  // Teachers State & Modal
  const [teachers, setTeachers] = useState<TeacherAccount[]>(INITIAL_TEACHERS);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  // Halaqahs State & Settings Modal
  const [halaqahs, setHalaqahs] = useState<Halaqah[]>(DEFAULT_HALAQAHS);
  const [activeHalaqahId, setActiveHalaqahId] = useState<string>('all');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Complexes State & Complex Management Modal (المجمعات القرآنية)
  const [complexes, setComplexes] = useState<QuranComplex[]>([]);
  const [isComplexModalOpen, setIsComplexModalOpen] = useState(false);

  // Main Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);
  const [violations, setViolations] = useState<BehaviorViolation[]>([]);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>(DEFAULT_CRITERIA);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [leaderboardSettings, setLeaderboardSettings] = useState<LeaderboardSettings | null>(null);
  const [googleAuthConfig, setGoogleAuthConfig] = useState<GoogleOAuthConfig>({ isLinked: false });
  const [recordings, setRecordings] = useState<SurahRecording[]>([]);
  const [recordingsConfig, setRecordingsConfig] = useState<RecordingsConfig>(DEFAULT_RECORDINGS_CONFIG);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Parse URL on initial load and handle hash / search changes
  useEffect(() => {
    const parsePortalParam = () => {
      const urlParams = new URLSearchParams(window.location.search);
      let portalId =
        urlParams.get('portal') ||
        urlParams.get('id') ||
        urlParams.get('student') ||
        urlParams.get('studentId');

      if (!portalId && window.location.hash) {
        const hash = window.location.hash.replace(/^#\/?/, '');
        const hashParams = new URLSearchParams(hash);
        portalId =
          hashParams.get('portal') ||
          hashParams.get('id') ||
          hashParams.get('student') ||
          (hash.startsWith('portal=') ? hash.split('portal=')[1] : null) ||
          (hash.startsWith('id=') ? hash.split('id=')[1] : null);
      }

      if (portalId) {
        setPortalStudentId(decodeURIComponent(portalId));
      }
    };

    parsePortalParam();
    window.addEventListener('popstate', parsePortalParam);
    window.addEventListener('hashchange', parsePortalParam);
    return () => {
      window.removeEventListener('popstate', parsePortalParam);
      window.removeEventListener('hashchange', parsePortalParam);
    };
  }, []);

  // Dedicated effect to resolve portal student directly from storage/firestore if needed
  useEffect(() => {
    if (!portalStudentId) {
      setDirectPortalStudent(null);
      return;
    }

    const resolvePortalStudent = async () => {
      const clean = decodeURIComponent(portalStudentId).trim();
      const match = students.find(
        s =>
          s.id === clean ||
          s.id.toLowerCase() === clean.toLowerCase() ||
          s.name.trim() === clean ||
          s.name.replace(/\s+/g, '') === clean.replace(/\s+/g, '') ||
          s.phone.replace(/\D/g, '') === clean.replace(/\D/g, '') ||
          (s.parentPhones && s.parentPhones.some(p => p.replace(/\D/g, '') === clean.replace(/\D/g, '')))
      );
      if (match) {
        setDirectPortalStudent(match);
        return;
      }

      const fetched = await OmranDataService.findStudentByIdOrQuery(portalStudentId);
      if (fetched) {
        setDirectPortalStudent(fetched);
        setStudents(prev => (prev.some(s => s.id === fetched.id) ? prev : [...prev, fetched]));
      }
    };

    resolvePortalStudent();
  }, [portalStudentId, students]);

  // Load all data from Firestore / LocalCache
  const loadAllData = async () => {
    setIsLoadingData(true);
    try {
      const [
        loadedStudents,
        loadedAttendance,
        loadedEvaluations,
        loadedCriteria,
        loadedSettings,
        loadedChats,
        loadedTeachers,
        loadedViolations,
        loadedHalaqahs,
        loadedExams,
        loadedSubmissions,
        loadedLeaderboard,
        loadedGoogleOAuth,
        loadedRecordings,
        loadedRecordingsConfig,
        loadedComplexes
      ] = await Promise.all([
        OmranDataService.loadStudents(),
        OmranDataService.loadAttendance(),
        OmranDataService.loadEvaluations(),
        OmranDataService.loadCriteria(),
        OmranDataService.loadSettings(),
        OmranDataService.loadChats(),
        OmranDataService.loadTeachers(),
        OmranDataService.loadViolations(),
        OmranDataService.loadHalaqahs(),
        OmranDataService.loadExams(),
        OmranDataService.loadSubmissions(),
        OmranDataService.loadLeaderboardSettings(),
        OmranDataService.loadGoogleOAuthConfig(),
        OmranDataService.loadRecordings(),
        OmranDataService.loadRecordingsConfig(),
        OmranDataService.loadComplexes()
      ]);

      setStudents(loadedStudents);
      setAttendance(loadedAttendance);
      setEvaluations(loadedEvaluations);
      setCriteria(loadedCriteria);
      setSettings(loadedSettings);
      setChatHistory(loadedChats);
      setTeachers(loadedTeachers);
      setViolations(loadedViolations);
      setHalaqahs(loadedHalaqahs);
      setExams(loadedExams);
      setSubmissions(loadedSubmissions);
      setLeaderboardSettings(loadedLeaderboard);
      setGoogleAuthConfig(loadedGoogleOAuth);
      setRecordings(loadedRecordings);
      setRecordingsConfig(loadedRecordingsConfig);
      setComplexes(loadedComplexes);
    } catch (e) {
      console.warn('Initial data load notice:', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      try {
        await OmranDataService.testConnection();
      } catch (err) {
        // Safe connection test fallback
      }
      if (isMounted) {
        await loadAllData();
      }
    };
    initialize();

    // Attach Firestore real-time subscriptions for multi-teacher live sync
    const unsubStudents = OmranDataService.subscribeStudents(newStudents => {
      setStudents(newStudents);
    });
    const unsubAttendance = OmranDataService.subscribeAttendance(newAtt => {
      setAttendance(newAtt);
    });
    const unsubEvaluations = OmranDataService.subscribeEvaluations(newEvals => {
      setEvaluations(newEvals);
    });
    const unsubCriteria = OmranDataService.subscribeCriteria(newCrit => {
      setCriteria(newCrit);
    });
    const unsubSettings = OmranDataService.subscribeSettings(newSet => {
      setSettings(newSet);
    });
    const unsubTeachers = OmranDataService.subscribeTeachers(newTeach => {
      setTeachers(newTeach);
    });
    const unsubViolations = OmranDataService.subscribeViolations(newViolations => {
      setViolations(newViolations);
    });
    const unsubHalaqahs = OmranDataService.subscribeHalaqahs(newHalaqahs => {
      setHalaqahs(newHalaqahs);
    });
    const unsubComplexes = OmranDataService.subscribeComplexes(newComplexes => {
      setComplexes(newComplexes);
    });
    const unsubExams = OmranDataService.subscribeExams(newExams => {
      setExams(newExams);
    });
    const unsubSubmissions = OmranDataService.subscribeSubmissions(newSubs => {
      setSubmissions(newSubs);
    });
    const unsubLeaderboard = OmranDataService.subscribeLeaderboardSettings(newLead => {
      setLeaderboardSettings(newLead);
    });
    const unsubGoogle = OmranDataService.subscribeGoogleOAuthConfig(newGoogle => {
      setGoogleAuthConfig(newGoogle);
    });
    const unsubRecordings = OmranDataService.subscribeRecordings(newRecordings => {
      setRecordings(newRecordings);
    });
    const unsubRecordingsConfig = OmranDataService.subscribeRecordingsConfig(newConfig => {
      setRecordingsConfig(newConfig);
    });

    return () => {
      unsubStudents();
      unsubAttendance();
      unsubEvaluations();
      unsubCriteria();
      unsubSettings();
      unsubTeachers();
      unsubViolations();
      unsubHalaqahs();
      unsubComplexes();
      unsubExams();
      unsubSubmissions();
      unsubLeaderboard();
      unsubGoogle();
      unsubRecordings();
      unsubRecordingsConfig();
    };
  }, []);

  // Identify Teacher and Supervisor Roles (MUST run before any conditional returns)
  const currentTeacher = useMemo(() => {
    if (!currentUser || currentUser.role !== 'admin') return null;
    const cleanUser = currentUser.username.trim().toLowerCase();
    const tid = currentUser.teacherId || currentUser.studentId;
    return teachers.find(
      t => (tid && t.id === tid) ||
           t.username.trim().toLowerCase() === cleanUser ||
           t.name.trim().toLowerCase() === cleanUser
    );
  }, [currentUser, teachers]);

  const isSupervisor = useMemo(() => {
    if (!currentUser || currentUser.role !== 'admin') return false;
    if (currentTeacher) {
      return isTeacherSupervisor(currentTeacher);
    }
    const cleanUser = currentUser.username.trim().toLowerCase();
    return (
      cleanUser === 'محمد منتصر' ||
      cleanUser === 'الشيخ محمد منتصر' ||
      cleanUser === 'admin' ||
      cleanUser === 'المشرف العام'
    );
  }, [currentUser, currentTeacher]);

  // Check Programmer (معلم ومشرف ومبرمج - خاص بالشيخ محمد منتصر)
  const isDeveloper = useMemo(() => {
    if (!currentUser || currentUser.role !== 'admin') return false;
    if (currentTeacher) {
      return isTeacherDeveloper(currentTeacher, currentUser);
    }
    const cleanUser = currentUser.username.trim().toLowerCase();
    return (
      cleanUser === 'محمد منتصر' ||
      cleanUser === 'الشيخ محمد منتصر' ||
      cleanUser === 'admin'
    );
  }, [currentUser, currentTeacher]);

  // Complex scope resolution for teacher/supervisor:
  // Non-developer supervisors can ONLY manage and view their own assigned QuranComplex!
  const supervisedComplex = useMemo(() => {
    if (!currentUser || currentUser.role !== 'admin') return null;
    return getTeacherComplex(currentTeacher, complexes, halaqahs);
  }, [currentUser, currentTeacher, complexes, halaqahs]);

  // Scoped complexes: Programmer sees all complexes; supervisor/teacher only sees their own complex
  const scopedComplexes = useMemo(() => {
    if (isDeveloper) return complexes;
    if (supervisedComplex) return [supervisedComplex];
    return complexes.slice(0, 1);
  }, [isDeveloper, supervisedComplex, complexes]);

  // Scoped halaqahs: If programmer, sees all halaqahs.
  // If complex supervisor or teacher, STRICTLY sees halaqahs of their own QuranComplex!
  const scopedHalaqahs = useMemo(() => {
    if (isDeveloper) return halaqahs;
    if (supervisedComplex) {
      return halaqahs.filter(h => {
        const cId = h.complexId || (complexes[0] ? complexes[0].id : '');
        return cId === supervisedComplex.id;
      });
    }
    return halaqahs;
  }, [isDeveloper, supervisedComplex, halaqahs, complexes]);

  const scopedHalaqahIds = useMemo(() => {
    return new Set(scopedHalaqahs.map(h => h.id));
  }, [scopedHalaqahs]);

  // Scoped students: If programmer, sees all students.
  // If complex supervisor or teacher, STRICTLY sees students belonging to their complex's halaqahs!
  const scopedStudents = useMemo(() => {
    if (isDeveloper) return students;
    return students.filter(s => s.halaqahId && scopedHalaqahIds.has(s.halaqahId));
  }, [isDeveloper, students, scopedHalaqahIds]);

  const scopedStudentIds = useMemo(() => {
    return new Set(scopedStudents.map(s => s.id));
  }, [scopedStudents]);

  // Scoped teachers: Teachers belonging to the same complex
  const scopedTeachers = useMemo(() => {
    if (isDeveloper) return teachers;
    if (!supervisedComplex) return teachers;
    return teachers.filter(t => {
      if (currentTeacher && t.id === currentTeacher.id) return true;
      if (t.complexId === supervisedComplex.id) return true;
      if (t.halaqahId && scopedHalaqahIds.has(t.halaqahId)) return true;
      if (t.halaqahIds && t.halaqahIds.some(hid => scopedHalaqahIds.has(hid))) return true;
      return false;
    });
  }, [isDeveloper, teachers, supervisedComplex, currentTeacher, scopedHalaqahIds]);

  // Assigned halaqahs for current user:
  // If supervisor, gets all halaqahs belonging to their complex (scopedHalaqahs).
  // If teacher, gets only their assigned halaqahs within their complex.
  const assignedHalaqahs = useMemo(() => {
    if (isSupervisor) {
      return scopedHalaqahs;
    }
    if (!currentTeacher) {
      return [];
    }
    const idSet = new Set<string>();
    if (Array.isArray(currentTeacher.halaqahIds)) {
      currentTeacher.halaqahIds.forEach(id => {
        if (id) idSet.add(id);
      });
    }
    if (currentTeacher.halaqahId) {
      idSet.add(currentTeacher.halaqahId);
    }
    scopedHalaqahs.forEach(h => {
      if (h.teacherIds?.includes(currentTeacher.id)) {
        idSet.add(h.id);
      }
      if (
        h.primaryTeacherName &&
        currentTeacher.name &&
        h.primaryTeacherName.trim().toLowerCase() === currentTeacher.name.trim().toLowerCase()
      ) {
        idSet.add(h.id);
      }
    });
    return scopedHalaqahs.filter(h => idSet.has(h.id));
  }, [isSupervisor, scopedHalaqahs, currentTeacher]);

  // Auto-switch to assigned halaqah for teacher or valid complex halaqah for supervisor
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      if (isSupervisor) {
        if (activeHalaqahId && activeHalaqahId !== 'all' && !scopedHalaqahIds.has(activeHalaqahId)) {
          setActiveHalaqahId('all');
        }
      } else {
        if (assignedHalaqahs.length > 0) {
          if (!activeHalaqahId || activeHalaqahId === 'all' || !assignedHalaqahs.some(h => h.id === activeHalaqahId)) {
            setActiveHalaqahId(assignedHalaqahs[0].id);
          }
        }
      }
    }
  }, [currentUser, isSupervisor, assignedHalaqahs, activeHalaqahId, scopedHalaqahIds]);

  // Guard programmer-only tabs: recordings, accounts/ranks, and database backup are strictly for Programmer (Mohamed Montaser)
  useEffect(() => {
    if (!isDeveloper && (activeTab === 'recordings' || activeTab === 'accounts' || activeTab === 'backup')) {
      setActiveTab('home');
    }
  }, [isDeveloper, activeTab]);

  // Helper to check whether a student has an assigned halaqah
  const isStudentAssigned = (s: Student) => {
    return Boolean(
      s.halaqahId &&
      s.halaqahId.trim() !== '' &&
      s.halaqahId !== 'unassigned' &&
      s.halaqahId !== 'none'
    );
  };

  // Filter students based on active halaqah selection (or show all for supervisor within their complex)
  // Teachers and complex supervisors MUST only see students assigned to their complex!
  const displayedStudents = useMemo(() => {
    if (isSupervisor) {
      if (activeHalaqahId && activeHalaqahId !== 'all') {
        return scopedStudents.filter(s => s.halaqahId === activeHalaqahId);
      }
      return scopedStudents;
    }

    // Teacher view: only students assigned to teacher's halaqah
    if (activeHalaqahId && activeHalaqahId !== 'all') {
      return scopedStudents.filter(s => s.halaqahId === activeHalaqahId);
    }
    if (assignedHalaqahs.length > 0) {
      const allowedIds = new Set(assignedHalaqahs.map(h => h.id));
      return scopedStudents.filter(s => s.halaqahId && allowedIds.has(s.halaqahId));
    }
    return [];
  }, [scopedStudents, isSupervisor, activeHalaqahId, assignedHalaqahs]);

  // Students for attendance, evaluations, behavior, reports, and WhatsApp:
  // Must only include assigned students within displayedStudents
  const assignedDisplayedStudents = useMemo(() => {
    return displayedStudents.filter(isStudentAssigned);
  }, [displayedStudents]);

  // Scope attendance, evaluations, and violations based on displayed students
  const displayedStudentIds = useMemo(() => {
    return new Set(displayedStudents.map(s => s.id));
  }, [displayedStudents]);

  const displayedAttendance = useMemo(() => {
    if (activeHalaqahId === 'all' && isSupervisor) {
      return attendance.filter(a => scopedStudentIds.has(a.studentId));
    }
    return attendance.filter(a => displayedStudentIds.has(a.studentId));
  }, [activeHalaqahId, isSupervisor, attendance, scopedStudentIds, displayedStudentIds]);

  const displayedEvaluations = useMemo(() => {
    if (activeHalaqahId === 'all' && isSupervisor) {
      return evaluations.filter(e => scopedStudentIds.has(e.studentId));
    }
    return evaluations.filter(e => displayedStudentIds.has(e.studentId));
  }, [activeHalaqahId, isSupervisor, evaluations, scopedStudentIds, displayedStudentIds]);

  const displayedViolations = useMemo(() => {
    if (activeHalaqahId === 'all' && isSupervisor) {
      return violations.filter(v => scopedStudentIds.has(v.studentId));
    }
    return violations.filter(v => displayedStudentIds.has(v.studentId));
  }, [activeHalaqahId, isSupervisor, violations, scopedStudentIds, displayedStudentIds]);

  // Scoped exams & submissions strictly restricted to the complex
  const scopedExams = useMemo(() => {
    if (isDeveloper) return exams;
    const teacherIdSet = new Set(scopedTeachers.map(t => t.id));
    return exams.filter(e => {
      if (e.createdById && teacherIdSet.has(e.createdById)) return true;
      if (e.targetHalaqat && e.targetHalaqat.some(hid => hid === 'all' || scopedHalaqahIds.has(hid))) return true;
      return false;
    });
  }, [isDeveloper, exams, scopedTeachers, scopedHalaqahIds]);

  const scopedSubmissions = useMemo(() => {
    if (isDeveloper) return submissions;
    return submissions.filter(sub => scopedStudentIds.has(sub.studentId));
  }, [isDeveloper, submissions, scopedStudentIds]);

  // Save session on login
  const handleLoginSuccess = (user: { username: string; role: UserRole; studentId?: string; teacherId?: string }) => {
    setCurrentUser(user);
    localStorage.setItem('omran_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('omran_session');
    setPortalStudentId(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  // Multi-Teacher Handlers
  const handleSaveTeacher = async (teacher: TeacherAccount) => {
    await OmranDataService.saveTeacher(teacher);
    const updated = await OmranDataService.loadTeachers();
    setTeachers(updated);
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    await OmranDataService.deleteTeacher(teacherId);
    const updated = await OmranDataService.loadTeachers();
    setTeachers(updated);
  };

  // Halaqah Management Handlers
  const handleSaveHalaqah = async (halaqah: Halaqah) => {
    await OmranDataService.saveHalaqah(halaqah);
    const updated = await OmranDataService.loadHalaqahs();
    setHalaqahs(updated);
  };

  const handleDeleteHalaqah = async (halaqahId: string) => {
    await OmranDataService.deleteHalaqah(halaqahId);
    const updated = await OmranDataService.loadHalaqahs();
    setHalaqahs(updated);
    if (activeHalaqahId === halaqahId) {
      setActiveHalaqahId('all');
    }
  };

  // Student Transfer Handler (Preserves full student history & evaluation records)
  const handleTransferStudent = async (studentId: string, targetHalaqahId: string, targetHalaqahName: string) => {
    await OmranDataService.transferStudentToHalaqah(studentId, targetHalaqahId, targetHalaqahName);
    const updated = await OmranDataService.loadStudents();
    setStudents(updated);
  };

  // Batch Student Transfer Handler (Transfers multiple students in one operation to Firestore)
  const handleBatchTransferStudents = async (studentIds: string[], targetHalaqahId: string, targetHalaqahName: string) => {
    await OmranDataService.transferMultipleStudentsToHalaqah(studentIds, targetHalaqahId, targetHalaqahName);
    const updated = await OmranDataService.loadStudents();
    setStudents(updated);
  };

  // 1. Student Registration / Addition
  const handleAddStudent = async (studentData: Partial<Student>): Promise<boolean> => {
    let chosenHalaqahId = studentData.halaqahId || '';
    let chosenHalaqahName = studentData.halaqahName || '';

    if (chosenHalaqahId) {
      const match = scopedHalaqahs.find(h => h.id === chosenHalaqahId);
      if (match) {
        chosenHalaqahName = match.name;
      }
    } else if (activeHalaqahId && activeHalaqahId !== 'all') {
      const match = scopedHalaqahs.find(h => h.id === activeHalaqahId);
      if (match) {
        chosenHalaqahId = match.id;
        chosenHalaqahName = match.name;
      }
    }

    // Default to first scoped halaqah if none selected or outside allowed complex scope
    if (!chosenHalaqahId && scopedHalaqahs.length > 0) {
      chosenHalaqahId = scopedHalaqahs[0].id;
      chosenHalaqahName = scopedHalaqahs[0].name;
    }

    const newStudent: Student = {
      id: `std_${Date.now()}`,
      name: studentData.name || 'طالب جديد',
      password: studentData.password || '123',
      phone: studentData.phone || '',
      age: studentData.age || 10,
      parentName: studentData.parentName || `ولي أمر ${studentData.name}`,
      parentPhones: studentData.parentPhones || [studentData.phone || ''],
      currentSurah: studentData.currentSurah || 78,
      currentSurahName: studentData.currentSurahName || 'النبأ',
      currentAyah: studentData.currentAyah || 1,
      dailyNewTarget: studentData.dailyNewTarget || 'نصف وجه',
      dailyReviewTarget: studentData.dailyReviewTarget || 'وجه واحد',
      level: studentData.level || 'متوسط',
      halaqahId: chosenHalaqahId,
      halaqahName: chosenHalaqahName,
      notes: studentData.notes || '',
      createdAt: new Date().toISOString()
    };

    // Auto trigger Gemini AI plan generation
    try {
      const res = await fetch('/api/gemini/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student: newStudent })
      });
      const data = await res.json();
      if (data?.plan) {
        newStudent.aiPlan = {
          ...data.plan,
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('AI Plan generation warning:', e);
    }

    await OmranDataService.saveStudent(newStudent);
    const updated = await OmranDataService.loadStudents();
    setStudents(updated);
    return true;
  };

  // 2. Update Student
  const handleUpdateStudent = async (student: Student): Promise<boolean> => {
    await OmranDataService.saveStudent(student);
    const updated = await OmranDataService.loadStudents();
    setStudents(updated);
    return true;
  };

  // 3. Delete Student
  const handleDeleteStudent = async (studentId: string): Promise<boolean> => {
    // 1. Optimistic instant UI update
    setStudents(prev => prev.filter(s => s.id !== studentId));
    // 2. Persist to Firestore and storage
    await OmranDataService.deleteStudent(studentId);
    const updatedSeq = await OmranDataService.loadStudents();
    setStudents(updatedSeq);
    return true;
  };

  // 4. Toggle Student Registration
  const handleToggleRegistration = async () => {
    const newSettings: AppSettings = {
      ...settings,
      allowStudentRegistration: !settings.allowStudentRegistration
    };
    setSettings(newSettings);
    await OmranDataService.saveSettings(newSettings);
  };

  // 5. Trigger AI Plan for specific student
  const handleTriggerAIPlan = async (student: Student) => {
    try {
      const res = await fetch('/api/gemini/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student })
      });
      const data = await res.json();
      if (data?.plan) {
        const updatedStudent: Student = {
          ...student,
          aiPlan: {
            ...data.plan,
            lastUpdated: new Date().toISOString()
          }
        };
        await OmranDataService.saveStudent(updatedStudent);
        const list = await OmranDataService.loadStudents();
        setStudents(list);
      }
    } catch (e) {
      console.error('Trigger AI plan error:', e);
    }
  };

  // 6. Save Attendance
  const handleSaveAttendance = async (records: AttendanceRecord[]) => {
    await OmranDataService.saveAttendanceRecords(records);
    const list = await OmranDataService.loadAttendance();
    setAttendance(list);
  };

  // 7. Save Evaluation & dynamically update student's current position (where student reached)
  const handleSaveEvaluation = async (evaluation: StudentEvaluation) => {
    await OmranDataService.saveEvaluation(evaluation);
    const list = await OmranDataService.loadEvaluations();
    setEvaluations(list);

    // If today recitation contains a new memorization portion, update the student's currentSurah and currentAyah
    const todayNew = evaluation.recitationDetails?.todayNewItem;
    if (todayNew && todayNew.surahNumber) {
      const targetStudent = students.find(s => s.id === evaluation.studentId);
      if (targetStudent) {
        const finalSurahNum = todayNew.toSurahNumber || todayNew.surahNumber;
        const finalSurahName = todayNew.toSurahName || todayNew.surahName || getSurahInfo(finalSurahNum).name;
        const finalAyah = todayNew.toAyah || todayNew.fromAyah || 1;

        const updatedStudent: Student = {
          ...targetStudent,
          currentSurah: finalSurahNum,
          currentSurahName: finalSurahName,
          currentAyah: finalAyah
        };

        await OmranDataService.saveStudent(updatedStudent);
        const updatedStudentsList = await OmranDataService.loadStudents();
        setStudents(updatedStudentsList);
      }
    }
  };

  // 8. Update Criteria
  const handleSaveCriteria = async (list: EvaluationCriteria[]) => {
    setCriteria(list);
    await OmranDataService.saveCriteriaList(list);
  };

  const handleDeleteCriteria = async (id: string) => {
    await OmranDataService.deleteCriteria(id);
    const list = await OmranDataService.loadCriteria();
    setCriteria(list);
  };

  // 9. Update Student AI Plan Assignment & Position
  const handleUpdateStudentAIPlan = async (
    studentId: string,
    newAssignment: any,
    updatedPosition?: { surahNumber: number; surahName: string; ayah: number }
  ) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updatedStudent: Student = {
      ...student,
      currentSurah: updatedPosition?.surahNumber ?? student.currentSurah,
      currentSurahName: updatedPosition?.surahName ?? student.currentSurahName,
      currentAyah: updatedPosition?.ayah ?? student.currentAyah,
      persistentReviewItems: newAssignment?.reviewItems || student.persistentReviewItems,
      aiPlan: {
        roadmapSummary: student.aiPlan?.roadmapSummary || 'خطة الحفظ والمراجعة التراكمية',
        difficultyAdjustment: student.aiPlan?.difficultyAdjustment || 'وتيرة متوازنة',
        estimatedDaysToFinishJuz: student.aiPlan?.estimatedDaysToFinishJuz || 30,
        currentDailyAssignment: newAssignment,
        lastUpdated: new Date().toISOString()
      }
    };

    await OmranDataService.saveStudent(updatedStudent);
    const list = await OmranDataService.loadStudents();
    setStudents(list);
  };

  // 10. Update Settings
  const handleUpdateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await OmranDataService.saveSettings(newSettings);
  };

  // 11. Send Chat
  const handleSendChatMessage = async (msg: ChatMessage) => {
    await OmranDataService.saveChatMessage(msg);
    const list = await OmranDataService.loadChats();
    setChatHistory(list);
  };

  const handleClearChat = async () => {
    await OmranDataService.clearChats();
    setChatHistory([]);
  };

  // 12. Violation Handlers
  const handleSaveViolation = async (violation: BehaviorViolation) => {
    setViolations(prev => {
      const idx = prev.findIndex(v => v.id === violation.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = violation;
        return copy;
      }
      return [violation, ...prev];
    });
    await OmranDataService.saveViolation(violation);
  };

  const handleDeleteViolation = async (id: string) => {
    setViolations(prev => prev.filter(v => v.id !== id));
    await OmranDataService.deleteViolation(id);
  };

  // 13. Exam Handlers
  const handleSaveExam = async (exam: Exam) => {
    setExams(prev => {
      const idx = prev.findIndex(e => e.id === exam.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = exam;
        return copy;
      }
      return [exam, ...prev];
    });
    await OmranDataService.saveExam(exam);
  };

  const handleDeleteExam = async (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
    await OmranDataService.deleteExam(id);
  };

  const handleSaveSubmission = async (sub: ExamSubmission) => {
    setSubmissions(prev => {
      const idx = prev.findIndex(s => s.id === sub.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = sub;
        return copy;
      }
      return [sub, ...prev];
    });
    await OmranDataService.saveSubmission(sub);
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    setSubmissions(prev => prev.filter(s => s.id !== submissionId));
    await OmranDataService.deleteSubmission(submissionId);
  };

  // Recordings Handlers
  const handleSaveRecording = async (rec: SurahRecording) => {
    setRecordings(prev => {
      const idx = prev.findIndex(r => r.id === rec.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = rec;
        return copy;
      }
      return [rec, ...prev];
    });
    await OmranDataService.saveRecording(rec);
  };

  const handleDeleteRecording = async (recId: string) => {
    setRecordings(prev => prev.filter(r => r.id !== recId));
    await OmranDataService.deleteRecording(recId);
  };

  const handleSaveRecordingsConfig = async (cfg: RecordingsConfig) => {
    setRecordingsConfig(cfg);
    await OmranDataService.saveRecordingsConfig(cfg);
  };

  const handleSaveLeaderboardSettings = async (settings: LeaderboardSettings) => {
    setLeaderboardSettings(settings);
    await OmranDataService.saveLeaderboardSettings(settings);
  };

  const handleRefreshGoogleAuth = async () => {
    const cfg = await OmranDataService.loadGoogleOAuthConfig();
    setGoogleAuthConfig(cfg);
  };

  // 14. Complexes Handlers (المجمعات القرآنية)
  const handleSaveComplex = async (complex: QuranComplex) => {
    await OmranDataService.saveComplex(complex);
    const list = await OmranDataService.loadComplexes();
    setComplexes(list);
  };

  const handleDeleteComplex = async (complexId: string) => {
    await OmranDataService.deleteComplex(complexId);
    const list = await OmranDataService.loadComplexes();
    setComplexes(list);
    const hList = await OmranDataService.loadHalaqahs();
    setHalaqahs(hList);
  };

  // 15. Navigation Handlers
  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab);
  };

  const handleSelectStudentForEval = (studentId: string) => {
    setTargetStudentForEval(studentId);
    setActiveTab('evaluation');
  };

  const handleNavigateToWhatsApp = (studentId: string) => {
    setTargetStudentForWhatsApp(studentId);
    setActiveTab('parents');
  };

  const handleNavigateToBehavior = (studentId: string) => {
    setTargetStudentForBehavior(studentId);
    setActiveTab('behavior');
  };

  // If URL contains portal query param or logged in as student:
  const activePortalStudent = portalStudentId
    ? directPortalStudent ||
      students.find(
        s =>
          s.id === portalStudentId ||
          s.id.toLowerCase() === portalStudentId.toLowerCase() ||
          s.name.trim() === portalStudentId.trim() ||
          s.name.replace(/\s+/g, '') === portalStudentId.replace(/\s+/g, '') ||
          s.phone.replace(/\D/g, '') === portalStudentId.replace(/\D/g, '') ||
          (s.parentPhones && s.parentPhones.some(p => p.replace(/\D/g, '') === portalStudentId.replace(/\D/g, '')))
      )
    : currentUser?.role === 'student'
    ? students.find(s => s.id === currentUser.studentId || s.name === currentUser.username)
    : null;

  // 1. Universal Blocking Cloud Loading & Verification Screen (Load-Before-Render)
  if (isLoadingData) {
    return (
      <CloudLoadingScreen
        onRetry={loadAllData}
        onForceEnter={() => setIsLoadingData(false)}
      />
    );
  }

  // 2. Direct Student / Parent Portal View
  if (activePortalStudent) {
    if (!isStudentAssigned(activePortalStudent)) {
      return (
        <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] font-sans selection:bg-[#fbbf24] selection:text-[#064e3b]" dir="rtl">
          <AnimatedBackground />
          <UnassignedStudentView
            studentName={activePortalStudent.name}
            studentPhone={activePortalStudent.phone}
            onRefresh={loadAllData}
            onLogout={handleLogout}
            settings={settings}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] font-sans selection:bg-[#fbbf24] selection:text-[#064e3b]" dir="rtl">
        <AnimatedBackground />
        <ParentPortalView
          student={activePortalStudent}
          attendance={attendance}
          evaluations={evaluations}
          settings={settings}
          violations={violations}
          exams={exams}
          submissions={submissions}
          students={students}
          halaqahs={halaqahs}
          leaderboardSettings={leaderboardSettings || undefined}
          recordings={recordings}
          recordingsConfig={recordingsConfig}
          isLoggedInStudent={!!currentUser}
          onLogout={handleLogout}
          onSaveSubmission={handleSaveSubmission}
        />
      </div>
    );
  }

  // 3. If Portal Link was invalid / not found after data loaded
  if (portalStudentId && !isLoadingData && !activePortalStudent) {
    return (
      <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] font-sans flex flex-col items-center justify-center p-6" dir="rtl">
        <AnimatedBackground />
        <div className="relative z-10 text-center space-y-5 max-w-md bg-[#064e3b]/90 border border-amber-500/40 p-8 rounded-[32px] backdrop-blur-md shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-[#fbbf24] flex items-center justify-center mx-auto border border-amber-500/30">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-white">لم يتم العثور على ملف الطالب</h2>
            <p className="text-xs text-[#86efac]/90 mt-2 leading-relaxed">
              تعذر العثور على سجل الطالب بالمعرّف المرفق. قد يكون تم تحديث السجل أو تعديل بيانات الحلقة.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                setPortalStudentId(null);
                window.history.replaceState({}, '', window.location.pathname);
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#fbbf24] text-[#064e3b] font-black text-xs hover:bg-[#f59e0b] shadow-lg cursor-pointer transition-all"
            >
              الذهاب إلى البوابة الرئيسية
            </button>
            <button
              onClick={() => loadAllData()}
              className="py-3 px-4 rounded-2xl bg-[#022c22] text-[#86efac] font-bold text-xs border border-[#065f46] hover:text-white cursor-pointer"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If not logged in, show Login / Register Modal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] font-sans selection:bg-[#fbbf24] selection:text-[#064e3b]" dir="rtl">
        <AnimatedBackground />
        <LoginModal
          onLoginSuccess={handleLoginSuccess}
          onRegisterStudent={handleAddStudent}
          students={students}
          teachers={teachers}
          settings={settings}
        />
      </div>
    );
  }

  // If user is a teacher with no assigned halaqah yet:
  if (currentUser?.role === 'admin' && !isSupervisor && assignedHalaqahs.length === 0) {
    return (
      <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] font-sans selection:bg-[#fbbf24] selection:text-[#064e3b]" dir="rtl">
        <AnimatedBackground />
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          settings={settings}
          studentsCount={0}
          teachersCount={scopedTeachers.length}
          complexesCount={isDeveloper ? complexes.length : 1}
          complexName={supervisedComplex?.name}
          halaqahs={scopedHalaqahs}
          assignedHalaqahs={[]}
          isSupervisor={false}
          isDeveloper={isDeveloper}
          activeHalaqahId=""
          onSwitchHalaqah={() => {}}
          onOpenTeacherManagement={() => setIsSettingsModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />
        <main className="max-w-4xl mx-auto px-4 py-8 relative">
          <UnassignedTeacherView
            teacherName={currentTeacher?.name || currentUser.username}
            onRefresh={loadAllData}
            onLogout={handleLogout}
            settings={settings}
          />
        </main>
      </div>
    );
  }

  // Navigation Items for Admin/Teacher
  // Recordings, Accounts/Ranks Management, and Backup are strictly restricted to Programmer (Mohamed Montaser)
  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'students', label: 'الطلاب والتسجيل', icon: Users, badge: displayedStudents.length },
    { id: 'attendance', label: 'الحضور والغياب', icon: UserCheck },
    { id: 'evaluation', label: 'تقييم التسميع', icon: BookOpen },
    { id: 'exams', label: 'قسم الاختبارات', icon: FileText, badge: scopedExams.length > 0 ? scopedExams.length : undefined },
    ...(isDeveloper ? [
      { id: 'recordings', label: 'مقاطع التلاوة والواجبات', icon: Headphones, badge: recordings.length > 0 ? recordings.length : undefined },
      { id: 'accounts', label: 'إدارة الحسابات والرتب', icon: UserCog, badge: teachers.length }
    ] : []),
    { id: 'behavior', label: 'المخالفات السلوكية', icon: ShieldAlert, badge: displayedViolations.length > 0 ? displayedViolations.length : undefined },
    { id: 'parents', label: 'رسائل الواتساب', icon: MessageCircle },
    { id: 'reports', label: 'التقارير الدورية', icon: Award },
    ...(isDeveloper ? [
      { id: 'backup', label: 'النسخ الاحتياطي', icon: Database }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] font-sans selection:bg-[#fbbf24] selection:text-[#064e3b] pb-12" dir="rtl">
      <AnimatedBackground />

      {/* Main Navbar with Settings Button & Halaqah Selector */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        settings={settings}
        studentsCount={displayedStudents.length}
        teachersCount={scopedTeachers.length}
        complexesCount={isDeveloper ? complexes.length : 1}
        complexName={supervisedComplex?.name}
        halaqahs={scopedHalaqahs}
        assignedHalaqahs={assignedHalaqahs}
        isSupervisor={isSupervisor}
        isDeveloper={isDeveloper}
        activeHalaqahId={activeHalaqahId}
        onSwitchHalaqah={setActiveHalaqahId}
        onOpenTeacherManagement={() => setIsSettingsModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenComplexManagement={isDeveloper ? () => setIsComplexModalOpen(true) : undefined}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 relative space-y-6">
        {/* Active Halaqah Header & Switcher Banner */}
        <div className="bg-gradient-to-r from-[#064e3b] via-[#022c22] to-[#064e3b] p-3.5 sm:p-4 rounded-2xl border border-[#065f46] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24] flex items-center justify-center shrink-0 shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#86efac] font-bold">الحلقة الحالية:</span>
                <span className="text-sm sm:text-base font-extrabold text-white font-heading">
                  {activeHalaqahId === 'all'
                    ? (isDeveloper
                        ? `جميع الحلقات لكافة المجمعات (${displayedStudents.length} طالباً)`
                        : `جميع حلقات ${supervisedComplex?.name || 'المجمع'} (${displayedStudents.length} طالباً)`)
                    : scopedHalaqahs.find(h => h.id === activeHalaqahId)?.name || 'الحلقة المختارة'}
                </span>
                {activeHalaqahId !== 'all' && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30 font-bold">
                    {displayedStudents.length} طلاب
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {isDeveloper
                  ? 'أنت في وضع المشرف العام والمبرمج: يمكنك الإشراف على كافة المجمعات والحلقات وإدارتها بالكامل.'
                  : isSupervisor
                  ? `أنت في وضع مشرف المجمع (${supervisedComplex?.name || 'المجمع'}): يمكنك التصفح بين حلقات مجمعك وإدارتها بالكامل دون الاطلاع على المجمعات الأخرى.`
                  : `أنت في وضع المعلم: يتم عرض طلاب وسجلات الحلقة المحددة فقط.`}
              </p>
            </div>
          </div>

          {/* Quick Switching Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap self-stretch sm:self-auto justify-end">
            {isSupervisor ? (
              <div className="flex items-center gap-1 bg-[#022c22] p-1 rounded-xl border border-[#065f46] flex-wrap">
                <button
                  onClick={() => setActiveHalaqahId('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeHalaqahId === 'all'
                      ? 'bg-[#fbbf24] text-[#064e3b] shadow-sm'
                      : 'text-[#86efac] hover:text-white'
                  }`}
                >
                  الكل
                </button>
                {scopedHalaqahs.map(h => (
                  <button
                    key={h.id}
                    onClick={() => setActiveHalaqahId(h.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeHalaqahId === h.id
                        ? 'bg-[#fbbf24] text-[#064e3b] shadow-sm'
                        : 'text-[#86efac] hover:text-white'
                    }`}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            ) : (
              assignedHalaqahs.length > 1 && (
                <div className="flex items-center gap-1.5 bg-[#022c22] p-1 rounded-xl border border-[#065f46]">
                  <span className="text-[10px] text-amber-300 font-bold px-1.5">تنقل بين حلقاتك:</span>
                  {assignedHalaqahs.map(h => (
                    <button
                      key={h.id}
                      onClick={() => setActiveHalaqahId(h.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeHalaqahId === h.id
                          ? 'bg-[#fbbf24] text-[#064e3b] shadow-sm'
                          : 'text-[#86efac] hover:text-white'
                      }`}
                    >
                      {h.name}
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none bg-[#064e3b]/80 p-1.5 rounded-2xl border border-[#065f46] backdrop-blur-md shadow-lg">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#fbbf24] text-[#064e3b] shadow-lg shadow-amber-950/40 font-black'
                    : 'text-[#86efac]/80 hover:text-white hover:bg-[#022c22]/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#064e3b]' : 'text-[#86efac]'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-[#064e3b]/20 text-[#064e3b] font-black' : 'bg-[#022c22] text-[#86efac]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Views */}
        {activeTab === 'home' && (
          <HomeTab
            students={displayedStudents}
            attendance={displayedAttendance}
            evaluations={displayedEvaluations}
            settings={settings}
            teachers={scopedTeachers}
            currentUserName={currentUser?.username}
            onNavigateTab={handleNavigateTab}
            onSelectStudentForEval={handleSelectStudentForEval}
            onOpenTeacherManagement={() => setIsSettingsModalOpen(true)}
          />
        )}

        {activeTab === 'students' && (
          <StudentsTab
            students={displayedStudents}
            settings={settings}
            halaqahs={scopedHalaqahs}
            activeHalaqahId={activeHalaqahId}
            isSupervisor={isSupervisor}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onToggleRegistration={handleToggleRegistration}
            onTriggerAIPlan={handleTriggerAIPlan}
            onTransferStudent={handleTransferStudent}
            onBatchTransferStudents={handleBatchTransferStudents}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTab
            students={assignedDisplayedStudents}
            attendanceRecords={displayedAttendance}
            onSaveAttendance={handleSaveAttendance}
          />
        )}

        {activeTab === 'evaluation' && (
          <EvaluationTab
            students={assignedDisplayedStudents}
            attendance={displayedAttendance}
            evaluations={displayedEvaluations}
            criteria={criteria}
            selectedStudentId={targetStudentForEval}
            onSaveEvaluation={handleSaveEvaluation}
            onSaveCriteria={handleSaveCriteria}
            onDeleteCriteria={handleDeleteCriteria}
            onUpdateStudentAIPlan={handleUpdateStudentAIPlan}
            onNavigateToWhatsApp={handleNavigateToWhatsApp}
            onNavigateToBehavior={handleNavigateToBehavior}
          />
        )}

        {activeTab === 'exams' && (
          <ExamsTab
            exams={scopedExams}
            submissions={scopedSubmissions}
            students={scopedStudents}
            halaqahs={scopedHalaqahs}
            currentUserId={currentUser?.teacherId || currentUser?.studentId || 'admin'}
            currentUserName={currentUser?.username || settings.teacherName}
            isSupervisor={isSupervisor}
            googleAuthConfig={googleAuthConfig}
            leaderboardSettings={leaderboardSettings || undefined}
            onSaveExam={handleSaveExam}
            onDeleteExam={handleDeleteExam}
            onSaveSubmission={handleSaveSubmission}
            onDeleteSubmission={handleDeleteSubmission}
            onSaveLeaderboardSettings={handleSaveLeaderboardSettings}
            onRefreshGoogleAuth={handleRefreshGoogleAuth}
          />
        )}

        {activeTab === 'recordings' && isDeveloper && (
          <RecordingsTab
            recordings={recordings}
            recordingsConfig={recordingsConfig}
            onSaveRecording={handleSaveRecording}
            onDeleteRecording={handleDeleteRecording}
            onSaveConfig={handleSaveRecordingsConfig}
          />
        )}

        {activeTab === 'accounts' && isDeveloper && (
          <AccountsTab
            teachers={teachers}
            students={students}
            halaqahs={halaqahs}
            onSaveTeacher={handleSaveTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onUpdateStudent={handleUpdateStudent}
          />
        )}

        {activeTab === 'behavior' && (
          <BehaviorTab
            students={assignedDisplayedStudents}
            violations={displayedViolations}
            settings={settings}
            teacherName={currentUser?.username || settings.teacherName}
            onSaveViolation={handleSaveViolation}
            onDeleteViolation={handleDeleteViolation}
            preselectedStudentId={targetStudentForBehavior}
          />
        )}

        {activeTab === 'parents' && (
          <ParentsWhatsAppTab
            students={assignedDisplayedStudents}
            attendance={displayedAttendance}
            evaluations={displayedEvaluations}
            settings={settings}
            preselectedStudentId={targetStudentForWhatsApp}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            students={assignedDisplayedStudents}
            attendance={displayedAttendance}
            evaluations={displayedEvaluations}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeTab === 'backup' && isDeveloper && (
          <DataBackupTab
            onRefreshAllData={loadAllData}
            googleAuthConfig={googleAuthConfig}
            onRefreshGoogleAuth={handleRefreshGoogleAuth}
            isSupervisor={isSupervisor}
            isDeveloper={isDeveloper}
            complexes={complexes}
            onSaveComplex={handleSaveComplex}
          />
        )}
      </main>

      {/* Comprehensive Settings Modal (Teachers, Halaqahs, Student Transfer) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        teachers={scopedTeachers}
        halaqahs={scopedHalaqahs}
        students={scopedStudents}
        settings={settings}
        complexes={scopedComplexes}
        isDeveloper={isDeveloper}
        complexName={supervisedComplex?.name}
        activeHalaqahId={activeHalaqahId}
        onSaveTeacher={handleSaveTeacher}
        onDeleteTeacher={handleDeleteTeacher}
        onSaveHalaqah={handleSaveHalaqah}
        onDeleteHalaqah={handleDeleteHalaqah}
        onTransferStudent={handleTransferStudent}
        onBatchTransferStudents={handleBatchTransferStudents}
        onSwitchActiveHalaqah={setActiveHalaqahId}
      />

      {/* Programmer Complex Management Modal (إدارة المجمعات القرآنية) - مقتصر على المبرمج محمد منتصر */}
      {isDeveloper && (
        <ComplexManagementModal
          isOpen={isComplexModalOpen}
          onClose={() => setIsComplexModalOpen(false)}
          complexes={complexes}
          halaqahs={halaqahs}
          teachers={teachers}
          students={students}
          onSaveComplex={handleSaveComplex}
          onDeleteComplex={handleDeleteComplex}
          onSaveHalaqah={handleSaveHalaqah}
          onSaveTeacher={handleSaveTeacher}
        />
      )}
    </div>
  );
}

export default App;
