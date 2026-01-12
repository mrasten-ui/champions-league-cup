
import React, { useState, useRef, useEffect } from 'react';
import { X, Volume2, VolumeX, AlertCircle, Loader2, PlayCircle } from 'lucide-react';

interface IntroVideoModalProps {
  isOpen: boolean;
  videoSrc: string;
  onClose: () => void;
}

export const IntroVideoModal: React.FC<IntroVideoModalProps> = ({ isOpen, videoSrc, onClose }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Validate source immediately
      if (!videoSrc) {
          console.warn("IntroVideoModal: No video source provided.");
          onClose(); // Fail silently
          return;
      }

      setHasError(false);
      setIsLoading(true);
      setShowPlayButton(false);
      
      const timer = setTimeout(() => {
        if (videoRef.current) {
            // Apply non-standard attributes safely via DOM API to avoid React prop issues
            videoRef.current.setAttribute('webkit-playsinline', 'true');
            videoRef.current.setAttribute('x5-playsinline', 'true');
            videoRef.current.setAttribute('playsinline', 'true');
            
            // Reset logic
            videoRef.current.currentTime = 0;
            
            // Attempt autoplay
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Autoplay prevented - show manual play button
                    console.warn("Auto-play prevented:", error.message || "Unknown error");
                    setIsLoading(false);
                    setShowPlayButton(true);
                });
            }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, videoSrc, onClose]);

  const handleManualPlay = () => {
      if (videoRef.current) {
          const promise = videoRef.current.play();
          if (promise !== undefined) {
              promise
                .then(() => setShowPlayButton(false))
                .catch(e => {
                    console.error("Manual play failed:", e.message || "The element has no supported sources.");
                    // If manual play fails, likely a source error, so close
                    onClose(); 
                });
          }
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden animate-in fade-in duration-500">
      
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-white/50 hover:text-white p-4 transition-colors"
      >
        <X size={32} />
      </button>

      <div className="relative w-full max-w-5xl px-0 sm:px-4 flex items-center justify-center h-full sm:h-auto">
        
        {isLoading && !hasError && !showPlayButton && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <Loader2 size={48} className="text-white/30 animate-spin" />
            </div>
        )}

        {showPlayButton && !hasError && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                <button 
                    onClick={handleManualPlay}
                    className="group relative flex flex-col items-center gap-4 animate-in zoom-in duration-300"
                >
                    <div className="bg-white/10 p-6 rounded-full backdrop-blur-md border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform hover:bg-white/20">
                        <PlayCircle size={64} className="text-white fill-white/10" />
                    </div>
                    <span className="text-white font-black tracking-widest uppercase text-sm drop-shadow-md bg-black/40 px-4 py-1 rounded-full border border-white/10">
                        Tap to Start
                    </span>
                </button>
            </div>
        )}

        {/* Removed Error UI - Silently failing now for cleaner UX if assets missing */}
        <video
            ref={videoRef}
            src={videoSrc}
            className={`w-full max-h-[85vh] object-contain bg-black shadow-2xl sm:rounded-xl transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            autoPlay
            playsInline
            preload="auto"
            muted={isMuted}
            onEnded={onClose}
            onWaiting={() => {
                if (!showPlayButton) setIsLoading(true);
            }}
            onCanPlay={() => {
                if (!showPlayButton) setIsLoading(false);
            }}
            onPlaying={() => {
                setIsLoading(false);
                setShowPlayButton(false);
            }}
            onError={(e) => {
                // If the video fails to load (404 etc), just close the modal so user proceeds to app
                console.warn(`Intro video failed to load (${videoSrc}). Closing modal.`);
                onClose();
            }}
        />

        {!hasError && !showPlayButton && !isLoading && (
            <div className="absolute bottom-8 right-8 z-30">
                <button
                   onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                   className="flex items-center justify-center gap-2 rounded-full font-bold uppercase tracking-widest transition-all bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 px-5 py-2.5 text-xs shadow-lg"
                >
                   {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                   <span>{isMuted ? "Unmute" : "Mute"}</span>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
