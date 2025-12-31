
// services/analysisService.ts
// ============================================================
// Real-time Multimodal Analysis Service (Browser / TypeScript)
//
// This service performs real-time audio + video behavioral analysis
//
// - Web Audio API (RMS, Pitch, Prosody)
// - MediaPipe FaceMesh (468 landmarks + Iris)
//
// DESIGN PRINCIPLES:
// 1. All computations are continuous (no hard boolean decisions).
// 2. Temporal smoothing is applied to avoid frame-level noise.
// 3. Speech rate (WPM) logic is intentionally preserved.
// 4. Designed for real-time UI feedback (progress bars, dashboards).
// ============================================================

import { AnalysisMetrics } from "../types";

// Global MediaPipe type
declare global {
  interface Window {
    FaceMesh: any;
  }
}

class AnalysisService {
  // =========================
  // AUDIO STATE
  // =========================
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;

  private freqData: Uint8Array | null = null;
  private timeData: Float32Array | null = null;

  // Rolling histories
  private rmsHistory: number[] = [];
  private pitchHistory: number[] = [];
  private speechHistory: { time: number; isSpeech: boolean }[] = [];
  private lastSpeechTimestamp = 0;

  // =========================
  // VIDEO STATE
  // =========================
  private faceMesh: any | null = null;
  private gazeDeviationHistory: number[] = [];

  // =========================
  // GLOBAL STATE
  // =========================
  private isRunning = false;

  public currentMetrics: AnalysisMetrics = {
    speechRate: 0,
    pauseRatio: 0,
    volumeStability: 10,
    eyeContact: 100,
    confidence: 100,
    clarity: 8,
    audioLevel: 0
  };

  // ============================================================
  // AUDIO INITIALIZATION
  // ============================================================
  async initAudio(stream: MediaStream) {
    if (this.audioContext) return;

    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.5; // Smooth out the visualization

    source.connect(this.analyser);

    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Float32Array(this.analyser.fftSize);

    this.isRunning = true;
    this.processAudioLoop();
  }

