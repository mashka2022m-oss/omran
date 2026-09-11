import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  QURAN_SURAHS,
  getSurahInfo,
  calculateRealisticQuranAssignment,
  FAMOUS_RECITERS
} from "./src/data/quranData.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper for realistic fallback when Gemini key is not set or network issue
function getFallbackPlan(student: any) {
  const surahId = student.currentSurah || student.currentSurahName || 78;
  const ayah = student.currentAyah || 1;
  const assignment = calculateRealisticQuranAssignment(
    surahId,
    ayah,
    student.level || "متوسط",
    student.dailyNewTarget || "نصف وجه"
  );

  const isWeak = student.level === "ضعيف";
  const isStrong = student.level === "قوي";

  return {
    roadmapSummary: `خطة تحفيظ تربوية متقنة للطالب ${student.name} في ${assignment.surah.name} (عدد آياتها ${assignment.surah.numberOfAyahs} آية)، تبدأ من الآية (${assignment.startAyah}) بمعدل ${student.dailyNewTarget || "نصف وجه"} يومياً مع التثبيت الدوري.`,
    currentDailyAssignment: {
      newMemorization: assignment.newMemorization,
      review: assignment.review,
      suggestedSheikh: assignment.suggestedSheikh,
      tajweedFocus: assignment.tajweedFocus,
      dailyNote: assignment.dailyNote,
    },
    difficultyAdjustment: isWeak
      ? "خطة ميسرة تراعي سن وقدرة الطالب مع التركيز على التكرار وضبط المخارج"
      : isStrong
      ? "خطة متقدمة تركز على سرعة الاستيعاب وجودة الإتقان والربط"
      : "خطة متوازنة تحقق الاستمرارية والإتقان",
    estimatedDaysToFinishJuz: isWeak ? 40 : isStrong ? 20 : 30,
  };
}

// 1. Generate Daily Quran AI Plan with STRICT Quran Ground Truth
app.post("/api/gemini/generate-plan", async (req, res) => {
  try {
    const { student } = req.body;
    if (!student) {
      return res.status(400).json({ error: "بيانات الطالب مطلوبة" });
    }

    const surah = getSurahInfo(student.currentSurah || student.currentSurahName || 78);
    const startAyah = Math.max(1, Math.min(student.currentAyah || 1, surah.numberOfAyahs));

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ plan: getFallbackPlan(student) });
    }

    const prompt = `أنت شيخ مقرئ ومربٍ خبير في تحفيظ القرآن الكريم وتوجيه الحلقات القرآنية.
المطلوب: وضع خطة يومية تربوية دقيقة وخارطة طريق تحفيظ للطالب التالي:
- اسم الطالب: ${student.name}
- العمر: ${student.age} سنة
- المستوى: ${student.level} (ضعيف / متوسط / قوي)
- طاقة الحفظ اليومي للجديد: ${student.dailyNewTarget}
- طاقة المراجعة اليومية: ${student.dailyReviewTarget}
- ملاحظات المعلم: ${student.notes || "لا توجد"}

بيانات موضع الحفظ القرآني الحالي (حقائق قرآنية ملزمة):
- السورة الحالية: سورة ${surah.name} (رقم ${surah.number} في المصحف، نوعها: ${surah.revelationType}، الجزء: ${surah.juz})
- عدد آيات السورة الإجمالي: ${surah.numberOfAyahs} آية فقط!
- الآية الحالية التي يقف عندها: الآية رقم ${startAyah}

قواعد قرآنية وتربوية صارمة يجب الالتزام بها 100%:
1. [قاعدة حاسمة]: إجمالي آيات سورة ${surah.name} هو ${surah.numberOfAyahs} آية فقط! ممنوع نهائياً ومطلقاً ذكر أي رقم آية يتجاوز ${surah.numberOfAyahs} (مثلاً: سورة الناس 6 آيات فقط، سورة الفلق 5، الإخلاص 4، الفاتحة 7، الكوثر 3، إلخ).
2. إذا كان مقدار حفظ الطالب يصل لنهاية السورة، اكتب: "سورة ${surah.name} كاملة (الآيات 1 - ${surah.numberOfAyahs})" أو "سورة ${surah.name}: من الآية ${startAyah} إلى الآية ${surah.numberOfAyahs} (ختام السورة)".
3. حدد ورد المراجعة بالسورة والآيات، واقترح قارئاً معلماً معتمداً مناسباً لعمر ومستوى الطالب (مثلاً: الشيخ المنشاوي المعلم، أو الحصري المعلم، أو العفاسي).
4. اكتب توجيهاً منزلياً عملياً لولي الأمر للربط والتكرار والتثبيت قبل النوم.

أخرج النتيجة بصيغة JSON فقط:
{
  "roadmapSummary": "ملخص تربوي واستراتيجي لخطة الطالب في إتمام الحفظ والمراجعة",
  "currentDailyAssignment": {
    "newMemorization": "تحديد الآيات بالضبط للحفظ الجديد لليوم مع الالتزام التام بعدد آيات السورة (${surah.numberOfAyahs})",
    "review": "تحديد ورد المراجعة اليومي بدقة مع أسماء السور والآيات",
    "suggestedSheikh": "اسم الشيخ المقترح للاستماع له (مثل: الشيخ محمد صديق المنشاوي - المصحف المعلم)",
    "tajweedFocus": "الحكم التجويدي أو المهارة الصوتية للتركيز عليها اليوم",
    "dailyNote": "توجيه تربوي عملي للربط والتكرار بالمنزل"
  },
  "difficultyAdjustment": "توضيح هل تم التيسير أو التدرج ولماذا بناءً على مستوى الطالب",
  "estimatedDaysToFinishJuz": 30
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const plan = JSON.parse(text);
    res.json({ plan });
  } catch (error) {
    console.error("Gemini generate-plan error:", error);
    res.json({ plan: getFallbackPlan(req.body?.student || {}) });
  }
});

// 2. Evaluate Recitation Progress & Adjust Next Day Plan
app.post("/api/gemini/evaluate-progress", async (req, res) => {
  try {
    const { student, evaluation, currentPlan } = req.body;
    if (!student || !evaluation) {
      return res.status(400).json({ error: "بيانات الطالب والتقييم مطلوبة" });
    }

    const surah = getSurahInfo(student.currentSurah || student.currentSurahName || 78);

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        feedback: {
          studentProgressStatus: "منتظم",
          analysis: `تم إنجاز التسميع بنجاح في سورة ${surah.name} ومستوى الطالب طيب ومبشر.`,
          reasoning: "مواصلة الخطة المقررة مع التثبيت المستمر.",
          nextDayPlan: currentPlan?.currentDailyAssignment || getFallbackPlan(student).currentDailyAssignment,
        },
      });
    }

    const prompt = `أنت شيخ مقرئ وموجه تربوي لحلقات القرآن الكريم.
