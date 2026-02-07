import React, { useState } from 'react';
import { PRE_SEASON_TOUR } from './tourConfig';
import { supabase } from '../supabase';
import { Download, Play, RefreshCw, Loader2 } from 'lucide-react';

export const StudioGenerator: React.FC = () => {
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});

  const languages = ['en', 'en-US', 'no', 'sco'];

  // Helper to concatenate two audio buffers (Simple binary append for MP3s)
  const concatAudio = (buffers: ArrayBuffer[]) => {
    const totalLen = buffers.reduce((acc, b) => acc + b.byteLength, 0);
    const tmp = new Uint8Array(totalLen);
    let offset = 0;
    buffers.forEach(b => {
      tmp.set(new Uint8Array(b), offset);
      offset += b.byteLength;
    });
    return tmp.buffer;
  };

  const generateStep = async (stepIndex: number, lang: string) => {
    const step = PRE_SEASON_TOUR[stepIndex];
    const key = `${lang}_${step.id}`;
    const script = step.audioScript[lang] || step.audioScript['en']; // Fallback
    
    // Safety check for script existence
    if (!script) {
        console.error(`No script found for ${key}`);
        return;
    }

    setGenerating(prev => ({ ...prev, [key]: true }));

    try {
      // 1. Generate Host Audio
      const { data: hostData, error: hostError } = await supabase.functions.invoke('generate-audio', {
        body: { input: script.host, speaker_type: 'Host', lang }
      });
      if (hostError) throw hostError;

      // 2. Generate Pundit Audio
      const { data: punditData, error: punditError } = await supabase.functions.invoke('generate-audio', {
        body: { input: script.pundit, speaker_type: 'Pundit', lang }
      });
      if (punditError) throw punditError;

      // 3. Decode Base64 to ArrayBuffer
      const hostBuffer = Uint8Array.from(atob(hostData.audioContent), c => c.charCodeAt(0)).buffer;
      const punditBuffer = Uint8Array.from(atob(punditData.audioContent), c => c.charCodeAt(0)).buffer;

      // 4. Stitch (Host + 1s Silence + Pundit)
      // Note: To add silence, we'd need a silence mp3 buffer, but direct appending usually works fine for browsers
      const combinedBuffer = concatAudio([hostBuffer, punditBuffer]);
      
      // 5. Create Blob URL
      const blob = new Blob([combinedBuffer], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);

      setAudioUrls(prev => ({ ...prev, [key]: url }));

    } catch (e) {
      console.error("Generation failed:", e);
      alert(`Failed to generate ${key}: ${e.message}`);
    } finally {
      setGenerating(prev => ({ ...prev, [key]: false }));
    }
  };

  const getFileName = (idx: number, lang: string) => {
     // Matches the format in tourConfig.ts: /audio/tour_pre_en_01.mp3
     const num = (idx + 1).toString().padStart(2, '0');
     // Map lang code if needed (e.g. en-US -> us)
     let langCode = lang;
     if (lang === 'en-US') langCode = 'us';
     return `tour_pre_${langCode}_${num}.mp3`;
  };

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black italic uppercase mb-8 border-b border-white/10 pb-4">
          🎙️ Rasten Cup Studio Generator
        </h1>
        
        <div className="space-y-12">
          {PRE_SEASON_TOUR.map((step, idx) => (
            <div key={step.id} className="bg-slate-800 rounded-xl p-6 border border-white/5">
              <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <span className="bg-white/10 text-white px-2 py-1 rounded text-sm">Step {idx + 1}</span> 
                {step.id.toUpperCase()}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {languages.map(lang => {
                   const key = `${lang}_${step.id}`;
                   const fileName = getFileName(idx, lang);
                   
                   return (
                     <div key={lang} className="bg-slate-950 p-4 rounded-lg border border-white/5 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="font-mono text-xs text-blue-300">{fileName}</span>
                            <span className="text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded uppercase">{lang}</span>
                        </div>
                        
                        {audioUrls[key] ? (
                            <div className="flex gap-2">
                                <audio controls src={audioUrls[key]} className="h-8 w-full max-w-[150px]" />
                                <a 
                                  href={audioUrls[key]} 
                                  download={fileName}
                                  className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded flex items-center justify-center gap-2 text-xs font-bold py-1.5"
                                >
                                   <Download size={14} /> Save
                                </a>
                            </div>
                        ) : (
                            <button 
                                onClick={() => generateStep(idx, lang)}
                                disabled={generating[key]}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-wait text-white rounded flex items-center justify-center gap-2 text-xs font-bold"
                            >
                                {generating[key] ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14} />}
                                Generate Audio
                            </button>
                        )}
                     </div>
                   );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};