import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Wand2, Bug, LayoutGrid, Check, User } from 'lucide-react';
import { supabase } from '../supabase';

interface AvatarGeneratorProps {
  onGenerate: (url: string) => void;
  lang: any;
  menAvatars: string[];
  womenAvatars: string[];
  usedAvatars?: string[];
}

// UTILITY: Base64 -> Blob
const base64ToBlob = async (base64: string): Promise<Blob> => {
  const res = await fetch(`data:image/png;base64,${base64}`);
  return await res.blob();
};

export const AvatarGenerator: React.FC<AvatarGeneratorProps> = ({ 
  onGenerate, 
  lang, 
  menAvatars = [], 
  womenAvatars = [], 
  usedAvatars = [] 
}) => {
  const [viewMode, setViewMode] = useState<'ai' | 'grid'>('ai');
  const [prompt, setPrompt] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Auto-select random on load
  useEffect(() => {
    const all = [...menAvatars, ...womenAvatars];
    if (all.length === 0) return;
    
    // Try to pick one that isn't used
    const available = all.filter(a => !usedAvatars.includes(a));
    const pool = available.length > 0 ? available : all;
    
    const randomPick = pool[Math.floor(Math.random() * pool.length)];
    if (randomPick) handleSelectPreset(randomPick);
  }, [menAvatars, womenAvatars]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setGeneratedPreview(null);
    setSelectedPreset(null);

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setError("Missing API Key.");
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
          prompt: `A professional 3D stylized avatar of a ${gender} football manager. 
                   KEY REQUIREMENTS: Subject looking DIRECTLY at the camera (front-facing). 
                   COMPOSITION: Centered head-and-shoulders portrait with solid vibrant background extending to all edges. 
                   Ensure the subject is perfectly centered so it fits in a circle crop without cutting off edges.
                   DETAILS: ${prompt}. 
                   STYLE: High-fidelity Pixar/Disney style, studio lighting, cute but professional.`,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json", 
          quality: "standard"
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "OpenAI Error");

      const rawBase64 = data.data[0].b64_json;
      const base64Uri = `data:image/png;base64,${rawBase64}`;
      
      // Attempt upload
      try {
          const blob = await base64ToBlob(rawBase64);
          const fileName = `ai_avatar_${Date.now()}.png`;

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, blob, { contentType: 'image/png', upsert: true });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

          setGeneratedPreview(urlData.publicUrl);
          onGenerate(urlData.publicUrl);

      } catch (uploadErr) {
          console.warn("Upload failed (likely anon), using Base64 fallback");
          setGeneratedPreview(base64Uri);
          onGenerate(base64Uri);
      }

    } catch (err: any) {
      console.error("Gen Error:", err);
      setError(err.message || "Failed to generate.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (url: string) => {
    setSelectedPreset(url);
    setGeneratedPreview(null);
    onGenerate(url);
  };

  const currentDisplay = generatedPreview || selectedPreset;

  return (
    <div className="space-y-6">
      {/* 1. BIG PREVIEW AREA */}
      <div className="flex justify-center">
          <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-slate-800 border-4 border-white/10 shadow-2xl flex items-center justify-center overflow-hidden shrink-0 transition-all duration-500 hover:border-blue-500/50">
                  {currentDisplay ? (
                      <img src={currentDisplay} className="w-full h-full object-cover animate-in zoom-in duration-500" />
                  ) : (
                      <User size={48} className="text-slate-600" />
                  )}
                  
                  {loading && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                          <RefreshCw size={32} className="text-blue-400 animate-spin" />
                      </div>
                  )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg border border-white/20">
                  {viewMode === 'ai' ? <Sparkles size={16} /> : <LayoutGrid size={16} />}
              </div>
          </div>
      </div>

      {/* 2. MODE SWITCHER */}
      <div className="bg-black/20 p-1 rounded-xl border border-white/5 flex gap-1">
          <button 
              type="button" 
              onClick={() => setViewMode('ai')} 
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'ai' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
              <Sparkles size={14} /> AI Studio
          </button>
          <button 
              type="button" 
              onClick={() => setViewMode('grid')} 
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
              <LayoutGrid size={14} /> Presets
          </button>
      </div>

      {/* 3. AI STUDIO CONTROLS */}
      {viewMode === 'ai' && (
        <div className="animate-in fade-in zoom-in duration-300 space-y-4">
             {/* Gender Toggles */}
             <div className="flex justify-center gap-2">
                <button 
                    type="button" 
                    onClick={() => setGender('Male')} 
                    className={`px-6 py-2 text-xs font-bold uppercase rounded-full border transition-all ${gender === 'Male' ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'border-white/10 text-slate-500 hover:border-white/30'}`}
                >
                    {lang?.genderMan || "Male"}
                </button>
                <button 
                    type="button" 
                    onClick={() => setGender('Female')} 
                    className={`px-6 py-2 text-xs font-bold uppercase rounded-full border transition-all ${gender === 'Female' ? 'bg-pink-600/20 border-pink-500 text-pink-400 shadow-[0_0_15px_rgba(219,39,119,0.3)]' : 'border-white/10 text-slate-500 hover:border-white/30'}`}
                >
                    {lang?.genderWoman || "Female"}
                </button>
             </div>

             {/* Input & Action Button */}
             <div className="space-y-3">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={lang?.aiPlaceholder || "e.g. Wearing a suit..."}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-center"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault(); 
                            handleGenerate();
                        }
                    }}
                />
                
                {/* NEW: HUGE VISIBLE BUTTON */}
                <button
                    type="button" 
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg border border-white/10 font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <RefreshCw size={20} className="animate-spin" /> : <Wand2 size={20} />}
                    {loading ? "Creating Identity..." : "Generate Avatar"}
                </button>
            </div>
            
            {error && <div className="text-[10px] text-red-400 bg-red-900/20 p-3 rounded-xl border border-red-500/20 flex items-center justify-center gap-2"><Bug size={14}/>{error}</div>}
        </div>
      )}

      {/* 4. GRID MODE */}
      {viewMode === 'grid' && (
        <div className="animate-in fade-in zoom-in duration-300 space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider sticky top-0 bg-[#05101c] py-1 z-10">{lang?.genderMan || "Male"}</div>
                <div className="grid grid-cols-5 gap-2">
                    {menAvatars.slice(0, 10).map((url, i) => (
                        <button 
                            type="button"
                            key={`m-${i}`} 
                            onClick={() => handleSelectPreset(url)} 
                            className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedPreset === url ? 'border-green-500 scale-105 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'border-white/5 hover:border-white/30 grayscale hover:grayscale-0'}`}
                        >
                            <img src={url} className="w-full h-full object-cover" />
                            {selectedPreset === url && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center"><Check size={20} className="text-white drop-shadow-md"/></div>}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider sticky top-0 bg-[#05101c] py-1 z-10">{lang?.genderWoman || "Female"}</div>
                <div className="grid grid-cols-5 gap-2">
                    {womenAvatars.slice(0, 10).map((url, i) => (
                        <button 
                            type="button" 
                            key={`w-${i}`} 
                            onClick={() => handleSelectPreset(url)} 
                            className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedPreset === url ? 'border-green-500 scale-105 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'border-white/5 hover:border-white/30 grayscale hover:grayscale-0'}`}
                        >
                            <img src={url} className="w-full h-full object-cover" />
                            {selectedPreset === url && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center"><Check size={20} className="text-white drop-shadow-md"/></div>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};