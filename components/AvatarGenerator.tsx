import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Sparkles, RefreshCw, AlertCircle, Check, Wand2, Loader2, Bug } from 'lucide-react';

interface AvatarGeneratorProps {
  onGenerate: (dataUri: string) => void;
  lang: any;
}

// --- THE SOLUTION WE DESIGNED ---
// 1. Takes ANY image source (Huge SVG code or Big Base64)
// 2. Draws it onto a fresh Canvas at a specific size (256px is perfect for avatars)
// 3. Exports it as a highly optimized JPEG (Small file size, Good visual quality)
const compressAndRasterize = (sourceStr: string, size = 256): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    
    // Handle both raw SVG strings and existing Data URIs
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

      // 1. Fill Background White (Prevents transparent SVGs turning black)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);

      // 2. Draw & Resize (The Compression Step)
      // We draw the image to fit the 256x256 square perfectly
      ctx.drawImage(img, 0, 0, size, size);
      
      // 3. Export as JPEG (Quality 0.9 = Crisp but small)
      // This turns "Code" into a "Real Image" file.
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.onerror = (e) => {
        console.error("Image processing failed", e);
        resolve(sourceStr); // Fallback to original if compression fails
    };
  });
};

const MODEL_CANDIDATES = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-pro"];

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
    
    // UPDATED PROMPT: Forces "Complex Art" instead of "Simple Drawing"
    const fullPrompt = `
      ROLE: You are an expert vector artist specializing in E-Sports Mascots.
      TASK: Create a square avatar for: "${prompt}".
      
      STYLE RULES (CRITICAL):
      1. **NO SIMPLE DOODLES**: Use complex shapes, shading, and lighting.
      2. **SIMULATED 3D**: Use <linearGradient> and <radialGradient> to make the face/object look rounded and 3D.
      3. **DETAILS**: Add a thick border, detailed hair/fur strands, and glossy reflections in the eyes.
      4. **BACKGROUND**: A rich, vibrant gradient background (Team Colors).
      
      OUTPUT: Return ONLY raw <svg> code. viewBox="0 0 256 256".
    `;

    let success = false;
    
    for (const modelName of MODEL_CANDIDATES) {
      if (success) break;
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        let text = response.text();

        text = text.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
        
        const start = text.indexOf('<svg');
        const end = text.indexOf('</svg>');

        if (start !== -1 && end !== -1) {
           const rawSvg = text.substring(start, end + 6);
           
           // EXECUTE THE SOLUTION:
           // Convert the complex Vector Code -> High Quality, Small JPEG
           const processedImage = await compressAndRasterize(rawSvg, 256);
           
           setGeneratedPreview(processedImage);
           success = true;
        }
      } catch (err: any) {
        console.warn(`${modelName} failed, trying next...`);
      }
    }

    if (!success) setError("Failed to generate avatar. Please try again.");
    setLoading(false);
  };

  const handleConfirm = () => {
    if (generatedPreview) {
      onGenerate(generatedPreview);
    }
  };

  return (
    <div className="space-y-4">
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
            placeholder="e.g. A fierce tactical manager in a dark suit..."
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
            {loading ? "Generating..." : "Generate Identity"}
        </button>
        
        {error && (
          <div className="mt-2 text-[10px] text-red-400 flex items-start gap-1 font-medium bg-red-900/20 p-2 rounded border border-red-500/20">
            <Bug size={12} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

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