المطلوب: تحليل تسميع الطالب اليوم وضبط خطة الغد تلقائياً بناءً على ما أنجزه وملاحظات المعلم:
- اسم الطالب: ${student.name} (العمر: ${student.age} سنة، المستوى: ${student.level})
- السورة الحالية: سورة ${surah.name} (إجمالي آياتها: ${surah.numberOfAyahs} آية فقط)
- الورد المطلوب منه اليوم:
  * جديد: ${currentPlan?.currentDailyAssignment?.newMemorization || "غير محدد"}
  * مراجعة: ${currentPlan?.currentDailyAssignment?.review || "غير محدد"}
- ما أنجزه الطالب فعلياً اليوم:
  * في الحفظ الجديد: ${evaluation.recitationDetails?.newMemorizationAchieved || "لم يحدد"}
  * في المراجعة: ${evaluation.recitationDetails?.reviewAchieved || "لم يحدد"}
  * ملاحظات الشيخ/المعلم أو العذر: ${evaluation.recitationDetails?.teacherNotes || "لا يوجد"}
  * درجات التقييم اليوم: ${JSON.stringify(evaluation.criteriaValues || {})}

قواعد الذكاء الاصطناعي في الضبط والتخطيط:
1. التزام تام وصارم بآيات السورة (${surah.name} آياتها ${surah.numberOfAyahs} فقط، لا تتجاوز هذا الرقم أبداً).
2. إذا تعثر الطالب أو حفظ جزءاً فقط: لا تضغط عليه، قسّم ما تبقى عليه غداً مع خطوة تثبيت وتكرار.
3. إذا أتقن بتفوق وسهولة: زد له باعتدال أو عمّق المراجعة دون إخلال بالإتقان.
4. إذا كان معتذراً أو مريضاً: ضع خطة استدراكية خفيفة ولطيفة.

أرجع النتيجة بصيغة JSON فقط:
{
  "studentProgressStatus": "متقدم" | "منتظم" | "متأخر" | "يحتاج مساعدة",
  "analysis": "تحليل أداء الطالب اليوم ونقاط القوة والمواضع التي تحتاج عناية وتجويد",
  "reasoning": "سبب تعديل أو تثبيت خطة الغد",
  "nextDayPlan": {
    "newMemorization": "تحديد الآيات بالضبط للحفظ الجديد لغد (بحيث لا تتجاوز آيات سورة ${surah.name} البالغة ${surah.numberOfAyahs} آية)",
    "review": "تحديد ورد المراجعة لغد بدقة",
    "suggestedSheikh": "القارئ الأنسب لمستواه",
    "tajweedFocus": "الحكم التجويدي المطلوب مراعاته",
    "dailyNote": "نصيحة عملية للطالب وولي أمره لليوم التالي"
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const feedback = JSON.parse(text);
    res.json({ feedback });
  } catch (error) {
    console.error("Gemini evaluate-progress error:", error);
    res.json({
      feedback: {
        studentProgressStatus: "منتظم",
        analysis: "تم تسجيل التسميع والمستوى جيد.",
        reasoning: "الاستمرار في الخطة التراكمية والتثبيت.",
        nextDayPlan: getFallbackPlan(req.body?.student || {}).currentDailyAssignment,
      },
    });
  }
});

