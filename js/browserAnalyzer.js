/**
 * BrowserAnalyzer - Local face analysis using Transformers.js v4
 * 100% runs in browser, no data sent to servers
 */

import { pipeline, env, ModelRegistry } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.0';

class BrowserAnalyzer {
    constructor() {
        this.faceDetector = null;
        this.embedder = null;
        this.isInitialized = false;
        this.models = {
            detector: 'Xenova/mediapipe-face-detector', // Fast face detection
            embedder: 'onnx-community/Dinov2-small-vit14' // Image embeddings
        };
    }

    /**
     * Preload models for faster first analysis
     */
    async preload() {
        if (this.isInitialized) return;

        console.log('[BrowserAnalyzer] Preloading models...');
        
        // Configure environment
        env.allowLocalModels = false;
        env.useBrowserCache = true;

        // Preload detector (lightweight for speed)
        try {
            this.faceDetector = await pipeline(
                'object-detection',
                this.models.detector,
                {
                    device: 'webgpu', // WebGPU for best performance
                    dtype: 'fp16'
                }
            );
            console.log('[BrowserAnalyzer] Face detector loaded');
        } catch (e) {
            console.warn('[BrowserAnalyzer] WebGPU not available, falling back to WASM');
            this.faceDetector = await pipeline(
                'object-detection',
                this.models.detector,
                { device: 'wasm' }
            );
        }

        this.isInitialized = true;
        console.log('[BrowserAnalyzer] Ready!');
    }

    /**
     * Detect face landmarks on a canvas
     * Returns key facial points for analysis
     */
    async detectFaceLandmarks(canvas) {
        await this.ensureInitialized();

        // Convert canvas to image URL
        const imageData = canvas.toDataURL('image/jpeg', 0.9);

        // Run face detection
        const detections = await this.faceDetector(imageData, {
            threshold: 0.5,
            percentage: true // Return percentage for scaling
        });

        if (!detections || detections.length === 0) {
            throw new Error('No face detected in image. Please use a clear, front-facing photo.');
        }

        // Get the largest face (assuming single person)
        const face = detections.reduce((largest, current) => 
            (current.box[2] * current.box[3]) > (largest.box[2] * largest.box[3]) 
                ? current : largest
        );

        // Extract bounding box
        const [x, y, width, height] = face.box;

        // Calculate key facial landmarks from bounding box
        // These are approximations based on typical face ratios
        const landmarks = this.estimateLandmarks(x, y, width, height, canvas.width, canvas.height);

        return landmarks;
    }

    /**
     * Estimate facial landmarks from bounding box
     * Uses well-established facial ratios
     */
    estimateLandmarks(boxX, boxY, boxWidth, boxHeight, imgWidth, imgHeight) {
        // Scale to original image dimensions
        const scaleX = imgWidth / canvasWidth || 1;
        const scaleY = imgHeight / canvasHeight || 1;

        const x = boxX * scaleX;
        const y = boxY * scaleY;
        const w = boxWidth * scaleX;
        const h = boxHeight * scaleY;

        // Facial landmarks based on golden ratio and standard proportions
        // Reference: faces follow predictable ratios
        return {
            boundingBox: { x, y, width: w, height: h },
            
            // Eye landmarks (using standard face ratios)
            leftEye: {
                center: { x: x + w * 0.30, y: y + h * 0.35 },
                outer: { x: x + w * 0.23, y: y + h * 0.35 },
                inner: { x: x + w * 0.37, y: y + h * 0.35 }
            },
            rightEye: {
                center: { x: x + w * 0.70, y: y + h * 0.35 },
                outer: { x: x + w * 0.77, y: y + h * 0.35 },
                inner: { x: x + w * 0.63, y: y + h * 0.35 }
            },
            
            // Eyebrows
            leftEyebrow: {
                inner: { x: x + w * 0.35, y: y + h * 0.28 },
                outer: { x: x + w * 0.20, y: y + h * 0.26 }
            },
            rightEyebrow: {
                inner: { x: x + w * 0.65, y: y + h * 0.28 },
                outer: { x: x + w * 0.80, y: y + h * 0.26 }
            },
            
            // Nose
            nose: {
                tip: { x: x + w * 0.50, y: y + h * 0.52 },
                bridge: { x: x + w * 0.50, y: y + h * 0.42 },
                bottom: { x: x + w * 0.50, y: y + h * 0.58 }
            },
            
            // Mouth
            mouth: {
                leftCorner: { x: x + w * 0.35, y: y + h * 0.68 },
                rightCorner: { x: x + w * 0.65, y: y + h * 0.68 },
                topLip: { x: x + w * 0.50, y: y + h * 0.65 },
                bottomLip: { x: x + w * 0.50, y: y + h * 0.72 }
            },
            
            // Face outline points
            faceOutline: {
                leftTemple: { x: x + w * 0.08, y: y + h * 0.25 },
                leftCheekbone: { x: x + w * 0.10, y: y + h * 0.50 },
                leftJaw: { x: x + w * 0.18, y: y + h * 0.78 },
                chin: { x: x + w * 0.50, y: y + h * 0.92 },
                rightJaw: { x: x + w * 0.82, y: y + h * 0.78 },
                rightCheekbone: { x: x + w * 0.90, y: y + h * 0.50 },
                rightTemple: { x: x + w * 0.92, y: y + h * 0.25 }
            },
            
            // Center line (for symmetry calculation)
            centerLine: { x: x + w * 0.50 },
            
            // Reference measurements
            faceWidth: w,
            faceHeight: h,
            eyeDistance: w * 0.40,
            noseToChin: h * 0.40,
            foreheadHeight: h * 0.30
        };
    }

    /**
     * Get image embeddings for similarity comparison
     */
    async getEmbeddings(canvas) {
        await this.ensureInitialized();

        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        
        if (!this.embedder) {
            try {
                this.embedder = await pipeline(
                    'feature-extraction',
                    this.models.embedder,
                    { device: 'webgpu', dtype: 'fp16' }
                );
            } catch (e) {
                // Fallback if model not available
                return null;
            }
        }

        const embedding = await this.embedder(imageData, {
            pooling: 'mean',
            normalize: true
        });

        return embedding.tolist ? embedding.tolist() : embedding;
    }

    /**
     * Ensure models are loaded
     */
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.preload();
        }
    }

    /**
     * Get model loading status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            device: typeof navigator !== 'undefined' && navigator.gpu 
                ? 'WebGPU' 
                : 'WASM'
        };
    }
}

// Export
export { BrowserAnalyzer };
export default BrowserAnalyzer;
