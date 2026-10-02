import React from 'react';
import {
  BookOpen,
  LogOut,
  UserCheck,
  Calendar,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Moon,
  Clock,
  Users,
  Settings,
  Layers,
  ChevronDown,
  Building2,
  Workflow,
  CheckCircle,
  X,
  UserCog
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, AppSettings, Halaqah, QuranComplex, TeacherAccount } from '../types';

interface NavbarProps {
  currentUser: { username: string; role: UserRole; studentId?: string } | null;
  currentTeacher?: TeacherAccount | null;
  onLinkGoogleTeacher?: () => Promise<void>;
  onUnlinkGoogleTeacher?: () => Promise<void>;
  isLinkingGoogleTeacher?: boolean;
  onLogout: () => void;
  settings: AppSettings;
  studentsCount: number;
  teachersCount?: number;
  complexesCount?: number;
  complexName?: string;
  availableComplexes?: QuranComplex[];
  activeComplexId?: string;
  onSwitchComplex?: (complexId: string) => void;
  onOpenMultiComplexModal?: () => void;
  canSwitchComplex?: boolean;
  halaqahs?: Halaqah[];
  assignedHalaqahs?: Halaqah[];
  isSupervisor?: boolean;
  isDeveloper?: boolean;
  activeHalaqahId?: string;
  onSwitchHalaqah?: (halaqahId: string) => void;
  onOpenTeacherManagement?: () => void;
  onOpenSettings?: () => void;
  onOpenComplexManagement?: () => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenEditAccount?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentTeacher,
  onLinkGoogleTeacher,
  onUnlinkGoogleTeacher,
  isLinkingGoogleTeacher = false,
  onLogout,
  settings,
  studentsCount,
  teachersCount = 1,
  complexesCount = 1,
  complexName,
  availableComplexes = [],
  activeComplexId,
  onSwitchComplex,
  onOpenMultiComplexModal,
  canSwitchComplex = false,
  halaqahs = [],
  assignedHalaqahs = [],
  isSupervisor = false,
  isDeveloper = false,
  activeHalaqahId,
  onSwitchHalaqah,
  onOpenTeacherManagement,
  onOpenSettings,
  onOpenComplexManagement,
  onOpenPrivacyPolicy,
  onOpenEditAccount
}) => {
  const todayArabic = new Intl.DateTimeFormat('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  // Determine which halaqahs can be selected by this user
  const selectableHalaqahs = isSupervisor ? halaqahs : assignedHalaqahs;
  const currentHalaqah = halaqahs.find(h => h.id === activeHalaqahId) || selectableHalaqahs[0] || halaqahs[0];
  const displayHalaqahName = currentHalaqah ? currentHalaqah.name : settings.halaqahName;

  return (
    <header className="sticky top-0 z-30 bg-[#064e3b]/95 backdrop-blur-xl border-b border-[#065f46] px-4 lg:px-8 py-3.5 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-[#fbbf24] text-[#064e3b] shadow-[0_0_20px_rgba(251,191,36,0.35)] border border-[#fbbf24]">
            <span className="font-heading font-black text-2xl">ع</span>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full border-2 border-[#064e3b]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold font-heading tracking-tight text-[#fbbf24] flex items-center gap-1.5">
                مَنَصَّةُ عُمْرَان
              </h1>

              {/* Complex Switcher / Badge: Restricted strictly: Programmer switches all, teacher/supervisor switches ONLY if linked to multiple complexes */}
              {canSwitchComplex && availableComplexes.length > 1 && onSwitchComplex ? (
                <div className="flex items-center gap-1.5 bg-[#022c22] border border-amber-400/40 rounded-xl px-2 py-0.5 shadow-sm">
                  <Building2 className="w-3.5 h-3.5 text-[#fbbf24]" />
                  <select
                    value={activeComplexId || availableComplexes[0]?.id || ''}
                    onChange={e => onSwitchComplex(e.target.value)}
                    className="text-xs text-amber-300 font-black bg-transparent border-none focus:outline-none cursor-pointer pr-1"
                    title={isDeveloper ? "التبديل بين كافة المجمعات القرآنية (إشراف شامل)" : "التبديل بين المجمعات المرتبط بها"}
                  >
                    {availableComplexes.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#064e3b] text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {onOpenMultiComplexModal && (
                    <button
                      type="button"
                      onClick={onOpenMultiComplexModal}
                      title="عرض بطاقات المجمعات والحلقات التابعة لك"
                      className="p-1 rounded-md hover:bg-emerald-800 text-amber-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#022c22] text-[#86efac] border border-[#065f46] font-sans font-bold line-clamp-1 max-w-[220px]" title={complexName || 'المنظومة القرآنية'}>
                  {complexName || 'القرآنية'}
                </span>
              )}
            </div>

            {/* Halaqah selector / label with smooth motion.div switching */}
            {currentUser?.role === 'admin' && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeHalaqahId || 'default'}
                  initial={{ opacity: 0, x: -6, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 6, scale: 0.96 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-1.5 mt-0.5"
                >
                  {isSupervisor ? (
                    /* Supervisor Selector: Can view all halaqahs combined or filter to a specific halaqah */
                    halaqahs.length > 0 && onSwitchHalaqah ? (
                      <div className="flex items-center gap-1.5 bg-[#022c22]/90 border border-emerald-500/40 rounded-xl px-2 py-0.5 shadow-[0_0_12px_rgba(16,185,129,0.12)]">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                        </span>
                        <span className="text-[10px] text-amber-300 font-bold hidden xs:inline">مساحة الحلقة:</span>
                        <select
                          value={activeHalaqahId || 'all'}
                          onChange={e => onSwitchHalaqah(e.target.value)}
                          className="text-xs text-[#86efac] font-bold bg-transparent border-none cursor-pointer focus:outline-none max-w-[150px] sm:max-w-[210px] truncate"
                          title="التبديل بين حلقات العمل"
                        >
                          <option value="all" className="bg-[#064e3b] text-white">
                            {isDeveloper ? 'جميع الحلقات لكافة المجمعات' : `جميع حلقات ${complexName || 'المجمع'}`} ({studentsCount} طالب)
                          </option>
                          {halaqahs.map(h => (
                            <option key={h.id} value={h.id} className="bg-[#064e3b] text-white">
                              {h.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <p className="text-xs text-[#86efac]/90 font-medium line-clamp-1">
                        {displayHalaqahName}
                      </p>
                    )
                  ) : (
                    /* Teacher View: restricted to assigned halaqahs only */
                    assignedHalaqahs.length > 1 && onSwitchHalaqah ? (
                      <div className="flex items-center gap-1.5 bg-[#022c22]/90 border border-amber-400/40 rounded-xl px-2 py-0.5 shadow-[0_0_12px_rgba(251,191,36,0.15)]">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                        </span>
                        <span className="text-[10px] text-amber-300 font-bold hidden xs:inline">الحلقة:</span>
                        <select
                          value={activeHalaqahId || assignedHalaqahs[0]?.id || ''}
                          onChange={e => onSwitchHalaqah(e.target.value)}
                          className="text-xs text-[#fbbf24] font-bold bg-transparent border-none cursor-pointer focus:outline-none max-w-[140px] sm:max-w-[190px] truncate"
                          title="التبديل بين مساحات حلقاتك المخصصة"
                        >
                          {assignedHalaqahs.map(h => (
                            <option key={h.id} value={h.id} className="bg-[#064e3b] text-white">
                              {h.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : assignedHalaqahs.length === 1 ? (
                      <div className="inline-flex items-center gap-1.5 text-xs text-[#86efac] font-semibold bg-[#022c22]/90 px-2.5 py-0.5 rounded-xl border border-[#065f46] shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[#fbbf24] font-bold">الحلقة:</span>
                        <span className="line-clamp-1">{assignedHalaqahs[0].name}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-300 font-bold bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-lg">
                        لم يتم تعيينك في حلقة بعد
                      </span>
                    )
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {currentUser?.role === 'student' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-[#86efac]/90 font-medium line-clamp-1"
              >
                {displayHalaqahName}
              </motion.p>
            )}
          </div>
        </div>

        {/* Center Info Bar (Desktop) */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6 px-4 py-1.5 rounded-2xl bg-[#022c22]/70 border border-[#065f46] text-xs text-[#f0f9f6]">
          <div className="flex items-center gap-2 text-[#86efac]">
            <Calendar className="w-4 h-4 text-[#fbbf24]" />
            <span>{todayArabic}</span>
          </div>
          {currentUser?.role === 'admin' && (
            <>
              <span className="w-1 h-1 rounded-full bg-[#065f46]" />
              <div className="flex items-center gap-1.5 text-[#fbbf24] font-bold">
                <UserCheck className="w-4 h-4" />
                <span>{studentsCount} طالباً مسجلاً</span>
              </div>
            </>
          )}
        </div>

        {/* Right User & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Top Complexes Button (Exclusively for Programmer: إدارة المجمعات القرآنية والحلقات التابعة) */}
          {currentUser?.role === 'admin' && isDeveloper && onOpenComplexManagement && (
            <button
              onClick={onOpenComplexManagement}
              title="إدارة المجمعات القرآنية وتوزيع الحلقات"
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-[#064e3b] text-xs font-black shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>المجمعات</span>
              {complexesCount !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#022c22] text-amber-300 font-mono font-bold">
                  {complexesCount}
                </span>
              )}
            </button>
          )}

          {/* Top Settings Button (Exclusively for Supervisor/Programmer: إدارة المعلمين والحلقات ونقل الطلاب) */}
          {currentUser?.role === 'admin' && isSupervisor && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              title="إعدادات الحلقات والمعلمين ونقل الطلاب"
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] text-xs font-black shadow-[0_0_15px_rgba(251,191,36,0.25)] transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">الإعدادات</span>
            </button>
          )}

          {currentUser?.role === 'admin' && isSupervisor && !onOpenSettings && onOpenTeacherManagement && (
            <button
              onClick={onOpenTeacherManagement}
              title="إدارة حسابات المعلمين"
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-2xl bg-[#022c22] hover:bg-[#065f46] border border-[#fbbf24]/30 hover:border-[#fbbf24] text-xs font-bold text-[#fbbf24] shadow-sm transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span className="hidden sm:inline">إدارة المعلمين</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#064e3b] text-[#86efac] font-mono font-bold">
                {teachersCount}
              </span>
            </button>
          )}

          {/* Google Account Linking for Teachers and Supervisors */}
          {currentUser?.role === 'admin' && currentTeacher && (
            <div className="flex items-center">
              {currentTeacher.isGoogleLinked && currentTeacher.googleEmail ? (
                <div
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-2xl bg-[#022c22] border border-emerald-500/50 text-xs shadow-sm"
                  title={`حساب Google المرتبط: ${currentTeacher.googleEmail}`}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className="text-[11px] font-bold text-emerald-300 hidden md:inline">
                    مربوط بـ Google
                  </span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {onUnlinkGoogleTeacher && (
                    <button
                      type="button"
                      onClick={onUnlinkGoogleTeacher}
                      title="إلغاء ربط حساب Google"
                      className="text-slate-400 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer mr-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                onLinkGoogleTeacher && (
                  <button
                    type="button"
                    onClick={onLinkGoogleTeacher}
                    disabled={isLinkingGoogleTeacher}
                    title="ربط حسابك الحالي بحساب Google لتسجيل الدخول السريع لاحقاً"
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-black shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-lg transition-all cursor-pointer border border-slate-200 disabled:opacity-60"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="font-heading font-extrabold text-slate-800">
                      {isLinkingGoogleTeacher ? 'جاري الربط...' : 'ربط بحساب Google'}
                    </span>
                  </button>
                )
              )}
            </div>
          )}

          {/* Privacy Policy Quick In-App Button */}
          {onOpenPrivacyPolicy && (
            <button
              onClick={onOpenPrivacyPolicy}
              title="سياسة الخصوصية وحماية البيانات (Privacy Policy)"
              className="p-2 rounded-xl bg-[#022c22] hover:bg-[#065f46] border border-emerald-500/30 text-[#86efac] hover:text-white transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline text-xs font-bold">الخصوصية</span>
            </button>
          )}

          {currentUser && (
            <div className="flex items-center gap-2 bg-[#022c22]/80 border border-[#065f46] rounded-2xl px-2.5 sm:px-3.5 py-1.5 shadow-inner">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-[#fbbf24] flex items-center justify-center text-sm font-bold border border-emerald-500/30 shrink-0">
                {currentUser.username.charAt(0)}
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  {currentUser.username}
                </div>
                <div className="text-[10px] text-[#86efac]">
                  {currentUser.role === 'admin' ? (isDeveloper ? 'معلم ومشرف ومبرمج' : isSupervisor ? 'المعلم المشرف' : 'معلم عادي') : 'حساب طالب'}
                </div>
              </div>

              {/* Edit Account Button (for Teachers, Supervisors, and Developers) */}
              {currentUser.role === 'admin' && onOpenEditAccount && (
                <button
                  type="button"
                  onClick={onOpenEditAccount}
                  title="تعديل بيانات الحساب (اسم المستخدم، كلمة المرور، والاسم الرباعي)"
                  className="p-1.5 text-[#fbbf24] hover:text-white hover:bg-emerald-900/60 rounded-xl transition-colors cursor-pointer mr-1 flex items-center gap-1 text-[11px] font-bold"
                >
                  <UserCog className="w-4 h-4" />
                  <span className="hidden md:inline">تعديل الحساب</span>
                </button>
              )}

              <button
                onClick={onLogout}
                title="تسجيل الخروج"
                className="mr-1 p-1.5 text-slate-300 hover:text-red-400 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