// Generate Polite & Pedagogical Violation Message for Parent via Gemini
app.post("/api/gemini/generate-violation-message", async (req, res) => {
  try {
    const { studentName, violationType, severity, description, actionTaken, teacherName, halaqahName } = req.body || {};

    const fallbackMessage = `السلام عليكم ورحمة الله وبركاته، ولي أمر الطالب الفاضل ${studentName || 'الكريم'} حفظكم الله..\nنود إحاطة عنايتكم بأنه لوحظ على الطالب اليوم في الحلقة (${violationType || 'ملاحظة سلوكية'})، وتم توجيهه تربوياً بحكمة (${actionTaken || 'تنبيه شفهي وتذكير بآداب الحلقة'}).\nشاكرين لكم عظيم حرصكم ومتابعتكم المستمرة في البيت، ونحن شركاء في بناء جيل قرآني متميز خلقاً وعلماً.\nمع تحيات: ${teacherName || 'معلم الحلقة'} - ${halaqahName || 'حلقة تحفيظ القرآن الكريم'}`;

    if (!ai) {
      return res.json({ message: fallbackMessage });
    }

    const prompt = `أنت مستشار تربوي خبير في حلقات تحفيظ القرآن الكريم والمدارس القرآنية.
المطلوب منك صياغة رسالة واتساب / رسالة نصية تربوية راقية جداً ومهذبة يرسلها معلم الحلقة إلى ولي أمر الطالب لإشعاره بمخالفة أو ملاحظة سلوكية حدثت اليوم في الحلقة والتنسيق معه لخير الطالب.

بيانات الملاحظة:
- اسم الطالب: ${studentName || 'الطالب'}
- اسم الحلقة: ${halaqahName || 'حلقة القرآن الكريم'}
- اسم المعلم: ${teacherName || 'معلم الحلقة'}
- نوع الملاحظة/المخالفة: ${violationType || 'ملاحظة سلوكية'}
- مستوى الشدة: ${severity || 'تنبيه'}
- تفاصيل ما حدث وتوجيه الشيخ: ${description || 'توجيه سلوكي أثناء الحلقة'}
- الإجراء المتخذ: ${actionTaken || 'تنبيه وتوجيه'}

إرشادات الصياغة:
1. البداية بتحية إسلامية رقيقة والدعاء لولي الأمر وللطالب بالبركة والتوفيق.
2. استخدام أسلوب حكيم يجمع بين اللين والرفق التربوي دون جرح مشاعر الطالب أو ولي أمره.
3. التذكير بعظمة مجلس القرآن الكريم وآدابه، وبيان أن هذه الملاحظة نابعة من حب المعلم للطالب وحرصه على أدبه ونبوغه.
4. بيان الملاحظة بوضوح وإيجاز وما تم اتخاذه بلطف، مع دعوة ولي الأمر للحديث الودي مع ابنه وتشجيعه في المنزل.
5. تجنب التوبيخ أو الشكوى السلبية نهائياً، واعتمد لغة الشراكة والتعاون الإيجابي لمصلحة الابن.
6. اختم بالدعاء والتوقيع باسم المعلم والحلقة.
7. أرجع نص الرسالة النهائي فقط بدون مقدمات خارجية أو أقواس.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const generated = response.text?.trim() || fallbackMessage;
    res.json({ message: generated });
  } catch (error) {
    console.error("Generate violation message error:", error);
    const { studentName, violationType, actionTaken, teacherName, halaqahName } = req.body || {};
    const fallbackMessage = `السلام عليكم ورحمة الله وبركاته، ولي أمر الطالب الفاضل ${studentName || 'الكريم'} حفظكم الله..\nنود إحاطة عنايتكم بأنه لوحظ على الطالب اليوم في الحلقة (${violationType || 'ملاحظة سلوكية'})، وتم توجيهه تربوياً بحكمة (${actionTaken || 'تنبيه شفهي وتذكير بآداب الحلقة'}).\nشاكرين لكم عظيم حرصكم ومتابعتكم المستمرة في البيت، ونحن شركاء في بناء جيل قرآني متميز خلقاً وعلماً.\nمع تحيات: ${teacherName || 'معلم الحلقة'} - ${halaqahName || 'حلقة تحفيظ القرآن الكريم'}`;
    res.json({ message: fallbackMessage });
  }
});

// Helper: Calculate Smart Next-Day Assignment based on last actual recitation records (bypassing trips, holidays, and gap days)
function calculateSmartAssignmentFromRecords(student: any, recentEvaluations: any[], todayRecitation?: any) {
  // 1. Filter evaluations to get actual recitation records only (ignoring empty days, sudden holidays, or trips where no recitation occurred)
  const actualRecitationRecords = (recentEvaluations || [])
    .filter((e: any) => {
      const hasItem = e.recitationDetails?.todayNewItem?.surahNumber ||
        e.recitationDetails?.todayReviewItem?.surahNumber ||
        e.recitationDetails?.newMemorizationAchieved ||
        (e.criteriaValues && Object.keys(e.criteriaValues).length > 0);
      return Boolean(hasItem);
    })
    .sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));

  const lastActualRecord = actualRecitationRecords[0];

  // 2. Determine student's current/last completed recitation position
  let currentSurahNum = 78;
  let currentEndAyah = 1;

  if (todayRecitation?.todayNewToSurah) {
    // Current session was just recorded today
    currentSurahNum = Number(todayRecitation.todayNewToSurah);
    currentEndAyah = Number(todayRecitation.todayNewToAyah || 1);
  } else if (todayRecitation?.todayNewSurah) {
    currentSurahNum = Number(todayRecitation.todayNewSurah);
    currentEndAyah = Number(todayRecitation.todayNewToAyah || todayRecitation.todayNewFromAyah || 1);
  } else if (lastActualRecord?.recitationDetails?.todayNewItem?.toSurahNumber) {
    // Take the last actual session record (even if from last week or before an unexpected trip/vacation)
    currentSurahNum = Number(lastActualRecord.recitationDetails.todayNewItem.toSurahNumber);
    currentEndAyah = Number(lastActualRecord.recitationDetails.todayNewItem.toAyah || 1);
  } else if (lastActualRecord?.recitationDetails?.todayNewItem?.surahNumber) {
    currentSurahNum = Number(lastActualRecord.recitationDetails.todayNewItem.surahNumber);
    currentEndAyah = Number(lastActualRecord.recitationDetails.todayNewItem.toAyah || lastActualRecord.recitationDetails.todayNewItem.fromAyah || 1);
  } else if (student.currentSurah) {
    currentSurahNum = Number(student.currentSurah);
    currentEndAyah = Number(student.currentAyah || 1);
  }

  if (!currentSurahNum || currentSurahNum < 1 || currentSurahNum > 114) {
    currentSurahNum = 78;
  }

  const curSurahInfo = getSurahInfo(currentSurahNum);
  const totalAyahs = curSurahInfo.numberOfAyahs;
  currentEndAyah = Math.min(Math.max(1, currentEndAyah), totalAyahs);

  // 3. Analyze the last N actual recitation records for pace and strength
  const lastNRecords = actualRecitationRecords.slice(0, 3);
  let highPerformance = true;
  let totalScoreSum = 0;
  let scoreCount = 0;

  lastNRecords.forEach((ev: any) => {
    if (ev.criteriaValues) {
      Object.values(ev.criteriaValues).forEach((val: any) => {
        if (typeof val === "number") {
          totalScoreSum += val;
          scoreCount++;
        }
      });
    }
  });

  const avgScore = scoreCount > 0 ? totalScoreSum / scoreCount : 9;
  if (avgScore < 7 || student.level === "ضعيف") {
    highPerformance = false;
  }

  // Step size calculation (ayahs per day)
  let step = student.level === "ضعيف" ? 4 : student.level === "قوي" ? 12 : 7;
  if (highPerformance && student.level !== "ضعيف") {
    step = Math.min(step + 2, 15);
  } else if (!highPerformance) {
    step = Math.max(step - 2, 3);
  }

  // 4. Calculate Next Session's New Memorization Portion
  let nextNewSurah = currentSurahNum;
  let nextNewFromAyah = currentEndAyah + 1;
  let nextNewToSurah = currentSurahNum;
  let nextNewToAyah = currentEndAyah + step;

  if (nextNewFromAyah > totalAyahs) {
    // Current surah completed! Move to next surah in sequence
    const nextSurahId = currentSurahNum < 114 ? currentSurahNum + 1 : 1;
    const nextInfo = getSurahInfo(nextSurahId);
    nextNewSurah = nextSurahId;
    nextNewFromAyah = 1;
    nextNewToSurah = nextSurahId;
    nextNewToAyah = Math.min(step, nextInfo.numberOfAyahs);
  } else if (nextNewToAyah > totalAyahs) {
    nextNewToAyah = totalAyahs;
  }

  const nextStartInfo = getSurahInfo(nextNewSurah);
  const nextEndInfo = getSurahInfo(nextNewToSurah);

  const formattedNew =
    nextNewSurah === nextNewToSurah && nextNewFromAyah === 1 && nextNewToAyah >= nextStartInfo.numberOfAyahs
      ? `سورة ${nextStartInfo.name} كاملة (الآيات 1 - ${nextStartInfo.numberOfAyahs})`
      : `سورة ${nextStartInfo.name}: من الآية (${nextNewFromAyah}) إلى الآية (${nextNewToAyah})`;

  // 5. Calculate Review
  let revSurah = currentSurahNum;
  let revFrom = 1;
  let revTo = currentEndAyah;
  const revInfo = getSurahInfo(revSurah);
  const formattedReview = `مراجعة صغرى: سورة ${revInfo.name} من الآية (${revFrom}) إلى الآية (${revTo})`;

  const recordsCount = lastNRecords.length;
  const analysisText = recordsCount > 0
    ? `تمت المتابعة وتحديد المقرر بناءً على آخر تسجيلات التسميع الفعلية للبطل (${lastNRecords.map((e: any) => e.date).join("، ")})${actualRecitationRecords.length < (recentEvaluations || []).length ? " (متجاوزاً أيام الرحلات أو الإجازات السابقة التي لم يحصل فيها تسميع)" : ""}: أظهر الطالب معدل إتقان (${avgScore >= 8.5 ? "ممتاز" : "جيد"})، وتم احتساب المقرر انطلاقاً من آخر موضع أنجزه فعلياً في سورة ${curSurahInfo.name} (آية ${currentEndAyah}).`
    : `تم تحديد المقرر القادم بناءً على آخر موضع مسجل في ملف الطالب (سورة ${curSurahInfo.name} آية ${currentEndAyah}) متجاوزاً أي فترات انقطاع أو إجازات سابقة.`;

  return {
    threeDayAnalysis: analysisText,
    recordsAnalysis: analysisText,
    pedagogicalReasoning: highPerformance
      ? `نظراً لجودة الحفظ وحسن الأداء في آخر تسجيلات التسميع الفعلية، يستطيع الطالب إنجاز (${nextNewToAyah - nextNewFromAyah + 1}) آيات جديدة مع ربط وتثبيت ما سبق.`
      : `تم ضبط وتيرة الجديد للتركيز على إتقان المخارج والتثبيت قبل الانتقال للآيات التالية.`,
    tomorrowNew: {
      surahNumber: nextNewSurah,
      surahName: nextStartInfo.name,
      fromAyah: nextNewFromAyah,
      toSurahNumber: nextNewToSurah,
      toSurahName: nextEndInfo.name,
      toAyah: nextNewToAyah,
      formattedText: formattedNew,
    },
    tomorrowReview: {
      type: "مراجعة صغرى (السور القريبة)",
      surahNumber: revSurah,
      surahName: revInfo.name,
      fromAyah: revFrom,
      toSurahNumber: revSurah,
      toSurahName: revInfo.name,
      toAyah: revTo,
      formattedText: formattedReview,
    },
    suggestedSheikh: student.level === "ضعيف" ? "الشيخ محمد صديق المنشاوي (المصحف المعلم)" : "الشيخ محمود خليل الحصري (المصحف المعلم)",
    tajweedFocus: "مراعاة أحكام النون الساكنة والتنوين والمدود الطبيعية والوصل",
    dailyHomeNote: "الاستماع للشيخ المعلم 3 مرات وتكرار الآيات قبل النوم والتسميع على ولي الأمر.",
  };
}

// 2.5 Calculate Smart Next-Day Assignment studying past actual records (bypassing trips & holidays)
app.post("/api/gemini/calculate-smart-assignment", async (req, res) => {
  try {
    const { student, recentEvaluations, attendanceRecords, todayRecitation } = req.body;
    if (!student) {
      return res.status(400).json({ error: "بيانات الطالب مطلوبة" });
    }

    const fallbackResult = calculateSmartAssignmentFromRecords(student, recentEvaluations || [], todayRecitation);

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ result: fallbackResult });
    }

    // Determine current point
    const curSurah = getSurahInfo(fallbackResult.tomorrowNew.surahNumber || student.currentSurah || 78);
    const startAyah = fallbackResult.tomorrowNew.fromAyah || 1;

    // Summarize past actual records for Gemini prompt
    const actualRecitationRecords = (recentEvaluations || [])
      .filter((e: any) => {
        const hasItem = e.recitationDetails?.todayNewItem?.surahNumber ||
          e.recitationDetails?.todayReviewItem?.surahNumber ||
          e.recitationDetails?.newMemorizationAchieved ||
          (e.criteriaValues && Object.keys(e.criteriaValues).length > 0);
        return Boolean(hasItem);
      })
      .slice(0, 3)
      .map((e: any) => ({
        date: e.date,
        newMemorization: e.recitationDetails?.newMemorizationAchieved || e.recitationDetails?.todayNewItem?.formattedText || "غير محدد",
        review: e.recitationDetails?.reviewAchieved || e.recitationDetails?.todayReviewItem?.formattedText || "غير محدد",
        criteriaScores: e.criteriaValues || {},
        teacherNotes: e.recitationDetails?.teacherNotes || "لا توجد"
      }));

    const prompt = `أنت الموجه التربوي والمقرئ الذكي لحلقات تحفيظ القرآن الكريم.
المطلوب منك: دراسة أداء الطالب وسجلاته بناءً على **آخر تسجيلات التسميع الفعلية للبطل** (متجاوزاً تماماً أيام الرحلات أو الإجازات المفاجئة التي لم يحصل فيها تسميع)، ثم حساب ما يجب أن يسمعه في الجلسة القادمة تلقائياً (حفظ جديد + مراجعة) بدقة قرآنية ملزمة 100%.

بيانات الطالب:
- اسم الطالب: ${student.name} (العمر: ${student.age} سنة، المستوى: ${student.level})
- طاقة الحفظ اليومي: ${student.dailyNewTarget}
- طاقة المراجعة: ${student.dailyReviewTarget}
- موضع الوقوف الفعلي الأخير: سورة ${curSurah.name} (رقم السورة: ${curSurah.number}، إجمالي آياتها: ${curSurah.numberOfAyahs} آية فقط)
- ما سمعه الطالب اليوم بالتفصيل (إن وجد): ${JSON.stringify(todayRecitation || {})}

سجل آخر تسجيلات التسميع الفعلية للطالب (المعتمدة بعد استبعاد فترات الانقطاع والرحلات):
${JSON.stringify(actualRecitationRecords, null, 2)}

قواعد قرآنية وتربوية صارمة:
1. إجمالي آيات سورة ${curSurah.name} هو ${curSurah.numberOfAyahs} آية فقط. لا تتجاوز هذا الرقم أبداً.
2. احسب المقرر الجديد انطلاقاً من الموضع الفعلي الأخير متجاوزاً أي أيام انقطاع أو رحلات.
3. إذا انتهت السورة الحالية، انتقل للسورة التالية في ترتيب المصحف من الآية 1.
4. حدد ورد المراجعة لتثبيت ما تم حفظه مؤخراً.
5. وضّح في التحليل التربوي أن المتابعة تمت على أساس آخر التسجيلات الفعلية للبطل.

أخرج النتيجة بصيغة JSON فقط:
{
  "threeDayAnalysis": "تحليل تربوي دقيق لدراسة أداء الطالب بناءً على آخر تسجيلات التسميع الفعلية متجاوزاً أي رحلات أو إجازات",
  "pedagogicalReasoning": "السبب التعليمي لحساب مقدار ورد الجلسة القادمة",
  "tomorrowNew": {
    "surahNumber": ${fallbackResult.tomorrowNew.surahNumber},
    "surahName": "${fallbackResult.tomorrowNew.surahName}",
    "fromAyah": ${fallbackResult.tomorrowNew.fromAyah},
    "toSurahNumber": ${fallbackResult.tomorrowNew.toSurahNumber},
    "toSurahName": "${fallbackResult.tomorrowNew.toSurahName}",
    "toAyah": ${fallbackResult.tomorrowNew.toAyah},
    "formattedText": "${fallbackResult.tomorrowNew.formattedText}"
  },
  "tomorrowReview": {
    "type": "مراجعة صغرى (السور القريبة)",
    "surahNumber": ${fallbackResult.tomorrowReview.surahNumber},
    "surahName": "${fallbackResult.tomorrowReview.surahName}",
    "fromAyah": ${fallbackResult.tomorrowReview.fromAyah},
    "toSurahNumber": ${fallbackResult.tomorrowReview.toSurahNumber},
    "toSurahName": "${fallbackResult.tomorrowReview.toSurahName}",
    "toAyah": ${fallbackResult.tomorrowReview.toAyah},
    "formattedText": "${fallbackResult.tomorrowReview.formattedText}"
  },
  "suggestedSheikh": "اسم الشيخ المقترح للاستماع له",
  "tajweedFocus": "الحكم التجويدي المطلوب التركيز عليه",
  "dailyHomeNote": "توجيه منزلي للربط والتكرار"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const result = JSON.parse(text);
    res.json({ result: { ...fallbackResult, ...result } });
  } catch (error) {
    console.error("Gemini calculate-smart-assignment error:", error);
    const fallbackResult = calculateSmartAssignmentFromRecords(req.body?.student || {}, req.body?.recentEvaluations || [], req.body?.todayRecitation);
    res.json({ result: fallbackResult });
  }
});

// 3. Generate WhatsApp Message for Parent
app.post("/api/gemini/generate-whatsapp-message", async (req, res) => {
  try {
    const { student, attendanceStatus, evaluation, halaqahName, teacherName, clientPortalUrl } = req.body;

    const portalUrl = clientPortalUrl || `${process.env.APP_URL || ""}/?portal=${student.id}`;

    const todayNewRecited = evaluation?.recitationDetails?.newMemorizationAchieved || (attendanceStatus === "حاضر" ? `سورة ${student.currentSurahName || "القرآن"} (الآيات المقررة)` : "لم يُسمّع اليوم لغيابه/اعتذاره");
    const todayReviewRecited = evaluation?.recitationDetails?.reviewAchieved || (attendanceStatus === "حاضر" ? "مراجعة ورد التثبيت الماضي" : "لم يُراجع اليوم");
    const teacherNotes = evaluation?.recitationDetails?.teacherNotes || "";
    const tomorrowNewPlan = student.aiPlan?.currentDailyAssignment?.newMemorization || `سورة ${student.currentSurahName || "القرآن"} (مواصلة الآيات التالية)`;
    const tomorrowReviewPlan = student.aiPlan?.currentDailyAssignment?.review || "مراجعة وتثبيت السور السابقة";
    const suggestedSheikh = student.aiPlan?.currentDailyAssignment?.suggestedSheikh || "الشيخ المنشاوي (المعلم)";
    const tajweedFocus = student.aiPlan?.currentDailyAssignment?.tajweedFocus || "مراعاة أحكام التجويد والمدود";
    const dailyNote = student.aiPlan?.currentDailyAssignment?.dailyNote || "الاستماع للقارئ وتكرار الورد 3 مرات قبل النوم.";

    if (!process.env.GEMINI_API_KEY) {
      if (attendanceStatus === "غائب") {
        const absentMsg = `السلام عليكم ورحمة الله وبركاته 🌿
حياكم الله ولي أمر بطلنا الغالي / *${student.name}* حفظكم الله ورعاكم..

افتقدنا بطلنا اليوم في حلقة القرآن الكريم، وعسى المانع خيراً إن شاء الله وطمئنونا عليه 🌸
مكان البطل في الحلقة محفوظ ومكانه بيننا غالٍ، ونحن بشوق كبير لرؤيته وإشراقة وجهه وسماع تلاوته العذبة في الجلسة القادمة بإذن الله لمواصلة تميزه وإنجازه المبارك.

نسأل الله العظيم أن يحفظه ويبارك فيه ويجعله قرة عين لكم 🤲
معلم الحلقة: *${teacherName || "الشيخ محمد منتصر"}* - *${halaqahName || "حلقة القرآن الكريم"}*`;
        return res.json({ message: absentMsg });
      }

      if (attendanceStatus === "معتذر") {
        const excuseMsg = `السلام عليكم ورحمة الله وبركاته 🌿
حياكم الله ولي أمر بطلنا النجيب / *${student.name}* حفظكم الله..

وصلنا عذركم المقبول لعدم تمكن البطل من حضور حلقة اليوم، شكر الله لكم حرصكم وتواصلكم، ونسأل الله له تمام العافية والتوفيق 🌸
نحن في انتظار لقائه وسماع تلاوته الطيبة في الجلسة القادمة بإذن الله تعالى.

مع تحيات معلم الحلقة: *${teacherName || "الشيخ محمد منتصر"}* - *${halaqahName || "حلقة القرآن الكريم"}*`;
        return res.json({ message: excuseMsg });
      }

      let defaultMsg = `السلام عليكم ورحمة الله وبركاته 🌿\n`;
      defaultMsg += `تحية مباركة لولي أمر الطالب النجيب / *${student.name}*\n`;
      defaultMsg += `نشارككم التقرير اليومي لـ *${halaqahName || "حلقة القرآن الكريم"}*:\n\n`;
      defaultMsg += `📌 *حالة الحضور اليوم:* ${attendanceStatus}\n\n`;
      
      defaultMsg += `📖 *ما تم تسميعه وإنجازه اليوم بالتفصيل:*\n`;
      defaultMsg += `🔹 *الحفظ الجديد:* ${todayNewRecited}\n`;
      defaultMsg += `🔹 *المراجعة والتثبيت:* ${todayReviewRecited}\n`;
      if (teacherNotes) {
        defaultMsg += `💡 *ملاحظات المعلم والتجويد:* ${teacherNotes}\n`;
      }
      defaultMsg += `\n`;

      defaultMsg += `🎯 *المقرر المطلوب تسميعه غداً بإذن الله تعالى:*\n`;
      defaultMsg += `✨ *الورد الجديد لغد:* ${tomorrowNewPlan}\n`;
      defaultMsg += `🔄 *المراجعة لغد:* ${tomorrowReviewPlan}\n`;
      defaultMsg += `🎧 *القارئ المقترح للاستماع:* ${suggestedSheikh}\n`;
      defaultMsg += `📝 *توجيه منزلي:* ${dailyNote}\n\n`;

      defaultMsg += `🔗 *للاطلاع على تفاصيل بيانات الطالب ومتابعة تقدمه اليومي مباشرة، اضغط على الرابط التالي:*\n`;
      defaultMsg += `${portalUrl}\n\n`;
      defaultMsg += `نسأل الله أن يبارك في حفظه ويجعله قرة عين لكم 🤲\n`;
      defaultMsg += `معلم الحلقة: *${teacherName || "الشيخ محمد منتصر"}*`;
      return res.json({ message: defaultMsg });
    }

    if (attendanceStatus === "غائب") {
      const absentPrompt = `أنت معلم ومربٍ في حلقة تحفيظ القرآن الكريم.
المطلوب صياغة رسالة واتساب قصيرة وبسيطة، دافئة جداً ولطيفة وغير رسمية لولي أمر طالب غاب اليوم عن الحلقة.
اسم الطالب: ${student.name}
اسم ولي الأمر: ${student.parentName || "ولي أمر الطالب"}
اسم الحلقة: ${halaqahName || "حلقة القرآن الكريم"}
اسم المعلم: ${teacherName || "الشيخ محمد منتصر"}

شروط وإرشادات الصياغة الصارمة:
1. الرسالة يجب ألا تكون إشعاراً إدارياً جافاً (ممنوع تماماً صياغة مثل: "إعلام لولي الأمر أن ابنه غائب" أو جداول ومصطلحات إدارية).
2. صغ الرسالة بأسلوب تربوي لطيف وأبوي يسأل عن البطل ويطمئن عليه مثل: "لماذا غاب البطل اليوم؟ افتقدنا بطلنا اليوم في حلقة القرآن الكريم وعسى المانع خيراً وطمئنونا عليه".
3. بيّن أن مكان البطل في الحلقة محفوظ ومكانه بيننا غالٍ، ونحن بشوق كبير لرؤيته في الجلسة القادمة.
4. ادعُ له بالبركة والحفظ ولأسرته الكريمة.
5. نسق الرسالة بعلامات الواتساب (*عريض*) وإيموجيز لطيفة.
6. أخرج نص الرسالة فقط بدون أي مقدمات أو تعليقات خارجية.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: absentPrompt,
      });

      return res.json({ message: response.text?.trim() });
    }

    const prompt = `أنت المعلم المشرف على حلقة تحفيظ القرآن الكريم.
المطلوب صياغة رسالة واتساب مفصلة وراقية، إسلامية، ومحفزة جداً لولي أمر الطالب باللغة العربية مع تنسيق علامات الواتساب (*عريض*) وإيموجيز قرآنية:

بيانات الطالب والتقرير:
- اسم الطالب: ${student.name}
- اسم ولي الأمر: ${student.parentName || "ولي أمر الطالب"}
- اسم الحلقة: ${halaqahName || "حلقة القرآن الكريم"}
- اسم المعلم: ${teacherName || "الشيخ محمد منتصر"}
- حالة الحضور اليوم: ${attendanceStatus} (حاضر / متأخر)
- تفاصيل ما سمعه الطالب اليوم بالتفصيل:
  * في الحفظ الجديد اليوم: ${todayNewRecited}
  * في المراجعة اليوم: ${todayReviewRecited}
  * ملاحظات وتوجيهات المعلم اليوم: ${teacherNotes || "أداء طيب ومبارك"}
- المطلوب منه تسميعه غداً بإذن الله تعالى بالتفصيل:
  * ورد الحفظ الجديد لغد: ${tomorrowNewPlan}
  * ورد المراجعة والتثبيت لغد: ${tomorrowReviewPlan}
  * القارئ المقترح للاستماع له بالمنزل: ${suggestedSheikh}
  * تركيز التجويد: ${tajweedFocus}
  * توجيه المعلم المنزلي لولي الأمر: ${dailyNote}
- الرابط المباشر لبوابة الطالب الحية لمتابعة البيانات بالتفصيل: ${portalUrl}

شروط وتنسيق الرسالة:
1. ابدأ بتحية إسلامية دافئة موجهة لولي أمر الطالب باسم الطالب.
2. ضع قسماً واضحاً وبارزاً بعنوان: 📖 *ما تم تسميعه اليوم بالتفصيل* مع ذكر الجديد والمراجعة وملاحظات المعلم.
3. ضع قسماً واضحاً وبارزاً بعنوان: 🎯 *المقرر المطلوب تسميعه غداً بإذن الله تعالى* مع توضيح ورد الحفظ الجديد لغد والمراجعة والقارئ المعلم المقترح.
4. ضع فقرة واضحة تحث ولي الأمر على الضغط على رابط البوابة الحية للاطلاع على كافة بيانات ابنه وتفاصيل حفظه:
   🔗 *للاطلاع على ملف الطالب وبياناته التفصيلية:*
   ${portalUrl}
5. اختم بالدعاء المبارك والتوقيع باسم المعلم والحلقة.
6. اجعل الرسالة مكتملة ومنسقة دون أي حقول ناقصة.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    res.json({ message: response.text });
  } catch (error) {
    console.error("Gemini whatsapp error:", error);
    const portalUrl = req.body?.clientPortalUrl || `${process.env.APP_URL || ""}/?portal=${req.body?.student?.id || ""}`;
    res.json({
      message: `السلام عليكم ورحمة الله وبركاته 🌿\nولي أمر الطالب العزيز / ${req.body?.student?.name || ""}\nتم تسجيل حضور وتسميع اليوم في حلقة القرآن الكريم بنجاح.\n🔗 لمتابعة بيانات الطالب بالتفصيل اليومي:\n${portalUrl}\nمع تحيات معلم الحلقة.`,
    });
  }
});

// 4. Generate Weekly / Monthly Detailed Report
app.post("/api/gemini/generate-report", async (req, res) => {
  try {
    const { student, reportType, attendanceSummary, evaluationList, halaqahName, teacherName, clientPortalUrl } = req.body;

    const portalUrl = clientPortalUrl || `${process.env.APP_URL || ""}/?portal=${student?.id || ""}`;
    const periodLabel = reportType === "monthly" ? "الشهري" : reportType === "comprehensive" ? "الفصلي الشامل" : "الأسبوعي";

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        summary: `تقرير ${periodLabel} للطالب ${student?.name || ""}`,
        achievementsText: `أتم الطالب حفظ وتسميع السور المقررة بنسبة التزام عالية ومستوى ${student?.level || "ممتاز"}. إجمالي أيام الحضور المسجلة: ${attendanceSummary?.presents || 0} يوم.`,
        tajweedAssessment: "مخارج الحروف طيبة مع ضبط المدود وأحكام النون الساكنة والتنوين.",
        recommendations: "الاستمرار في الاستماع اليومي للمصحف المعلم بمعدل 15 دقيقة والتكرار مع الأسرة.",
        whatsappText: `السلام عليكم ورحمة الله وبركاته 🌿\nيسرنا في *${halaqahName || "حلقة القرآن الكريم"}* مشاركتكم التقرير ${periodLabel} للطالب النجيب / *${student?.name || ""}*.\n📊 نسبة الحضور: *${attendanceSummary?.attendancePercentage || "100%"}*\n✨ إنجاز الحفظ: سورة ${student?.currentSurahName || ""}\n🔗 يمكنكم الاطلاع على كامل تفاصيل التقرير وملف الطالب عبر الرابط:\n${portalUrl}\nمع تحيات المشرف: *${teacherName || "الشيخ محمد منتصر"}*`,
      });
    }

    const prompt = `أنت خبير توجيه تربوي وإداري في حلقات تحفيظ القرآن الكريم.
المطلوب إعداد تقرير ${periodLabel} شامل ومميز للطالب:
- الطالب: ${student?.name} (العمر: ${student?.age} سنة، المستوى: ${student?.level})
- ملخص الحضور: ${JSON.stringify(attendanceSummary || {})}
- سجل التقييمات والتسميع: ${JSON.stringify(evaluationList || [])}
- الحفظ الحالي: سورة ${student?.currentSurahName}
- اسم الحلقة: ${halaqahName || "حلقة القرآن الكريم"}
- اسم المعلم: ${teacherName || "الشيخ محمد منتصر"}
- رابط ملف الطالب: ${portalUrl}

أخرج تقريراً قيماً وملهماً بصيغة JSON حصراً:
{
  "summary": "عنوان ملخص للإنجاز والتقدم",
  "achievementsText": "بيان تفصيلي بما أنجزه الطالب من صفحات وآيات ومراجعة ومقدار التقدم خلال هذه الفترة",
  "tajweedAssessment": "تقييم التجويد والأداء الصوتي والضبط ومخارج الحروف",
  "recommendations": "نصائح وتوجيهات عملية لأولياء الأمور لتثبيت الحفظ في المنزل والتشجيع",
  "whatsappText": "رسالة واتساب أنيقة ومكتملة ومنسقة بالعريض (*نص*) والإيموجيز جاهزة للإرسال فوراً لولي الأمر مع رابط المتابعة"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const reportData = JSON.parse(text);
    res.json(reportData);
  } catch (error) {
    console.error("Gemini report error:", error);
    const { student, reportType, attendanceSummary, halaqahName, teacherName, clientPortalUrl } = req.body || {};
    const portalUrl = clientPortalUrl || `${process.env.APP_URL || ""}/?portal=${student?.id || ""}`;
    const periodLabel = reportType === "monthly" ? "الشهري" : "الأسبوعي";

    res.json({
      summary: `تقرير ${periodLabel} للطالب ${student?.name || ""}`,
      achievementsText: `أتم الطالب حفظ وتسميع السور المقررة بنسبة التزام طيبة ومستوى ${student?.level || "جيد"}. إجمالي أيام الحضور: ${attendanceSummary?.presents || 0} يوم.`,
      tajweedAssessment: "مخارج الحروف طيبة مع ضبط المدود وأحكام التجويد الأساسية.",
      recommendations: "الاستماع اليومي للمصحف المعلم بمعدل 15 دقيقة والتكرار المستمر.",
      whatsappText: `السلام عليكم ورحمة الله وبركاته 🌿\nيسرنا في *${halaqahName || "حلقة القرآن الكريم"}* مشاركتكم التقرير ${periodLabel} للطالب النجيب / *${student?.name || ""}*.\n📊 نسبة الحضور: *${attendanceSummary?.attendancePercentage || "100%"}*\n✨ إنجاز الحفظ: سورة ${student?.currentSurahName || ""}\n🔗 يمكنكم الاطلاع على كامل تفاصيل التقرير وملف الطالب عبر الرابط:\n${portalUrl}\nمع تحيات المعلم: *${teacherName || "الشيخ محمد منتصر"}*`,
    });
  }
});

// 5. Interactive Quran Coach AI Chat
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history, context } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply: `أهلاً بك يا شيخنا الفاضل. بصفتي مساعدك القرآني الذكي، أنا جاهز لمساعدتك في تخطيط ورد الطلاب، وتذليل صعوبات الحفظ، وتقديم أفضل الوسائل التربوية لتحفيز طلاب الحلقة. كيف يمكنني خدمتك اليوم؟`,
      });
    }

    const systemInstruction = `أنت "مستشار عمران القرآني الذكي"، شيخ ومربٍ خبير، ضليع في علوم القرآن، التجويد والقراءات، وطرق التدريس والتحفيظ النبوية الحديثة، مع خبرة عميقة في التعامل مع مختلف مستويات وفئات الطلاب النفسية والعمرية.
لديك وصول كامل لبيانات الحلقة التالية:
- عدد الطلاب: ${context?.studentsCount || 0}
- ملخص مستويات الطلاب: ${JSON.stringify(context?.studentsSummary || [])}
- إعدادات الحلقة: ${JSON.stringify(context?.settings || {})}

مهمتك:
1. الإجابة عن أي استشارة تعليمية أو تجويدية أو تربوية يطرحها المعلم.
2. اقتراح خطط علاجية وتيسيرية للطلاب ضعاف الحفظ أو بطيئي الاستيعاب (مثل طريقة التكرار الثلاثي، طريقة الحفظ التراكمي، تقسيم الآيات الطويلة).
3. اقتراح أفكار ومسابقات تحفيزية للحلقة.
4. التحدث بلغة عربية فصيحة، وقورة، دافئة وداعمة ومحفزة.
5. إذا طلب المعلم تعديل خطة طالب محدد، أعطه خطة واضحة ومقترحة بالآيات والسور.`;

    const formattedHistory: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-10)) {
        if (h.text && (h.sender === "user" || h.sender === "assistant")) {
          formattedHistory.push({
            role: h.sender === "user" ? "user" : "model",
            parts: [{ text: h.text }],
          });
        }
      }
    }

    const chat = ai.chats.create({
      model: "gemini-3.8-flash",
      config: {
        systemInstruction,
      },
      history: formattedHistory,
    });

    const response = await chat.sendMessage({
      message: message || "السلام عليكم",
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error("Gemini chat error:", error);
    res.json({
      reply: "حدث خطأ أثناء الاتصال بالمستشار الذكي، يرجى المحاولة مرة أخرى أو مراجعة الاتصال.",
    });
  }
});

// Vite middleware for development & production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Omran Quran Platform server listening on port ${PORT}`);
  });
}

startServer();
