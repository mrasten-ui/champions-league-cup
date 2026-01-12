
import React, { useState } from 'react';
import { Bot, RefreshCw, ShieldAlert, Users, Trophy, Trash2, X, PlayCircle, History, UploadCloud, FileText, Database, Copy, Check, CloudUpload, Eraser, UserX, AlertTriangle, Clock, Calendar, Search, Bug, Sprout, FileSearch } from 'lucide-react';
import { Translation, UserProfile, Prediction, Match, LanguageCode } from '../types';
import { TEAMS } from '../constants';
import { seedMockHistoryToSupabase, fetchScoutingOverview, fetchTeamExtendedStats, seedScoutingReportsToSupabase, seedTeamStatsToSupabase } from '../services/engine';
import { supabase } from '../supabase';
import { getScoutingReport } from '../scoutingData';

// Team Mapping for CSV Import
const TEAM_MAP: Record<string, string> = {
  "Netherlands": "NED", "USA": "USA", "United States": "USA", "England": "ENG",
  "Argentina": "ARG", "France": "FRA", "Brazil": "BRA", "Mexico": "MEX",
  "South Africa": "RSA", "South Korea": "KOR", "Korea Republic": "KOR",
  "Czechia": "CZE", "Canada": "CAN", "Bosnia": "BIH", "Qatar": "QAT",
  "Switzerland": "SUI", "Haiti": "HAI", "Scotland": "SCO", "Morocco": "MAR",
  "Paraguay": "PAR", "Australia": "AUS", "Kosovo": "KOS", "Germany": "GER",
  "Curacao": "CUW", "Curaçao": "CUW", "Ivory Coast": "CIV", "Cote d'Ivoire": "CIV",
  "Ecuador": "ECU", "Japan": "JPN", "Albania": "ALB", "Tunisia": "TUN",
  "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "New Zealand": "NZL",
  "Spain": "ESP", "Cape Verde": "CPV", "Cabo Verde": "CPV", "Saudi Arabia": "KSA",
  "Uruguay": "URU", "Senegal": "SEN", "Bolivia": "BOL", "Norway": "NOR",
  "Algeria": "ALG", "Austria": "AUT", "Jordan": "JOR", "Portugal": "POR",
  "DR Congo": "COD", "Congo DR": "COD", "Uzbekistan": "UZB", "Colombia": "COL",
  "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN"
};

interface DebugToolsProps {
  isOpen: boolean;
  onClose: () => void;
  onSeed: () => void;
  onSimulateGroups: () => void;
  onSimulateKnockouts: () => void;
  onClear: () => void;
  onTimeTravel: (timestamp: number) => void;
  isAdminMode: boolean;
  onToggleAdmin: () => void;
  lang: Translation;
  users?: UserProfile[];
  predictions?: Prediction[];
  matches?: Match[];
}

