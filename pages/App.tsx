//Pages/App.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchDailyNews, fetchMockNews } from './services/geminiService';
import NewsCard from './components/NewsCard';
import NewsModal from './components/NewsModal';
import { NewsItem, FetchState, Language, NewsCategory, ReactionType, Theme } from './types';
import { RefreshIcon, ArrowLeftIcon, ArrowRightIcon, RotateCcwIcon, GridIcon, ArrowUpIcon, SunIcon, MoonIcon, VolumeIcon, VolumeXIcon, MusicIcon, MusicOffIcon, SettingsIcon, XIcon, HeartIcon } from './components/Icons';
import { soundManager, triggerHaptic } from './utils/feedback';

const translations = {
  en: {
    subtitle: "SYSTEM_STATUS: ONLINE // AI_FEED_ACTIVE",
    description: "Curated daily summaries of the most impactful developments in AI, powered by Gemini 2.5 Flash.",
    refresh: "REFRESH_FEED",
    loading: "INITIALIZING...",
    error: "SYSTEM_FAILURE",
    tryAgain: "RETRY_CONNECTION",
    noNews: "NO_DATA_FOUND. REFRESH_REQUIRED.",
    footer: "NeuroNews AI. Powered by Google Gemini API.",
    readAnalysis: "READ_FILE",
    aiReport: "AI_REPORT",
    sources: "SOURCE_LINK",
    noSources: "NO_LINK_DATA",
    connectionError: "NETWORK_ERROR :: FAILED_TO_RETRIEVE_DATA",
    dailyBriefing: "DAILY_BRIEFING",
    geminiSummary: "GEMINI_CORE",
    tags: ["SUMMARY", "AI", "OVERVIEW"],
    previous: "PREV_UNIT",
    next: "NEXT_UNIT",
    count: "//",
    replay: "REBOOT_SEQUENCE",
    allCaughtUp: "ANALYSIS_COMPLETE",
    selectTitle: "SELECT DATA STREAMS",
    selectSubtitle: "MULTI-SELECT ENABLED :: CHOOSE MODULES",
    selectPlaceholder: "SELECT_MODULES",
    start: "INITIATE_SEQUENCE",
    offlineMode: "OFFLINE SIMULATION",
    offlineDesc: "ENABLE DEMO DATA",
    categories: {
      llm: "LLMs & Chatbots",
      vision: "Vision & Generation",
      robotics: "Robotics & HW",
      business: "Business & Market",
      research: "Research & Code",
      general: "Global Overview"
    },
    backToMenu: "RETURN_TO_MENU",
    emotions: {
      negative: "ANXIETY // FEAR",
      positive: "HOPE // EXCITEMENT",
      neutral: "NEUTRAL // OBSERVING"
    },
    report: {
      title: "DAILY SENTIMENT REPORT",
      metric: "HUMAN OBSOLESCENCE INDEX",
      emotionalSpectrum: "EMOTIONAL SPECTRUM",
      impactAnalysis: "IMPACT ANALYSIS",
      status: {
        safe: "STATUS: STABLE",
        caution: "STATUS: CAUTION",
        warning: "STATUS: WARNING",
        critical: "STATUS: CRITICAL"
      }
    },
    loadingCards: [
      { title: "ESTABLISHING_UPLINK", summary: "Handshaking with global news nodes. Encrypting data stream..." },
      { title: "CALIBRATING_NEURAL_NET", summary: "Fine-tuning sentiment analysis algorithms. Optimizing impact scores..." },
      { title: "SCANNING_DATABASES", summary: "Filtering noise. Identifying high-priority AI developments..." },
      { title: "GENERATING_PREDICTIONS", summary: "Calculating potential future timelines based on current trends..." }
    ],
    settings: {
        title: "SYSTEM_CONFIG",
        audio: "AUDIO SETTINGS",
        bgmLevel: "BGM_LEVEL",
        sfxLevel: "SFX_LEVEL",
        connectivity: "CONNECTIVITY",
        display: "DISPLAY & INTERFACE",
        interfaceMode: "INTERFACE_MODE",
        language: "LANGUAGE_PACK",
        bgmTrack: "BGM_TRACK",
        loopMode: "LOOP_MODE",
        loopSingle: "SINGLE",
        loopPlaylist: "PLAYLIST",
        offline: "OFFLINE SIMULATION",
        offlineDesc: "ENABLE DEMO DATA",
        labMode: "LAB MODE",
        terminal: "TERMINAL"
    },
    sponsor: "SPONSOR_ME",
    sponsorTitle: "SUPPORT_DEVELOPMENT // DONATION",
    alipay: "ALIPAY_CHANNEL",
    wechat: "WECHAT_CHANNEL"
  },
  zh: {
    subtitle: "系统状态：在线 // AI_信息流_激活",
    description: "每日精选最具影响力的 AI 动态，由 Gemini 2.5 Flash 驱动。",
    refresh: "刷新数据流",
    loading: "系统初始化...",
    error: "系统故障",
    tryAgain: "重试连接",
    noNews: "未发现数据。需要刷新。",
    footer: "NeuroNews AI. 由 Google Gemini API 驱动。",
    readAnalysis: "读取档案",
    aiReport: "AI 简报",
    sources: "来源链接",
    noSources: "无链接数据",
    connectionError: "网络错误 :: 无法获取数据",
    dailyBriefing: "每日简报",
    geminiSummary: "GEMINI_核心",
    tags: ["摘要", "AI", "概览"],
    previous: "上一单元",
    next: "下一单元",
    count: "//",
    replay: "重启序列",
    allCaughtUp: "分析完成",
    selectTitle: "选择数据流模块",
    selectSubtitle: "已启用多选模式 :: 请选择关注方向",
    selectPlaceholder: "请选择数据模块",
    start: "启动序列",
    offlineMode: "离线模拟模式",
    offlineDesc: "启用演示数据",
    categories: {
      llm: "大语言模型 // LLM",
      vision: "视觉与生成 // VISION",
      robotics: "硬件与机器人 // HARDWARE",
      business: "商业与产业 // BUSINESS",
      research: "科研与代码 // RESEARCH",
      general: "综合全览 // GENERAL"
    },
    backToMenu: "返回菜单",
    emotions: {
      negative: "焦虑 // 恐惧",
      positive: "希望 // 兴奋",
      neutral: "中立 // 观察"
    },
    report: {
      title: "每日情绪分析报告",
      metric: "人类过时指数",
      emotionalSpectrum: "情绪光谱",
      impactAnalysis: "冲击力分析",
      status: {
        safe: "状态：稳定",
        caution: "状态：注意",
        warning: "状态：警告",
        critical: "状态：危急"
      }
    },
    loadingCards: [
      { title: "建立安全连接", summary: "正在与全球新闻节点握手。加密数据传输通道..." },
      { title: "校准神经网络", summary: "微调情感分析算法。正在优化影响力评分模型..." },
      { title: "扫描全网数据", summary: "过滤无关噪声。正在识别高优先级的 AI 进展..." },
      { title: "生成趋势预测", summary: "基于当前数据流计算未来时间线分支..." }
    ],
    settings: {
        title: "系统设置",
        audio: "音频设置",
        bgmLevel: "背景音乐",
        sfxLevel: "音效音量",
        connectivity: "连接设置",
        display: "显示与界面",
        interfaceMode: "界面模式",
        language: "语言包",
        bgmTrack: "音乐切换",
        loopMode: "循环模式",
        loopSingle: "单曲循环",
        loopPlaylist: "列表循环",
        offline: "离线模拟模式",
        offlineDesc: "启用演示数据",
        labMode: "白昼模式",
        terminal: "黑夜模式"
    },
    sponsor: "赞助作者",
    sponsorTitle: "支持开发 // 捐赠通道",
    alipay: "支付宝 / ALIPAY",
    wechat: "微信支付 / WECHAT"
  }
};

