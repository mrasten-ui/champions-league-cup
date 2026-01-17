import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertCircle, Check, Wand2, Loader2, Bug } from 'lucide-react';

interface AvatarGeneratorProps {
  onGenerate: (dataUri: string) => void;
  lang: any;
}

// 1. UTILITY: Compress Large Images -> Tiny Avatars
const compressImage = (base64Str: string, maxWidth = 200, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Create a square canvas
      const size = Math.min(img.width, img.height);
      const maxSize = Math.min(size, maxWidth);
      
      canvas.width = maxSize;
      canvas.height = maxSize;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      // Draw white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, maxSize, maxSize);

      // Center crop logic
      const offsetX = (img.width - size) / 2;
      const offsetY = (img.height - size) / 2;

      ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, maxSize, maxSize);
      
      // Return highly optimized JPEG
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

export const AvatarGenerator: React.FC<AvatarGeneratorProps> = ({ onGenerate, lang }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setError("Missing API Key.");
      setLoading(false);
      return;
    }

    try {
      // We use a raw fetch call to force 'image/jpeg' output.
      // This bypasses SDK limitations and forces the model to generate pixels.
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Generate a square avatar. Style: 3D Pixar character, high quality, vibrant colors, centered face. Subject: ${prompt}`
              }]
            }],
            generationConfig: {
              responseMimeType: "image/jpeg" 
            }
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Generation failed");
      }

      const data = await response.json();
      
      // Look for binary image data in the response
      const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      
      if (inlineData && inlineData.mimeType.startsWith('image')) {
        const rawBase64 = `data:${inlineData.mimeType};base64,${inlineData.data}`;
        
        // CRITICAL: Compress immediately. Raw AI images are 1MB+ and will crash localStorage.
        const tinyImage = await compressImage(rawBase64);
        setGeneratedImage(tinyImage);
      } else {
        throw new Error("AI returned text instead of an image. Try again.");
      }

    } catch (err: any) {
      console.error("Gen Error:", err);
      let msg = "Failed to generate image.";
      if (err.message.includes('404')) msg = "Model not supported on this key/region.";
      if (err.message.includes('400')) msg = "Prompt rejected by safety filters.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (generatedImage) {
      onGenerate(generatedImage);
    }
  };

  return (
    <div className="space-y-4">
      {/* Input Area */}
      <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/10 space-y-3">
        <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-purple-400" />
            <span className="text-[10px] font-black text-purple-200 uppercase tracking-widest">
                {lang?.genAvatarTitle || "AI Identity"}
            </span>
        </div>
        
        <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A cool football manager in a suit..."
            rows={2}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />
        
        <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
        >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {loading ? "Generating 3D Art..." : "Generate Image"}
        </button>
        
        {error && (
          <div className="mt-2 text-[10px] text-red-400 flex items-start gap-1 font-medium bg-red-900/20 p-2 rounded border border-red-500/20">
            <Bug size={12} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Preview Area */}
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
        </div>
      )}
    </div>
  );
};