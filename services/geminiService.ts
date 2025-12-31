
import { GoogleGenAI, LiveServerMessage, Type, FunctionDeclaration, Modality } from "@google/genai";
import { InterviewConfig, Difficulty, InterviewSession, FinalReport, CorrectionModule, DrillItem } from "../types";

// --- CONFIGURATION ---
const API_KEY = process.env.API_KEY;
const MODEL = "gemini-2.0-flash-exp";

// --- AUDIO CONSTANTS ---
const INPUT_SAMPLE_RATE = 16000; // Gemini expects 16kHz
const OUTPUT_SAMPLE_RATE = 24000; // Gemini sends 24kHz

// --- TYPES ---
export interface LiveClientEvents {
  onOpen: () => void;
  onClose: (event: CloseEvent) => void;
  onError: (error: Event) => void;
  onAudioData: (audioBuffer: AudioBuffer) => void;
  onTranscript: (text: string, isUser: boolean, isFinal: boolean) => void;
  onToolCall: (toolName: string, args: any) => Promise<any>;
  onSpeakingChanged?: (isSpeaking: boolean) => void;
}

/**
 * GEMINI LIVE CLIENT (SDK VERSION)
 * Uses the official @google/genai SDK to manage the Live session.
 */
export class GeminiLiveClient {
  private ai: GoogleGenAI;
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private inputProcessor: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;

  // VAD State
  private lastSpeechTime = 0;
  private isSpeaking = false;

  // Audio Playback Queue
  private nextStartTime: number = 0;
  private audioQueue: AudioBufferSourceNode[] = [];

  // Avatar State
  private activeSources = 0;

  // Connection Promise
  private connectPromise: Promise<any> | null = null;

