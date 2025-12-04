# Hireprep –  Multimodal Interview Coach & Simulation Platform

Hireprep is a next-generation multimodal interview coach that blends AI avatars, real-time video & audio interaction, and behavioral intelligence to offer deeply realistic mock interview experiences. Its mission is to make world-class interview training accessible to everyone.

## Key Features & Unique Selling Proposition
The logic of a intelligence agent can de divided to three steps:(i)Perception -- Multimodal module;(ii)Decision：Gemini model;(iii)Action
---

1. **Controlled, Reasoning-Driven Interview Agent**
    1. Hireprep uses xxx(not decided) to drive a fully controlled interview flow. The agent **reasons internally** about the candidate’s content and behavioral signals, then decides whether to **advance to the next competency, issue a deeper follow-up, or begin wrapping up**.
2. **Fully Configurable & Realistic Interview Scenarios**
    1. Users can configure **interview persona (HR / Tech / Boss), difficulty level, duration, and competency focus**. The system uses **resume- and JD-aware prompting** to generate targeted, role-specific questions (e.g., HR, behavioral, technical). This produces a personalized and realistic mock interview aligned with real hiring expectations—without requiring a heavy RAG subsystem.
        1. Generative AI for LLM-based generative, eg: gemini-2.5-flash …, configurable via **different prompts**
3. **Lightweight, High-Impact Multimodal Analysis**：
    1. The platform combines **MediaPipe FaceMesh + Iris** for precise gaze tracking with **Web Audio API** for prosodic analysis. This setup enables real-time, low-latency estimation of **eye-contact ratio, speaking rate, pause ratio, and volume stability**, without relying on heavy vision or speech-emotion models.
4. **Comprehensive Feedback & Progress Tracking**：
    1. After each interview, users receive content quality scores, communication scores, speaking pace analysis, filler word frequency, vocal tone variability, and body language ratings with timestamps and clip-based feedback, while a historical dashboard displays radar charts, improvement curves, skill trends, and personalized coaching suggestions.

---

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1loYikYTcEZZL3-DkC15qlmdllc6IOkOn

## Run Locally

**Prerequisites:**  Node.js Backend + React&Vite Fronted


1. Install dependencies:
   `npm install`
   ```bash
   cd backend
   npm install
   ```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   ```bash
   cd backend
   node server.js
   ```
   `npm run dev`
