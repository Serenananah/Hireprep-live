

export interface GalaxyConfig {
  count: number;
  size: number;
  radius: number;
  branches: number;
  spin: number;
  randomness: number;
  randomnessPower: number;
  insideColor: string;
  outsideColor: string;
}

export type RGB = { r: number; g: number; b: number };

export enum Page {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  SETUP = 'SETUP',
  INTERVIEW = 'INTERVIEW',
  FEEDBACK = 'FEEDBACK',
  CORRECTION = 'CORRECTION'
}

export enum Difficulty {
  EASY = 'Easy',
  STANDARD = 'Standard',
  HARD = 'Hard'
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  createdAt?: number;
}

export interface JobRole {
  id: string;
  industry: string;
  title: string;
  level: string;
  tags?: string[];
}

// --- PERCEPTION & METRICS ---
export interface AnalysisMetrics {
  speechRate: number;      // WPM (Words Per Minute)
  pauseRatio: number;      // % of silence
  volumeStability: number; // 0-10 Score (based on RMS Variance)
  eyeContact: number;      // % of time looking at camera
  confidence: number;      // 0-100 Score
  clarity: number;         // 0-10 Score
  audioLevel: number;        // Current audio input level (RMS)
}

// --- LIVE SESSION TYPES ---
export type LiveConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface InterviewConfig {
  industry: string;
  role: JobRole | null;
  duration: number; // minutes
  difficulty: Difficulty;
  jdText: string;
  resumeText: string;
}

export interface Message {
  role: 'ai' | 'user';
  text: string;
  timestamp: number;
}

export interface QuestionAnalysis {
  questionId: number;
  questionText: string; 
  userAnswer: string;   
  metrics: AnalysisMetrics; 
  contentScore: number; 
  deliveryScore: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  dialogue?: Message[]; 
}

export interface FinalReport {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  trainingPlan: string[];
}

export interface InterviewSession {
  id: string;
  config: InterviewConfig;
  transcript: Message[];
  analyses: QuestionAnalysis[];
  startTime: number;
  endTime?: number;
  finalReport?: FinalReport;
}

// Avater Emoji
export type FacialExpression = 
  | 'neutral' | 'slight_smile' | 'smile' | 'thinking' | 'confused' 
  | 'attentive' | 'surprised' | 'skeptical' | 'sad' | 'determined' 
  | 'joyful' | 'angry' | 'loving' | 'sleepy' | 'wink' | 'playful' 
  | 'pleading' | 'cool';

export type HeadMovement = 
  | 'nod' | 'slight_nod' | 'shake' | 'tilt_left' | 'tilt_right' 
  | 'lean_forward' | 'lean_back' | 'still';

export type EyeBehavior = 'maintain_gaze' | 'brief_look_away' | 'blink';

export interface BehaviorState {
  facial_expression: FacialExpression;
  head_movement: HeadMovement;
  eye_behavior: EyeBehavior;
}

// --- CORRECTION MODULE ---
export interface CorrectionModule {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  theme: 'orange' | 'cyan' | 'purple' | 'green' | 'blue' | 'gray';
}

// Renamed from NewsItem
export interface DrillItem {
  id: string;
  title: string;     // The Drill Question
  source: string;    // The Module Name
  date: string;      // "DRILL_XX"
  summary: string;   // The Scenario Description
  tags: string[];    // Keywords
  impactScore: number; // Difficulty 0-100
  framework: string; // The "Read More" content (Answer Framework)
}

export type Theme = 'light' | 'dark';
export type SwipeDirection = 'left' | 'right' | 'up' | null;
export type MasteryStatus = 'mastered' | 'needs_practice' | 'skipped';

// --- STATE MANAGEMENT ---
export interface InterviewState {
  connectionState: LiveConnectionState;
  config: InterviewConfig;
  transcript: Message[];
  analyses: QuestionAnalysis[];
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestionText: string; 
  realtimeInputText: string;  
  realtimeOutputText: string; 
  avatarBehavior: BehaviorState;
  isAiSpeaking: boolean;
}