  // ============================================================
  // VIDEO INITIALIZATION
  // ============================================================
  async initVideo(video: HTMLVideoElement) {
    if (!window.FaceMesh) {
      setTimeout(() => this.initVideo(video), 300);
      return;
    }

    if (video.readyState < 2) {
      setTimeout(() => this.initVideo(video), 100);
      return;
    }

    this.faceMesh = new window.FaceMesh({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true, // Enables iris landmarks
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.faceMesh.onResults(this.onFaceResults.bind(this));

    const loop = async () => {
      if (!this.isRunning) return;
      try {
        await this.faceMesh.send({ image: video });
      } catch {}
      requestAnimationFrame(loop);
    };

    loop();
  }

  // ============================================================
  // AUDIO PROCESSING LOOP
  // ============================================================
  private processAudioLoop() {
    if (!this.isRunning || !this.analyser || !this.freqData || !this.timeData) return;

    const now = Date.now();

    // ---- Frequency data (RMS / loudness) ----
    this.analyser.getByteFrequencyData(this.freqData);

    let sum = 0;
    for (let i = 0; i < this.freqData.length; i++) {
      sum += this.freqData[i] * this.freqData[i];
    }
    const rms = Math.sqrt(sum / this.freqData.length);

    // FIX: Optimized visualization math.
    // Scale RMS (usually 0-255 range for ByteFreqData, but we want a % representation)
    // Non-linear scaling helps visualize quiet talking better.
    const normalizedRMS = rms / 255; 
    let visualLevel = Math.sqrt(normalizedRMS) * 150; // Sqrt boosts small values
    
    this.currentMetrics.audioLevel = Math.max(0, Math.min(100, Math.round(visualLevel)));

    // Track RMS history for stability
    if (rms > 5) {
      this.rmsHistory.push(rms);
      if (this.rmsHistory.length > 10) this.rmsHistory.shift();
    }

    // ---- Time-domain data (Pitch) ----
    this.analyser.getFloatTimeDomainData(this.timeData);
    const pitch = this.computePitch(this.timeData);
    this.updatePitch(pitch);

    // ---- Speech activity detection (UNCHANGED LOGIC) ----
    const SILENCE_THRESHOLD = 15;
    const isSpeech = rms > SILENCE_THRESHOLD;

    if (isSpeech) this.lastSpeechTimestamp = now;
    this.speechHistory.push({ time: now, isSpeech });

    // Keep 0.5s window
    while (
      this.speechHistory.length &&
      now - this.speechHistory[0].time > 500
    ) {
      this.speechHistory.shift();
    }

    this.calculateAudioMetrics();
    requestAnimationFrame(() => this.processAudioLoop());
  }

  // ============================================================
  // AUDIO METRICS 
  // ============================================================
  private calculateAudioMetrics() {
    // ---- Volume stability ----
    let stability = 10;
    if (this.rmsHistory.length > 1) {
      const mean = this.rmsHistory.reduce((a, b) => a + b, 0) / this.rmsHistory.length;
      const variance =
        this.rmsHistory.reduce((a, b) => a + (b - mean) ** 2, 0) /
        this.rmsHistory.length;
      stability = Math.max(0, 10 - Math.sqrt(variance) / 5);
    }
    this.currentMetrics.volumeStability = Number(stability.toFixed(1));

    // ---- Speech rate  ----
    const SILENCE_TIMEOUT = 500;
    const isSpeaking = Date.now() - this.lastSpeechTimestamp < SILENCE_TIMEOUT;

    if (!isSpeaking) {
      this.currentMetrics.speechRate = 0;
      this.currentMetrics.pauseRatio = 100;
      return;
    }

    let speechFrames = 0;
    for (const f of this.speechHistory) {
      if (f.isSpeech) speechFrames++;
    }

    const totalFrames = this.speechHistory.length || 1;
    const windowSeconds = totalFrames / 60;
    const activeSeconds = speechFrames / 60;
    const estimatedWords = activeSeconds * 2.5;

    this.currentMetrics.speechRate =
      windowSeconds > 0 ? Math.round((estimatedWords * 60) / windowSeconds) : 0;

    this.currentMetrics.pauseRatio = Number(
      ((1 - speechFrames / totalFrames) * 100).toFixed(1)
    );
  }

  // ============================================================
  // VIDEO PROCESSING
  // ============================================================
  private onFaceResults(results: any) {
    if (!results.multiFaceLandmarks?.length) {
      this.currentMetrics.eyeContact = 0;
      this.currentMetrics.confidence = 0;
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];

    // ---- Continuous gaze deviation ----
    const deviation = this.computeGazeDeviation(landmarks);
    const smoothDeviation = this.smoothGaze(deviation);

    const eyeContactScore = Math.max(0, 100 * (1 - smoothDeviation * 3));
    this.currentMetrics.eyeContact = Math.round(eyeContactScore);

    // ---- Confidence fusion ----
    const pace = this.currentMetrics.speechRate;
    let paceScore = 100;
    if (pace > 180) paceScore = 70;
    if (pace < 80) paceScore = 60;

    const pitchStability = this.getPitchStability() * 100;

    this.currentMetrics.confidence = Math.round(
      this.currentMetrics.eyeContact * 0.35 +
      this.currentMetrics.volumeStability * 10 * 0.25 +
      pitchStability * 0.25 +
      paceScore * 0.15
    );
  }

  // ============================================================
  // GAZE COMPUTATION
  // ============================================================
  private estimateHeadYaw(landmarks: any[]): number {
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const nose = landmarks[1];
    return nose.x - (leftEye.x + rightEye.x) / 2;
  }

  private computeGazeDeviation(landmarks: any[]): number {
    const ratio = (inner: any, outer: any, iris: any) => {
      const w = Math.abs(outer.x - inner.x);
      return w > 0 ? Math.abs(iris.x - inner.x) / w : 0.5;
    };

    const left = ratio(landmarks[362], landmarks[263], landmarks[473]);
    const right = ratio(landmarks[33], landmarks[133], landmarks[468]);

    const gazeCenter = (left + right) / 2;
    const deviation = Math.abs(gazeCenter - 0.5);

    const headYaw = Math.abs(this.estimateHeadYaw(landmarks));
    return deviation + headYaw * 0.8;
  }

  private smoothGaze(value: number): number {
    this.gazeDeviationHistory.push(value);
    if (this.gazeDeviationHistory.length > 15) {
      this.gazeDeviationHistory.shift();
    }
    return (
      this.gazeDeviationHistory.reduce((a, b) => a + b, 0) /
      this.gazeDeviationHistory.length
    );
  }

  // ============================================================
  // PITCH COMPUTATION
  // ============================================================
  private computePitch(signal: Float32Array): number {
    if (!this.audioContext) return 0;
    const sampleRate = this.audioContext.sampleRate;

    let bestLag = 0;
    let maxCorr = 0;

    for (let lag = 20; lag < 200; lag++) {
      let corr = 0;
      for (let i = 0; i < signal.length - lag; i++) {
        corr += signal[i] * signal[i + lag];
      }
      if (corr > maxCorr) {
        maxCorr = corr;
        bestLag = lag;
      }
    }

    return bestLag ? sampleRate / bestLag : 0;
  }

  private updatePitch(pitch: number) {
    if (pitch > 50 && pitch < 400) {
      this.pitchHistory.push(pitch);
      if (this.pitchHistory.length > 20) this.pitchHistory.shift();
    }
  }

  private getPitchStability(): number {
    if (this.pitchHistory.length < 5) return 1;
    const mean =
      this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length;
    const variance =
      this.pitchHistory.reduce((a, b) => a + (b - mean) ** 2, 0) /
      this.pitchHistory.length;
    return Math.max(0, 1 - Math.sqrt(variance) / mean);
  }

  // ============================================================
  // CLEANUP
  // ============================================================
  stop() {
    this.isRunning = false;
    this.audioContext?.close();
    this.audioContext = null;
    this.rmsHistory = [];
    this.pitchHistory = [];
    this.gazeDeviationHistory = [];
    this.speechHistory = [];
  }
}

export const analysisService = new AnalysisService();
