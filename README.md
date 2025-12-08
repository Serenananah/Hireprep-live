# Hireprep – Multimodal Interview Coach & Simulation Platform

Hireprep is a multimodal interview coach blending AI avatars, real-time audio/video interaction, and behavioral intelligence to create realistic mock interview experiences.

## Key Features

1. **Reasoning-Driven Interview Agent**  
   Uses Gemini Live API to control interview flow: follow-ups, competency switching, wrap-up logic.

2. **Configurable Interview Scenarios**  
   Industry, role, difficulty, duration, JD-aware and resume-aware prompting.

3. **Lightweight Multimodal Analysis**  
   MediaPipe FaceMesh + Iris (gaze, blink, eye-contact) and Web Audio API (speaking rate, pauses, volume).

4. **Comprehensive Feedback**  
   Content scoring, communication metrics, filler words, body-language estimates, trend charts.

---

## Tech Stack

### Frontend
- React + Vite + TypeScript  
- TailwindCSS  
- MediaPipe FaceMesh/Iris  
- Web Audio API  
- Three.js + React-Three-Fiber (Galaxy & Starfield backgrounds)

### Backend
- Node.js + Express  
- SQLite (`db.sqlite`)  
- Auth API + Session storage  
- File parsing utilities

### AI Layer
- Gemini 2.0 Flash / 2.5 Audio (Live API)  
- Streaming audio generation + bidirectional control signals  
- Structured system prompts for interview flow

---

## Page Previews

### Landing Page
![Landing](./figures/Landing.png)

### Sign In
![Sign In](./figures/sign in.png)

### Sign Up
![Sign Up](./figures/sign up.png)

### Setup Page
![Setup](./figures/set up.png)

### Interview Page
![Interview](./figures/interview.png)

### Feedback Pages
![Feedback 1](./figures/feedback-1.png)  
![Feedback 2](./figures/feedback-2.png)

---

# Run Locally

**Prerequisites:**  Node.js Backend + React&Vite Fronted

### 1. Install dependencies

```bash
npm install
cd backend
npm install
```

### 2. Set Gemini API Key
Create .env.local:

```bash
GEMINI_API_KEY=your_key_here
```

### 3. Start Backend

```bash
cd backend
node server.js
```

### 4. Start Frontend
```bash
npm run dev
```
