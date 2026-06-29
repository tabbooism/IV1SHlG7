'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Square, 
  Activity, 
  Shield, 
  Terminal, 
  AlertTriangle,
  Settings,
  Cpu,
  BarChart3,
  Layers,
  Database,
  Globe,
  Search,
  MessageSquare,
  Smartphone,
  Send,
  Zap,
  Lock,
  Eye,
  Info,
  FolderOpen,
  FileText,
  LogOut,
  RefreshCw,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ADVANCED_PERSONAS, INDUSTRY_TEMPLATES, SENSITIVE_AGENTS, OSINT_TRENDS, SIMULATED_STAGERS } from '@/lib/constants';
import { initAuth, googleSignIn, logout, getAccessToken } from '@/lib/auth';
import { DriveFile, listDriveFiles, searchDriveFiles } from '@/lib/google-drive';
import { User } from 'firebase/auth';

export default function TerpDashboard() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [script, setScript] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exerciseId, setExerciseId] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState(ADVANCED_PERSONAS[0]);
  const [activeTab, setActiveTab] = useState<'vishing' | 'smishing' | 'research' | 'drive' | 'logs'>('vishing');
  const [smishingHistory, setSmishingHistory] = useState<{role: 'attacker' | 'target', text: string}[]>([]);
  const [smishingInput, setSmishingInput] = useState('');
  
  // Auth & Drive State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveSearchQuery, setDriveSearchQuery] = useState('');
  const [selectedFileAnalysis, setSelectedFileAnalysis] = useState<string | null>(null);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const [researchReport, setResearchReport] = useState<string | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Load from LocalStorage
    const savedExerciseId = localStorage.getItem('exerciseId');
    const savedSmishingHistory = localStorage.getItem('smishingHistory');
    
    if (savedExerciseId) setExerciseId(savedExerciseId);
    else setExerciseId(`TRAIN-${Math.floor(1000 + Math.random() * 9000)}`);

    if (savedSmishingHistory) {
      try {
        setSmishingHistory(JSON.parse(savedSmishingHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
    
    // Initialize Auth
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Auto-save session
    if (exerciseId) localStorage.setItem('exerciseId', exerciseId);
    localStorage.setItem('smishingHistory', JSON.stringify(smishingHistory));
  }, [exerciseId, smishingHistory]);

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setDriveFiles([]);
  };

  const fetchDriveFiles = async () => {
    if (!accessToken) return;
    setIsDriveLoading(true);
    try {
      const files = await listDriveFiles(accessToken);
      setDriveFiles(files);
    } catch (err) {
      console.error("Failed to list drive files:", err);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleDriveSearch = async () => {
    if (!accessToken || !driveSearchQuery.trim()) return;
    setIsDriveLoading(true);
    try {
      const files = await searchDriveFiles(accessToken, driveSearchQuery);
      setDriveFiles(files);
    } catch (err) {
      console.error("Drive search failed:", err);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const analyzeFile = async (file: DriveFile) => {
    if (!accessToken) return;
    setIsAnalyzingDoc(true);
    setSelectedFileAnalysis(null);
    try {
      const { getFileContent } = await import('@/lib/google-drive');
      const content = await getFileContent(accessToken, file.id);
      
      const res = await fetch('/api/analyze-doc', {
        method: 'POST',
        body: JSON.stringify({ content, fileName: file.name }),
      });
      const data = await res.json();
      setSelectedFileAnalysis(data.analysis);
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setIsAnalyzingDoc(false);
    }
  };

  const handleResearch = async (topic?: string) => {
    setIsResearching(true);
    setResearchReport(null);
    try {
      const res = await fetch('/api/forecast', {
        method: 'POST',
        body: JSON.stringify({ report: topic || "General adversarial trends in voice cloning and smishing." }),
      });
      const data = await res.json();
      setResearchReport(data.forecast);
    } catch (err) {
      console.error("Research failed:", err);
    } finally {
      setIsResearching(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'drive' && accessToken && driveFiles.length === 0) {
      fetchDriveFiles();
    }
  }, [activeTab, accessToken]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        analyzeSentiment(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const exportAudio = () => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TERP_RECORDING_${exerciseId}_${Date.now()}.webm`;
    a.click();
  };

  const handleScriptImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.json')) {
        try {
          const json = JSON.parse(content);
          setScript(json.script || json.scenario || content);
        } catch (err) {
          console.error("Failed to parse JSON script", err);
        }
      } else {
        setScript(content);
      }
    };
    reader.readAsText(file);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const analyzeSentiment = async (blob: Blob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob);
      
      const res = await fetch('/api/sentiment', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      setAnalysis(data);
      
      if (data.tts_parameters) {
        generateScript(data.tts_parameters);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateScript = async (params: any) => {
    try {
      const res = await fetch('/api/scripts', {
        method: 'POST',
        body: JSON.stringify({
          prompt: "Target is showing " + (analysis?.emotion || "neutral"),
          persona: selectedPersona.name,
          parameters: params
        }),
      });
      const data = await res.json();
      setScript(data.script);
    } catch (err) {
      console.error("Script generation failed:", err);
    }
  };

  const handleSmishingSend = async () => {
    if (!smishingInput.trim()) return;
    const newHistory = [...smishingHistory, { role: 'attacker' as const, text: smishingInput }];
    setSmishingHistory(newHistory);
    setSmishingInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/scripts', {
        method: 'POST',
        body: JSON.stringify({
          prompt: `Target responded: "${smishingInput}". Generate the next step in a smishing attack for persona: ${selectedPersona.name}`,
          persona: selectedPersona.name,
        }),
      });
      const data = await res.json();
      setSmishingHistory([...newHistory, { role: 'target' as const, text: data.script }]);
    } catch (err) {
      console.error("Smishing response failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center selection:bg-primary selection:text-white">
      <div className="w-full max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="group cursor-default">
            <h1 className="text-4xl font-display font-bold tracking-tight flex items-center gap-3">
              <div className="relative">
                <Shield className="text-primary w-12 h-12 group-hover:scale-110 transition-transform" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-[8px] font-bold border-2 border-background">!</div>
              </div>
              <div className="flex flex-col">
                <span className="leading-none">TERP</span>
                <span className="text-[10px] text-primary/60 font-mono tracking-[0.4em] mt-1">RED_TEAM_OS</span>
              </div>
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <nav className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800 shadow-lg">
              {(['vishing', 'smishing', 'research', 'drive', 'logs'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all relative overflow-hidden group",
                    activeTab === tab 
                      ? "bg-neutral-800 text-white shadow-md border border-neutral-700" 
                      : "text-neutral-500 hover:text-neutral-300"
                  )}
                >
                  <span className="relative z-10">{tab}</span>
                  {activeTab === tab && <motion.div layoutId="tab-glow" className="absolute inset-0 bg-primary/5 blur-xl" />}
                </button>
              ))}
            </nav>

            {user ? (
              <div className="flex items-center gap-3 bg-neutral-900 px-4 py-2 rounded-xl border border-neutral-800">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-white leading-tight">{user.displayName}</span>
                  <button onClick={handleLogout} className="text-[8px] text-neutral-500 hover:text-red-500 transition-colors uppercase font-mono">Sign Out</button>
                </div>
                {user.photoURL && (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-neutral-700" />
                )}
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="bg-primary text-white px-4 py-2 rounded-xl font-mono text-[10px] font-bold tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <Globe size={14} /> SIGN_IN_WORKSPACE
              </button>
            )}

            <div className="flex items-center gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
              <div className="h-4 w-px bg-neutral-800 mx-1" />
              <div className="flex flex-col">
                <span className="text-[8px] text-neutral-500 font-mono uppercase leading-none">AUTH_SESSION</span>
                <span className="font-mono text-xs text-primary font-bold tracking-wider">{exerciseId}</span>
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'vishing' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Persona & Config Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              <section className="terminal-card rounded-2xl p-6 space-y-5 border-t-2 border-t-primary">
                <h3 className="text-sm font-display font-bold flex items-center gap-2 text-neutral-200">
                  <Layers className="w-4 h-4 text-primary" /> ADVERSARY_PROFILES
                </h3>
                <div className="space-y-3">
                  {ADVANCED_PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPersona(p)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border font-mono transition-all group relative overflow-hidden",
                        selectedPersona.id === p.id 
                          ? "bg-primary/5 border-primary/40 text-primary" 
                          : "bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-xs uppercase">{p.name}</span>
                        <span className="text-[8px] bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-500">{p.ttp}</span>
                      </div>
                      <div className="text-[9px] opacity-60 leading-tight line-clamp-1">{p.expertise}</div>
                      {selectedPersona.id === p.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </section>

              <section className="terminal-card rounded-2xl p-6 space-y-5">
                <h3 className="text-sm font-display font-bold flex items-center gap-2 text-neutral-200">
                  <Database className="w-4 h-4 text-primary" /> LURE_TEMPLATES
                </h3>
                <div className="max-h-[300px] overflow-auto custom-scrollbar space-y-2 pr-2">
                  {INDUSTRY_TEMPLATES.map((t) => (
                    <div key={t.id} className="p-3 bg-neutral-950/50 rounded-lg border border-neutral-900 hover:border-neutral-800 transition-colors">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-neutral-400">{t.name}</span>
                        <span className="text-[8px] text-primary/60 font-mono tracking-tighter uppercase">{t.category}</span>
                      </div>
                      <div className="text-[9px] text-neutral-600 italic leading-tight">{t.useCase}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Core Interaction Engine */}
            <div className="lg:col-span-6 space-y-6">
              <div className="terminal-card rounded-2xl p-10 relative overflow-hidden flex flex-col items-center justify-center min-h-[450px] shadow-2xl">
                {/* Background Tech Elements */}
                <div className="absolute top-4 left-4 text-[10px] font-mono text-neutral-800 select-none">SYSTEM_MONITOR::ACTIVE</div>
                <div className="absolute bottom-4 right-4 text-[10px] font-mono text-neutral-800 select-none">ENCRYPTION::STABLE</div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative mb-12">
                    <motion.div 
                      animate={isRecording ? { 
                        scale: [1, 1.1, 1],
                        rotate: isRecording ? [0, 90, 180, 270, 360] : 0
                      } : {}}
                      transition={{ 
                        scale: { duration: 1, repeat: Infinity },
                        rotate: { duration: 10, repeat: Infinity, ease: "linear" }
                      }}
                      className={cn(
                        "w-48 h-48 rounded-full border-2 border-dashed transition-all duration-700",
                        isRecording ? "border-primary/40 opacity-100" : "border-neutral-800 opacity-20"
                      )}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div 
                        animate={isRecording ? { 
                          boxShadow: ["0 0 20px rgba(239, 68, 68, 0.2)", "0 0 60px rgba(239, 68, 68, 0.5)", "0 0 20px rgba(239, 68, 68, 0.2)"]
                        } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className={cn(
                          "w-36 h-36 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                          isRecording 
                            ? "border-primary bg-primary/10 ring-12 ring-primary/5" 
                            : "border-neutral-800 bg-neutral-900"
                        )}
                      >
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={cn(
                            "w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-2xl group/btn relative overflow-hidden",
                            isRecording 
                              ? "bg-primary text-white" 
                              : "bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700"
                          )}
                        >
                          {isRecording ? <Square size={40} fill="currentColor" /> : <Mic size={40} />}
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        </button>
                      </motion.div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-3">
                    <div className="px-4 py-1.5 bg-neutral-950 rounded-full border border-neutral-800 flex items-center gap-2">
                      <Zap className={cn("w-3 h-3 transition-colors", isRecording ? "text-yellow-500 animate-pulse" : "text-neutral-700")} />
                      <span className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
                        {isRecording ? "Capture Active" : "Engine Standby"}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-neutral-600 max-w-[280px] text-center leading-relaxed">
                      {isRecording 
                        ? "ISOLATING VOCAL ARTIFACTS FOR REAL-TIME EMOTION CLONING AND MIRRORING..." 
                        : "READY FOR MULTI-VECTOR ADVERSARIAL VOICE INJECTION SIMULATION"}
                    </p>
                  </div>
                </div>

                {/* Progress Waveform */}
                {isRecording && (
                  <div className="absolute bottom-12 left-12 right-12 flex gap-1.5 items-end h-20 pointer-events-none opacity-40">
                    {[...Array(40)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [`10%`, `${20 + (i * 1.5) % 80}%`, `10%`][i % 3] }}
                        transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.02 }}
                        className="flex-1 bg-primary rounded-t-full"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Script Display */}
                <section className="terminal-card rounded-2xl p-6 space-y-5 shadow-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-mono text-neutral-500 uppercase flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-primary" /> ADVERSARY_PAYLOAD
                    </h3>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer text-[9px] font-mono text-neutral-600 hover:text-primary transition-colors flex items-center gap-1">
                        <FolderOpen className="w-3 h-3" /> IMPORT_OPS
                        <input type="file" accept=".txt,.json" className="hidden" onChange={handleScriptImport} />
                      </label>
                      <button 
                        onClick={() => {
                          if (!script) return;
                          const blob = new Blob([script], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `TERP_SCRIPT_${exerciseId}.txt`;
                          a.click();
                        }}
                        className="text-[9px] font-mono text-neutral-600 hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> EXPORT
                      </button>
                    </div>
                  </div>
                  <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-900 h-[220px] overflow-auto custom-scrollbar font-mono text-[11px] leading-relaxed shadow-inner">
                    {script ? (
                      <div className="space-y-4">
                        {script.split('\n').map((line, i) => (
                          <div key={i} className={cn(line.includes('[') ? "text-primary/90 italic font-bold border-l-2 border-primary/20 pl-3 py-1" : "text-neutral-400 pl-3")}>
                            {line}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-neutral-800 text-center px-6 gap-3">
                        <Terminal className="w-8 h-8 opacity-20" />
                        <span className="italic text-xs">Vocal capture required for script synthesis.</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Strategy Module */}
                <section className="terminal-card rounded-2xl p-6 space-y-5 border-l-4 border-l-primary shadow-lg">
                  <h3 className="text-xs font-mono text-neutral-500 uppercase flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-primary" /> TACTICAL_ANALYSIS
                  </h3>
                  <div className="text-[11px] text-neutral-400 leading-relaxed min-h-[140px] font-mono">
                    {analysis?.analysis ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div>
                          <div className="text-primary font-bold mb-2 uppercase tracking-tighter flex items-center gap-2">
                            <Lock className="w-3 h-3" /> VECTOR_ID:
                          </div>
                          <p className="bg-neutral-950 p-3 rounded-lg border border-neutral-900">
                            {analysis.analysis}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-neutral-950 p-2 rounded border border-neutral-900">
                            <div className="text-[8px] text-neutral-600 uppercase mb-1">MITRE_ID</div>
                            <div className="text-primary tracking-widest font-bold">T1598.002</div>
                          </div>
                          <div className="bg-neutral-950 p-2 rounded border border-neutral-900">
                            <div className="text-[8px] text-neutral-600 uppercase mb-1">RISK_SCORE</div>
                            <div className="text-red-500 tracking-widest font-bold">CRITICAL</div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="h-[140px] flex flex-col items-center justify-center text-neutral-800 text-center gap-3">
                        <Cpu className="w-8 h-8 opacity-20" />
                        <span className="italic text-xs">Awaiting data stream...</span>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>

            {/* Analysis Metrics Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              <section className="terminal-card rounded-2xl p-6 space-y-8 shadow-xl">
                <h3 className="text-sm font-display font-bold flex items-center gap-2 text-neutral-200">
                  <BarChart3 className="w-4 h-4 text-primary" /> ANALYTICS_ENGINE
                </h3>

                {audioUrl && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase">Playback</span>
                      <button onClick={exportAudio} className="text-[9px] font-mono text-primary hover:underline">EXPORT_WAV</button>
                    </div>
                    <audio src={audioUrl} controls className="w-full h-8 filter invert hue-rotate-180 opacity-70" />
                  </div>
                )}
                
                {analysis ? (
                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-neutral-500 uppercase mb-3 px-1">
                        <span>Target Emotion</span>
                        <span className="text-primary font-bold tracking-widest">{analysis.emotion}</span>
                      </div>
                      <div className="h-2 bg-neutral-900 rounded-full overflow-hidden p-0.5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(analysis.confidence || 0.5) * 100}%` }}
                          className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-mono border-b border-neutral-900 pb-2">
                        <span className="text-neutral-500">PITCH_VARIATION</span>
                        <span className="text-white">{(analysis.tts_parameters?.pitch || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono border-b border-neutral-900 pb-2">
                        <span className="text-neutral-500">TEMPO_INDEX</span>
                        <span className="text-white">{(analysis.tts_parameters?.speed || 1.0).toFixed(1)}x</span>
                      </div>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                      <div className="text-[8px] font-mono text-primary/60 mb-2 uppercase tracking-[0.2em] font-bold">Recommended Voice Tone</div>
                      <div className="text-xs font-mono text-primary italic font-bold">&quot;{analysis.tts_parameters?.tone || 'Neutral'}&quot;</div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[250px] flex flex-col items-center justify-center text-neutral-800 text-center gap-4">
                    <div className="w-16 h-16 rounded-full border border-neutral-900 flex items-center justify-center">
                      <Activity className="w-8 h-8 opacity-20" />
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-widest">Capture Inactive</span>
                  </div>
                )}
              </section>

              <div className="bg-neutral-900/40 rounded-2xl p-5 border border-dashed border-neutral-800 flex flex-col items-center justify-center text-center gap-3">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => <div key={i} className="w-1 h-1 bg-red-500 rounded-full" />)}
                </div>
                <p className="text-[9px] font-mono text-neutral-600 leading-relaxed uppercase tracking-tighter">
                  Real-time Watermarking Module: [ON]<br/>
                  Session Purge TTL: [168:00:00]<br/>
                  Compliance Gating: [ACTIVE]
                </p>
              </div>
            </div>

          </div>
        ) : activeTab === 'smishing' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Smishing Controls */}
            <div className="lg:col-span-4 space-y-6">
              <section className="terminal-card rounded-2xl p-6 space-y-6">
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <Smartphone className="w-6 h-6 text-primary" /> SMiShing Emulator
                </h2>
                <div className="space-y-4">
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-900">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block mb-2">Campaign Target</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="+1 (555) 000-0000" 
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono w-full focus:outline-none focus:border-primary transition-colors"
                      />
                      <button className="bg-neutral-800 p-2 rounded-lg text-neutral-400 hover:text-white transition-colors">
                        <Search size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-900">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block mb-2">Selected Adversary</label>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                        {selectedPersona.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{selectedPersona.name}</div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-tighter">{selectedPersona.ttp}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="terminal-card rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" /> PSYCHOLOGICAL_VULN
                </h3>
                <div className="space-y-2">
                  {[
                    { label: 'Scarcity/Urgency', value: 85 },
                    { label: 'Authority', value: 70 },
                    { label: 'Social Proof', value: 40 }
                  ].map((vuln) => (
                    <div key={vuln.label}>
                      <div className="flex justify-between text-[9px] font-mono text-neutral-400 mb-1">
                        <span>{vuln.label}</span>
                        <span>{vuln.value}%</span>
                      </div>
                      <div className="h-1 bg-neutral-900 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${vuln.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Virtual Phone UI */}
            <div className="lg:col-span-8 flex justify-center py-4">
              <div className="relative w-[340px] h-[680px] bg-black rounded-[50px] border-[8px] border-neutral-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* Status Bar */}
                <div className="h-12 bg-neutral-900 flex justify-between items-center px-8 text-[10px] text-white/80 font-medium">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <Activity size={10} />
                    <Zap size={10} />
                    <div className="w-5 h-2.5 border border-white/40 rounded-sm" />
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 h-[calc(100%-110px)] overflow-auto p-4 space-y-4 custom-scrollbar bg-[#050505]">
                  <div className="text-center py-4">
                    <div className="text-[10px] text-neutral-600 font-mono uppercase tracking-[0.3em]">Encrypted SMS Bridge</div>
                    <div className="text-[9px] text-neutral-800 mt-1">Today 14:28</div>
                  </div>

                  <AnimatePresence mode="popLayout">
                    {smishingHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center px-8 text-neutral-800 italic text-xs gap-3">
                        <MessageSquare className="w-12 h-12 opacity-10" />
                        Enter an initial lure to begin simulation.
                      </div>
                    ) : (
                      smishingHistory.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: msg.role === 'attacker' ? 20 : -20, y: 10 }}
                          animate={{ opacity: 1, x: 0, y: 0 }}
                          className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed font-sans",
                            msg.role === 'attacker' 
                              ? "bg-primary text-white ml-auto rounded-tr-none shadow-lg shadow-primary/10" 
                              : "bg-neutral-800 text-neutral-200 mr-auto rounded-tl-none border border-neutral-700"
                          )}
                        >
                          {msg.text}
                        </motion.div>
                      ))
                    )}
                    {isLoading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 ml-1">
                        <div className="w-1.5 h-1.5 bg-neutral-700 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-neutral-700 rounded-full animate-bounce delay-75" />
                        <div className="w-1.5 h-1.5 bg-neutral-700 rounded-full animate-bounce delay-150" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-800 px-4 flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={smishingInput}
                      onChange={(e) => setSmishingInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSmishingSend()}
                      placeholder="Type a message..." 
                      className="w-full bg-neutral-800 border-none rounded-full px-4 py-2 text-xs text-white focus:outline-none placeholder:text-neutral-500"
                    />
                  </div>
                  <button 
                    onClick={handleSmishingSend}
                    disabled={!smishingInput.trim() || isLoading}
                    className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all active:scale-90"
                  >
                    <Send size={16} />
                  </button>
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full" />
              </div>
            </div>
          </div>
        ) : activeTab === 'research' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* OSINT Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <section className="terminal-card rounded-2xl p-6 space-y-6">
                <h2 className="text-xl font-display font-bold flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  OSINT_DEEP_DIVE
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-900">
                    <h4 className="text-[10px] font-mono text-neutral-500 uppercase mb-3 flex items-center gap-2">
                      <Activity className="w-3 h-3 text-red-500" /> ACTIVE_TRENDS
                    </h4>
                    <div className="space-y-3">
                      {OSINT_TRENDS.map(trend => (
                        <div key={trend.id} className="group cursor-default">
                          <div className="flex justify-between items-center text-[11px] mb-1">
                            <span className="font-bold text-neutral-300 group-hover:text-primary transition-colors">{trend.topic}</span>
                            <span className="text-[9px] text-red-500 font-mono">{trend.impact}</span>
                          </div>
                          <div className="text-[10px] text-neutral-600 font-mono leading-tight">{trend.trend}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-900">
                    <h4 className="text-[10px] font-mono text-neutral-500 uppercase mb-3 flex items-center gap-2">
                      <Search className="w-3 h-3 text-primary" /> SEARCH_NODES
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="bg-neutral-900 p-2 rounded text-[10px] font-mono text-neutral-500 border border-neutral-800 hover:border-primary/40 transition-colors">DOMAIN_INTEL</button>
                      <button className="bg-neutral-900 p-2 rounded text-[10px] font-mono text-neutral-500 border border-neutral-800 hover:border-primary/40 transition-colors">IP_CORRELATOR</button>
                      <button className="bg-neutral-900 p-2 rounded text-[10px] font-mono text-neutral-500 border border-neutral-800 hover:border-primary/40 transition-colors">HASH_DB</button>
                      <button className="bg-neutral-900 p-2 rounded text-[10px] font-mono text-neutral-500 border border-neutral-800 hover:border-primary/40 transition-colors">LEAK_WATCH</button>
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-900 space-y-4">
                    <h4 className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                      <Layers className="w-3 h-3 text-primary" /> ADVERSARY_BLUEPRINTS
                    </h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {SIMULATED_STAGERS.map((stager) => (
                        <div key={stager.id} className="flex items-center justify-between p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 group hover:border-primary/30 transition-all">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-neutral-400 group-hover:text-primary transition-colors">{stager.name}</span>
                            <span className="text-[8px] text-neutral-700 font-mono">{stager.type}</span>
                          </div>
                          <span className="text-[8px] px-1.5 py-0.5 bg-neutral-800 text-neutral-600 rounded border border-neutral-700 font-mono">{stager.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Main Research Terminal */}
            <div className="lg:col-span-8">
              <section className="terminal-card rounded-2xl min-h-[600px] flex flex-col relative overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-neutral-900 bg-neutral-900/20 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Terminal size={18} className="text-primary" />
                    <span className="font-mono text-xs text-neutral-400">RESEARCH_TERMINAL::v2.4_STABLE</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                  </div>
                </div>

                <div className="flex-1 p-8 overflow-auto custom-scrollbar">
                  {!researchReport && !isResearching ? (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-8">
                      <div className="relative">
                        <motion.div 
                          animate={{ 
                            scale: [1, 1.05, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="w-32 h-32 bg-primary/5 rounded-full border border-primary/20 flex items-center justify-center"
                        >
                          <Cpu size={48} className="text-primary/40" />
                        </motion.div>
                        <div className="absolute inset-0 bg-primary/10 blur-3xl opacity-20" />
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-2xl font-display font-bold text-neutral-200 uppercase tracking-tighter">Adversarial Trend Engine</h3>
                        <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
                          Synthesize modern threat vectors and cultural dynamics to forecast 2026-2027 adversarial evolutions.
                        </p>
                      </div>

                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        <button 
                          onClick={() => handleResearch()}
                          className="px-8 py-3 bg-primary text-white rounded-xl font-mono text-xs font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                          <Zap size={14} /> GENERATE_SYNTHESIS
                        </button>
                        <button className="px-8 py-3 bg-neutral-800 text-neutral-300 rounded-xl font-mono text-xs font-bold hover:bg-neutral-700 transition-colors border border-neutral-700">
                          API_CONFIGURATION
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                        <h4 className="text-xs font-mono text-primary font-bold uppercase tracking-[0.2em]">INTEL_SYNTHESIS_REPORT</h4>
                        <button 
                          onClick={() => setResearchReport(null)}
                          className="text-[10px] font-mono text-neutral-600 hover:text-white"
                        >
                          RESET_CORE
                        </button>
                      </div>

                      {isResearching ? (
                        <div className="py-20 flex flex-col items-center gap-6">
                          <div className="relative">
                            <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                            <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse" />
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Correlating modern vectors...</span>
                            <div className="flex gap-1">
                              {[...Array(3)].map((_, i) => (
                                <motion.div 
                                  key={i}
                                  animate={{ opacity: [0.2, 1, 0.2] }}
                                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                  className="w-1.5 h-1.5 bg-primary rounded-full" 
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="font-mono text-xs leading-relaxed text-neutral-400 whitespace-pre-wrap bg-neutral-950/50 p-8 rounded-2xl border border-neutral-900 shadow-inner">
                          {researchReport}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-12 w-full max-w-lg grid grid-cols-2 gap-4 mx-auto">
                    <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/50 flex items-center gap-3 text-left">
                      <div className="p-2 bg-neutral-900 rounded-lg"><Zap size={14} className="text-primary/60" /></div>
                      <div>
                        <div className="text-[10px] font-mono text-neutral-400 font-bold uppercase leading-none">Core_Latency</div>
                        <div className="text-[9px] text-neutral-700 font-mono mt-1">12ms [OPTIMIZED]</div>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/50 flex items-center gap-3 text-left">
                      <div className="p-2 bg-neutral-900 rounded-lg"><Eye size={14} className="text-green-500/60" /></div>
                      <div>
                        <div className="text-[10px] font-mono text-neutral-400 font-bold uppercase leading-none">Sanitization</div>
                        <div className="text-[9px] text-green-500/50 font-mono mt-1">GATED_ISOLATION</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-neutral-950 border-t border-neutral-900 font-mono text-[9px] text-neutral-700 flex justify-between">
                  <span>SEC_PROTOCOL: v4.1-STABLE</span>
                  <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> SYSTEM_READY</span>
                  <span>TIMESTAMP: {new Date().toISOString()}</span>
                </div>
              </section>
            </div>
          </div>
        ) : activeTab === 'drive' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Drive Controls */}
            <div className="lg:col-span-4 space-y-6">
              <section className="terminal-card rounded-2xl p-6 space-y-6">
                <h2 className="text-xl font-display font-bold flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FolderOpen className="w-6 h-6 text-primary" />
                  </div>
                  DRIVE_INTEL
                </h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-900">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block mb-2">Search Workspace</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={driveSearchQuery}
                        onChange={(e) => setDriveSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleDriveSearch()}
                        placeholder="Search filenames or content..." 
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono w-full focus:outline-none focus:border-primary transition-colors"
                      />
                      <button 
                        onClick={handleDriveSearch}
                        className="bg-neutral-800 p-2 rounded-lg text-neutral-400 hover:text-white transition-colors"
                      >
                        <Search size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={fetchDriveFiles}
                      className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 flex items-center justify-center gap-2 text-[10px] font-mono text-neutral-400 hover:bg-neutral-800 transition-colors"
                    >
                      <RefreshCw size={12} className={cn(isDriveLoading && "animate-spin")} /> REFRESH
                    </button>
                    <button className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 flex items-center justify-center gap-2 text-[10px] font-mono text-neutral-400 hover:bg-neutral-800 transition-colors">
                      <Settings size={12} /> CONFIG
                    </button>
                  </div>
                </div>
              </section>

              <section className="terminal-card rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> INTEL_DENSITY
                </h3>
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-900 text-center">
                  <div className="text-3xl font-display font-bold text-primary mb-1">{driveFiles.length}</div>
                  <div className="text-[10px] font-mono text-neutral-600 uppercase">Documents Identified</div>
                </div>
              </section>
            </div>

            {/* Drive File List */}
            <div className="lg:col-span-8 space-y-6">
              <section className="terminal-card rounded-2xl min-h-[500px] flex flex-col relative overflow-hidden">
                {!accessToken ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-6">
                    <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800">
                      <Lock size={32} className="text-neutral-700" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-display font-bold text-neutral-200">Workspace Connection Required</h3>
                      <p className="text-sm text-neutral-500 max-w-sm mx-auto">Authorize Google Drive to enable deep document analysis and adversarial intel gathering.</p>
                    </div>
                    <button 
                      onClick={handleLogin}
                      className="bg-primary text-white px-8 py-3 rounded-xl font-mono text-xs font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20"
                    >
                      CONNECT_WORKSPACE
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b border-neutral-900 bg-neutral-900/20 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <FolderOpen size={16} className="text-primary" />
                        <span className="font-mono text-[10px] text-neutral-400">DRIVE_EXPLORER::ACTIVE_SESSION</span>
                      </div>
                      <span className="text-[9px] font-mono text-neutral-600 uppercase">Total_Files: {driveFiles.length}</span>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar p-2 max-h-[600px]">
                      {isDriveLoading ? (
                        <div className="h-full flex items-center justify-center">
                          <RefreshCw className="w-8 h-8 text-primary/20 animate-spin" />
                        </div>
                      ) : driveFiles.length > 0 ? (
                        <div className="grid grid-cols-1 gap-1">
                          {driveFiles.map((file) => (
                            <div 
                              key={file.id} 
                              onClick={() => analyzeFile(file)}
                              className="group flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-4 overflow-hidden">
                                <div className="p-2 bg-neutral-900 rounded-lg group-hover:bg-primary/10 transition-colors">
                                  <FileText className="w-4 h-4 text-neutral-500 group-hover:text-primary transition-colors" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-xs font-bold text-neutral-300 truncate">{file.name}</span>
                                  <span className="text-[9px] text-neutral-600 font-mono flex items-center gap-2">
                                    <Clock size={8} /> {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Unknown'}
                                    <span className="opacity-40">|</span>
                                    {file.mimeType.split('.').pop()}
                                  </span>
                                </div>
                              </div>
                              <button className="opacity-0 group-hover:opacity-100 p-2 text-primary hover:bg-primary/10 rounded-lg transition-all flex items-center gap-2 text-[10px] font-mono">
                                <Search size={14} /> ANALYZE
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-neutral-700 italic text-xs gap-3">
                          <Search className="w-12 h-12 opacity-10" />
                          No intelligence documents found.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </section>

              <AnimatePresence>
                {(isAnalyzingDoc || selectedFileAnalysis) && (
                  <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="terminal-card rounded-2xl p-6 space-y-4 border-t-4 border-primary shadow-2xl"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-display font-bold flex items-center gap-2 text-neutral-200 uppercase tracking-tighter">
                        <Activity className="w-4 h-4 text-primary" /> DOC_INTEL_REPORT
                      </h3>
                      <button 
                        onClick={() => setSelectedFileAnalysis(null)}
                        className="text-[10px] font-mono text-neutral-600 hover:text-white"
                      >
                        CLOSE
                      </button>
                    </div>

                    <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-900 font-mono text-xs leading-relaxed max-h-[400px] overflow-auto custom-scrollbar">
                      {isAnalyzingDoc ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                          <span className="text-neutral-500 animate-pulse uppercase tracking-[0.2em] text-[10px]">Processing sensitive documents...</span>
                        </div>
                      ) : (
                        <div className="space-y-4 whitespace-pre-wrap text-neutral-400">
                          {selectedFileAnalysis}
                        </div>
                      )}
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="terminal-card rounded-2xl p-8 min-h-[550px] space-y-6 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <div className="flex justify-between items-center border-b border-neutral-900 pb-6">
              <h2 className="text-2xl font-display font-bold flex items-center gap-3">
                <Terminal className="w-7 h-7 text-primary" /> OPERATIONAL_LOGS
              </h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-neutral-900 rounded-full border border-neutral-800">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-mono text-neutral-400">LOG_SERVER: ONLINE</span>
              </div>
            </div>

            <div className="font-mono text-[11px] leading-relaxed space-y-2 max-h-[400px] overflow-auto custom-scrollbar pr-4">
              <div className="flex gap-4">
                <span className="text-neutral-600 shrink-0">[{new Date().toISOString()}]</span>
                <span className="text-green-500/80 font-bold">SYSTEM_BOOT:</span>
                <span className="text-neutral-400 underline decoration-neutral-800">SUCCESSFUL_INITIALIZATION</span>
              </div>
              <div className="flex gap-4">
                <span className="text-neutral-600 shrink-0">[{new Date().toISOString()}]</span>
                <span className="text-yellow-500/80 font-bold">KERNEL_LOAD:</span>
                <span className="text-neutral-400">ENCRYPTED_ADVERSARIAL_SIM_CORE_V1.2</span>
              </div>
              <div className="flex gap-4">
                <span className="text-neutral-600 shrink-0">[{new Date().toISOString()}]</span>
                <span className="text-blue-500/80 font-bold">AUTH_WATCHER:</span>
                <span className="text-neutral-400">GATED_ACCESS_ESTABLISHED_FOR_UID: AIS_BUILDER</span>
              </div>
              <div className="flex gap-4">
                <span className="text-neutral-600 shrink-0">[{new Date().toISOString()}]</span>
                <span className="text-primary font-bold">COMPLIANCE_ID:</span>
                <span className="text-primary/80 italic">{exerciseId} :: REGISTERED_IN_CONSENT_LEDGER</span>
              </div>
              <div className="flex gap-4">
                <span className="text-neutral-600 shrink-0">[{new Date().toISOString()}]</span>
                <span className="text-purple-500/80 font-bold">OSINT_UPDATE:</span>
                <span className="text-neutral-400">TREND_SYNTHESIZER_LOADED_3_CRITICAL_VECTORS</span>
              </div>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex gap-4 opacity-40">
                  <span className="text-neutral-600 shrink-0">[{new Date().toISOString()}]</span>
                  <span className="text-neutral-500">NULL_POINTER_SAFEGUARD:</span>
                  <span className="text-neutral-700">STABILIZING_MEMORY_BLOCK_0x{(i * 1234).toString(16)}</span>
                </div>
              ))}
              <div className="text-primary animate-pulse ml-4 font-bold tracking-widest text-lg">_</div>
            </div>

            <div className="absolute bottom-6 left-8 right-8 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-4">
              <Shield className="w-5 h-5 text-primary" />
              <p className="text-[10px] text-neutral-400 leading-snug">
                All logs are encrypted with AES-256 and stored in an immutable session ledger. 
                Manual log manipulation is strictly prohibited under protocol RED_01.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="pt-12 pb-8 border-t border-neutral-900/50 flex flex-col md:flex-row justify-between gap-8 text-[11px] font-mono text-neutral-600">
          <div className="flex flex-wrap gap-8">
            <div className="space-y-1">
              <span className="flex items-center gap-2 text-neutral-400"><Settings className="w-3.5 h-3.5" /> SECURITY_ENVIRONMENT</span>
              <span className="block opacity-60">GATED_RESEARCH_LAB_ALPHA</span>
            </div>
            <div className="space-y-1">
              <span className="flex items-center gap-2 text-primary/80 font-bold"><AlertTriangle className="w-3.5 h-3.5" /> ADVERSARIAL_ETHICS</span>
              <span className="block opacity-60">TRAINING_USE_ONLY_PROTOCOL</span>
            </div>
            <div className="space-y-1">
              <span className="flex items-center gap-2 text-neutral-400"><Layers className="w-3.5 h-3.5" /> DEPLOYMENT_KIND</span>
              <span className="block opacity-60">LOCAL_SANDBOX_V1</span>
            </div>
          </div>
          <div className="text-right flex flex-col justify-end">
            <div className="text-primary font-bold text-lg leading-none mb-1 group cursor-default">
              TERP <span className="opacity-40 group-hover:opacity-100 transition-opacity">v.0.1.28</span>
            </div>
            <div className="opacity-40 uppercase tracking-widest text-[9px]">Advanced Threat Emulation Platform</div>
          </div>
        </footer>
      </div>
    </main>
  );
}
