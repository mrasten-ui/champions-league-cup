import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Sparkles, RefreshCw, Wand2, Bug, User, Check, LayoutGrid } from 'lucide-react';

interface AvatarGeneratorProps {
  onGenerate: (dataUri: string) => void;
  lang: any;
  /** List of avatars ALREADY assigned to other players (to avoid duplicates) */
  usedAvatars?: string[];
  /** File paths for the 5 Men avatars */
  menAvatars: string[];
  /** File paths for the 5 Women avatars */
  womenAvatars: string[];
}

// 1. UTILITY: High-Quality Compressor
const compressAndRasterize = (sourceStr: string, size = 320): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    
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
  usedAvatars = [],
  menAvatars = [],
  womenAvatars = []
}) => {
  // VIEW STATE: 'ai' is default, can toggle to 'grid'
  const [viewMode, setViewMode] = useState<'ai' | 'grid'>('ai');
  
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // --- SMART AUTO-ASSIGN (Runs once on mount) ---
  useEffect(() => {
    // Combine all available presets
    const allPresets = [...menAvatars, ...womenAvatars];
    if (allPresets.length === 0) return;

    // Filter out ones that are already taken by other users
    const available = allPresets.filter(avatar => !usedAvatars.includes(avatar));

    // If all are taken, just fallback to reusing one. Otherwise pick unique.
    const pool = available.length > 0 ? available : allPresets;
    
    // Pick random
    const randomPick = pool[Math.floor(Math.random() * pool.length)];
    
    // Set it immediately so "Green Circle" never appears
    handleSelectPreset(randomPick);
  }, []); // Empty dependency array = run once on load

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
    // FORCE AI TO USE 3D GRADIENTS TO AVOID FLAT LOOK
    const fullPrompt = `
      ROLE: Expert 3D Avatar Designer.
      TASK: Create a square avatar for: "${prompt}".
      STYLE: 
      - Pixar-style 3D character.
      - Use <radialGradient> on faces to create roundness/depth.
      - High contrast, vivid colors.
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
    // Compress ensures DB consistency
    const processed = await compressAndRasterize(url, 320);
    onGenerate(processed);
  };

  return (
    <div className="space-y-4">
      {/* HEADER & TOGGLES */}
      <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            {viewMode === 'ai' ? (
                <Sparkles size={16} className="text-purple-400" />
            ) : (
                <LayoutGrid size={16} className="text-blue-400" />
            )}
            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">
                {viewMode === 'ai' ? (lang?.genAvatarTitle || "AI Studio") : "Select Avatar"}
            </span>
          </div>

          {/* VIEW SWITCHER BUTTONS */}
          <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setViewMode('ai')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'ai' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                title="AI Generator"
              >
                  <Wand2 size={14} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                title="Preset Grid"
              >
                  <LayoutGrid size={14} />
              </button>
          </div>
      </div>

      {/* --- VIEW 1: AI GENERATOR (Default) --- */}
      {viewMode === 'ai' && (
        <div className="bg-gradient-to-b from-slate-900/80 to-slate-900/40 p-5 rounded-2xl border border-white/10 shadow-xl animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Tactical genius..."
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
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
                    <div className="relative w-28 h-28 rounded-full border-4 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] overflow-hidden bg-white mb-2">
                        <img src={generatedPreview} className="w-full h-full object-cover" alt="AI Generated" />
                        <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-md">
                            <Check size={12} strokeWidth={4} />
                        </div>
                    </div>
                    <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">AI Applied</span>
                </div>
            )}
        </div>
      )}

      {/* --- VIEW 2: PRESET GRID (Secondary) --- */}
      {viewMode === 'grid' && (
        <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
                
                {/* ROW 1: MEN (5 Items) */}
                <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Managers (Men)</span>
                    <div className="grid grid-cols-5 gap-2">
                        {menAvatars.slice(0, 5).map((url, index) => { // Force limit to 5 just in case
                            const isSelected = selectedPreset === url;
                            return (
                                <button
                                    key={`m-${index}`}
                                    onClick={() => handleSelectPreset(url)}
                                    className={`relative group aspect-square rounded-full overflow-hidden border-2 transition-all ${isSelected ? 'border-green-500 scale-105' : 'border-white/10 hover:border-white/30'}`}
                                >
                                    <img src={url} className="w-full h-full object-cover" />
                                    {isSelected && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center"><Check size={14} className="text-white"/></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ROW 2: WOMEN (5 Items) */}
                <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Managers (Women)</span>
                    <div className="grid grid-cols-5 gap-2">
                        {womenAvatars.slice(0, 5).map((url, index) => {
                            const isSelected = selectedPreset === url;
                            return (
                                <button
                                    key={`w-${index}`}
                                    onClick={() => handleSelectPreset(url)}
                                    className={`relative group aspect-square rounded-full overflow-hidden border-2 transition-all ${isSelected ? 'border-green-500 scale-105' : 'border-white/10 hover:border-white/30'}`}
                                >
                                    <img src={url} className="w-full h-full object-cover" />
                                    {isSelected && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center"><Check size={14} className="text-white"/></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
      )}
    </div>
  );
};