import { AnalysisResult, AnalysisType } from "../types";
import { 
  quickAttractivenessScore, 
  analyzeSkinTone, 
  estimateFaceShape,
  calculateSymmetry 
} from "./browser-vision";
import { analyzePhotoWithGroq } from "./groq";
import { analyzeWithCloudflare } from "./cloudflare";

function parseScoreFromText(text: string, category: string): number {
  const patterns = [
    new RegExp(`${category}[^0-9]*([0-9]+(?:\\.[0-9])?)`, "i"),
    new RegExp(`(${category})[^:]*:\\s*([0-9]+(?:\\.[0-9])?)`, "i"),
    new RegExp(`([0-9]+(?:\\.[0-9])?)\\s*(?:/|out of|\\/10)\\s*${category}`, "i"),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const score = parseFloat(match[1]);
      if (score >= 1 && score <= 10) return score;
    }
  }

  return 5.0;
}

function parseOverallScore(text: string): number {
  const patterns = [
    /overall[^0-9]*([0-9]+(?:\.[0-9])?)/i,
    /score[^0-9]*([0-9]+(?:\.[0-9])?)/i,
    /attractiveness[^0-9]*([0-9]+(?:\.[0-9])?)/i,
    /rating[^0-9]*([0-9]+(?:\.[0-9])?)/i,
    /([0-9]+(?:\.[0-9])?)\s*(?:\/|out of|\\/10)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const score = parseFloat(match[1]);
      if (score >= 1 && score <= 10) return score;
    }
  }

  return 5.0;
}

function extractTips(text: string): string[] {
  const tips: string[] = [];
  const lines = text.split(/[.\n]/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.length > 10 &&
      trimmed.length < 200 &&
      (trimmed.match(/^\d+\./) || 
       trimmed.match(/^[-•*]/)||
       trimmed.match(/tip|advice|recommend|suggest|try|consider/i))
    ) {
      tips.push(trimmed.replace(/^[-\d.\s•*]+/, "").trim());
    }
  }

  return tips.slice(0, 5);
}

function extractStrengths(text: string): string[] {
  const strengths: string[] = [];
  const lowerText = text.toLowerCase();
  
  const positivePatterns = [
    /strong\s+\w+/i,
    /good\s+\w+/i,
    /nice\s+\w+/i,
    /great\s+\w+/i,
    /excellent\s+\w+/i,
    /well[-\s]defined/i,
    /positive\s+\w+/i,
    /stands\s+out/i,
  ];

  for (const pattern of positivePatterns) {
    const match = text.match(pattern);
    if (match && strengths.length < 3) {
      strengths.push(match[0]);
    }
  }

  return strengths.length > 0 ? strengths : ["Good overall appearance"];
}

function extractImprovements(text: string): string[] {
  const improvements: string[] = [];
  const lines = text.split(/[.\n]/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.length > 10 &&
      trimmed.length < 200 &&
      (trimmed.match(/improve|could\s+be|consider|work\s+on|focus\s+on|try/i))
    ) {
      improvements.push(trimmed.replace(/^[-\d.\s•*]+/, "").trim());
    }
  }

  return improvements.slice(0, 5);
}

function extractFaceShape(text: string): string {
  const shapes = ["Oval", "Heart", "Round", "Square", "Long", "Diamond", "Oblong"];
  const lowerText = text.toLowerCase();
  
  for (const shape of shapes) {
    if (lowerText.includes(shape.toLowerCase())) {
      return shape;
    }
  }
  
  return "Oval";
}

function extractSkinTone(text: string): string {
  const tones = [
    "Fair", "Light", "Medium", "Olive", "Tan", "Dark", "Deep", 
    "Porcelain", "Ivory", "Beige", "Caramel", "Chestnut", "Ebony"
  ];
  const lowerText = text.toLowerCase();
  
  for (const tone of tones) {
    if (lowerText.includes(tone.toLowerCase())) {
      return tone;
    }
  }
  
  return "Medium";
}

export async function performAnalysis(
  imageBase64: string,
  type: AnalysisType = "detailed"
): Promise<AnalysisResult> {
  let detailedAnalysis: string;
  let scores = {
    overall: 5.0,
    face: 5.0,
    skin: 5.0,
    hair: 5.0,
    style: 5.0,
  };
  let skinCondition = "Good";
  let hairType = "Unknown";
  let styleAdvice: string[] = [];

  const browserScore = await quickAttractivenessScore(imageBase64);
  scores.overall = browserScore;

  try {
    detailedAnalysis = await analyzeWithCloudflare(imageBase64, type);
  } catch {
    try {
      detailedAnalysis = await analyzePhotoWithGroq(imageBase64, type);
    } catch (error) {
      detailedAnalysis = `Quick analysis complete. Overall score: ${browserScore}/10. For detailed analysis, please configure AI API keys.`;
    }
  }

  scores.overall = parseOverallScore(detailedAnalysis) || browserScore;
  scores.face = parseScoreFromText(detailedAnalysis, "face") || Math.round(browserScore * 0.95 * 10) / 10;
  scores.skin = parseScoreFromText(detailedAnalysis, "skin") || Math.round(browserScore * 0.9 * 10) / 10;
  scores.hair = parseScoreFromText(detailedAnalysis, "hair") || Math.round(browserScore * 0.85 * 10) / 10;
  scores.style = parseScoreFromText(detailedAnalysis, "style") || Math.round(browserScore * 0.8 * 10) / 10;

  const tips = extractTips(detailedAnalysis);
  const strengths = extractStrengths(detailedAnalysis);
  const improvements = extractImprovements(detailedAnalysis);
  const faceShape = extractFaceShape(detailedAnalysis);
  const skinTone = extractSkinTone(detailedAnalysis);

  if (detailedAnalysis.toLowerCase().includes("acne") || 
      detailedAnalysis.toLowerCase().includes("blemish")) {
    skinCondition = "Needs attention";
  } else if (detailedAnalysis.toLowerCase().includes("clear") ||
             detailedAnalysis.toLowerCase().includes("healthy")) {
    skinCondition = "Excellent";
  }

  if (detailedAnalysis.toLowerCase().includes("straight")) {
    hairType = "Straight";
  } else if (detailedAnalysis.toLowerCase().includes("curly")) {
    hairType = "Curly";
  } else if (detailedAnalysis.toLowerCase().includes("wavy")) {
    hairType = "Wavy";
  }

  if (detailedAnalysis.toLowerCase().includes("casual")) {
    styleAdvice.push("Consider upgrading to smart casual for more polished looks");
  }
  if (detailedAnalysis.toLowerCase().includes("fit") || detailedAnalysis.toLowerCase().includes("slim")) {
    styleAdvice.push("Well-fitted clothing enhances your natural proportions");
  }

  return {
    id: "",
    imageUrl: imageBase64,
    timestamp: new Date(),
    scores,
    analysis: {
      faceShape,
      skinTone,
      skinCondition,
      hairType,
      styleAdvice,
    },
    tips,
    strengths,
    improvements,
    detailedAnalysis,
  };
}
