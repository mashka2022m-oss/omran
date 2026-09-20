import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  FileSpreadsheet,
  FileText,
  HardDrive,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Mail,
  UserCheck,
  AlertCircle,
  Database,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';

interface PrivacyPolicyPageProps {
  onBackToHome: () => void;
  onGoToLogin?: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  onBackToHome,
  onGoToLogin
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const currentFullUrl = typeof window !== 'undefined' ? `${window.location.origin}/privacy` : 'https://omran-quran.app/privacy';

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentFullUrl);
    }
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] font-sans selection:bg-[#fbbf24] selection:text-[#064e3b] py-8 sm:py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      {/* Decorative background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Top Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#064e3b]/80 border border-[#065f46] p-4 rounded-2xl backdrop-blur-md shadow-xl">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>الرجوع إلى الصفحة الرئيسية لمنظومة عُمْرَان</span>
          </button>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#022c22] border border-[#065f46] text-[#86efac] hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="نسخ رابط صفحة الخصوصية لوضعه في Google Console"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'تم نسخ الرابط!' : 'نسخ رابط سياسة الخصوصية'}</span>
            </button>

            {onGoToLogin && (
              <button
                type="button"
                onClick={onGoToLogin}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-[#064e3b] text-xs font-black transition-all cursor-pointer shadow-md"
              >
                تسجيل الدخول للمنظومة
              </button>
            )}
          </div>
        </div>

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#064e3b] via-[#022c22] to-[#064e3b] border-2 border-amber-500/40 rounded-[32px] p-6 sm:p-10 shadow-2xl space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0 shadow-lg">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs px-3 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold inline-block mb-1">
                وثيقة سياسة الخصوصية وحماية البيانات الرسمية
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-white">
                سياسة الخصوصية - منظومة عُمْرَان القرآنية
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#86efac] leading-relaxed max-w-3xl">
            تلتزم <strong>منظومة عُمْرَان لإدارة الحلقات والمجمعات القرآنية</strong> بحماية خصوصية جميع المعلمين والطلاب وأولياء الأمور والمشرفين. توضح هذه الوثيقة بوضوح وشفافية كيفية التعامل مع البيانات والالتزام الصارم بعدم مشاركتها مع أي طرف ثالث، واستخدام خدمات Google Workspace لأغراض الحفظ والمزامنة السحابية فقط.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-slate-300 border-t border-[#065f46]">
            <span><strong>تاريخ آخر تحديث:</strong> 20 سبتمبر 2026</span>
            <span>•</span>
            <span><strong>الرابط المعتمد:</strong> <code className="font-mono text-amber-300">{currentFullUrl}</code></span>
            <span>•</span>
            <span><strong>الجهة المشغلة:</strong> إدارة منصة عُمْرَان لخدمة القرآن الكريم</span>
          </div>
        </motion.div>

        {/* Section 1: Non-Collection & Zero Sharing (الشرط الجوهري لمراجعة جوجل) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#064e3b]/50 border-2 border-emerald-500/40 rounded-[28px] p-6 sm:p-8 space-y-4 shadow-xl"
        >
          <div className="flex items-center gap-3 text-emerald-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <EyeOff className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white font-heading">
              1. عدم جمع البيانات التجارية وعدم مشاركتها إطلاقاً (No Third-Party Sharing)
            </h2>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed">
            <p className="p-3.5 rounded-2xl bg-[#022c22]/90 border border-emerald-500/30 font-bold text-amber-200">
              📌 إقرار صريح: لا تقوم منظومة عُمْرَان بجمع أو بيع أو مشاركة أو تداول أي بيانات شخصية أو طلابية أو أكاديمية مع أي طرف ثالث أو شركات إعلانية أو وسطاء تجاريين تحت أي ظرف من الظروف.
            </p>
            <ul className="space-y-2 list-disc list-inside text-[#86efac]/90 pr-2">
              <li>البيانات المُدخلة في المنظومة مخصصة حصرياً للمتابعة التربوية والقرآنية داخل الحلقة التعليمية للمجمع المصرح له.</li>
              <li>لا يتم تتبع المستخدمين عبر الإنترنت ولا يتم تضمين أي أدوات تتبع أو إعلانات تجارية في المنظومة.</li>
              <li>لا نطلب ولا نخزن بيانات مالية أو بطاقات بنكية، فالمنظومة مخصصة لخدمة أهل القرآن الكريم.</li>
            </ul>
          </div>
        </motion.div>

        {/* Section 2: Data Handled within the Quranic Platform */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#064e3b]/50 border border-[#065f46] rounded-[28px] p-6 sm:p-8 space-y-4 shadow-xl"
        >
          <div className="flex items-center gap-3 text-amber-300">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center border border-amber-400/30">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white font-heading">
              2. طبيعة البيانات المعالجة وأغراض استخدامها
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-[#022c22]/80 border border-[#065f46] space-y-2">
              <h3 className="font-bold text-amber-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                <span>بيانات الطلاب والحلقات</span>
              </h3>
              <p className="text-slate-300 leading-relaxed text-xs">
                اسم الطالب الثلاثي، رقم الحلقة القرآنية، مقدار الحفظ والمراجعة، تقييم الأحكام والتجويد، وسجل الحضور والغياب لإصدار تقارير الإنجاز لأولياء الأمور.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#022c22]/80 border border-[#065f46] space-y-2">
              <h3 className="font-bold text-amber-300 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>بيانات المعلمين والمشرفين</span>
              </h3>
              <p className="text-slate-300 leading-relaxed text-xs">
                اسم المعلم واسم المستخدم وكلمة المرور المشفرة لتنظيم صلاحيات الإشراف، مع إمكانية ربط حساب Google اختياري للمعلم للنسخ الاحتياطي السحابي.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Section 3: Google API Services User Data Policy Compliance */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-[#064e3b]/80 to-[#022c22] border-2 border-[#fbbf24]/50 rounded-[28px] p-6 sm:p-8 space-y-5 shadow-xl"
        >
          <div className="flex items-center gap-3 text-amber-300">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#064e3b] flex items-center justify-center font-black">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                سياسة بيانات خدمات Google API
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white font-heading">
                3. استخدام خدمات Google Workspace (Google Sheets, Forms, Drive)
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            تطلب المنظومة أذونات Google OAuth بموافقة صريحة واختيارية من المعلم أو المشرف فقط لتقديم الميزات التالية:
          </p>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#022c22] border border-[#065f46]">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">جداول Google Sheets:</strong>
                <span className="text-[#86efac]/90 text-xs">
                  تصدير النسخ الاحتياطية وسجلات درجات الطلاب والحضور إلى ملفات جداول بيانات خاصة بحساب Google التابع للمعلم نفسه، ليتمكن من أرشفتها والاحتفاظ بها سحابياً.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#022c22] border border-[#065f46]">
              <FileText className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">نماذج Google Forms:</strong>
                <span className="text-[#86efac]/90 text-xs">
                  إنشاء نماذج اختبارات قرآنية اختيارية للطلاب ومزامنة الدرجات المحصلة في الاختبار تلقائياً إلى لوحة شرف المنصة.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#022c22] border border-[#065f46]">
              <HardDrive className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">خدمة Google Drive (مجال محدد):</strong>
                <span className="text-[#86efac]/90 text-xs">
                  حفظ نسخة احتياطية مشفرة بصيغة JSON داخل مجلد مخصص باسم المنظومة في مساحة Google Drive الخاصة بالمستخدم حصراً، دون الوصول إلى أي ملفات أخرى خارج هذا المجلد.
                </span>
              </div>
            </div>
          </div>

          {/* Google Limited Use statement */}
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-400/40 text-amber-100 text-xs sm:text-xs leading-relaxed space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-amber-300">
              <ShieldCheck className="w-4 h-4" />
              <span>الامتثال لمتطلبات الاستخدام المحدود (Google API Limited Use Disclosure):</span>
            </p>
            <p className="text-slate-200">
              إن استخدام منظومة عُمْرَان ونقلها لأي معلومات يتم تلقيها من واجهات برمجة تطبيقات Google إلى أي تطبيق آخر سيلتزم تماماً بـ <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-amber-300 underline font-bold">سياسة بيانات مستخدم خدمات Google API</a>، بما في ذلك متطلبات الاستخدام المحدود (Limited Use requirements). لا يتم استخدام بيانات Google لتدريب أي نماذج للذكاء الاصطناعي على الإطلاق.
            </p>
          </div>
        </motion.div>

        {/* Section 4: Security, Encryption & User Rights */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#064e3b]/50 border border-[#065f46] rounded-[28px] p-6 sm:p-8 space-y-4 shadow-xl"
        >
          <div className="flex items-center gap-3 text-emerald-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white font-heading">
              4. أمن البيانات وحقوق المستخدم وحذف الحسابات
            </h2>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed">
            <p>
              يتم حفظ وتشفير كافة الاتصالات ونقل البيانات باستخدام بروتوكول HTTPS المشفر (SSL/TLS). وتخزن البيانات السحابية في بيئة Google Cloud و Firebase Firestore الآمنة وفق أعلى معايير أمن المعلومات وحماية الخصوصية.
            </p>
            <div className="p-3.5 rounded-2xl bg-[#022c22] border border-[#065f46] space-y-1">
              <strong className="text-amber-300 font-bold block">حقك في تعديل وحذف بياناتك:</strong>
              <p className="text-xs text-slate-300">
                يحق لأي معلم أو ولي أمر أو طالب طلب استعراض أو تصدير أو تعديل أو حذف بياناته وسجلاته نهائياً من قاعدة بيانات المنظومة في أي وقت، وسيتم تنفيذ الطلب فوراً.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Section 5: Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#022c22] border-2 border-emerald-500/30 rounded-[28px] p-6 sm:p-8 space-y-4 shadow-xl text-center sm:text-right flex flex-col sm:flex-row items-center justify-between gap-5"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-300">
              <Mail className="w-5 h-5" />
              <h3 className="text-base sm:text-lg font-black font-heading text-white">
                التواصل والدعم الفني وإدارة الخصوصية
              </h3>
            </div>
            <p className="text-xs text-[#86efac]">
              لأي استفسارات حول سياسة الخصوصية أو إدارة السجلات، يمكنك التواصل مباشرة مع إدارة المنصة:
            </p>
            <div className="pt-1 text-xs font-mono text-amber-300 font-bold">
              البريد المعتمد: fbg639173@gmail.com • المشرف والمبرمج: م. محمد منتصر
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#064e3b] font-black text-xs sm:text-sm shadow-xl transition-all cursor-pointer shrink-0"
          >
            الرجوع للصفحة الرئيسية
          </button>
        </motion.div>
      </div>
    </div>
  );
};
