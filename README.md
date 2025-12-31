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


## Tech Stack

![Frontend](https://img.shields.io/badge/Frontend-React_18_|_Vite_|_TypeScript-0A7ACC?logo=react&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white)
![TS](https://img.shields.io/badge/TypeScript-Strong-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/TailwindCSS-Design-38B2AC?logo=tailwind-css&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-FaceMesh-yellow?logo=google&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-3D-black?logo=three.js&logoColor=white)

![Backend](https://img.shields.io/badge/Backend-Node.js_|_Express_|_SQLite-3C873A?logo=node.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Server-6DA55F?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-black?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-DB-003B57?logo=sqlite&logoColor=white)

![AI Layer](https://img.shields.io/badge/AI_Layer-Gemini_2.0/2.5_Live_API-8E44AD?logo=google&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Audio-blueviolet?logo=google&logoColor=white)
![Streaming](https://img.shields.io/badge/Live_Audio-Streaming-orange)

## Deployed Website Access

We provide **two deployment versions** of the HirePrep Interview Platform:

### **1. Serverless Deployment (Recommended) — No Backend Required**  
This version runs **entirely in the browser** and does **not require any local backend or database setup**, see [Quick Preview Version](https://hireprep-12-7-1036920270692.us-west1.run.app/)


### **2. Full-Stack Deployment (Requires Local Backend & SQLite)**  
This version connects to the original **Express + SQLite** backend.  
To use this version, you must start the backend server locally, and see [Configured Version](https://hireprep-12-7-32652408982.us-west1.run.app/)

## Page Previews

### Landing Page
![Landing](./figures/Landing.png)

### Sign In
![Sign In](./figures/signin.png)

### Sign Up
![Sign Up](./figures/signup.png)

### Setup Page
![Setup](./figures/setup.png)

### Interview Page
![Interview](./figures/interview.png)

### Feedback Pages
![Feedback 1](./figures/feedback-1.png)  
![Feedback 2](./figures/feedback-2.png)
![Feedback 3](./figures/feedback-3.png)

### Correction Page
![Correction 1](./figures/Correct-1.png) 
![Correction 2](./figures/Correct-2.png) 
![Correction 3](./figures/Correct-3.png) 
![Correction 4](./figures/Correct-4.png) 
![Correction 5](./figures/Correct-5.png) 
![Correction 6](./figures/Correct-6.png) 


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
