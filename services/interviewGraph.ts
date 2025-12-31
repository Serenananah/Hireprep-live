
import { InterviewConfig, InterviewState, LiveConnectionState, Message, QuestionAnalysis, AnalysisMetrics } from "../types";
import { GeminiLiveClient } from "./geminiService";
import { analysisService } from "./analysisService";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export class InterviewGraph {
  private state: InterviewState;
  private listeners: ((state: InterviewState) => void)[] = [];
  private liveClient: GeminiLiveClient;
  private recognition: any = null; // Client-side STT
  private onEnd?: () => void;
  
  // Buffers
  private aiTextBuffer = "";
  private userTranscriptBuffer = ""; // Stores the raw user speech for the current turn

  constructor(config: InterviewConfig, onEnd?: () => void) {
    this.onEnd = onEnd;
    // Calculate total questions based on duration (10min ~ 3, 20min ~ 5, 30min ~ 7)
    let totalQs = 3;
    if (config.duration >= 30) totalQs = 7;
    else if (config.duration >= 20) totalQs = 5;

    this.state = {
      connectionState: 'DISCONNECTED',
      config,
      transcript: [],
      analyses: [],
      currentQuestionIndex: 0,
      totalQuestions: totalQs,
      currentQuestionText: "Waiting for interviewer...", // Default text
      realtimeInputText: "",
      realtimeOutputText: "",
      avatarBehavior: {
        facial_expression: 'neutral',
        head_movement: 'still',
        eye_behavior: 'maintain_gaze'
      },
      isAiSpeaking: false
    };

    // Initialize Client-side Speech Recognition
    this.initSpeechRecognition();

    // Initialize Live Client
    this.liveClient = new GeminiLiveClient({
      onOpen: () => this.updateState({ connectionState: 'CONNECTED' }),
      onClose: () => this.updateState({ connectionState: 'DISCONNECTED' }),
      onError: (e) => {
        console.error("Live Client Error", e);
        this.updateState({ connectionState: 'ERROR' });
      },
      onAudioData: (buffer) => {
        // Audio playback is handled in service
      },
      onSpeakingChanged: (isSpeaking) => {
        this.updateState({ isAiSpeaking: isSpeaking });
      },
      onTranscript: (text, isUser, isFinal) => {
        // NOTE: We only handle AI transcripts here because User transcripts come from WebSpeech API now
        if (!isUser) {
            this.aiTextBuffer += text;
            this.updateState({ currentQuestionText: this.aiTextBuffer });
        }
      },
      onToolCall: async (name, args) => {
        if (name === 'set_avatar_behavior') {
            this.updateState({
                avatarBehavior: {
                    facial_expression: args.facial_expression,
                    head_movement: args.head_movement,
                    eye_behavior: args.eye_behavior
                }
            });
            return { result: "ok" };
        }
        else if (name === 'save_assessment') {
          this.handleAssessment(args);
          
          // Reset buffers for the next round
          this.aiTextBuffer = ""; 
          this.userTranscriptBuffer = ""; // Clear user buffer for next question
          this.updateState({ 
             realtimeInputText: "",
             currentQuestionIndex: this.state.currentQuestionIndex + 1
          });
          
          // Check if we reached the end
          if (this.state.currentQuestionIndex >= this.state.totalQuestions) {
             console.log("[Graph] Interview Complete. wrapping up...");
             // Send wrap up message
             this.liveClient.sendControlMessage("We have reached the target number of questions. Please give a brief closing statement and say goodbye.");
             
             // Wait for the closing statement to play, then FORCE DISCONNECT and NAVIGATE
             setTimeout(() => {
                this.stopSession(); // Step 1: Explicitly cut connection
                if (this.onEnd) {
                    console.log("[Graph] Triggering onEnd callback navigation");
                    this.onEnd(); // Step 2: Navigate to Feedback
                }
             }, 6000); // 6 seconds to allow AI to say "Goodbye"
          }
          return { result: "assessment_saved" };
        }
      }
    });
  }

  private initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
       this.recognition = new SpeechRecognition();
       this.recognition.continuous = true;
       this.recognition.interimResults = true;
       this.recognition.lang = 'en-US';

       this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
             if (event.results[i].isFinal) {
                // <--- CRITICAL: Append final speech to buffer for the report
                this.userTranscriptBuffer += event.results[i][0].transcript + " ";
             } else {
                interimTranscript += event.results[i][0].transcript;
             }
          }
          if (interimTranscript) {
             this.updateState({ realtimeInputText: interimTranscript });
          }
       };

       this.recognition.onend = () => {
          // Auto-restart if we are still connected
          if (this.state.connectionState === 'CONNECTED') {
             try { this.recognition.start(); } catch(e) {}
          }
       };
    } else {
       console.warn("Web Speech API not supported");
    }
  }

  // --- PUBLIC API ---

  public subscribe(callback: (state: InterviewState) => void) {
    this.listeners.push(callback);
    callback(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public async startSession() {
    this.updateState({ connectionState: 'CONNECTING' });
    
    // 1. Start Analysis Sensors (Camera/Mic)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }); 
    await analysisService.initAudio(stream); 
    
    // 2. Start Web Speech API
    if (this.recognition) {
       try { this.recognition.start(); } catch(e) {}
    }

    // 3. Connect to Gemini Live
    await this.liveClient.connect(this.state.config);

    // 4. Start Audio Stream
    await this.liveClient.startAudioInput(stream);
  }

  public stopSession() {
    this.liveClient.disconnect();
    analysisService.stop();
    if (this.recognition) {
       this.recognition.stop();
    }
    this.updateState({ connectionState: 'DISCONNECTED' });
  }

  public nextTopic() {
     this.liveClient.sendControlMessage("Please move on to the next topic immediately.");
  }

  // --- INTERNAL HANDLERS ---

  private handleAssessment(args: any) {
    console.log("[Graph] Saving Assessment:", args);
    
    // Capture current biometrics snapshot
    const metrics = { ...analysisService.currentMetrics };
    
    // Source of Truth Priorities (UPDATED):
    // 1. Question: State Buffer (Actual Transcript) > AI Tool Arg (Summary) > Fallback
    // 2. Answer: Raw Speech Buffer (Actual Transcript) > AI Tool Arg (Summary) > Fallback
    
    const transcriptQuestion = this.aiTextBuffer.trim();
    // Use transcript if available and meaningful length, otherwise fallback to AI summary
    const realQuestion = transcriptQuestion.length > 5 
        ? transcriptQuestion 
        : (args.full_question_text || this.state.currentQuestionText || args.question_topic || "Interview Question");
    
    const rawUserAnswer = this.userTranscriptBuffer.trim().length > 0 
        ? this.userTranscriptBuffer.trim() 
        : (args.user_answer_summary || "(No audio response detected)");

    const newAnalysis: QuestionAnalysis = {
      questionId: this.state.analyses.length + 1,
      questionText: realQuestion,
      userAnswer: rawUserAnswer, // Now prioritizes actual transcript
      metrics: metrics,
      contentScore: Number(args.content_score) || 5,
      deliveryScore: Number(args.delivery_score) || 5,
      feedback: args.feedback || "No feedback provided",
      strengths: args.strengths || [],
      weaknesses: args.areas_for_improvement || [],
      dialogue: [] // Not tracking full dialogue array in this simplified version
    };

    this.updateState({
      analyses: [...this.state.analyses, newAnalysis],
      // Add to permanent transcript log
      transcript: [
        ...this.state.transcript,
        { role: 'ai', text: realQuestion, timestamp: Date.now() },
        { role: 'user', text: rawUserAnswer, timestamp: Date.now() }
      ]
    });
  }

  private updateState(partial: Partial<InterviewState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach(l => l(this.state));
  }
}
