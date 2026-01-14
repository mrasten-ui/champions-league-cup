import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { Translation } from '../types';
import { HOST_KEYS } from '../constants';

interface AvatarGeneratorProps {
  onGenerate: (dataUri: string) => void;
  lang: Translation;
}

// Utility to compress image to a small Avatar friendly size
const compressImage = (base64Str: string, maxWidth = 180, quality = 0.85): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str); // Fallback if canvas fails
        return;
      }

      // Calculate new dimensions (Square aspect ratio preferred)
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      const width = img.width * ratio;
      const height = img.height * ratio;

      canvas.width = width;
      canvas.height = height;

      // Draw and compress to JPEG (much smaller than PNG)
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(base64Str); // Fallback
  });
};

export const AvatarGenerator: React.FC<AvatarGeneratorProps> = ({ onGenerate, lang }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError('');
    setGeneratedImage(null);
    
    try {
        const key = process.env.API_KEY || HOST_KEYS[Math.floor(Math.random() * HOST_KEYS.length)];
        const ai = new GoogleGenAI({ apiKey: key });
        
        // FIX: Switch to Imagen model for image generation
        // Gemini models (like gemini-2.0-flash) generally output text. 
        // Imagen is required to get actual image bytes in the response.
        const response = await ai.models.generateContent({
            model: 'imagen-3.0-generate-001', 
            contents: {
              parts: [{ text: `Generate a square avatar icon for a professional football manager profile. Description: ${prompt}. Style: high-fidelity 3D Pixar-style character art, vibrant stadium lighting background, centered face, crisp details.` }],
            }
        });
        
        const candidate = response.candidates?.[0];
        let foundImage = false;
        
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    const base64 = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    const rawUri = `data:${mimeType};base64,${base64}`;
                    
                    // Compress immediately before state update
                    const compressedUri = await compressImage(rawUri);
                    
                    setGeneratedImage(compressedUri);
                    foundImage = true;
                    break; 
                }
            }
        }

        if (!foundImage) {
            if (candidate?.finishReason === 'SAFETY') {
                setError('Safety filters blocked this request. Try a different description.');
            } else {
                // If we get here with Imagen, it usually means a server-side failure or refusal
                setError('AI returned no image data. The prompt might have been filtered.');
            }
        }

    } catch (e: any) {
        console.warn(`Key failed:`, e.message);
        // Handle common 404 if Imagen isn't enabled for the API key
        if (e.message?.includes('404') || e.message?.includes('not found')) {
             setError('Image generation model not available with this API key.');
        } else {
             setError(e.message || 'Connection failed.');
        }
    }

    setLoading(false);
  };

  const handleConfirm = () => {
    if (generatedImage) {
        onGenerate(generatedImage);
    }
  };
  
  return (
    <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/10 space-y-4 animate-in fade-in">
        <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" />
                <span className="text-[10px] font-black text-purple-200 uppercase tracking-widest">{lang.genAvatarTitle}</span>
            </div>
        </div>
        
        <p className="text-[10px] text-slate-400 leading-tight font-medium">{lang.genAvatarDesc}</p>

        <div className="space-y-3">
             <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={lang.genAvatarPlaceholder}
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all resize-none"
             />
             <button 
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 shadow-lg"
             >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {loading ? 'Painting Persona...' : lang.generate}
             </button>
        </div>

        {error && (
            <div className="flex items-start gap-2 text-red-400 text-[10px] font-bold bg-red-900/20 p-3 rounded-lg border border-red-500/20">
                <AlertCircle size={14} className="shrink-0 mt-0.5" /> 
                <span className="leading-tight break-words">{error}</span>
            </div>
        )}

        {generatedImage && (
            <div className="flex flex-col items-center gap-3 mt-4 animate-in zoom-in slide-in-from-bottom-2 duration-500">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative w-28 h-28 rounded-full border-4 border-slate-900 overflow-hidden bg-white shadow-2xl">
                        <img src={generatedImage} className="w-full h-full object-cover" alt="Generated Persona" />
                    </div>
                </div>
                <button 
                    onClick={handleConfirm}
                    className="w-full py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95"
                >
                    <Check size={18} /> {lang.useAvatar}
                </button>
            </div>
        )}
    </div>
  );
};