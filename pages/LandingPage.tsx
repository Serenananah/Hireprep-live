

import React, { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

import Galaxy from "../components/Galaxy";
import Starfield from "../components/Starfield";
import { GalaxyConfig, CorrectionModule } from "../types";
import { interviewHistoryService } from "../services/interviewHistoryService";
import { GeminiLiveClient } from "../services/geminiService";

// Fix for JSX intrinsic element errors
const Color = 'color' as any;
const Group = 'group' as any;

interface LandingPageProps {
  onStart: () => void;
  onStartCorrection: (modules: CorrectionModule[]) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onStartCorrection }) => {
  // Galaxy background configuration
  const [config] = useState<GalaxyConfig>({
    count: 40000,
    size: 0.012,
    radius: 5,
    branches: 4,
    spin: 1.2,
    randomness: 0.8,
    randomnessPower: 2.5,
    insideColor: "#ff8a5b",
    outsideColor: "#2b5aff",
  });

  const [showCorrection, setShowCorrection] = useState(false);
  const [isLoadingCorrection, setIsLoadingCorrection] = useState(false);
  const [correctionModules, setCorrectionModules] = useState<CorrectionModule[]>([]);
  
  // Selection State
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

  const handleFetchModules = async () => {
    const history = interviewHistoryService.getSessionHistory();
    if (!history || history.length === 0) {
      alert("No interview history found. Please complete at least one simulation first.");
      return;
    }

    setIsLoadingCorrection(true);
    try {
      // Analyze history and generate 6 modules
      const modules = await GeminiLiveClient.generateCorrectionModules(history);
      setCorrectionModules(modules);
      setShowCorrection(true);
    } catch (e) {
      console.error(e);
      alert("Failed to analyze history.");
    } finally {
      setIsLoadingCorrection(false);
    }
  };

  const toggleModuleSelection = (id: string) => {
      setSelectedModuleIds(prev => 
         prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
      );
  };

  const handleInitiateDrill = () => {
      if (selectedModuleIds.length === 0) return;
      const selectedMods = correctionModules.filter(m => selectedModuleIds.includes(m.id));
      onStartCorrection(selectedMods);
  };

  const getThemeColors = (theme: string, isSelected: boolean) => {
    const base = isSelected ? 'bg-white/10 border-white/40' : '';
    switch(theme) {
      case 'orange': return `${base} ${isSelected ? 'shadow-[0_0_20px_rgba(249,115,22,0.3)]' : ''} border-orange-500 text-orange-400`;
      case 'cyan': return `${base} ${isSelected ? 'shadow-[0_0_20px_rgba(6,182,212,0.3)]' : ''} border-cyan-500 text-cyan-400`;
      case 'purple': return `${base} ${isSelected ? 'shadow-[0_0_20px_rgba(168,85,247,0.3)]' : ''} border-purple-500 text-purple-400`;
      case 'green': return `${base} ${isSelected ? 'shadow-[0_0_20px_rgba(16,185,129,0.3)]' : ''} border-emerald-500 text-emerald-400`;
      case 'blue': return `${base} ${isSelected ? 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' : ''} border-blue-500 text-blue-400`;
      case 'gray': return `${base} ${isSelected ? 'shadow-[0_0_20px_rgba(148,163,184,0.3)]' : ''} border-slate-500 text-slate-400`;
      default: return 'border-white/20 text-white';
    }
  };

  return (
    <div className="relative w-full h-full bg-black selection:bg-cyan-500 selection:text-black overflow-hidden font-['Rajdhani']">
      
      {/* 3D Background Layer */}
      <div className="fixed inset-0 z-0">
        <Canvas
          camera={{ position: [0, 3.0, 5.0], fov: 55 }}
          gl={{
            antialias: false,
            powerPreference: "high-performance",
            alpha: false,
          }}
          dpr={[1, 2]}
        >
          <Color attach="background" args={["#050505"]} />

          <Suspense fallback={null}>
            <Group rotation={[0, 0, Math.PI / 8]}>
              <Galaxy config={config} />
            </Group>
            <Starfield />
          </Suspense>

          <OrbitControls
            enablePan={false}
            enableZoom
            rotateSpeed={0.4}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>

        {/* Cinematic Overlays */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
        <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>


      {/* Foreground Scrollable Layer */}
      <div className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden pointer-events-none">
        
        {/* Navigation Bar */}
        <nav className="w-full flex justify-between items-center px-8 py-6 sticky top-0 z-50 transition-all duration-300 pointer-events-auto">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-md border-b border-white/5 shadow-lg"></div>

          <div className="relative flex items-center gap-3 z-10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
            </div>
            <span className="text-2xl font-bold tracking-[0.1em] text-white/50 mix-blend-difference">
              Synthara
            </span>
          </div>
        </nav>

        {!showCorrection ? (
          /* HERO SECTION */
          <header className="flex-1 flex flex-col justify-center items-center px-4 min-h-screen relative -mt-24">
            <div className="max-w-5xl w-full text-center space-y-6 relative z-10">

              <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-white/50 mix-blend-difference leading-none pb-2 select-none uppercase">
                HirePrep
              </h1>

              <p className="text-xl md:text-3xl text-white mix-blend-difference max-w-3xl mx-auto leading-relaxed font-normal select-none tracking-[0.15em] [text-shadow:0_0_10px_rgba(255,255,255,0.8),0_0_20px_rgba(255,255,255,0.6),0_0_40px_rgba(255,255,255,0.4)]">
                Stay Hungry Stay Foolish
              </p>

              <div className="flex flex-col items-center gap-4 pt-6 pointer-events-auto">
                <button
                  onClick={onStart}
                  className="group relative px-8 py-3 bg-[rgba(255,255,255,0.1)] border border-white/20 backdrop-blur-[20px] rounded-xl text-white/70 hover:text-white transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:border-cyan-400/50 w-64"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                  <span className="relative z-10 font-bold tracking-[0.2em] text-xs flex items-center justify-center gap-2">
                    START SIMULATION
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </span>
                </button>

                <button
                  onClick={handleFetchModules}
                  disabled={isLoadingCorrection}
                  className="group relative px-8 py-3 bg-[rgba(255,255,255,0.05)] border border-white/20 backdrop-blur-[20px] rounded-xl text-white/70 hover:text-amber-400 transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:border-amber-500/50 w-64"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                  <span className="relative z-10 font-bold tracking-[0.2em] text-xs flex items-center justify-center gap-2">
                    {isLoadingCorrection ? <Loader2 className="w-4 h-4 animate-spin" /> : "START CORRECTION"}
                    {!isLoadingCorrection && <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>}
                  </span>
                </button>
              </div>
            </div>
          </header>
        ) : (
          /* CORRECTION MODULES GRID */
          <div className="flex-1 flex flex-col justify-center items-center px-4 min-h-screen relative -mt-10 py-20 pointer-events-auto">
             
             <div className="relative z-20 w-full max-w-6xl mb-12 text-center animate-fade-in">
                <button 
                  onClick={() => setShowCorrection(false)}
                  className="absolute left-0 top-0 flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-white/40 hover:text-white transition-colors"
                >
                   <ArrowLeft className="w-4 h-4" /> BACK
                </button>
                <h2 className="text-4xl font-bold text-white tracking-tight [text-shadow:0_0_20px_rgba(255,255,255,0.5)]">
                  SELECT CORRECTION MODULE
                </h2>
                <div className="mt-2 flex items-center justify-center gap-3">
                   <div className="h-[1px] w-12 bg-amber-500/50"></div>
                   <p className="text-xs font-mono text-amber-500 tracking-[0.3em] uppercase bg-amber-500/10 px-3 py-1 rounded border border-amber-500/20">
                      Multi-Select Enabled :: {selectedModuleIds.length} Selected
                   </p>
                   <div className="h-[1px] w-12 bg-amber-500/50"></div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl relative z-20 animate-fade-in-up">
                {correctionModules.map((module) => {
                  const isSelected = selectedModuleIds.includes(module.id);
                  return (
                    <div 
                        key={module.id}
                        onClick={() => toggleModuleSelection(module.id)}
                        className={`
                        group relative h-40 bg-black/40 backdrop-blur-md border rounded-none 
                        hover:bg-white/5 transition-all duration-300 cursor-pointer overflow-hidden
                        flex flex-col justify-center p-8 select-none
                        ${getThemeColors(module.theme, isSelected)}
                        `}
                    > 
                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-50"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current opacity-50"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-current opacity-50"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-50"></div>
                        
                        {/* Selection Checkmark */}
                        {isSelected && (
                            <div className="absolute top-3 right-3 text-current animate-scale-in">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        )}
                        {!isSelected && (
                            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-current shadow-[0_0_10px_currentColor] animate-pulse"></div>
                        )}

                        {/* Content */}
                        <div className="relative z-10 space-y-2">
                            <h3 className="text-xl font-bold tracking-[0.15em] text-white uppercase group-hover:scale-105 transition-transform origin-left">
                                {module.title}
                            </h3>
                            <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                <div className="h-[1px] w-8 bg-current"></div>
                                <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-current">
                                    {module.subtitle}
                                </span>
                            </div>
                            <div className="pt-2 text-[10px] text-gray-400 font-mono tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                                MODULE_ID :: {module.id}
                            </div>
                        </div>

                        {/* Hover Scanline */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 pointer-events-none"></div>
                    </div>
                  );
                })}
             </div>
             
             <div className="relative z-20 mt-12 w-full max-w-6xl">
                 <button 
                    onClick={handleInitiateDrill}
                    disabled={selectedModuleIds.length === 0}
                    className={`w-full py-4 border font-bold tracking-[0.3em] transition-all duration-300 ${
                        selectedModuleIds.length > 0 
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-black shadow-[0_0_30px_rgba(245,158,11,0.2)]' 
                        : 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                    }`}
                 >
                    INITIATE SEQUENCE &gt;
                 </button>
             </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default LandingPage;
