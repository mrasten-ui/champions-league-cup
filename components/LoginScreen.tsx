import React, { useState } from 'react';
import { ChevronRight, RefreshCw, Mail, KeyRound, UserCircle2, X, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { AvatarGenerator } from './AvatarGenerator';
import { Logo } from './Logo';
import { LANGUAGES, TRANSLATIONS } from '../constants';
import { LanguageCode } from '../types';

interface LoginScreenProps {
  onLogin: (name: string, email: string, avatar: string) => Promise<void>; 
  onSuccess: () => void;
  currentLang: LanguageCode;
  setLang: (code: LanguageCode) => void;
  isLoading: boolean;
  menPresets: string[];
  womenPresets: string[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLogin, currentLang, setLang, onSuccess, isLoading, 
  menPresets, womenPresets 
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(
    sessionStorage.getItem('pending_league_invite') ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const t = TRANSLATIONS[currentLang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLocalLoading(true);

    if (!isSupabaseConfigured || !supabase) {
        if (!email) { setLocalLoading(false); return; }
        await onLogin(mode === 'signup' ? name : email.split('@')[0], email, selectedAvatar);
        setLocalLoading(false);
        return;
    }

    try {
        if (mode === 'reset') {
             const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
             if (error) throw error;
             setSuccessMsg("Check your email for the password reset link!");
             setLocalLoading(false);
             return;
        }

        if (mode === 'signup') {
            if (!name.trim()) throw new Error("Please enter your name.");

            // Check name uniqueness before creating the account
            const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).ilike('name', name.trim());
            if ((count ?? 0) > 0) throw new Error(`"${name.trim()}" is already taken — please choose a different nickname.`);

            // Store avatar in sessionStorage BEFORE triggering auth, so fetchUserProfile
            // can read it even if onAuthStateChange fires during the signUp await.
            const preSignupAvatar = selectedAvatar || (menPresets.length > 0 ? menPresets[0] : '');
            if (preSignupAvatar && !preSignupAvatar.startsWith('data:')) {
                sessionStorage.setItem('pending_avatar', preSignupAvatar);
            }

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email, password, options: { data: { full_name: name } }
            });
            if (authError) throw authError;
            if (!authData.user) throw new Error("Signup failed.");

            let finalAvatarUrl = selectedAvatar;
            if (selectedAvatar.startsWith('data:')) {
                // base64 fallback — re-upload now that we have a user id and session
                try {
                    const res = await fetch(selectedAvatar);
                    const blob = await res.blob();
                    const fileName = `avatar_${authData.user.id}_${Date.now()}.png`;
                    const { error: upErr } = await supabase.storage.from('avatars').upload(fileName, blob, { contentType: 'image/png', upsert: true });
                    if (!upErr) {
                        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                        finalAvatarUrl = data.publicUrl;
                    }
                } catch (e) { console.warn("Avatar upload failed"); }
                // Update sessionStorage with the resolved URL (or keep base64 as last resort)
                if (!finalAvatarUrl && menPresets.length > 0) finalAvatarUrl = menPresets[0];
                if (finalAvatarUrl) sessionStorage.setItem('pending_avatar', finalAvatarUrl);
            } else if (!preSignupAvatar) {
                if (!finalAvatarUrl && menPresets.length > 0) finalAvatarUrl = menPresets[0];
                if (finalAvatarUrl) sessionStorage.setItem('pending_avatar', finalAvatarUrl);
            }

            if (authData.session) onSuccess();
            else setErrorMsg("Please check your email to confirm your account.");

        } else {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            if (data.session) onSuccess();
        }
    } catch (err: any) {
        console.error("Auth Error:", err);
        setErrorMsg(err.message || "Authentication failed");
    } finally {
        setLocalLoading(false);
    }
  };

  const isProcessing = isLoading || localLoading;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#05101c] text-white p-6 relative overflow-hidden">
       <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-[#05101c] to-[#05101c] pointer-events-none"></div>
       <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

       <div className="w-full max-w-md animate-fade-in z-10 flex flex-col items-center gap-8">
          <div className="text-center space-y-4 flex flex-col items-center">
              <div className="relative inline-block mb-4">
                <Logo className="w-52 h-52 transition-transform duration-700 hover:scale-110" variant="theme" />
              </div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">The Rasten Cup '26</h1>
              <p className="text-blue-400 font-bold text-xs tracking-[0.2em] uppercase opacity-90">{t.subTitle}</p>
          </div>
          <div className="w-full bg-slate-900/50 backdrop-blur-md rounded-3xl p-8 shadow-2xl text-slate-100 border border-white/10 ring-1 ring-white/5">
             <div className="mb-8 flex justify-center gap-4">
                  {LANGUAGES.map((lang) => (
                      <button key={lang.code} onClick={() => setLang(lang.code)} className={`relative w-14 h-10 rounded-md overflow-hidden transition-all duration-300 transform ${currentLang === lang.code ? 'scale-110 ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] grayscale-0' : 'opacity-50 grayscale hover:opacity-100 hover:scale-105'}`}>
                          <img src={lang.flag} alt={lang.name} className="w-full h-full object-cover" />
                      </button>
                  ))}
             </div>
             
             {mode !== 'reset' && (
                 <div className="flex bg-black/20 p-1 rounded-xl mb-6 border border-white/5">
                    <button onClick={() => { setMode('login'); setErrorMsg(null); }} className={`flex-1 py-2.5 text-xs font-black uppercase rounded-lg transition-all ${mode === 'login' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:text-white'}`}>{t.loginMode}</button>
                    <button onClick={() => { setMode('signup'); setErrorMsg(null); }} className={`flex-1 py-2.5 text-xs font-black uppercase rounded-lg transition-all ${mode === 'signup' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:text-white'}`}>{t.signupMode}</button>
                 </div>
             )}

             <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-red-200 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2"><div className="bg-red-500 rounded-full p-1"><X size={10} className="text-white" /></div>{errorMsg}</div>}
                {successMsg && <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-3 text-green-200 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2"><div className="bg-green-500 rounded-full p-1"><CheckCircle2 size={10} className="text-white" /></div>{successMsg}</div>}

                {mode === 'reset' && <div className="text-center mb-4"><h3 className="text-lg font-bold text-white mb-1">Reset Password</h3><p className="text-xs text-slate-400">Enter your email to receive a reset link.</p></div>}

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
                
                {mode !== 'reset' && (
                    <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-12 py-3.5 font-semibold text-white placeholder-slate-500 pr-12 focus:outline-none focus:border-blue-500 transition-colors" placeholder={t.passwordLabel} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1 hover:text-white">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                )}

                {mode === 'login' && <div className="flex justify-end"><button type="button" onClick={() => { setMode('reset'); setErrorMsg(null); setSuccessMsg(null); }} className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors">Forgot Password?</button></div>}

                {mode === 'signup' && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 pt-2">
                      <div className="flex items-center gap-3 px-1"><div className="h-px bg-white/10 flex-1"></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Create Your Identity</span><div className="h-px bg-white/10 flex-1"></div></div>
                      <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-4"><AvatarGenerator onGenerate={(uri) => setSelectedAvatar(uri)} lang={t} menAvatars={menPresets} womenAvatars={womenPresets} currentAvatar={selectedAvatar || undefined} /></div>
                  </div>
                )}

                <button type="submit" disabled={isProcessing} className="w-full py-4 mt-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"> 
                  {isProcessing ? <><RefreshCw size={18} className="animate-spin" /> Connecting...</> : <>{mode === 'reset' ? 'Send Reset Link' : t.enterBtn} {mode !== 'reset' && <ChevronRight size={18} />}</>}
                </button>

                {mode === 'reset' && <button type="button" onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }} className="w-full py-3 text-xs font-bold text-slate-400 hover:text-white transition-colors">Back to Login</button>}
             </form>
          </div>
       </div>
    </div>
  );
};