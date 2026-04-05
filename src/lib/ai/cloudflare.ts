export interface CloudflareAIOptions {
  accountId: string;
  apiToken: string;
}

export interface AnalysisPrompt {
  imageBase64: string;
  analysisType: "quick" | "detailed" | "comprehensive";
}

const VISION_PROMPTS = {
  quick: "Give a brief appearance assessment: score (1-10), 3 quick improvement tips. Be concise.",

  detailed: `Analyze this person's appearance thoroughly:
- Facial features and harmony
- Skin condition and clarity
- Hair style and health
- Overall style and grooming

Provide scores (1-10) and specific, actionable advice.`,

  comprehensive: `Perform a detailed appearance analysis:
1. Facial Structure: Analyze face shape, symmetry, jawline definition, cheekbones, forehead proportions
2. Skin Health: Assess skin tone, texture, clarity, signs of aging, hydration
3. Hair & Grooming: Evaluate style suitability, hair health, grooming level
4. Fashion Sense: Review clothing choices, color coordination, fit
5. Overall Presence: Consider posture hints, expression, confidence indicators

Provide detailed scores and a personalized improvement plan.`,
};

export async function analyzeWithCloudflare(
  imageBase64: string,
  type: "quick" | "detailed" | "comprehensive" = "detailed"
): Promise<string> {
  const accountId = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("Cloudflare credentials not configured");
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are an expert appearance consultant. Provide honest, constructive, and motivating feedback about facial aesthetics, skin health, hair styling, and fashion.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: VISION_PROMPTS[type],
                },
              ],
            },
          ],
          max_tokens: type === "quick" ? 200 : type === "detailed" ? 600 : 1200,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result?.response || "Analysis failed. Please try again.";
  } catch (error) {
    console.error("Cloudflare AI error:", error);
    throw error;
  }
}

export async function chatWithCloudflare(
  message: string,
  history: { role: string; content: string }[] = []
): Promise<string> {
  const accountId = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("Cloudflare credentials not configured");
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct-fp8`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are a friendly appearance advisor for teens. Provide practical, encouraging advice on skincare, hairstyling, fashion, and grooming.",
            },
            ...history,
            {
              role: "user",
              content: message,
            },
          ],
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result?.response || "Chat failed. Please try again.";
  } catch (error) {
    console.error("Cloudflare chat error:", error);
    throw error;
  }
}