export const DebugTools: React.FC<DebugToolsProps> = ({ 
  isOpen, onClose, onSeed, onSimulateGroups, onSimulateKnockouts, onClear, onTimeTravel, isAdminMode, onToggleAdmin, lang, users = [], predictions = [], matches = []
}) => {
  const [seedingHistory, setSeedingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'setup' | 'import' | 'scouting' | 'sync' | 'time'>('time');
  
  // SQL Gen State
  const [csvContent, setCsvContent] = useState('');
  const [generatedSql, setGeneratedSql] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Diagnostic State
  const [testTeamId, setTestTeamId] = useState('SCO');
  const [testLang, setTestLang] = useState<LanguageCode>('EN');
  const [testResults, setTestResults] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [seedingScout, setSeedingScout] = useState(false);

  // Time Travel State
  const START_DATE = new Date('2026-06-10').getTime();
  const END_DATE = new Date('2026-07-20').getTime();
  const [simDate, setSimDate] = useState<number>(START_DATE);

  if (!isOpen) return null;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setSimDate(val);
  };

  const applyTimeTravel = () => {
      onTimeTravel(simDate);
      alert(`Time Travel Active!\nSimulated Date: ${new Date(simDate).toDateString()}`);
  };

  const handleSeedMockHistory = async () => {
      if(window.confirm("This will insert FAKE random history via Supabase Client. Ensure RLS allows inserts or use the SQL Importer. Continue?")) {
          setSeedingHistory(true);
          await seedMockHistoryToSupabase(TEAMS);
          setSeedingHistory(false);
          alert("Mock History Seeded!");
      }
  };

  const handleSeedScoutingData = async () => {
      if (seedingScout) return;
      if (!window.confirm("Seed Database with Local Data?\n\nThis will populate 'scouting_reports' and 'team_form_data' with initial values for all teams. Existing stats will be replaced.")) return;
      
      setSeedingScout(true);
      try {
          await Promise.all([
              seedScoutingReportsToSupabase(TEAMS),
              seedTeamStatsToSupabase(TEAMS)
          ]);
          alert("✅ Seeding Complete! Rerunning diagnostics...");
          runDiagnostics(); // Auto-check
      } catch (e) {
          console.error(e);
          alert("Error seeding data.");
      } finally {
          setSeedingScout(false);
      }
  };

  const handleSyncToCloud = async () => {
      if (!supabase) return alert("Supabase not configured! Check supabase.ts");
      if (isSyncing) return;
      setIsSyncing(true);
      setStatusMsg('Starting sync...');

      try {
          // 1. Sync Profiles
          const profilesPayload = users.map(u => ({
              email: u.email,
              name: u.name,
              avatar: u.avatar || '😊',
              tokens: u.tokens,
              substitutions: u.substitutions || 5,
              unlocked_matches: u.unlockedMatches || [],
              has_taken_second_chance: u.hasTakenSecondChance || false,
              leagues: u.leagues || [],
              spied_matches: u.spiedMatches || [],
              favorites: u.favorites || []
          }));
          
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profilesPayload, { onConflict: 'email' });
            
          if (profileError) throw profileError;

          // 2. Sync Predictions
          const predsPayload = predictions.map(p => ({
              user_id: p.userId,
              match_id: p.matchId,
              home: p.home,
              away: p.away
          }));
          
          if (predsPayload.length > 0) {
              const { error: predError } = await supabase
                .from('predictions')
                .upsert(predsPayload, { onConflict: 'user_id,match_id' });
                
              if (predError) throw predError;
          }

          // 3. Sync Matches (Status/Score only)
          const matchesPayload = matches.map(m => ({
              id: m.id,
              home_score: m.homeScore,
              away_score: m.awayScore,
              status: m.status,
              is_locked: m.isLocked,
              updated_at: new Date().toISOString()
          }));
          
          const { error: matchError } = await supabase.from('matches').upsert(matchesPayload);
          if (matchError) throw matchError;

          alert("✅ Sync Successful! Local data pushed to cloud.");
      } catch (e: any) {
          console.error(e);
          let msg = e.message;
          if (!msg) {
              try { msg = JSON.stringify(e); } catch (jsonErr) { msg = "Unknown Error"; }
          }

          if (msg.includes('uuid') || msg.includes('foreign key') || msg.includes('column')) {
             alert(`❌ Schema Mismatch.\n\nPlease go to 'SQL Setup' tab and run the script to fix the database structure.`);
          } else {
             alert(`❌ Sync Error: ${msg}`);
          }
      } finally {
          setIsSyncing(false);
          setStatusMsg('');
      }
  };

  const handleResetScores = async () => {
      if (!supabase) return alert("Supabase not configured!");
      if (!window.confirm("CONFIRM RESET SCORES?\n\nThis will reset ALL match scores to NULL and status to UPCOMING.\n\n• User predictions will NOT be deleted.\n• History will NOT be deleted.\n• This allows you to restart the simulation.")) return;

      setIsSyncing(true);
      setStatusMsg('Resetting scores...');

      try {
          const { error } = await supabase.from('matches').update({
              home_score: null,
              away_score: null,
              status: 'UPCOMING',
              is_locked: false,
              minute: null
          }).neq('id', 'placeholder');

          if (error) {
             if (error.code === '42703') { 
                 console.warn("Schema mismatch, retrying minimal...");
                 await supabase.from('matches').update({
                    home_score: null,
                    away_score: null,
                    status: 'UPCOMING'
                 }).neq('id', 'placeholder');
                 alert("✅ Match Scores Reset! (Note: Run SQL Setup to fix schema)");
                 window.location.reload();
                 return;
             }
             throw error;
          }
          alert("✅ Match Scores Reset!");
          window.location.reload();
      } catch (err: any) {
          alert("Error: " + err.message);
      } finally {
          setIsSyncing(false);
          setStatusMsg('');
      }
  };

  const handleWipeUsers = async () => {
      if (!supabase) return alert("Supabase not configured!");
      if (!window.confirm("⚠️ DANGER: WIPE ALL USERS?\n\nThis will DELETE ALL users and their predictions from the database.\n\n• You will need to Sign Up again.\n• History is SAFE.\n• This is for clearing test users.")) return;

      setIsSyncing(true);
      setStatusMsg('Wiping users...');

      try {
          const { error: predError } = await supabase.from('predictions').delete().neq('id', 0);
          if (predError) throw predError;
          const { error: profError } = await supabase.from('profiles').delete().neq('email', 'placeholder');
          if (profError) throw profError;

          localStorage.clear();
          alert("✅ All Users Wiped. Reloading...");
          window.location.reload();
      } catch (err: any) {
          alert("Error: " + err.message);
      } finally {
          setIsSyncing(false);
          setStatusMsg('');
      }
  };

  const runDiagnostics = async () => {
      if (!supabase) return;
      setTestLoading(true);
      setTestResults(null);

      const results: any = {
          scouting_reports: { status: 'pending', data: null, error: null },
          team_form_data: { status: 'pending', data: null, error: null },
          scouting_overview: { status: 'pending', data: null, error: null }
      };

      try {
          // 1. Check scouting_reports (Localized)
          const { data: repData, error: repError } = await supabase
              .from('scouting_reports')
              .select('*')
              .eq('team_id', testTeamId)
              .eq('lang', testLang);
          results.scouting_reports = { status: repError ? 'error' : 'ok', data: repData, error: repError };

          // 2. Check team_form_data (Extended Stats)
          const { data: formData, error: formError } = await supabase
              .from('team_form_data')
              .select('*')
              .eq('team_id', testTeamId);
          results.team_form_data = { status: formError ? 'error' : 'ok', data: formData, error: formError };

          // 3. Check legacy scouting_overview
          const { data: ovData, error: ovError } = await supabase
              .from('scouting_overview')
              .select('*')
              .eq('team_id', testTeamId);
          results.scouting_overview = { status: ovError ? 'error' : 'ok', data: ovData, error: ovError };

      } catch (e) {
          console.error(e);
      }

      setTestResults(results);
      setTestLoading(false);
  };

  const parseCSVLine = (line: string) => {
    const result = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
            result.push(line.substring(start, i).trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            start = i + 1;
        }
    }
    result.push(line.substring(start).trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    return result;
  };

  const generateImportSql = () => {
      if (!csvContent) {
          setStatusMsg('❌ No CSV content found');
          return;
      }
      setStatusMsg('⏳ Parsing...');
      try {
          const lines = csvContent.split(/\r?\n/);
          const records = [];
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            if (line.toLowerCase().startsWith('date') || line.toLowerCase().startsWith('group')) continue;
            const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
            if (cols.length < 4) continue;
            const dateStr = cols[0]; 
            const homeName = cols[1];
            const awayName = cols[2];
            const scoreStr = cols[3]; 
            const tournament = cols[4] || 'Friendly';
            const homeId = TEAM_MAP[homeName] || TEAM_MAP[homeName.replace(/"/g, '')];
            const awayId = TEAM_MAP[awayName] || TEAM_MAP[awayName.replace(/"/g, '')];
            if (homeId && awayId && scoreStr.includes('-')) {
                const [scoreA, scoreB] = scoreStr.split('-').map(Number);
                if (!isNaN(scoreA) && !isNaN(scoreB)) {
                    const year = new Date(dateStr).getFullYear();
                    const safeTourn = tournament.replace(/'/g, "''");
                    records.push(`('${homeId}', '${awayId}', ${scoreA}, ${scoreB}, ${isNaN(year) ? 2024 : year}, '${safeTourn}')`);
                }
            }
          }
          if (records.length === 0) {
              setStatusMsg(`❌ No valid matches found.`);
              return;
          }
          const insertStmt = `INSERT INTO head_to_head (team_a, team_b, score_a, score_b, year, competition) VALUES \n${records.join(',\n')};`;
          setGeneratedSql(insertStmt);
          setStatusMsg(`✅ Generated SQL for ${records.length} matches.`);
      } catch (err: any) {
          console.error(err);
          setStatusMsg(`❌ Error: ${err.message}`);
      }
  };

  const generateScoutingSql = () => {
      // GENERATE FROM INTERNAL DATA
      try {
          const records: string[] = [];
          const allTeams = Object.keys(TEAMS).filter(t => t !== 'TBD');
          const languages: LanguageCode[] = ['EN', 'NO', 'SCO', 'US'];
          
          allTeams.forEach(teamId => {
              languages.forEach(lang => {
                  const data = getScoutingReport(teamId, lang);
                  const safe = (s: string | undefined) => (s || '').replace(/'/g, "''");
                  
                  // Only insert if we have somewhat valid data (e.g. star player is defined)
                  if (data.star_player) {
                      records.push(`('${teamId}', '${lang}', '${safe(data.strengths)}', '${safe(data.weaknesses)}', '${safe(data.star_player)}')`);
                  }
              });
          });

          const insertStmt = `INSERT INTO scouting_reports (team_id, lang, strengths, weaknesses, star_player) VALUES \n${records.join(',\n')}\nON CONFLICT (team_id, lang) DO UPDATE SET \nstrengths=EXCLUDED.strengths, weaknesses=EXCLUDED.weaknesses, star_player=EXCLUDED.star_player;`;
          
          setGeneratedSql(insertStmt);
          setStatusMsg(`✅ Generated SQL for ${records.length} reports.`);
      } catch (err: any) {
          console.error(err);
          setStatusMsg(`❌ Error: ${err.message}`);
      }
  };

  const copyToClipboard = async (text: string) => {
      try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      } catch (err) {
          console.error('Clipboard write failed:', err);
          // Fallback mechanism using textarea
          const textArea = document.createElement("textarea");
          textArea.value = text;
          
          // Ensure it's not visible but part of DOM
          textArea.style.position = "fixed";
          textArea.style.left = "-9999px";
          textArea.style.top = "0";
          document.body.appendChild(textArea);
          
          textArea.focus();
          textArea.select();
          
          try {
              document.execCommand('copy');
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
          } catch (err2) {
              console.error('Fallback copy failed', err2);
              setStatusMsg('❌ Copy failed. Please copy manually.');
          }
          
          document.body.removeChild(textArea);
      }
  };

  const inspectorSql = `-- INSPECT YOUR DATA
-- Run this to see EXACTLY what columns and data types you have
SELECT 
  t.table_name,
  c.column_name,
  c.data_type
FROM 
  information_schema.tables t
JOIN 
  information_schema.columns c ON t.table_name = c.table_name
WHERE 
  t.table_name IN ('scouting_reports', 'team_form_data', 'scouting_overview')
  AND t.table_schema = 'public'
ORDER BY 
  t.table_name, c.ordinal_position;

-- SAMPLE ROWS (Check JSON format)
SELECT row_to_json(t) as scouting_sample FROM (SELECT * FROM scouting_reports LIMIT 1) t;
SELECT row_to_json(t) as stats_sample FROM (SELECT * FROM team_form_data LIMIT 1) t;

-- FIX PERMISSIONS (If data exists but App sees [])
ALTER TABLE scouting_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Reports" ON scouting_reports FOR SELECT USING (true);

ALTER TABLE team_form_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Stats" ON team_form_data FOR SELECT USING (true);

ALTER TABLE scouting_overview ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Overview" ON scouting_overview FOR SELECT USING (true);
`;

  const tableSql = `-- GOLDEN RESET SCRIPT & SEED
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS scouting_overview CASCADE; 
DROP TABLE IF EXISTS scouting_reports CASCADE;
DROP TABLE IF EXISTS team_form_data CASCADE;
-- DROP TABLE IF EXISTS head_to_head CASCADE; -- Protected history

-- 1. RECREATE PROFILES
CREATE TABLE profiles (
  email text PRIMARY KEY,
  name text,
  avatar text DEFAULT '😊',
  tokens int DEFAULT 5,
  substitutions int DEFAULT 5,
  unlocked_matches text[] DEFAULT array[]::text[],
  favorites text[] DEFAULT array[]::text[],
  leagues text[] DEFAULT array[]::text[],
  spied_matches text[] DEFAULT array[]::text[],
  has_taken_second_chance boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. RECREATE PREDICTIONS
CREATE TABLE predictions (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id text REFERENCES profiles(email) ON DELETE CASCADE,
  match_id text NOT NULL,
  home int,
  away int,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, match_id)
);

-- 3. RECREATE MATCHES
CREATE TABLE matches (
  id text PRIMARY KEY,
  api_id text,
  home_team_id text,
  away_team_id text,
  home_score int,
  away_score int,
  status text,
  minute int,
  is_locked boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- 4. RECREATE SCOUTING OVERVIEW (LEGACY)
CREATE TABLE scouting_overview (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  team_id text,
  team_name text,
  confederation text,
  fifa_rank bigint,
  star_player text,
  strengths text,
  weaknesses text,
  scout_notes text,
  recent_form text,
  last_5_matches text,
  created_at timestamptz DEFAULT now()
);

-- 5. RECREATE SCOUTING REPORTS (LOCALIZED)
CREATE TABLE scouting_reports (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  team_id text NOT NULL,
  lang text NOT NULL,
  strengths text,
  weaknesses text,
  star_player text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, lang)
);

-- 6. RECREATE TEAM FORM DATA (EXTENDED STATS)
CREATE TABLE team_form_data (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  team_id text NOT NULL,
  fifa_rank int,
  match_date text,
  opponent text,
  result text,
  score text,
  created_at timestamptz DEFAULT now()
);

-- 7. RECREATE HISTORY (If needed)
CREATE TABLE IF NOT EXISTS head_to_head (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  team_a text NOT NULL,
  team_b text NOT NULL,
  score_a int NOT NULL,
  score_b int NOT NULL,
  year int NOT NULL,
  competition text,
  created_at timestamptz DEFAULT now()
);

-- 8. ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_form_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE head_to_head ENABLE ROW LEVEL SECURITY;

-- 9. OPEN POLICIES
CREATE POLICY "Public Profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Predictions" ON predictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Matches" ON matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Scouting" ON scouting_overview FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Scouting Reports" ON scouting_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Team Form" ON team_form_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public History" ON head_to_head FOR ALL USING (true) WITH CHECK (true);

-- 10. SEED INITIAL DATA (SO THE APP IS NOT EMPTY)
INSERT INTO scouting_reports (team_id, lang, strengths, weaknesses, star_player) VALUES
('SCO', 'EN', 'High energy midfield. Passionate support.', 'Defensive pace. Consistency.', 'Scott McTominay'),
('SCO', 'SCO', 'McTomadona is the goat. Pure passion man.', 'We''ll find a way tae mess it up. Guarantee it.', 'Scott McTominay'),
('ARG', 'EN', 'World Champions. Messi magic.', 'High defensive line.', 'Lionel Messi'),
('USA', 'EN', 'Athleticism. High press.', 'Breaking down low blocks.', 'Christian Pulisic'),
('ENG', 'EN', 'Squad depth. Bellingham brilliance.', 'Conservative tactics under pressure.', 'Jude Bellingham');

INSERT INTO team_form_data (team_id, fifa_rank, match_date, opponent, result, score) VALUES
('SCO', 39, '2024-03-22', 'vs Netherlands', 'L', '0-4'),
('SCO', 39, '2024-03-26', 'vs N. Ireland', 'L', '0-1'),
('ARG', 1, '2024-03-22', 'vs El Salvador', 'W', '3-0'),
('USA', 11, '2024-03-24', 'vs Mexico', 'W', '2-0'),
('ENG', 4, '2024-03-26', 'vs Belgium', 'D', '2-2');
`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
           <h3 className="font-mono font-bold text-green-400 flex items-center gap-2">
             <Bot size={18} /> DEV CONSOLE
           </h3>
           <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
            {/* Tabs & Controls */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="flex gap-2 mb-4 border-b border-slate-700 pb-2 overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab('time')} className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap px-2 ${activeTab === 'time' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>Time</button>
                    <button onClick={() => setActiveTab('sync')} className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap px-2 ${activeTab === 'sync' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>Sync</button>
                    <button onClick={() => setActiveTab('setup')} className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap px-2 ${activeTab === 'setup' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>SQL</button>
                    <button onClick={() => setActiveTab('import')} className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap px-2 ${activeTab === 'import' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>Hist</button>
                    <button onClick={() => setActiveTab('scouting')} className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap px-2 ${activeTab === 'scouting' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>Scout</button>
                </div>

                {activeTab === 'time' && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-lg">
                            <h4 className="text-purple-200 text-xs font-bold mb-3 flex items-center gap-1"><Clock size={12} /> Tournament Timeline</h4>
                            <div className="flex flex-col gap-2">
                                <input type="range" min={START_DATE} max={END_DATE} step={1000 * 60 * 60 * 24} value={simDate} onChange={handleSliderChange} className="w-full accent-purple-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                    <span>June 10</span><span className="text-white font-bold">{new Date(simDate).toDateString()}</span><span>July 20</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={applyTimeTravel} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg"><Calendar size={14} /> Travel to Date</button>
                    </div>
                )}

                {activeTab === 'sync' && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="bg-blue-900/30 border border-blue-500/30 p-3 rounded-lg">
                            <h4 className="text-blue-200 text-xs font-bold mb-1 flex items-center gap-1"><CloudUpload size={12} /> Push Local State</h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed">Saves your current local simulation to the database.</p>
                        </div>
                        <button onClick={handleSyncToCloud} disabled={isSyncing} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">{isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <UploadCloud size={14} />} {isSyncing ? 'Syncing...' : 'Push to Supabase'}</button>
                    </div>
                )}

                {activeTab === 'setup' && (
                    <div className="space-y-3 animate-in fade-in">
                        <div className="bg-yellow-900/30 border border-yellow-700/50 p-3 rounded-lg text-[10px] text-yellow-200">
                            <strong>REQUIRED:</strong> Copy this script and run it in the Supabase SQL Editor. <br/>
                            It creates the tables AND inserts sample data so the app isn't empty.
                        </div>
                        
                        <div className="flex gap-2">
                            <button onClick={() => copyToClipboard(tableSql)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">{copied ? <Check size={14} /> : <Copy size={14} />} Copy Setup SQL</button>
                            <button onClick={() => copyToClipboard(inspectorSql)} className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 flex-col leading-none py-1"><div className="flex items-center gap-1"><FileSearch size={12} /> Copy Inspector</div><span className="text-[8px] opacity-70">Use this to show me your data</span></button>
                        </div>

                        <div className="bg-black/50 p-3 rounded-lg font-mono text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap border border-slate-700 h-48">
                            {tableSql}
                        </div>
                    </div>
                )}

                {activeTab === 'import' && (
                    <div className="space-y-3 animate-in fade-in">
                        <div className="text-[10px] text-slate-400 mb-1">Import Match History (CSV)</div>
                        <textarea value={csvContent} onChange={(e) => setCsvContent(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-[10px] font-mono text-white focus:border-blue-500 focus:outline-none h-24" placeholder="Format: Date,Home,Away,Score,Tournament..." />
                        <button onClick={generateImportSql} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider">Generate History SQL</button>
                        {generatedSql && (<div className="mt-2 animate-in slide-in-from-bottom-2"><button onClick={() => copyToClipboard(generatedSql)} className="w-full py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">{copied ? <Check size={14} /> : <Copy size={14} />} Copy SQL</button></div>)}
                    </div>
                )}

                {activeTab === 'scouting' && (
                    <div className="space-y-6 animate-in fade-in">
                        {/* New Diagnostics Section */}
                        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                    <Bug size={14} /> Data Diagnostics
                                </h4>
                                
                                <button 
                                    onClick={handleSeedScoutingData}
                                    disabled={seedingScout}
                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {seedingScout ? <RefreshCw size={12} className="animate-spin" /> : <Sprout size={12} />}
                                    <span>Seed DB</span>
                                </button>
                            </div>
                            
                            <div className="flex gap-2 mb-3">
                                <input 
                                    type="text" 
                                    value={testTeamId} 
                                    onChange={(e) => setTestTeamId(e.target.value.toUpperCase())}
                                    className="w-16 bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs font-mono text-white text-center"
                                    placeholder="ID"
                                />
                                <select 
                                    value={testLang} 
                                    onChange={(e) => setTestLang(e.target.value as LanguageCode)}
                                    className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs font-bold text-white"
                                >
                                    <option value="EN">EN</option>
                                    <option value="NO">NO</option>
                                    <option value="SCO">SCO</option>
                                    <option value="US">US</option>
                                </select>
                                <button onClick={runDiagnostics} disabled={testLoading} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
                                    {testLoading ? 'Running...' : 'Run Data Test'}
                                </button>
                            </div>

                            {testResults && (
                                <div className="space-y-2">
                                    {/* Report Result */}
                                    <div className={`p-2 rounded border text-[10px] font-mono ${testResults.scouting_reports.status === 'ok' && testResults.scouting_reports.data?.length ? 'bg-green-900/20 border-green-800 text-green-300' : 'bg-red-900/20 border-red-800 text-red-300'}`}>
                                        <div className="font-bold mb-1">scouting_reports (Localized)</div>
                                        <pre className="whitespace-pre-wrap overflow-x-auto">{JSON.stringify(testResults.scouting_reports.data || testResults.scouting_reports.error || "No Data Found", null, 2)}</pre>
                                    </div>

                                    {/* Stats Result */}
                                    <div className={`p-2 rounded border text-[10px] font-mono ${testResults.team_form_data.status === 'ok' && testResults.team_form_data.data?.length ? 'bg-green-900/20 border-green-800 text-green-300' : 'bg-red-900/20 border-red-800 text-red-300'}`}>
                                        <div className="font-bold mb-1">team_form_data (Stats)</div>
                                        <pre className="whitespace-pre-wrap overflow-x-auto">{JSON.stringify(testResults.team_form_data.data || testResults.team_form_data.error || "No Data Found", null, 2)}</pre>
                                    </div>
                                    
                                    {/* Legacy Result */}
                                    <div className={`p-2 rounded border text-[10px] font-mono ${testResults.scouting_overview.status === 'ok' && testResults.scouting_overview.data?.length ? 'bg-blue-900/20 border-blue-800 text-blue-300' : 'bg-slate-900/20 border-slate-800 text-slate-500'}`}>
                                        <div className="font-bold mb-1">scouting_overview (Legacy)</div>
                                        <pre className="whitespace-pre-wrap overflow-x-auto">{JSON.stringify(testResults.scouting_overview.data || "Empty", null, 2)}</pre>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Existing Export Section */}
                        <div>
                            <div className="text-[10px] text-slate-400 mb-1">Export Scouting Data to SQL</div>
                            <div className="bg-blue-900/30 p-2 rounded text-[10px] text-blue-200 mb-2">
                                This button grabs all localized data currently in the app and generates SQL INSERT statements for the <strong>scouting_reports</strong> table.
                            </div>
                            <button onClick={generateScoutingSql} className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider">Generate Localized SQL</button>
                            {generatedSql && (
                                <div className="mt-2 animate-in slide-in-from-bottom-2">
                                    <textarea readOnly value={generatedSql} className="w-full h-32 bg-black/50 text-[10px] font-mono text-green-400 p-2 rounded mb-2 border border-white/10" />
                                    <button onClick={() => copyToClipboard(generatedSql)} className="w-full py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">{copied ? <Check size={14} /> : <Copy size={14} />} Copy SQL</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Danger Zone */}
            <div className="pt-4 border-t border-slate-800">
               <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Danger Zone</h4>
               <div className="grid grid-cols-2 gap-3">
                   <button onClick={handleResetScores} className="py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg font-bold text-[10px] uppercase tracking-wider flex flex-col items-center gap-1"><Eraser size={16} /> Reset Scores</button>
                   <button onClick={handleWipeUsers} className="py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg font-bold text-[10px] uppercase tracking-wider flex flex-col items-center gap-1"><UserX size={16} /> Wipe Users</button>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};
