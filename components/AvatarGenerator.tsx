import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, Wand2, Bug, LayoutGrid, Check, User, Shuffle, Upload } from 'lucide-react';
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
  const [mode, setMode] = useState<'AI' | 'Presets' | 'Upload'>('AI');
  
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setLoading(true);
    setError(null);

    // Show instant preview
    const previewUrl = URL.createObjectURL(file);
    setUploadPreview(previewUrl);

    try {
      // Resize to 512x512 via canvas
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      const size = Math.min(bitmap.width, bitmap.height);
      const sx = (bitmap.width - size) / 2;
      const sy = (bitmap.height - size) / 2;
      ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, 512, 512);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas conversion failed')), 'image/png')
      );

      const fileName = `upload_avatar_${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { contentType: 'image/png', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setActiveAvatar(urlData.publicUrl);
      onGenerate(urlData.publicUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };
  
  // The avatar we are currently showing/using
  const [activeAvatar, setActiveAvatar] = useState<string | null>(currentAvatar || null);

  // Helper: Get available presets for current gender
  const getPool = (g: 'Male' | 'Female') => {
      const source = g === 'Male' ? menAvatars : womenAvatars;
      const unused = source.filter(url => !usedAvatars.includes(url));
      return unused.length > 0 ? unused : source; 
  };

  // Helper: Pick a random one and assign it
  const assignRandomPreset = (g: 'Male' | 'Female') => {
      const pool = getPool(g);
      if (pool.length > 0) {
          const randomPick = pool[Math.floor(Math.random() * pool.length)];
          setActiveAvatar(randomPick);
          onGenerate(randomPick); 
      }
  };

  // 1. Auto-assign on load once avatars are available
  useEffect(() => {
      // Only if we don't have a current avatar (e.g. fresh signup)
      // AND we haven't picked one yet
      // AND the lists are actually populated
      if (!currentAvatar && !activeAvatar && menAvatars.length > 0) {
          assignRandomPreset('Male');
      }
  }, [menAvatars, womenAvatars, currentAvatar]); 

  // 2. Handle Gender Switch: Auto-assign a new unused avatar of that gender
  const handleGenderSwitch = (newGender: 'Male' | 'Female') => {
      if (gender === newGender) return;
      setGender(newGender);
      // Auto-assign immediately so they never have the "wrong gender" avatar
      assignRandomPreset(newGender);
  };

  const handleAiGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    // NOTE: We no longer check for VITE_OPENAI_API_KEY here.
    // Security is handled by the backend function.

    try {
      // --- SECURE BACKEND CALL ---
      const { data, error } = await supabase.functions.invoke('generate-avatar', {
        body: { prompt, gender }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Extract Base64 from the backend response
      const rawBase64 = data.data[0].b64_json;
      const base64Uri = `data:image/png;base64,${rawBase64}`;
      
      // Attempt upload to storage
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
          // Fallback: Use Base64 directly if upload fails
          console.warn("Upload failed, using Base64 fallback", uploadErr);
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
              <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg border border-white/20 ${mode === 'AI' ? 'bg-purple-600' : mode === 'Upload' ? 'bg-green-600' : 'bg-blue-600'}`}>
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
              <button
                  type="button"
                  onClick={() => setMode('Upload')}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'Upload' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                  <Upload size={14} /> Upload
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
                      placeholder={lang?.genAvatarPlaceholder || "e.g. Wearing a yellow jersey, face paint, sunglasses..."}
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

          {/* B) UPLOAD MODE */}
          {mode === 'Upload' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="text-center mb-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Upload Your Own</h4>
                      <p className="text-[10px] text-slate-400">Pick any photo from your device.</p>
                  </div>

                  <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                  />

                  {uploadPreview && !loading && (
                      <div className="flex justify-center">
                          <img src={uploadPreview} className="w-20 h-20 rounded-full object-cover border-2 border-green-500/50" alt="preview" />
                      </div>
                  )}

                  <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl shadow-lg border border-white/10 font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {loading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                      {loading ? 'Uploading...' : 'Choose Photo'}
                  </button>

                  {error && <div className="text-[10px] text-red-300 bg-red-500/10 p-2 rounded text-center border border-red-500/20">{error}</div>}
              </div>
          )}

          {/* C) PRESETS MODE */}
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