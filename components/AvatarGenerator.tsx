import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Sparkles, RefreshCw, Wand2, Bug, User, Check } from 'lucide-react';

interface AvatarGeneratorProps {
  onGenerate: (dataUri: string) => void;
  lang: any;
  /** * Pass your LOCAL images here (e.g. ["/assets/avatar1.png", "/assets/uk-flag.png"]) 
   * If this is empty, the bottom grid simply won't show.
   */
  defaultAvatars?: string[];
}

// UTILITY: High-Quality Compressor (320px = Crisp, ~30KB)
const compressAndRasterize = (sourceStr: string, size = 320): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    
    // Handle SVG code vs URL
    if (sourceStr.trim().startsWith('<svg')) {
      const base64Svg = btoa(unescape(encodeURIComponent(sourceStr)));
      img.src = `data:image/svg+xml;base64,${base64Svg}`;
    } else {
      img.src = sourceStr;
    }
    
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(sourceStr); return; }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => resolve(sourceStr);
  });
};

const MODEL_CANDIDATES = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-pro"];

export const AvatarGenerator: React.FC<AvatarGeneratorProps> = ({ 
  onGenerate, 
  lang, 
  defaultAvatars = [] // Default to empty if nothing passed
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setGeneratedPreview(null);
    setSelectedPreset(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setError("Missing API Key.");
      setLoading(false);
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const fullPrompt = `
      ROLE: Expert Vector Artist.
      TASK: Create a square avatar for: "${prompt}".
      STYLE: 
      - Professional E-Sports Mascot style.
      - Use <radialGradient> for 3D depth.
      - Strong, bold outlines.
      - Vivid colors (no flat pastels).
      OUTPUT: ONLY raw <svg> code. viewBox="0 0 256 256".
    `;

    let success = false;
    for (const modelName of MODEL_CANDIDATES) {
      if (success) break;
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(fullPrompt);
        const text = result.response.text().replace(/```xml|```svg|```/g, '').trim();
        
        const start = text.indexOf('<svg');
        const end = text.indexOf('</svg>');

        if (start !== -1 && end !== -1) {
           const rawSvg = text.substring(start, end + 6);
           const processedImage = await compressAndRasterize(rawSvg, 320);
           setGeneratedPreview(processedImage);
           success = true;
           onGenerate(processedImage);
        }
      } catch (e) { console.warn(e); }
    }

    if (!success) setError("Could not generate. Try again.");
    setLoading(false);
  };

  const handleSelectPreset = async (url: string) => {
    setSelectedPreset(url);
    setGeneratedPreview(null);
    // Compress your local assets too so everything saved to DB is uniform size
    const processed = await compressAndRasterize(url, 320);
    onGenerate(processed);
  };

  return (
    <div className="space-y-6">
      {/* 1. AI GENERATOR (Always Visible) */}
      <div className="bg-gradient-to-b from-slate-900/80 to-slate-900/40 p-5 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-purple-400 animate-pulse" />
            <span className="text-xs font-black text-purple-200 uppercase tracking-widest">
                {lang?.genAvatarTitle || "Design Your Identity"}
            </span>
        </div>
        
        <div className="flex gap-2 mb-4">
            <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Tactical genius in a suit..."
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <RefreshCw size={20} className="animate-spin" /> : <Wand2 size={20} />}
            </button>
        </div>
        
        {error && (
          <div className="mb-4 text-[10px] text-red-400 flex items-center gap-1 bg-red-900/20 p-2 rounded border border-red-500/20">
            <Bug size={12} /> {error}
          </div>
        )}

        {generatedPreview && (
            <div className="flex flex-col items-center animate-in zoom-in duration-300">
                <div className="relative w-32 h-32 rounded-full border-4 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] overflow-hidden bg-white mb-2">
                    <img src={generatedPreview} className="w-full h-full object-cover" alt="AI Generated" />
                    <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-md">
                        <Check size={12} strokeWidth={4} />
                    </div>
                </div>
                <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">AI Identity Applied</span>
            </div>
        )}
      </div>

      {/* 2. GRID SECTION (Only shows if you pass images) */}
      {defaultAvatars.length > 0 && (
        <>
            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    OR CHOOSE A CLASSIC
                </span>
                <div className="flex-grow border-t border-white/10"></div>
            </div>

            <div className="grid grid-cols-5 gap-3">
                {defaultAvatars.map((url, index) => {
                    const isSelected = selectedPreset === url;
                    return (
                        <button
                            key={index}
                            onClick={() => handleSelectPreset(url)}
                            className={`relative group aspect-square rounded-full overflow-hidden border-2 transition-all duration-300 ${
                                isSelected 
                                ? 'border-green-500 scale-110 shadow-[0_0_15px_rgba(34,197,94,0.6)]' 
                                : 'border-white/10 hover:border-white/40 hover:scale-105'
                            }`}
                        >
                            <img src={url} alt={`Preset ${index}`} className="w-full h-full object-cover bg-slate-800" />
                            
                            {!isSelected && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <User size={14} className="text-white" />
                                </div>
                            )}
                            
                            {isSelected && (
                                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                    <Check size={16} className="text-white drop-shadow-md" strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </>
      )}
    </div>
  );
};