const CATEGORIES: { id: NewsCategory; color: string }[] = [
  { id: 'llm', color: 'border-amber-500 text-amber-500' },
  { id: 'vision', color: 'border-cyan-500 text-cyan-500' },
  { id: 'robotics', color: 'border-rose-500 text-rose-500' },
  { id: 'business', color: 'border-emerald-500 text-emerald-500' },
  { id: 'research', color: 'border-violet-500 text-violet-500' },
  { id: 'general', color: 'border-zinc-400 text-zinc-400' },
];

const App: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<FetchState>('idle');
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('zh');
  const [theme, setTheme] = useState<Theme>('dark');
  const [offlineMode, setOfflineMode] = useState(false);
  
  // Audio State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.3); // Default 30%
  const [sfxVolume, setSfxVolume] = useState(1.0);
  const [loopMode, setLoopMode] = useState<'single' | 'playlist'>('playlist');
  const hasUserDisabledBgm = useRef(false);
  
  // Settings Animation State
  const [settingsMounted, setSettingsMounted] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Sponsor Modal State
  const [sponsorMounted, setSponsorMounted] = useState(false);
  const [sponsorVisible, setSponsorVisible] = useState(false);

  const handleOpenSettings = () => {
      soundManager.playClick();
      setSettingsMounted(true);
      setTimeout(() => setSettingsVisible(true), 10);
  };

  const handleCloseSettings = () => {
      soundManager.playClick();
      setSettingsVisible(false);
      setTimeout(() => setSettingsMounted(false), 500);
  };

  const handleOpenSponsor = () => {
    soundManager.playClick();
    setSponsorMounted(true);
    setTimeout(() => setSponsorVisible(true), 10);
  };

  const handleCloseSponsor = () => {
      soundManager.playClick();
      setSponsorVisible(false);
      setTimeout(() => setSponsorMounted(false), 500);
  };
  
  // Selection State
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>([]);
  const [isFeedActive, setIsFeedActive] = useState(false);
  const [isMenuExiting, setIsMenuExiting] = useState(false);

  // Stack State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userReactions, setUserReactions] = useState<Record<string, ReactionType>>({});
  
  // Animation State
  const [stackEntryIndex, setStackEntryIndex] = useState(100); // Controls which cards are visible during entry
  const [stackExitIndex, setStackExitIndex] = useState(-1); // Controls which cards are flying out
  const [isTransitioningOut, setIsTransitioningOut] = useState(false); // Controls fly-out mode
  const [isReportExiting, setIsReportExiting] = useState(false); // Controls report screen exit animation
  
  const animationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const exitInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Drag State
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'up' | null>(null);
  
  // Refs for drag calculations
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const isClick = useRef<boolean>(true); // To distinguish click vs drag
  const hasCrossedThreshold = useRef<boolean>(false); // For haptics

  const t = translations[language];
  const isDark = theme === 'dark';

  // Cleanup animation intervals on unmount
  useEffect(() => {
      return () => {
          if (animationInterval.current) clearInterval(animationInterval.current);
          if (exitInterval.current) clearInterval(exitInterval.current);
          if (abortControllerRef.current) abortControllerRef.current.abort();
          soundManager.toggleBGM(false); // Ensure BGM stops
      }
  }, []);

  // Update body background color and CSS variables based on theme
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
        document.body.style.backgroundColor = '#0a0a0c';
        root.style.setProperty('--vignette-color', 'rgba(0,0,0,0.8)');
    } else {
        document.body.style.backgroundColor = '#f0f2f5';
        root.style.setProperty('--vignette-color', 'rgba(0,0,0,0.05)');
    }
  }, [isDark]);

  // Audio Filter Effect for Reading Mode
  useEffect(() => {
      // Muffle music (Low Pass Filter) when a card is selected/reading
      soundManager.setBGMLowPass(!!selectedItem);
  }, [selectedItem, bgmEnabled]);

  // Handle Sound Toggle
  const toggleSound = () => {
      const newState = !soundEnabled;
      setSoundEnabled(newState);
      soundManager.setSFXMuted(!newState); // Only toggles SFX mute
      if (newState) soundManager.playClick();
  };

  // Handle BGM Toggle
  const toggleBGM = () => {
      const newState = !bgmEnabled;
      setBgmEnabled(newState);
      soundManager.toggleBGM(newState);
      if (newState && soundEnabled) soundManager.playClick();
      
      if (!newState) {
          hasUserDisabledBgm.current = true;
      }
  };

  // Handle Track Switching
  const prevTrack = () => {
      if (bgmEnabled) {
          soundManager.prevTrack();
          if(soundEnabled) soundManager.playClick();
      }
  };

  const nextTrack = () => {
      if (bgmEnabled) {
          soundManager.nextTrack();
          if(soundEnabled) soundManager.playClick();
      }
  };

  const toggleLoopMode = () => {
      const newMode = loopMode === 'single' ? 'playlist' : 'single';
      setLoopMode(newMode);
      soundManager.setLoopMode(newMode);
      soundManager.playClick();
  };

  // Handle Offline Mode Toggle
  const toggleOfflineMode = () => {
      const newState = !offlineMode;
      setOfflineMode(newState);
      soundManager.playClick();
  };

  // Handle BGM Volume Change
  const handleBgmVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const vol = parseFloat(e.target.value);
      setBgmVolume(vol);
      soundManager.setBGMVolume(vol);
  };

  // Handle SFX Volume Change
  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const vol = parseFloat(e.target.value);
      setSfxVolume(vol);
      soundManager.setSFXVolume(vol);
      soundManager.playTick();
  };

  const runEntryAnimation = useCallback(() => {
      if (animationInterval.current) clearInterval(animationInterval.current);
      
      // Start from a high index (bottom of the visual stack)
      let current = 12; 
      setStackEntryIndex(current);
      
      // Progressively show cards from bottom (high index) to top (index 0)
      animationInterval.current = setInterval(() => {
          current--;
          setStackEntryIndex(current);
          // Play subtle tick sound for each card entry
          if (current >= -1 && current <= 12) {
            soundManager.playTick();
          }
          
          if (current < -1) { // Stop when we've shown everything
              if (animationInterval.current) clearInterval(animationInterval.current);
          }
      }, 80);
  }, []);

  const runExitAnimation = useCallback((onComplete: () => void) => {
    if (exitInterval.current) clearInterval(exitInterval.current);
    
    setIsTransitioningOut(true);
    setStackExitIndex(-1);
    
    let current = -1;
    // Sequential exit from 0 (top) to N (bottom)
    exitInterval.current = setInterval(() => {
        current++;
        setStackExitIndex(current);
        
        // Play exit sound occasionally or for each
        if (current < 12) {
            soundManager.playTick();
        }

        // Wait for enough cards to exit (loading stack is 12 items)
        if (current >= 12) { 
            if (exitInterval.current) clearInterval(exitInterval.current);
            onComplete();
        }
    }, 60); 
  }, []);

  // Helper to generate a batch of loading cards
  const createLoadingBatch = useCallback((baseIdPrefix: string) => {
    return t.loadingCards.map((card, idx) => ({
        id: `${baseIdPrefix}-${idx}`,
        title: card.title,
        source: 'SYSTEM_CORE',
        date: 'PROCESSING',
        summary: card.summary,
        tags: ['SYSTEM', 'LOAD', 'WAIT'],
        impactScore: 0,
        url: ''
    }));
  }, [t.loadingCards]);

  const loadNews = useCallback(async (categoriesToFetch: NewsCategory[]) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 1. Setup Loading State & Placeholder Cards
    if (exitInterval.current) clearInterval(exitInterval.current);
    if (animationInterval.current) clearInterval(animationInterval.current);

    setStatus('loading');
    setErrorMsg(null);
    setCurrentIndex(0);
    setExitDirection(null);
    setDragX(0);
    setDragY(0);
    setUserReactions({});
    setIsTransitioningOut(false);
    setStackExitIndex(-1);
    setIsReportExiting(false);
    
    // Create initial stack of dummy items (3 batches to ensure a full stack)
    const initialStack = [
        ...createLoadingBatch('load-batch-1'),
        ...createLoadingBatch('load-batch-2'),
        ...createLoadingBatch('load-batch-3')
    ];

    setNews(initialStack);
    runEntryAnimation();

    try {
      const cats = categoriesToFetch.length > 0 ? categoriesToFetch : ['general'] as NewsCategory[];
      
      // OFFLINE MODE LOGIC
      if (offlineMode) {
          // Enforce 5-second loading delay as requested
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          if (controller.signal.aborted) {
              return;
          }

          const mockItems = await fetchMockNews(language, cats);
          
          if (controller.signal.aborted) {
              return;
          }
          
           // 3. Trigger Exit Animation
          runExitAnimation(() => {
              if (controller.signal.aborted) return;
              
              setNews(mockItems);
              setStatus('success');
              setCurrentIndex(0);
              setExitDirection(null);
              setDragX(0);
              setDragY(0);
              setIsTransitioningOut(false);
              setStackExitIndex(-1);
              runEntryAnimation(); // Fly in real cards
          });
          return;
      }

      // 2. Fetch Data with AbortSignal (ONLINE)
      const response = await fetchDailyNews(language, cats, controller.signal);
      
      let realItems: NewsItem[] = [];
      if (response.items.length === 0 && response.rawText) {
          realItems = [{
              id: 'fallback-summary',
              title: t.dailyBriefing,
              source: t.geminiSummary,
              url: '',
              date: 'TODAY',
              summary: response.rawText,
              tags: t.tags,
              impactScore: 50
          }];
      } else {
          realItems = response.items;
      }
      
      // 3. Trigger Exit Animation
      runExitAnimation(() => {
          if (controller.signal.aborted) return;

          setNews(realItems);
          setStatus('success');
          setCurrentIndex(0);
          setExitDirection(null);
          setDragX(0);
          setDragY(0);
          setIsTransitioningOut(false);
          setStackExitIndex(-1);
          runEntryAnimation(); // Fly in real cards
      });
      
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError' || error.message === 'Aborted') {
          console.log('Fetch aborted by user navigation');
          return;
      }
      console.error(error);
      setStatus('error');
      setErrorMsg(t.connectionError);
      setNews([]); // Clear loading cards on error
    }
  }, [language, t, runEntryAnimation, runExitAnimation, createLoadingBatch, offlineMode]);

  // Handle Category Selection
  const toggleCategory = (cat: NewsCategory) => {
    soundManager.playClick();
    triggerHaptic('light');
    setSelectedCategories(prev => 
        prev.includes(cat) 
            ? prev.filter(c => c !== cat) 
            : [...prev, cat]
    );
  };

  const handleStartFeed = () => {
      soundManager.playSuccess();
      triggerHaptic('success');
      
      // Auto-start BGM if not already enabled AND user hasn't explicitly disabled it
      if (!bgmEnabled && !hasUserDisabledBgm.current) {
          setBgmEnabled(true);
          soundManager.toggleBGM(true);
      }

      setIsMenuExiting(true);
      setTimeout(() => {
          setIsFeedActive(true);
          setIsMenuExiting(false);
          loadNews(selectedCategories);
      }, 500); // Match the duration of scale-out animation
  };

  // Reset and Return to Menu
  const handleBackToMenu = () => {
    soundManager.playClick();
    // Immediately abort any ongoing fetch
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
    }

    setSelectedItem(null); // Ensure modal is closed

    const resetState = () => {
        setIsFeedActive(false);
        setNews([]);
        setStatus('idle');
        setCurrentIndex(0);
        setIsReportExiting(false);
    };

    if (status === 'success' && currentIndex >= news.length) {
        // If on Report Screen, animate report out
        setIsReportExiting(true);
        setTimeout(resetState, 500);
    } else if (news.length > 0) {
        // If on Cards, animate cards flying up
        runExitAnimation(resetState);
    } else {
        resetState();
    }
  };

  const toggleTheme = () => {
      soundManager.playClick();
      setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // -- Report Calculation --
  const reportData = useMemo(() => {
    if (news.length === 0) return { index: 0, statusText: '', stats: { positive: 0, negative: 0, neutral: 0, total: 0 } };

    let totalImpact = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    news.forEach(item => {
        totalImpact += item.impactScore;
        const reaction = userReactions[item.id];
        if (reaction === 'positive') positiveCount++;
        if (reaction === 'negative') negativeCount++;
        if (reaction === 'neutral') neutralCount++;
    });

    const avgImpact = totalImpact / news.length;
    
    let calculatedIndex = avgImpact;
    calculatedIndex += (negativeCount * 3);
    calculatedIndex -= (positiveCount * 1.5);
    calculatedIndex = Math.max(5, Math.min(99.9, calculatedIndex));
    
    let statusText = t.report.status.safe;
    if (calculatedIndex > 40) statusText = t.report.status.caution;
    if (calculatedIndex > 65) statusText = t.report.status.warning;
    if (calculatedIndex > 85) statusText = t.report.status.critical;

    return {
        index: calculatedIndex.toFixed(1),
        statusText,
        stats: {
            positive: positiveCount,
            negative: negativeCount,
            neutral: neutralCount,
            total: news.length
        }
    };
  }, [news, userReactions, t.report.status]);

  // -- Drag Handlers --
  const handleDragStart = (clientX: number, clientY: number) => {
    if (isTransitioningOut) return; // Block interaction during fly-out transition
    setIsDragging(true);
    startX.current = clientX;
    startY.current = clientY;
    isClick.current = true;
    hasCrossedThreshold.current = false;
    setExitDirection(null);
    triggerHaptic('light'); // Initial touch feedback
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;
    
    setDragX(deltaX);
    setDragY(deltaY);

    // Haptic feedback when crossing thresholds
    const threshold = 100;
    const isOverThreshold = Math.abs(deltaX) > threshold || (deltaY < -threshold && Math.abs(deltaY) > Math.abs(deltaX));
    
    if (isOverThreshold && !hasCrossedThreshold.current) {
        triggerHaptic('medium');
        hasCrossedThreshold.current = true;
    } else if (!isOverThreshold && hasCrossedThreshold.current) {
        hasCrossedThreshold.current = false;
    }

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        isClick.current = false;
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    const threshold = 100; // px to swipe
    const currentItem = news[currentIndex];

    if (!currentItem) return; // Guard

    // Shared completion logic for swiping
    const completeSwipe = () => {
        soundManager.playSwipe();
        // Extra haptic for successful swipe action
        triggerHaptic('medium');
        
        setTimeout(() => {
            const nextIndex = currentIndex + 1;
            
            // CYCLIC LOADING: If loading and stack finished, reload with animation
            if (status === 'loading' && nextIndex >= news.length) {
                const newBatch = [
                    ...createLoadingBatch(`cycle-${Date.now()}-1`),
                    ...createLoadingBatch(`cycle-${Date.now()}-2`)
                ];
                setNews(newBatch);
                setCurrentIndex(0);
                runEntryAnimation(); // Trigger fly-in animation for new batch
            } else {
                // Standard progression
                setCurrentIndex(nextIndex);
            }

            resetDrag();
        }, 300);
    };

    // Check swipe UP (Neutral)
    if (dragY < -threshold && Math.abs(dragY) > Math.abs(dragX)) {
         setExitDirection('up');
         if (status === 'success') {
            setUserReactions(prev => ({ ...prev, [currentItem.id]: 'neutral' }));
         }
         completeSwipe();
         return;
    }

    // Check swipe LEFT/RIGHT (Emotion)
    if (Math.abs(dragX) > threshold) {
        const direction = dragX > 0 ? 'right' : 'left';
        const reaction: ReactionType = dragX > 0 ? 'positive' : 'negative';
        
        setExitDirection(direction);
        
        if (status === 'success') {
            setUserReactions(prev => ({ ...prev, [currentItem.id]: reaction }));
        }
        
        completeSwipe();
    } else {
        // Snap back - small haptic and subtle sound
        if (!isClick.current) {
             triggerHaptic('light');
        }
        resetDrag();
    }
  };

  const resetDrag = () => {
      setDragX(0);
      setDragY(0);
      setExitDirection(null);
  };

  // Mouse/Touch bindings
  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX, e.clientY);
  const onMouseUp = () => handleDragEnd();
  const onMouseLeave = () => { if (isDragging) handleDragEnd(); };
  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleDragEnd();

  const handleCardClick = (item: NewsItem) => {
    // Only allow clicking real news
    if (status !== 'success') return;

    if (isClick.current && !isDragging) {
        soundManager.playClick();
        setSelectedItem(item);
    }
  };

  const handleReplay = () => {
      soundManager.playClick();
      setIsReportExiting(true);
      // Wait for report exit animation
      setTimeout(() => {
          setIsReportExiting(false);
          setCurrentIndex(0);
          setUserReactions({});
          runEntryAnimation();
      }, 500);
  };

  const visualDir = (() => {
      if (exitDirection) return exitDirection;
      if (!isDragging) return null;
      if (dragY < -50 && Math.abs(dragY) > Math.abs(dragX)) return 'up';
      if (dragX > 50) return 'right';
      if (dragX < -50) return 'left';
      return null;
  })();

  // Common Styling Variables
  const mainBgClass = isDark ? 'bg-[#0a0a0c] text-amber-50' : 'bg-[#f0f2f5] text-zinc-900';
  const headerBorderClass = isDark ? 'bg-[#0a0a0c] border-zinc-800' : 'bg-white border-zinc-300 shadow-sm';
  const gridPatternColor = isDark ? '#333' : '#ddd';
  const logoBoxClass = isDark ? 'bg-amber-500 text-black' : 'bg-amber-500 text-white';
  const subTextClass = isDark ? 'text-zinc-500' : 'text-zinc-400';
  
  const buttonBaseClass = isDark 
    ? 'border-zinc-700 hover:border-amber-500 text-zinc-400 hover:bg-zinc-800 hover:text-white' 
    : 'border-zinc-300 hover:border-amber-500 text-zinc-500 hover:bg-zinc-50 hover:text-black';

  const activeLangClass = isDark ? 'bg-amber-500 text-black' : 'bg-amber-500 text-white';
  const inactiveLangClass = isDark ? 'text-zinc-500 hover:text-amber-500' : 'text-zinc-400 hover:text-amber-600';
  const langBorder = isDark ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-300 bg-white';

  return (
    <div className={`min-h-screen flex flex-col overflow-hidden transition-colors duration-300 ${mainBgClass}`}>
        {/* Background Texture Grid */}
        <div className={`absolute inset-0 pointer-events-none ${isDark ? 'opacity-20' : 'opacity-40'}`} 
             style={{ backgroundImage: `linear-gradient(${gridPatternColor} 1px, transparent 1px), linear-gradient(90deg, ${gridPatternColor} 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
        </div>

      {/* Header Interface */}
      <header className={`sticky top-0 z-40 w-full border-b-2 transition-colors ${headerBorderClass}`}>
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between relative">
            {/* Decorative corner */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500"></div>

          {/* Empty left side to maintain layout balance if needed, or just let icons float right */}
          <div></div>
          
          <div className="flex items-center gap-4">
            
             {/* Sponsor Trigger */}
             <button
                onClick={handleOpenSponsor}
                className={`p-2 rounded-full border transition-colors mr-2 ${
                    isDark 
                        ? 'border-zinc-700 bg-zinc-900 text-rose-500 hover:bg-zinc-800' 
                        : 'border-zinc-300 bg-white text-rose-500 hover:bg-zinc-50'
                }`}
                title={t.sponsor}
            >
                <HeartIcon className="w-5 h-5" />
            </button>

            {/* Settings Trigger */}
             <button
                onClick={handleOpenSettings}
                className={`p-2 rounded-full border transition-colors ${
                    isDark 
                        ? 'border-zinc-700 bg-zinc-900 text-amber-500 hover:bg-zinc-800' 
                        : 'border-zinc-300 bg-white text-amber-600 hover:bg-zinc-50'
                }`}
                title="System Configuration"
            >
                <SettingsIcon className="w-5 h-5" />
            </button>

            {isFeedActive && (
                <>
                    <button
                        onClick={handleBackToMenu}
                        className={`p-3 border transition-all hidden sm:flex ${buttonBaseClass}`}
                        title={t.backToMenu}
                    >
                        <GridIcon className="w-5 h-5" />
                    </button>
                </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center w-full py-8 relative max-w-full overflow-hidden">
        
        {/* -- SCENE 1: SELECTION SCREEN -- */}
        {(!isFeedActive || isMenuExiting) && (
            <div className={`w-full max-w-5xl px-4 z-20 flex flex-col items-center ${isMenuExiting ? 'animate-scale-out' : 'animate-scale-in'}`}>
                <div className="text-center mb-8">
                    <h2 className={`text-3xl sm:text-5xl font-display font-bold mb-4 tracking-wide ${isDark ? 'text-white text-glow' : 'text-zinc-900 text-glow-light'}`}>
                        {t.selectTitle}
                    </h2>
                    <div className={`inline-block px-4 py-1 border ${isDark ? 'border-zinc-700 bg-zinc-900/50' : 'border-zinc-300 bg-white/80'}`}>
                        <span className="text-amber-500 font-mono tracking-[0.3em] text-xs sm:text-sm">
                            {t.selectSubtitle}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-10">
                    {CATEGORIES.map((cat) => {
                        const isSelected = selectedCategories.includes(cat.id);
                        return (
                            <button
                                key={cat.id}
                                onClick={() => toggleCategory(cat.id)}
                                className={`group relative h-32 border-2 transition-all duration-200 retro-shadow overflow-hidden ${
                                    isSelected 
                                        ? `${cat.color} scale-[1.02] shadow-[0_0_15px_rgba(0,0,0,0.2)] ${isDark ? 'bg-zinc-900' : 'bg-white'}` 
                                        : `${isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-600 hover:bg-zinc-900' : 'border-zinc-300 bg-white text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50'}`
                                }`}
                            >
                                {/* Background Fill */}
                                <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 bg-current ${
                                    isSelected ? (isDark ? 'opacity-5' : 'opacity-10') : (isDark ? 'group-hover:opacity-5' : 'group-hover:opacity-10')
                                }`}></div>

                                {/* Selection Indicator Corner */}
                                {isSelected && (
                                    <>
                                        <div className="absolute top-0 right-0 p-1 bg-current text-black">
                                            <div className="w-2 h-2 bg-inherit"></div>
                                        </div>
                                        <div className="absolute top-2 right-2 w-2 h-2 bg-current rounded-full animate-pulse"></div>
                                    </>
                                )}
                                
                                <div className="h-full flex flex-col items-center justify-center relative z-10 p-4">
                                    <div className={`text-lg sm:text-xl font-bold font-display tracking-widest uppercase mb-2 transition-colors ${
                                        isSelected ? '' : (isDark ? 'group-hover:text-zinc-300' : 'group-hover:text-zinc-800')
                                    }`}>
                                        {t.categories[cat.id]}
                                    </div>
                                    <div className={`w-12 h-[1px] transition-all duration-500 ${
                                        isSelected ? 'bg-current w-24' : (isDark ? 'bg-zinc-800 group-hover:bg-zinc-600' : 'bg-zinc-300 group-hover:bg-zinc-400') + ' group-hover:w-16'
                                    }`}></div>
                                    <div className="mt-2 text-[10px] font-mono opacity-70">
                                        MODULE_ID :: 0{CATEGORIES.indexOf(cat) + 1}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <button 
                    onClick={handleStartFeed}
                    disabled={selectedCategories.length === 0}
                    className={`group relative px-12 py-4 border-2 font-bold font-display tracking-[0.2em] text-xl transition-all ${
                        selectedCategories.length > 0 
                            ? `border-amber-500 bg-amber-500 ${isDark ? 'text-black' : 'text-white'} hover:bg-amber-400 hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.4)]` 
                            : `${isDark ? 'border-zinc-800 text-zinc-700 bg-zinc-900' : 'border-zinc-300 text-zinc-400 bg-zinc-100'} cursor-not-allowed`
                    }`}
                >
                    {selectedCategories.length > 0 ? (
                        <>
                            <span className="relative z-10 flex items-center gap-3">
                                {t.start} <ArrowRightIcon className="w-5 h-5" />
                            </span>
                            {/* Scanline effect on button */}
                            <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-20"></div>
                        </>
                    ) : (
                        t.selectPlaceholder
                    )}
                </button>
            </div>
        )}

        {/* -- SCENE 2: LOADING & FEED -- */}
        {isFeedActive && (
            <>
                {/* Error State */}
                {status === 'error' && (
                    <div className={`flex flex-col items-center justify-center py-20 text-center w-full max-w-lg border-2 border-red-900 p-10 z-20 relative ${isDark ? 'bg-black/80' : 'bg-white/80'}`}>
                        <div className="absolute top-0 left-0 bg-red-600 text-black text-xs font-bold px-2 py-1">ERROR_LOG_001</div>
                        <h3 className="text-xl font-display text-red-500 mb-4 uppercase tracking-widest">{t.error}</h3>
                        <p className="text-red-400/60 font-mono text-sm mb-6">CODE: {errorMsg}</p>
                        <button 
                            onClick={() => loadNews(selectedCategories)} 
                            className="px-6 py-3 border border-red-500 text-red-500 font-mono text-sm hover:bg-red-500 hover:text-black transition-colors"
                        >
                            [{t.tryAgain}]
                        </button>
                    </div>
                )}

                {/* Stack Area (Visible during Loading AND Success) */}
                {(status === 'success' || status === 'loading') && news.length > 0 && (
                    <div className="relative w-full h-[600px] sm:h-[550px] flex justify-center items-center overflow-visible perspective-[1200px]">
                        
                        {/* End of Stack / Report Screen (Only show when actual news is done) */}
                        {status === 'success' && currentIndex >= news.length ? (
                            <div 
                              className={`z-10 w-full max-w-2xl border-2 shadow-[0_0_60px_rgba(0,0,0,0.2)] retro-shadow mx-4 relative overflow-hidden ${
                                  isReportExiting 
                                    ? 'animate-scale-out' 
                                    : 'animate-scale-in'
                              } ${isDark ? 'border-zinc-700 bg-black' : 'border-zinc-300 bg-white'}`}
                            >
                                {/* Decorative header bar */}
                                <div className="h-2 w-full bg-gradient-to-r from-red-600 via-blue-500 to-green-500"></div>
                                
                                <div className="p-8 sm:p-10 flex flex-col">
                                    <div className={`flex justify-between items-start mb-8 border-b pb-4 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                        <h2 className={`text-2xl sm:text-3xl font-display font-bold tracking-widest uppercase ${isDark ? 'text-white' : 'text-black'}`}>
                                            {t.report.title}
                                        </h2>
                                        <div className="text-right">
                                            <div className={`text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>DATE: {new Date().toISOString().split('T')[0]}</div>
                                            <div className="text-xs font-mono text-amber-500">ID: REPORT_FINAL</div>
                                        </div>
                                    </div>

                                    {/* MAIN METRIC */}
                                    <div className="flex flex-col sm:flex-row gap-8 mb-10">
                                        <div className={`flex-1 flex flex-col items-center justify-center p-6 border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50/50 border-zinc-200'}`}>
                                            <div className={`text-xs font-mono mb-2 uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{t.report.metric}</div>
                                            <div className={`text-6xl sm:text-7xl font-display font-bold mb-2 ${
                                                Number(reportData.index) > 65 ? 'text-red-500 text-glow' : 
                                                Number(reportData.index) > 40 ? 'text-amber-500' : 'text-green-500'
                                            }`}>
                                                {Math.round(Number(reportData.index))}%
                                            </div>
                                            <div className={`px-3 py-1 text-xs font-bold font-mono uppercase border ${
                                                Number(reportData.index) > 65 ? 'border-red-500 text-red-500 bg-red-950/30' : 
                                                Number(reportData.index) > 40 ? 'border-amber-500 text-amber-500 bg-amber-950/30' : 'border-green-500 text-green-500 bg-green-950/30'
                                            }`}>
                                                {reportData.statusText}
                                            </div>
                                        </div>

                                        {/* EMOTIONAL SPECTRUM BARS */}
                                        <div className="flex-1 flex flex-col justify-center gap-6">
                                            <div className={`text-xs font-mono uppercase tracking-widest mb-[-10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{t.report.emotionalSpectrum}</div>
                                            
                                            {/* Negative / Anxiety */}
                                            <div className="w-full">
                                                <div className="flex justify-between text-xs font-mono text-red-400 mb-1">
                                                    <span>{t.emotions.negative}</span>
                                                    <span>{reportData.stats.negative}</span>
                                                </div>
                                                <div className={`w-full h-3 border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                                                    <div 
                                                        className="h-full bg-red-600" 
                                                        style={{ width: `${(reportData.stats.negative / (reportData.stats.total || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Neutral */}
                                            <div className="w-full">
                                                <div className="flex justify-between text-xs font-mono text-blue-400 mb-1">
                                                    <span>{t.emotions.neutral}</span>
                                                    <span>{reportData.stats.neutral}</span>
                                                </div>
                                                <div className={`w-full h-3 border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                                                    <div 
                                                        className="h-full bg-blue-600" 
                                                        style={{ width: `${(reportData.stats.neutral / (reportData.stats.total || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Positive / Hope */}
                                            <div className="w-full">
                                                <div className="flex justify-between text-xs font-mono text-green-400 mb-1">
                                                    <span>{t.emotions.positive}</span>
                                                    <span>{reportData.stats.positive}</span>
                                                </div>
                                                <div className={`w-full h-3 border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                                                    <div 
                                                        className="h-full bg-green-600" 
                                                        style={{ width: `${(reportData.stats.positive / (reportData.stats.total || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className={`flex flex-col sm:flex-row gap-4 pt-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                        <button 
                                            onClick={handleReplay}
                                            className={`flex-1 py-4 bg-amber-500 font-bold font-display tracking-wider hover:bg-amber-400 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] ${isDark ? 'text-black' : 'text-white'}`}
                                        >
                                            {t.replay}
                                        </button>
                                        <button
                                            onClick={handleBackToMenu}
                                            className={`flex-1 py-4 border font-mono text-sm transition-all ${isDark ? 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-900' : 'border-zinc-300 text-zinc-500 hover:text-black hover:border-zinc-400 hover:bg-zinc-50'}`}
                                        >
                                            {t.backToMenu}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* Cards */}
                        {news.map((item, index) => {
                            if (index < currentIndex || index > currentIndex + 8) return null;
                            
                            const isTop = index === currentIndex;
                            const dist = index - currentIndex;
                            
                            const isVisibleInStack = index >= stackEntryIndex;
                            const hasExited = isTransitioningOut && index <= stackExitIndex;
                            
                            const uniqueRot = isTop ? 0 : ((index * 137.5) % 10 - 5);
                            const uniqueX = isTop ? 0 : ((index * 43) % 50 - 25);
                            const uniqueY = isTop ? 0 : (dist * 10 + ((index * 23) % 10));

                            const scale = 1 - dist * 0.04; 
                            const translateZ = -dist * 30; 
                            const zIndex = 100 - dist;
                            
                            const opacity = isVisibleInStack ? Math.max(0, 1 - dist * 0.1) : 0; 
                            const filter = dist > 0 
                                ? `brightness(${100 - dist * 10}%) grayscale(${dist * 10}%)` 
                                : 'none';

                            let transform = `translate3d(${uniqueX}px, ${uniqueY}px, ${translateZ}px) scale(${scale}) rotate(${uniqueRot}deg)`;
                            let transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.5s, filter 0.5s';
                            
                            // Initial "Fly In" animation
                            if (!isVisibleInStack) {
                                transform = `translate3d(0, 120vh, ${translateZ}px) scale(0.9) rotate(${uniqueRot}deg)`;
                            }
                            
                            // "Fly Out" animation when real data loads (Sequential Upward Exit)
                            if (hasExited) {
                                transform = `translate3d(0, -120vh, ${translateZ}px) rotate(${uniqueRot}deg)`;
                                transition = 'transform 0.5s ease-in, opacity 0.5s';
                            } else if (isTransitioningOut) {
                                // Keep position until it's time to exit
                                // transform remains calculated from uniqueX/Y above
                            } else if (isTop && isVisibleInStack) {
                                // Standard Interaction
                                if (isDragging) {
                                    const dragRotate = dragX * 0.05;
                                    transform = `translate3d(${dragX}px, ${dragY}px, 0) scale(1) rotate(${dragRotate}deg)`;
                                    transition = 'none'; 
                                } else if (exitDirection) {
                                    let flyX = 0;
                                    let flyY = 0;
                                    let flyRot = 0;
                                    
                                    if (exitDirection === 'right') { flyX = window.innerWidth; flyRot = 25; }
                                    else if (exitDirection === 'left') { flyX = -window.innerWidth; flyRot = -25; }
                                    else if (exitDirection === 'up') { flyY = -window.innerHeight; }

                                    transform = `translate3d(${flyX}px, ${flyY}px, 0) rotate(${flyRot}deg)`;
                                }
                            }

                            return (
                                <div
                                    key={item.id}
                                    className="absolute w-[90%] max-w-sm h-[520px] sm:h-[500px] touch-none"
                                    style={{
                                        zIndex,
                                        transform,
                                        transition,
                                        opacity: isTop && exitDirection ? 0 : opacity,
                                        filter,
                                        cursor: isTop ? (isDragging ? 'grabbing' : 'grab') : 'default',
                                    }}
                                    onMouseDown={isTop ? onMouseDown : undefined}
                                    onMouseMove={isTop ? onMouseMove : undefined}
                                    onMouseUp={isTop ? onMouseUp : undefined}
                                    onMouseLeave={isTop ? onMouseLeave : undefined}
                                    onTouchStart={isTop ? onTouchStart : undefined}
                                    onTouchMove={isTop ? onTouchMove : undefined}
                                    onTouchEnd={isTop ? onTouchEnd : undefined}
                                >
                                    <NewsCard 
                                        item={item} 
                                        onClick={handleCardClick}
                                        readMoreLabel={t.readAnalysis}
                                        isActive={isTop}
                                        className={!isTop ? 'pointer-events-none shadow-lg' : 'shadow-2xl'}
                                        theme={theme}
                                        swipeDirection={isTop ? visualDir : null}
                                    />
                                    
                                    {/* Retro Swipe Indicators */}
                                    {isTop && visualDir === 'right' && status === 'success' && (
                                        <div className="absolute top-10 left-[-20px] px-4 py-2 border-2 border-green-500 bg-black text-green-500 font-display tracking-widest text-lg -rotate-12 retro-shadow z-50 animate-pulse">
                                            {t.emotions.positive}
                                        </div>
                                    )}
                                    {isTop && visualDir === 'left' && status === 'success' && (
                                        <div className="absolute top-10 right-[-20px] px-4 py-2 border-2 border-red-500 bg-black text-red-500 font-display tracking-widest text-lg rotate-12 retro-shadow z-50 animate-pulse">
                                            {t.emotions.negative}
                                        </div>
                                    )}
                                    {isTop && visualDir === 'up' && status === 'success' && (
                                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 border-2 border-blue-500 bg-black text-blue-500 font-display tracking-widest text-lg retro-shadow z-50 animate-pulse">
                                            {t.emotions.neutral}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                
                {status === 'success' && news.length === 0 && (
                    <div className={`text-center py-20 font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        // {t.noNews}
                    </div>
                )}
            </>
        )}
        
      </main>
      
      {/* Modal */}
      <NewsModal 
        item={selectedItem} 
        onClose={() => setSelectedItem(null)} 
        labels={{
            aiReport: t.aiReport,
            sources: t.sources,
            noSources: t.noSources
        }}
        theme={theme}
      />
      
      {/* Sponsor Modal */}
      {sponsorMounted && (
          <div className={`fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${sponsorVisible ? 'opacity-100' : 'opacity-0'}`} onClick={handleCloseSponsor}>
             <div className={`w-full max-w-2xl p-6 border-2 ${isDark ? 'bg-zinc-900 border-rose-500' : 'bg-white border-rose-400'} retro-shadow mx-4 ${sponsorVisible ? 'animate-scale-in' : 'animate-scale-out'}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-8 border-b border-zinc-700/50 pb-4">
                    <h3 className={`text-xl font-display font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-black'}`}>
                        {t.sponsorTitle}
                    </h3>
                    <button onClick={handleCloseSponsor} className={isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}>
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono">
                    {/* Alipay */}
                    <div className="flex flex-col items-center">
                        <div className={`w-full aspect-square border-2 border-dashed flex items-center justify-center mb-4 ${isDark ? 'border-zinc-700 bg-zinc-950 text-zinc-500' : 'border-zinc-300 bg-zinc-50 text-zinc-400'}`}>
                            {/* Placeholder for QR Image */}
                            <div className="text-center">
                                <div className="text-xs mb-2 tracking-widest">SCAN_DATA_MATRIX</div>
                                <div className="text-xs opacity-50">PLACEHOLDER_IMG</div>
                            </div>
                        </div>
                        <div className={`px-4 py-2 text-sm font-bold border ${isDark ? 'border-blue-900 text-blue-400 bg-blue-950/30' : 'border-blue-200 text-blue-600 bg-blue-50'}`}>
                            {t.alipay}
                        </div>
                    </div>

                    {/* WeChat */}
                    <div className="flex flex-col items-center">
                        <div className={`w-full aspect-square border-2 border-dashed flex items-center justify-center mb-4 ${isDark ? 'border-zinc-700 bg-zinc-950 text-zinc-500' : 'border-zinc-300 bg-zinc-50 text-zinc-400'}`}>
                            {/* Placeholder for QR Image */}
                            <div className="text-center">
                                <div className="text-xs mb-2 tracking-widest">SCAN_DATA_MATRIX</div>
                                <div className="text-xs opacity-50">PLACEHOLDER_IMG</div>
                            </div>
                        </div>
                         <div className={`px-4 py-2 text-sm font-bold border ${isDark ? 'border-green-900 text-green-400 bg-green-950/30' : 'border-green-200 text-green-600 bg-green-50'}`}>
                            {t.wechat}
                        </div>
                    </div>
                </div>
                
                <div className={`mt-8 text-center text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    // THANK YOU FOR YOUR CONTRIBUTION
                </div>
             </div>
          </div>
      )}

      {/* Settings Popup */}
      {settingsMounted && (
          <div className={`fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${settingsVisible ? 'opacity-100' : 'opacity-0'}`} onClick={handleCloseSettings}>
             <div className={`w-full max-w-md p-6 border-2 ${isDark ? 'bg-zinc-900 border-amber-500' : 'bg-white border-zinc-300'} retro-shadow mx-4 ${settingsVisible ? 'animate-scale-in' : 'animate-scale-out'}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-8 border-b border-zinc-700/50 pb-4">
                    <h3 className={`text-xl font-display font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-black'}`}>
                        {t.settings.title}
                    </h3>
                    <button onClick={handleCloseSettings} className={isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}>
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-8 font-mono">
                    {/* Audio Section */}
                    <div className="space-y-4">
                        <div className={`text-xs font-bold uppercase tracking-widest border-b pb-2 ${isDark ? 'text-zinc-500 border-zinc-800' : 'text-zinc-400 border-zinc-200'}`}>{t.settings.audio}</div>
                        
                        {/* BGM Control */}
                        <div className="space-y-3">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={toggleBGM}
                                        className={`p-2 rounded-full border ${bgmEnabled ? (isDark ? 'border-amber-500 text-amber-500' : 'border-amber-600 text-amber-600') : (isDark ? 'border-zinc-700 text-zinc-600' : 'border-zinc-300 text-zinc-400')}`}
                                    >
                                        {bgmEnabled ? <MusicIcon className="w-4 h-4" /> : <MusicOffIcon className="w-4 h-4" />}
                                    </button>
                                    <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{t.settings.bgmLevel}</span>
                                </div>
                                <span className="text-xs font-bold">{Math.round(bgmVolume * 100)}%</span>
                             </div>

                             {/* BGM Selector & Slider */}
                             <div className="flex items-center gap-3">
                                <button 
                                    onClick={prevTrack}
                                    disabled={!bgmEnabled}
                                    className={`p-1 border ${isDark ? 'border-zinc-700 text-zinc-400 hover:text-amber-500' : 'border-zinc-300 text-zinc-600 hover:text-amber-600'} disabled:opacity-50`}
                                >
                                    <ArrowLeftIcon className="w-3 h-3" />
                                </button>
                                
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.01" 
                                    value={bgmVolume} 
                                    onChange={handleBgmVolumeChange}
                                    className={`flex-grow h-1 rounded-lg appearance-none cursor-pointer outline-none ${isDark ? 'bg-zinc-800 accent-amber-500' : 'bg-zinc-200 accent-amber-600'}`}
                                />

                                <button 
                                    onClick={nextTrack}
                                    disabled={!bgmEnabled}
                                    className={`p-1 border ${isDark ? 'border-zinc-700 text-zinc-400 hover:text-amber-500' : 'border-zinc-300 text-zinc-600 hover:text-amber-600'} disabled:opacity-50`}
                                >
                                    <ArrowRightIcon className="w-3 h-3" />
                                </button>
                             </div>

                             {/* BGM Loop Mode */}
                             <div className="flex items-center justify-between">
                                <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{t.settings.loopMode}</span>
                                <button 
                                    onClick={toggleLoopMode}
                                    className={`px-3 py-1 text-xs font-bold border transition-colors ${
                                        isDark 
                                        ? 'border-zinc-700 bg-zinc-800 text-amber-500 hover:bg-zinc-700' 
                                        : 'border-zinc-300 bg-zinc-100 text-amber-600 hover:bg-zinc-200'
                                    }`}
                                >
                                    {loopMode === 'single' ? t.settings.loopSingle : t.settings.loopPlaylist}
                                </button>
                             </div>
                        </div>

                        {/* SFX Control */}
                        <div className="space-y-2">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={toggleSound}
                                        className={`p-2 rounded-full border ${soundEnabled ? (isDark ? 'border-amber-500 text-amber-500' : 'border-amber-600 text-amber-600') : (isDark ? 'border-zinc-700 text-zinc-600' : 'border-zinc-300 text-zinc-400')}`}
                                    >
                                        {soundEnabled ? <VolumeIcon className="w-4 h-4" /> : <VolumeXIcon className="w-4 h-4" />}
                                    </button>
                                    <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{t.settings.sfxLevel}</span>
                                </div>
                                <span className="text-xs font-bold">{Math.round(sfxVolume * 100)}%</span>
                             </div>
                             <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.01" 
                                value={sfxVolume} 
                                onChange={handleSfxVolumeChange}
                                className={`w-full h-1 rounded-lg appearance-none cursor-pointer outline-none ${isDark ? 'bg-zinc-800 accent-amber-500' : 'bg-zinc-200 accent-amber-600'}`}
                             />
                        </div>
                    </div>

                     {/* Data Mode Section */}
                    <div className="space-y-4">
                        <div className={`text-xs font-bold uppercase tracking-widest border-b pb-2 ${isDark ? 'text-zinc-500 border-zinc-800' : 'text-zinc-400 border-zinc-200'}`}>{t.settings.connectivity}</div>
                        
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{t.settings.offline}</span>
                                <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{t.settings.offlineDesc}</span>
                            </div>
                            <button 
                                onClick={toggleOfflineMode}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                                    offlineMode 
                                        ? (isDark ? 'bg-amber-500' : 'bg-amber-600') 
                                        : (isDark ? 'bg-zinc-800' : 'bg-zinc-300')
                                }`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${offlineMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                    </div>

                    {/* Display Section */}
                    <div className="space-y-4">
                        <div className={`text-xs font-bold uppercase tracking-widest border-b pb-2 ${isDark ? 'text-zinc-500 border-zinc-800' : 'text-zinc-400 border-zinc-200'}`}>{t.settings.display}</div>
                        
                        {/* Interface Mode */}
                        <div className="flex justify-between items-center">
                            <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{t.settings.interfaceMode}</span>
                            <button 
                                onClick={toggleTheme} 
                                className={`flex items-center gap-2 px-4 py-2 border text-xs font-bold transition-all ${isDark ? 'border-zinc-700 bg-zinc-800 text-white' : 'border-zinc-300 bg-zinc-100 text-black'}`}
                            >
                                {isDark ? <SunIcon className="w-3 h-3" /> : <MoonIcon className="w-3 h-3" />}
                                {isDark ? t.settings.labMode : t.settings.terminal}
                            </button>
                        </div>
                        
                        {/* Language */}
                        <div className="flex justify-between items-center">
                            <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{t.settings.language}</span>
                            <div className={`flex border ${langBorder}`}>
                                <button 
                                    onClick={() => { setLanguage('en'); soundManager.playClick(); }}
                                    className={`px-4 py-2 text-xs font-bold font-mono transition-all ${language === 'en' ? activeLangClass : inactiveLangClass}`}
                                >
                                    EN
                                </button>
                                <div className={`w-[1px] ${isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`}></div>
                                <button 
                                    onClick={() => { setLanguage('zh'); soundManager.playClick(); }}
                                    className={`px-4 py-2 text-xs font-bold font-mono transition-all ${language === 'zh' ? activeLangClass : inactiveLangClass}`}
                                >
                                    ZH
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default App;