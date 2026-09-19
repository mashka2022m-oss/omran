import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, FastForward, Rewind, Repeat, MapPin, Flag, Check } from 'lucide-react';
import { SurahRecordingSegment } from '../../types';

interface YouTubeAyahPlayerProps {
  videoId: string;
  activeSegment: SurahRecordingSegment | null;
  targetSegmentToPlay?: SurahRecordingSegment | null;
  onTimeUpdate?: (currentTime: number) => void;
  onSetStartTime?: (seconds: number) => void;
  onSetEndTime?: (seconds: number) => void;
  onNextAyah?: () => void;
  onPrevAyah?: () => void;
  readOnlyControls?: boolean; // For preview or student view
  surahName?: string;
  onAyahFinished?: (seg: SurahRecordingSegment) => void;
}

// Format seconds into MM:SS
export const formatTimeMMSS = (sec: number): string => {
  const s = Math.max(0, Math.floor(sec));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const YouTubeAyahPlayer: React.FC<YouTubeAyahPlayerProps> = ({
  videoId,
  activeSegment,
  targetSegmentToPlay,
  onTimeUpdate,
  onSetStartTime,
  onSetEndTime,
  onNextAyah,
  onPrevAyah,
  readOnlyControls = false,
  surahName,
  onAyahFinished
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [playingSegment, setPlayingSegment] = useState<SurahRecordingSegment | null>(null);
  const [justFinishedAlert, setJustFinishedAlert] = useState<boolean>(false);

  // Send command to YouTube iframe via postMessage
  const sendYTCommand = useCallback((func: string, args: any[] = []) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func,
          args
        }),
        '*'
      );
    } catch (e) {
      console.warn('Error sending postMessage to YouTube player:', e);
    }
  }, []);

  // Listen to postMessage from YouTube iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'string') return;
      try {
        const data = JSON.parse(e.data);
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            const time = data.info.currentTime;
            setCurrentTime(time);
            onTimeUpdate?.(time);

            // Check if playing a restricted segment and reached its end
            if (playingSegment && playingSegment.endTimeSeconds > 0) {
              if (time >= playingSegment.endTimeSeconds) {
                if (isLooping) {
                  // Loop back to start
                  sendYTCommand('seekTo', [playingSegment.startTimeSeconds, true]);
                  sendYTCommand('playVideo');
                } else {
                  // Strictly pause at end of segment
                  sendYTCommand('pauseVideo');
                  setIsPlaying(false);
                  setJustFinishedAlert(true);
                  setTimeout(() => setJustFinishedAlert(false), 2500);
                  onAyahFinished?.(playingSegment);
                  setPlayingSegment(null);
                }
              }
            }
          }

          if (typeof data.info.playerState === 'number') {
            // YT.PlayerState: 1 is playing, 2 is paused, 0 is ended
            setIsPlaying(data.info.playerState === 1);
          }
        }
      } catch {
        // Ignore non-json messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [playingSegment, isLooping, onTimeUpdate, onAyahFinished, sendYTCommand]);

  // Request listening updates from YouTube iframe
  useEffect(() => {
    const interval = setInterval(() => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'listening', id: 'yt-ayah-player' }),
          '*'
        );
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  // Play a specific segment strictly from its start to end
  const playAyahSegment = useCallback((seg: SurahRecordingSegment) => {
    setPlayingSegment(seg);
    const start = Math.max(0, seg.startTimeSeconds);
    sendYTCommand('seekTo', [start, true]);
    sendYTCommand('playVideo');
    setIsPlaying(true);
    setJustFinishedAlert(false);
  }, [sendYTCommand]);

  // When targetSegmentToPlay changes, automatically seek and play
  useEffect(() => {
    if (targetSegmentToPlay) {
      playAyahSegment(targetSegmentToPlay);
    }
  }, [targetSegmentToPlay, playAyahSegment]);

  const handleTogglePlayPause = () => {
    if (isPlaying) {
      sendYTCommand('pauseVideo');
      setIsPlaying(false);
    } else {
      sendYTCommand('playVideo');
      setIsPlaying(true);
    }
  };

  const handleSeekDelta = (deltaSeconds: number) => {
    const newTime = Math.max(0, currentTime + deltaSeconds);
    sendYTCommand('seekTo', [newTime, true]);
  };

  const handleSetStartFromCurrent = () => {
    if (onSetStartTime) {
      const rounded = Math.round(currentTime);
      onSetStartTime(rounded);
    }
  };

  const handleSetEndFromCurrent = () => {
    if (onSetEndTime) {
      const rounded = Math.round(currentTime);
      onSetEndTime(rounded);
    }
  };

  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;

  return (
    <div className="space-y-3 bg-[#022c22] rounded-2xl border border-[#065f46] p-3 shadow-lg">
      {/* YouTube Embed Container */}
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black relative border border-[#065f46]/60 shadow-inner">
        <iframe
          ref={iframeRef}
          id="yt-ayah-player"
          src={embedUrl}
          title={`تلاوة ${surahName || 'القرآن الكريم'}`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

        {/* Floating banner when strictly playing an Ayah */}
        {playingSegment && (
          <div className="absolute top-2 left-2 right-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#fbbf24]/60 flex items-center justify-between text-xs text-white z-10 animate-fadeIn">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-[#fbbf24]">
                {playingSegment.ayahNumber === 0 ? 'الاستعاذة والبسملة' : `استماع الآية ${playingSegment.ayahNumber}`}
              </span>
              <span className="text-[#86efac] text-[11px] truncate">
                ({formatTimeMMSS(playingSegment.startTimeSeconds)} - {formatTimeMMSS(playingSegment.endTimeSeconds)})
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-[10px] text-amber-300">
              <span>ينتهي عند {formatTimeMMSS(playingSegment.endTimeSeconds)}</span>
            </div>
          </div>
        )}

        {/* Finished verse toast */}
        {justFinishedAlert && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-900/95 border border-emerald-400 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 z-20 animate-fadeIn">
            <Check className="w-4 h-4 text-[#fbbf24]" />
            <span>تم استماع المقطع المحدد بالكامل وتوقف المشغل تلقائياً.</span>
          </div>
        )}
      </div>

      {/* Live Playback Toolbar & Timestamps Controller */}
      <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-xl p-2.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Live time indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#022c22] border border-[#065f46] text-white font-mono text-xs">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-ping' : 'bg-zinc-500'}`} />
              <span className="text-emerald-300 font-bold">الوقت الحالي:</span>
              <span className="text-[#fbbf24] font-black text-sm">{formatTimeMMSS(currentTime)}</span>
              <span className="text-[10px] text-[#86efac]/70">({currentTime.toFixed(1)}ث)</span>
            </div>

            {/* Loop Toggle */}
            <button
              type="button"
              onClick={() => setIsLooping(!isLooping)}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                isLooping
                  ? 'bg-amber-500/30 border-amber-400 text-[#fbbf24]'
                  : 'bg-[#022c22] border-[#065f46] text-emerald-300 hover:text-white'
              }`}
              title="تكرار الآية المحددة تلقائياً للتحفيظ والإتقان"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>{isLooping ? 'التكرار مفعل' : 'تكرار الآية'}</span>
            </button>
          </div>

          {/* Quick player scrubber controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSeekDelta(-5)}
              className="px-2 py-1 rounded-lg bg-[#022c22] hover:bg-[#064e3b] text-[#86efac] text-[10px] font-mono border border-[#065f46] cursor-pointer"
              title="تأخير 5 ثوانٍ"
            >
              -5ث
            </button>
            <button
              type="button"
              onClick={() => handleSeekDelta(-1)}
              className="px-2 py-1 rounded-lg bg-[#022c22] hover:bg-[#064e3b] text-[#86efac] text-[10px] font-mono border border-[#065f46] cursor-pointer"
              title="تأخير ثانية واحدة"
            >
              -1ث
            </button>
            <button
              type="button"
              onClick={handleTogglePlayPause}
              className="px-3 py-1 rounded-lg bg-[#fbbf24] hover:bg-amber-400 text-[#064e3b] font-black text-xs flex items-center gap-1 shadow-md cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'إيقاف' : 'تشغيل'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSeekDelta(1)}
              className="px-2 py-1 rounded-lg bg-[#022c22] hover:bg-[#064e3b] text-[#86efac] text-[10px] font-mono border border-[#065f46] cursor-pointer"
              title="تقديم ثانية واحدة"
            >
              +1ث
            </button>
            <button
              type="button"
              onClick={() => handleSeekDelta(5)}
              className="px-2 py-1 rounded-lg bg-[#022c22] hover:bg-[#064e3b] text-[#86efac] text-[10px] font-mono border border-[#065f46] cursor-pointer"
              title="تقديم 5 ثوانٍ"
            >
              +5ث
            </button>
          </div>
        </div>

        {/* Teacher Ayah Alignment Controls: "يعينها" (Set Start / End from live audio) */}
        {!readOnlyControls && activeSegment && (
          <div className="pt-2 border-t border-[#065f46] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs text-[#86efac] flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#fbbf24]/20 text-[#fbbf24] font-black">
                {activeSegment.ayahNumber === 0 ? 'الاستعاذة والبسملة' : `الآية ${activeSegment.ayahNumber}`}
              </span>
              <span className="font-bold text-white">
                التوقيت الحالي للآية: {formatTimeMMSS(activeSegment.startTimeSeconds)} - {formatTimeMMSS(activeSegment.endTimeSeconds)}
              </span>
              <span className="text-[10px] text-amber-300">
                (المدة: {Math.max(0, Math.round(activeSegment.endTimeSeconds - activeSegment.startTimeSeconds))} ث)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Set Start Button */}
              <button
                type="button"
                onClick={handleSetStartFromCurrent}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow cursor-pointer border border-emerald-500/50"
                title="تعيين الوقت الحالي في الفيديو كبداية لهذه الآية"
              >
                <MapPin className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span>📍 تعيين البداية ({formatTimeMMSS(currentTime)})</span>
              </button>

              {/* Set End Button */}
              <button
                type="button"
                onClick={handleSetEndFromCurrent}
                className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-[#064e3b] font-black text-xs flex items-center gap-1 shadow cursor-pointer border border-amber-400"
                title="تعيين الوقت الحالي في الفيديو كنهاية لهذه الآية"
              >
                <Flag className="w-3.5 h-3.5 text-[#064e3b]" />
                <span>🏁 تعيين النهاية ({formatTimeMMSS(currentTime)})</span>
              </button>

              {/* Test play this segment strictly */}
              <button
                type="button"
                onClick={() => playAyahSegment(activeSegment)}
                className="px-2.5 py-1.5 rounded-lg bg-[#022c22] hover:bg-[#064e3b] text-[#fbbf24] font-bold text-xs flex items-center gap-1 border border-[#fbbf24]/50 cursor-pointer"
                title="تشغيل هذه الآية فقط من بدايتها لنهايتها للتحقق"
              >
                <Play className="w-3 h-3 fill-[#fbbf24]" />
                <span>استماع للآية فقط</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
