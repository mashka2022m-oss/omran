import React from 'react';
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
  Cloud,
  ArrowLeft,
  Lock,
  ExternalLink,
  ChevronLeft,
  GraduationCap,
  HeartHandshake,
  Layers,
  HelpCircle
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
  return (
    <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] font-sans selection:bg-[#fbbf24] selection:text-[#064e3b]" dir="rtl">
      {/* Background Decorative Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#022c22]/85 border-b border-[#065f46]/60 transition-all">
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
                  الإصدار الشامل
                </span>
              </div>
              <p className="text-[11px] text-[#86efac]/80 hidden sm:block">
                المنصة المتكاملة لإدارة مجمعات وحلقات تحفيظ القرآن الكريم
              </p>
            </div>
          </div>

          {/* Quick Nav Links & Login Action */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onOpenPrivacyPolicy}
              className="text-xs font-bold text-[#86efac] hover:text-white transition-colors cursor-pointer hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-white/5"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>سياسة الخصوصية</span>
            </button>

            {onOpenParentPortal && (
              <button
                type="button"
                onClick={onOpenParentPortal}
                className="text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer px-3.5 py-2 rounded-xl bg-[#064e3b] border border-[#065f46] hover:border-amber-400/50 hidden sm:inline-flex items-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4" />
                <span>بوابة ولي الأمر</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenLogin}
              className="px-5 sm:px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-[#064e3b] text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#064e3b]" />
              <span>تسجيل الدخول</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8">
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
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#064e3b]/80 hover:bg-[#064e3b] border border-[#065f46] hover:border-amber-400/50 text-white text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>سياسة الخصوصية والأمان</span>
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
              <div className="text-xs text-slate-300">Google Sheets & Firebase Firestore</div>
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

        {/* Feature Grid Section */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-black font-heading text-white">
              أبرز وظائف وميزات منظومة عُمْرَان
            </h3>
            <p className="text-xs sm:text-sm text-[#86efac]/80">
              حلول إدارية وتربوية صُممت بدقة لتلائم واقع حلقات تحفيظ القرآن الكريم
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

        {/* Google Workspace & Security Banner */}
        <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-[#064e3b] via-[#022c22] to-[#064e3b] border-2 border-amber-400/40 rounded-[32px] p-6 sm:p-8 space-y-4 text-center sm:text-right flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-300 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>الخصوصية والأمان المعتمد</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white font-heading">
                حماية تامة للبيانات وعدم مشاركتها مع أي طرف ثالث
              </h3>
              <p className="text-xs text-[#86efac] max-w-2xl leading-relaxed">
                تلتزم المنظومة بعدم جمع أو مشاركة أي بيانات للمستخدمين أو الطلاب مع أي جهة خارجية. ونستخدم أذونات Google فقط للوظائف التي يطلبها المشرف لحفظ النسخ في حسابه الشخصي.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenPrivacyPolicy}
              className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#064e3b] text-xs sm:text-sm font-black transition-all cursor-pointer shrink-0 shadow-lg"
            >
              قراءة سياسة الخصوصية
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#065f46]/60 bg-[#011c16] py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div className="space-y-1">
            <p className="text-white font-bold">
              منظومة عُمْرَان لإدارة الحلقات والمجمعات القرآنية © {new Date().getFullYear()}
            </p>
            <p className="text-[11px] text-[#86efac]/80">
              خدمة كتاب الله تعالى وأهل القرآن الكريم • إشراف وبرمجة: م. محمد منتصر
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button
              type="button"
              onClick={onOpenPrivacyPolicy}
              className="text-amber-300 hover:text-white underline font-bold cursor-pointer"
            >
              سياسة الخصوصية (Privacy Policy)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={onOpenLogin}
              className="text-emerald-300 hover:text-white font-bold cursor-pointer"
            >
              تسجيل الدخول
            </button>
            <span>•</span>
            <a
              href="mailto:fbg639173@gmail.com"
              className="text-slate-300 hover:text-white transition-colors"
            >
              fbg639173@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