  constructor(private events: LiveClientEvents) {
    if (!API_KEY) {
      throw new Error("API_KEY is not set");
    }
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  private updateSpeakingState(delta: number) {
    const wasSpeaking = this.activeSources > 0;
    this.activeSources += delta;
    const isSpeaking = this.activeSources > 0;

    if (wasSpeaking !== isSpeaking && this.events.onSpeakingChanged) {
      this.events.onSpeakingChanged(isSpeaking);
    }
  }

  /**
   * Connect to Gemini Live API using SDK
   */
  public async connect(config: InterviewConfig) {
    this.disconnect(); // Ensure clean state

    // 1. Calculate Plan based on Duration/Difficulty
    // Strategy: Mix Resume Deep-Dive, Behavioral, and Technical/Scenario
    let questionCount = 3;
    let topicMix = "1 Resume Deep-Dive, 1 Behavioral, 1 Technical Scenario";

    if (config.duration >= 30) {
      questionCount = 7;
      topicMix = "2 Resume Deep-Dive, 2 Behavioral, 3 Technical (Role-Specific Scenarios)";
    } else if (config.duration >= 20) {
      questionCount = 5;
      topicMix = "2 Resume Deep-Dive, 1 Behavioral, 2 Technical (Role-Specific Scenarios)";
    }

    const roleTitle = config.role?.title || "Candidate";
    const difficultyLevel = config.difficulty; // Easy/Standard/Hard

    const systemInstruction = `
    You are Sarah, an expert AI Interview Coach.
    
    SESSION PLAN:
    - Role: ${roleTitle} (${config.industry})
    - Duration: ${config.duration} mins
    - Target Question Count: ${questionCount}
    - Topic Strategy: ${topicMix}
    - Difficulty: ${difficultyLevel}
    - Resume Context: ${config.resumeText.slice(0, 2000)}...
    
    INTERVIEW PHASES:
    1. **Introduction**: Brief welcome (keep it short).
    2. **Execution**: Ask questions following the Topic Strategy.
    3. **Wrap-up**: Brief closing after ${questionCount} questions.

    BEHAVIOR:
    - You are conducting a spoken interview.
    - Ask ONE question at a time.
    - **Resume Questions**: Ask specific questions about their actual projects, roles, or skills mentioned in the Resume Context.
    - **Technical/Scenario Questions**: Do NOT just ask definitions. Ask for **Role-Specific Scenarios** (e.g., "How would you design X system?" or "A client disagrees with Y, what do you do?") relevant to the JD and Role.
    - **Behavioral Questions**: Focus on soft skills and STAR method.
    - Wait for the user to finish speaking. Do not interrupt natural pauses (ums, ahs).
    - If the user is silent for a while, wait.
    - Do NOT mention "Question 1 of 5" explicitly, just ask naturally.
    - If the user gives a short answer, drill down.

    AVATAR CONTROL:
    - Call \`set_avatar_behavior\` at the start of every turn to match your tone.
    - Use 'attentive' when listening, 'slight_smile' when greeting, 'thinking' when analyzing.
    
    HIDDEN TOOLS:
    - When the candidate finishes an answer and you are satisfied (or want to move on), call \`save_assessment\`.
    - Calling this tool marks the question as "Done".
    - **CRITICAL ASSESSMENT RULES**:
      - You must be highly specific in your feedback.
      - **strengths**: Do not just say "Good communication". Say "Effective use of the STAR method to structure the conflict resolution story."
      - **areas_for_improvement**: Do not just say "Speak clearer". Say "The answer lacked technical depth regarding the database schema choice; mention specific trade-offs (e.g., SQL vs NoSQL)."
      - Evaluate the **content** (depth, relevance, correctness) and **delivery** (structure, tone).
    `;

    // Tool Definition
    const saveAssessmentTool: FunctionDeclaration = {
      name: "save_assessment",
      description: "Log assessment data for the candidate's answer. Call this silently.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          full_question_text: { type: Type.STRING, description: "The exact text of the question you just asked the candidate." },
          question_topic: { type: Type.STRING },
          user_answer_summary: { type: Type.STRING },
          content_score: { type: Type.NUMBER, description: "1-10" },
          delivery_score: { type: Type.NUMBER, description: "1-10" },
          feedback: { type: Type.STRING, description: "Short constructive feedback (2-3 sentences)" },
          strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 2-3 specific strengths in the answer"
          },
          areas_for_improvement: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 2-3 specific areas to improve"
          }
        },
        required: [
          "full_question_text",
          "question_topic",
          "user_answer_summary",
          "content_score",
          "delivery_score",
          "feedback",
          "strengths",
          "areas_for_improvement"
        ]
      }
    };

    const avatarTool: FunctionDeclaration = {
      name: "set_avatar_behavior",
      parameters: {
        type: Type.OBJECT,
        description: "Updates the visual state of the digital avatar.",
        properties: {
          facial_expression: {
            type: Type.STRING,
            enum: [
              "neutral", "slight_smile", "smile", "thinking", "confused",
              "attentive", "surprised", "skeptical", "sad", "determined",
              "joyful", "angry", "loving", "sleepy", "wink", "playful",
              "pleading", "cool"
            ]
          },
          head_movement: {
            type: Type.STRING,
            enum: ["nod", "slight_nod", "shake", "tilt_left", "tilt_right", "lean_forward", "lean_back", "still"]
          },
          eye_behavior: {
            type: Type.STRING,
            enum: ["maintain_gaze", "brief_look_away", "blink"]
          }
        },
        required: ["facial_expression", "head_movement", "eye_behavior"]
      }
    };

    // Initialize Audio Context for Output
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: OUTPUT_SAMPLE_RATE
    });

    try {
      this.connectPromise = this.ai.live.connect({
        model: MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
          },
          systemInstruction,
          tools: [{ functionDeclarations: [saveAssessmentTool, avatarTool] }]
        },
        callbacks: {
          onopen: () => {
            console.log("[GeminiLive] Connected via SDK");
            this.events.onOpen();
          },
          onmessage: async (message: LiveServerMessage) => {
            await this.handleServerMessage(message);
          },
          onclose: (e) => {
            console.log("[GeminiLive] Closed");
            this.events.onClose(e as unknown as CloseEvent);
          },
          onerror: (e) => {
            console.error("[GeminiLive] Error", e);
            this.events.onError(e as unknown as Event);
          }
        }
      });

      this.session = await this.connectPromise;
    } catch (e) {
      console.error("[GeminiLive] Connection failed", e);
      this.events.onError(new Event("ConnectionFailed"));
    }
  }

  /**
   * Send a "Hidden" text command to the model to steer behavior
   */
  public async sendControlMessage(text: string) {
    if (!this.session) return;
    try {
      await this.session.sendRealtimeInput({
        content: [{ text: `[SYSTEM_INSTRUCTION]: ${text}` }]
      });
    } catch (e) {
      console.error("Failed to send control message", e);
    }
  }

  /**
   * Handle incoming messages from the SDK
   */
  private async handleServerMessage(message: LiveServerMessage) {
    const parts = message.serverContent?.modelTurn?.parts;

    // 1. Handle Audio/Text Output
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          this.queueAudio(part.inlineData.data);
        }
        if (part.text) {
          this.events.onTranscript(part.text, false, false);
        }
      }
    }

    // 2. Handle Tool Calls
    if (message.toolCall) {
      this.handleToolCall(message.toolCall);
    }
  }

  private async handleToolCall(toolCall: any) {
    for (const call of toolCall.functionCalls) {
      console.log("[GeminiLive] Tool Call:", call.name);
      try {
        const result = await this.events.onToolCall(call.name, call.args);

        // If onToolCall returns explicit result, use it, otherwise default
        const responseResult = result || { result: "assessment_saved" };

        this.session?.sendToolResponse({
          functionResponses: [
            {
              name: call.name,
              id: call.id,
              response: responseResult
            }
          ]
        });
      } catch (e) {
        console.error("Tool execution failed", e);
      }
    }
  }

  /**
   * Disconnect and cleanup
   */
  public disconnect() {
    this.stopAudioInput();

    if (this.session && typeof (this.session as any).close === "function") {
      (this.session as any).close();
    }

    this.session = null;
    this.connectPromise = null;

    this.audioQueue.forEach((source) => source.stop());
    this.audioQueue = [];
    this.updateSpeakingState(-this.activeSources);
    this.activeSources = 0;

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Start Microphone Streaming with VAD
   */
  public async startAudioInput(stream: MediaStream) {
    if (!this.audioContext) return;
    if (this.audioContext.state === "suspended") await this.audioContext.resume();

    this.inputSource = this.audioContext.createMediaStreamSource(stream);
    this.inputProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.inputProcessor.onaudioprocess = (e) => {
      if (!this.session) return;

      try {
        const inputData = e.inputBuffer.getChannelData(0);

        // --- VAD LOGIC ---
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const now = Date.now();

        // Threshold: 0.01 is a reasonable noise floor
        if (rms > 0.01) {
          this.isSpeaking = true;
          this.lastSpeechTime = now;
        }

        // Hangover time: Keep active for 1500ms after speech stops to prevent interruptions
        if (now - this.lastSpeechTime > 1500) {
          this.isSpeaking = false;
        }

        // --- SEND DATA OR SILENCE ---
        let pcm16: Int16Array;

        if (this.isSpeaking) {
          pcm16 = this.downsampleBuffer(inputData, this.audioContext!.sampleRate, INPUT_SAMPLE_RATE);
        } else {
          // Send silence frame to keep connection alive
          const len = Math.floor(inputData.length * (INPUT_SAMPLE_RATE / this.audioContext!.sampleRate));
          pcm16 = new Int16Array(len).fill(0);
        }

        // CRITICAL CHECK: Ensure we have a valid buffer before converting
        if (pcm16 && pcm16.buffer) {
          const base64Audio = this.arrayBufferToBase64(pcm16.buffer);
          this.session.sendRealtimeInput({
            media: {
              mimeType: "audio/pcm;rate=16000",
              data: base64Audio
            }
          });
        }
      } catch (err) {
        console.error("Audio Input Processing Error:", err);
      }
    };

    this.inputSource.connect(this.inputProcessor);
    this.inputProcessor.connect(this.audioContext.destination);
  }

  public stopAudioInput() {
    if (this.inputProcessor) {
      this.inputProcessor.disconnect();
      this.inputProcessor = null;
    }
    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }
  }

  // --- AUDIO PROCESSING HELPERS ---

  private async queueAudio(base64Data: string) {
    if (!this.audioContext || !base64Data) return;

    try {
      const pcmData = this.base64ToPCM(base64Data);
      if (pcmData.length === 0) return;

      const audioBuffer = this.createAudioBuffer(pcmData);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      const currentTime = this.audioContext.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.audioQueue.push(source);
      this.updateSpeakingState(1);

      source.onended = () => {
        this.audioQueue = this.audioQueue.filter((s) => s !== source);
        this.updateSpeakingState(-1);
      };

      this.events.onAudioData(audioBuffer);
    } catch (e) {
      console.error("Audio queueing error:", e);
    }
  }

  private createAudioBuffer(pcmData: Int16Array): AudioBuffer {
    if (!this.audioContext) throw new Error("No AudioContext");
    const buffer = this.audioContext.createBuffer(1, pcmData.length, OUTPUT_SAMPLE_RATE);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 32768.0;
    }
    return buffer;
  }

  private base64ToPCM(base64: string): Int16Array {
    if (!base64) return new Int16Array(0);
    try {
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Int16Array(bytes.buffer);
    } catch (e) {
      return new Int16Array(0);
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number): Int16Array {
    if (outputRate === inputRate) {
      return this.floatTo16BitPCM(buffer);
    }
    const compression = inputRate / outputRate;
    const length = Math.floor(buffer.length / compression);
    const result = new Int16Array(length);

    for (let i = 0; i < length; i++) {
      const inputIndex = Math.floor(i * compression);
      const sample = Math.max(-1, Math.min(1, buffer[inputIndex]));
      result[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return result;
  }

  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }

  // ============================================================
  // CARD CONTENT GENERATION (STATIC METHODS)
  // ============================================================

  private static safeJsonParse<T>(text: string | undefined, fallback: T): T {
    if (!text) return fallback;
    try {
        // Cleaning: Remove markdown code blocks if present (common Gemini behavior)
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanText) as T;
    } catch (e) {
        console.warn("JSON Parse Failed on:", text);
        return fallback;
    }
  }

  /**
   * UPDATED: Final report generation with MULTIMODAL METRICS
   * FIX: Added data serialization to prevent prompt breakage and empty state checks.
   */
  public static async generateFinalReport(session: InterviewSession): Promise<FinalReport> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // 0. Empty State Guard
    if (!session.analyses || session.analyses.length === 0) {
        console.warn("Generating Report: No analyses found.");
        return {
            summary: "No interview data recorded. Please ensure you complete the interview session.",
            strengths: [],
            weaknesses: [],
            trainingPlan: ["Complete a full session to generate a plan."]
        };
    }

    // 1. Calculate Overall Biometrics
    const totalQs = session.analyses.length;
    const avgEyeContact = Math.round(session.analyses.reduce((acc, a) => acc + (a.metrics?.eyeContact || 0), 0) / totalQs);
    const avgSpeechRate = Math.round(session.analyses.reduce((acc, a) => acc + (a.metrics?.speechRate || 0), 0) / totalQs);
    const avgConfidence = Math.round(session.analyses.reduce((acc, a) => acc + (a.metrics?.confidence || 0), 0) / totalQs);
    const avgVolumeStab = (session.analyses.reduce((acc, a) => acc + (a.metrics?.volumeStability || 0), 0) / totalQs).toFixed(1);

    // 2. Prepare Detailed Transcript (Serialized to prevent string injection issues)
    const interviewDataJSON = JSON.stringify(session.analyses.map((a, i) => ({
        index: i + 1,
        question: a.questionText,
        answer: a.userAnswer || "(No answer detected)",
        scores: { content: a.contentScore, delivery: a.deliveryScore },
        biometrics: {
            eyeContact: a.metrics?.eyeContact,
            speechRate: a.metrics?.speechRate,
            confidence: a.metrics?.confidence
        },
        preliminaryFeedback: a.feedback
    })), null, 2);

    const prompt = `
You are an elite Executive Interview Coach analyzing a ${session.config.role?.title || "professional"} candidate.

**TASK:**
Create a highly specific, data-driven "Executive Performance Report".

**SESSION CONTEXT:**
- Role: ${session.config.role?.title}
- Industry: ${session.config.industry}
- Difficulty: ${session.config.difficulty}

**BIOMETRIC OVERVIEW:**
- Avg Eye Contact: ${avgEyeContact}%
- Avg Speech Rate: ${avgSpeechRate} WPM
- Confidence: ${avgConfidence}%

**INTERVIEW DATA (JSON):**
${interviewDataJSON}

**RULES:**
1. **Evidence-Based:** Cite specific questions (e.g., "In Q2...") or biometric data.
2. **No Fluff:** Be direct and professional.
3. **Training Plan:** Provide 3 actionable drills.

**OUTPUT FORMAT (STRICT JSON ONLY, NO MARKDOWN):**
{
  "summary": "1-2 paragraphs summarizing performance...",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "trainingPlan": ["Drill 1", "Drill 2", "Drill 3"]
}
`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          // Explicitly defining schema helps Gemini adhere to JSON
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              trainingPlan: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["summary", "strengths", "weaknesses", "trainingPlan"]
          }
        }
      });

      return GeminiLiveClient.safeJsonParse<FinalReport>(response.text, {
        summary: "Analysis Completed, but the report generation encountered a formatting error. Please review the detailed question breakdowns below.",
        strengths: ["Completed the session"],
        weaknesses: ["Automated report generation failed"],
        trainingPlan: ["Review individual question feedback"]
      });
    } catch (e) {
      console.error("Failed to generate final report", e);
      return {
        summary: "The interview was completed successfully, but we could not generate the executive summary due to a connection error.",
        strengths: ["Session Completed"],
        weaknesses: ["Report Unavailable"],
        trainingPlan: ["Please check your connection and try again"]
      };
    }
  }

  /**
   * UPDATED: Generate EXACTLY 6 correction modules (dashboard cards)
   */
  public static async generateCorrectionModules(history: InterviewSession[]): Promise<CorrectionModule[]> {
    if (!history || history.length === 0) return [];

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const historicalContext = history
      .slice(-5)
      .map(
        (session, idx) => `
Session ${idx + 1} (${session.config.role?.title || "General"}):
Weaknesses identified: ${(session.finalReport?.weaknesses || []).join(", ") || "None"}
Training Plan: ${(session.finalReport?.trainingPlan || []).join(", ") || "None"}
`
      )
      .join("\n");

    const prompt = `
Analyze the following interview history:

${historicalContext}

Task:
Create exactly 6 distinct "Correction Modules" for focused practice.
These modules will be used as dashboard cards.

Rules:
- Exactly 6 objects.
- Titles: short, punchy, high-tech style (e.g., "SYSTEM DESIGN", "VERBAL PACING")
- Subtitle: short tag like "PACE // CLARITY"
- Description: 1 sentence, specific and practical.
- theme must be one of: orange, cyan, purple, green, blue, gray

Return STRICT JSON array only.
`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                description: { type: Type.STRING },
                theme: { type: Type.STRING, enum: ["orange", "cyan", "purple", "green", "blue", "gray"] }
              },
              required: ["id", "title", "subtitle", "description", "theme"]
            }
          }
        }
      });

      const parsed = GeminiLiveClient.safeJsonParse<CorrectionModule[]>(response.text, []);
      return parsed.slice(0, 6);
    } catch (e) {
      console.error("Failed to generate correction modules", e);
      // Fallback (6 cards)
      return [
        { id: "01", title: "VERBAL PACING", subtitle: "SPEED // CLARITY", description: "Reduce fillers and stabilize pace under pressure.", theme: "orange" },
        { id: "02", title: "ANSWER STRUCTURE", subtitle: "STAR // LOGIC", description: "Deliver structured answers with crisp takeaways.", theme: "cyan" },
        { id: "03", title: "TECHNICAL DEPTH", subtitle: "DETAILS // TRADEOFFS", description: "Go beyond definitions—explain decisions and constraints.", theme: "purple" },
        { id: "04", title: "SYSTEM DESIGN", subtitle: "ARCH // SCALE", description: "Practice end-to-end design with bottlenecks and SLAs.", theme: "green" },
        { id: "05", title: "SIGNAL & CONFIDENCE", subtitle: "TONE // PRESENCE", description: "Sound decisive: clear assertions, fewer hedges.", theme: "blue" },
        { id: "06", title: "SCENARIO DRILLS", subtitle: "ADAPT // SOLVE", description: "Improve reaction speed with realistic role scenarios.", theme: "gray" }
      ];
    }
  }

  /**
   * UPDATED: Generate 2 drill cards per selected module (total = modules.length * 2)
   * - summary: FULL question text
   * - framework: Markdown guide including Strategy + Gold Standard Answer
   */
  public static async generateCorrectionDrills(modules: CorrectionModule[]): Promise<DrillItem[]> {
    if (!modules || modules.length === 0) return [];

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const moduleContext = modules.map((m) => `Module: ${m.title}\nDesc: ${m.description}`).join("\n\n");

    const prompt = `
You are an expert interview coach generating specific practice drills.

Selected modules:
${moduleContext}

Generate EXACTLY 2 Drill Cards for EACH module above.
Total cards = ${modules.length * 2}.

Schema requirements:
- id: string (unique)
- title: short topic header, <= 4 words (Uppercase preferred)
- source: module title it belongs to (must match one of the module titles)
- date: string like "DRILL_01", "DRILL_02"...
- summary: FULL detailed interview question (mixed case, realistic, challenging)
- tags: string[] keywords
- impactScore: number (50-99)
- framework: Markdown string MUST include:
  - "### 🎯 Strategy"
  - "### 🏆 Gold Standard Answer"

Return STRICT JSON array only.
`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                source: { type: Type.STRING },
                date: { type: Type.STRING },
                summary: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                impactScore: { type: Type.NUMBER },
                framework: { type: Type.STRING }
              },
              required: ["id", "title", "source", "summary", "tags", "framework"]
            }
          }
        }
      });

      return GeminiLiveClient.safeJsonParse<DrillItem[]>(response.text, []);
    } catch (e) {
      console.error("Failed to generate drills", e);
      // Simple fallback
      return [
        {
          id: "fallback-1",
          title: "COMPLEXITY",
          source: modules[0]?.title || "COMMUNICATION",
          date: "DRILL_01",
          summary:
            "Explain a complex technical concept you've worked on to a non-technical stakeholder. Communicate business value and tradeoffs, not just implementation details.",
          tags: ["CLARITY", "STAKEHOLDER", "TRADEOFFS"],
          impactScore: 85,
          framework:
            "### 🎯 Strategy\n" +
            "- Start with the business problem in plain language.\n" +
            "- Use one strong analogy, then map it back to the real system.\n" +
            "- State tradeoffs and why your choice was reasonable.\n\n" +
            "### 🏆 Gold Standard Answer\n" +
            "\"Imagine our database like a library. We added an index so we don’t scan every shelf. That reduced lookup time from seconds to milliseconds, which cut user waiting by 40% and lowered infra cost. The tradeoff is extra write overhead, so we tuned it for our workload.\""
        }
      ];
    }
  }
}
