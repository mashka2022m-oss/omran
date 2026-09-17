import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, RefreshCw, Cloud, Database, ShieldCheck, Layers } from 'lucide-react';
import { AnimatedBackground } from './AnimatedBackground';

interface CloudLoadingScreenProps {
  onRetry?: () => void;
  onForceEnter?: () => void;
}

export const CloudLoadingScreen: React.FC<CloudLoadingScreenProps> = ({
  onRetry,
  onForceEnter
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTimeoutNotice, setShowTimeoutNotice] = useState(false);

  const steps = [
    { label: 'الاتصال بقاعدة البيانات السحابية (Firestore)', icon: Cloud },
    { label: 'استرجاع سجلات الحلقات والمعلمين وتوزيع الصلاحيات', icon: Layers },
    { label: 'مزامنة بيانات الطلاب ومواضع الحفظ وخطط الذكاء الاصطناعي', icon: Database },
    { label: 'التحقق السحابي النهائي وجاهزية المنصة', icon: ShieldCheck }
  ];

  useEffect(() => {
    // Step progression animation for visual delight and clarity
    const timer1 = setTimeout(() => setCurrentStep(1), 500);
    const timer2 = setTimeout(() => setCurrentStep(2), 1200);
    const timer3 = setTimeout(() => setCurrentStep(3), 2000);

    // If loading takes unusually long (e.g. slow connection), show fallback option
    const fallbackTimer = setTimeout(() => {
      setShowTimeoutNotice(true);
    }, 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-[#022c22] text-[#f0f9f6] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none"
      dir="rtl"
    >
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-lg bg-[#064e3b]/80 border border-[#fbbf24]/40 rounded-[36px] p-6 sm:p-10 shadow-[0_0_50px_rgba(6,95,70,0.5)] backdrop-blur-xl text-center space-y-7">
        {/* Emblem with glow */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#fbbf24]/25 rounded-3xl blur-xl animate-pulse" />
          <div className="relative w-20 h-20 bg-gradient-to-tr from-[#fbbf24] to-[#f59e0b] rounded-3xl flex items-center justify-center shadow-2xl border border-amber-300 transform transition-transform hover:scale-105">
            <span className="font-heading font-black text-4xl text-[#064e3b]">ع</span>
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full border-2 border-[#064e3b] shadow-sm flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-[#064e3b]" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#fbbf24] tracking-tight">
            مَنَصَّةُ عُمْرَان الذكية
          </h1>
          <p className="text-xs sm:text-sm text-[#86efac]/90 font-medium">
            جارٍ الاتصال السحابي وتحميل ومزامنة كافة البيانات بالكامل...
          </p>
        </div>

        {/* Verification Checklist */}
        <div className="bg-[#022c22]/90 border border-[#065f46] rounded-2xl p-4 sm:p-5 text-right space-y-3.5 shadow-inner">
          <div className="text-[11px] font-bold text-amber-300 flex items-center justify-between pb-1 border-b border-[#065f46]/60">
            <span>خطوات التحقق السحابي الفوري:</span>
            <span className="font-mono text-emerald-400">
              {Math.min(currentStep + 1, steps.length)} / {steps.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = currentStep > idx;
              const isCurrent = currentStep === idx;

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                    isCompleted
                      ? 'bg-emerald-950/40 text-[#86efac]'
                      : isCurrent
                      ? 'bg-[#fbbf24]/10 text-white border border-[#fbbf24]/30 shadow-sm'
                      : 'text-slate-400/60 opacity-60'
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

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-[#022c22] rounded-full h-2 overflow-hidden border border-[#065f46]">
            <div
              className="bg-gradient-to-r from-[#fbbf24] to-emerald-400 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-[#86efac]/70 flex items-center justify-center gap-1.5 pt-1">
            <Sparkles className="w-3.5 h-3.5 text-[#fbbf24] animate-spin" />
            <span>نظام مزامنة سحابي مشفّر وفوري عبر Firestore</span>
          </p>
        </div>

        {/* Fallback timeout notice if network is slow */}
        {showTimeoutNotice && (
          <div className="p-3 bg-amber-950/50 border border-amber-500/40 rounded-xl text-xs text-amber-200 space-y-2">
            <p>يستغرق التحميل وقتاً أطول من المعتاد بسبب سرعة الشبكة.</p>
            <div className="flex items-center justify-center gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1 bg-[#022c22] hover:bg-[#064e3b] text-[#fbbf24] border border-[#fbbf24]/40 rounded-lg font-bold text-[11px] cursor-pointer"
                >
                  إعادة المحاولة
                </button>
              )}
              {onForceEnter && (
                <button
                  onClick={onForceEnter}
                  className="px-3 py-1 bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] rounded-lg font-black text-[11px] cursor-pointer shadow-md"
                >
                  الدخول بالبيانات المحلية الآن
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
