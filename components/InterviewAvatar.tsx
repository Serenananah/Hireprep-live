// components/InterviewAvatar.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { FacialExpression, HeadMovement, EyeBehavior, BehaviorState } from '../types';

interface AvatarProps {
  currentStep: BehaviorState | null;
  isSpeaking: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ currentStep, isSpeaking }) => {
  const [blink, setBlink] = useState(false);

  const state = useMemo(() => ({
    expression: currentStep?.facial_expression || 'neutral',
    head: currentStep?.head_movement || 'still',
    eyes: currentStep?.eye_behavior || 'maintain_gaze',
  }), [currentStep]);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    if (state.eyes === 'blink') {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }
  }, [state.eyes]);

  const featureColor = "#2D1B00";
  const transitionStyle = { transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)' };

  const getMouthPath = () => {
    switch (state.expression) {
      case 'smile': return "M 32 70 Q 50 85 68 70";
      case 'joyful': return "M 30 65 Q 50 95 70 65 L 65 62 Q 50 75 35 62 Z";
      case 'slight_smile': return "M 38 72 Q 50 78 62 72";
      case 'thinking': return "M 42 75 Q 48 72 55 76"; 
      case 'attentive': return "M 45 74 L 55 74"; 
      case 'confused': return "M 38 76 Q 45 70 52 76 Q 60 82 65 76";
      case 'surprised': return "M 42 82 A 8 10 0 1 0 58 82 A 8 10 0 1 0 42 82";
      case 'skeptical': return "M 38 78 Q 50 75 65 72";
      case 'sad': return "M 32 82 Q 50 68 68 82";
      case 'angry': return "M 35 80 Q 50 74 65 80 L 65 78 Q 50 72 35 78 Z";
      case 'determined': return "M 40 75 L 60 75";
      case 'playful': return "M 35 68 Q 50 90 65 68"; 
      case 'pleading': return "M 40 78 Q 50 75 60 78"; 
      case 'sleepy': return "M 45 76 Q 50 75 55 76";
      case 'cool': return "M 35 75 Q 50 85 65 75";
      case 'loving': return "M 32 72 Q 50 92 68 72"; 
      default: return "M 42 74 L 58 74";
    }
  };

  const getHeadStyle = () => {
    let transform = 'perspective(500px) ';
    let shadowX = 0;
    let shadowY = 15;

    switch (state.head) {
      case 'tilt_left': 
        transform += 'rotateY(-10deg) rotateZ(-5deg) translateX(-5px)'; 
        shadowX = 10;
        break;
      case 'tilt_right': 
        transform += 'rotateY(10deg) rotateZ(5deg) translateX(5px)'; 
        shadowX = -10;
        break;
      case 'nod': 
        transform += 'rotateX(15deg) translateY(8px)'; 
        shadowY = 5;
        break;
      case 'slight_nod': 
        transform += 'rotateX(8deg) translateY(4px)'; 
        shadowY = 10;
        break;
      case 'shake': 
        transform += 'rotateY(15deg) translateX(5px)'; 
        shadowX = -8;
        break;
      case 'lean_forward': 
        transform += 'translateZ(50px) translateY(10px) rotateX(10deg)'; 
        shadowY = 25;
        break;
      case 'lean_back': 
        transform += 'translateZ(-30px) translateY(-5px) rotateX(-10deg)'; 
        shadowY = 5;
        break;
      default: 
        transform += 'none';
    }
    return { transform, filter: `drop-shadow(${shadowX}px ${shadowY}px 25px rgba(0,0,0,0.3))` };
  };

  const getFeatureTransform = () => {
    switch (state.head) {
      case 'tilt_left': return 'translate(-4px, 0)';
      case 'tilt_right': return 'translate(4px, 0)';
      case 'nod': return 'translate(0, 5px)';
      case 'lean_forward': return 'translate(0, 8px)';
      case 'shake': return 'translate(6px, 0)';
      default: return 'translate(0, 0)';
    }
  };

  const getEyeData = (side: 'left' | 'right') => {
    const expr = state.expression;
    if (blink && expr !== 'sleepy') return { type: 'blink' };
    
    if (expr === 'loving') return { type: 'heart', scale: 1.6 };
    if (expr === 'cool') return { type: 'shades' };
    if (expr === 'sleepy') return { type: 'closed-arch' };
    if (expr === 'joyful') return { type: 'arch', scale: 1.4 };
    if (expr === 'pleading') return { type: 'watery', scale: 1.3 };
    if (expr === 'wink' && side === 'right') return { type: 'arch' };
    if (expr === 'angry') return { type: 'circle', scale: 0.8, look: 'center' };
    if (expr === 'surprised') return { type: 'circle', scale: 1.4 };
    if (expr === 'thinking') return { type: 'circle', scale: 1.0, look: 'up' };
    
    return { type: 'circle', scale: 1.0 };
  };

  /**
   * 眉毛算法优化：
   * 1. 移除了 joyful 和 loving 表情的眉毛。
   * 2. 基准点保持在 Y=31 附近。
   */
  const getBrowData = (side: 'left' | 'right') => {
    const expr = state.expression;
    
    // 要求：去掉 joyful 和 loving 的眉毛
    if (expr === 'joyful' || expr === 'loving') {
      return { d: '', transform: '' };
    }

    let transform = '';
    // 基础路径
    const baseLineY = 31;
    let d = side === 'left' ? `M 25 ${baseLineY} L 41 ${baseLineY}` : `M 59 ${baseLineY} L 75 ${baseLineY}`;

    if (expr === 'surprised') {
      transform = 'translateY(-12px)';
      d = side === 'left' ? "M 25 34 Q 33 20 41 34" : "M 59 34 Q 67 20 75 34";
    } else if (expr === 'angry') {
      transform = 'translateY(5px)';
      d = side === 'left' ? "M 25 31 L 41 40" : "M 59 40 L 75 31";
    } else if (expr === 'thinking') {
      transform = side === 'left' ? 'translateY(-4px) rotate(-8deg)' : 'translateY(2px) rotate(4deg)';
    } else if (expr === 'skeptical') {
      transform = side === 'right' ? 'translateY(-8px) rotate(-15deg)' : 'translateY(1px) rotate(8deg)';
    } else if (expr === 'sad' || expr === 'pleading') {
      d = side === 'left' ? "M 25 38 Q 33 28 41 32" : "M 59 32 Q 67 28 75 38";
    }

    return { d, transform };
  };

  const leftEye = getEyeData('left');
  const rightEye = getEyeData('right');
  const leftBrow = getBrowData('left');
  const rightBrow = getBrowData('right');

  return (
    <div className="relative w-80 h-80 flex items-center justify-center bg-transparent">
      <div style={{ ...transitionStyle, ...getHeadStyle() }} className="w-full h-full">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="emojiBody" cx="45%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFD93B" />
              <stop offset="80%" stopColor="#FFB300" />
              <stop offset="100%" stopColor="#FF8C00" />
            </radialGradient>
            <linearGradient id="gloss" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>

          <circle cx="50" cy="50" r="47" fill="url(#emojiBody)" />
          <ellipse cx="50" cy="20" rx="30" ry="15" fill="url(#gloss)" />

          <g style={{ ...transitionStyle, transform: getFeatureTransform() }}>
            
            {['loving', 'joyful', 'smile', 'playful'].includes(state.expression) && (
              <g opacity="0.4">
                <circle cx="25" cy="60" r="8" fill="#FF7070" filter="blur(4px)" />
                <circle cx="75" cy="60" r="8" fill="#FF7070" filter="blur(4px)" />
              </g>
            )}

            {state.expression === 'playful' && (
              <path 
                d="M 52 75 Q 56 95 62 78 Q 64 72 58 72 Z" 
                fill="#FF4D4D" 
                style={transitionStyle}
                transform="rotate(10, 56, 75)" 
              />
            )}

            {/* 眼睛渲染组 - 基准 Y 坐标从 46 提升至 43 */}
            {[ {data: leftEye, x: 33}, {data: rightEye, x: 67} ].map((eye, idx) => (
              <g key={idx} transform={`translate(${eye.x}, 43)`} style={transitionStyle}>
                {eye.data.type === 'heart' ? (
                  <path 
                    d="M 0 7 C -12 -5, -7 -15, 0 -8 C 7 -15, 12 -5, 0 7" 
                    fill="#FF3131" 
                    transform={`scale(${eye.data.scale || 1}) rotate(${idx === 0 ? -10 : 10})`}
                  />
                ) : eye.data.type === 'arch' ? (
                  <path 
                    d="M -8 4 Q 0 -8 8 4" 
                    fill="none" 
                    stroke={featureColor} 
                    strokeWidth="5.5" 
                    strokeLinecap="round" 
                    transform={`scale(${eye.data.scale || 1})`}
                  />
                ) : eye.data.type === 'closed-arch' ? (
                  <path d="M -8 -4 Q 0 8 8 -4" fill="none" stroke={featureColor} strokeWidth="5.5" strokeLinecap="round" />
                ) : eye.data.type === 'shades' ? (
                  <path d="M -16 -6 L 16 -6 L 13 9 Q 0 16 -13 9 Z" fill="#111" />
                ) : eye.data.type === 'blink' ? (
                  <line x1="-8" y1="0" x2="8" y2="0" stroke={featureColor} strokeWidth="5.5" strokeLinecap="round" />
                ) : (
                  <g transform={eye.data.look === 'up' ? 'translate(0, -3)' : ''}>
                    <circle r={5 * (eye.data.scale || 1)} fill={featureColor} />
                    {(eye.data.scale && eye.data.scale > 1) && (
                      <circle r="2" cx="-2" cy="-2" fill="white" />
                    )}
                  </g>
                )}
              </g>
            ))}

            {state.expression === 'cool' && <line x1="45" y1="40" x2="55" y2="40" stroke="#111" strokeWidth="5" />}

            {/* Fix: changed strokeJoin to strokeLinejoin to match React's SVGProps type definition */}
            <path
              d={getMouthPath()}
              fill={['joyful', 'surprised', 'angry'].includes(state.expression) ? featureColor : "none"}
              stroke={featureColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={transitionStyle}
              className={isSpeaking ? 'animate-[pulse_0.2s_infinite]' : ''}
            />

            <g style={transitionStyle}>
              {leftBrow.d && (
                <path 
                  d={leftBrow.d} 
                  fill="none" 
                  stroke={featureColor} 
                  strokeWidth="4.5" 
                  strokeLinecap="round" 
                  style={{ ...transitionStyle, transform: leftBrow.transform, transformOrigin: '33px 31px' }} 
                />
              )}
              {rightBrow.d && (
                <path 
                  d={rightBrow.d} 
                  fill="none" 
                  stroke={featureColor} 
                  strokeWidth="4.5" 
                  strokeLinecap="round" 
                  style={{ ...transitionStyle, transform: rightBrow.transform, transformOrigin: '67px 31px' }} 
                />
              )}
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default Avatar;
