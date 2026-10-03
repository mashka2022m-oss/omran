import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRightLeft,
  X,
  Database,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  LogIn,
  Check,
  Building2,
  Users,
  BookOpen,
  Calendar,
  Award,
  Trash2,
  RefreshCw,
  Mail,
  ExternalLink,
  Layers,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuranComplex, Halaqah, Student, AttendanceRecord, StudentEvaluation, Exam, GoogleOAuthConfig, ComplexMigrationProgress, ComplexMigrationResult } from '../types';
import { OmranDataService, firebaseConfig, TARGET_FIRESTORE_DATABASE_ID } from '../lib/firebase';
import { GoogleWorkspaceService } from '../lib/googleWorkspace';

interface ComplexDatabaseTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  complexes: QuranComplex[];
  activeComplexId?: string;
  halaqahs?: Halaqah[];
  students?: Student[];
  googleAuthConfig?: GoogleOAuthConfig;
  onSuccessRefresh: () => Promise<void>;
}

export const ComplexDatabaseTransferModal: React.FC<ComplexDatabaseTransferModalProps> = ({
  isOpen,
  onClose,
  complexes,
  activeComplexId,
  halaqahs = [],
  students = [],
  googleAuthConfig,
  onSuccessRefresh
}) => {
  // Complex selection
  const [selectedComplexId, setSelectedComplexId] = useState<string>(
    activeComplexId || complexes[0]?.id || ''
  );

  // Sync active complex if prop changes
  useEffect(() => {
    if (activeComplexId) {
      setSelectedComplexId(activeComplexId);
    } else if (complexes[0]?.id && !selectedComplexId) {
      setSelectedComplexId(complexes[0].id);
    }
  }, [activeComplexId, complexes]);

  const targetComplex = complexes.find(c => c.id === selectedComplexId) || complexes[0];

  // Target Google Account state
  const [targetGoogleEmail, setTargetGoogleEmail] = useState<string>(() => {
    if (targetComplex?.databaseConfig?.connectedEmail) {
      return targetComplex.databaseConfig.connectedEmail;
    }
    if (googleAuthConfig?.connectedEmail) {
      return googleAuthConfig.connectedEmail;
    }
    return '';
  });

  // Database settings
  const [targetDatabaseId, setTargetDatabaseId] = useState<string>(() => {
    return targetComplex?.databaseConfig?.databaseId || `isolated-${targetComplex?.id || 'complex'}`;
  });

  const [targetProjectId, setTargetProjectId] = useState<string>(() => {
    return targetComplex?.databaseConfig?.projectId || firebaseConfig.projectId || 'omran-ffbad';
  });

  const [purgeFromCentral, setPurgeFromCentral] = useState<boolean>(true);
  const [showDeveloperGuide, setShowDeveloperGuide] = useState<boolean>(false);

  // Flow State: 'configure' | 'transferring' | 'completed' | 'error'
  const [migrationState, setMigrationState] = useState<'configure' | 'transferring' | 'completed' | 'error'>('configure');
  const [isSigningInGoogle, setIsSigningInGoogle] = useState<boolean>(false);
  const [progress, setProgress] = useState<ComplexMigrationProgress>({
    step: 0,
    totalSteps: 10,
    percent: 0,
    title: 'في انتظار بدء النقل...',
    detail: '',
    logs: []
  });
  const [migrationResult, setMigrationResult] = useState<ComplexMigrationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-scroll log terminal
  const logTerminalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [progress.logs]);

  // Update defaults when switching target complex
  useEffect(() => {
    if (targetComplex) {
      if (targetComplex.databaseConfig?.connectedEmail) {
        setTargetGoogleEmail(targetComplex.databaseConfig.connectedEmail);
      } else if (!targetGoogleEmail && googleAuthConfig?.connectedEmail) {
        setTargetGoogleEmail(googleAuthConfig.connectedEmail);
      }

      setTargetDatabaseId(targetComplex.databaseConfig?.databaseId || `isolated-${targetComplex.id}`);
      setTargetProjectId(targetComplex.databaseConfig?.projectId || firebaseConfig.projectId || 'omran-ffbad');
    }
  }, [targetComplex?.id]);

  if (!isOpen) return null;

  // Compute preview stats for target complex
  const complexHalaqahs = halaqahs.filter(h => h.complexId === targetComplex?.id);
  const complexHalaqahIds = new Set(complexHalaqahs.map(h => h.id));
  const complexStudents = students.filter(s => (s.halaqahId && complexHalaqahIds.has(s.halaqahId)) || s.complexId === targetComplex?.id);

  // Google sign in / link handler
  const handleSelectGoogleAccount = async () => {
    setIsSigningInGoogle(true);
    setErrorMessage(null);
    try {
      const res = await GoogleWorkspaceService.linkGoogleAccount();
      if (res?.email) {
        setTargetGoogleEmail(res.email);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر استكمال تسجيل الدخول بحساب Google.');
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  // Start Transfer Handler
  const handleStartMigration = async () => {
    if (!targetComplex) return;
    if (!targetGoogleEmail || !targetGoogleEmail.trim()) {
      setErrorMessage('يرجى تحديد أو تسجيل الدخول بحساب Google المعتمد للمجمع قبل بدء النقل.');
      return;
    }

    setErrorMessage(null);
    setMigrationState('transferring');
    setProgress({
      step: 1,
      totalSteps: 10,
      percent: 5,
      title: 'تهيئة جلسة الترحيل السحابي...',
      detail: 'جاري الاتصال والتحقق من الصلاحيات...',
      logs: [`[${new Date().toLocaleTimeString('ar-SA')}] بدء جلسة نقل بيانات مجمع (${targetComplex.name})...`]
    });

    try {
      const res = await OmranDataService.migrateComplexToDedicatedDatabase(
        {
          complexId: targetComplex.id,
          targetGoogleEmail: targetGoogleEmail.trim(),
          targetProjectId: targetProjectId.trim(),
          targetDatabaseId: targetDatabaseId.trim(),
          purgeFromCentral: purgeFromCentral
        },
        (p) => {
          setProgress(p);
        }
      );

      setMigrationResult(res);
      setMigrationState('completed');

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      // Refresh parent app data
      await onSuccessRefresh();
    } catch (err: any) {
      console.error('Migration error:', err);
      setErrorMessage(err?.message || 'حدث خطأ غير متوقع أثناء ترحيل بيانات المجمع.');
      setMigrationState('error');
    }
  };

  // Purge now handler (if developer didn't check purge earlier, but wants to purge after migration)
  const handlePurgeNow = async () => {
    if (!targetComplex) return;
    try {
      await OmranDataService.purgeComplexData(targetComplex.id);
      if (migrationResult) {
        setMigrationResult({ ...migrationResult, purgedFromCentral: true });
      }
      await onSuccessRefresh();
    } catch (err: any) {
      setErrorMessage('تعذر إفراغ البيانات المركزية: ' + (err.message || 'خطأ غير معروف'));
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 text-right" dir="rtl">
      <div className="w-full max-w-2xl bg-[#022c22] border-2 border-amber-500/70 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#064e3b] via-[#022c22] to-[#064e3b] border-b border-[#065f46] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-[#064e3b] flex items-center justify-center shadow-lg shadow-amber-400/20 shrink-0">
              <ArrowRightLeft className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black font-heading text-white">
                  نقل المجمع إلى قاعدة بيانات منفصلة (Firebase)
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-400 text-[#064e3b] font-black shadow-sm">
                  ميزة حصرية للمبرمج
                </span>
              </div>
              <p className="text-xs text-[#86efac] mt-1 leading-relaxed">
                ترحيل كامل بيانات المجمع وإنشاء قاعدة بيانات مستقلة مرتبطة بحساب Google المعتمد
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={migrationState === 'transferring'}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* STAGE 1: CONFIGURE & SELECT ACCOUNT */}
          {migrationState === 'configure' && (
            <div className="space-y-5">
              
              {/* Complex Selector Card */}
              <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">المجمع التعليمي المستهدف بالنقل:</span>
                      <span className="text-[11px] text-[#86efac]">اختر المجمع الذي ترغب في نقله وتخصيص قاعدة بيانات له:</span>
                    </div>
                  </div>

                  <select
                    value={selectedComplexId}
                    onChange={e => setSelectedComplexId(e.target.value)}
                    className="bg-[#022c22] border-2 border-amber-400/50 rounded-xl px-3.5 py-2 text-xs font-bold text-amber-300 outline-none cursor-pointer focus:border-amber-400"
                  >
                    {complexes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.databaseConfig?.isCustom ? '[منفصلة مسبقاً]' : '[مركزية]'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Entity breakdown */}
                {targetComplex && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#065f46]/60">
                    <div className="p-2.5 rounded-xl bg-[#022c22]/80 border border-[#065f46] text-center">
                      <span className="text-[10px] text-slate-300 block">حلقات التحفيظ</span>
                      <strong className="text-amber-300 font-bold text-sm">{complexHalaqahs.length}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#022c22]/80 border border-[#065f46] text-center">
                      <span className="text-[10px] text-slate-300 block">الطلاب المسجلين</span>
                      <strong className="text-emerald-300 font-bold text-sm">{complexStudents.length}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#022c22]/80 border border-[#065f46] text-center">
                      <span className="text-[10px] text-slate-300 block">المشرف المسؤول</span>
                      <strong className="text-white font-bold text-[11px] truncate block">{targetComplex.supervisorTeacherName || 'المشرف العام'}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#022c22]/80 border border-[#065f46] text-center">
                      <span className="text-[10px] text-slate-300 block">الحالة الحالية</span>
                      <strong className="text-amber-400 font-bold text-[11px]">
                        {targetComplex.databaseConfig?.isCustom ? 'منفصلة' : 'قاعدة مركزية'}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 1: Select Target Google Account */}
              <div className="bg-[#022c22] border-2 border-emerald-500/50 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-[#065f46]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-400/40">
                      1
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      اختيار حساب Google المستهدف للمجمع (Google Account)
                    </h4>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                    خطوة المصادقة
                  </span>
                </div>

                <p className="text-[11px] text-[#86efac]/90 leading-relaxed">
                  سيتم إنشاء قاعدة البيانات السحابية الجديدة لهذا المجمع على هذا الحساب مباشرة، ونقل المجمع وبياناته وكل شيء حرفياً إليه:
                </p>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 relative">
                      <Mail className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
                      <input
                        type="email"
                        value={targetGoogleEmail}
                        onChange={e => setTargetGoogleEmail(e.target.value)}
                        placeholder="مثال: omran.complex@gmail.com"
                        className="w-full bg-[#064e3b] border border-amber-400/40 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white font-mono placeholder:text-emerald-300/40 outline-none focus:border-amber-400"
                        dir="ltr"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSelectGoogleAccount}
                      disabled={isSigningInGoogle}
                      className="px-4 py-2.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                      title="فتح نافذة تسجيل الدخول واختيار الحساب المعتمد"
                    >
                      {isSigningInGoogle ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#064e3b]" />
                          <span>جاري المصادقة...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4 text-[#064e3b]" />
                          <span>تسجيل الدخول واختيار حساب Google</span>
                        </>
                      )}
                    </button>
                  </div>

                  {targetGoogleEmail && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>الحساب المعتمد للنقل: <strong className="font-mono text-white mr-1">{targetGoogleEmail}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Target Database ID & Project Settings */}
              <div className="bg-[#022c22] border border-[#065f46] rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#065f46]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-400/40">
                      2
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      إعدادات قاعدة البيانات المنفصلة (Firestore Partition)
                    </h4>
                  </div>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                    مضبوطة تلقائياً
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                      معرف قاعدة البيانات المنفصلة (Database ID):
                    </label>
                    <input
                      type="text"
                      value={targetDatabaseId}
                      onChange={e => setTargetDatabaseId(e.target.value)}
                      placeholder="isolated-complex-db"
                      className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-400"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                      مشروع Firebase المستهدف (Project ID):
                    </label>
                    <input
                      type="text"
                      value={targetProjectId}
                      onChange={e => setTargetProjectId(e.target.value)}
                      placeholder="omran-ffbad"
                      className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-400"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Purge option toggle */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-black/30 border border-[#065f46] cursor-pointer hover:border-amber-400/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={purgeFromCentral}
                      onChange={e => setPurgeFromCentral(e.target.checked)}
                      className="mt-0.5 accent-amber-400 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-white block">
                        إفراغ بيانات هذا المجمع من القاعدة المركزية تلقائياً بعد اكتمال النقل
                      </span>
                      <p className="text-[11px] text-[#86efac]/80 mt-0.5">
                        يوصى به لضمان العزل التام للمجمع في قاعدته المنفصلة وعدم وجود بيانات مكررة في القاعدة المركزية المشتركة.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Developer Step-by-Step Guide Accordion (دليل المبرمج التفصيلي) */}
              <div className="bg-[#064e3b]/40 border-2 border-amber-400/40 rounded-2xl overflow-hidden shadow-lg transition-all">
                <button
                  type="button"
                  onClick={() => setShowDeveloperGuide(!showDeveloperGuide)}
                  className="w-full p-4 flex items-center justify-between text-right hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/40 shrink-0 font-bold">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-black text-white">
                        دليل المبرمج التفصيلي: كيف تجلب بيانات Firebase لحساب Google خطوة بخطوة؟
                      </h5>
                      <span className="text-[11px] text-[#86efac]">
                        اضغط هنا لعرض الخطوات المشروحة بالتفصيل لتجهيز مشروع Firebase والحصول على المعرفات
                      </span>
                    </div>
                  </div>

                  <ChevronDown className={`w-5 h-5 text-amber-400 transition-transform duration-200 shrink-0 ${showDeveloperGuide ? 'rotate-180' : ''}`} />
                </button>

                {showDeveloperGuide && (
                  <div className="p-4 sm:p-5 border-t border-[#065f46] bg-[#022c22]/90 space-y-4 text-xs leading-relaxed text-[#f0f9f6]">
                    
                    {/* Step 1 */}
                    <div className="p-3.5 rounded-xl bg-[#064e3b]/50 border border-[#065f46] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-400 text-[#064e3b] flex items-center justify-center text-[11px] font-black">1</span>
                          الدخول إلى منصة Firebase بحساب Google المطلوب
                        </span>
                        <a
                          href="https://console.firebase.google.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-[10px] font-bold border border-amber-400/30 flex items-center gap-1 cursor-pointer"
                        >
                          <span>فتح Firebase Console ↗</span>
                        </a>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        افتح الرابط <code className="text-amber-300 font-mono" dir="ltr">console.firebase.google.com</code> وسجل الدخول بنفس حساب Google الذي تريد جعل المجمع ملكاً له.
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="p-3.5 rounded-xl bg-[#064e3b]/50 border border-[#065f46] space-y-2">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-[#064e3b] flex items-center justify-center text-[11px] font-black">2</span>
                        إنشاء مشروع جديد (Create / Add Project)
                      </span>
                      <p className="text-[11px] text-slate-300">
                        اضغط على زر <strong className="text-white">&quot;Add project&quot;</strong>، اكتب اسم المشروع (مثلاً: <span className="font-mono text-emerald-300">quran-complex-1</span>). ستلاحظ ظهور <strong className="text-amber-300">معرف المشروع (Project ID)</strong> تلقائياً أسفل الاسم — هذا هو المعرف الذي تحتاجه في خانة Project ID.
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="p-3.5 rounded-xl bg-[#064e3b]/50 border border-[#065f46] space-y-2">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-[#064e3b] flex items-center justify-center text-[11px] font-black">3</span>
                        إنشاء قاعدة بيانات Cloud Firestore
                      </span>
                      <p className="text-[11px] text-slate-300">
                        من القائمة الجانبية اليسرى: اضغط على <strong className="text-white">Build &gt; Firestore Database</strong> ثم اضغط <strong className="text-white">&quot;Create database&quot;</strong>. اختر أقرب منطقة جغرافية (مثل فرانكفورت <code className="text-emerald-300 font-mono">europe-west3</code> أو <code className="text-emerald-300 font-mono">me-central1</code>) واضغط تم.
                      </p>
                    </div>

                    {/* Step 4 */}
                    <div className="p-3.5 rounded-xl bg-[#064e3b]/50 border border-[#065f46] space-y-2">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-[#064e3b] flex items-center justify-center text-[11px] font-black">4</span>
                        معرفة مفتاح التطبيق (Web API Key)
                      </span>
                      <p className="text-[11px] text-slate-300">
                        اضغط على أيقونة الترس ⚙️ بجانب Project Overview في أعلى القائمة الجانبية ثم اختر <strong className="text-white">Project settings (إعدادات المشروع)</strong>. في تبويب <strong className="text-white">General (عام)</strong> ستجد:
                      </p>
                      <div className="text-[11px] bg-[#022c22] p-2.5 rounded-lg border border-[#065f46] font-mono space-y-1 text-slate-300" dir="ltr">
                        <div>• <strong>Project ID:</strong> your-project-id</div>
                        <div>• <strong>Web API Key:</strong> AIzaSy...</div>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="p-3.5 rounded-xl bg-[#064e3b]/50 border border-[#065f46] space-y-2">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-[#064e3b] flex items-center justify-center text-[11px] font-black">5</span>
                        إضافة النطاق المصرح به (Authorized Domains)
                      </span>
                      <p className="text-[11px] text-slate-300">
                        من القائمة الجانبية: <strong className="text-white">Build &gt; Authentication &gt; Settings &gt; Authorized domains</strong> ثم اضغط <strong className="text-white">Add domain</strong> وأضف رابط موقع المنصة الحالي (مثل نطاق Netlify الخاص بك) لتسمح Google بتسجيل الدخول بأمان وبدون أي قيود.
                      </p>
                    </div>

                    {/* Quick tip */}
                    <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-[11px] text-amber-200">
                      💡 <strong>ملاحظة للمبرمج:</strong> لست بحاجة لكتابة كود! فقط اضغط على زر <strong className="text-white">&quot;تسجيل الدخول واختيار حساب Google&quot;</strong> في الأعلى وسيتعرف النظام على الحساب ويهيئ المعرفات تلقائياً، ثم اضغط <strong className="text-white">&quot;بدء نقل البيانات&quot;</strong> وسيتولى البرنامج كل شيء.
                    </div>

                  </div>
                )}
              </div>

              {/* What will happen card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 border border-emerald-400/30 text-[11px] text-[#86efac] space-y-1.5 leading-relaxed">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>ماذا سيحدث عند الضغط على "بدء النقل الآن"؟</span>
                </div>
                <div>
                  • سيقوم النظام بالوصول إلى Firebase وإنشاء مساحة قاعدة بيانات مستقلة بالكامل بحساب Google المعتمد.
                  <br />
                  • سيتم نقل الحلقات والطلاب وسجلات الحضور والتقييمات والاختبارات والمخالفات حرفياً أمامك مع شريط تحميل لحظي.
                  <br />
                  • عند الانتهاء، ستظهر رسالة "تم النقل"، وسيصبح المجمع يعمل كقاعدة بيانات منفصلة تماماً.
                </div>
              </div>

              {/* Error box if any */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

            </div>
          )}

          {/* STAGE 2: LIVE INTERACTIVE TRANSFER IN PROGRESS (وستم النقل امام المبرمج ويحمل) */}
          {migrationState === 'transferring' && (
            <div className="space-y-6 py-4">
              
              {/* Progress Bar & Percentage */}
              <div className="bg-[#064e3b]/50 border-2 border-amber-400/50 rounded-3xl p-6 text-center space-y-4 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-1">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>{progress.title}</span>
                  </span>
                  <span className="font-mono text-base font-black text-white">{progress.percent}%</span>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full bg-[#022c22] rounded-full h-4 p-0.5 border border-[#065f46] overflow-hidden relative">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-300 transition-all duration-300 relative overflow-hidden shadow-[0_0_15px_rgba(251,191,36,0.6)]"
                    style={{ width: `${progress.percent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>

                <p className="text-xs text-[#86efac] animate-pulse">
                  {progress.detail || 'يرجى الانتظار، النظام يقوم بترحيل ونقل كافة الجداول سحابياً...'}
                </p>

                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-300 pt-1">
                  <span>المجمع: <strong className="text-white">{targetComplex?.name}</strong></span>
                  <span>•</span>
                  <span>حساب Google: <strong className="font-mono text-amber-300">{targetGoogleEmail}</strong></span>
                  <span>•</span>
                  <span>الخطوة: <strong className="text-white">{progress.step} / {progress.totalSteps}</strong></span>
                </div>
              </div>

              {/* Live Real-time Terminal / Logs Window */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-emerald-200 font-bold px-1">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>سجل النقل اللحظي المباشر أمام المبرمج (Live Migration Console):</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    مباشر (Real-time)
                  </span>
                </div>

                <div
                  ref={logTerminalRef}
                  className="bg-[#022c22] border-2 border-[#065f46] rounded-2xl p-4 font-mono text-[11px] h-48 overflow-y-auto space-y-1.5 text-emerald-300 shadow-inner"
                >
                  {progress.logs.length === 0 ? (
                    <div className="text-slate-500 text-center py-6">جاري تهيئة البث المباشر لسجلات النقل...</div>
                  ) : (
                    progress.logs.map((log, index) => (
                      <div key={index} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-amber-400">›</span>
                        <span className={index === progress.logs.length - 1 ? 'text-white font-bold' : 'text-[#86efac]/90'}>
                          {log}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* STAGE 3: COMPLETED SCREEN (ولما يخلص تظهر تم النقل وتصبح قاعدة بيانات منفصلة) */}
          {migrationState === 'completed' && migrationResult && (
            <div className="space-y-6 py-2 text-center">
              
              {/* Giant Celebratory Badge */}
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-amber-400 text-[#064e3b] flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.5)]">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              </div>

              <div>
                <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-400 text-emerald-200 font-bold inline-block mb-2 shadow-sm">
                  تم الانتهاء بنجاح 100% ✓
                </span>
                <h3 className="text-2xl sm:text-3xl font-black font-heading text-white">
                  تم النقل بنجاح!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-200 mt-2 max-w-lg mx-auto leading-relaxed">
                  أصبح مجمع <strong className="text-amber-300">({migrationResult.complexName})</strong> يعمل الآن على <strong className="text-white">قاعدة بيانات Firebase منفصلة تماماً</strong> ومرتبطة رسمياً بحساب Google المعتمد.
                </p>
              </div>

              {/* Statistics & Specs Card */}
              <div className="bg-[#064e3b]/60 border-2 border-emerald-400/50 rounded-2xl p-5 text-right space-y-3 max-w-lg mx-auto text-xs shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-[#065f46]">
                  <span className="text-slate-300">المجمع المنقول:</span>
                  <span className="font-bold text-amber-300 font-heading">{migrationResult.complexName}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#065f46]">
                  <span className="text-slate-300">حساب Google المالك:</span>
                  <span className="font-mono font-bold text-white" dir="ltr">{migrationResult.targetGoogleEmail}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#065f46]">
                  <span className="text-slate-300">قاعدة البيانات السحابية المنفصلة:</span>
                  <span className="font-mono text-emerald-300 font-bold">{migrationResult.targetDatabaseId}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#065f46]">
                  <span className="text-slate-300">حالة العزل والاستقلالية:</span>
                  <span className="text-emerald-400 font-black flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    قاعدة بيانات منفصلة معزولة 100%
                  </span>
                </div>

                {/* Sub-records breakdown */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-emerald-200 block mb-2">إجمالي السجلات التي تم ترحيلها ({migrationResult.stats.totalRecords} سجل):</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-center">
                    <div className="p-2 rounded-lg bg-[#022c22] border border-[#065f46]">
                      <span className="text-slate-400 block text-[10px]">الطلاب</span>
                      <strong className="text-emerald-300">{migrationResult.stats.studentsCount}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-[#022c22] border border-[#065f46]">
                      <span className="text-slate-400 block text-[10px]">الحلقات</span>
                      <strong className="text-amber-300">{migrationResult.stats.halaqahsCount}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-[#022c22] border border-[#065f46]">
                      <span className="text-slate-400 block text-[10px]">الحضور</span>
                      <strong className="text-white">{migrationResult.stats.attendanceCount}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-[#022c22] border border-[#065f46]">
                      <span className="text-slate-400 block text-[10px]">التقييمات</span>
                      <strong className="text-amber-400">{migrationResult.stats.evaluationsCount}</strong>
                    </div>
                  </div>
                </div>

                {/* Central database purge status */}
                <div className="pt-2 border-t border-[#065f46] flex items-center justify-between">
                  <span className="text-slate-300">القاعدة المركزية المشتركة:</span>
                  {migrationResult.purgedFromCentral ? (
                    <span className="text-emerald-300 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      تم إفراغ البيانات المركزية وتأمين العزل
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-amber-300 text-[11px]">موجودة نسخة</span>
                      <button
                        type="button"
                        onClick={handlePurgeNow}
                        className="px-2 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-[10px] font-bold cursor-pointer"
                      >
                        إفراغ المركزية الآن
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* STAGE 4: ERROR STATE */}
          {migrationState === 'error' && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-2xl bg-red-950/60 border-2 border-red-500/60 text-red-200 space-y-2">
                <div className="flex items-center gap-2.5 font-bold text-red-300 text-sm">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span>تعذر إتمام عملية ترحيل المجمع</span>
                </div>
                <p className="text-xs leading-relaxed">{errorMessage}</p>
              </div>

              {progress.logs.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-300 font-bold">السجلات قبل التوقف:</span>
                  <div className="bg-[#022c22] border border-red-500/30 rounded-xl p-3 font-mono text-[10px] h-32 overflow-y-auto text-red-200">
                    {progress.logs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-6 bg-[#022c22] border-t border-[#065f46] flex items-center justify-between gap-3 shrink-0">
          {migrationState === 'configure' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleStartMigration}
                className="px-6 py-3 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] text-xs sm:text-sm font-black shadow-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <ArrowRightLeft className="w-4 h-4 text-[#064e3b] stroke-[2.5]" />
                <span>بدء نقل البيانات وإنشاء القاعدة المنفصلة الآن</span>
              </button>
            </>
          )}

          {migrationState === 'transferring' && (
            <div className="w-full text-center text-xs text-amber-300 flex items-center justify-center gap-2 font-bold py-1">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>جاري النقل والتحميل سحابياً، يرجى عدم إغلاق هذه النافذة...</span>
            </div>
          )}

          {migrationState === 'completed' && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:brightness-110 text-[#064e3b] font-black text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>تم، إغلاق والعودة للوحة التحكم</span>
            </button>
          )}

          {migrationState === 'error' && (
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => setMigrationState('configure')}
                className="px-5 py-2 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] text-xs font-black shadow-lg cursor-pointer"
              >
                إعادة المحاولة وتعديل الإعدادات
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
