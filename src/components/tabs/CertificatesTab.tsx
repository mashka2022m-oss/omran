import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Award,
  Download,
  Share2,
  Printer,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Eye,
  Sliders,
  Type,
  Palette,
  ChevronLeft,
  ChevronRight,
  Send,
  Copy,
  Users,
  Search,
  BookOpen,
  Calendar,
  Layers,
  X,
  FileText
} from 'lucide-react';
import {
  Student,
  Halaqah,
  AppSettings,
  CustomCertificateTemplate,
  CertificateOccasion,
  getStudentParentPhone
} from '../../types';
import { QURAN_SURAHS, getSurahInfo } from '../../data/quranData';
import { OmranDataService, OMRAN_CACHE_KEYS, getLocalCache } from '../../lib/firebase';

interface CertificatesTabProps {
  students: Student[];
  halaqahs: Halaqah[];
  settings: AppSettings;
  currentUserName: string;
  isSupervisor: boolean;
  isDeveloper: boolean;
  activeHalaqahId?: string;
  onUpdateSettings?: (settings: AppSettings) => Promise<void>;
}

// 10 Distinctive Arabic Calligraphic Fonts
export const ARABIC_FONTS = [
  { id: 'Amiri', name: 'الأميري (نسخ قرآني كلاسيكي)', family: "'Amiri', serif" },
  { id: 'Cairo', name: 'القاهرة (عصري وواضح)', family: "'Cairo', sans-serif" },
  { id: 'Tajawal', name: 'تجوال (هندسي رشيق)', family: "'Tajawal', sans-serif" },
  { id: 'Almarai', name: 'المراعي (متزن ورسمي)', family: "'Almarai', sans-serif" },
  { id: 'Aref Ruqaa', name: 'عارف رقعة (رقعة تراثي فاخر)', family: "'Aref Ruqaa', serif" },
  { id: 'Scheherazade New', name: 'شهرزاد (نسخ أصيل)', family: "'Scheherazade New', serif" },
  { id: 'Reem Kufi', name: 'ريم كوفي (كوفي هندسي زخرفي)', family: "'Reem Kufi', sans-serif" },
  { id: 'Changa', name: 'تشانجا (عريض وقوي)', family: "'Changa', sans-serif" },
  { id: 'El Messiri', name: 'المسيري (فني أنيق ومميز)', family: "'El Messiri', sans-serif" },
  { id: 'Lateef', name: 'لطيف (نسخ شامي رشيق)', family: "'Lateef', serif" }
];

export const JUZ_NAMES = [
  { num: 30, name: 'الجزء الثلاثون (جزء عَمَّ)' },
  { num: 29, name: 'الجزء التاسع والعشرون (جزء تَبَارَك)' },
  { num: 28, name: 'الجزء الثامن والعشرون (جزء قَدْ سَمِعَ)' },
  { num: 27, name: 'الجزء السابع والعشرون (جزء الذَّارِيَات)' },
  { num: 26, name: 'الجزء السادس والعشرون (جزء الأَحْقَاف)' },
  { num: 25, name: 'الجزء الخامس والعشرون (جزء إِلَيْهِ يُرَدُّ)' },
  { num: 24, name: 'الجزء الرابع والعشرون (جزء فَمَنْ أَظْلَمُ)' },
  { num: 23, name: 'الجزء الثالث والعشرون (جزء وَمَا لِيَ)' },
  { num: 22, name: 'الجزء الثاني والعشرون (جزء وَمَنْ يَقْنُتْ)' },
  { num: 21, name: 'الجزء الحادي والعشرون (جزء اتْلُ مَا أُوحِيَ)' },
  { num: 20, name: 'الجزء العشرون (جزء أَمَّنْ خَلَقَ)' },
  { num: 19, name: 'الجزء التاسع عشر (جزء وَقَالَ الَّذِينَ)' },
  { num: 18, name: 'الجزء الثامن عشر (جزء قَدْ أَفْلَحَ)' },
  { num: 17, name: 'الجزء السابع عشر (جزء اقْتَرَبَ)' },
  { num: 16, name: 'الجزء السادس عشر (جزء قَالَ أَلَمْ)' },
  { num: 15, name: 'الجزء الخامس عشر (جزء سُبْحَانَ)' },
  { num: 14, name: 'الجزء الرابع عشر (جزء رُبَمَا)' },
  { num: 13, name: 'الجزء الثالث عشر (جزء وَمَا أُبَرِّئُ)' },
  { num: 12, name: 'الجزء الثاني عشر (جزء وَمَا مِنْ دَابَّةٍ)' },
  { num: 11, name: 'الجزء الحادي عشر (جزء يَعْتَذِرُونَ)' },
  { num: 10, name: 'الجزء العاشر (جزء وَاعْلَمُوا)' },
  { num: 9, name: 'الجزء التاسع (جزء قَالَ الْمَلَأُ)' },
  { num: 8, name: 'الجزء الثامن (جزء وَلَوْ أَنَّنَا)' },
  { num: 7, name: 'الجزء السابع (جزء وَإِذَا سَمِعُوا)' },
  { num: 6, name: 'الجزء السادس (جزء لَا يُحِبُّ اللَّهُ)' },
  { num: 5, name: 'الجزء الخامس (جزء وَالْمُحْصَنَاتُ)' },
  { num: 4, name: 'الجزء الرابع (جزء لَنْ تَنَالُوا)' },
  { num: 3, name: 'الجزء الثالث (جزء تِلْكَ الرُّسُلُ)' },
  { num: 2, name: 'الجزء الثاني (جزء سَيَقُولُ)' },
  { num: 1, name: 'الجزء الأول (جزء الم)' }
];

export const READY_MADE_TEMPLATES = [
  {
    id: 'platform_emerald_royal',
    name: 'القالب الملكي الزمردي',
    subtitle: 'الثيم الرسمي الفاخر لمنظومة عُمران',
    bgClass: 'bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#022c22]',
    borderClass: 'border-[#fbbf24]',
    textColor: '#ffffff',
    accentColor: '#fbbf24',
    isPlatform: true
  },
  {
    id: 'platform_imperial_gold',
    name: 'القالب الذهبي الأندلسي',
    subtitle: 'إطار ذهبي مزخرف بنقوش إسلامية رفيعة',
    bgClass: 'bg-gradient-to-br from-[#fffdf5] via-[#fef9c3] to-[#fef08a]',
    borderClass: 'border-[#b45309]',
    textColor: '#1c1917',
    accentColor: '#b45309',
    isPlatform: true
  },
  {
    id: 'platform_classic_heritage',
    name: 'القالب التراثي الكلاسيكي',
    subtitle: 'تصميم عريق باللون الأبيض العاجي والذهب المعتق',
    bgClass: 'bg-[#fffefb]',
    borderClass: 'border-[#064e3b]',
    textColor: '#064e3b',
    accentColor: '#d97706',
    isPlatform: true
  },
  {
    id: 'platform_celestial_sapphire',
    name: 'القالب الكحلي القرآني',
    subtitle: 'درجات الأزرق الملكي مع لمسات ذهبية براقة',
    bgClass: 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]',
    borderClass: 'border-[#fbbf24]',
    textColor: '#ffffff',
    accentColor: '#38bdf8',
    isPlatform: true
  }
];

