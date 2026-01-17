import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, UserCircle2, Eye, EyeOff, Sparkles, CheckCircle2, RefreshCw, ChevronRight, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { AVATARS, LANGUAGES, TRANSLATIONS } from '../constants';
import { AvatarGenerator } from './AvatarGenerator';
import { Logo } from './Logo';
import { AvatarDisplay } from './AvatarDisplay';
import { LanguageCode } from '../types';

interface LoginScreenProps {
  onSuccess: () => void;
  currentLang: LanguageCode;
  setLang: (code: LanguageCode) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, currentLang, setLang }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  
  // FIXED: Set this to TRUE so the AI Generator is the default view
  const [showAvatarGen, setShowAvatarGen] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const t = TRANSLATIONS[currentLang];

  useEffect(() => { 
      if (mode === 'signup') setSelectedAvatar(AVATARS[Math.floor(Math.random() * AVATARS.length)]); 
  }, [mode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (!isSupabaseConfigured || !supabase) {
        setErrorMsg("Database connection missing.");
        setLoading(false);
        return;
    }

    try {
        if (mode === 'signup') {
            if (!name.trim()) throw new Error("Please enter your name.");
            
            // 1. Supabase Auth SignUp
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: name, avatar_url: selectedAvatar } }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Signup failed.");

            // 2. Create Profile in DB
            const newProfile: any = {
                email: authData.user.email!.toLowerCase(),
                name: name.trim(),
                avatar: selectedAvatar,
                tokens: 5,
                substitutions: 5,
                favorites: [],
                unlocked_matches: [],
                has_taken_second_chance: false,
                spied_matches: [],
                leagues: []
            };

            await supabase.from('profiles').upsert(newProfile);

            if (authData.session) onSuccess();
            else setErrorMsg("Please check your email to confirm your account.");

        } else {
            // Login
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            if (data.session) onSuccess();
        }
    } catch (err: any) {
        console.error("Auth Error:", err);
        setErrorMsg(err.message || "Authentication failed");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#05101c] text-white p-6 relative overflow-hidden">
       {/* Background Effects */}
       <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-[#05101c] to-[#05101c] pointer-events-none"></div>
       <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

       <div className="w-full max-w-md animate-fade-in z-10 flex flex-col items-center gap-8">
          <div className="text-center space-y-4 flex flex-col items-center">
              <div className="relative inline-block mb-4 hover:scale-105 transition-transform duration-500">
                <Logo className="w-40 h-40 md:w-52 md:h-52" variant="theme" />
              </div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">The Rasten Cup '26</h1>
              <p className="text-blue-400 font-bold text-xs tracking-[0.2em] uppercase opacity-90">{t.subTitle}</p>
          </div>

          <div className="w-full bg-slate-900/50 backdrop-blur-md rounded-3xl p-8 shadow-2xl text-slate-100 border border-white/10 ring-1 ring-white/5 relative">
             <div className="absolute top-4 right-4 flex gap-2">
                  {LANGUAGES.map((lang) => (
                      <button 
                          key={lang.code} 
                          onClick={() => setLang(lang.code)} 
                          className={`w-8 h-6 rounded overflow-hidden transition-all duration-300 ${currentLang === lang.code ? 'ring-2 ring-yellow-400 scale-110 grayscale-0' : 'opacity-40 grayscale hover:opacity-100'}`}
                      >
                          <img src={lang.flag} alt={lang.name} className="w-full h-full object-cover" />
                      </button>
                  ))}
             </div>

             <div className="flex bg-black/40 p-1 rounded-xl mb-8 border border-white/5 mt-4">
                <button onClick={() => { setMode('login'); setErrorMsg(null); }} className={`flex-1 py-2.5 text-xs font-black uppercase rounded-lg transition-all ${mode === 'login' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:text-white'}`}>{t.loginMode}</button>
                <button onClick={() => { setMode('signup'); setErrorMsg(null); }} className={`flex-1 py-2.5 text-xs font-black uppercase rounded-lg transition-all ${mode === 'signup' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:text-white'}`}>{t.signupMode}</button>
             </div>

             <form onSubmit={handleAuth} className="space-y-4">
                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-red-200 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                        <div className="bg-red-500 rounded-full p-1"><X size={10} className="text-white" /></div>{errorMsg}
                    </div>
                )}

                {mode === 'signup' && (
                    <div className="animate-in slide-in-from-top-1 relative">
                        <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" placeholder={t.nameLabel} />
                    </div>
                )}
                
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" placeholder={t.emailLabel} />
                </div>
                
                <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-12 py-3.5 font-semibold text-white placeholder-slate-500 pr-12 focus:outline-none focus:border-blue-500 transition-colors" placeholder={t.passwordLabel} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1 hover:text-white">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>

                {mode === 'signup' && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 pt-2">
                      <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-4">
                         <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <AvatarDisplay avatar={selectedAvatar} size="md" />
                                 <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t.selectAvatar}</span>
                             </div>
                             <div className="flex gap-2">
                                {/* Toggle Button: Shows Checkmark if viewing AI, Sparkles if viewing list */}
                                <button type="button" onClick={() => setShowAvatarGen(!showAvatarGen)} className={`p-2 rounded-lg transition-all ${showAvatarGen ? 'bg-purple-600 text-white shadow-sm' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                                    {showAvatarGen ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
                                </button>
                             </div>
                         </div>
                         {showAvatarGen ? (
                             <div className="animate-in fade-in"><AvatarGenerator onGenerate={(uri) => setSelectedAvatar(uri)} lang={t} /></div>
                         ) : (
                            <div className="flex gap-2 justify-start overflow-x-auto no-scrollbar py-2">
                              {AVATARS.map(av => (
                                <button key={av} type="button" onClick={() => setSelectedAvatar(av)} className={`relative w-10 h-10 rounded-full transition-all shrink-0 ${selectedAvatar === av ? 'scale-110 ring-2 ring-blue-400 shadow-lg z-10' : 'opacity-60 hover:opacity-100 grayscale hover:grayscale-0'}`}>
                                  <img src={av} className="w-full h-full rounded-full object-cover bg-white" alt="" />
                                </button>
                              ))}
                            </div>
                         )}
                      </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 mt-6 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                > 
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      {t.enterBtn} <ChevronRight size={18} /> 
                    </>
                  )}
                </button>
             </form>
          </div>
       </div>
    </div>
  );
};