import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Sparkles, RefreshCw, AlertCircle, Check, Wand2, Loader2, Bug } from 'lucide-react';

interface AvatarGeneratorProps {
  onGenerate: (dataUri: string) => void;
  lang: any;
}

// 1. UTILITY: Compress & Rasterize (Converts SVG/Image -> Small JPEG)
const compressImage = (base64Str: string, maxWidth = 256, quality = 0.85): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      // Maintain aspect ratio but fit within maxWidth
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      const width = img.width * ratio;
      const height = img.height * ratio;

      canvas.width = width;
      canvas.height = height;

      // Fill white background (transparency becomes black in JPEGs otherwise)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export as JPEG (Efficient & "Real Image" format)
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = (err) => {
        console.error("Compression error", err);
        resolve(base64Str);
    };
  });
};

// 2. MODELS: Prioritized list for availability
const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-pro"
];

export const AvatarGenerator: React.FC<AvatarGeneratorProps> = ({ onGenerate, lang }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setGeneratedPreview(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setError("Missing API Key.");
      setLoading(false);
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We ask for SVG code, but we will convert it to a JPEG immediately.
    // This bypasses the "Gemini can't generate JPEGs" limitation of the API.
    const fullPrompt = `
      ROLE: You are a 3D character artist for Pixar.
      TASK: Create a square avatar based on: "${prompt}".
      STYLE: 
      - 3D Rendered Style, High Fidelity, Cute but Professional.
      - Use gradients and shading to simulate 3D lighting.
      - Vibrant stadium/sport background colors.
      - Full color, no transparency.
      
      OUTPUT: Return ONLY raw <svg>...</svg> code. viewBox="0 0 256 256".
    `;

    let success = false;
    
    for (const modelName of MODEL_CANDIDATES) {
      if (success) break;
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        let text = response.text();

        // Cleanup markdown
        text = text.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
        
        const start = text.indexOf('<svg');
        const end = text.indexOf('</svg>');

        if (start !== -1 && end !== -1) {
           const svgCode = text.substring(start, end + 6);
           
           // Convert Code -> Base64
           const base64Svg = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgCode)))}`;
           
           // RASTERIZE: Convert Vector -> JPEG Image
           const realImage = await compressImage(base64Svg);
           
           setGeneratedPreview(realImage);
           success = true;
        }
      } catch (err: any) {
        console.warn(`${modelName} failed, trying next...`);
      }
    }

    if (!success) {
        setError("Could not generate image. Please try again.");
    }
    
    setLoading(false);
  };

  const handleConfirm = () => {
    if (generatedPreview) {
      onGenerate(generatedPreview);
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
            placeholder="e.g. A futuristic football manager with neon glasses..."
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
            {loading ? "Rendering..." : "Generate Image"}
        </button>
        
        {error && (
          <div className="mt-2 text-[10px] text-red-400 flex items-start gap-1 font-medium bg-red-900/20 p-2 rounded border border-red-500/20">
            <Bug size={12} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Preview Area */}
      {generatedPreview && (
        <div className="flex flex-col items-center gap-4 animate-in zoom-in slide-in-from-bottom-2 duration-500">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative w-32 h-32 rounded-full border-4 border-slate-900 overflow-hidden bg-white shadow-2xl">
                    <img 
                        src={generatedPreview} 
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