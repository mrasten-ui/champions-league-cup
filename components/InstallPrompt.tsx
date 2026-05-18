import React, { useState, useEffect, useCallback } from 'react';
import { Smartphone, X, Share2, PlusSquare, CheckCircle2 } from 'lucide-react';

interface Props {
  isLoggedIn: boolean;
  onRegisterTrigger: (fn: (() => void) | null) => void;
}

export const InstallPrompt: React.FC<Props> = ({ isLoggedIn, onRegisterTrigger }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  const isMobile = isIOS || isAndroid;

  // Capture Android native install prompt
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = useCallback(() => {
    if (isIOS) {
      setShowIOSSheet(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    }
  }, [isIOS, deferredPrompt]);

  // Register the trigger fn with App.tsx so the profile menu can call it
  useEffect(() => {
    onRegisterTrigger(isMobile && !isStandalone ? handleInstallClick : null);
  }, [isMobile, isStandalone, handleInstallClick, onRegisterTrigger]);

  // Show banner 4 seconds after first login (once only)
  useEffect(() => {
    if (!isLoggedIn || !isMobile || isStandalone) return;
    if (localStorage.getItem('pwa_dismissed')) return;
    const t = setTimeout(() => setShowBanner(true), 4000);
    return () => clearTimeout(t);
  }, [isLoggedIn, isMobile, isStandalone]);

  // Auto-dismiss banner after 12 seconds
  useEffect(() => {
    if (!showBanner) return;
    const t = setTimeout(() => setShowBanner(false), 12000);
    return () => clearTimeout(t);
  }, [showBanner]);

  const dismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_dismissed', '1');
  };

  if (!isMobile || isStandalone) return null;

  return (
    <>
      {/* ── BOTTOM BANNER ── */}
      {showBanner && (
        <div className="fixed bottom-16 inset-x-0 z-[45] px-3 md:hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#0f2545] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
            <div className="bg-yellow-400/10 border border-yellow-400/20 p-2 rounded-xl shrink-0">
              <Smartphone size={20} className="text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-black uppercase tracking-tight leading-tight">Get the full experience</p>
              <p className="text-slate-400 text-[10px] leading-snug">Install the app on your phone</p>
            </div>
            <button
              onClick={handleInstallClick}
              className="bg-yellow-400 text-[#0f2545] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 active:scale-95 transition-transform"
            >
              {isIOS ? 'How?' : 'Install'}
            </button>
            <button onClick={dismiss} className="text-slate-500 hover:text-white shrink-0 transition-colors p-1">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── iOS INSTRUCTION SHEET ── */}
      {showIOSSheet && (
        <div className="fixed inset-0 z-[80] flex items-end md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowIOSSheet(false)} />
          <div className="relative w-full bg-[#0f2545] border-t border-white/10 rounded-t-3xl px-5 pt-5 pb-8 animate-in slide-in-from-bottom-4 duration-300 shadow-2xl">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-white font-black uppercase tracking-tight text-sm">Add to Home Screen</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">3 steps in Safari — takes 10 seconds</p>
              </div>
              <button onClick={() => setShowIOSSheet(false)} className="bg-white/10 p-1.5 rounded-full">
                <X size={14} className="text-white" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                {
                  n: '1',
                  icon: <Share2 size={18} className="text-blue-400" />,
                  bg: 'bg-blue-400/10 border-blue-400/20',
                  title: 'Tap the Share button',
                  desc: 'The box-with-arrow icon at the bottom of Safari',
                },
                {
                  n: '2',
                  icon: <PlusSquare size={18} className="text-emerald-400" />,
                  bg: 'bg-emerald-400/10 border-emerald-400/20',
                  title: 'Add to Home Screen',
                  desc: 'Scroll down in the share sheet and tap it',
                },
                {
                  n: '3',
                  icon: <CheckCircle2 size={18} className="text-yellow-400" />,
                  bg: 'bg-yellow-400/10 border-yellow-400/20',
                  title: 'Tap Add',
                  desc: 'Confirm with the "Add" button in the top right',
                },
              ].map(({ n, icon, bg, title, desc }) => (
                <div key={n} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center font-black text-white text-xs shrink-0">
                    {n}
                  </div>
                  <div className={`border ${bg} rounded-xl p-3 flex items-center gap-3 flex-1`}>
                    {icon}
                    <div>
                      <div className="text-white text-[11px] font-black uppercase tracking-tight">{title}</div>
                      <div className="text-slate-400 text-[10px] leading-snug">{desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
