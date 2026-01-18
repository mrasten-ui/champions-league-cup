import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Wand2, Bug, LayoutGrid, Check, User, Shuffle } from 'lucide-react';
import { supabase } from '../supabase';

interface AvatarGeneratorProps {
  onGenerate: (url: string) => void;
  lang: any;
  menAvatars: string[];
  womenAvatars: string[];
  usedAvatars?: string[];
  currentAvatar?: string;
}

// UTILITY: Base64 -> Blob (For AI Uploads)
const base64ToBlob = async (base64: string): Promise<Blob> => {
  const res = await fetch(`data:image/png;base64,${base64}`);
  return await res.blob();
};

export const AvatarGenerator: React.FC<AvatarGeneratorProps> = ({ 
  onGenerate, 
  lang, 
  menAvatars = [], 
  womenAvatars = [], 
  usedAvatars = [],
  currentAvatar 
}) => {
  const [gender, setGender] = useState<'Male' | 'Female'>('Male'); 
  const [mode, setMode] = useState<'AI' | 'Presets'>('AI');
  
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // The avatar we are currently showing/using
  const [activeAvatar, setActiveAvatar] = useState<string | null>(currentAvatar || null);

  // Helper: Get available presets for current gender
  const getPool = (g: 'Male' | 'Female') => {
      const source = g === 'Male' ? menAvatars : womenAvatars;
      const unused = source.filter(url => !usedAvatars.includes(url));
      return unused.length > 0 ? unused : source; // Fallback to all if everything is used
  };

  // Helper: Pick a random one and assign it (The "Auto-Assign" Logic)
  const assignRandomPreset = (g: 'Male' | 'Female') => {
      const pool = getPool(g);
      if (pool.length > 0) {
          const randomPick = pool[Math.floor(Math.random() * pool.length)];
          setActiveAvatar(randomPick);
          onGenerate(randomPick); // Notify parent immediately
      }
  };

  // 1. On Mount: If no current avatar (Signup), auto-assign a Male one to start
  useEffect(() => {
      if (!currentAvatar && menAvatars.length > 0) {
          assignRandomPreset('Male');
      }
  }, []);

  // 2. Handle Gender Switch: Auto-assign a new unused avatar of that gender
  const handleGenderSwitch = (newGender: 'Male' | 'Female') => {
      if (gender === newGender) return;
      setGender(newGender);
      // When switching gender, we automatically assign a fresh unused preset
      // This satisfies: "if you do not pick one, one unused will be assigned"
      assignRandomPreset(newGender);
  };

  const handleAiGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

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

          setActiveAvatar(urlData.publicUrl);
          onGenerate(urlData.publicUrl);

      } catch (uploadErr) {
          // Fallback: Use Base64 (App.tsx handles saving this later)
          setActiveAvatar(base64Uri);
          onGenerate(base64Uri);
      }

    } catch (err: any) {
      console.error("Gen Error:", err);
      setError(err.message || "Failed to generate.");
    } finally {
      setLoading(false);
    }
  };

  const currentPool = getPool(gender);

  return (
    <div className="space-y-6">
      
      {/* 1. GENDER SELECTION (Top Level) */}
      <div className="flex justify-center gap-3">
          <button 
              type="button"
              onClick={() => handleGenderSwitch('Male')} 
              className={`px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${gender === 'Male' ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400/50' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
              {lang?.genderMan || "Male"}
          </button>
          <button 
              type="button"
              onClick={() => handleGenderSwitch('Female')} 
              className={`px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${gender === 'Female' ? 'bg-pink-600 text-white shadow-lg ring-2 ring-pink-400/50' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
              {lang?.genderWoman || "Female"}
          </button>
      </div>

      {/* PREVIEW + MODE TOGGLE */}
      <div className="flex flex-col items-center gap-6">
          {/* Big Preview Circle */}
          <div className="relative group">
              <div className="w-36 h-36 rounded-full bg-[#0f2545] border-4 border-white/10 shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
                  {activeAvatar ? (
                      <img src={activeAvatar} className="w-full h-full object-cover animate-in fade-in zoom-in duration-300" />
                  ) : (
                      <User size={48} className="text-slate-600" />
                  )}
                  
                  {loading && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                          <RefreshCw size={32} className="text-blue-400 animate-spin" />
                      </div>
                  )}
              </div>
              {/* Badge showing source */}
              <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg border border-white/20 ${mode === 'AI' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                  {mode}
              </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-black/30 p-1 rounded-xl border border-white/10">
              <button 
                  type="button"
                  onClick={() => setMode('AI')} 
                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'AI' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                  <Sparkles size={14} /> AI Studio
              </button>
              <button 
                  type="button"
                  onClick={() => setMode('Presets')} 
                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'Presets' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                  <LayoutGrid size={14} /> Presets
              </button>
          </div>
      </div>

      {/* CONTENT AREA */}
      <div className="bg-black/20 rounded-2xl p-4 border border-white/5 min-h-[140px]">
          
          {/* A) AI STUDIO MODE */}
          {mode === 'AI' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="text-center mb-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Create Unique Identity</h4>
                      <p className="text-[10px] text-slate-400">Describe your manager look below.</p>
                  </div>
                  
                  <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={lang?.aiPlaceholder || "e.g. Wearing a suit, glasses..."}
                      className="w-full bg-[#05101c] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all text-center"
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                              e.preventDefault(); 
                              handleAiGenerate();
                          }
                      }}
                  />
                  
                  <button
                      type="button" 
                      onClick={handleAiGenerate}
                      disabled={loading || !prompt.trim()}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg border border-white/10 font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {loading ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
                      {loading ? "Generating..." : "Generate Magic Avatar"}
                  </button>
                  
                  {error && <div className="text-[10px] text-red-300 bg-red-500/10 p-2 rounded text-center border border-red-500/20">{error}</div>}
              </div>
          )}

          {/* B) PRESETS MODE */}
          {mode === 'Presets' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center mb-3 px-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available {gender} Avatars</span>
                      <button 
                          type="button" 
                          onClick={() => assignRandomPreset(gender)} 
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider"
                      >
                          <Shuffle size={12} /> Pick Random
                      </button>
                  </div>

                  <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {currentPool.map((url, i) => (
                          <button 
                              type="button"
                              key={`${gender}-${i}`} 
                              onClick={() => { setActiveAvatar(url); onGenerate(url); }} 
                              className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeAvatar === url ? 'border-green-500 scale-105 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'border-white/10 hover:border-white/30 grayscale hover:grayscale-0'}`}
                          >
                              <img src={url} className="w-full h-full object-cover" />
                              {activeAvatar === url && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center"><Check size={20} className="text-white drop-shadow-md"/></div>}
                          </button>
                      ))}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};