
import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Zap, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'spy' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    // Quick auto-dismiss for snappy feel
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 2500); 
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const config = {
    success: {
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      icon: <CheckCircle2 size={18} strokeWidth={3} />
    },
    error: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      icon: <AlertCircle size={18} strokeWidth={3} />
    },
    info: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      icon: <Info size={18} strokeWidth={3} />
    },
    spy: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      icon: <Zap size={18} strokeWidth={3} fill="currentColor" />
    },
    warning: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      icon: <AlertTriangle size={18} strokeWidth={3} />
    }
  };

  const style = config[toast.type];

  return (
    <div className="pointer-events-auto relative w-full max-w-sm rounded-2xl bg-[#0f172a] shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/10 overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300 group">
      {/* Glow Effect based on type */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.text.replace('text', 'bg')}`}></div>
      
      <div className="flex items-center gap-3 p-3 pl-4 pr-10">
        {/* Icon */}
        <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${style.bg} ${style.text}`}>
          {style.icon}
        </div>

        {/* Content */}
        <div className="flex flex-col min-w-0">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-white leading-tight">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
              {toast.message}
            </p>
          )}
        </div>
      </div>

      {/* Close Button - Vertically Centered */}
      <button
        onClick={() => onClose(toast.id)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-95"
      >
        <X size={14} strokeWidth={3} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{ toasts: ToastMessage[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-2 left-0 right-0 z-[100] flex flex-col items-center gap-2 p-4 pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={removeToast} />
      ))}
    </div>
  );
};
