/**
 * LookMax AI - Main Application Logic
 * Hybrid architecture: Browser-based + Cloudflare Workers AI
 */

import { BrowserAnalyzer } from './browserAnalyzer.js';
import { CloudflareAI } from './cloudflareAI.js';
import { FaceMetrics } from './faceMetrics.js';
import { ImageProcessor } from './imageProcessor.js';

class LookMaxAI {
    constructor() {
        this.browserAnalyzer = new BrowserAnalyzer();
        this.cloudflareAI = new CloudflareAI();
        this.faceMetrics = new FaceMetrics();
        this.imageProcessor = new ImageProcessor();
        this.currentImage = null;
        this.currentResults = null;
    }

    async initialize() {
        console.log('[LookMax] Initializing...');
        
        // Preload browser models for faster first analysis
        await this.browserAnalyzer.preload();
        
        console.log('[LookMax] Ready!');
        return true;
    }

    /**
     * Set the image to analyze
     * @param {File|Blob|string} image - Image source
     * @returns {Promise<HTMLCanvasElement>} - Processed canvas
     */
    async setImage(image) {
        this.currentImage = await this.imageProcessor.loadImage(image);
        return this.currentImage;
    }

    /**
     * Quick browser-based analysis (100% private)
     * @param {HTMLCanvasElement} canvas - Canvas with face image
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Object>} - Analysis results
     */
    async quickAnalysis(canvas, onProgress = () => {}) {
        onProgress({ stage: 'detecting', progress: 10, message: 'Detecting face...' });
        
        // Detect face landmarks
        const landmarks = await this.browserAnalyzer.detectFaceLandmarks(canvas);
        
        onProgress({ stage: 'analyzing', progress: 40, message: 'Analyzing symmetry...' });
        
        // Calculate symmetry score
        const symmetryScore = this.faceMetrics.calculateSymmetry(landmarks);
        
        onProgress({ stage: 'proportions', progress: 60, message: 'Calculating proportions...' });
        
        // Calculate golden ratio proportions
        const proportionsScore = this.faceMetrics.calculateGoldenRatio(landmarks);
        
        onProgress({ stage: 'features', progress: 80, message: 'Scoring features...' });
        
        // Calculate individual feature scores
        const featureScores = this.faceMetrics.scoreFeatures(landmarks);
        
        onProgress({ stage: 'finalizing', progress: 95, message: 'Finalizing...' });
        
        // Calculate overall score
        const overallScore = this.calculateOverallScore(symmetryScore, proportionsScore, featureScores);
        
        const results = {
            type: 'quick',
            overallScore,
            symmetryScore,
            proportionsScore,
            featureScores,
            landmarks,
            timestamp: Date.now()
        };
        
        this.currentResults = results;
        
        onProgress({ stage: 'complete', progress: 100, message: 'Done!' });
        
        return results;
    }

    /**
     * Deep AI analysis using Cloudflare Workers AI
     * @param {HTMLCanvasElement} canvas - Canvas with face image
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Object>} - Detailed AI analysis
     */
    async deepAnalysis(canvas, onProgress = () => {}) {
        onProgress({ stage: 'preparing', progress: 10, message: 'Preparing image...' });
        
        // Get image data for Cloudflare
        const imageData = this.imageProcessor.canvasToBase64(canvas);
        
        onProgress({ stage: 'ai_analysis', progress: 30, message: 'Running AI analysis...' });
        
        // Get quick analysis first for context
        const quickResults = await this.quickAnalysis(canvas, () => {});
        
        onProgress({ stage: 'ai_vision', progress: 50, message: 'AI examining features...' });
        
        // Call Cloudflare Workers AI
        const aiAnalysis = await this.cloudflareAI.analyzeFace(imageData, {
            symmetryScore: quickResults.symmetryScore,
            goldenRatioScore: quickResults.proportionsScore
        });
        
        onProgress({ stage: 'generating', progress: 80, message: 'Generating insights...' });
        
        // Parse AI response
        const detailedInsights = this.parseAIResponse(aiAnalysis);
        
        onProgress({ stage: 'compiling', progress: 95, message: 'Compiling results...' });
        
        // Merge results
        const results = {
            type: 'deep',
            ...quickResults,
            ...detailedInsights,
            timestamp: Date.now()
        };
        
        this.currentResults = results;
        
        onProgress({ stage: 'complete', progress: 100, message: 'Done!' });
        
        return results;
    }

