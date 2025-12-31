

import React from 'react';
import { DrillItem, Theme, SwipeDirection } from '../../types';

interface QuestionCardProps {
  item: DrillItem;
  onClick: (item: DrillItem) => void;
  readMoreLabel: string;
  isActive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  theme: Theme;
  swipeDirection?: SwipeDirection;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ item, onClick, readMoreLabel, isActive, className, style, theme, swipeDirection }) => {
  const isDark = theme === 'dark';

  // Map directions to color schemes
  // Right (Green) = Mastered
  // Left (Red) = Needs Practice / Not Mastered
  const colorMap = {
      default: { 
          border: 'border-amber-500', 
          bg: 'bg-amber-500', 
          text: 'text-amber-500', 
          lightBg: 'bg-amber-50', 
          darkBg: 'bg-amber-500/10', 
          glow: 'text-glow', 
          shadow: isDark ? 'shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 'shadow-[0_0_30px_rgba(245,158,11,0.2)]'
      },
      mastered: { 
          border: 'border-green-500', 
          bg: 'bg-green-500', 
          text: 'text-green-500', 
          lightBg: 'bg-green-50', 
          darkBg: 'bg-green-500/10', 
          glow: 'text-glow-green', 
          shadow: 'shadow-[0_0_40px_rgba(34,197,94,0.5)]' 
      },
      retry: { 
          border: 'border-red-500', 
          bg: 'bg-red-500', 
          text: 'text-red-500', 
          lightBg: 'bg-red-50', 
          darkBg: 'bg-red-500/10', 
          glow: 'text-glow-red', 
          shadow: 'shadow-[0_0_40px_rgba(239,68,68,0.5)]' 
      },
  };

  let schemeKey: keyof typeof colorMap = 'default';
  if (swipeDirection === 'right') schemeKey = 'mastered';
  else if (swipeDirection === 'left') schemeKey = 'retry';

  const scheme = colorMap[schemeKey];

  const containerClasses = isDark 
    ? `bg-zinc-900 ${isActive ? `${scheme.border} ${scheme.shadow}` : 'border-zinc-700'}`
    : `bg-white ${isActive ? `${scheme.border} ${scheme.shadow}` : 'border-zinc-300'}`;

  const headerClasses = isDark
    ? `${isActive ? `${scheme.darkBg} ${scheme.border}` : 'bg-zinc-800 border-zinc-700'}`
    : `${isActive ? `${scheme.lightBg} ${scheme.border}` : 'bg-zinc-100 border-zinc-200'}`;

  const contentBodyClasses = isDark
    ? 'bg-zinc-950'
    : 'bg-zinc-50';

  const titleClasses = isActive 
    ? (isDark ? `text-white ${scheme.glow}` : 'text-zinc-900 text-glow-light')
    : (isDark ? 'text-zinc-400' : 'text-zinc-500');

  const textClasses = isActive
    ? (isDark ? 'text-zinc-300' : 'text-zinc-700')
    : (isDark ? 'text-zinc-600' : 'text-zinc-400');

  const footerClasses = isDark
    ? `${isActive ? `${scheme.bg} ${scheme.border}` : 'bg-zinc-800 border-zinc-700'}`
    : `${isActive ? `${scheme.bg} ${scheme.border}` : 'bg-zinc-100 border-zinc-200'}`;

  const dataUnitColor = isActive ? scheme.bg : (isDark ? 'bg-zinc-600' : 'bg-zinc-400');
  const dataUnitText = isActive ? scheme.text : (isDark ? 'text-zinc-500' : 'text-zinc-400');

  return (
    <div 
      className={`group relative flex flex-col border-4 transition-all duration-200 w-full h-full select-none overflow-hidden ${
        isActive 
          ? 'scale-[1.02]' 
          : 'grayscale opacity-70'
      } ${containerClasses} ${className || ''}`}
      onClick={() => onClick(item)}
      style={style}
    >
      {/* Screw Decorations */}
      {[
        'top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'
      ].map((pos, idx) => (
        <div key={idx} className={`absolute ${pos} w-2 h-2 rounded-full border z-20 ${isDark ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-200 border-zinc-400'}`}>
          <div className={`w-full h-[1px] absolute top-1/2 -translate-y-1/2 rotate-45 ${isDark ? 'bg-zinc-600' : 'bg-zinc-400'}`}></div>
        </div>
      ))}

      {/* Cassette/Data Header */}
      <div className={`h-16 w-full border-b-2 p-4 flex items-center justify-between relative ${headerClasses}`}>
         {/* Diagonal Stripes Pattern */}
         <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
             backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 5px, ${isDark ? '#000' : '#999'} 5px, ${isDark ? '#000' : '#999'} 10px)`
         }}></div>
         
         <div className="z-10 flex items-center gap-2">
            <div className={`w-3 h-3 ${isActive ? `${dataUnitColor} animate-pulse` : dataUnitColor} rounded-sm`}></div>
            <span className={`text-xs tracking-[0.2em] font-bold ${dataUnitText}`}>
                DRILL_UNIT_01
            </span>
         </div>
         <div className={`z-10 text-xs font-mono opacity-60 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
            {item.date}
         </div>
      </div>
      
      {/* Content Body */}
      <div className={`p-6 sm:p-8 flex flex-col flex-grow relative ${contentBodyClasses}`}>
        {/* Vertical line deco */}
        <div className={`absolute left-4 top-4 bottom-4 w-[1px] ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>

        <div className="pl-6 flex flex-col h-full">
            <div className="mb-4 flex items-center">
                <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest border ${
                    isActive 
                        ? 'border-cyan-500 text-cyan-500' 
                        : (isDark ? 'border-zinc-600 text-zinc-600' : 'border-zinc-300 text-zinc-400')
                }`}>
                    TARGET :: {item.source}
                </span>
            </div>

            {/* Abbreviated Title */}
            <h3 className={`text-lg sm:text-2xl font-bold font-display uppercase tracking-tight mb-6 ${titleClasses}`}>
              {item.title}
            </h3>

            <div className={`h-[1px] w-12 mb-6 ${isActive ? scheme.bg : (isDark ? 'bg-zinc-700' : 'bg-zinc-300')}`}></div>

            {/* Detailed Question (Scrollable if too long, but visible) */}
            <div className={`flex-grow overflow-y-auto mb-6 pr-2 custom-scrollbar`}>
                <p className={`text-lg sm:text-xl font-medium leading-loose font-sans normal-case ${textClasses}`}>
                  {item.summary}
                </p>
            </div>

            <div className="mt-auto flex flex-wrap gap-2">
                {item.tags.slice(0, 3).map((tag, idx) => (
                    <div key={idx} className={`text-[10px] uppercase px-2 py-1 border ${
                        isActive 
                            ? (isDark ? 'border-zinc-700 text-zinc-400 bg-zinc-900' : 'border-zinc-300 text-zinc-600 bg-white') 
                            : (isDark ? 'border-zinc-800 text-zinc-700' : 'border-zinc-200 text-zinc-400')
                    }`}>
                        {tag}
                    </div>
                ))}
            </div>
        </div>
      </div>
      
      {/* Footer / Grip */}
      <div className={`h-12 border-t-2 flex items-center justify-between px-4 ${footerClasses}`}>
        <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-1 h-4 ${isActive ? 'bg-black/40' : (isDark ? 'bg-black/20' : 'bg-black/10')}`}></div>
            ))}
        </div>
        <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-black' : (isDark ? 'text-zinc-500' : 'text-zinc-400')}`}>
          {readMoreLabel} &gt;&gt;
        </span>
      </div>
    </div>
  );
};

export default QuestionCard;
