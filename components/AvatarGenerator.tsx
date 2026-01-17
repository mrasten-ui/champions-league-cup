import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Wand2, Bug, LayoutGrid, Check, User, UploadCloud } from 'lucide-react';
import { supabase } from '../supabase';

interface AvatarGeneratorProps {
  onGenerate: (url: string) => void;
  lang: any;
  menAvatars: string[];
  womenAvatars: string[];
  usedAvatars?: string[];
}

// UTILITY: Base64 -> Blob (for uploading)
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Smart Auto-Assign
  useEffect(() => {
    const all = [...menAvatars, ...womenAvatars];
    if (all.length === 0) return;
    const available = all.filter(a => !usedAvatars.includes(a));
    const pool = available.length > 0 ? available : all;
    handleSelectPreset(pool[Math.floor(Math.random() * pool.length)]);
  }, []);

  // --- THE "PRO" WORKFLOW ---
  // 1. Generate High-Res 3D Image (OpenAI)
  // 2. Upload to Supabase Bucket
  // 3. Return the Public URL
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setGeneratedPreview(null);
    setSelectedPreset(null);

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setError("Missing VITE_OPENAI_API_KEY in .env");
      setLoading(false);
      return;
    }

    try {
      // 1. CALL OPENAI (DALL-E 3)
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `A square 3D render avatar of a ${prompt}. Style: High-fidelity Pixar/Disney character, cute but professional, studio lighting, solid vibrant background.`,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json", 
          quality: "standard"
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "OpenAI Error");

      const rawBase64 = data.data[0].b64_json;
      
      // 2. PREPARE UPLOAD
      const blob = await base64ToBlob(rawBase64);
      const fileName = `ai_avatar_${Date.now()}.png`;

      // 3. UPLOAD TO SUPABASE
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { contentType: 'image/png', upsert: true });

      if (uploadError) throw uploadError;

      // 4. GET PUBLIC URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // 5. SUCCESS
      setGeneratedPreview(publicUrl);
      onGenerate(publicUrl);

    } catch (err: any) {
      console.error("Gen Error:", err);
      setError(err.message || "Failed to generate image.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (url: string) => {
    setSelectedPreset(url);
    setGeneratedPreview(null);
    onGenerate(url);
  };

  return (
    <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/10 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                {generatedPreview ? (
                   <img src={generatedPreview} className="w-full h-full object-cover" />
                ) : selectedPreset ? (
                   <img src={selectedPreset} className="w-full h-full object-cover" />
                ) : (
                   <User size={18} className="text-slate-400" />
                )}
             </div>
             <span className="text-xs font-black text-white uppercase tracking-widest">
                {lang?.chooseIdentity || "CHOOSE IDENTITY"}
             </span>
          </div>

          <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 gap-1">
              <button onClick={() => setViewMode('ai')} className={`p-1.5 rounded-md transition-all ${viewMode === 'ai' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-purple-400'}`}>
                  <Sparkles size={14} />
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-blue-400'}`}>
                  <LayoutGrid size={14} />
              </button>
          </div>
      </div>

      {/* AI MODE (OPENAI) */}
      {viewMode === 'ai' && (
        <div className="animate-in fade-in zoom-in duration-300 space-y-3">
             <div className="flex items-center gap-2 mb-1">
                <Sparkles size={12} className="text-purple-400" />
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">AI Studio (DALL·E 3)</span>
             </div>

             <div className="flex gap-2">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={lang?.aiPlaceholder || "e.g. Football manager in a suit..."}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <Wand2 size={18} />}
                </button>
            </div>
            {error && <div className="text-[10px] text-red-400 bg-red-900/20 p-2 rounded border border-red-500/20 flex items-center gap-2"><Bug size={12}/>{error}</div>}
        </div>
      )}

      {/* GRID MODE */}
      {viewMode === 'grid' && (
        <div className="animate-in fade-in zoom-in duration-300 space-y-4">
            <div className="grid grid-cols-5 gap-2">
                {menAvatars.slice(0, 5).map((url, i) => (
                    <button key={`m-${i}`} onClick={() => handleSelectPreset(url)} className={`relative group aspect-square rounded-full overflow-hidden border-2 transition-all ${selectedPreset === url ? 'border-green-500 scale-110' : 'border-white/10 hover:border-white/40'}`}>
                        <img src={url} className="w-full h-full object-cover" />
                        {selectedPreset === url && <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center"><Check size={16} className="text-white"/></div>}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-5 gap-2">
                {womenAvatars.slice(0, 5).map((url, i) => (
                    <button key={`w-${i}`} onClick={() => handleSelectPreset(url)} className={`relative group aspect-square rounded-full overflow-hidden border-2 transition-all ${selectedPreset === url ? 'border-green-500 scale-110' : 'border-white/10 hover:border-white/40'}`}>
                        <img src={url} className="w-full h-full object-cover" />
                        {selectedPreset === url && <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center"><Check size={16} className="text-white"/></div>}
                    </button>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};