    /**
     * Calculate overall attractiveness score
     */
    calculateOverallScore(symmetry, proportions, features) {
        // Weighted average: 30% symmetry, 30% proportions, 40% features
        const featureAvg = Object.values(features).reduce((a, b) => a + b, 0) / Object.keys(features).length;
        
        const rawScore = (symmetry * 0.3) + (proportions * 0.3) + (featureAvg * 0.4);
        
        // Scale to 1-10
        return Math.round(Math.min(10, Math.max(1, rawScore * 10)) * 10) / 10;
    }

    /**
     * Parse AI response into structured data
     */
    parseAIResponse(aiText) {
        // Try to extract structured data from AI response
        // The AI returns natural language, so we try to parse key metrics
        
        const breakdown = {
            harmony: 0,
            skinQuality: 0,
            youthfulness: 0,
            masculinityFemininity: 0
        };

        // Try to find numeric scores in response
        const scorePatterns = [
            /harmony[:\s]+(\d+\.?\d*)/i,
            /skin[:\s]+(\d+\.?\d*)/i,
            /youth[:\s]+(\d+\.?\d*)/i,
            /masculine|feminine[:\s]+(\d+\.?\d*)/i
        ];

        // Default values if parsing fails - AI will provide natural language analysis
        return {
            breakdown,
            rawAnalysis: aiText,
            tips: this.generateTips(aiText)
        };
    }

    /**
     * Generate personalized tips from AI analysis
     */
    generateTips(aiText) {
        const tips = [];
        const lowerText = aiText.toLowerCase();

        if (lowerText.includes('skin') || lowerText.includes('complexion')) {
            tips.push({ category: 'skincare', tip: 'Focus on a consistent skincare routine with SPF protection.' });
        }
        if (lowerText.includes('symmetry') || lowerText.includes('asymmetric')) {
            tips.push({ category: 'makeup', tip: 'Strategic makeup application can help balance facial asymmetry.' });
        }
        if (lowerText.includes('jaw') || lowerText.includes('chin')) {
            tips.push({ category: 'exercises', tip: 'Facial exercises may help define jawline over time.' });
        }
        if (lowerText.includes('eyes') || lowerText.includes('eyebrow')) {
            tips.push({ category: 'grooming', tip: 'Well-groomed eyebrows can significantly enhance eye area attractiveness.' });
        }
        
        // Default tips if no specific matches
        if (tips.length === 0) {
            tips.push({ category: 'general', tip: 'Maintain good posture and smile confidently - both significantly impact perceived attractiveness.' });
            tips.push({ category: 'health', tip: 'Stay hydrated and maintain a balanced diet for healthy skin.' });
        }

        return tips;
    }

    /**
     * Compare two photos (before/after)
     */
    async comparePhotos(beforeCanvas, afterCanvas) {
        // Analyze both
        const beforeResults = await this.quickAnalysis(beforeCanvas);
        const afterResults = await this.quickAnalysis(afterCanvas);

        // Calculate improvement
        const improvement = afterResults.overallScore - beforeResults.overallScore;
        const percentChange = ((improvement / beforeResults.overallScore) * 100).toFixed(1);

        return {
            before: beforeResults,
            after: afterResults,
            improvement: {
                score: improvement,
                percentChange,
                message: improvement > 0 
                    ? `Great progress! You've improved by ${percentChange}%` 
                    : improvement < 0 
                        ? `Your score decreased by ${Math.abs(percentChange)}%` 
                        : 'Scores are similar'
            }
        };
    }

    /**
     * Check if AI analysis is available (hasn't hit rate limits)
     */
    isAIAnalysisAvailable() {
        return this.cloudflareAI.isAvailable();
    }

    /**
     * Get remaining daily AI requests
     */
    getRemainingAIRequests() {
        return this.cloudflareAI.getRemainingRequests();
    }
}

// Export for use
export { LookMaxAI };
export default LookMaxAI;
