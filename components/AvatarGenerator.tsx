import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Sparkles, RefreshCw, AlertCircle, Check, Wand2, Loader2, Bug } from 'lucide-react';

interface AvatarGeneratorProps {
  onGenerate: (avatarUrl: string) => void;
  lang: any;
}

// 1. UTILITY: Convert Vector Code -> Real JPEG Image
// This ensures your database gets a small, compatible image file, not code.
const vectorToJpeg = (svgString: string, maxWidth = 256, quality = 0.9): Promise<string> => {
  return new Promise((resolve) => {
    // 1. Create an image element from the SVG code
    const img = new Image();
    const base64Svg = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
    img.src = base64Svg;
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // 2. Draw it onto a canvas (Rasterization)
      const canvas = document.createElement('canvas');
      const size = Math.min(img.width, img.height);
      
      // Ensure high quality scaling
      canvas.width = maxWidth;
      canvas.height = maxWidth;

      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(base64Svg); return; }

      // White background (prevents transparency turning black)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, maxWidth, maxWidth);

      // Draw the SVG image into the canvas
      ctx.drawImage(img, 0, 0, size, size, 0, 0, maxWidth, maxWidth);
      
      // 3. Export as a real JPEG image
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    
    // Fallback if conversion fails
    img.onerror = () => resolve(base64Svg);
  });
};

// 2. MODELS: Use the powerful text models that support complex code generation
const MODEL_CANDIDATES = [
  "gemini-2.0-flash", 
  "gemini-2.5-flash",
  "gemini-pro"
];

export const AvatarGenerator: React.FC<AvatarGeneratorProps> = ({ onGenerate, lang }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string>("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setGeneratedPreview(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setError("Missing API Key in .env file.");
      setLoading(false);
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // --- THE FIX: FORCE 3D LOOK VIA CODE ---
    // Since we can't request 'image/jpeg', we demand detailed SVG code 
    // that uses gradients to simulate 3D lighting.
    const fullPrompt = `
      ROLE: You are an expert 3D illustrator using SVG code.
      TASK: Create a square avatar based on: "${prompt}".
      
      CRITICAL STYLE GUIDELINES (NO FLAT ART):
      1. **3D SHADING**: Use <radialGradient> and <linearGradient> to create depth on the face and clothes.
      2. **LIGHTING**: Add distinct highlights (white reflections) on the eyes and forehead to look "glossy" and alive.
      3. **DETAILS**: Draw detailed hair strands and clothing texture, not just simple shapes.
      4. **VIBRANT**: Use a rich, saturated color palette (Pixar style).
      5. **BACKGROUND**: A detailed gradient background representing a stadium or team colors.
      
      TECHNICAL OUTPUT:
      - Return ONLY the raw <svg> code.
      - viewBox="0 0 256 256".
      - Do NOT use markdown code blocks.
    `;

    let success = false;
    
    // Try models until one works
    for (const modelName of MODEL_CANDIDATES) {
      if (success) break;
      
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown if the AI adds it
        text = text.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
        
        // Find valid SVG tags
        const start = text.indexOf('<svg');
        const end = text.indexOf('</svg>');

        if (start !== -1 && end !== -1) {
           const svgCode = text.substring(start, end + 6);
           
           // CONVERT: Code -> Real JPEG Image
           const realImage = await vectorToJpeg(svgCode);
           
           setGeneratedPreview(realImage);
           setActiveModel(modelName);
           success = true;
        }
      } catch (err: any) {
        console.warn(`${modelName} failed, trying next...`);
      }
    }

    if (!success) {
        setError("Generation failed. Try a simpler prompt.");
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
            placeholder="e.g. A futuristic football manager with glowing glasses..."
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
            {loading ? "Designing Avatar..." : "Generate"}
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
            <div className="text-[9px] text-slate-500 font-mono">
                {activeModel}
            </div>
        </div>
      )}
    </div>
  );
};