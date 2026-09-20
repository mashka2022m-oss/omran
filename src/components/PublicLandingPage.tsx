import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  ShieldCheck,
  Award,
  Users,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  HardDrive,
  ArrowLeft,
  Lock,
  ExternalLink,
  ChevronLeft,
  GraduationCap,
  HeartHandshake,
  Layers,
  HelpCircle,
  Globe,
  Database,
  Mail,
  Check,
  Eye,
  Languages
} from 'lucide-react';
import { motion } from 'motion/react';

interface PublicLandingPageProps {
  onOpenLogin: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenParentPortal?: () => void;
  appName?: string;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  onOpenLogin,
  onOpenPrivacyPolicy,
  onOpenParentPortal,
  appName = 'منظومة عُمْرَان لإدارة الحلقات والمجمعات القرآنية'
}) => {
  const [showEnglishOverview, setShowEnglishOverview] = useState(false);

  return (
    <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] font-sans selection:bg-[#fbbf24] selection:text-[#064e3b]" dir="rtl">
      {/* Background Decorative Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#022c22]/90 border-b border-[#065f46]/60 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand / Logo */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-[#022c22] rounded-[14px] flex items-center justify-center text-amber-400">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black font-heading tracking-tight text-white">
                  منظومة عُمْرَان
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  Omran Quran Platform
                </span>
              </div>
              <p className="text-[11px] text-[#86efac]/80 hidden sm:block">
                المنصة المتكاملة لإدارة مجمعات وحلقات تحفيظ القرآن الكريم
              </p>
            </div>
          </div>

          {/* Quick Nav Links & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* English reviewer toggle */}
            <button
              type="button"
              onClick={() => setShowEnglishOverview(!showEnglishOverview)}
              className="text-xs font-bold text-amber-300 hover:text-white px-2.5 py-1.5 rounded-xl bg-[#064e3b] border border-amber-400/40 hover:bg-[#065f46] transition-colors cursor-pointer flex items-center gap-1.5"
              title="Toggle English Overview for Google Reviewers"
            >
              <Languages className="w-4 h-4" />
              <span className="hidden sm:inline">{showEnglishOverview ? 'العربية' : 'English Overview'}</span>
              <span className="sm:hidden">EN</span>
            </button>

            <button
              type="button"
              onClick={onOpenPrivacyPolicy}
              className="text-xs font-bold text-[#86efac] hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-white/5 border border-emerald-500/20"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">سياسة الخصوصية (Privacy Policy)</span>
              <span className="md:hidden">الخصوصية</span>
            </button>

            {onOpenParentPortal && (
              <button
                type="button"
                onClick={onOpenParentPortal}
                className="text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer px-3.5 py-2 rounded-xl bg-[#064e3b] border border-[#065f46] hover:border-amber-400/50 hidden lg:inline-flex items-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4" />
                <span>بوابة ولي الأمر</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenLogin}
              className="px-4 sm:px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-[#064e3b] text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#064e3b]" />
              <span>تسجيل الدخول</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 space-y-12 sm:space-y-16 pb-16">
        {/* Optional English Overview Banner for Google Reviewers */}
        {showEnglishOverview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#012019] border-b-2 border-amber-400 px-4 sm:px-6 lg:px-8 py-6 text-left"
            dir="ltr"
          >
            <div className="max-w-7xl mx-auto space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Google OAuth Verification Quick Reference Guide (English Summary)</span>
                </div>
                <button
                  onClick={() => setShowEnglishOverview(false)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-white/10"
                >
                  Close English Panel ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-200">
                <div className="bg-[#022c22] p-4 rounded-xl border border-emerald-500/30 space-y-1.5">
                  <strong className="text-white block font-semibold">1. Application & Brand Identity</strong>
                  <p className="text-[#86efac]">
                    <strong>Name:</strong> Omran Quran Platform (منظومة عُمْرَان لإدارة الحلقات والمجمعات القرآنية).
                  </p>
                  <p>
                    A full-featured educational web application dedicated to managing Quran memorization schools, halaqahs, attendance, and student evaluations.
                  </p>
                </div>

                <div className="bg-[#022c22] p-4 rounded-xl border border-emerald-500/30 space-y-1.5">
                  <strong className="text-white block font-semibold">2. Purpose of Google User Data Requests</strong>
                  <p>
                    The app requests Google Workspace permissions (Google Sheets, Google Forms, Google Drive file scope) strictly on-demand when an authorized teacher/supervisor requests:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-amber-200 space-y-0.5">
                    <li>Exporting attendance & student evaluation grades into personal Google Sheets.</li>
                    <li>Generating Quran assessment quizzes in Google Forms.</li>
                    <li>Saving JSON backup archives in a dedicated Drive app folder.</li>
                  </ul>
                </div>

                <div className="bg-[#022c22] p-4 rounded-xl border border-emerald-500/30 space-y-1.5">
                  <strong className="text-white block font-semibold">3. Privacy, Security & Limited Use</strong>
                  <p>
                    Zero third-party data sharing. Data is never sold, leased, or used for advertising/AI training.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={onOpenPrivacyPolicy}
                      className="text-xs font-bold text-amber-300 underline hover:text-white"
                    >
                      View Full Privacy Policy Document →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Hero Section */}
        <section className="pt-8 sm:pt-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Quranic Verse Banner */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm font-arabic shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>﴿ إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ وَيُبَشِّرُ الْمُؤْمِنِينَ ﴾</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-5xl font-black font-heading text-white leading-tight tracking-tight">
              المنظومة الرقمية الشاملة لإدارة
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 mt-2">
                حلقات ومجمعات القرآن الكريم
              </span>
            </h2>

            {/* Description */}
            <p className="text-sm sm:text-base text-[#86efac]/90 max-w-3xl mx-auto leading-relaxed">
              منصة تعليمية وتربوية رائدة تمكّن المشرفين والمعلمين والطلاب وأولياء الأمور من متابعة الحفظ والتسميع المتقن، رصد الحضور اليومي، أداء الاختبارات التفاعلية، والمزامنة السحابية الدائمة والموثوقة عبر خدمات Google Workspace وقواعد البيانات المركزية.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={onOpenLogin}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:brightness-110 text-[#064e3b] text-base font-black shadow-[0_0_30px_rgba(251,191,36,0.3)] flex items-center justify-center gap-3 transition-all cursor-pointer group"
              >
                <span>الدخول إلى لوحة تحكم المنظومة</span>
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={onOpenPrivacyPolicy}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#064e3b]/80 hover:bg-[#064e3b] border border-amber-400/40 hover:border-amber-400 text-white text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md"
              >
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>وثيقة سياسة الخصوصية (Privacy Policy)</span>
              </button>
            </div>
          </motion.div>

          {/* Quick Metrics / Pillars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5 pt-8 text-right">
            <div className="bg-[#064e3b]/40 border border-[#065f46] rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
              <div className="text-amber-400 text-xl sm:text-2xl font-black font-heading mb-1">متعدد المجمعات</div>
              <div className="text-xs text-slate-300">إدارة مركزية مستقلة لكل مجمع</div>
            </div>
            <div className="bg-[#064e3b]/40 border border-[#065f46] rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
              <div className="text-emerald-400 text-xl sm:text-2xl font-black font-heading mb-1">مزامنة سحابية</div>
              <div className="text-xs text-slate-300">Google Sheets & Google Drive</div>
            </div>
            <div className="bg-[#064e3b]/40 border border-[#065f46] rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
              <div className="text-blue-400 text-xl sm:text-2xl font-black font-heading mb-1">بنك الاختبارات</div>
              <div className="text-xs text-slate-300">نماذج Google Forms وتصحيح ذكي</div>
            </div>
            <div className="bg-[#064e3b]/40 border border-[#065f46] rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
              <div className="text-amber-300 text-xl sm:text-2xl font-black font-heading mb-1">تقارير فورية</div>
              <div className="text-xs text-slate-300">متابعة يومية لأولياء الأمور بالواتساب</div>
            </div>
          </div>
        </section>

        {/* SECTION: TRANSPARENT DATA USAGE & GOOGLE WORKSPACE DISCLOSURE (معيار جوجل الصارم للشفافية) */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-[#022c22] via-[#064e3b]/90 to-[#022c22] border-2 border-amber-400/80 rounded-[32px] p-6 sm:p-10 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#065f46] pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-[#064e3b] flex items-center justify-center font-black shadow-lg shrink-0">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-black font-heading text-white">
                      شفافية طلب البيانات واستخدام خدمات Google Workspace
                    </h3>
                    <span className="text-[11px] px-3 py-0.5 rounded-full bg-amber-400 text-[#064e3b] font-black">
                      معايير الأمان المعتمدة
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#86efac] mt-0.5">
                    توضيح شفاف وصريح لأغراض طلب أذونات Google وكيفية معالجة وحماية بيانات مستخدمي المنظومة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenPrivacyPolicy}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#064e3b] text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 self-start md:self-auto"
              >
                <span>الاطلاع على سياسة الخصوصية كاملة</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Google Sheets Card */}
              <div className="p-5 rounded-2xl bg-[#022c22]/90 border border-amber-400/30 space-y-3 shadow-inner">
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <FileSpreadsheet className="w-6 h-6" />
                  <h4 className="text-base font-bold text-white font-heading">
                    جداول Google Sheets
                  </h4>
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong className="text-amber-300 block">الغرض من طلب الإذن:</strong>
                    تصدير سجلات درجات تسميع الطلاب، كشوف الحضور والغياب الشهرية، والتقارير الإحصائية إلى جداول بيانات خاصة بحساب المعلم أو المشرف نفسه.
                  </p>
                  <p className="text-[11px] text-[#86efac]/80 border-t border-white/10 pt-2">
                    ✓ لا يتم القراءة أو الوصول إلى أي جداول أخرى خارج نطاق ما ينشئه المستخدم عبر المنظومة.
                  </p>
                </div>
              </div>

              {/* Google Forms Card */}
              <div className="p-5 rounded-2xl bg-[#022c22]/90 border border-amber-400/30 space-y-3 shadow-inner">
                <div className="flex items-center gap-2.5 text-blue-400">
                  <FileText className="w-6 h-6" />
                  <h4 className="text-base font-bold text-white font-heading">
                    نماذج Google Forms
                  </h4>
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong className="text-amber-300 block">الغرض من طلب الإذن:</strong>
                    تمكين المعلم من إنشاء اختبارات ومسابقات قرآنية إلكترونية تلقائياً للطلاب، واسترجاع درجات الإجابات لعرضها في لوحة المتصدرين.
                  </p>
                  <p className="text-[11px] text-[#86efac]/80 border-t border-white/10 pt-2">
                    ✓ يقتصر الوصول على النماذج التي يصممها المعلم خصيصاً لاختبارات حلقته القرآنية.
                  </p>
                </div>
              </div>

              {/* Google Drive Card */}
              <div className="p-5 rounded-2xl bg-[#022c22]/90 border border-amber-400/30 space-y-3 shadow-inner">
                <div className="flex items-center gap-2.5 text-amber-400">
                  <HardDrive className="w-6 h-6" />
                  <h4 className="text-base font-bold text-white font-heading">
                    مساحة Google Drive (نطاق مخصص)
                  </h4>
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong className="text-amber-300 block">الغرض من طلب الإذن:</strong>
                    حفظ أرشيف النسخ الاحتياطية المشفرة (JSON) للمجمع القرآني داخل مجلد مخصص للمنصة في مساحة المستخدم السحابية الشخصية لحفظ البيانات للأبد.
                  </p>
                  <p className="text-[11px] text-[#86efac]/80 border-t border-white/10 pt-2">
                    ✓ نستخدم النطاق المقيد (drive.file) دون أي إمكانية للاطلاع على أي ملفات أخرى في Drive.
                  </p>
                </div>
              </div>
            </div>

            {/* Crucial Zero-Sharing Affirmation */}
            <div className="bg-[#064e3b]/80 border border-emerald-400/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/40">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-xs sm:text-sm text-white">
                  <strong className="text-amber-300 block font-bold">تعهد بعدم بيع أو مشاركة البيانات:</strong>
                  تلتزم منظومة عُمران بعدم بيع أو مشاركة أو تداول بيانات المستخدمين أو الطلاب مع أي طرف ثالث، ولا يتم استخدام بيانات Google لأي غرض غير تشغيل وتطوير الوظائف القرآنية للمنصة.
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenPrivacyPolicy}
                className="text-xs text-amber-300 hover:text-white underline font-bold whitespace-nowrap cursor-pointer"
              >
                قراءة بنود الاستخدام المحدود (Limited Use)
              </button>
            </div>
          </div>
        </section>

        {/* Feature Grid Section (Detailed App Functionality Description) */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-black font-heading text-white">
              الوظائف الشاملة لمنظومة عُمْرَان
            </h3>
            <p className="text-xs sm:text-sm text-[#86efac]/80">
              صُممت المنظومة لتغطي كافة الاحتياجات الإدارية والتربوية والقرآنية بدقة وسهولة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#064e3b]/50 border border-[#065f46] hover:border-amber-400/50 rounded-3xl p-6 sm:p-7 space-y-4 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#022c22] border border-amber-400/40 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white font-heading">
                سجل التسميع والحفظ والمراجعة
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                رصد دقيق لمقدار الحفظ الجديد، المراجعة الصغرى، والمراجعة الكبرى مع تقييم أحكام التجويد والطلاقة، وتدوين الملاحظات التوجيهية لكل طالب.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#064e3b]/50 border border-[#065f46] hover:border-amber-400/50 rounded-3xl p-6 sm:p-7 space-y-4 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#022c22] border border-emerald-400/40 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white font-heading">
                إدارة المجمعات والحلقات والمعلمين
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                هيكلة تنظيمية مرنة تتيح توزيع الطلاب على الحلقات، تعيين المعلمين، وتحديد أدوار المشرفين مع إمكانية عزل أو مشاركة قواعد البيانات بين المجمعات.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#064e3b]/50 border border-[#065f46] hover:border-amber-400/50 rounded-3xl p-6 sm:p-7 space-y-4 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#022c22] border border-blue-400/40 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white font-heading">
                الحضور والغياب والتنبيهات الذكية
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                تسجيل حضور وغياب وتأخر واستئذان الطلاب بضغطة واحدة، مع توليد رسائل إخطار مجهزة للإرسال الفوري لولي الأمر عبر الواتساب.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#064e3b]/50 border border-[#065f46] hover:border-amber-400/50 rounded-3xl p-6 sm:p-7 space-y-4 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#022c22] border border-amber-400/40 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white font-heading">
                بنك الاختبارات ولوحة المتصدرين
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                إنشاء اختبارات قرآنية متقدمة مع دعم التكامل المباشر مع نماذج Google Forms، واحتساب النقاط تلقائياً لتكريم الطلاب في لوحة الشرف.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#064e3b]/50 border border-[#065f46] hover:border-amber-400/50 rounded-3xl p-6 sm:p-7 space-y-4 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#022c22] border border-emerald-400/40 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white font-heading">
                الربط السحابي الدائم مع Google Workspace
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                تصدير السجلات الشاملة ونتائج الاختبارات والغياب تلقائياً إلى جداول Google Sheets ومجلدات Google Drive لحفظ بيانات المجمع للأبد.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#064e3b]/50 border border-[#065f46] hover:border-amber-400/50 rounded-3xl p-6 sm:p-7 space-y-4 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#022c22] border border-teal-400/40 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white font-heading">
                بوابة الطالب ومتابعة ولي الأمر
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                نافذة خاصة تتيح لولي الأمر والطالب استعراض مستوى الإنجاز الأسبوعي والشهري، والاطلاع على الخطة القرآنية الحالية ونتائج الاختبارات.
              </p>
            </div>
          </div>
        </section>

        {/* User Roles & Target Audience Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-[#064e3b]/40 border border-[#065f46] rounded-[32px] p-6 sm:p-8 space-y-6">
            <h3 className="text-xl font-bold font-heading text-white text-center">
              الفئات المستفيدة ومستويات الصلاحيات في المنظومة
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#022c22] border border-amber-400/30 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <Users className="w-4 h-4" />
                  <span>المشرف العام والمبرمج</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  إدارة المجمعات والحلقات، تعيين المعلمين، ضبط إعدادات الربط السحابي ومراقبة الجودة الشاملة.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#022c22] border border-emerald-400/30 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <BookOpen className="w-4 h-4" />
                  <span>معلمو الحلقات</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  تسجيل الحفظ اليومي، رصد الحضور والتسميع، إصدار تقارير الواتساب، وتصدير الدرجات لجداول Google Sheets.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#022c22] border border-blue-400/30 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-300 font-bold">
                  <GraduationCap className="w-4 h-4" />
                  <span>الطلاب</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  متابعة الإنجاز القرآني، خوض الاختبارات الذكية، استعراض لوحة الشرف، والاستماع للتلاوات المتقنة.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#022c22] border border-teal-400/30 space-y-1.5">
                <div className="flex items-center gap-2 text-teal-300 font-bold">
                  <HeartHandshake className="w-4 h-4" />
                  <span>أولياء الأمور</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  الاطلاع الفوري على تقارير الأبناء، متابعة الحضور والغياب، واستلام رسائل الإنجاز الدورية.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dedicated Privacy Policy Call-to-Action Box */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-[#064e3b] via-[#022c22] to-[#064e3b] border-2 border-amber-400 rounded-[32px] p-6 sm:p-8 space-y-4 text-center sm:text-right flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-300 font-bold text-xs">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>الخصوصية وحماية البيانات الرسمية</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white font-heading">
                تصفح وثيقة سياسة الخصوصية المعتمدة (Privacy Policy)
              </h3>
              <p className="text-xs text-[#86efac] max-w-2xl leading-relaxed">
                صفحة رسمية مستقلة ومفصلة توضح كافة بنود جمع واستخدام وحماية البيانات، والامتثال لسياسات الاستخدام المحدود لـ Google API، وكيفية ممارسة حقوقك في حذف أو استرجاع سجلاتك.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onOpenPrivacyPolicy}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#064e3b] text-xs sm:text-sm font-black transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <span>فتح صفحة سياسة الخصوصية</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#065f46]/60 bg-[#011c16] py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
            <div className="space-y-1.5">
              <div className="flex items-center justify-center md:justify-start gap-2 text-white font-bold text-sm">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>منظومة عُمْرَان لإدارة الحلقات والمجمعات القرآنية</span>
              </div>
              <p className="text-[11px] text-[#86efac]/80">
                خدمة كتاب الله تعالى وأهل القرآن الكريم • إشراف وبرمجة: م. محمد منتصر
              </p>
              <p className="text-[11px] text-slate-400">
                الموقع المعتمد لتوثيق المنظومة واعتماد أذونات Google Cloud Console
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-center">
              <button
                type="button"
                onClick={onOpenPrivacyPolicy}
                className="text-amber-300 hover:text-white underline font-bold px-3 py-1.5 rounded-xl bg-[#022c22] border border-amber-400/40 cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>سياسة الخصوصية (Privacy Policy)</span>
              </button>

              <button
                type="button"
                onClick={onOpenLogin}
                className="text-emerald-300 hover:text-white font-bold px-3 py-1.5 rounded-xl bg-[#064e3b] border border-emerald-500/40 cursor-pointer"
              >
                تسجيل الدخول للمنظومة
              </button>

              <a
                href="mailto:fds421885@gmail.com"
                className="text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-xl bg-white/5"
                title="بريد الدعم الفني وتواصل المطور"
              >
                الدعم الفني: <span className="font-mono text-amber-300">fds421885@gmail.com</span>
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-[#065f46]/40 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} منظومة عُمْرَان - جميع الحقوق محفوظة لخدمة مجمعات القرآن الكريم.</span>
            <span>Omran Quran Platform • Hosted on verified domain • All Google API terms strictly respected.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
