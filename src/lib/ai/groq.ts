import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export interface ChatCompletionOptions {
  messages: { role: string; content: string }[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: options.messages,
      model: options.model || "llama-3.3-70b-versatile",
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq API error:", error);
    throw error;
  }
}

export async function analyzePhotoWithGroq(
  imageBase64: string,
  analysisType: "quick" | "detailed" | "comprehensive" = "detailed"
): Promise<string> {
  const prompts = {
    quick: `Analyze this photo briefly. Provide:
1. Overall appearance score (1-10)
2. 3 quick tips for improvement
Keep it under 100 words.`,

    detailed: `Analyze this person's appearance in detail. Provide:
1. Overall appearance score (1-10)
2. Face shape and facial harmony analysis
3. Skin condition assessment
4. Hair style and condition
5. Style and fashion sense
6. Top 3 strengths
7. Top 3 areas for improvement
8. 5 actionable tips

Format your response clearly with headers.`,

    comprehensive: `Perform a comprehensive appearance analysis. Examine:
1. Facial structure (shape, symmetry, proportions, golden ratio alignment)
2. Skin (tone, texture, clarity, hydration indicators)
3. Hair (style, volume, health, suitability to face shape)
4. Fashion (clothing choices, colors, fit, overall aesthetic)
5. Grooming (hygiene indicators, attention to detail)
6. Non-verbal presence (posture hints, expression)

Provide:
- Overall attractiveness score (1-10) with reasoning
- Category scores (face, skin, hair, style, grooming)
- Personalized recommendations based on their features
- A realistic transformation roadmap

Be specific and actionable in your advice.`,
  };

  const response = await createChatCompletion({
    messages: [
      {
        role: "system",
        content: `You are an expert appearance and aesthetics consultant specializing in looksmaxing. You provide honest, constructive, and motivating feedback. Focus on actionable advice that considers individual features rather than generic beauty standards.`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompts[analysisType],
          },
        ],
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    maxTokens: analysisType === "quick" ? 200 : analysisType === "detailed" ? 800 : 1500,
  });

  return response;
}

export async function getChatAdvice(
  userMessage: string,
  chatHistory: { role: string; content: string }[] = []
): Promise<string> {
  const response = await createChatCompletion({
    messages: [
      {
        role: "system",
        content: `You are a friendly, knowledgeable appearance advisor for teens and young adults. You provide practical advice on:
- Skincare routines and acne treatment
- Hairstyle recommendations based on face shape
- Fashion and style tips
- Fitness and jawline exercises
- Grooming best practices
- Building confidence

Be encouraging, non-judgmental, and age-appropriate. Always prioritize health and self-confidence over unrealistic beauty standards.`,
      },
      ...chatHistory,
      {
        role: "user",
        content: userMessage,
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.8,
    maxTokens: 500,
  });

  return response;
}
