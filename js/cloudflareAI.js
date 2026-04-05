/**
 * CloudflareAI - Integration with Cloudflare Workers AI
 * Uses Llama Vision for deep face analysis
 * 
 * NOTE: Requires Cloudflare Workers AI to be deployed
 * or can use public Cloudflare AI Gateway
 */

class CloudflareAI {
    constructor() {
        // Option 1: Use your own deployed Worker
        // this.endpoint = 'https://your-worker.your-subdomain.workers.dev/analyze';
        
        // Option 2: Use Cloudflare AI Gateway (public endpoints)
        // Sign up at https://ai.cloudflare.com for API token
        this.apiToken = null; // Set via setApiToken()
        
        // Cloudflare AI Gateway endpoint
        this.baseUrl = 'https://api.cloudflare.com/client/v4/accounts';
        
        // Model configurations
        this.models = {
            vision: '@cf/meta/llama-3.2-11b-vision-instruct',
            text: '@cf/meta/llama-3.1-8b-instruct-fp8-fast'
        };
        
        // Rate limiting (free tier: 10,000 neurons/day)
        this.dailyLimit = 10000;
        this.usedToday = 0;
        this.lastReset = this.getTodayStart();
        
        // Estimated neuron cost per request
        this.costPerRequest = 5000; // ~5000 neurons for vision request
    }

    /**
     * Set API token for Cloudflare
     * @param {string} token - Cloudflare API token
     */
    setApiToken(token) {
        this.apiToken = token;
    }

    /**
     * Set account ID for Cloudflare
     * @param {string} accountId - Cloudflare Account ID
     */
    setAccountId(accountId) {
        this.accountId = accountId;
    }

    /**
     * Check if AI analysis is available
     */
    isAvailable() {
        this.checkRateLimit();
        return this.usedToday < this.dailyLimit;
    }

    /**
     * Get remaining requests for today
     */
    getRemainingRequests() {
        this.checkRateLimit();
        const remaining = Math.floor((this.dailyLimit - this.usedToday) / this.costPerRequest);
        return Math.max(0, remaining);
    }

    /**
     * Check and reset rate limit if needed
     */
    checkRateLimit() {
        const today = this.getTodayStart();
        if (today > this.lastReset) {
            this.usedToday = 0;
            this.lastReset = today;
        }
    }

    /**
     * Get start of today (midnight UTC)
     */
    getTodayStart() {
        const now = new Date();
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();
    }

    /**
     * Track usage
     */
    trackUsage(neurons) {
        this.usedToday += neurons || this.costPerRequest;
    }

    /**
     * Analyze face using Cloudflare Workers AI (Llama Vision)
     * @param {string} imageBase64 - Base64 encoded image
     * @param {Object} quickAnalysis - Results from quick browser analysis
     */
    async analyzeFace(imageBase64, quickAnalysis = {}) {
        if (!this.isAvailable()) {
            throw new Error('Daily AI analysis limit reached. Try again tomorrow!');
        }

        // Prepare the prompt with quick analysis context
        const prompt = this.buildAnalysisPrompt(quickAnalysis);

        // Make the API call
        const result = await this.callVisionModel(imageBase64, prompt);
        
        this.trackUsage();
        return result;
    }

