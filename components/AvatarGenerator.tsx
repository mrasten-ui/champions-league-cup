import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertCircle, Check, Wand2, Loader2, Lock, User } from 'lucide-react';

interface AvatarGeneratorProps {
  onGenerate: (dataUri: string) => void;
  lang: any;
}

// --- CONFIGURATION ---
const MAX_ATTEMPTS = 3; 

// --- UTILITY: Compress Image ---
const compressImage = (base64Str: string, maxWidth = 256, quality = 0.85): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str.startsWith('data:') ? base64Str : `data:image/png;base64,${base64Str}`; 
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(base64Str); return; }

      canvas.width = maxWidth;
      canvas.height = maxWidth;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, maxWidth, maxWidth);
      ctx.drawImage(img, 0, 0, maxWidth, maxWidth);
      
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

export const AvatarGenerator: React.FC<AvatarGeneratorProps> = ({ onGenerate, lang }) => {
  const [prompt, setPrompt] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem('rasten_cup_avatar_attempts');
    if (saved) {
      setAttempts(parseInt(saved, 10));
    }
  }, []);

  const incrementAttempts = () => {
    const newCount = attempts + 1;
    setAttempts(newCount);
    localStorage.setItem('rasten_cup_avatar_attempts', newCount.toString());
  };

  const handleGenerate = async () => {
    if (attempts >= MAX_ATTEMPTS) {
        setError("You have used all your free generations.");
        return;
    }

    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      setError("System Error: OpenAI Key missing.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          // The "Pixar/Animation" Prompt with Gender Injection
          prompt: `A square 3D animated character avatar of a ${gender} football fan. Description: ${prompt}. STYLE: Disney Pixar movie poster style, high quality 3D render. VIBE: Cute, expressive, vibrant colors, smooth textures (no realistic skin pores). LIGHTING: Soft cinematic stadium lighting. BACKGROUND: Blurred colorful stadium lights.`,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json", 
          quality: "standard"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.code === 'insufficient_quota') {
            throw new Error("System is out of credits. Please contact Morten.");
        }
        throw new Error(data.error?.message || "Generation Failed");
      }

      const rawBase64 = data.data[0].b64_json;
      const tinyImage = await compressImage(rawBase64);
      setGeneratedImage(tinyImage);
      
      incrementAttempts();

    } catch (err: any) {
      console.error("AI Error:", err);
      setError(err.message || "Failed to generate image.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (generatedImage) {
      onGenerate(generatedImage);
    }
  };

  const remaining = MAX_ATTEMPTS - attempts;

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/10 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" />
                <span className="text-[10px] font-black text-purple-200 uppercase tracking-widest">
                    AI Identity Studio
                </span>
            </div>
            
            {/* COUNTER: Only visible AFTER the first attempt (attempts > 0) */}
            {attempts > 0 && (
                <div className={`text-[10px] font-bold px-2 py-1 rounded-full animate-in fade-in zoom-in duration-300 ${remaining === 0 ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    {remaining} / {MAX_ATTEMPTS} Credits
                </div>
            )}
        </div>

        {/* Gender Selection */}
        <div className="flex gap-2">
            <button
                onClick={() => setGender('male')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${
                    gender === 'male' 
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg scale-[1.02]' 
                    : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800'
                }`}
            >
                Man
            </button>
            <button
                onClick={() => setGender('female')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${
                    gender === 'female' 
                    ? 'bg-pink-600 border-pink-400 text-white shadow-lg scale-[1.02]' 
                    : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800'
                }`}
            >
                Woman
            </button>
        </div>
        
        {/* Input */}
        <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={remaining === 0 || loading}
            placeholder={remaining > 0 ? `Describe the ${gender} fan (e.g. glasses, beard, red scarf)...` : "You have used your free credits."}
            rows={2}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            onKeyDown={(e) => e.key === 'Enter' && remaining > 0 && !loading && handleGenerate()}
        />
        
        <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || remaining === 0}
            className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                remaining === 0 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white'
            }`}
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : remaining === 0 ? <Lock size={14} /> : <Wand2 size={14} />}
            {loading ? "Animating..." : remaining === 0 ? "Limit Reached" : "Generate Avatar"}
        </button>
        
        {error && (
          <div className="mt-2 text-[10px] text-red-400 flex items-start gap-1 font-medium bg-red-900/20 p-2 rounded border border-red-500/20">
            <AlertCircle size={12} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Preview */}
      {generatedImage && (
        <div className="flex flex-col items-center gap-4 animate-in zoom-in slide-in-from-bottom-2 duration-500">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative w-32 h-32 rounded-full border-4 border-slate-900 overflow-hidden bg-white shadow-2xl">
                    <img 
                        src={generatedImage} 
                        className="w-full h-full object-cover" 
                        alt="Generated Avatar" 
                    />
                </div>
            </div>

            <button
              onClick={handleConfirm}
              className="w-full py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all"
            >
              <Check size={16} />
              {lang?.useAvatar || "Use This Avatar"}
            </button>
            <div className="text-[9px] text-slate-500 font-medium opacity-50">
                Powered by DALL·E 3
            </div>
        </div>
      )}
    </div>
  );
};