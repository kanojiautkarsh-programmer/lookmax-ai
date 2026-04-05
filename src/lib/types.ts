export interface AnalysisResult {
  id: string;
  imageUrl: string;
  timestamp: Date;
  scores: {
    overall: number;
    face: number;
    skin: number;
    hair: number;
    style: number;
  };
  analysis: {
    faceShape: string;
    skinTone: string;
    skinCondition: string;
    hairType: string;
    styleAdvice: string[];
  };
  tips: string[];
  strengths: string[];
  improvements: string[];
  detailedAnalysis?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface UserProgress {
  analyses: AnalysisResult[];
  chatHistory: ChatMessage[];
  goals: string[];
  streakDays: number;
  lastActive: Date;
}

export type AnalysisType = "quick" | "detailed" | "comprehensive";

export interface AnalysisRequest {
  imageBase64: string;
  type: AnalysisType;
}