    /**
     * Build analysis prompt for Llama Vision
     */
    buildAnalysisPrompt(quickAnalysis) {
        const context = quickAnalysis.symmetryScore 
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

    /**
     * Call Cloudflare Workers AI Vision endpoint
     */
    async callVisionModel(imageBase64, prompt) {
        // For development/testing without credentials
        if (!this.apiToken || !this.accountId) {
            console.log('[CloudflareAI] No credentials - returning mock analysis');
            return this.getMockAnalysis();
        }

        const url = `${this.baseUrl}/${this.accountId}/ai/run/${this.models.vision}`;

        // Remove data URL prefix if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = this.arrayBufferToBase64(this.base64ToArrayBuffer(base64Data));

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
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
                                        url: `data:image/jpeg;base64,${base64Data}`
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 1024,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Cloudflare AI error: ${response.status} - ${error}`);
            }

            const data = await response.json();
            return data.result?.response || data.response || JSON.stringify(data);

        } catch (error) {
            console.error('[CloudflareAI] Error:', error);
            // Return mock on error for demo purposes
            return this.getMockAnalysis();
        }
    }

    /**
     * Call text-only model for follow-up questions
     */
    async askFollowUp(context, question) {
        if (!this.apiToken || !this.accountId) {
            return this.getMockFollowUp(question);
        }

        const url = `${this.baseUrl}/${this.accountId}/ai/run/${this.models.text}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'You are a facial aesthetics expert. Answer questions based on the provided analysis.' },
                        { role: 'user', content: `Context: ${context}\n\nQuestion: ${question}` }
                    ],
                    max_tokens: 512,
                    temperature: 0.8
                })
            });

            const data = await response.json();
            return data.result?.response || data.response;

        } catch (error) {
            console.error('[CloudflareAI] Follow-up error:', error);
            return 'Unable to answer at this time.';
        }
    }

    /**
     * Generate mock analysis for demo/testing
     */
    getMockAnalysis() {
        const scores = {
            harmony: (7 + Math.random() * 2).toFixed(1),
            skin: (6.5 + Math.random() * 2.5).toFixed(1),
            balance: (7 + Math.random() * 2).toFixed(1),
            youth: (7.5 + Math.random() * 2).toFixed(1),
            overall: (7 + Math.random() * 2).toFixed(1)
        };

        const strengths = [
            'Clear eye contact and confident gaze',
            'Well-defined facial structure',
            'Good facial proportions',
            'Symmetrical features',
            'Attractive lip shape'
        ];

        const improvements = [
            'Consider a skincare routine to improve skin texture',
            'Facial exercises may help define jawline',
            'Good eyebrow shape - maintain with grooming',
            'Could benefit from better lighting in photos',
            'Consider whitening teeth for brighter smile'
        ];

        const tips = [
            'Maintain consistent skincare with SPF protection daily',
            'Stay hydrated - aim for 8 glasses of water daily',
            'Get 7-9 hours of quality sleep for skin regeneration',
            'Practice proper oral hygiene and consider teeth whitening'
        ];

        // Pick 2-3 random strengths and improvements
        const shuffle = arr => arr.sort(() => Math.random() - 0.5);
        const pickedStrengths = shuffle([...strengths]).slice(0, 3);
        const pickedImprovements = shuffle([...improvements]).slice(0, 3);

        return `
**FACIAL HARMONY** (1-10): ${scores.harmony} - Your facial features work well together, with good proportion between different areas of the face.

**SKIN QUALITY** (1-10): ${scores.skin} - Skin appears generally clear with minor room for improvement in texture and hydration.

**FEATURE BALANCE** (1-10): ${scores.balance} - Features are well-proportioned with good alignment between eyes, nose, and mouth.

**YOUTHFULNESS** (1-10): ${scores.youth} - Strong youthful features with good skin elasticity indicators.

**OVERALL ATTRACTIVENESS** (1-10): ${scores.overall} - Solid overall attractiveness with individual strengths.

**KEY STRENGTHS**:
- ${pickedStrengths[0]}
- ${pickedStrengths[1]}
- ${pickedStrengths[2]}

**AREAS FOR IMPROVEMENT**:
- ${pickedImprovements[0]}
- ${pickedImprovements[1]}
- ${pickedImprovements[2]}

**PERSONALIZED TIPS**:
1. ${tips[0]}
2. ${tips[1]}
3. ${tips[2]}
4. Get regular exercise - improves circulation and skin health
`;
    }

    /**
     * Mock follow-up response
     */
    getMockFollowUp(question) {
        const lowerQ = question.toLowerCase();
        
        if (lowerQ.includes('skin')) {
            return 'Based on your analysis, focus on a consistent routine: cleanse, moisturize, and always apply SPF 30+ in the morning. At night, use a retinol product 2-3 times per week.';
        }
        if (lowerQ.includes('exercise') || lowerQ.includes('workout')) {
            return 'Facial exercises can help! Try the "fish face" exercise (suck cheeks in like a fish) for 10 seconds, repeat 10 times daily. Also, chewing gum can help define jaw muscles.';
        }
        if (lowerQ.includes('makeup')) {
            return 'For your face shape, I recommend focusing on highlighting your cheekbones. Use bronzer along the hairline and under cheekbones. For eyes, a natural eyeshadow with winged liner would enhance your features.';
        }
        
        return 'That\'s a great question! For personalized advice on this topic, try our AI deep analysis for more specific recommendations.';
    }

    // Utility: Base64 to ArrayBuffer
    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Utility: ArrayBuffer to Base64
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}

// Export
export { CloudflareAI };
export default CloudflareAI;
