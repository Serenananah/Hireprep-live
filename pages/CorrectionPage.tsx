

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GeminiLiveClient } from '../services/geminiService';
import QuestionCard from '../components/Correction/QuestionCard';
import QuestionModal from '../components/Correction/QuestionModal';
import { ArrowLeftIcon } from '../components/Correction/Icons';
import { DrillItem, CorrectionModule, MasteryStatus } from '../types';

interface CorrectionPageProps {
  selectedModules: CorrectionModule[];
  onBack: () => void;
}

const CorrectionPage: React.FC<CorrectionPageProps> = ({ selectedModules, onBack }) => {
  const [drills, setDrills] = useState<DrillItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [selectedItem, setSelectedItem] = useState<DrillItem | null>(null);
  
  // Stack State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stackEntryIndex, setStackEntryIndex] = useState(100); 
  const [stackExitIndex, setStackExitIndex] = useState(-1);
  const [isTransitioningOut, setIsTransitioningOut] = useState(false);
  const [userReactions, setUserReactions] = useState<Record<string, MasteryStatus>>({});
  
  const animationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const exitInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Drag State
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'up' | null>(null);
  
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const isClick = useRef<boolean>(true);

  // Loading Placeholders
  const createLoadingBatch = (): DrillItem[] => [
      { id: 'load-1', title: 'ANALYZING HISTORY', source: 'SYSTEM', date: 'INIT', summary: 'Scanning your interview transcripts for recurring patterns...', tags: ['SCAN', 'HISTORY'], impactScore: 0, framework: '' },
      { id: 'load-2', title: 'GENERATING SCENARIOS', source: 'AI_CORE', date: 'PROC', summary: 'Creating targeted drills based on your weakness profile...', tags: ['GENERATE', 'DRILL'], impactScore: 0, framework: '' },
      { id: 'load-3', title: 'CALIBRATING DIFFICULTY', source: 'METRICS', date: 'CALIB', summary: 'Adjusting scenario complexity to your skill level...', tags: ['ADJUST', 'LEVEL'], impactScore: 0, framework: '' },
      { id: 'load-4', title: 'FINALIZING DECK', source: 'READY', date: 'DONE', summary: 'Preparing your personalized correction deck...', tags: ['FINALIZE', 'READY'], impactScore: 0, framework: '' },
  ];

  // Entry Animation
  const runEntryAnimation = useCallback(() => {
      if (animationInterval.current) clearInterval(animationInterval.current);
      let current = 12; 
      setStackEntryIndex(current);
      animationInterval.current = setInterval(() => {
          current--;
          setStackEntryIndex(current);
          if (current < -1) clearInterval(animationInterval.current!);
      }, 80);
  }, []);

  // Exit Animation (for loading cards)
  const runExitAnimation = useCallback((onComplete: () => void) => {
    if (exitInterval.current) clearInterval(exitInterval.current);
    setIsTransitioningOut(true);
    setStackExitIndex(-1);
    let current = -1;
    exitInterval.current = setInterval(() => {
        current++;
        setStackExitIndex(current);
        if (current >= 12) { 
            clearInterval(exitInterval.current!);
            onComplete();
        }
    }, 60); 
  }, []);

  // Init Data
  useEffect(() => {
      const init = async () => {
          // 1. Show Loading Stack
          setStatus('loading');
          setDrills(createLoadingBatch());
          runEntryAnimation();

          // 2. Fetch Real Data
          try {
              const generatedDrills = await GeminiLiveClient.generateCorrectionDrills(selectedModules);
              
              // 3. Exit Animation then Swap
              setTimeout(() => { // Ensure user sees loading for a bit
                 runExitAnimation(() => {
                    setDrills(generatedDrills);
                    setStatus('success');
                    setCurrentIndex(0);
                    setUserReactions({});
                    setIsTransitioningOut(false);
                    setStackExitIndex(-1);
                    runEntryAnimation(); // Fly in real cards
                 });
              }, 3000);

          } catch (e) {
              setStatus('error');
          }
      };
      init();

      return () => {
         if (animationInterval.current) clearInterval(animationInterval.current);
         if (exitInterval.current) clearInterval(exitInterval.current);
      };
  }, [selectedModules, runEntryAnimation, runExitAnimation]);


  // Drag Handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    if (isTransitioningOut) return;
    setIsDragging(true);
    startX.current = clientX;
    startY.current = clientY;
    isClick.current = true;
    setExitDirection(null);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;
    setDragX(deltaX);
    setDragY(deltaY);
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) isClick.current = false;
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    const threshold = 100;
    const currentItem = drills[currentIndex];
    
    if (Math.abs(dragX) > threshold && currentItem) {
        const isRight = dragX > 0;
        setExitDirection(isRight ? 'right' : 'left'); 
        // Logic: Right (Green) = Mastered, Left (Red) = Needs Practice
        const status: MasteryStatus = isRight ? 'mastered' : 'needs_practice';
        
        setUserReactions(prev => ({ ...prev, [currentItem.id]: status }));

        setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
            setDragX(0);
            setDragY(0);
            setExitDirection(null);
        }, 300);
    } else {
        setDragX(0);
        setDragY(0);
        setExitDirection(null);
    }
  };

  // Visual Direction helper
  const visualDir = (() => {
      if (exitDirection) return exitDirection;
      if (!isDragging) return null;
      if (dragX > 50) return 'right';
      if (dragX < -50) return 'left';
      return null;
  })();

  // Mouse/Touch Bindings
  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX, e.clientY);
  const onMouseUp = () => handleDragEnd();
  const onMouseLeave = () => { if (isDragging) handleDragEnd(); };
  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleDragEnd();

  // Report Calculation
  const reportData = useMemo(() => {
      const total = drills.length;
      if (total === 0) return null;
      
      let masteredCount = 0;
      let practiceCount = 0;
      
      drills.forEach(d => {
          if (userReactions[d.id] === 'mastered') masteredCount++;
          if (userReactions[d.id] === 'needs_practice') practiceCount++;
      });
      
      const masteryIndex = Math.round((masteredCount / total) * 100);
      
      let statusText = "NOVICE";
      if (masteryIndex > 40) statusText = "COMPETENT";
      if (masteryIndex > 80) statusText = "EXPERT";
      
      return {
          masteryIndex,
          statusText,
          masteredCount,
          practiceCount,
          total
      };
  }, [drills, userReactions]);


  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0c] text-amber-50 flex flex-col font-['Rajdhani']">
        
        {/* Background Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-20" 
             style={{ backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
        </div>

        {/* Header */}
        <header className="relative z-40 w-full border-b border-zinc-800 bg-[#0a0a0c] p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 border border-zinc-700 hover:border-amber-500 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold tracking-widest text-amber-500">CORRECTION MODULE</h2>
            </div>
            <div className="text-xs font-mono text-zinc-500">
                STATUS: {status === 'loading' ? 'GENERATING...' : 'ACTIVE'}
            </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow flex items-center justify-center relative overflow-hidden">
            
            {status === 'success' && drills.length === 0 && (
                <div className="text-zinc-500 font-mono">NO DRILLS GENERATED</div>
            )}

            {/* End of Stack: Mastery Report (Absolutely Centered) */}
            {status === 'success' && currentIndex >= drills.length && reportData && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                     <div className="w-full max-w-2xl border-2 border-zinc-700 bg-black animate-scale-in shadow-[0_0_60px_rgba(0,0,0,0.5)]">
                        {/* Decorative Header */}
                        <div className="h-2 w-full bg-gradient-to-r from-red-600 via-amber-500 to-green-500"></div>
                        
                        <div className="p-8 sm:p-10 flex flex-col">
                            <div className="flex justify-between items-start mb-8 border-b border-zinc-800 pb-4">
                                <h2 className="text-3xl font-bold tracking-widest uppercase text-white">DRILL SESSION REPORT</h2>
                                <div className="text-right">
                                    <div className="text-xs font-mono text-zinc-500">DATE: {new Date().toISOString().split('T')[0]}</div>
                                    <div className="text-xs font-mono text-amber-500">ID: SESSION_FINAL</div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-8 mb-10">
                                {/* Score Box */}
                                <div className="flex-1 flex flex-col items-center justify-center p-6 border border-zinc-800 bg-zinc-900/50">
                                    <div className="text-xs font-mono mb-2 uppercase tracking-widest text-zinc-400">MASTERY INDEX</div>
                                    <div className={`text-7xl font-bold mb-2 ${reportData.masteryIndex > 80 ? 'text-green-500' : reportData.masteryIndex > 40 ? 'text-amber-500' : 'text-red-500'}`}>
                                        {reportData.masteryIndex}%
                                    </div>
                                    <div className="px-3 py-1 text-xs font-bold font-mono uppercase border border-zinc-700 bg-zinc-900 text-white">
                                        STATUS: {reportData.statusText}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex-1 flex flex-col justify-center gap-6">
                                    <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-[-10px]">KNOWLEDGE RETENTION</div>
                                    
                                    {/* Needs Practice */}
                                    <div className="w-full">
                                        <div className="flex justify-between text-xs font-mono text-red-400 mb-1">
                                            <span>KNOWLEDGE GAPS</span>
                                            <span>{reportData.practiceCount}</span>
                                        </div>
                                        <div className="w-full h-3 border border-zinc-800 bg-zinc-900">
                                            <div className="h-full bg-red-600" style={{ width: `${(reportData.practiceCount / reportData.total) * 100}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Mastered */}
                                    <div className="w-full">
                                        <div className="flex justify-between text-xs font-mono text-green-400 mb-1">
                                            <span>RETAINED CONCEPTS</span>
                                            <span>{reportData.masteredCount}</span>
                                        </div>
                                        <div className="w-full h-3 border border-zinc-800 bg-zinc-900">
                                            <div className="h-full bg-green-600" style={{ width: `${(reportData.masteredCount / reportData.total) * 100}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-zinc-800">
                                <button onClick={onBack} className="flex-1 py-4 bg-amber-500 text-black font-bold tracking-widest hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                                    RETURN TO MENU
                                </button>
                            </div>
                        </div>
                     </div>
                 </div>
            )}

            {/* Card Stack */}
            <div className="relative w-full max-w-sm h-[520px]">
                {drills.map((item, index) => {
                    if (index < currentIndex || index > currentIndex + 5) return null;
                    
                    const isTop = index === currentIndex;
                    const dist = index - currentIndex;
                    const isVisibleInStack = index >= stackEntryIndex;
                    const hasExited = isTransitioningOut && index <= stackExitIndex;

                    // Calculate Transforms
                    const uniqueRot = isTop ? 0 : ((index * 137.5) % 10 - 5);
                    const scale = 1 - dist * 0.05;
                    const translateZ = -dist * 40;
                    const yOffset = dist * 15;
                    
                    let transform = `translate3d(0, ${yOffset}px, ${translateZ}px) scale(${scale}) rotate(${uniqueRot}deg)`;
                    let transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.5s';
                    
                    if (!isVisibleInStack) transform = `translate3d(0, 100vh, ${translateZ}px) rotate(${uniqueRot}deg)`;
                    if (hasExited) transform = `translate3d(0, -100vh, ${translateZ}px) rotate(${uniqueRot}deg)`;
                    
                    if (isTop && !isTransitioningOut && !hasExited) {
                        if (isDragging) {
                            transform = `translate3d(${dragX}px, ${dragY}px, 0) rotate(${dragX * 0.05}deg)`;
                            transition = 'none';
                        } else if (exitDirection) {
                            const flyX = exitDirection === 'right' ? window.innerWidth : -window.innerWidth;
                            transform = `translate3d(${flyX}px, 0, 0) rotate(${exitDirection === 'right' ? 45 : -45}deg)`;
                        }
                    }

                    return (
                        <div
                            key={item.id}
                            className="absolute inset-0 touch-none"
                            style={{ 
                                zIndex: 100 - dist,
                                transform,
                                transition,
                                opacity: isVisibleInStack ? 1 : 0
                            }}
                            onMouseDown={isTop ? onMouseDown : undefined}
                            onMouseMove={isTop ? onMouseMove : undefined}
                            onMouseUp={isTop ? onMouseUp : undefined}
                            onMouseLeave={isTop ? onMouseLeave : undefined}
                            onTouchStart={isTop ? onTouchStart : undefined}
                            onTouchMove={isTop ? onTouchMove : undefined}
                            onTouchEnd={isTop ? onTouchEnd : undefined}
                        >
                            <QuestionCard 
                                item={item}
                                onClick={(i) => { if(isClick.current && status === 'success') setSelectedItem(item); }}
                                readMoreLabel="VIEW FRAMEWORK"
                                isActive={isTop}
                                theme="dark"
                                swipeDirection={isTop ? visualDir : null}
                            />
                            
                            {/* Swipe Indicators */}
                            {isTop && visualDir === 'right' && (
                                <div className="absolute top-10 left-[-20px] px-4 py-2 border-2 border-green-500 bg-black text-green-500 font-bold -rotate-12 z-50 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                                    MASTERED
                                </div>
                            )}
                            {isTop && visualDir === 'left' && (
                                <div className="absolute top-10 right-[-20px] px-4 py-2 border-2 border-red-500 bg-black text-red-500 font-bold rotate-12 z-50 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                                    NEEDS PRACTICE
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </main>

        {/* Modal for Answer Framework */}
        <QuestionModal 
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            labels={{
                aiReport: "ANSWER FRAMEWORK"
            }}
            theme="dark"
        />
    </div>
  );
};

export default CorrectionPage;
