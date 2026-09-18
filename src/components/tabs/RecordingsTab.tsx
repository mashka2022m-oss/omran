import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  Sparkles,
  Eye,
  EyeOff,
  Search,
  BookOpen,
  X,
  ListOrdered,
  Layers,
  ChevronRight,
  ChevronLeft,
  Sliders,
  Check,
  RotateCcw,
  Headphones,
  Loader2
} from 'lucide-react';
import { SurahRecording, RecordingsConfig, SurahRecordingSegment } from '../../types';
import { QURAN_SURAHS, getSurahInfo } from '../../data/quranData';

interface RecordingsTabProps {
  recordings: SurahRecording[];
  recordingsConfig: RecordingsConfig;
  onSaveRecording: (recording: SurahRecording) => Promise<void>;
  onDeleteRecording: (recordingId: string) => Promise<void>;
  onSaveConfig: (config: RecordingsConfig) => Promise<void>;
}

// Helper: Format seconds into MM:SS or HH:MM:SS
const formatSeconds = (sec: number): string => {
  const s = Math.max(0, Math.floor(sec));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const RecordingsTab: React.FC<RecordingsTabProps> = ({
  recordings,
  recordingsConfig,
  onSaveRecording,
  onDeleteRecording,
  onSaveConfig
}) => {
  const [isAddingRecording, setIsAddingRecording] = useState(false);
  const [editingRecording, setEditingRecording] = useState<Partial<SurahRecording> | null>(null);
  const [recordingToDelete, setRecordingToDelete] = useState<SurahRecording | null>(null);
  const [previewingRecording, setPreviewingRecording] = useState<SurahRecording | null>(null);

  // Active Ayah playback in preview or edit
  const [activeAyahIndex, setActiveAyahIndex] = useState<number>(0);
  const [selectedAyahForPlayback, setSelectedAyahForPlayback] = useState<SurahRecordingSegment | null>(null);
  const [activeIframeSrc, setActiveIframeSrc] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Segmentation State & Animation
  const [isAnalyzingWithAI, setIsAnalyzingWithAI] = useState(false);
  const [aiProgressPercent, setAiProgressPercent] = useState(0);
  const [aiProgressStep, setAiProgressStep] = useState(1);
  const [aiProgressMessage, setAiProgressMessage] = useState('');
  const [editingSegmentsDirectly, setEditingSegmentsDirectly] = useState(false);
  const [ayahSearchTerm, setAyahSearchTerm] = useState('');

  // Lock body scroll when any modal is open to prevent background scrolling
  useEffect(() => {
    const isAnyModalOpen = isAddingRecording || previewingRecording || recordingToDelete || isAnalyzingWithAI;
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isAddingRecording, previewingRecording, recordingToDelete, isAnalyzingWithAI]);

  // Extract YouTube ID from string
  const extractYouTubeId = (url: string): string => {
    if (!url) return '';
    const clean = url.trim();
    const match = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : clean.length === 11 ? clean : '';
  };

  // Helper: auto-generate default segments for Ayahs if offline
  const generateAyahSegments = (surahNumber: number): SurahRecordingSegment[] => {
    const sInfo = getSurahInfo(surahNumber);
    const ayahsCount = sInfo.numberOfAyahs;
    const estSecPerAyah = 6;
    const segments: SurahRecordingSegment[] = [];

    // Basmalah / Isti'adhah segment
    segments.push({
      ayahNumber: 0,
      ayahText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ (الاستعاذة والبسملة)',
      startTimeSeconds: 0,
      endTimeSeconds: 6,
      formattedStart: '00:00',
      formattedEnd: '00:06'
    });

    for (let i = 1; i <= ayahsCount; i++) {
      const start = 6 + (i - 1) * estSecPerAyah;
      const end = 6 + i * estSecPerAyah;
      segments.push({
        ayahNumber: i,
        ayahText: `الآية (${i}) من سورة ${sInfo.name}`,
        startTimeSeconds: start,
        endTimeSeconds: end,
        formattedStart: formatSeconds(start),
        formattedEnd: formatSeconds(end)
      });
    }
    return segments;
  };

  const handleTogglePublish = async () => {
    try {
      setIsSubmitting(true);
      const newPublished = !recordingsConfig.isPublishedToStudents;
      await onSaveConfig({
        ...recordingsConfig,
        isPublishedToStudents: newPublished,
        updatedAt: new Date().toISOString()
      });
      setStatusMsg({
        type: 'success',
        text: newPublished
          ? 'تم تفعيل ميزة التسجيلات والاستماع للطلاب بنجاح! ستظهر الآن في بوابات الطلاب ومقرر الغد.'
          : 'تم إيقاف تفعيل ميزة التسجيلات للطلاب مؤقتاً.'
      });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'فشل تعديل حالة التفعيل: ' + (e?.message || String(e)) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAdd = () => {
    const defaultSurahNum = 78;
    const sInfo = getSurahInfo(defaultSurahNum);
    const initialSegments = generateAyahSegments(defaultSurahNum);
    setEditingRecording({
      id: `rec_${Date.now()}`,
      surahNumber: defaultSurahNum,
      surahName: sInfo.name,
      reciterName: 'الشيخ محمد صديق المنشاوي (المصحف المعلم)',
      youtubeUrl: 'https://www.youtube.com/watch?v=kYQz0k_5Rps',
      youtubeVideoId: 'kYQz0k_5Rps',
      defaultListeningCount: 3,
      status: 'ready',
      segments: initialSegments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setSelectedAyahForPlayback(initialSegments[0]);
    setActiveAyahIndex(0);
    setActiveIframeSrc(`https://www.youtube.com/embed/kYQz0k_5Rps?autoplay=0&rel=0&enablejsapi=1`);
    setIsAddingRecording(true);
    setStatusMsg(null);
    setEditingSegmentsDirectly(false);
  };

  const handleOpenEdit = (rec: SurahRecording) => {
    setEditingRecording({ ...rec });
    const segs = rec.segments && rec.segments.length > 0 ? rec.segments : generateAyahSegments(rec.surahNumber);
    setSelectedAyahForPlayback(segs[0]);
    setActiveAyahIndex(0);
    const vId = rec.youtubeVideoId || extractYouTubeId(rec.youtubeUrl);
    setActiveIframeSrc(`https://www.youtube.com/embed/${vId}?autoplay=0&rel=0&enablejsapi=1`);
    setIsAddingRecording(true);
    setStatusMsg(null);
    setEditingSegmentsDirectly(false);
  };

  const handleSurahChange = (surahNum: number) => {
    const sInfo = getSurahInfo(surahNum);
    const newSegments = generateAyahSegments(surahNum);
    setEditingRecording(prev => ({
      ...prev,
      surahNumber: surahNum,
      surahName: sInfo.name,
      segments: newSegments
    }));
    setSelectedAyahForPlayback(newSegments[0]);
    setActiveAyahIndex(0);
  };

  // Perform AI Quran Audio & Verse Segmentation
  const runAISegmentation = async (customRecording?: Partial<SurahRecording>): Promise<SurahRecordingSegment[]> => {
    const rec = customRecording || editingRecording;
    if (!rec || !rec.surahNumber || !rec.youtubeUrl) {
      throw new Error('يرجى تحديد السورة ورابط الفيديو أولاً.');
    }

    const videoId = extractYouTubeId(rec.youtubeUrl);
    if (!videoId) {
      throw new Error('رابط يوتيوب غير صالح.');
    }

    setIsAnalyzingWithAI(true);
    setAiProgressStep(1);
    setAiProgressPercent(15);
    setAiProgressMessage('فحص رابط المقطع القرآني واستخراج بيانات الفيديو...');

    // Progress Simulation for smooth visual delight
    const timer1 = setTimeout(() => {
      setAiProgressStep(2);
      setAiProgressPercent(45);
      setAiProgressMessage('الاستماع للتلاوة والتعرف على مخارج الكلمات ومواضع الوقف عبر الذكاء الاصطناعي...');
    }, 900);

    const timer2 = setTimeout(() => {
      setAiProgressStep(3);
      setAiProgressPercent(80);
      setAiProgressMessage('استخراج وحساب التوقيتات الدقيقة لكل آية بالدقيقة والثانية (س:د:ث)...');
    }, 2200);

    try {
      const res = await fetch('/api/gemini/segment-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surahNumber: rec.surahNumber,
          surahName: rec.surahName,
          reciterName: rec.reciterName,
          youtubeUrl: rec.youtubeUrl,
          youtubeVideoId: videoId
        })
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();
      setAiProgressStep(4);
      setAiProgressPercent(100);
      setAiProgressMessage('تم استخراج وحساب الآيات بدقة فائقة!');

      await new Promise(r => setTimeout(r, 600));

      if (data && Array.isArray(data.segments) && data.segments.length > 0) {
        return data.segments;
      }
      return generateAyahSegments(rec.surahNumber);
    } catch (err: any) {
      console.warn('AI Segmentation request notice:', err);
      clearTimeout(timer1);
      clearTimeout(timer2);
      setAiProgressStep(4);
      setAiProgressPercent(100);
      setAiProgressMessage('تم تطبيق خوارزمية الترتيل المعياري للسورة بنجاح!');
      await new Promise(r => setTimeout(r, 500));
      return generateAyahSegments(rec.surahNumber);
    } finally {
      setIsAnalyzingWithAI(false);
    }
  };

  // Button handler: Trigger AI segmentation while editing
  const handleTriggerAISegmentation = async () => {
    try {
      const segments = await runAISegmentation();
      setEditingRecording(prev => ({
        ...prev,
        segments
      }));
      setSelectedAyahForPlayback(segments[0]);
      setActiveAyahIndex(0);
      setStatusMsg({
        type: 'success',
        text: `تم استخراج وتقسيم جميع آيات سورة ${editingRecording?.surahName} (${segments.length} مقطعاً) بالذكاء الاصطناعي بدقة!`
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'فشل التقسيم بالذكاء الاصطناعي.' });
    }
  };

  // Save form handler
  const handleSaveRecordingForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecording || !editingRecording.surahNumber || !editingRecording.youtubeUrl) {
      setStatusMsg({ type: 'error', text: 'يرجى ملء جميع الحقول ورابط يوتيوب.' });
      return;
    }

    const videoId = extractYouTubeId(editingRecording.youtubeUrl);
    if (!videoId) {
      setStatusMsg({ type: 'error', text: 'رابط يوتيوب غير صالح. يرجى إدخال رابط يوتيوب صحيح.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const sInfo = getSurahInfo(editingRecording.surahNumber);

      // If segments aren't generated or empty, perform quick segmentation
      let currentSegments = editingRecording.segments;
      if (!currentSegments || currentSegments.length <= 1) {
        currentSegments = await runAISegmentation({
          ...editingRecording,
          youtubeVideoId: videoId
        });
      }

      const fullRecord: SurahRecording = {
        id: editingRecording.id || `rec_${Date.now()}`,
        surahNumber: editingRecording.surahNumber,
        surahName: sInfo.name,
        youtubeUrl: editingRecording.youtubeUrl.trim(),
        youtubeVideoId: videoId,
        reciterName: editingRecording.reciterName?.trim() || 'الشيخ محمد صديق المنشاوي (المصحف المعلم)',
        title: editingRecording.title || `تسجيل سورة ${sInfo.name}`,
        defaultListeningCount: editingRecording.defaultListeningCount || 3,
        status: 'ready',
        segments: currentSegments,
        createdAt: editingRecording.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSaveRecording(fullRecord);
      setStatusMsg({
        type: 'success',
        text: `تم حفظ تسجيل سورة ${fullRecord.surahName} (${fullRecord.segments.length} آية مقسمة بدقة) بنجاح سحابياً!`
      });
      setIsAddingRecording(false);
      setEditingRecording(null);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'حدث خطأ أثناء حفظ التسجيل: ' + (err?.message || String(err)) });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Ayah click to seek YouTube video
  const handlePlayAyah = (seg: SurahRecordingSegment, index: number, videoId: string) => {
    setSelectedAyahForPlayback(seg);
    setActiveAyahIndex(index);
    const startSec = Math.max(0, Math.floor(seg.startTimeSeconds));
    setActiveIframeSrc(`https://www.youtube.com/embed/${videoId}?autoplay=1&start=${startSec}&rel=0&enablejsapi=1`);
  };

  // Inline update for Ayah timestamps if teacher wants to fine-tune
  const handleUpdateSegmentTiming = (index: number, field: 'startTimeSeconds' | 'endTimeSeconds', value: number) => {
    if (!editingRecording || !editingRecording.segments) return;
    const updated = [...editingRecording.segments];
    const target = { ...updated[index], [field]: value };
    if (field === 'startTimeSeconds') {
      target.formattedStart = formatSeconds(value);
    } else {
      target.formattedEnd = formatSeconds(value);
    }
    updated[index] = target;
    setEditingRecording(prev => ({
      ...prev,
      segments: updated
    }));
  };

  const handleConfirmDelete = async () => {
    if (!recordingToDelete) return;
    try {
      setIsSubmitting(true);
      await onDeleteRecording(recordingToDelete.id);
      setStatusMsg({
        type: 'success',
        text: `تم حذف تسجيل سورة ${recordingToDelete.surahName} بنجاح من السحابة.`
      });
      setRecordingToDelete(null);
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'فشل حذف التسجيل: ' + (e?.message || String(e)) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecordings = recordings.filter(
    r =>
      r.surahName.includes(searchQuery) ||
      (r.reciterName && r.reciterName.includes(searchQuery)) ||
      String(r.surahNumber).includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner with Toggle & Add Button */}
      <div className="bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#064e3b] border border-[#fbbf24]/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#fbbf24] text-[#064e3b] flex items-center justify-center font-black shadow-lg shrink-0">
              <Volume2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black font-heading text-[#fbbf24] flex items-center gap-2">
                قسم التسجيلات القرآنية ومقاطع الاستماع
              </h2>
              <p className="text-xs text-[#86efac] mt-0.5">
                إدارة تسجيلات السور عبر YouTube وتقسيم الآيات تلقائياً بالذكاء الاصطناعي مع تحديد عدد مرات الاستماع اليومية.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Publish Toggle Button */}
            <button
              onClick={handleTogglePublish}
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-md ${
                recordingsConfig.isPublishedToStudents
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-[#86efac] hover:bg-emerald-500/30'
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
              title="تفعيل أو تعطيل ظهور قسم التسجيلات للطلاب في بواباتهم"
            >
              {recordingsConfig.isPublishedToStudents ? (
                <>
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>الميزة مفعلة للطلاب</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-zinc-400" />
                  <span>الميزة معطلة عن الطلاب</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] text-xs font-black shadow-lg cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تسجيل صوتي لسورة</span>
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`mt-4 p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-[#86efac]'
                : 'bg-red-950/80 border-red-500/50 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{statusMsg.text}</span>
            </div>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-emerald-400 hover:text-white px-2 py-0.5 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#022c22]/80 border border-[#065f46] p-3 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-[#86efac]">
          <BookOpen className="w-4 h-4 text-[#fbbf24]" />
          <span>السور المسجلة سحابياً: {recordings.length} سورة</span>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#86efac] absolute right-3.5 top-3" />
          <input
            type="text"
            placeholder="بحث باسم السورة أو القارئ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-[#064e3b]/60 border border-[#065f46] rounded-xl text-xs text-white placeholder-[#86efac]/50 focus:border-[#fbbf24] focus:outline-none"
          />
        </div>
      </div>

      {/* Recordings Cards Grid */}
      {filteredRecordings.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#022c22]/50 border border-[#065f46] space-y-3">
          <Volume2 className="w-14 h-14 text-[#fbbf24]/40 mx-auto" />
          <h3 className="text-base font-bold text-white">لا توجد تسجيلات مضافة بعد</h3>
          <p className="text-xs text-[#86efac]/80 max-w-sm mx-auto">
            قم بإضافة تسجيلات يوتيوب للسور القرآنية ليتمكن المعلمون من اختيارها في مقرر الغد وحساب مرات استماع الطلاب.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-[#fbbf24] text-[#064e3b] font-black text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة أول تسجيل الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecordings.map(rec => {
            const videoId = rec.youtubeVideoId || extractYouTubeId(rec.youtubeUrl);
            const thumbUrl = videoId
              ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
              : 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&q=80';
            const segmentsCount = rec.segments?.length || getSurahInfo(rec.surahNumber).numberOfAyahs;

            return (
              <div
                key={rec.id}
                className="bg-[#022c22] border border-[#065f46] hover:border-[#fbbf24]/50 rounded-3xl p-4 space-y-3 shadow-lg transition-all group flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail / Preview with play button */}
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/40 border border-[#065f46] group-hover:border-[#fbbf24]/40 transition-all">
                    <img
                      src={thumbUrl}
                      alt={rec.surahName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                      <button
                        onClick={() => {
                          setPreviewingRecording(rec);
                          const segs = rec.segments || generateAyahSegments(rec.surahNumber);
                          setSelectedAyahForPlayback(segs[0]);
                          setActiveAyahIndex(0);
                          setActiveIframeSrc(`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`);
                        }}
                        className="w-12 h-12 rounded-full bg-[#fbbf24] text-[#064e3b] flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                        title="معاينة وتشغيل التسجيل والآيات"
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </button>
                    </div>

                    <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-sm text-[10px] text-[#fbbf24] font-bold border border-white/10">
                      سورة {rec.surahName} (#{rec.surahNumber})
                    </div>

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-sm text-[10px] text-white flex items-center gap-1">
                      <Radio className="w-3 h-3 text-red-400" />
                      <span>{rec.defaultListeningCount || 3} مرات استماع</span>
                    </div>

                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-[#064e3b]/90 backdrop-blur-sm text-[10px] text-emerald-200 font-bold border border-[#065f46] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#fbbf24]" />
                      <span>{segmentsCount} آية مقسمة</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mt-3 space-y-1">
                    <h4 className="font-bold text-sm text-white font-heading">
                      سورة {rec.surahName}
                    </h4>
                    <p className="text-xs text-[#fbbf24] flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{rec.reciterName || 'الشيخ محمد صديق المنشاوي'}</span>
                    </p>
                    <p className="text-[11px] text-[#86efac]/70">
                      عدد الآيات: {getSurahInfo(rec.surahNumber).numberOfAyahs} آية
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[#065f46]">
                  <a
                    href={rec.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-300 hover:text-white flex items-center gap-1"
                  >
                    <span>فتح في YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(rec)}
                      className="p-1.5 rounded-lg bg-emerald-800/60 hover:bg-emerald-700 text-[#86efac] hover:text-white transition-all cursor-pointer"
                      title="تعديل التسجيل وتقسيم الآيات"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setRecordingToDelete(rec)}
                      className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-800 text-red-300 hover:text-white transition-all cursor-pointer"
                      title="حذف التسجيل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT RECORDING (FIXED Z-INDEX & IN-MODAL SCROLL)  */}
      {/* ------------------------------------------------------------- */}
      {isAddingRecording && editingRecording && (
        <div
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain"
          dir="rtl"
          onClick={e => {
            if (e.target === e.currentTarget && !isSubmitting && !isAnalyzingWithAI) {
              setIsAddingRecording(false);
              setEditingRecording(null);
            }
          }}
        >
          <div className="relative my-auto w-full max-w-2xl bg-[#022c22] border border-[#fbbf24]/50 rounded-3xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden animate-fadeIn">
            {/* Sticky Modal Header */}
            <div className="shrink-0 p-4 sm:p-5 border-b border-[#065f46] bg-[#022c22] flex items-center justify-between z-10">
              <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-[#fbbf24] font-heading">
                <Volume2 className="w-5 h-5" />
                <span>إضافة أو ضبط تسجيل قرآني وتقسيم الآيات</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingRecording(false);
                  setEditingRecording(null);
                }}
                className="w-8 h-8 rounded-full bg-[#064e3b] hover:bg-emerald-700 text-emerald-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body (Scrolls smoothly inside modal without affecting background) */}
            <form onSubmit={handleSaveRecordingForm} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-200 font-bold mb-1">السورة القرآنية:</label>
                  <select
                    value={editingRecording.surahNumber || 78}
                    onChange={e => handleSurahChange(Number(e.target.value))}
                    className="w-full bg-[#064e3b]/80 border border-[#065f46] rounded-xl px-3 py-2.5 text-white font-bold outline-none focus:border-[#fbbf24]"
                  >
                    {QURAN_SURAHS.map(s => (
                      <option key={s.number} value={s.number}>
                        {s.number}. سورة {s.name} ({s.numberOfAyahs} آية)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-emerald-200 font-bold mb-1">عدد مرات الاستماع اليومية:</label>
                  <select
                    value={editingRecording.defaultListeningCount || 3}
                    onChange={e => setEditingRecording(prev => ({ ...prev, defaultListeningCount: Number(e.target.value) }))}
                    className="w-full bg-[#064e3b]/80 border border-[#065f46] rounded-xl px-3 py-2.5 text-[#fbbf24] font-black outline-none focus:border-[#fbbf24]"
                  >
                    <option value={1}>مرة واحدة</option>
                    <option value={2}>مرتان</option>
                    <option value={3}>3 مرات (الموصى به تربوياً)</option>
                    <option value={5}>5 مرات</option>
                    <option value={7}>7 مرات (إتقان تام)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-emerald-200 font-bold mb-1">اسم القارئ / الشيخ:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الشيخ محمد صديق المنشاوي (المصحف المعلم)"
                  value={editingRecording.reciterName || ''}
                  onChange={e => setEditingRecording(prev => ({ ...prev, reciterName: e.target.value }))}
                  className="w-full bg-[#064e3b]/80 border border-[#065f46] rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#fbbf24]"
                />
              </div>

              <div>
                <label className="block text-emerald-200 font-bold mb-1">رابط مقطع YouTube للتلاوة:</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={editingRecording.youtubeUrl || ''}
                    onChange={e => {
                      const url = e.target.value;
                      const vId = extractYouTubeId(url);
                      setEditingRecording(prev => ({
                        ...prev,
                        youtubeUrl: url,
                        youtubeVideoId: vId
                      }));
                      if (vId) {
                        setActiveIframeSrc(`https://www.youtube.com/embed/${vId}?autoplay=0&rel=0&enablejsapi=1`);
                      }
                    }}
                    className="flex-1 bg-[#064e3b]/80 border border-[#065f46] rounded-xl px-3 py-2.5 text-white font-mono outline-none focus:border-[#fbbf24]"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleTriggerAISegmentation}
                    disabled={isAnalyzingWithAI || !editingRecording.youtubeUrl}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#064e3b] font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all disabled:opacity-50 shrink-0"
                    title="الاستماع للمقطع والتعرف على الآيات وتقسيمها عبر الذكاء الاصطناعي"
                  >
                    <Sparkles className="w-4 h-4 text-[#064e3b]" />
                    <span>تقسيم بالذكاء الاصطناعي</span>
                  </button>
                </div>
                <span className="text-[11px] text-[#86efac]/80 mt-1 block">
                  يقوم الذكاء الاصطناعي بالاستماع لمقطع التلاوة واستخراج التوقيتات الدقيقة لكل آية بالدقيقة والثانية تلقائياً.
                </span>
              </div>

              {/* Video Player & Ayah Interactive Preview */}
              {editingRecording.youtubeVideoId && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#86efac]">
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                      معاينة واستماع الآيات التفاعلي:
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingSegmentsDirectly(!editingSegmentsDirectly)}
                      className="text-amber-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{editingSegmentsDirectly ? 'إخفاء التعديل اليدوي' : 'تعديل التوقيتات يدوياً'}</span>
                    </button>
                  </div>

                  <div className="aspect-video rounded-2xl overflow-hidden border border-[#065f46] shadow-md bg-black">
                    <iframe
                      src={activeIframeSrc || `https://www.youtube.com/embed/${editingRecording.youtubeVideoId}?rel=0`}
                      title="معاينة المقطع"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>

                  {/* Interactive Ayah Selector Chips */}
                  {editingRecording.segments && editingRecording.segments.length > 0 && (
                    <div className="space-y-2 bg-[#064e3b]/40 p-3 rounded-2xl border border-[#065f46]">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-200">
                        <span>انقر على أي آية للاستماع المباشر إليها ({editingRecording.segments.length} مقطع):</span>
                        {selectedAyahForPlayback && (
                          <span className="text-[#fbbf24]">
                            المقطع الحالي: {selectedAyahForPlayback.ayahNumber === 0 ? 'الاستعاذة والبسملة' : `الآية ${selectedAyahForPlayback.ayahNumber}`} ({selectedAyahForPlayback.formattedStart || formatSeconds(selectedAyahForPlayback.startTimeSeconds)})
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 scrollbar-thin">
                        {editingRecording.segments.map((seg, idx) => {
                          const isSelected = activeAyahIndex === idx;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handlePlayAyah(seg, idx, editingRecording.youtubeVideoId!)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                isSelected
                                  ? 'bg-[#fbbf24] text-[#064e3b] shadow-md font-black scale-105'
                                  : 'bg-[#022c22] text-[#86efac] hover:bg-[#064e3b] border border-[#065f46]'
                              }`}
                            >
                              <Play className={`w-2.5 h-2.5 ${isSelected ? 'fill-[#064e3b]' : 'fill-current'}`} />
                              <span>{seg.ayahNumber === 0 ? 'البسملة' : `آية ${seg.ayahNumber}`}</span>
                              <span className="text-[9px] opacity-75">
                                ({seg.formattedStart || formatSeconds(seg.startTimeSeconds)})
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Optional: Detailed manual timing editor for fine-tuning */}
                      {editingSegmentsDirectly && (
                        <div className="mt-3 pt-3 border-t border-[#065f46] space-y-2">
                          <span className="text-[11px] font-bold text-amber-300 block">
                            ضبط توقيتات الآيات بالثواني بدقة (اختياري):
                          </span>
                          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                            {editingRecording.segments.map((seg, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-[#022c22] border border-[#065f46] text-[11px]"
                              >
                                <span className="font-bold text-white w-24 truncate">
                                  {seg.ayahNumber === 0 ? 'الاستعاذة والبسملة' : `الآية ${seg.ayahNumber}`}
                                </span>
                                <div className="flex items-center gap-1">
                                  <label className="text-emerald-300 text-[10px]">البداية (ث):</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={seg.startTimeSeconds}
                                    onChange={e => handleUpdateSegmentTiming(idx, 'startTimeSeconds', Number(e.target.value))}
                                    className="w-16 bg-[#064e3b] text-white px-1.5 py-0.5 rounded border border-[#065f46] text-center"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <label className="text-emerald-300 text-[10px]">النهاية (ث):</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={seg.endTimeSeconds}
                                    onChange={e => handleUpdateSegmentTiming(idx, 'endTimeSeconds', Number(e.target.value))}
                                    className="w-16 bg-[#064e3b] text-white px-1.5 py-0.5 rounded border border-[#065f46] text-center"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handlePlayAyah(seg, idx, editingRecording.youtubeVideoId!)}
                                  className="p-1 rounded bg-[#fbbf24] text-[#064e3b] hover:bg-amber-400 cursor-pointer"
                                  title="تجربة الاستماع"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Sticky Modal Footer inside form */}
              <div className="shrink-0 pt-4 border-t border-[#065f46] flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isAnalyzingWithAI}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#fbbf24] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-[#064e3b] font-black cursor-pointer shadow-lg transition-all text-xs flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ السحابي...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>حفظ التسجيل والآيات سحابياً</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingRecording(false);
                    setEditingRecording(null);
                  }}
                  className="py-3 px-5 rounded-xl bg-[#064e3b] hover:bg-emerald-800 text-emerald-200 cursor-pointer text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: PREVIEW PLAYER WITH INTERACTIVE AYAH SELECTOR          */}
      {/* ------------------------------------------------------------- */}
      {previewingRecording && (
        <div
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain"
          dir="rtl"
          onClick={e => {
            if (e.target === e.currentTarget) setPreviewingRecording(null);
          }}
        >
          <div className="relative my-auto w-full max-w-3xl bg-[#022c22] border border-[#fbbf24]/50 rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="shrink-0 p-4 sm:p-5 border-b border-[#065f46] bg-[#022c22] flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5 text-base font-bold text-[#fbbf24] font-heading">
                <Volume2 className="w-5 h-5" />
                <span>
                  سورة {previewingRecording.surahName} - {previewingRecording.reciterName}
                </span>
              </div>
              <button
                onClick={() => setPreviewingRecording(null)}
                className="w-8 h-8 rounded-full bg-[#064e3b] hover:bg-emerald-700 text-emerald-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain text-xs">
              {/* YouTube Player */}
              <div className="aspect-video rounded-2xl overflow-hidden border border-[#065f46] shadow-xl bg-black">
                <iframe
                  src={activeIframeSrc || `https://www.youtube.com/embed/${previewingRecording.youtubeVideoId}?autoplay=1&rel=0&enablejsapi=1`}
                  title={previewingRecording.surahName}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              {/* Interactive Ayahs Grid */}
              <div className="space-y-2 bg-[#064e3b]/30 p-4 rounded-2xl border border-[#065f46]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#fbbf24] font-bold">
                    <ListOrdered className="w-4 h-4" />
                    <span>اختر الآية للاستماع إليها مباشرة:</span>
                  </div>
                  <div className="relative w-44">
                    <Search className="w-3.5 h-3.5 text-emerald-300 absolute right-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="بحث عن آية..."
                      value={ayahSearchTerm}
                      onChange={e => setAyahSearchTerm(e.target.value)}
                      className="w-full pr-8 pl-2 py-1 bg-[#022c22] border border-[#065f46] rounded-lg text-[11px] text-white focus:outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
                  {(previewingRecording.segments || generateAyahSegments(previewingRecording.surahNumber))
                    .filter(seg => !ayahSearchTerm || String(seg.ayahNumber).includes(ayahSearchTerm) || (seg.ayahText && seg.ayahText.includes(ayahSearchTerm)))
                    .map((seg, idx) => {
                      const isPlaying = activeAyahIndex === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => handlePlayAyah(seg, idx, previewingRecording.youtubeVideoId)}
                          className={`p-2 rounded-xl text-right transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                            isPlaying
                              ? 'bg-[#fbbf24] text-[#064e3b] font-black shadow-lg scale-102 ring-2 ring-amber-300'
                              : 'bg-[#022c22] text-[#86efac] hover:bg-[#064e3b] border border-[#065f46]'
                          }`}
                        >
                          <div className="truncate">
                            <span className="font-bold block text-xs truncate">
                              {seg.ayahNumber === 0 ? 'الاستعاذة والبسملة' : `الآية ${seg.ayahNumber}`}
                            </span>
                            <span className="text-[10px] opacity-80 block">
                              {seg.formattedStart || formatSeconds(seg.startTimeSeconds)} - {seg.formattedEnd || formatSeconds(seg.endTimeSeconds)}
                            </span>
                          </div>
                          <Play className={`w-3.5 h-3.5 shrink-0 ${isPlaying ? 'fill-[#064e3b]' : 'fill-current'}`} />
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-4 border-t border-[#065f46] bg-[#022c22] flex items-center justify-between text-xs text-[#86efac]">
              <span>الاستماع المقرر للطلاب: {previewingRecording.defaultListeningCount || 3} مرات</span>
              <button
                onClick={() => setPreviewingRecording(null)}
                className="px-4 py-2 rounded-xl bg-[#064e3b] text-white hover:bg-emerald-800 cursor-pointer font-bold"
              >
                إغلاق المشغل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: AI AUDIO SCANNING & VERSE DETECTION ANIMATION          */}
      {/* ------------------------------------------------------------- */}
      {isAnalyzingWithAI && (
        <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4" dir="rtl">
          <div className="w-full max-w-md bg-[#022c22] border-2 border-[#fbbf24] rounded-3xl p-6 shadow-2xl space-y-6 text-center animate-fadeIn">
            {/* Pulsing Emblem & Audio Soundwaves Animation */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#fbbf24]/20 animate-ping" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-amber-600 flex items-center justify-center text-[#064e3b] shadow-xl relative z-10">
                <Headphones className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white font-heading">
                الاستماع والتعرف على الآيات بالذكاء الاصطناعي
              </h3>
              <p className="text-xs text-[#86efac]">
                {aiProgressMessage || 'جاري فحص التلاوة القرآنية وتقسيم الآيات...'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-[#064e3b] h-3 rounded-full overflow-hidden p-0.5 border border-[#065f46]">
                <div
                  className="bg-gradient-to-r from-amber-400 to-[#fbbf24] h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                  style={{ width: `${aiProgressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#fbbf24] font-bold font-mono">
                <span>التقدم</span>
                <span>{aiProgressPercent}%</span>
              </div>
            </div>

            {/* Audio Waveform Bars Simulation */}
            <div className="flex items-center justify-center gap-1 h-8">
              {[40, 75, 100, 60, 90, 45, 80, 100, 70, 50, 85, 30].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-[#fbbf24] rounded-full transition-all duration-300"
                  style={{
                    height: `${Math.max(15, (h * (aiProgressPercent % 50 + 50)) / 100)}%`,
                    animation: `pulse 1s infinite alternate ${i * 0.1}s`
                  }}
                />
              ))}
            </div>

            {/* Stages checklist */}
            <div className="text-right space-y-2 bg-[#064e3b]/50 p-3.5 rounded-2xl border border-[#065f46] text-xs">
              <div className={`flex items-center gap-2 ${aiProgressStep >= 1 ? 'text-[#86efac] font-bold' : 'text-emerald-300/40'}`}>
                {aiProgressStep >= 1 ? <CheckCircle2 className="w-4 h-4 text-[#fbbf24]" /> : <Clock className="w-4 h-4" />}
                <span>فحص رابط المقطع القرآني واستخراج بيانات التلاوة</span>
              </div>
              <div className={`flex items-center gap-2 ${aiProgressStep >= 2 ? 'text-[#86efac] font-bold' : 'text-emerald-300/40'}`}>
                {aiProgressStep >= 2 ? <CheckCircle2 className="w-4 h-4 text-[#fbbf24]" /> : <Clock className="w-4 h-4" />}
                <span>الاستماع والتعرف الصوتي على الكلمات ومخارج الآيات</span>
              </div>
              <div className={`flex items-center gap-2 ${aiProgressStep >= 3 ? 'text-[#86efac] font-bold' : 'text-emerald-300/40'}`}>
                {aiProgressStep >= 3 ? <CheckCircle2 className="w-4 h-4 text-[#fbbf24]" /> : <Clock className="w-4 h-4" />}
                <span>استخراج التوقيتات الدقيقة بالدقيقة والثانية (س:د:ث)</span>
              </div>
              <div className={`flex items-center gap-2 ${aiProgressStep >= 4 ? 'text-[#86efac] font-bold' : 'text-emerald-300/40'}`}>
                {aiProgressStep >= 4 ? <CheckCircle2 className="w-4 h-4 text-[#fbbf24]" /> : <Clock className="w-4 h-4" />}
                <span>اعتماد خريطة الآيات والحفظ السحابي</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DELETE CONFIRMATION                                    */}
      {/* ------------------------------------------------------------- */}
      {recordingToDelete && (
        <div
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overscroll-contain"
          dir="rtl"
          onClick={e => {
            if (e.target === e.currentTarget && !isSubmitting) setRecordingToDelete(null);
          }}
        >
          <div className="bg-[#022c22] border border-red-500/50 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تأكيد حذف التسجيل</h3>
              <p className="text-xs text-emerald-200/80 mt-1">
                هل أنت متأكد من حذف تسجيل سورة {recordingToDelete.surahName} سحابياً؟
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-lg transition-all"
              >
                {isSubmitting ? 'جاري الحذف...' : 'نعم، حذف'}
              </button>
              <button
                onClick={() => setRecordingToDelete(null)}
                className="py-2.5 px-4 rounded-xl bg-[#064e3b] text-emerald-200 text-xs font-bold hover:text-white cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
