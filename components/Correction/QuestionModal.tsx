

import React, { useEffect, useState } from 'react';
import { DrillItem, Theme } from '../../types';
import { XIcon, GlobeIcon } from './Icons';

interface QuestionModalProps {
  item: DrillItem | null;
  onClose: () => void;
  labels: {
    aiReport: string;
  };
  theme: Theme;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ item, onClose, labels, theme }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [renderItem, setRenderItem] = useState<DrillItem | null>(null);

  // Sync item to renderItem to keep content during exit animation
  useEffect(() => {
    if (item) {
      setRenderItem(item);
      requestAnimationFrame(() => setIsVisible(true));
    }
  }, [item]);

  // Handle Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      setRenderItem(null);
    }, 500); 
  };

  if (!renderItem) return null;

  const isDark = theme === 'dark';

  // Styles
  const overlayBg = isDark 
    ? 'bg-zinc-950/95 linear-gradient(rgba(10, 10, 10, 0.8) 1px, transparent 1px)' 
    : 'bg-zinc-100/95 linear-gradient(rgba(200, 200, 200, 0.8) 1px, transparent 1px)';
    
  const gridColor = isDark ? 'rgba(10, 10, 10, 0.8)' : 'rgba(220, 220, 220, 0.8)';
  
  const modalBorder = isDark ? 'border-amber-500 bg-black' : 'border-amber-600 bg-white';
  const shadow = isDark ? 'shadow-[0_0_50px_rgba(245,158,11,0.2)]' : 'shadow-[0_0_50px_rgba(245,158,11,0.15)]';
  
  const headerBg = isDark ? 'bg-amber-500 text-black' : 'bg-amber-500 text-white';
  const closeBtn = isDark 
    ? 'bg-black text-amber-500 hover:bg-amber-900' 
    : 'bg-white text-amber-600 hover:bg-amber-100';

  const contentText = isDark ? 'text-amber-50' : 'text-zinc-900';
  const summaryText = isDark ? 'text-zinc-300' : 'text-zinc-700';
  const tagBg = isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-400' : 'bg-zinc-100 border-zinc-300 text-zinc-600';

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 transition-all duration-500 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      {/* Retro Grid Backdrop */}
      <div 
        className={`absolute inset-0 backdrop-blur-sm transition-all duration-500 ${isDark ? 'bg-zinc-950/95' : 'bg-zinc-50/95'}`}
        style={{
            backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
        }}
        onClick={handleClose}
      />

      {/* Terminal Window */}
      <div className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col border-2 ${modalBorder} ${shadow} overflow-hidden retro-shadow ${isVisible ? 'animate-scale-in' : 'animate-scale-out'}`}>
        
        {/* Terminal Header Bar */}
        <div className={`flex items-center justify-between p-2 ${headerBg} select-none`}>
          <div className="flex items-center gap-4 px-2">
             <span className="text-xs font-bold uppercase tracking-widest">/// FRAMEWORK :: {renderItem.id.split('-')[1] || 'UNKNOWN'}</span>
          </div>
          <button 
            onClick={handleClose}
            className={`w-6 h-6 flex items-center justify-center transition-colors ${closeBtn}`}
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className={`overflow-y-auto p-6 sm:p-10 space-y-8 custom-scrollbar ${contentText}`}>
            
            {/* Header / Meta */}
            <div className="border-l-2 border-cyan-500 pl-4">
                <div className="flex items-center gap-2 mb-2 text-cyan-500 text-xs font-mono tracking-wider">
                    <GlobeIcon className="w-3 h-3" /> 
                    <span>TRAINING_MODULE :: {renderItem.source.toUpperCase()}</span>
                </div>
                <h2 className={`text-2xl sm:text-3xl font-bold font-display uppercase leading-none tracking-wide mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    {renderItem.title}
                </h2>
                <div className={`text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>ID: {renderItem.date}</div>
            </div>

            {/* Section 1: The Question */}
            <div className={`p-5 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 opacity-60 ${contentText}`}>Interview Question</h3>
                <p className={`text-lg sm:text-xl font-medium leading-relaxed font-sans ${contentText}`}>
                    {renderItem.summary}
                </p>
            </div>

            {/* Section 2: Framework & Answer */}
            <div className="prose prose-invert max-w-none font-mono whitespace-pre-wrap">
               <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 opacity-60 ${contentText}`}>Strategy & Gold Standard Answer</h3>
               <div className={`text-sm leading-loose opacity-90 p-4 border-l-2 border-dashed ${isDark ? 'border-zinc-700' : 'border-zinc-300'} ${summaryText}`}>
                  {renderItem.framework || "No framework data available."}
               </div>
            </div>

            {/* Tag Cloud */}
            <div className="flex flex-wrap gap-3 font-mono text-xs pt-4 border-t border-zinc-800">
                {renderItem.tags.map((tag, i) => (
                    <span key={i} className={`px-2 py-1 uppercase border ${tagBg}`}>
                        [{tag}]
                    </span>
                ))}
            </div>
        </div>
        
        {/* Footer Status Bar */}
        <div className={`p-2 border-t flex justify-between text-[10px] font-mono uppercase ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-600' : 'bg-zinc-100 border-zinc-200 text-zinc-400'}`}>
            <span>STATUS: READY</span>
            <span>DIFFICULTY: {renderItem.impactScore}%</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionModal;
