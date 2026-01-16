import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Sparkles, RefreshCw, AlertCircle, Check, Wand2, Loader2 } from 'lucide-react';

interface AvatarGeneratorProps {
  onGenerate: (avatarUrl: string) => void;
  lang: any; // Loosely typed to accept your translation object
}

export const AvatarGenerator: React.FC<AvatarGeneratorProps> = ({ onGenerate, lang }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setGeneratedSvg(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error("Missing VITE_GEMINI_API_KEY in .env file.");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      
      // FIX: Switched to 'gemini-pro' (stable) to avoid 404 errors with 'gemini-1.5-flash'
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // Highly specific prompt to get clean SVG code
      const systemInstruction = `
        You are an SVG avatar generator. 
        Generate a minimal, circular, flat-design SVG avatar based on the user's description.
        Use vibrant colors.
        Do NOT add code blocks (like \`\`\`xml). 
        Return ONLY the raw <svg>...</svg> string.
        Ensure the viewBox is "0 0 100 100".
      `;

      const fullPrompt = `${systemInstruction}\n\nDescription: ${prompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      let text = response.text();

      // Cleanup: Remove markdown code blocks if Gemini adds them
      text = text.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();

      // Basic validation to ensure we got code, not chat
      if (!text.startsWith('<svg') || !text.endsWith('</svg>')) {
         const start = text.indexOf('<svg');
         const end = text.indexOf('</svg>') + 6;
         if (start !== -1 && end !== -1) {
             text = text.substring(start, end);
         } else {
             throw new Error("AI returned invalid code. Please try again.");
         }
      }

      setGeneratedSvg(text);
    } catch (err: any) {
      console.error("Avatar Gen Error:", err);
      let msg = err.message || "Failed to generate.";
      if (msg.includes('404')) msg = "AI Model not found. Check API Key.";
      if (msg.includes('400')) msg = "Request failed. Try a simpler prompt.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (generatedSvg) {
      // Convert raw SVG string to a Data URI that can be used as an <img> src
      // utilizing base64 encoding to ensure special characters don't break it
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
            placeholder="e.g. A cyberpunk lion with sunglasses..."
            className="flex-1 bg-white border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-lg transition-all shadow-md active:scale-95"
            title="Generate with AI"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
          </button>
        </div>
        
        {error && (
          <div className="mt-2 text-[10px] text-red-500 flex items-center gap-1 font-medium bg-red-50 p-2 rounded">
            <AlertCircle size={12} />
            {error}
          </div>
        )}
      </div>

      {/* Preview Area */}
      <div className="flex flex-col items-center gap-4 transition-all duration-300">
        {generatedSvg ? (
          <div className="relative group animate-in zoom-in duration-300">
            <div 
              className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white"
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
                 {loading ? "Dreaming..." : "Preview"}
               </span>
             </div>
          </div>
        )}

        {generatedSvg && (
          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all"
          >
            <Check size={16} />
            {lang?.useAvatar || "Use This Avatar"}
          </button>
        )}
      </div>
      
      <div className="text-[9px] text-center text-slate-400 font-medium">
        Powered by Google Gemini
      </div>
    </div>
  );
};