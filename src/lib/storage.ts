import { UserProgress, AnalysisResult, ChatMessage } from "./types";
import { generateId } from "./utils";

const STORAGE_KEY = "looksmaxing_ai_progress";

export function getProgress(): UserProgress {
  if (typeof window === "undefined") {
    return getDefaultProgress();
  }
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return getDefaultProgress();
  }
  
  try {
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      lastActive: new Date(parsed.lastActive),
      analyses: parsed.analyses.map((a: any) => ({
        ...a,
        timestamp: new Date(a.timestamp),
      })),
      chatHistory: parsed.chatHistory.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    };
  } catch {
    return getDefaultProgress();
  }
}

function getDefaultProgress(): UserProgress {
  return {
    analyses: [],
    chatHistory: [],
    goals: [],
    streakDays: 0,
    lastActive: new Date(),
  };
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === "undefined") return;
  
  progress.lastActive = new Date();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function addAnalysis(analysis: Omit<AnalysisResult, "id" | "timestamp">): AnalysisResult {
  const progress = getProgress();
  const newAnalysis: AnalysisResult = {
    ...analysis,
    id: generateId(),
    timestamp: new Date(),
  };
  
  progress.analyses.unshift(newAnalysis);
  
  if (progress.analyses.length > 50) {
    progress.analyses = progress.analyses.slice(0, 50);
  }
  
  saveProgress(progress);
  return newAnalysis;
}

export function addChatMessage(message: Omit<ChatMessage, "id" | "timestamp">): ChatMessage {
  const progress = getProgress();
  const newMessage: ChatMessage = {
    ...message,
    id: generateId(),
    timestamp: new Date(),
  };
  
  progress.chatHistory.push(newMessage);
  
  if (progress.chatHistory.length > 100) {
    progress.chatHistory = progress.chatHistory.slice(-100);
  }
  
  saveProgress(progress);
  return newMessage;
}

export function getAnalysisById(id: string): AnalysisResult | undefined {
  const progress = getProgress();
  return progress.analyses.find((a) => a.id === id);
}

export function clearProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
