/**
 * LookMax AI - Cloudflare Worker
 * Handles AI-powered face analysis using Workers AI
 * 
 * Deploy with: npx wrangler deploy
 */

export default {
    async fetch(request, env, ctx) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Only allow POST
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        try {
            const body = await request.json();
            const { image, quickAnalysis } = body;

            if (!image) {
                return new Response(JSON.stringify({ error: 'Image is required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Build the prompt with context from quick analysis
            const prompt = buildAnalysisPrompt(quickAnalysis);

            // Call Workers AI with Llama Vision
            const aiResponse = await env.AI.run(
                '@cf/meta/llama-3.2-11b-vision-instruct',
                {
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: prompt
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: image // Base64 or URL
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 1024,
                    temperature: 0.7
                }
            );

            return new Response(JSON.stringify({
                success: true,
                analysis: aiResponse.response,
                model: 'llama-3.2-11b-vision-instruct',
                timestamp: Date.now()
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({
                error: 'Analysis failed',
                message: error.message
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};

/**
 * Build the analysis prompt
 */
function buildAnalysisPrompt(quickAnalysis) {
    const context = quickAnalysis?.symmetryScore
        ? `Quick browser analysis indicates: ${(quickAnalysis.symmetryScore * 100).toFixed(0)}% facial symmetry, ${(quickAnalysis.goldenRatioScore * 100).toFixed(0)}% golden ratio alignment.`
        : '';

    return `You are an expert in facial aesthetics and attractiveness analysis. Analyze the face in this image and provide a detailed assessment.

${context}

Please provide your analysis in this format:

**FACIAL HARMONY** (1-10): [Score] - [Brief explanation]

**SKIN QUALITY** (1-10): [Score] - [Brief assessment of skin clarity, tone, texture]

**FEATURE BALANCE** (1-10): [Score] - [Analysis of how well features work together]

**YOUTHFULNESS** (1-10): [Score] - [Assessment of youth-related features]

**OVERALL ATTRACTIVENESS** (1-10): [Your overall rating]

**KEY STRENGTHS**:
- [List 2-3 standout positive features]

**AREAS FOR IMPROVEMENT**:
- [List 2-3 specific suggestions for enhancement]

**PERSONALIZED TIPS**:
1. [Specific actionable tip]
2. [Specific actionable tip]
3. [Specific actionable tip]

Be honest but constructive. Focus on objective features and avoid vague compliments.`;
}
