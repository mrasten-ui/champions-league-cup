import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Sparkles, RefreshCw, AlertCircle, Check, Wand2, Loader2, Bug } from 'lucide-react';

interface AvatarGeneratorProps {
  onGenerate: (avatarUrl: string) => void;
  lang: any;
}

// Using the powerful models you confirmed you have access to
const MODEL_CANDIDATES = [
  "gemini-2.5-flash",          // Best balance of speed & detail
  "gemini-2.0-flash",
  "gemini-2.5-pro",            
  "gemini-pro"                 // Stable fallback
];

export const AvatarGenerator: React.FC<AvatarGeneratorProps> = ({ onGenerate, lang }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string>("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setGeneratedSvg(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setError("Missing API Key.");
      setLoading(false);
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // --- THE FIX: NEW PROMPT FOR "REAL" LOOKING RESULTS ---
    // Instead of "minimal", we ask for "Detailed, Shaded, Professional"
    const fullPrompt = `
      ROLE: You are a professional vector illustrator.
      TASK: Create a highly detailed, vibrant, mascot-style avatar based on: "${prompt}".
      
      CRITICAL STYLE GUIDELINES:
      - Do NOT create simple flat blobs. 
      - Use gradients (defs/linearGradient) to create depth and realism.
      - Add shadows, highlights, and intricate details to features (eyes, hair, accessories).
      - Style: Modern E-Sports Logo or High-Quality App Icon.
      - Colors: Rich, saturated, and professional palette.
      
      TECHNICAL REQUIREMENTS:
      - Output ONLY the raw <svg>...</svg> code.
      - Set viewBox="0 0 100 100".
      - Ensure the SVG is strictly self-contained (no external links).
      - NO markdown formatting.
    `;

    let success = false;
    
    // Try models in order of quality
    for (const modelName of MODEL_CANDIDATES) {
      if (success) break;
      try {
        console.log(`Generating with: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        let text = response.text();

        // Cleanup
        text = text.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
        
        const start = text.indexOf('<svg');
        const end = text.indexOf('</svg>');

        if (start !== -1 && end !== -1) {
           text = text.substring(start, end + 6);
           setGeneratedSvg(text);
           setActiveModel(modelName);
           success = true;
        }
      } catch (err: any) {
        console.warn(`${modelName} failed, trying next...`);
      }
    }

    if (!success) {
        setError("Generation failed. Please try a simpler description.");
    }
    
    setLoading(false);
  };

  const handleConfirm = () => {
    if (generatedSvg) {
      // Encode SVG to Base64 safely
      const base64Svg = btoa(unescape(encodeURIComponent(generatedSvg)));
      const dataUri = `data:image/svg+xml;base64,${base64Svg}`;
      onGenerate(dataUri);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
          Describe your Avatar
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A fierce lion with golden armor..."
            className="flex-1 bg-white border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2.5 rounded-lg transition-all shadow-md active:scale-95"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
          </button>
        </div>
        
        {error && (
          <div className="mt-2 text-[10px] text-red-500 flex items-start gap-1 font-medium bg-red-50 p-2 rounded">
            <Bug size={12} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 transition-all duration-300">
        {generatedSvg ? (
          <div className="relative group animate-in zoom-in duration-300">
            {/* Display the SVG - Now much higher quality */}
            <div 
              className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white hover:scale-105 transition-transform duration-300"
              dangerouslySetInnerHTML={{ __html: generatedSvg }} 
            />
            <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full shadow-sm animate-bounce">
                <Sparkles size={12} />
            </div>
          </div>
        ) : (
          <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50/50">
             <div className="text-center p-4">
               <RefreshCw size={24} className={`text-slate-300 mx-auto mb-1 ${loading ? 'animate-spin' : ''}`} />
               <span className="text-[10px] text-slate-400 font-medium uppercase">
                 {loading ? "Generating Art..." : "Preview"}
               </span>
             </div>
          </div>
        )}

        {generatedSvg && (
          <div className="w-full space-y-2">
            <button
              onClick={handleConfirm}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all"
            >
              <Check size={16} />
              {lang?.useAvatar || "Use This Avatar"}
            </button>
            <div className="text-[9px] text-center text-slate-400 font-medium opacity-50">
              Generated with {activeModel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};