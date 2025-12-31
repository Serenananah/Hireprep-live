
import React, { useState, useEffect } from 'react';
import { Page, User, InterviewConfig, InterviewSession, CorrectionModule } from './types';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import SetupPage from './pages/SetupPage';
import InterviewPage from './pages/InterviewPage';
import FeedbackPage from './pages/FeedbackPage';
import CorrectionPage from './pages/CorrectionPage'; // New Page
import Layout from './components/Layout';
import { authService } from './services/authService';
import { interviewHistoryService } from './services/interviewHistoryService';
import { LogOut, User as UserIcon, Home } from 'lucide-react';

if (!process.env.API_KEY) {
  console.warn("API_KEY is not set in process.env. The app might not function correctly.");
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // New State for Correction Flow
  const [selectedCorrectionModules, setSelectedCorrectionModules] = useState<CorrectionModule[]>([]);
  const [pendingRoute, setPendingRoute] = useState<Page | null>(null);

  useEffect(() => {
    let mounted = true;
    const initApp = async () => {
      try {
        const storedUser = authService.getCurrentUser();
        if (storedUser && mounted) {
          setUser(storedUser);
        }
      } catch (e) {
        console.error("Session restore failed", e);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };
    initApp();
    return () => { mounted = false; };
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    // If user was trying to access Correction, go there
    if (pendingRoute === Page.CORRECTION) {
        setCurrentPage(Page.CORRECTION);
        setPendingRoute(null);
    } else {
        setCurrentPage(Page.SETUP);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setCurrentPage(Page.AUTH);
    setCurrentSession(null);
    setPendingRoute(null);
  };

  const startInterview = (config: InterviewConfig) => {
    const newSession: InterviewSession = {
      id: `session_${Date.now()}`,
      config,
      transcript: [],
      analyses: [],
      startTime: Date.now()
    };
    setCurrentSession(newSession);
    setCurrentPage(Page.INTERVIEW);
  };

  const endInterview = (sessionData: InterviewSession) => {
    const completedSession = { ...sessionData, endTime: Date.now() };
    setCurrentSession(completedSession);
    // Persist to local history immediately
    interviewHistoryService.saveSession(completedSession);
    setCurrentPage(Page.FEEDBACK);
  };

  // Handler for Start Correction from LandingPage
  const handleStartCorrectionFlow = (modules: CorrectionModule[]) => {
      setSelectedCorrectionModules(modules);
      if (user) {
          setCurrentPage(Page.CORRECTION);
      } else {
          setPendingRoute(Page.CORRECTION);
          setCurrentPage(Page.AUTH);
      }
  };

  const renderPage = () => {
    if (isInitializing) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    switch (currentPage) {
      case Page.LANDING:
        return <LandingPage 
            onStart={() => setCurrentPage(user ? Page.SETUP : Page.AUTH)} 
            onStartCorrection={handleStartCorrectionFlow}
        />;
      case Page.AUTH:
        return <AuthPage onLogin={handleLogin} />;
      case Page.SETUP:
        return <SetupPage onStartInterview={startInterview} user={user} />;
      case Page.INTERVIEW:
        return currentSession ? <InterviewPage session={currentSession} onEndInterview={endInterview} /> : <SetupPage onStartInterview={startInterview} user={user} />;
      case Page.FEEDBACK:
        return currentSession ? <FeedbackPage session={currentSession} onHome={() => setCurrentPage(Page.SETUP)} /> : <SetupPage onStartInterview={startInterview} user={user} />;
      case Page.CORRECTION:
        return <CorrectionPage selectedModules={selectedCorrectionModules} onBack={() => setCurrentPage(Page.LANDING)} />;
      default:
        return <LandingPage 
            onStart={() => setCurrentPage(Page.AUTH)} 
            onStartCorrection={handleStartCorrectionFlow}
        />;
    }
  };

  return (
    <Layout>
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-2 flex justify-end items-center bg-gradient-to-b from-[#0f172a] to-transparent pointer-events-none">
        {user ? (
          <div className="pointer-events-auto flex items-center gap-4 group relative">
             <div className="flex flex-col items-end hidden sm:flex">
               <span className="text-sm font-bold text-white">{user.name}</span>
               <span className="text-xs text-blue-300">{user.email}</span>
             </div>
             <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 border border-white/20 shadow-lg flex items-center justify-center text-slate-900 font-bold cursor-pointer hover:scale-105 transition-transform">
                  {typeof user.name === 'string' ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="absolute right-0 mt-3 w-48 py-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50 translate-y-2 group-hover:translate-y-0">
                   <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign Out
                   </button>
                   <button onClick={() => setCurrentPage(Page.LANDING)} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-colors border-t border-white/5">
                      <Home className="w-4 h-4" /> Back Home
                   </button>
                </div>
             </div>
          </div>
        ) : (
          <div className="pointer-events-auto">
            {currentPage !== Page.AUTH && currentPage !== Page.LANDING && (
              <button onClick={() => setCurrentPage(Page.AUTH)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-white/10 rounded-full hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all">
                <UserIcon className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>
        )}
      </header>
      <main className={`flex-1 w-full px-4 flex flex-col ${currentPage === Page.LANDING || currentPage === Page.CORRECTION ? "pt-0" : "pt-20"}`}>
        {renderPage()}
      </main>
    </Layout>
  );
};

export default App;
