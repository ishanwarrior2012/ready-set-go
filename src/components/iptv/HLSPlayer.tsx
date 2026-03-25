import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, Cast } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HLSPlayerProps {
  src: string;
  title: string;
  onCast?: () => void;
}

export function HLSPlayer({ src, title, onCast }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setLoading(true);
    setError(null);
    setPlaying(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => {
          setPlaying(true);
          setLoading(false);
        }).catch(() => setLoading(false));
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Stream unavailable or offline');
          setLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play().then(() => { setPlaying(true); setLoading(false); }).catch(() => setLoading(false));
      }, { once: true });
    } else {
      setError('HLS not supported in this browser');
      setLoading(false);
    }

    return () => {
      hlsRef.current?.destroy();
    };
  }, [src]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
      />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-white/70 text-sm">Loading stream...</p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3 p-4">
          <div className="text-4xl">📡</div>
          <p className="text-red-400 font-semibold text-center">{error}</p>
          <p className="text-white/50 text-sm text-center">Try another channel or check your connection</p>
        </div>
      )}

      {/* Controls overlay */}
      {!loading && !error && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Title */}
          <div className="absolute top-4 left-4">
            <span className="text-white font-semibold text-sm bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
              🔴 LIVE — {title}
            </span>
          </div>
          {/* Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
              {playing ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7" />}
            </button>
            <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
              {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </button>
            <div className="flex-1" />
            {onCast && (
              <button onClick={onCast} className="text-white hover:text-primary transition-colors" title="Cast to TV">
                <Cast className="h-5 w-5" />
              </button>
            )}
            <button onClick={toggleFullscreen} className="text-white hover:text-primary transition-colors">
              {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