export const CertificatesTab: React.FC<CertificatesTabProps> = ({
  students,
  halaqahs,
  settings,
  currentUserName,
  isSupervisor,
  isDeveloper,
  activeHalaqahId,
  onUpdateSettings
}) => {
  // Navigation Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<'issue' | 'builder' | 'templates'>('issue');

  // Load custom templates (Dual persistence)
  const [customTemplates, setCustomTemplates] = useState<CustomCertificateTemplate[]>(() => {
    return getLocalCache<CustomCertificateTemplate[]>('omran_certificates_templates', []);
  });

  // Save custom templates to local cache & cloud settings
  const saveCustomTemplates = async (updated: CustomCertificateTemplate[]) => {
    setCustomTemplates(updated);
    localStorage.setItem('omran_certificates_templates', JSON.stringify(updated));
    if (onUpdateSettings) {
      try {
        await onUpdateSettings({
          ...settings,
          customCertificatesTemplates: updated
        } as any);
      } catch (err) {
        console.warn('Failed to sync certificate templates to settings:', err);
      }
    }
  };

  // Sync from settings if available
  useEffect(() => {
    const fromSettings = (settings as any)?.customCertificatesTemplates;
    if (Array.isArray(fromSettings) && fromSettings.length > 0) {
      setCustomTemplates(fromSettings);
      localStorage.setItem('omran_certificates_templates', JSON.stringify(fromSettings));
    }
  }, [settings]);

  // ---------------------------------------------------------------------------
  // TRACK 1: ISSUE CERTIFICATES STATE
  // ---------------------------------------------------------------------------
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedHalaqahFilter, setSelectedHalaqahFilter] = useState<string>(activeHalaqahId || 'all');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('platform_emerald_royal');
  const [occasion, setOccasion] = useState<CertificateOccasion>('شكر وتقدير وتميز');
  const [selectedJuz, setSelectedJuz] = useState<number>(30);
  const [selectedSurahNum, setSelectedSurahNum] = useState<number>(78);
  const [examName, setExamName] = useState<string>('اختبار القرآن الكريم الفصلي');
  const [examScore, setExamScore] = useState<string>('ممتاز مع مرتبة الشرف');
  const [customOccasionText, setCustomOccasionText] = useState<string>('');

  // Signatures configuration
  const [signatureMode, setSignatureMode] = useState<'auto' | 'custom' | 'none'>('auto');
  const [customTeacherName, setCustomTeacherName] = useState<string>(settings.teacherName || currentUserName || '');
  const [customSupervisorName, setCustomSupervisorName] = useState<string>(isSupervisor ? currentUserName : 'المشرف العام');

  // Live preview & generated certificates modal
  const [isGeneratedModalOpen, setIsGeneratedModalOpen] = useState(false);
  const [previewStudentIndex, setPreviewStudentIndex] = useState(0);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // TRACK 2: CUSTOM TEMPLATE BUILDER STATE
  // ---------------------------------------------------------------------------
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [builderName, setBuilderName] = useState('');
  const [builderImage, setBuilderImage] = useState<string | null>(null);
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [builderSuccess, setBuilderSuccess] = useState<string | null>(null);

  // Floating Student Name Settings
  const [namePosX, setNamePosX] = useState<number>(50); // percentage 0-100
  const [namePosY, setNamePosY] = useState<number>(50); // percentage 0-100
  const [nameFontSize, setNameFontSize] = useState<number>(36);
  const [nameFontFamily, setNameFontFamily] = useState<string>('Amiri');
  const [nameColor, setNameColor] = useState<string>('#064e3b');
  const [nameTextAlign, setNameTextAlign] = useState<'center' | 'right' | 'left'>('center');
  const [nameFontWeight, setNameFontWeight] = useState<'normal' | 'bold' | '900'>('bold');
  const [testStudentName, setTestStudentName] = useState('محمد عبد الرحمن المنصور');

  // Floating Date Settings
  const [showDateOnCert, setShowDateOnCert] = useState<boolean>(true);
  const [datePosX, setDatePosX] = useState<number>(20);
  const [datePosY, setDatePosY] = useState<number>(85);
  const [dateFontSize, setDateFontSize] = useState<number>(14);
  const [dateFontFamily, setDateFontFamily] = useState<string>('Cairo');
  const [dateColor, setDateColor] = useState<string>('#4b5563');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const certificatePrintRef = useRef<HTMLDivElement | null>(null);

  // Filter students based on halaqah and search
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchHalaqah = selectedHalaqahFilter === 'all' || s.halaqahId === selectedHalaqahFilter;
      const matchSearch = !studentSearch.trim() || s.name.toLowerCase().includes(studentSearch.trim().toLowerCase());
      return matchHalaqah && matchSearch;
    });
  }, [students, selectedHalaqahFilter, studentSearch]);

  // Selected students objects
  const targetStudents = useMemo(() => {
    return students.filter(s => selectedStudentIds.includes(s.id));
  }, [students, selectedStudentIds]);

  // Selected template object
  const activeTemplate = useMemo(() => {
    const ready = READY_MADE_TEMPLATES.find(t => t.id === selectedTemplateId);
    if (ready) return { type: 'ready' as const, data: ready };
    const custom = customTemplates.find(t => t.id === selectedTemplateId);
    if (custom) return { type: 'custom' as const, data: custom };
    return { type: 'ready' as const, data: READY_MADE_TEMPLATES[0] };
  }, [selectedTemplateId, customTemplates]);

  // Today dates
  const todayArabic = useMemo(() => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date());
  }, []);

  const todayGregorian = useMemo(() => {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  }, []);

  // Format Occasion Text
  const getOccasionDescription = () => {
    if (occasion === 'شكر وتقدير وتميز') {
      return 'لِتَفَوُّقِهِ وَانْضِبَاطِهِ المُتَمَيِّزِ فِي حِلْقَةِ القُرْآنِ الكَرِيمِ، وَحُسْنِ خُلُقِهِ وَمُوَاظَبَتِهِ عَلَى تِلَاوَةِ كِتَابِ اللهِ تَعَالَى';
    }
    if (occasion === 'إتمام جزء من القرآن الكريم') {
      const juzObj = JUZ_NAMES.find(j => j.num === selectedJuz);
      return `لإِتْمَامِهِ حِفْظَ وَإِتْقَانَ (${juzObj?.name || `الجزء ${selectedJuz}`}) كَامِلاً بِمَشِيئَةِ اللهِ وَعَوْنِهِ بِمُسْتَوَى رَفِيعٍ`;
    }
    if (occasion === 'إتمام سورة من القرآن الكريم') {
      const sInfo = getSurahInfo(selectedSurahNum);
      return `لإِتْمَامِهِ حِفْظَ وَتَسْمِيعَ (سُورَةِ ${sInfo.name}) كَامِلَةً مُتْقَنَةً بِأَحْكَامِ التَّجْوِيدِ`;
    }
    if (occasion === 'اجتياز اختبار قرآني') {
      return `لاِجْتِيَازِهِ بِجَدَارَةٍ (${examName}) بِتَقْدِيرِ (${examScore})، نَسْأَلُ اللهَ أَنْ يَنْفَعَ بِهِ الإِسْلَامَ وَالمُسْلِمِينَ`;
    }
    if (occasion === 'مواظبة وانضباط قرآني') {
      return 'لِالْتِزَامِهِ المُسْتَمِرِّ وَحُضُورِهِ النَّمُوذَجِيِّ وَانْضِبَاطِهِ الرَّفِيعِ فِي جَمِيعِ أَيَّامِ الحِلْقَةِ القُرْآنِيَّةِ';
    }
    return customOccasionText.trim() || 'لِتَمَيُّزِهِ وَاجْتِهَادِهِ فِي حِلْقَةِ القُرْآنِ الكَرِيمِ وَحِفْظِ كِتَابِ اللهِ';
  };

  // Handle Multi-Select helpers
  const handleSelectAllFiltered = () => {
    const allIds = filteredStudents.map(s => s.id);
    const newSelected = Array.from(new Set([...selectedStudentIds, ...allIds]));
    setSelectedStudentIds(newSelected);
  };

  const handleDeselectAllFiltered = () => {
    const filteredIds = new Set(filteredStudents.map(s => s.id));
    setSelectedStudentIds(selectedStudentIds.filter(id => !filteredIds.has(id)));
  };

  const toggleStudentSelection = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(i => i !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  // ---------------------------------------------------------------------------
  // UPLOAD CUSTOM TEMPLATE HANDLER (STRICT 5MB LIMIT)
  // ---------------------------------------------------------------------------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuilderError(null);
    setBuilderSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 5MB limit validation as specified by user
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE_BYTES) {
      setBuilderError('حجم صورة الشهادة يتجاوز الحد الأقصى المسموح به (5 ميجابايت). يرجى اختيار صورة بدقة مناسبة لا تتجاوز 5 ميجا.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      setBuilderError('يرجى اختيار ملف صورة صالح (PNG, JPG, JPEG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBuilderImage(reader.result as string);
      if (!builderName.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        setBuilderName(`نموذج ${cleanName}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Custom Template
  const handleSaveCustomTemplate = async () => {
    setBuilderError(null);
    setBuilderSuccess(null);

    if (!builderImage) {
      setBuilderError('يرجى رفع صورة قالب الشهادة أولاً.');
      return;
    }

    if (!builderName.trim()) {
      setBuilderError('يرجى تسمية النموذج لحفظه في قائمة النماذج.');
      return;
    }

    // Check maximum 5 custom templates per complex
    if (!editingTemplateId && customTemplates.length >= 5) {
      setBuilderError('تم الوصول للحد الأقصى المسموح به للنماذج (5 نماذج لكل مجمع). يمكنك تعديل أو حذف أحد النماذج السابقة لإضافة نموذج جديد.');
      return;
    }

    const newTemplate: CustomCertificateTemplate = {
      id: editingTemplateId || `custom_tpl_${Date.now()}`,
      complexId: settings.complexName || 'main_complex',
      halaqahId: activeHalaqahId,
      name: builderName.trim(),
      imageUrl: builderImage,
      studentNamePosition: {
        x: namePosX,
        y: namePosY,
        fontSize: nameFontSize,
        fontFamily: nameFontFamily,
        color: nameColor,
        textAlign: nameTextAlign,
        fontWeight: nameFontWeight
      },
      showDate: showDateOnCert,
      datePosition: {
        x: datePosX,
        y: datePosY,
        fontSize: dateFontSize,
        fontFamily: dateFontFamily,
        color: dateColor,
        textAlign: 'center'
      },
      createdByTeacherName: currentUserName,
      createdAt: new Date().toISOString()
    };

    let updated: CustomCertificateTemplate[];
    if (editingTemplateId) {
      updated = customTemplates.map(t => (t.id === editingTemplateId ? newTemplate : t));
    } else {
      updated = [...customTemplates, newTemplate];
    }

    await saveCustomTemplates(updated);
    setBuilderSuccess('تم حفظ النموذج بنجاح وإدراجه في قائمة النماذج المتاحة للمجمع والحلقة!');
    setEditingTemplateId(null);
    setBuilderImage(null);
    setBuilderName('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Automatically switch to Issue tab and select this template
    setSelectedTemplateId(newTemplate.id);
    setTimeout(() => {
      setActiveSubTab('issue');
    }, 1200);
  };

  // Edit existing custom template
  const handleEditTemplate = (tpl: CustomCertificateTemplate) => {
    setEditingTemplateId(tpl.id);
    setBuilderName(tpl.name);
    setBuilderImage(tpl.imageUrl);
    setNamePosX(tpl.studentNamePosition.x);
    setNamePosY(tpl.studentNamePosition.y);
    setNameFontSize(tpl.studentNamePosition.fontSize);
    setNameFontFamily(tpl.studentNamePosition.fontFamily);
    setNameColor(tpl.studentNamePosition.color);
    setNameTextAlign(tpl.studentNamePosition.textAlign);
    setNameFontWeight(tpl.studentNamePosition.fontWeight || 'bold');
    setShowDateOnCert(!!tpl.showDate);
    if (tpl.datePosition) {
      setDatePosX(tpl.datePosition.x);
      setDatePosY(tpl.datePosition.y);
      setDateFontSize(tpl.datePosition.fontSize);
      setDateFontFamily(tpl.datePosition.fontFamily);
      setDateColor(tpl.datePosition.color);
    }
    setActiveSubTab('builder');
  };

  // Delete custom template
  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا النموذج؟')) return;
    const updated = customTemplates.filter(t => t.id !== id);
    await saveCustomTemplates(updated);
    if (selectedTemplateId === id) {
      setSelectedTemplateId('platform_emerald_royal');
    }
  };

  // ---------------------------------------------------------------------------
  // EXPORT AND DOWNLOAD HANDLERS
  // ---------------------------------------------------------------------------
  // Download single certificate as high-res PNG image
  const handleDownloadSinglePNG = async (student: Student, index: number) => {
    const certElement = document.getElementById(`cert-rendered-${student.id}`) ||
                        document.getElementById('cert-single-preview');
    if (!certElement) return;

    try {
      // Use Canvas to draw the certificate
      const canvas = document.createElement('canvas');
      const width = 1200;
      const height = 850;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // If custom template with background image:
      if (activeTemplate.type === 'custom') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = activeTemplate.data.imageUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        ctx.drawImage(img, 0, 0, width, height);

        // Draw student name
        const pos = activeTemplate.data.studentNamePosition;
        ctx.font = `${pos.fontWeight || 'bold'} ${pos.fontSize * 1.5}px ${pos.fontFamily || 'Amiri'}`;
        ctx.fillStyle = pos.color || '#064e3b';
        ctx.textAlign = pos.textAlign || 'center';
        const px = (pos.x / 100) * width;
        const py = (pos.y / 100) * height;
        ctx.fillText(student.name, px, py);

        // Draw date if enabled
        if (activeTemplate.data.showDate && activeTemplate.data.datePosition) {
          const dPos = activeTemplate.data.datePosition;
          ctx.font = `${dPos.fontSize * 1.5}px ${dPos.fontFamily || 'Cairo'}`;
          ctx.fillStyle = dPos.color || '#4b5563';
          ctx.textAlign = dPos.textAlign || 'center';
          ctx.fillText(todayArabic, (dPos.x / 100) * width, (dPos.y / 100) * height);
        }
      } else {
        // Draw ready-made certificate directly
        // Background
        const grad = ctx.createLinearGradient(0, 0, width, height);
        if (activeTemplate.data.id === 'platform_emerald_royal') {
          grad.addColorStop(0, '#022c22');
          grad.addColorStop(0.5, '#064e3b');
          grad.addColorStop(1, '#022c22');
        } else if (activeTemplate.data.id === 'platform_imperial_gold') {
          grad.addColorStop(0, '#fffdf5');
          grad.addColorStop(0.5, '#fef9c3');
          grad.addColorStop(1, '#fef08a');
        } else if (activeTemplate.data.id === 'platform_celestial_sapphire') {
          grad.addColorStop(0, '#0f172a');
          grad.addColorStop(0.5, '#1e293b');
          grad.addColorStop(1, '#0f172a');
        } else {
          grad.addColorStop(0, '#fffefb');
          grad.addColorStop(1, '#fffefb');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Golden Frame Borders
        ctx.lineWidth = 14;
        ctx.strokeStyle = activeTemplate.data.accentColor;
        ctx.strokeRect(30, 30, width - 60, height - 60);

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff44';
        ctx.strokeRect(45, 45, width - 90, height - 90);

        // Header Title
        ctx.fillStyle = activeTemplate.data.accentColor;
        ctx.textAlign = 'center';
        ctx.font = "bold 26px 'Amiri', serif";
        ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', width / 2, 90);

        ctx.font = "bold 20px 'Amiri', serif";
        ctx.fillText('﴿ يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ ﴾', width / 2, 130);

        ctx.font = "900 46px 'Cairo', sans-serif";
        ctx.fillStyle = activeTemplate.data.accentColor;
        ctx.fillText('شَهَادَةُ تَمَيُّزٍ وَإِتْقَانٍ قُرْآنِيٍّ', width / 2, 210);

        ctx.font = "22px 'Cairo', sans-serif";
        ctx.fillStyle = activeTemplate.data.textColor;
        ctx.fillText('يَسُرُّ إِدَارَةَ الحِلْقَةِ أَنْ تَمْنَحَ هذِهِ الشَّهَادَةَ المُبَارَكَةَ لِلطَّالِبِ النَّجِيبِ:', width / 2, 280);

        // Student Name Prominently
        ctx.font = "bold 52px 'Amiri', serif";
        ctx.fillStyle = activeTemplate.data.accentColor;
        ctx.fillText(student.name, width / 2, 360);

        // Occasion Details
        ctx.font = "20px 'Cairo', sans-serif";
        ctx.fillStyle = activeTemplate.data.textColor;
        const occText = getOccasionDescription();
        ctx.fillText(occText, width / 2, 430);

        // Halaqah and Complex
        const halaqahName = student.halaqahName || settings.halaqahName;
        const complexName = settings.complexName || 'منظومة عُمران';
        ctx.font = "18px 'Cairo', sans-serif";
        ctx.fillText(`الحلقة: ${halaqahName} • ${complexName}`, width / 2, 500);

        // Date
        ctx.font = "16px 'Cairo', sans-serif";
        ctx.fillStyle = activeTemplate.data.textColor;
        ctx.fillText(`تاريخ الإصدار: ${todayArabic} • موافق ${todayGregorian}`, width / 2, 550);

        // Signatures
        if (signatureMode !== 'none') {
          const tName = signatureMode === 'custom' ? customTeacherName : (student.halaqahName ? `معلم ${student.halaqahName}` : settings.teacherName);
          const sName = signatureMode === 'custom' ? customSupervisorName : (settings.complexName ? `مشرف ${settings.complexName}` : 'المشرف العام');

          ctx.font = "bold 18px 'Cairo', sans-serif";
          ctx.fillText(`معلم الحلقة: ${tName}`, 220, 680);
          ctx.fillText(`المشرف: ${sName}`, width - 220, 680);
        }

        // Platform Seal (ONLY on platform templates)
        ctx.fillStyle = activeTemplate.data.accentColor;
        ctx.beginPath();
        ctx.arc(width / 2, 710, 48, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#064e3b';
        ctx.font = "bold 14px 'Cairo', sans-serif";
        ctx.fillText('منظومة عُمران', width / 2, 705);
        ctx.font = "bold 12px 'Cairo', sans-serif";
        ctx.fillText('معتمد إلكترونياً', width / 2, 725);
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `شهادة_${student.name.replace(/\s+/g, '_')}_${index + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('Error generating certificate image:', err);
    }
  };

  // Download all individual PDFs separately (triggers browser print / individual files)
  const handlePrintAllMergedPDF = () => {
    window.print();
  };

  const handlePrintSingleStudentPDF = (student: Student) => {
    // Print window focusing on this student's cert
    const prevTitle = document.title;
    document.title = `شهادة_${student.name}`;
    window.print();
    document.title = prevTitle;
  };

  // WhatsApp share to parent
  const handleSendWhatsApp = (student: Student) => {
    const parentPhone = getStudentParentPhone(student);
    const cleanPhone = parentPhone ? parentPhone.replace(/\D/g, '') : '';
    const occasionText = getOccasionDescription();
    const halaqahName = student.halaqahName || settings.halaqahName;

    const message = `السلام عليكم ورحمة الله وبركاته،
نزف إليكم أسمى آيات التهاني والتبريكات بمناسبة حصول ابنكم المتميز *(${student.name})* على شهادة شكر وتقدير وإتقان قرآني من حلقة: *${halaqahName}*.

🌟 *مناسبة التكريم:*
${occasionText}

نسأل الله تعالى أن يجعله من أهل القرآن الذين هم أهل الله وخاصته، وأن يثبته وينفع به والديه وأمته.
مع تحيات إدارة حلقة ${halaqahName} • ${settings.complexName || 'منظومة عمران'}`;

    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      navigator.clipboard.writeText(message);
      setCopiedNotification(`تم نسخ رسالة التهنئة الخاصة بالطالب (${student.name}) للحافظة بنجاح، لعدم وجود رقم هاتف مسجل لولي أمره.`);
      setTimeout(() => setCopiedNotification(null), 4000);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* --------------------------------------------------------------------- */}
      {/* Top Banner & Sub-Tabs Navigation                                      */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#022c22] to-[#064e3b] p-6 rounded-3xl border border-[#fbbf24]/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-1">
            <Award className="w-4 h-4 text-[#fbbf24]" />
            <span>نظام الشهادات والأوسمة القرآنية الرسمية</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
            إصدار وتصميم شهادات التميز والإتقان القرآني
          </h2>
          <p className="text-xs text-[#86efac]/90 mt-1 max-w-2xl leading-relaxed">
            استخراج شهادات الشكر، إتمام الأجزاء، حفظ السور، والاختبارات القرآنية بنماذج رسمية فاخرة أو رفع وتخصيص نماذج المجمع الخاصة بكل سهولة.
          </p>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex items-center gap-1.5 bg-[#022c22] p-1.5 rounded-2xl border border-[#065f46] shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('issue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'issue'
                ? 'bg-[#fbbf24] text-[#064e3b] font-black shadow-md'
                : 'text-[#86efac] hover:text-white hover:bg-[#064e3b]/50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>إصدار الشهادات</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingTemplateId(null);
              setBuilderImage(null);
              setBuilderName('');
              setActiveSubTab('builder');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'builder'
                ? 'bg-[#fbbf24] text-[#064e3b] font-black shadow-md'
                : 'text-[#86efac] hover:text-white hover:bg-[#064e3b]/50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>إعداد نموذج مخصص</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'templates'
                ? 'bg-[#fbbf24] text-[#064e3b] font-black shadow-md'
                : 'text-[#86efac] hover:text-white hover:bg-[#064e3b]/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>نماذجي ({customTemplates.length}/5)</span>
          </button>
        </div>
      </div>

      {copiedNotification && (
        <div className="p-4 rounded-2xl bg-emerald-900/90 text-emerald-100 border border-emerald-500 text-xs flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 1: ISSUE CERTIFICATES (READY-MADE OR CUSTOM)                   */}
      {/* ===================================================================== */}
      {activeSubTab === 'issue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Select Student(s) */}
            <div className="bg-[#022c22] p-5 rounded-3xl border border-[#065f46] shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#fbbf24] text-[#064e3b] font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <h3 className="text-base font-bold text-white font-heading">
                    تحديد الطلاب المستحقين للشهادة
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#86efac]">تم اختيار:</span>
                  <span className="font-bold text-[#fbbf24] bg-[#064e3b] px-2.5 py-0.5 rounded-full border border-[#065f46]">
                    {selectedStudentIds.length} من {students.length}
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#86efac] absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    placeholder="ابحث عن اسم الطالب..."
                    className="w-full bg-[#064e3b]/50 border border-[#065f46] rounded-2xl pr-9 pl-3 py-2 text-xs text-white outline-none focus:border-[#fbbf24]"
                  />
                </div>

                {halaqahs.length > 0 && (
                  <select
                    value={selectedHalaqahFilter}
                    onChange={e => setSelectedHalaqahFilter(e.target.value)}
                    className="w-full bg-[#064e3b]/50 border border-[#065f46] rounded-2xl px-3 py-2 text-xs text-white outline-none focus:border-[#fbbf24]"
                  >
                    <option value="all">كافة الحلقات القرآنية</option>
                    {halaqahs.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} {h.primaryTeacherName ? `(${h.primaryTeacherName})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#065f46]/50">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-[#fbbf24] hover:text-amber-300 font-bold cursor-pointer"
                  >
                    تحديد الكل المعروضين ({filteredStudents.length})
                  </button>
                  <span className="text-[#86efac]/40">•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllFiltered}
                    className="text-[#86efac]/70 hover:text-white cursor-pointer"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>

              {/* Scrollable Student Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                {filteredStudents.map(std => {
                  const isSelected = selectedStudentIds.includes(std.id);
                  return (
                    <div
                      key={std.id}
                      onClick={() => toggleStudentSelection(std.id)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 select-none ${
                        isSelected
                          ? 'bg-[#064e3b] border-[#fbbf24] text-white shadow-md'
                          : 'bg-[#022c22]/80 border-[#065f46]/70 text-[#86efac] hover:bg-[#064e3b]/30'
                      }`}
                    >
                      <div className="truncate text-xs">
                        <span className="font-bold block truncate">{std.name}</span>
                        <span className="text-[10px] opacity-75 truncate block">
                          {std.halaqahName || 'الحلقة'} • ص {std.currentAyah || 1}
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-[#fbbf24] text-[#064e3b] border-[#fbbf24]'
                            : 'border-[#065f46] text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Choose Occasion */}
            <div className="bg-[#022c22] p-5 rounded-3xl border border-[#065f46] shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#fbbf24] text-[#064e3b] font-black text-xs flex items-center justify-center">
                  2
                </div>
                <h3 className="text-base font-bold text-white font-heading">
                  مناسبة منح الشهادة والتكريم
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  'شكر وتقدير وتميز',
                  'إتمام جزء من القرآن الكريم',
                  'إتمام سورة من القرآن الكريم',
                  'اجتياز اختبار قرآني',
                  'مواظبة وانضباط قرآني',
                  'مناسبة مخصصة'
                ].map(occ => {
                  const isCur = occasion === occ;
                  return (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => setOccasion(occ as CertificateOccasion)}
                      className={`p-3 rounded-2xl text-xs font-bold border transition-all text-right cursor-pointer ${
                        isCur
                          ? 'bg-[#fbbf24] text-[#064e3b] border-[#fbbf24] shadow-md font-black'
                          : 'bg-[#064e3b]/30 border-[#065f46] text-[#86efac] hover:bg-[#064e3b]/60'
                      }`}
                    >
                      {occ}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic inputs based on occasion */}
              {occasion === 'إتمام جزء من القرآن الكريم' && (
                <div className="p-3.5 rounded-2xl bg-[#064e3b]/40 border border-[#065f46] space-y-2">
                  <label className="block text-xs font-bold text-[#fbbf24]">
                    اختر الجزء القرآني الذي أتم حفظه أو إتقانه:
                  </label>
                  <select
                    value={selectedJuz}
                    onChange={e => setSelectedJuz(Number(e.target.value))}
                    className="w-full bg-[#022c22] border border-[#065f46] rounded-xl p-2 text-xs text-white outline-none focus:border-[#fbbf24]"
                  >
                    {JUZ_NAMES.map(j => (
                      <option key={j.num} value={j.num}>
                        {j.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {occasion === 'إتمام سورة من القرآن الكريم' && (
                <div className="p-3.5 rounded-2xl bg-[#064e3b]/40 border border-[#065f46] space-y-2">
                  <label className="block text-xs font-bold text-[#fbbf24]">
                    اختر السورة الكريمة التي أتم حفظها:
                  </label>
                  <select
                    value={selectedSurahNum}
                    onChange={e => setSelectedSurahNum(Number(e.target.value))}
                    className="w-full bg-[#022c22] border border-[#065f46] rounded-xl p-2 text-xs text-white outline-none focus:border-[#fbbf24]"
                  >
                    {QURAN_SURAHS.map(s => (
                      <option key={s.number} value={s.number}>
                        {s.number}. سورة {s.name} ({s.numberOfAyahs} آية - {s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {occasion === 'اجتياز اختبار قرآني' && (
                <div className="p-3.5 rounded-2xl bg-[#064e3b]/40 border border-[#065f46] grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#fbbf24] mb-1">
                      اسم الاختبار القرآني:
                    </label>
                    <input
                      type="text"
                      value={examName}
                      onChange={e => setExamName(e.target.value)}
                      placeholder="مثلاً: اختبار جزء عم، اختبار أحكام النون..."
                      className="w-full bg-[#022c22] border border-[#065f46] rounded-xl p-2 text-xs text-white outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#fbbf24] mb-1">
                      الدرجة أو التقدير:
                    </label>
                    <input
                      type="text"
                      value={examScore}
                      onChange={e => setExamScore(e.target.value)}
                      placeholder="مثلاً: 100/100 (ممتاز مرتفع)"
                      className="w-full bg-[#022c22] border border-[#065f46] rounded-xl p-2 text-xs text-white outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                </div>
              )}

              {occasion === 'مناسبة مخصصة' && (
                <div className="p-3.5 rounded-2xl bg-[#064e3b]/40 border border-[#065f46] space-y-2">
                  <label className="block text-xs font-bold text-[#fbbf24]">
                    اكتب نص العبارة والمناسبة المخصصة للتكريم:
                  </label>
                  <textarea
                    rows={2}
                    value={customOccasionText}
                    onChange={e => setCustomOccasionText(e.target.value)}
                    placeholder="مثلاً: لحفظه المتن الجزرية في التجويد وإتقان مخارج الحروف وصفاتها..."
                    className="w-full bg-[#022c22] border border-[#065f46] rounded-xl p-2 text-xs text-white outline-none focus:border-[#fbbf24] resize-none"
                  />
                </div>
              )}
            </div>

            {/* Step 3: Choose Template */}
            <div className="bg-[#022c22] p-5 rounded-3xl border border-[#065f46] shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#fbbf24] text-[#064e3b] font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <h3 className="text-base font-bold text-white font-heading">
                    اختيار نموذج وقالب الشهادة
                  </h3>
                </div>
                <span className="text-xs text-[#86efac]">
                  {customTemplates.length} نماذج مخصصة للمجمع
                </span>
              </div>

              {/* Ready-made Platform Templates */}
              <div>
                <span className="text-xs font-bold text-amber-300 block mb-2">
                  القوالب الرسمية الفاخرة المعتمدة (تتضمن الختم الرسمي للمنظومة):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {READY_MADE_TEMPLATES.map(tpl => {
                    const isSelected = selectedTemplateId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'border-[#fbbf24] ring-2 ring-[#fbbf24]/30 shadow-lg'
                            : 'border-[#065f46] hover:border-[#fbbf24]/50'
                        } ${tpl.bgClass}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <h4
                              className="font-black text-sm"
                              style={{ color: tpl.id === 'platform_imperial_gold' ? '#b45309' : '#fbbf24' }}
                            >
                              {tpl.name}
                            </h4>
                            <p className="text-[11px] opacity-80 mt-0.5 line-clamp-1" style={{ color: tpl.textColor }}>
                              {tpl.subtitle}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="p-1 rounded-full bg-[#fbbf24] text-[#064e3b] shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Complex Templates (if any) */}
              {customTemplates.length > 0 && (
                <div className="pt-2 border-t border-[#065f46]">
                  <span className="text-xs font-bold text-emerald-300 block mb-2">
                    النماذج الخاصة بالمجمع (بدون ختم المنصة حسب الرغبة):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customTemplates.map(tpl => {
                      const isSelected = selectedTemplateId === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => setSelectedTemplateId(tpl.id)}
                          className={`p-3 rounded-2xl border-2 transition-all cursor-pointer bg-[#064e3b]/30 flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-[#fbbf24] ring-2 ring-[#fbbf24]/30 bg-[#064e3b]/70 shadow-lg'
                              : 'border-[#065f46] hover:border-[#fbbf24]/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-9 rounded-lg bg-black/40 overflow-hidden border border-[#065f46] shrink-0">
                              <img src={tpl.imageUrl} alt={tpl.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-white">{tpl.name}</h4>
                              <span className="text-[10px] text-[#86efac]/70 block">
                                أنشأه: {tpl.createdByTeacherName || 'المعلم'}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="p-1 rounded-full bg-[#fbbf24] text-[#064e3b] shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Signatures & Names */}
            <div className="bg-[#022c22] p-5 rounded-3xl border border-[#065f46] shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#fbbf24] text-[#064e3b] font-black text-xs flex items-center justify-center">
                  4
                </div>
                <h3 className="text-base font-bold text-white font-heading">
                  ظهور أسماء واعتمادات المعلم والمشرف
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'auto', label: 'تلقائياً من بيانات الحلقة والمجمع' },
                  { id: 'custom', label: 'كتابة اسم المعلم والمشرف يدوياً' },
                  { id: 'none', label: 'عدم ظهور اسم المعلم والمشرف نهائياً' }
                ].map(opt => {
                  const isCur = signatureMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSignatureMode(opt.id as any)}
                      className={`p-3 rounded-2xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        isCur
                          ? 'bg-[#fbbf24] text-[#064e3b] border-[#fbbf24] shadow-md font-black'
                          : 'bg-[#064e3b]/30 border-[#065f46] text-[#86efac] hover:bg-[#064e3b]/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {signatureMode === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-[#fbbf24] mb-1">
                      اسم المعلم الذي سيظهر على الشهادة:
                    </label>
                    <input
                      type="text"
                      value={customTeacherName}
                      onChange={e => setCustomTeacherName(e.target.value)}
                      placeholder="اسم المعلم / المحفظ"
                      className="w-full bg-[#064e3b]/50 border border-[#065f46] rounded-xl p-2 text-xs text-white outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#fbbf24] mb-1">
                      اسم المشرف الذي سيظهر على الشهادة:
                    </label>
                    <input
                      type="text"
                      value={customSupervisorName}
                      onChange={e => setCustomSupervisorName(e.target.value)}
                      placeholder="اسم المشرف العام"
                      className="w-full bg-[#064e3b]/50 border border-[#065f46] rounded-xl p-2 text-xs text-white outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action & Summary Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#022c22] p-6 rounded-3xl border border-[#fbbf24]/50 shadow-xl space-y-5 sticky top-20">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#065f46]">
                <Sparkles className="w-5 h-5 text-[#fbbf24]" />
                <h3 className="font-bold text-white font-heading text-base">
                  جاهزية إصدار الشهادات
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-[#86efac]">
                  <span>عدد الطلاب المحددين:</span>
                  <strong className="text-white font-mono text-sm bg-[#064e3b] px-2.5 py-0.5 rounded-lg border border-[#065f46]">
                    {selectedStudentIds.length} طالباً
                  </strong>
                </div>

                <div className="flex items-center justify-between text-[#86efac]">
                  <span>المناسبة:</span>
                  <span className="text-[#fbbf24] font-bold truncate max-w-[170px]">
                    {occasion}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[#86efac]">
                  <span>النموذج المختار:</span>
                  <span className="text-white font-bold truncate max-w-[170px]">
                    {activeTemplate.data.name}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[#86efac]">
                  <span>ختم المنصة:</span>
                  <span className="font-bold">
                    {activeTemplate.type === 'ready' ? (
                      <span className="text-emerald-400">معتمد ومختوم</span>
                    ) : (
                      <span className="text-amber-300">بدون ختم (نموذج خاص)</span>
                    )}
                  </span>
                </div>
              </div>

              {selectedStudentIds.length === 0 ? (
                <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 text-center">
                  يرجى تحديد طالب واحد على الأقل في الخطوة (1) للمتابعة.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewStudentIndex(0);
                    setIsGeneratedModalOpen(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#fbbf24] via-amber-400 to-[#f59e0b] hover:brightness-110 text-[#064e3b] font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
                >
                  <Award className="w-5 h-5" />
                  <span>إنشاء الشهادات والمعاينة الآن ({selectedStudentIds.length})</span>
                </button>
              )}

              <p className="text-[11px] text-[#86efac]/70 text-center leading-relaxed">
                فور الضغط، ستظهر معاينة تفاعلية لكافة الشهادات مع خيارات التنزيل كملفات PDF منفصلة، أو ملف مجمع، أو صور PNG عالية الجودة.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 2: CUSTOM TEMPLATE BUILDER                                     */}
      {/* ===================================================================== */}
      {activeSubTab === 'builder' && (
        <div className="bg-[#022c22] p-6 rounded-3xl border border-[#065f46] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#065f46]">
            <div>
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#fbbf24]" />
                <span>{editingTemplateId ? 'تعديل نموذج الشهادة المخصص' : 'إعداد وتصميم نموذج شهادة خاص بالمجمع'}</span>
              </h3>
              <p className="text-xs text-[#86efac]/90 mt-1">
                ارفع صورة قالب الشهادة الخاص بمجمعك (حتى 5 ميجابايت)، واسحب عنصر اسم الطالب والتاريخ لموضعهما بكل دقة.
              </p>
            </div>

            <div className="text-xs text-amber-300 font-bold bg-[#064e3b] px-3.5 py-1.5 rounded-xl border border-[#065f46]">
              النماذج الحالية للمجمع: {customTemplates.length} من 5 نماذج
            </div>
          </div>

          {builderError && (
            <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{builderError}</span>
            </div>
          )}

          {builderSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{builderSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left/Canvas Column (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">معاينة النموذج وموضع اسم الطالب:</span>
                <span className="text-[11px] text-[#86efac]/80">اسحب أو حرك الأبعاد X و Y لوضع الاسم بدقة</span>
              </div>

              {/* Certificate Canvas Frame */}
              <div
                className="w-full aspect-[1.414/1] bg-black/60 rounded-3xl border-2 border-dashed border-[#065f46] relative overflow-hidden flex items-center justify-center shadow-2xl select-none"
                style={{
                  backgroundImage: builderImage ? `url(${builderImage})` : undefined,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center'
                }}
              >
                {!builderImage ? (
                  <div className="text-center p-8 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#064e3b] text-[#fbbf24] flex items-center justify-center mx-auto shadow-md">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">لم تقم برفع صورة القالب بعد</h4>
                      <p className="text-xs text-[#86efac]/80 mt-1 max-w-sm">
                        اضغط على زر رفع الصورة أدناه لاختيار تصميم الشهادة (لا يزيد حجم الصورة عن 5 ميجابايت).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-xs cursor-pointer shadow-lg transition-all"
                    >
                      اختيار صورة الشهادة (حتى 5MB)
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Floating Student Name */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${namePosX}%`,
                        top: `${namePosY}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: `${nameFontSize}px`,
                        fontFamily: ARABIC_FONTS.find(f => f.id === nameFontFamily)?.family || 'Amiri',
                        color: nameColor,
                        textAlign: nameTextAlign,
                        fontWeight: nameFontWeight,
                        whiteSpace: 'nowrap'
                      }}
                      className="cursor-move border border-dashed border-amber-400/80 bg-amber-400/10 px-2.5 py-0.5 rounded-lg shadow-sm transition-all"
                      title="موضع اسم الطالب"
                    >
                      {testStudentName || 'اسم الطالب هنا'}
                    </div>

                    {/* Floating Date (Optional) */}
                    {showDateOnCert && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${datePosX}%`,
                          top: `${datePosY}%`,
                          transform: 'translate(-50%, -50%)',
                          fontSize: `${dateFontSize}px`,
                          fontFamily: ARABIC_FONTS.find(f => f.id === dateFontFamily)?.family || 'Cairo',
                          color: dateColor,
                          whiteSpace: 'nowrap'
                        }}
                        className="cursor-move border border-dashed border-emerald-400/80 bg-emerald-400/10 px-2 py-0.5 rounded-lg shadow-sm"
                        title="موضع التاريخ"
                      >
                        {todayArabic}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Upload Input & Actions */}
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-[#064e3b] hover:bg-[#064e3b]/80 text-[#86efac] hover:text-white border border-[#065f46] text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Upload className="w-4 h-4 text-[#fbbf24]" />
                  <span>{builderImage ? 'تغيير صورة النموذج' : 'رفع صورة النموذج (حتى 5MB)'}</span>
                </button>
              </div>
            </div>

            {/* Right/Controls Column (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Template Name */}
              <div>
                <label className="block text-xs font-bold text-[#fbbf24] mb-1">
                  اسم النموذج (للتمييز في القائمة):
                </label>
                <input
                  type="text"
                  value={builderName}
                  onChange={e => setBuilderName(e.target.value)}
                  placeholder="مثلاً: نموذج شهادة الشكر السنوية"
                  className="w-full bg-[#064e3b]/50 border border-[#065f46] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#fbbf24]"
                />
              </div>

              {/* Test Name Input */}
              <div>
                <label className="block text-xs font-bold text-[#86efac] mb-1">
                  اسم تجريبي للمعاينة الفورية:
                </label>
                <input
                  type="text"
                  value={testStudentName}
                  onChange={e => setTestStudentName(e.target.value)}
                  placeholder="اكتب اسماً للتجربة"
                  className="w-full bg-[#064e3b]/50 border border-[#065f46] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#fbbf24]"
                />
              </div>

              {/* Student Name Positioning & Typography Controls */}
              <div className="p-4 rounded-2xl bg-[#064e3b]/30 border border-[#065f46] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#fbbf24]">
                  <Type className="w-4 h-4" />
                  <span>إعدادات خط وموضع اسم الطالب:</span>
                </div>

                {/* Sliders for Position X and Y */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#86efac]">الموضع الأفقي (X):</span>
                      <span className="text-white font-mono">{namePosX}%</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={95}
                      value={namePosX}
                      onChange={e => setNamePosX(Number(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#86efac]">الموضع الرأسي (Y):</span>
                      <span className="text-white font-mono">{namePosY}%</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={95}
                      value={namePosY}
                      onChange={e => setNamePosY(Number(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>

                {/* Font Family (10 Arabic Fonts) */}
                <div>
                  <label className="block text-xs font-semibold text-[#86efac] mb-1">
                    نوع الخط العربي (اختر من 10 خطوط فاخرة):
                  </label>
                  <select
                    value={nameFontFamily}
                    onChange={e => setNameFontFamily(e.target.value)}
                    className="w-full bg-[#022c22] border border-[#065f46] rounded-xl p-2 text-xs text-white outline-none focus:border-[#fbbf24]"
                  >
                    {ARABIC_FONTS.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size & Weight */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[#86efac] mb-1">حجم الخط ({nameFontSize}px):</label>
                    <input
                      type="range"
                      min={18}
                      max={72}
                      value={nameFontSize}
                      onChange={e => setNameFontSize(Number(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[#86efac] mb-1">وزن الخط:</label>
                    <select
                      value={nameFontWeight}
                      onChange={e => setNameFontWeight(e.target.value as any)}
                      className="w-full bg-[#022c22] border border-[#065f46] rounded-xl p-1.5 text-xs text-white outline-none"
                    >
                      <option value="normal">عادي (Normal)</option>
                      <option value="bold">عريض (Bold)</option>
                      <option value="900">عريض جداً (Black)</option>
                    </select>
                  </div>
                </div>

                {/* Color Palette */}
                <div>
                  <label className="block text-xs font-semibold text-[#86efac] mb-1">لون اسم الطالب:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={nameColor}
                      onChange={e => setNameColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['#064e3b', '#b45309', '#1e3a8a', '#111827', '#991b1b', '#0284c7'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNameColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-6 h-6 rounded-full border ${nameColor === c ? 'ring-2 ring-white' : 'border-white/20'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Controls (Optional) */}
              <div className="p-4 rounded-2xl bg-[#064e3b]/30 border border-[#065f46] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Calendar className="w-4 h-4" />
                    <span>إظهار التاريخ على الشهادة</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showDateOnCert}
                    onChange={e => setShowDateOnCert(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-[#022c22] border-[#065f46]"
                  />
                </div>

                {showDateOnCert && (
                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[#86efac]">موضع التاريخ (X):</span>
                        <span className="text-white font-mono">{datePosX}%</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={95}
                        value={datePosX}
                        onChange={e => setDatePosX(Number(e.target.value))}
                        className="w-full accent-emerald-400"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[#86efac]">موضع التاريخ (Y):</span>
                        <span className="text-white font-mono">{datePosY}%</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={95}
                        value={datePosY}
                        onChange={e => setDatePosY(Number(e.target.value))}
                        className="w-full accent-emerald-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSaveCustomTemplate}
                className="w-full py-3 px-4 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ النموذج في نماذج المجمع</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 3: MY SAVED TEMPLATES (UP TO 5 PER COMPLEX)                    */}
      {/* ===================================================================== */}
      {activeSubTab === 'templates' && (
        <div className="bg-[#022c22] p-6 rounded-3xl border border-[#065f46] shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#065f46]">
            <div>
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#fbbf24]" />
                <span>نماذج الشهادات الخاصة بالمجمع ({customTemplates.length}/5)</span>
              </h3>
              <p className="text-xs text-[#86efac]/90 mt-1">
                تظهر هذه النماذج لجميع معلمي ومشرفي المجمع، ويمكنك التعديل عليها أو حذفها في أي وقت.
              </p>
            </div>

            {customTemplates.length < 5 && (
              <button
                type="button"
                onClick={() => {
                  setEditingTemplateId(null);
                  setBuilderImage(null);
                  setBuilderName('');
                  setActiveSubTab('builder');
                }}
                className="px-4 py-2 rounded-xl bg-[#fbbf24] text-[#064e3b] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة نموذج جديد</span>
              </button>
            )}
          </div>

          {customTemplates.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-[#064e3b]/20 rounded-3xl border border-dashed border-[#065f46]">
              <div className="w-12 h-12 rounded-2xl bg-[#064e3b] text-[#86efac] flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">لا توجد نماذج مخصصة محفوظة بعد</h4>
              <p className="text-xs text-[#86efac]/70 max-w-md mx-auto">
                يمكن للمجمع رفع حتى 5 تصاميم شهادات مخصصة تناسب هويته الرسمية واستخدامها فورياً لكافة الحلقات.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('builder')}
                className="px-5 py-2.5 rounded-2xl bg-[#fbbf24] text-[#064e3b] font-black text-xs cursor-pointer shadow-md mt-2"
              >
                إعداد أول نموذج الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customTemplates.map((tpl, idx) => (
                <div
                  key={tpl.id}
                  className="bg-[#064e3b]/30 rounded-2xl border border-[#065f46] overflow-hidden flex flex-col shadow-md"
                >
                  <div className="aspect-[1.414/1] bg-black/40 overflow-hidden relative">
                    <img src={tpl.imageUrl} alt={tpl.name} className="w-full h-full object-cover" />
                    <span className="absolute top-2 right-2 text-[10px] font-bold bg-black/70 text-amber-300 px-2 py-0.5 rounded-md">
                      نموذج #{idx + 1}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-white">{tpl.name}</h4>
                      <p className="text-[11px] text-[#86efac]/70 mt-0.5">
                        أنشأه: {tpl.createdByTeacherName || 'المشرف'} • خط: {tpl.studentNamePosition.fontFamily}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#065f46]/50">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplateId(tpl.id);
                          setActiveSubTab('issue');
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-[#fbbf24] text-[#064e3b] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>استخدام</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditTemplate(tpl)}
                        className="p-1.5 rounded-xl bg-[#022c22] text-[#86efac] hover:text-white border border-[#065f46] cursor-pointer"
                        title="تعديل الموضع والخط"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="p-1.5 rounded-xl bg-red-950/60 text-red-300 hover:text-red-100 border border-red-500/40 cursor-pointer"
                        title="حذف هذا النموذج"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* GENERATED CERTIFICATES INTERACTIVE PREVIEW & EXPORT MODAL             */}
      {/* ===================================================================== */}
      {isGeneratedModalOpen && targetStudents.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#022c22] border-2 border-[#fbbf24]/50 rounded-3xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-right">
            {/* Modal Top Bar */}
            <div className="bg-gradient-to-r from-[#064e3b] via-[#022c22] to-[#064e3b] px-6 py-4 border-b border-[#065f46] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24] flex items-center justify-center shadow-sm">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    معاينة الشهادات المعتمدة ({targetStudents.length} شهادة)
                  </h3>
                  <p className="text-[11px] text-[#86efac]">
                    طالب {previewStudentIndex + 1} من {targetStudents.length}: {targetStudents[previewStudentIndex]?.name}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsGeneratedModalOpen(false)}
                className="p-2 text-[#86efac] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Students Switcher Pagination Bar (if multiple students) */}
            {targetStudents.length > 1 && (
              <div className="bg-[#011a14] px-4 py-2 border-b border-[#065f46] flex items-center justify-between gap-3 text-xs overflow-x-auto shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={previewStudentIndex === 0}
                    onClick={() => setPreviewStudentIndex(i => Math.max(0, i - 1))}
                    className="p-1 rounded-lg bg-[#064e3b] disabled:opacity-30 text-white cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-[#86efac] font-mono">
                    {previewStudentIndex + 1} / {targetStudents.length}
                  </span>
                  <button
                    type="button"
                    disabled={previewStudentIndex === targetStudents.length - 1}
                    onClick={() => setPreviewStudentIndex(i => Math.min(targetStudents.length - 1, i + 1))}
                    className="p-1 rounded-lg bg-[#064e3b] disabled:opacity-30 text-white cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* Student Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {targetStudents.map((std, idx) => (
                    <button
                      key={std.id}
                      type="button"
                      onClick={() => setPreviewStudentIndex(idx)}
                      className={`px-3 py-1 rounded-xl whitespace-nowrap text-xs font-bold transition-all cursor-pointer ${
                        previewStudentIndex === idx
                          ? 'bg-[#fbbf24] text-[#064e3b] font-black'
                          : 'bg-[#064e3b]/50 text-[#86efac] hover:text-white'
                      }`}
                    >
                      {idx + 1}. {std.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Certificate Preview Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#011a14] flex justify-center items-center">
              {(() => {
                const curStudent = targetStudents[previewStudentIndex] || targetStudents[0];
                const halaqahName = curStudent.halaqahName || settings.halaqahName;
                const complexName = settings.complexName || 'منظومة عُمران';
                const teacherTitle = signatureMode === 'custom'
                  ? customTeacherName
                  : (curStudent.halaqahName ? `معلم ${curStudent.halaqahName}` : settings.teacherName);
                const supervisorTitle = signatureMode === 'custom'
                  ? customSupervisorName
                  : (settings.complexName ? `مشرف ${settings.complexName}` : 'المشرف العام');

                return (
                  <div
                    id="cert-single-preview"
                    className="w-full max-w-[800px] aspect-[1.414/1] rounded-3xl relative overflow-hidden shadow-2xl flex flex-col justify-between p-8 sm:p-12 text-center border-4 border-[#fbbf24] select-none"
                    style={{
                      backgroundImage: activeTemplate.type === 'custom' ? `url(${activeTemplate.data.imageUrl})` : undefined,
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                      backgroundColor: activeTemplate.type === 'ready' ? (activeTemplate.data.id === 'platform_imperial_gold' ? '#fef9c3' : (activeTemplate.data.id === 'platform_classic_heritage' ? '#fffefb' : (activeTemplate.data.id === 'platform_celestial_sapphire' ? '#0f172a' : '#022c22'))) : '#000000'
                    }}
                  >
                    {/* If Custom Template: Render floating name & date */}
                    {activeTemplate.type === 'custom' ? (
                      <>
                        <div
                          style={{
                            position: 'absolute',
                            left: `${activeTemplate.data.studentNamePosition.x}%`,
                            top: `${activeTemplate.data.studentNamePosition.y}%`,
                            transform: 'translate(-50%, -50%)',
                            fontSize: `${activeTemplate.data.studentNamePosition.fontSize}px`,
                            fontFamily: ARABIC_FONTS.find(f => f.id === activeTemplate.data.studentNamePosition.fontFamily)?.family || 'Amiri',
                            color: activeTemplate.data.studentNamePosition.color,
                            textAlign: activeTemplate.data.studentNamePosition.textAlign,
                            fontWeight: activeTemplate.data.studentNamePosition.fontWeight || 'bold',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {curStudent.name}
                        </div>

                        {activeTemplate.data.showDate && activeTemplate.data.datePosition && (
                          <div
                            style={{
                              position: 'absolute',
                              left: `${activeTemplate.data.datePosition.x}%`,
                              top: `${activeTemplate.data.datePosition.y}%`,
                              transform: 'translate(-50%, -50%)',
                              fontSize: `${activeTemplate.data.datePosition.fontSize}px`,
                              fontFamily: ARABIC_FONTS.find(f => f.id === activeTemplate.data.datePosition.fontFamily)?.family || 'Cairo',
                              color: activeTemplate.data.datePosition.color,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {todayArabic}
                          </div>
                        )}
                      </>
                    ) : (
                      /* Ready-Made Platform Design */
                      <>
                        {/* Top Bismillah & Quranic Verse */}
                        <div className="space-y-1">
                          <div className="font-quran text-lg sm:text-xl font-bold" style={{ color: activeTemplate.data.accentColor }}>
                            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                          </div>
                          <div className="font-quran text-xs sm:text-sm opacity-90" style={{ color: activeTemplate.data.accentColor }}>
                            ﴿ يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ ﴾
                          </div>
                          <h1
                            className="font-black text-2xl sm:text-4xl mt-3 font-heading"
                            style={{ color: activeTemplate.data.accentColor }}
                          >
                            شَهَادَةُ تَمَيُّزٍ وَإِتْقَانٍ قُرْآنِيٍّ
                          </h1>
                        </div>

                        {/* Student Name & Occasion */}
                        <div className="space-y-3 my-auto py-4">
                          <p className="text-xs sm:text-sm font-semibold opacity-90" style={{ color: activeTemplate.data.textColor }}>
                            يَسُرُّ إِدَارَةَ الحِلْقَةِ أَنْ تَمْنَحَ هذِهِ الشَّهَادَةَ المُبَارَكَةَ لِلطَّالِبِ النَّجِيبِ:
                          </p>

                          <div
                            className="font-quran text-3xl sm:text-5xl font-black py-2"
                            style={{ color: activeTemplate.data.accentColor }}
                          >
                            {curStudent.name}
                          </div>

                          <p
                            className="text-xs sm:text-sm leading-relaxed max-w-xl mx-auto px-4 font-medium"
                            style={{ color: activeTemplate.data.textColor }}
                          >
                            {getOccasionDescription()}
                          </p>

                          <div className="text-[11px] sm:text-xs opacity-75 mt-1" style={{ color: activeTemplate.data.textColor }}>
                            الحلقة: <strong className="font-bold">{halaqahName}</strong> • المجمع: <strong className="font-bold">{complexName}</strong>
                          </div>
                        </div>

                        {/* Footer Details: Signatures, Seal & Date */}
                        <div className="space-y-4 pt-4 border-t border-white/20">
                          {signatureMode !== 'none' && (
                            <div className="flex items-center justify-between px-6 text-xs sm:text-sm font-bold" style={{ color: activeTemplate.data.textColor }}>
                              <div className="text-right">
                                <span className="block text-[10px] opacity-75">معلم الحلقة:</span>
                                <span>{teacherTitle}</span>
                              </div>

                              <div className="text-left">
                                <span className="block text-[10px] opacity-75">المشرف العام:</span>
                                <span>{supervisorTitle}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] sm:text-[11px] px-2 opacity-80" style={{ color: activeTemplate.data.textColor }}>
                            <span>تاريخ الإصدار: {todayArabic}</span>

                            {/* Official Seal badge on ready-made */}
                            <div className="flex items-center gap-1.5 font-bold" style={{ color: activeTemplate.data.accentColor }}>
                              <Award className="w-4 h-4" />
                              <span>معتمد إلكترونياً • منظومة عُمران</span>
                            </div>

                            <span>الموافق: {todayGregorian}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Bottom Actions Bar */}
            <div className="p-4 bg-[#022c22] border-t border-[#065f46] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {/* Download as Image PNG */}
                <button
                  type="button"
                  onClick={() => handleDownloadSinglePNG(targetStudents[previewStudentIndex], previewStudentIndex)}
                  className="px-4 py-2 rounded-xl bg-[#064e3b] hover:bg-[#064e3b]/80 text-[#86efac] hover:text-white border border-[#065f46] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  title="تنزيل الشهادة كصورة PNG عالية الدقة"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>تحميل كصورة (PNG)</span>
                </button>

                {/* Print/Download Separate PDF */}
                <button
                  type="button"
                  onClick={() => handlePrintSingleStudentPDF(targetStudents[previewStudentIndex])}
                  className="px-4 py-2 rounded-xl bg-[#064e3b] hover:bg-[#064e3b]/80 text-[#86efac] hover:text-white border border-[#065f46] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  title="تنزيل شهادة هذا الطالب كـ PDF منفصل"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>تنزيل PDF للطالب الحالي</span>
                </button>

                {/* Print/Download All Merged PDF */}
                {targetStudents.length > 1 && (
                  <button
                    type="button"
                    onClick={handlePrintAllMergedPDF}
                    className="px-4 py-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-600/50 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    title="تنزيل كافة الشهادات في ملف PDF واحد مجمع"
                  >
                    <FileText className="w-4 h-4 text-[#fbbf24]" />
                    <span>تنزيل الكل بملف PDF مجمع ({targetStudents.length})</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Send via WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(targetStudents[previewStudentIndex])}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:brightness-110 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال عبر واتساب لولي الأمر</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
