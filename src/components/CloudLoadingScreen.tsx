import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, RefreshCw, Cloud, Database, ShieldCheck, Layers, BookOpen } from 'lucide-react';
import { AnimatedBackground } from './AnimatedBackground';

interface CloudLoadingScreenProps {
  isLoading?: boolean;
  onRetry?: () => void;
  onForceEnter?: () => void;
}

export const CloudLoadingScreen: React.FC<CloudLoadingScreenProps> = ({
  isLoading = true,
  onRetry,
  onForceEnter
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTimeoutNotice, setShowTimeoutNotice] = useState(false);
  const [shouldRender, setShouldRender] = useState(isLoading);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const steps = [
    { label: 'الاتصال بقاعدة البيانات السحابية (Firestore)', icon: Cloud },
    { label: 'استرجاع سجلات الحلقات والمعلمين وتوزيع الصلاحيات', icon: Layers },
    { label: 'مزامنة بيانات الطلاب ومواضع الحفظ والسجلات القرآنية', icon: Database },
    { label: 'تحميل بنك الاختبارات والتقييمات والتسليمات السحابية', icon: BookOpen },
    { label: 'التحقق السحابي النهائي وجاهزية المنصة', icon: ShieldCheck }
  ];

  useEffect(() => {
    // Step progression animation for visual feedback
    const timer1 = setTimeout(() => setCurrentStep(1), 350);
    const timer2 = setTimeout(() => setCurrentStep(2), 700);
    const timer3 = setTimeout(() => setCurrentStep(3), 1100);
    const timer4 = setTimeout(() => setCurrentStep(4), 1600);

    const fallbackTimer = setTimeout(() => {
      setShowTimeoutNotice(true);
    }, 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Handle smooth fade-out exit when isLoading changes to false
  useEffect(() => {
    if (!isLoading) {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setShouldRender(true);
      setIsFadingOut(false);
    }
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#022c22] text-[#f0f9f6] flex flex-col items-center justify-center p-4 select-none overflow-hidden transition-all duration-700 ease-in-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none filter blur-sm' : 'opacity-100 scale-100'
      }`}
      dir="rtl"
    >
      <AnimatedBackground />

      {/* Radiant Background Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#fbbf24]/15 via-emerald-600/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="relative z-10 w-full max-w-lg bg-[#064e3b]/85 border border-[#fbbf24]/40 rounded-[36px] p-6 sm:p-9 shadow-[0_0_60px_rgba(6,95,70,0.6)] backdrop-blur-2xl text-center space-y-6">
        {/* Basmala Quranic Header */}
        <div className="text-[#fbbf24]/80 text-sm sm:text-base font-serif tracking-wide border-b border-[#065f46]/70 pb-3">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>

        {/* The Quran Sacred Emblem with Breathing Golden Glow & Halo */}
        <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
          {/* Outer Rotating Glowing Star Rim */}
          <div className="absolute inset-0 bg-[#fbbf24]/20 rounded-full blur-xl animate-pulse" />
          <div className="absolute -inset-2 border-2 border-dashed border-[#fbbf24]/40 rounded-full animate-spin [animation-duration:16s]" />

          {/* Golden Medallion Badge with Quran Calligraphy */}
          <div className="relative w-22 h-22 bg-gradient-to-tr from-[#fbbf24] via-[#f59e0b] to-[#d97706] rounded-3xl flex items-center justify-center shadow-2xl border-2 border-amber-200 transform transition-transform hover:scale-105">
            <span className="font-heading font-black text-4xl text-[#064e3b] select-none">ع</span>
            
            {/* Top-Right Decorative Diamond Accent */}
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white rounded-full border-2 border-[#064e3b] shadow-md flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#064e3b]" />
            </div>

            {/* Bottom-Left Mini Book Badge */}
            <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 bg-[#022c22] rounded-full border border-amber-300 shadow-md flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-[#fbbf24]" />
            </div>
          </div>
        </div>

        {/* Title & Quranic Tagline */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#fbbf24] tracking-tight flex items-center justify-center gap-2">
            <span>مَنَصَّةُ عُمْرَان</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#022c22] text-[#86efac] border border-[#065f46] font-sans font-medium">
              القرآنية
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#86efac]/90 font-medium">
            جَارٍ تَحْمِيلُ وَمُزَامَنَةُ كَافَّةِ البَيَانَاتِ سَحَابِيّاً...
          </p>
        </div>

        {/* Verification Checklist */}
        <div className="bg-[#022c22]/90 border border-[#065f46] rounded-2xl p-4 sm:p-5 text-right space-y-3 shadow-inner">
          <div className="text-[11px] font-bold text-amber-300 flex items-center justify-between pb-1 border-b border-[#065f46]/60">
            <span>خطوات الاتصال والتحقق السحابي:</span>
            <span className="font-mono text-emerald-400 font-bold">
              {Math.min(currentStep + 1, steps.length)} / {steps.length}
            </span>
          </div>

          <div className="space-y-2">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = currentStep > idx;
              const isCurrent = currentStep === idx;

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                    isCompleted
                      ? 'bg-emerald-950/50 text-[#86efac]'
                      : isCurrent
                      ? 'bg-[#fbbf24]/15 text-white border border-[#fbbf24]/40 shadow-sm'
                      : 'text-slate-400/50 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isCompleted
                          ? 'text-emerald-400'
                          : isCurrent
                          ? 'text-[#fbbf24] animate-bounce'
                          : 'text-slate-500'
                      }`}
                    />
                    <span className="text-xs font-medium">{step.label}</span>
                  </div>

                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <RefreshCw className="w-3.5 h-3.5 text-[#fbbf24] animate-spin shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-slate-600 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Golden Gradient Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-[#022c22] rounded-full h-2.5 overflow-hidden border border-[#065f46]">
            <div
              className="bg-gradient-to-r from-[#fbbf24] via-amber-300 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(251,191,36,0.6)]"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-[#86efac]/80 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#fbbf24] animate-spin" />
            <span>نظام تخزين سحابي مباشر ومشفّر عبر Firebase Firestore</span>
          </p>
        </div>

        {/* Fallback timeout notice if network is slow */}
        {showTimeoutNotice && (
          <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-2xl text-xs text-amber-200 space-y-2">
            <p>يستغرق التحميل وقتاً أطول من المعتاد بسبب سرعة الشبكة.</p>
            <div className="flex items-center justify-center gap-2 pt-1">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3.5 py-1.5 bg-[#022c22] hover:bg-[#064e3b] text-[#fbbf24] border border-[#fbbf24]/40 rounded-xl font-bold text-xs cursor-pointer transition-all"
                >
                  إعادة المحاولة
                </button>
              )}
              {onForceEnter && (
                <button
                  onClick={onForceEnter}
                  className="px-3.5 py-1.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] rounded-xl font-black text-xs cursor-pointer shadow-md transition-all"
                >
                  الدخول للمنصة الآن
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable Quran Inline Pulse Loader for Tabs / Modals
export const QuranInlineLoader: React.FC<{ message?: string }> = ({
  message = 'جَارٍ تَحْمِيلُ البَيَانَاتِ سَحَابِيّاً...'
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center" dir="rtl">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 bg-[#fbbf24]/20 rounded-2xl blur-lg animate-pulse" />
        <div className="relative w-14 h-14 bg-gradient-to-tr from-[#fbbf24] via-[#f59e0b] to-[#d97706] rounded-2xl flex items-center justify-center shadow-lg border border-amber-300">
          <span className="font-heading font-black text-2xl text-[#064e3b]">ع</span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border border-[#064e3b] flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-[#064e3b]" />
          </div>
        </div>
      </div>
      <p className="text-xs font-bold text-amber-300 animate-pulse">{message}</p>
    </div>
  );
};
