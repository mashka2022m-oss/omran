import React, { useState } from 'react';
import {
  Download,
  Upload,
  Database,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileJson,
  ShieldCheck,
  Server,
  Cloud,
  ExternalLink,
  HardDrive,
  Building2,
  Layers,
  Sparkles,
  ArrowRightLeft,
  Trash2,
  Check,
  Link,
  Lock,
  Key
} from 'lucide-react';
import { OmranDataService } from '../../lib/firebase';
import { GoogleWorkspaceService } from '../../lib/googleWorkspace';
import { FullBackupData, GoogleOAuthConfig, QuranComplex, ComplexBackupData } from '../../types';

interface DataBackupTabProps {
  onRefreshAllData: () => Promise<void>;
  googleAuthConfig?: GoogleOAuthConfig;
  onRefreshGoogleAuth?: () => Promise<void>;
  isSupervisor?: boolean;
  isDeveloper?: boolean;
  complexes?: QuranComplex[];
  onSaveComplex?: (complex: QuranComplex) => Promise<void>;
}

export const DataBackupTab: React.FC<DataBackupTabProps> = ({
  onRefreshAllData,
  googleAuthConfig,
  onRefreshGoogleAuth,
  isSupervisor,
  isDeveloper,
  complexes = [],
  onSaveComplex
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingDrive, setIsExportingDrive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<FullBackupData | null>(null);
  const [driveExportResult, setDriveExportResult] = useState<{ fileName: string; folderName: string; webViewLink: string } | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string; linkUrl?: string; linkText?: string } | null>(null);

  // Complex-specific state
  const [selectedComplexId, setSelectedComplexId] = useState<string>(complexes[0]?.id || '');
  const [showDbConfigForm, setShowDbConfigForm] = useState(false);
  const [customDbConfig, setCustomDbConfig] = useState({
    apiKey: '',
    projectId: '',
    authDomain: '',
    storageBucket: '',
    appId: ''
  });
  const [isSavingDbConfig, setIsSavingDbConfig] = useState(false);

  // Complex export / import / purge state
  const [isExportingComplex, setIsExportingComplex] = useState(false);
  const [isImportingComplex, setIsImportingComplex] = useState(false);
  const [complexBackupToRestore, setComplexBackupToRestore] = useState<ComplexBackupData | null>(null);

  // Complex purge dialog
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeConfirmationText, setPurgeConfirmationText] = useState('');
  const [isPurging, setIsPurging] = useState(false);

  // Complex migration / transfer dialog
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetDb, setTransferTargetDb] = useState({
    projectId: '',
    apiKey: '',
    notes: ''
  });
  const [isTransferring, setIsTransferring] = useState(false);

  const activeComplex = complexes.find(c => c.id === selectedComplexId) || complexes[0];

  // Handle Full Export to Local JSON
  const handleExport = async () => {
    setIsExporting(true);
    setStatusMsg(null);
    try {
      const backupData = await OmranDataService.exportFullBackup();
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `omran_quran_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMsg({
        type: 'success',
        text: 'تم تصدير النسخة الاحتياطية الكاملة لبيانات المنصة بنجاح!'
      });
    } catch (e: any) {
      setStatusMsg({
        type: 'error',
        text: 'فشل تصدير النسخة الاحتياطية: ' + (e.message || 'خطأ غير معروف')
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Direct Export to Google Drive
  const handleExportGoogleDrive = async () => {
    setIsExportingDrive(true);
    setStatusMsg(null);
    setDriveExportResult(null);

    try {
      let token = await GoogleWorkspaceService.getValidAccessToken();
      if (!token) {
        const linkRes = await GoogleWorkspaceService.linkGoogleAccount();
        token = linkRes.accessToken;
        if (onRefreshGoogleAuth) await onRefreshGoogleAuth();
      }

      const backupData = await OmranDataService.exportFullBackup();
      const res = await GoogleWorkspaceService.exportBackupToGoogleDrive(backupData, googleAuthConfig);
      setDriveExportResult(res);

      setStatusMsg({
        type: 'success',
        text: `تم حفظ النسخة الاحتياطية بنجاح في Google Drive داخل مجلد "${res.folderName}"!`,
        linkUrl: res.webViewLink,
        linkText: 'فتح الملف في Google Drive ↗'
      });
    } catch (e: any) {
      setStatusMsg({
        type: 'error',
        text: 'تعذر تصدير النسخة إلى Google Drive: ' + (e.message || 'يرجى ربط حساب Google أولاً')
      });
    } finally {
      setIsExportingDrive(false);
    }
  };

  // Handle Full JSON Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backupData: FullBackupData = JSON.parse(content);

        if (!backupData || (!Array.isArray(backupData.students) && !Array.isArray(backupData.attendance))) {
          throw new Error('الملف لا يحتوي على بيانات نسخة احتياطية صالحة لمنصة عمران.');
        }

        setPendingRestore(backupData);
      } catch (err: any) {
        setStatusMsg({
          type: 'error',
          text: 'الملف غير صالح أو تالف: ' + err.message
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;
    setIsImporting(true);
    setStatusMsg(null);

    try {
      const stats = await OmranDataService.importFullBackup(pendingRestore);
      await onRefreshAllData();
      setStatusMsg({
        type: 'success',
        text: `تمت استعادة البيانات بنجاح: (${stats.studentsCount}) طالب، (${stats.attendanceCount}) سجل حضور، (${stats.halaqahsCount || 0}) حلقة، و (${stats.complexesCount || 0}) مجمع!`
      });
      setPendingRestore(null);
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'فشل استيراد النسخة الاحتياطية: ' + (err.message || 'خطأ غير متوقع')
      });
    } finally {
      setIsImporting(false);
    }
  };

  // ----------------------------------------------------
  // Complex Specific Database Handlers
  // ----------------------------------------------------

  // 1. Export Complex Backup
  const handleExportComplexBackup = async () => {
    if (!activeComplex) return;
    setIsExportingComplex(true);
    setStatusMsg(null);
    try {
      const complexData = await OmranDataService.exportComplexBackup(activeComplex.id);
      const jsonStr = JSON.stringify(complexData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `omran_complex_${activeComplex.name.replace(/\s+/g, '_')}_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMsg({
        type: 'success',
        text: `تم تصدير نسخة احتياطية مستقلة لمجمع (${activeComplex.name}) بنجاح! تحتوي على (${complexData.students.length}) طلاب و (${complexData.halaqahs.length}) حلقات.`
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'فشل تصدير مجمع: ' + (err.message || 'خطأ غير معروف') });
    } finally {
      setIsExportingComplex(false);
    }
  };

  // 2. Import Complex Backup File
  const handleUploadComplexBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeComplex) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backupData: ComplexBackupData = JSON.parse(content);

        if (!backupData || !Array.isArray(backupData.halaqahs) || !Array.isArray(backupData.students)) {
          throw new Error('ملف المجمع غير صالح أو لا يحتوي على بنية بيانات مجمع صحيحة.');
        }

        setComplexBackupToRestore(backupData);
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: 'ملف المجمع غير صالح: ' + err.message });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImportComplex = async () => {
    if (!complexBackupToRestore || !activeComplex) return;
    setIsImportingComplex(true);
    setStatusMsg(null);
    try {
      const stats = await OmranDataService.importComplexBackup(complexBackupToRestore, activeComplex.id);
      await onRefreshAllData();
      setStatusMsg({
        type: 'success',
        text: `تم استيراد بيانات المجمع (${activeComplex.name}) بنجاح: (${stats.studentsCount}) طالب و (${stats.halaqahsCount}) حلقات!`
      });
      setComplexBackupToRestore(null);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'فشل استيراد المجمع: ' + err.message });
    } finally {
      setIsImportingComplex(false);
    }
  };

  // 3. Save Custom Database Config for Complex (الربط والتفعيل)
  const handleSaveCustomDatabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplex) return;
    if (!customDbConfig.projectId.trim() || !customDbConfig.apiKey.trim()) {
      setStatusMsg({ type: 'error', text: 'يرجى إدخال Project ID و API Key على الأقل.' });
      return;
    }

    try {
      setIsSavingDbConfig(true);
      const updatedConfig = {
        isCustom: true,
        projectId: customDbConfig.projectId.trim(),
        apiKey: customDbConfig.apiKey.trim(),
        authDomain: customDbConfig.authDomain.trim() || `${customDbConfig.projectId.trim()}.firebaseapp.com`,
        storageBucket: customDbConfig.storageBucket.trim() || `${customDbConfig.projectId.trim()}.appspot.com`,
        appId: customDbConfig.appId.trim(),
        enabledAt: new Date().toISOString()
      };

      await OmranDataService.updateComplexDatabaseConfig(activeComplex.id, updatedConfig);
      if (onSaveComplex) {
        await onSaveComplex({
          ...activeComplex,
          databaseConfig: updatedConfig
        });
      }
      await onRefreshAllData();

      setStatusMsg({
        type: 'success',
        text: `تم ربط وتفعيل قاعدة البيانات المنفصلة لمجمع (${activeComplex.name}) بالمشروع (${updatedConfig.projectId}) بنجاح!`
      });
      setShowDbConfigForm(false);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'فشل ربط قاعدة البيانات: ' + err.message });
    } finally {
      setIsSavingDbConfig(false);
    }
  };

  // 4. Reset to Default Central Database
  const handleResetToCentralDatabase = async () => {
    if (!activeComplex) return;
    try {
      setIsSavingDbConfig(true);
      await OmranDataService.updateComplexDatabaseConfig(activeComplex.id, { isCustom: false });
      if (onSaveComplex) {
        await onSaveComplex({
          ...activeComplex,
          databaseConfig: { isCustom: false }
        });
      }
      await onRefreshAllData();
      setStatusMsg({
        type: 'success',
        text: `تمت إعادة مجمع (${activeComplex.name}) إلى قاعدة البيانات السحابية المركزية الموحدة للمنصة.`
      });
      setShowDbConfigForm(false);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'حدث خطأ: ' + err.message });
    } finally {
      setIsSavingDbConfig(false);
    }
  };

  // 5. Purge Complex Data (إفراغ بيانات المجمع)
  const handlePurgeComplexData = async () => {
    if (!activeComplex || purgeConfirmationText.trim() !== 'تأكيد الإفراغ') return;
    try {
      setIsPurging(true);
      const res = await OmranDataService.purgeComplexData(activeComplex.id);
      await onRefreshAllData();
      setStatusMsg({
        type: 'success',
        text: `تم إفراغ بيانات مجمع (${activeComplex.name}) بنجاح: تم حذف (${res.deletedStudents}) طالب و (${res.deletedAttendance}) سجل حضور بأمان.`
      });
      setIsPurgeModalOpen(false);
      setPurgeConfirmationText('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'فشل إفراغ بيانات المجمع: ' + err.message });
    } finally {
      setIsPurging(false);
    }
  };

  // 6. Transfer Complex Data (نقل لقاعدة بيانات)
  const handleTransferComplexData = async () => {
    if (!activeComplex) return;
    try {
      setIsTransferring(true);
      const complexData = await OmranDataService.exportComplexBackup(activeComplex.id);

      const jsonStr = JSON.stringify(complexData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transfer_${activeComplex.id}_${transferTargetDb.projectId || 'external'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMsg({
        type: 'success',
        text: `تم تجهيز ونقل بيانات مجمع (${activeComplex.name}) المستهدفة لقاعدة البيانات (${transferTargetDb.projectId || 'الخارجية'}) وتنزيل ملف حزمة الترحيل!`
      });
      setIsTransferModalOpen(false);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'فشل النقل: ' + err.message });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-[#f0f9f6]" dir="rtl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#022c22] to-[#064e3b] border-2 border-amber-500/40 rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                رتبة مبرمج المنصة (خاص بالشيخ محمد منتصر)
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                قواعد البيانات الموزعة والمجمعات
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">
              النسخ الاحتياطي وفصل قواعد بيانات المجمعات
            </h2>
            <p className="text-xs sm:text-sm text-[#86efac] max-w-2xl leading-relaxed">
              تحكم كامل في قواعد البيانات السحابية: ربط كل مجمع بقاعدة بيانات خاصة منفصلة، تصدير واستيراد بيانات المجمعات، نقل البيانات، وإفراغ السجلات بأمان تام.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#064e3b] font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-[#064e3b] stroke-[2.5]" />
              <span>{isExporting ? 'جاري التصدير...' : 'تصدير شامل للمنصة'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {statusMsg && (
        <div
          className={`p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-bold shadow-lg ${
            statusMsg.type === 'success'
              ? 'bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24]'
              : 'bg-red-500/20 border border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-[#fbbf24]" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-300" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          {statusMsg.linkUrl && (
            <a
              href={statusMsg.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#fbbf24] text-[#064e3b] text-xs font-black hover:brightness-110 shadow shrink-0 cursor-pointer"
            >
              <span>{statusMsg.linkText || 'عرض في Google Drive'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: COMPLEX DATABASE SEPARATION & MANAGEMENT (المجمعات وقواعد البيانات) */}
      {/* ========================================================================= */}
      <div className="bg-[#022c22]/95 border-2 border-amber-500/40 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#065f46]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-[#064e3b] flex items-center justify-center shadow-lg shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black font-heading text-white">
                  فصل وتخصيص قواعد بيانات المجمعات القرآنية
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  خاص بالمبرمج
                </span>
              </div>
              <p className="text-xs text-[#86efac] mt-0.5">
                يمكنك جعل كل مجمع يعمل على قاعدة بيانات خاصة به منفصلة تماماً، أو إبقاؤه على القاعدة المركزية.
              </p>
            </div>
          </div>

          {/* Complex Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-200">اختر المجمع:</span>
            <select
              value={selectedComplexId}
              onChange={e => {
                setSelectedComplexId(e.target.value);
                setShowDbConfigForm(false);
              }}
              className="bg-[#064e3b] border-2 border-amber-400/50 rounded-2xl px-4 py-2 text-xs sm:text-sm font-black text-amber-300 outline-none cursor-pointer focus:border-amber-400"
            >
              {complexes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.databaseConfig?.isCustom ? '⚡ (قاعدة منفصلة)' : '☁️ (قاعدة مركزية)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeComplex && (
          <div className="space-y-6">
            {/* Active Complex Status Card */}
            <div className="bg-[#064e3b]/50 border border-[#065f46] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base font-bold text-white">
                    المجمع النشط: <span className="text-amber-300">{activeComplex.name}</span>
                  </h4>
                  {activeComplex.databaseConfig?.isCustom ? (
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-900/80 text-blue-200 border border-blue-400 font-mono font-bold">
                      قاعدة بيانات منفصلة: {activeComplex.databaseConfig.projectId}
                    </span>
                  ) : (
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-900/80 text-emerald-200 border border-emerald-400 font-bold">
                      قاعدة بيانات المنصة المركزية المشتركة
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#86efac]">
                  المشرف المسؤول: <strong className="text-white">{activeComplex.supervisorTeacherName || 'محمد منتصر'}</strong>
                  {activeComplex.databaseConfig?.enabledAt && (
                    <span className="mr-3 text-slate-300">
                      (تاريخ الربط: {new Date(activeComplex.databaseConfig.enabledAt).toLocaleDateString('ar-SA')})
                    </span>
                  )}
                </p>
              </div>

              {/* Action buttons for this complex */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowDbConfigForm(!showDbConfigForm)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-[#064e3b] text-xs font-black shadow transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>{activeComplex.databaseConfig?.isCustom ? 'تعديل ربط قاعدة البيانات' : 'ربط بقاعدة بيانات منفصلة'}</span>
                </button>

                {activeComplex.databaseConfig?.isCustom && (
                  <button
                    onClick={handleResetToCentralDatabase}
                    disabled={isSavingDbConfig}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition-all cursor-pointer"
                  >
                    إعادة للقاعدة المركزية
                  </button>
                )}
              </div>
            </div>

            {/* FORM: Link to Custom Database (ربط وتفعيل) */}
            {showDbConfigForm && (
              <form onSubmit={handleSaveCustomDatabaseConfig} className="bg-[#064e3b]/70 border-2 border-amber-400/50 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#065f46] pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-amber-400" />
                    <h4 className="text-sm font-bold text-white">
                      ربط وتفعيل قاعدة بيانات خاصة لمجمع: ({activeComplex.name})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDbConfigForm(false)}
                    className="text-xs text-slate-300 hover:text-white underline cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>

                <p className="text-xs text-amber-200">
                  أدخل بيانات مشروع Firebase المخصص لهذا المجمع ثم اضغط "تفعيل" لتوجيه مزامنة بياناته تلقائياً:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#86efac] mb-1">
                      معرف المشروع (Firebase Project ID): <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: quran-complex-sub1"
                      value={customDbConfig.projectId}
                      onChange={e => setCustomDbConfig(prev => ({ ...prev, projectId: e.target.value }))}
                      className="w-full bg-[#022c22] border border-[#065f46] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#86efac] mb-1">
                      مفتاح التطبيق (Web API Key): <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="AIzaSy..."
                      value={customDbConfig.apiKey}
                      onChange={e => setCustomDbConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      className="w-full bg-[#022c22] border border-[#065f46] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#86efac] mb-1">
                      نطاق المصادقة (Auth Domain):
                    </label>
                    <input
                      type="text"
                      placeholder="quran-complex-sub1.firebaseapp.com"
                      value={customDbConfig.authDomain}
                      onChange={e => setCustomDbConfig(prev => ({ ...prev, authDomain: e.target.value }))}
                      className="w-full bg-[#022c22] border border-[#065f46] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#86efac] mb-1">
                      معرف التطبيق (App ID):
                    </label>
                    <input
                      type="text"
                      placeholder="1:123456789:web:abcdef"
                      value={customDbConfig.appId}
                      onChange={e => setCustomDbConfig(prev => ({ ...prev, appId: e.target.value }))}
                      className="w-full bg-[#022c22] border border-[#065f46] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDbConfigForm(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingDbConfig}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-[#064e3b] text-xs font-black shadow-lg cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSavingDbConfig ? 'جاري التفعيل والربط...' : 'تفعيل والربط بقاعدة البيانات الخاصة'}
                  </button>
                </div>
              </form>
            )}

            {/* 4 ACTION TILES FOR THIS COMPLEX */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Tile 1: Export Complex Data */}
              <div className="bg-[#064e3b]/40 border border-[#065f46] hover:border-amber-400/50 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#022c22] border border-amber-400/40 text-amber-400 flex items-center justify-center mb-2.5">
                    <Download className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">تصدير نسخة المجمع</h4>
                  <p className="text-[11px] text-[#86efac]/80 mt-1 leading-relaxed">
                    تنزيل ملف JSON يحتوي فقط على حلقات وطلاب وسجلات مجمع ({activeComplex.name}).
                  </p>
                </div>
                <button
                  onClick={handleExportComplexBackup}
                  disabled={isExportingComplex}
                  className="w-full py-2 px-3 rounded-xl bg-[#022c22] hover:bg-[#064e3b] border border-amber-400/40 text-amber-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isExportingComplex ? 'جاري التصدير...' : 'تصدير نسخة المجمع'}
                </button>
              </div>

              {/* Tile 2: Import / Restore Complex Data */}
              <div className="bg-[#064e3b]/40 border border-[#065f46] hover:border-amber-400/50 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#022c22] border border-emerald-400/40 text-emerald-400 flex items-center justify-center mb-2.5">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">استيراد بيانات لمجمع</h4>
                  <p className="text-[11px] text-[#86efac]/80 mt-1 leading-relaxed">
                    تحميل نسخة سابقة خاصة بهذا المجمع ودمجها مباشرة في قاعدة بياناته.
                  </p>
                </div>
                <label className="w-full py-2 px-3 rounded-xl bg-[#022c22] hover:bg-[#064e3b] border border-[#065f46] text-emerald-300 hover:text-white text-xs font-bold transition-all cursor-pointer text-center block">
                  <span>{isImportingComplex ? 'جاري الاستيراد...' : 'اختيار ملف (.json)'}</span>
                  <input
                    type="file"
                    accept=".json"
                    disabled={isImportingComplex}
                    onChange={handleUploadComplexBackup}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Tile 3: Transfer to Database (نقل لقاعدة بيانات) */}
              <div className="bg-[#064e3b]/40 border border-[#065f46] hover:border-amber-400/50 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#022c22] border border-blue-400/40 text-blue-400 flex items-center justify-center mb-2.5">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">نقل لقاعدة بيانات</h4>
                  <p className="text-[11px] text-[#86efac]/80 mt-1 leading-relaxed">
                    نقل وترحيل بيانات المجمع المحددة مباشرة إلى قاعدة بيانات خارجية أو خادم بديل.
                  </p>
                </div>
                <button
                  onClick={() => setIsTransferModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-[#022c22] hover:bg-[#064e3b] border border-blue-400/40 text-blue-300 text-xs font-bold transition-all cursor-pointer"
                >
                  بدء نقل البيانات...
                </button>
              </div>

              {/* Tile 4: Purge Complex Data (إفراغ بيانات المجمع) */}
              <div className="bg-rose-950/30 border border-rose-600/40 hover:border-rose-500 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#022c22] border border-rose-400/40 text-rose-400 flex items-center justify-center mb-2.5">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-rose-200">إفراغ بيانات المجمع</h4>
                  <p className="text-[11px] text-rose-300/80 mt-1 leading-relaxed">
                    حذف الطلاب وسجلات الحضور والتقييمات التابعة لهذا المجمع حصراً مع حماية باقي المنصة.
                  </p>
                </div>
                <button
                  onClick={() => setIsPurgeModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-600/60 text-rose-200 text-xs font-bold transition-all cursor-pointer"
                >
                  إفراغ السجلات...
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: GENERAL PLATFORM FULL BACKUPS (Google Drive & JSON) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-[#fbbf24]" />
          <span>النسخ الاحتياطي العام لكامل منصة عمران:</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Google Drive Cloud Backup */}
          <div className="bg-gradient-to-b from-[#064e3b]/80 to-[#022c22]/90 border-2 border-[#fbbf24]/40 rounded-[32px] p-6 sm:p-7 space-y-6 shadow-2xl backdrop-blur-md flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#022c22] border border-[#fbbf24] text-[#fbbf24] flex items-center justify-center shadow-lg">
                  <Cloud className="w-6 h-6" />
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  سحابي 100%
                </span>
              </div>
              <h3 className="text-base font-bold font-heading text-white">
                نسخ احتياطي سحابي إلى Google Drive
              </h3>
              <p className="text-xs text-[#86efac]/90 leading-relaxed">
                تصدير مباشر وكامل لقاعدة البيانات السحابية إلى مجلد <strong className="text-white">"نسخ منصة عمران القرآنية الاحتياطية"</strong> في Google Drive مع التوقيت والتوثيق الدقيق.
              </p>

              {googleAuthConfig?.isLinked && googleAuthConfig.connectedEmail && (
                <div className="p-2.5 rounded-xl bg-[#022c22]/80 border border-emerald-700/60 text-[11px] text-emerald-300">
                  الحساب المربوط: <span className="font-mono text-white">{googleAuthConfig.connectedEmail}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 relative z-10">
              <button
                onClick={handleExportGoogleDrive}
                disabled={isExportingDrive}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#fbbf24] to-amber-500 hover:brightness-110 disabled:opacity-50 text-[#064e3b] font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Cloud className="w-4 h-4 text-[#064e3b]" />
                <span>{isExportingDrive ? 'جاري التصدير السحابي...' : 'تصدير الآن إلى Google Drive'}</span>
              </button>

              {driveExportResult && (
                <a
                  href={driveExportResult.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center py-2 px-3 rounded-xl bg-[#022c22] border border-[#fbbf24]/30 text-[#fbbf24] text-xs font-bold hover:bg-[#064e3b] transition-all cursor-pointer"
                >
                  <span>فتح ملف النسخة المحفوظة ↗</span>
                </a>
              )}
            </div>
          </div>

          {/* Card 2: Export Local JSON Card */}
          <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 sm:p-7 space-y-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#022c22] border border-[#fbbf24]/40 text-[#fbbf24] flex items-center justify-center shadow-md">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold font-heading text-white">
                تنزيل نسخة احتياطية (JSON محلي)
              </h3>
              <p className="text-xs text-[#86efac]/80 leading-relaxed">
                تحميل ملف بصيغة JSON على جهاز الكمبيوتر أو الهاتف يحتوي على جميع سجلات الطلاب والمجمعات والتقييمات والخطط القرآنية المحدثة.
              </p>
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#022c22] hover:bg-[#065f46] border border-[#fbbf24]/50 disabled:opacity-50 text-[#fbbf24] font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#fbbf24]" />
              <span>{isExporting ? 'جاري تجهيز النسخة...' : 'تنزيل ملف JSON على الجهاز'}</span>
            </button>
          </div>

          {/* Card 3: Import Card */}
          <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 sm:p-7 space-y-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#022c22] border border-[#065f46] text-[#86efac] flex items-center justify-center shadow-md">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold font-heading text-white">
                استعادة / استيراد بيانات سابقة
              </h3>
              <p className="text-xs text-[#86efac]/80 leading-relaxed">
                اختر ملف نسخة احتياطية بصيغة JSON تم تصديره مسبقاً لاستعادة جميع الطلاب والمجمعات وسجلاتهم في قاعدة بيانات المنصة ومزامنتها فوراً.
              </p>
            </div>

            <label className="w-full py-3.5 px-5 rounded-2xl bg-[#022c22] hover:bg-[#065f46] border border-[#065f46] text-[#86efac] hover:text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer">
              <Upload className="w-4 h-4 text-[#fbbf24]" />
              <span>{isImporting ? 'جاري الاستيراد...' : 'اختر ملف النسخة (.json)'}</span>
              <input
                type="file"
                accept=".json"
                disabled={isImporting}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Cloud Sync Status info */}
      <div className="bg-[#064e3b]/40 border border-[#065f46] rounded-[32px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#86efac]/80 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-2xl bg-[#022c22] text-[#fbbf24] flex items-center justify-center border border-[#065f46]">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">مشروع فايربيس السحابي المتصل:</span>
            <span className="font-mono text-[#fbbf24]">omran-ffbad (Firestore Realtime)</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[#fbbf24] font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>المزامنة السحابية النشطة مفعلة للمبرمج محمد منتصر</span>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: Full Restore Confirmation Modal */}
      {/* ---------------------------------------------------- */}
      {pendingRestore && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#064e3b] border border-[#fbbf24]/50 rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#fbbf24]/20 text-[#fbbf24] flex items-center justify-center mx-auto border border-[#fbbf24]/30">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">تأكيد استعادة النسخة الاحتياطية الكاملة</h3>
              <p className="text-xs text-[#86efac]/90 mt-2 leading-relaxed">
                هل أنت متأكد من استعادة هذه النسخة؟
                <br />
                تحتوي على <span className="text-[#fbbf24] font-bold">({pendingRestore.students?.length || 0})</span> طالباً، <span className="text-[#fbbf24] font-bold">({pendingRestore.complexes?.length || 0})</span> مجمعاً، و <span className="text-[#fbbf24] font-bold">({pendingRestore.attendance?.length || 0})</span> سجل حضور.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingRestore(null)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold bg-[#022c22] text-[#86efac] hover:text-white border border-[#065f46] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isImporting}
                className="flex-1 py-2.5 rounded-2xl text-xs font-black bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] shadow-lg cursor-pointer transition-all"
              >
                {isImporting ? 'جاري الاستعادة...' : 'نعم، استعادة البيانات'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: Complex Restore Confirmation Modal */}
      {/* ---------------------------------------------------- */}
      {complexBackupToRestore && activeComplex && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#064e3b] border border-[#fbbf24]/50 rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#fbbf24]/20 text-[#fbbf24] flex items-center justify-center mx-auto border border-[#fbbf24]/30">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">
                استيراد بيانات لمجمع ({activeComplex.name})
              </h3>
              <p className="text-xs text-[#86efac]/90 mt-2 leading-relaxed">
                هل تود دمج بيانات هذه النسخة؟
                <br />
                تتضمن <span className="text-amber-300 font-bold">({complexBackupToRestore.students?.length || 0})</span> طالباً و <span className="text-amber-300 font-bold">({complexBackupToRestore.halaqahs?.length || 0})</span> حلقات.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setComplexBackupToRestore(null)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold bg-[#022c22] text-[#86efac] hover:text-white border border-[#065f46] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmImportComplex}
                disabled={isImportingComplex}
                className="flex-1 py-2.5 rounded-2xl text-xs font-black bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] shadow-lg cursor-pointer transition-all"
              >
                {isImportingComplex ? 'جاري الاستيراد...' : 'تأكيد الاستيراد للمجمع'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: Purge Complex Data Modal (إفراغ بيانات المجمع) */}
      {/* ---------------------------------------------------- */}
      {isPurgeModalOpen && activeComplex && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#022c22] border-2 border-rose-600 rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <h3 className="text-lg font-black text-white">تأكيد إفراغ بيانات المجمع</h3>
            </div>
            <p className="text-xs text-rose-200 leading-relaxed">
              تحذير أمني: أنت على وشك حذف كافة سجلات الطلاب والحضور والتقييمات التابعة لمجمع <strong className="text-white">({activeComplex.name})</strong> نهائياً. لن يتأثر أي مجمع آخر بهذه العملية.
            </p>
            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                لتأكيد الإفراغ، اكتب بالأسفل: <span className="text-rose-400">تأكيد الإفراغ</span>
              </label>
              <input
                type="text"
                placeholder="تأكيد الإفراغ"
                value={purgeConfirmationText}
                onChange={e => setPurgeConfirmationText(e.target.value)}
                className="w-full bg-[#064e3b] border border-rose-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-bold"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsPurgeModalOpen(false);
                  setPurgeConfirmationText('');
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handlePurgeComplexData}
                disabled={isPurging || purgeConfirmationText.trim() !== 'تأكيد الإفراغ'}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg cursor-pointer disabled:opacity-40"
              >
                {isPurging ? 'جاري الإفراغ...' : 'إفراغ بيانات المجمع الآن'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: Transfer Complex Data Modal (نقل لقاعدة بيانات) */}
      {/* ---------------------------------------------------- */}
      {isTransferModalOpen && activeComplex && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#022c22] border-2 border-blue-500 rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-3 text-blue-400">
              <ArrowRightLeft className="w-7 h-7" />
              <h3 className="text-lg font-black text-white">نقل بيانات مجمع ({activeComplex.name})</h3>
            </div>
            <p className="text-xs text-blue-200 leading-relaxed">
              يقوم هذا الخيار باستخراج حزمة البيانات المهيأة للمجمع وتجهيزها للنقل والترحيل إلى قاعدة بيانات مخصصة أو خادم بديل:
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-emerald-200 mb-1">
                  معرف قاعدة البيانات / المشروع المستهدف:
                </label>
                <input
                  type="text"
                  placeholder="مثال: quran-secondary-db"
                  value={transferTargetDb.projectId}
                  onChange={e => setTransferTargetDb(prev => ({ ...prev, projectId: e.target.value }))}
                  className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-200 mb-1">
                  ملاحظات النقل:
                </label>
                <input
                  type="text"
                  placeholder="مثال: نقل الحلقات للمجمع الفرعي الجديد"
                  value={transferTargetDb.notes}
                  onChange={e => setTransferTargetDb(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-[#064e3b] border border-[#065f46] rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleTransferComplexData}
                disabled={isTransferring}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isTransferring ? 'جاري تجهيز النقل...' : 'تأكيد النقل وتنزيل الحزمة'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
