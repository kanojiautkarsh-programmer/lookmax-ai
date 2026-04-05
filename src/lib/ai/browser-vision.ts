import { pipeline, FeatureExtractionPipeline } from "@xenova/transformers";

let featurePipeline: FeatureExtractionPipeline | null = null;

export async function initBrowserAI(): Promise<void> {
  if (typeof window === "undefined") return;
  
  try {
    featurePipeline = await pipeline(
      "feature-extraction",
      "Xenova/transformers"
    );
  } catch (error) {
    console.warn("Browser AI initialization failed:", error);
  }
}

export async function analyzeImageFeatures(imageBase64: string): Promise<number[]> {
  if (!featurePipeline) {
    await initBrowserAI();
  }
  
  if (!featurePipeline) {
    return Array(768).fill(0.5);
  }
  
  try {
    const result = await featurePipeline(imageBase64, {
      pooling: "mean",
      normalize: true,
    });
    return Array.from(result.data);
  } catch {
    return Array(768).fill(0.5);
  }
}

export function calculateSymmetry(landmarks: number[][]): number {
  if (!landmarks || landmarks.length === 0) return 0.5;
  
  const leftPoints = landmarks.slice(0, Math.floor(landmarks.length / 2));
  const rightPoints = landmarks.slice(Math.floor(landmarks.length / 2));
  
  if (leftPoints.length === 0 || rightPoints.length === 0) return 0.5;
  
  let totalDistance = 0;
  const minLen = Math.min(leftPoints.length, rightPoints.length);
  
  for (let i = 0; i < minLen; i++) {
    const dx = leftPoints[i][0] - rightPoints[i][0];
    const dy = leftPoints[i][1] - rightPoints[i][1];
    totalDistance += Math.sqrt(dx * dx + dy * dy);
  }
  
  const avgDistance = totalDistance / minLen;
  const symmetryScore = Math.max(0, 1 - avgDistance / 100);
  
  return Math.round(symmetryScore * 100) / 100;
}

export function estimateFaceShape(landmarks: number[][]): string {
  if (!landmarks || landmarks.length < 68) return "Unknown";
  
  const jawWidth = landmarks[16][0] - landmarks[0][0];
  const faceHeight = landmarks[8][1] - landmarks[27][1];
  const foreheadWidth = landmarks[19][0] - landmarks[24][0];
  
  const ratio = jawWidth / faceHeight;
  
  if (ratio < 0.85) return "Oval";
  if (ratio < 1.0) return "Heart";
  if (ratio < 1.15) return "Round";
  if (ratio < 1.35) return "Square";
  return "Long";
}

export function analyzeSkinTone(imageData: ImageData): {
  skinTone: string;
  undertone: string;
  evenness: number;
} {
  const data = imageData.data;
  let r = 0, g = 0, b = 0;
  let count = 0;
  
  for (let i = 0; i < data.length; i += 16) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    
    const brightness = (red + green + blue) / 3;
    if (brightness > 50 && brightness < 220) {
      r += red;
      g += green;
      b += blue;
      count++;
    }
  }
  
  if (count === 0) {
    return { skinTone: "Unknown", undertone: "Unknown", evenness: 0.5 };
  }
  
  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);
  
  const undertone = r > b ? "Warm" : b > r ? "Cool" : "Neutral";
  
  let skinTone: string;
  const brightness = (r + g + b) / 3;
  
  if (brightness < 100) {
    skinTone = "Deep";
  } else if (brightness < 130) {
    skinTone = "Dark";
  } else if (brightness < 160) {
    skinTone = "Medium";
  } else if (brightness < 190) {
    skinTone = "Olive";
  } else if (brightness < 220) {
    skinTone = "Light";
  } else {
    skinTone = "Fair";
  }
  
  let variance = 0;
  for (let i = 0; i < data.length; i += 16) {
    const dr = data[i] - r;
    const dg = data[i + 1] - g;
    const db = data[i + 2] - b;
    variance += dr * dr + dg * dg + db * db;
  }
  
  const avgVariance = variance / count;
  const evenness = Math.max(0, 1 - avgVariance / 5000);
  
  return {
    skinTone,
    undertone,
    evenness: Math.round(evenness * 100) / 100,
  };
}

export async function quickAttractivenessScore(imageBase64: string): Promise<number> {
  try {
    const features = await analyzeImageFeatures(imageBase64);
    const avg = features.reduce((a, b) => a + b, 0) / features.length;
    return Math.round(Math.min(10, Math.max(1, avg * 10)) * 10) / 10;
  } catch {
    return 5.0;
  }
}
