import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Sparkles, RefreshCw, AlertCircle, Check, Wand2, Loader2 } from 'lucide-react';

interface AvatarGeneratorProps {
  onGenerate: (avatarUrl: string) => void;
  lang: any;
}

// Priority list of models to try. 
// It starts with the fastest/cheapest (Flash) and falls back to older/stable ones.
const MODEL_CANDIDATES = [
  "gemini-1.5-flash",
  "gemini-1.5-pro", 
  "gemini-1.0-pro",
  "gemini-pro"
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
      setError("Missing API Key. Check .env file.");
      setLoading(false);
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We combine the system instruction into the prompt because 
    // some older models don't support the separate 'systemInstruction' property.
    const fullPrompt = `
      ROLE: You are an expert SVG artist.
      TASK: Generate a circular, flat-design SVG avatar based on this description: "${prompt}".
      REQUIREMENTS:
      - Use vibrant colors.
      - Return ONLY the raw <svg>...</svg> code.
      - No markdown, no backticks, no explanations.
      - The SVG must have viewBox="0 0 100 100".
    `;

    // --- FALLBACK STRATEGY ---
    for (const modelName of MODEL_CANDIDATES) {
      try {
        console.log(`Attempting generation with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        let text = response.text();

        // If we get here, it worked! Clean up the text.
        text = text.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
        
        // Find the SVG tag start/end to ignore any chatty intros
        const start = text.indexOf('<svg');
        const end = text.indexOf('</svg>');

        if (start !== -1 && end !== -1) {
           text = text.substring(start, end + 6);
           setGeneratedSvg(text);
           setActiveModel(modelName); // Success!
           setLoading(false);
           return; // Exit the loop and function
        }
        
      } catch (err: any) {
        console.warn(`Model ${modelName} failed:`, err.message);
        // If it's the last model and it still failed, show the error
        if (modelName === MODEL_CANDIDATES[MODEL_CANDIDATES.length - 1]) {
           let msg = "All AI models failed. Please check API Key quota.";
           if (err.message.includes('404')) msg = "API Key valid, but no models found available.";
           setError(msg);
        }
        // Otherwise, continue to the next model in the loop...
      }
    }
    setLoading(false);
  };

  const handleConfirm = () => {
    if (generatedSvg) {
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
            placeholder="e.g. A cyberpunk lion..."
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
          <div className="mt-2 text-[10px] text-red-500 flex items-center gap-1 font-medium bg-red-50 p-2 rounded">
            <AlertCircle size={12} />
            {error}
          </div>
        )}
      </div>

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
                 {loading ? "Trying Models..." : "Preview"}
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
            <div className="text-[9px] text-center text-slate-400 font-medium">
              Generated with {activeModel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};