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
  Building2
} from 'lucide-react';
import { UserRole, AppSettings, Halaqah, QuranComplex } from '../types';

interface NavbarProps {
  currentUser: { username: string; role: UserRole; studentId?: string } | null;
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
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
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
  onOpenPrivacyPolicy
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
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
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
                    title={isDeveloper ? "التبديل بين كافة المجمعات القرآنية (صلاحية المبرمج)" : "التبديل بين المجمعات المرتبط بها"}
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

            {/* Halaqah selector / label */}
            {currentUser?.role === 'admin' && (
              <div className="flex items-center gap-1.5 mt-0.5">
                {isSupervisor ? (
                  /* Supervisor Selector: Can view all halaqahs combined or filter to a specific halaqah */
                  halaqahs.length > 0 && onSwitchHalaqah ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-amber-300/80 font-bold hidden sm:inline">الحلقة:</span>
                      <select
                        value={activeHalaqahId || 'all'}
                        onChange={e => onSwitchHalaqah(e.target.value)}
                        className="text-xs text-[#86efac] font-medium bg-[#022c22] border border-[#065f46] rounded-lg px-2 py-0.5 cursor-pointer focus:border-[#fbbf24] focus:outline-none"
                      >
                        <option value="all">
                          {isDeveloper ? 'جميع الحلقات لكافة المجمعات' : `جميع حلقات ${complexName || 'المجمع'}`} ({studentsCount} طالب)
                        </option>
                        {halaqahs.map(h => (
                          <option key={h.id} value={h.id}>
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-amber-300 font-bold">التبديل بين حلقاتك:</span>
                      <select
                        value={activeHalaqahId || assignedHalaqahs[0]?.id || ''}
                        onChange={e => onSwitchHalaqah(e.target.value)}
                        className="text-xs text-[#fbbf24] font-bold bg-[#022c22] border border-[#fbbf24]/50 rounded-lg px-2 py-0.5 cursor-pointer focus:border-[#fbbf24] focus:outline-none"
                      >
                        {assignedHalaqahs.map(h => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : assignedHalaqahs.length === 1 ? (
                    <div className="inline-flex items-center gap-1 text-xs text-[#86efac] font-semibold bg-[#022c22] px-2 py-0.5 rounded-lg border border-[#065f46]">
                      <span className="text-[#fbbf24]">الحلقة:</span>
                      <span className="line-clamp-1">{assignedHalaqahs[0].name}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-amber-300 font-bold bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-lg">
                      لم يتم تعيينك في حلقة بعد
                    </span>
                  )
                )}
              </div>
            )}

            {currentUser?.role === 'student' && (
              <p className="text-xs text-[#86efac]/90 font-medium line-clamp-1">
                {displayHalaqahName}
              </p>
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
            <div className="flex items-center gap-2.5 bg-[#022c22]/80 border border-[#065f46] rounded-2xl px-3.5 py-1.5 shadow-inner">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-[#fbbf24] flex items-center justify-center text-sm font-bold border border-emerald-500/30">
                {currentUser.username.charAt(0)}
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  {currentUser.username}
                </div>
                <div className="text-[10px] text-[#86efac]">
                  {currentUser.role === 'admin' ? (isDeveloper ? 'معلم ومشرف ومبرمج' : isSupervisor ? 'المعلم المشرف' : 'معلم عادي') : 'حساب طالب'}
                </div>
              </div>

              <button
                onClick={onLogout}
                title="تسجيل الخروج"
                className="mr-2 p-1.5 text-slate-300 hover:text-red-400 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
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
