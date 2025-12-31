
import { InterviewSession } from "../types";

const STORAGE_KEY = "hireprep_sessions_v1";

export const interviewHistoryService = {
  saveSession(session: InterviewSession) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const sessions: InterviewSession[] = raw ? JSON.parse(raw) : [];
      
      // Update if exists, otherwise push
      const index = sessions.findIndex(s => s.id === session.id);
      if (index !== -1) {
        sessions[index] = session;
      } else {
        sessions.push(session);
      }
      
      // Keep only last 50 sessions to manage space
      if (sessions.length > 50) sessions.shift();
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save session to history", e);
    }
  },

  getSessionHistory(): InterviewSession[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to load session history", e);
      return [];
    }
  },

  clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
  }
};
