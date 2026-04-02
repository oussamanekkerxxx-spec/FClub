import { useState, useRef, useEffect } from 'react';
import { PlayCircle, PauseCircle } from 'lucide-react';

export default function AudioPlayerBubble({ url, isOwn, bubbleRadius }: { url: string; isOwn: boolean; bubbleRadius?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate random bar heights for a fake waveform aesthetic
  const [waveform] = useState(() => Array.from({ length: 28 }, () => Math.floor(Math.random() * 70) + 20));

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.preload = 'metadata';

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const onAudioEnd = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onAudioEnd);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onAudioEnd);
      audio.pause();
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 shadow-sm min-w-[200px] sm:min-w-[260px] ${bubbleRadius || 'rounded-2xl'} ${isOwn ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white' : 'bg-white text-navy border border-[var(--color-border)]'}`}>
      <button 
        onClick={togglePlay}
        className={`p-1.5 rounded-full flex-shrink-0 ${isOwn ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'} transition-colors justify-center flex items-center shadow-sm relative group outline-none`}
      >
        {isPlaying ? <PauseCircle className="w-6 h-6 animate-pulse" /> : <PlayCircle className="w-6 h-6 group-hover:scale-105 transition-transform" />}
      </button>
      
      <div className="flex-1 flex flex-col justify-center">
        {/* Waveform Visualization */}
        <div className="flex items-center gap-[2px] h-6 w-full cursor-pointer relative" 
          onClick={(e) => {
            if (!audioRef.current || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            audioRef.current.currentTime = percentage * duration;
          }}
        >
          {/* Inactive Wave (Background) */}
          <div className="absolute inset-0 flex items-center gap-[2px] z-0">
             {waveform.map((h, i) => (
                <div key={i} className={`flex-1 rounded-full ${isOwn ? 'bg-white/30' : 'bg-purple-500/20'} transition-all`} style={{ height: `${h}%` }} />
             ))}
          </div>
          
          {/* Active Wave (Foreground clipping via clipPath/width) */}
          <div className="absolute inset-y-0 left-0 flex items-center z-10 overflow-hidden transition-all duration-100" style={{ width: `${progress}%` }}>
             <div className="absolute inset-0 flex items-center gap-[2px]" style={{ width: '100%', minWidth: '100%' }}>
                {waveform.map((h, i) => (
                  // To ensure it doesn't compress the children when width collapses, we need to apply absolute static sizing to the parent container,
                  // or just render the exact same number of blocks and use overflow-hidden on the sliding container.
                   <div key={i} className={`rounded-full ${isOwn ? 'bg-white' : 'bg-purple-600'} transition-all shrink-0`} style={{ height: `${h}%`, width: 'calc(100% / 28 - 2px)' }} />
                ))}
             </div>
          </div>

          <div className="absolute inset-0 flex items-center gap-[2px] z-20 pointer-events-none">
             {waveform.map((h, i) => (
                <div key={i} className={`shrink-0 rounded-full ${isOwn ? 'bg-white' : 'bg-purple-600'} transition-all opacity-0`} style={{ height: `${h}%`, width: 'calc(100% / 28 - 2px)' }} />
             ))}
          </div>
        </div>

        <div className={`text-[10px] mt-1.5 font-medium flex justify-between ${isOwn ? 'text-white/80' : 'text-[var(--color-text-muted)]'}`}>
          <span>Voice Message</span>
          <span className="font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
