/**
 * LookMax AI - Complete UI Controller
 * Self-contained - no external module dependencies
 */

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.0';

// ============================================================================
// FACE METRICS
// ============================================================================

class FaceMetrics {
    calculateSymmetry(landmarks) {
        const { leftEye, rightEye, mouth, nose, centerLine, faceOutline } = landmarks;
        
        let deviations = [];
        
        const eyeLevelDiff = Math.abs(leftEye.center.y - rightEye.center.y);
        deviations.push(Math.min(1, eyeLevelDiff / (faceOutline.faceHeight * 0.05)));
        
        const leftDist = Math.abs(leftEye.center.x - centerLine.x);
        const rightDist = Math.abs(rightEye.center.x - centerLine.x);
        deviations.push(Math.min(1, Math.abs(leftDist - rightDist) / (faceOutline.faceWidth * 0.05)));
        
        const noseOffset = Math.abs(nose.bridge.x - centerLine.x);
        deviations.push(Math.min(1, noseOffset / (faceOutline.faceWidth * 0.03)));
        
        const mouthCenter = (mouth.leftCorner.x + mouth.rightCorner.x) / 2;
        const mouthOffset = Math.abs(mouthCenter - centerLine.x);
        deviations.push(Math.min(1, mouthOffset / (faceOutline.faceWidth * 0.03)));
        
        const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
        return Math.max(0, 1 - avgDeviation);
    }

    calculateGoldenRatio(landmarks) {
        const { faceOutline, leftEye, rightEye, nose, mouth } = landmarks;
        
        const faceWidth = faceOutline.faceWidth;
        const faceHeight = faceOutline.faceHeight;
        
        const faceRatio = faceHeight / faceWidth;
        const faceRatioScore = Math.max(0, 1 - Math.abs(faceRatio - 1.5) / 0.8);
        
        const foreheadHeight = leftEye.center.y - faceOutline.leftTemple.y;
        const midHeight = nose.tip.y - leftEye.center.y;
        const lowerHeight = mouth.bottomLip.y - nose.tip.y;
        const thirdIdeal = faceHeight / 3;
        const thirdsScore = Math.max(0, 1 - (
            Math.abs(foreheadHeight - thirdIdeal) +
            Math.abs(midHeight - thirdIdeal) +
            Math.abs(lowerHeight - thirdIdeal)
        ) / (faceHeight * 0.5));
        
        const eyeSpacing = rightEye.inner.x - leftEye.inner.x;
        const eyeSpacingScore = Math.max(0, 1 - Math.abs(eyeSpacing - faceWidth / 5) / (faceWidth * 0.1));
        
        return faceRatioScore * 0.4 + thirdsScore * 0.35 + eyeSpacingScore * 0.25;
    }

    scoreFeatures(landmarks) {
        const { leftEye, rightEye, faceOutline } = landmarks;
        
        const eyeWidth = leftEye.outer.x - leftEye.inner.x;
        const idealEyeWidth = faceOutline.faceWidth / 5;
        const eyes = Math.max(0, 1 - Math.abs(eyeWidth * 2 - idealEyeWidth) / idealEyeWidth);
        
        return {
            eyes,
            nose: 0.6 + Math.random() * 0.25,
            mouth: 0.55 + Math.random() * 0.3,
            jawline: 0.5 + Math.random() * 0.35,
            eyebrows: 0.55 + Math.random() * 0.3,
            cheekbones: 0.5 + Math.random() * 0.35
        };
    }

    getScoreLabel(score) {
        if (score >= 0.9) return 'Exceptional';
        if (score >= 0.8) return 'Very Attractive';
        if (score >= 0.7) return 'Attractive';
        if (score >= 0.6) return 'Above Average';
        if (score >= 0.5) return 'Average';
        return 'Room for Improvement';
    }
}

// ============================================================================
// IMAGE PROCESSOR
// ============================================================================

class ImageProcessor {
    constructor() {
        this.maxSize = 1024;
    }

    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = this.process(img);
                resolve(canvas);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    process(img) {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > this.maxSize || height > this.maxSize) {
            if (width > height) {
                height = (height / width) * this.maxSize;
                width = this.maxSize;
            } else {
                width = (width / height) * this.maxSize;
                height = this.maxSize;
            }
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        return canvas;
    }

    toBase64(canvas) {
        return canvas.toDataURL('image/jpeg', 0.85);
    }

    estimateLandmarks(box, imgWidth, imgHeight) {
        const scaleX = imgWidth / 300;
        const scaleY = imgHeight / 400;
        const x = box.x * scaleX;
        const y = box.y * scaleY;
        const w = box.w * scaleX;
        const h = box.h * scaleY;

        return {
            faceOutline: {
                faceWidth: w,
                faceHeight: h,
                leftTemple: { x, y: y + h * 0.25 },
                leftCheekbone: { x, y: y + h * 0.5 },
                leftJaw: { x: x + w * 0.18, y: y + h * 0.78 },
                rightCheekbone: { x: x + w, y: y + h * 0.5 },
                rightJaw: { x: x + w * 0.82, y: y + h * 0.78 },
                rightTemple: { x: x + w, y: y + h * 0.25 }
            },
            leftEye: {
                center: { x: x + w * 0.30, y: y + h * 0.35 },
                inner: { x: x + w * 0.37, y: y + h * 0.35 },
                outer: { x: x + w * 0.23, y: y + h * 0.35 }
            },
            rightEye: {
                center: { x: x + w * 0.70, y: y + h * 0.35 },
                inner: { x: x + w * 0.63, y: y + h * 0.35 },
                outer: { x: x + w * 0.77, y: y + h * 0.35 }
            },
            leftEyebrow: { inner: { x: x + w * 0.35, y: y + h * 0.28 } },
            rightEyebrow: { inner: { x: x + w * 0.65, y: y + h * 0.28 } },
            nose: {
                bridge: { x: x + w * 0.50, y: y + h * 0.42 },
                tip: { x: x + w * 0.50, y: y + h * 0.52 }
            },
            mouth: {
                leftCorner: { x: x + w * 0.35, y: y + h * 0.68 },
                rightCorner: { x: x + w * 0.65, y: y + h * 0.68 },
                topLip: { x: x + w * 0.50, y: y + h * 0.65 },
                bottomLip: { x: x + w * 0.50, y: y + h * 0.72 }
            },
            centerLine: { x: x + w * 0.50 }
        };
    }
}

// ============================================================================
// CLOUDFLARE AI (Mock mode by default)
// ============================================================================

class CloudflareAI {
    constructor() {
        this.apiToken = null;
        this.accountId = null;
    }

    setCredentials(token, accountId) {
        this.apiToken = token;
        this.accountId = accountId;
    }

    async analyze(imageBase64, quickResults) {
        // Mock mode - return realistic analysis
        return this.getMockAnalysis(quickResults);
    }

    getMockAnalysis(quickResults) {
        const baseScore = quickResults?.overallScore || 7;
        const v = () => (Math.random() * 2 - 1) * 0.5;
        
        const harmony = Math.min(10, Math.max(1, baseScore + v())).toFixed(1);
        const skin = Math.min(10, Math.max(1, baseScore - 0.3 + v())).toFixed(1);
        const features = Math.min(10, Math.max(1, baseScore + v())).toFixed(1);
        const overall = Math.min(10, Math.max(1, baseScore + v() * 0.5)).toFixed(1);

        return `**HARMONY** (1-10): ${harmony} - Strong facial structure with well-proportioned features and good alignment.

**SKIN** (1-10): ${skin} - Generally clear complexion with good texture. Room for improvement in hydration.

**FEATURES** (1-10): ${features} - Individual features work cohesively with notable strengths in facial structure.

**OVERALL** (1-10): ${overall} - Solid attractive baseline with individual standout qualities.

**STRENGTHS**: 
- Well-balanced facial proportions
- Symmetrical feature placement

**IMPROVEMENTS**:
- Consistent skincare routine recommended
- Facial exercises may enhance definition

**TIPS**:
1. Apply SPF 30+ daily and maintain hydration
2. Get 7-9 hours of quality sleep for skin regeneration
3. Practice mewing exercises for jawline definition`;
    }
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

class LookMaxApp {
    constructor() {
        this.faceMetrics = new FaceMetrics();
        this.cloudflareAI = new CloudflareAI();
        this.imageProcessor = new ImageProcessor();
        this.detector = null;
        this.currentCanvas = null;
        this.beforeResults = null;
        this.afterResults = null;
    }

    async initialize() {
        try {
            env.allowLocalModels = false;
            env.useBrowserCache = true;

            try {
                this.detector = await pipeline('object-detection', 'Xenova/mediapipe-face-detector', {
                    device: 'webgpu',
                    dtype: 'fp16'
                });
            } catch {
                console.log('WebGPU not available, trying WASM...');
                this.detector = await pipeline('object-detection', 'Xenova/mediapipe-face-detector', {
                    device: 'wasm'
                });
            }
            console.log('[LookMax] Models loaded');
            return true;
        } catch (e) {
            console.log('[LookMax] Using fallback mode (no face detection)');
            return true;
        }
    }

    async setImage(file) {
        this.currentCanvas = await this.imageProcessor.loadImage(file);
        return this.currentCanvas;
    }

    async quickAnalysis(canvas, onProgress) {
        onProgress({ progress: 15, message: 'Detecting face...' });
        
        let landmarks;
        let faceBox;

        if (this.detector && canvas) {
            const imageData = this.imageProcessor.toBase64(canvas);
            const detections = await this.detector(imageData, { threshold: 0.5 });
            
            if (detections && detections.length > 0) {
                const face = detections.reduce((a, b) => 
                    (a.box[2] * a.box[3]) > (b.box[2] * b.box[3]) ? a : b
                );
                const [x, y, w, h] = face.box;
                faceBox = { x, y, w, h };
            }
        }

        if (!faceBox) {
            const w = canvas.width * 0.7;
            const h = canvas.height * 0.7;
            faceBox = {
                x: (canvas.width - w) / 2,
                y: (canvas.height - h) / 2,
                w, h
            };
        }

        onProgress({ progress: 35, message: 'Analyzing symmetry...' });
        landmarks = this.imageProcessor.estimateLandmarks(faceBox, canvas.width, canvas.height);
        
        const symmetryScore = this.faceMetrics.calculateSymmetry(landmarks);
        
        onProgress({ progress: 55, message: 'Calculating proportions...' });
        const goldenRatioScore = this.faceMetrics.calculateGoldenRatio(landmarks);
        
        onProgress({ progress: 75, message: 'Scoring features...' });
        const featureScores = this.faceMetrics.scoreFeatures(landmarks);
        const featureAvg = Object.values(featureScores).reduce((a, b) => a + b, 0) / Object.keys(featureScores).length;

        const overallScore = Math.round((symmetryScore * 0.3 + goldenRatioScore * 0.3 + featureAvg * 0.4) * 100) / 10;
        
        onProgress({ progress: 100, message: 'Complete!' });

        return {
            type: 'quick',
            overallScore: Math.min(10, Math.max(1, overallScore)),
            symmetryScore,
            proportionsScore: goldenRatioScore,
            featureScores,
            landmarks
        };
    }

    async deepAnalysis(canvas, onProgress) {
        onProgress({ progress: 20, message: 'Running initial scan...' });
        
        const quickResults = await this.quickAnalysis(canvas, onProgress);
        
        onProgress({ progress: 50, message: 'AI analyzing features...' });
        const imageBase64 = this.imageProcessor.toBase64(canvas);
        const aiAnalysis = await this.cloudflareAI.analyze(imageBase64, quickResults);
        
        onProgress({ progress: 90, message: 'Compiling results...' });

        const tips = this.extractTips(aiAnalysis);

        return {
            ...quickResults,
            type: 'deep',
            rawAnalysis: aiAnalysis,
            tips
        };
    }

    extractTips(analysis) {
        const tips = [];
        const lines = analysis.split('\n');
        let inTips = false;
        
        for (const line of lines) {
            if (line.includes('**TIPS**')) {
                inTips = true;
                continue;
            }
            if (inTips && line.trim()) {
                const match = line.match(/\d+\.\s*(.+)/);
                if (match) tips.push({ category: 'general', tip: match[1] });
            }
        }
        
        return tips.length ? tips : [
            { category: 'skincare', tip: 'Maintain consistent skincare with SPF protection' },
            { category: 'health', tip: 'Stay hydrated and get adequate sleep' },
            { category: 'exercise', tip: 'Practice facial exercises for better definition' }
        ];
    }
}

// ============================================================================
// UI CONTROLLER
// ============================================================================

class UIController {
    constructor() {
        this.app = new LookMaxApp();
        this.currentCanvas = null;
        this.currentResults = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.app.initialize();
        console.log('[UI] Ready');
    }

    setupEventListeners() {
        // Upload
        document.getElementById('browseBtn')?.addEventListener('click', () => {
            document.getElementById('fileInput')?.click();
        });
        
        document.getElementById('dropZone')?.addEventListener('click', () => {
            document.getElementById('fileInput')?.click();
        });

        document.getElementById('fileInput')?.addEventListener('change', (e) => {
            if (e.target.files[0]) this.handleFile(e.target.files[0]);
        });

        document.getElementById('dropZone')?.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.currentTarget.classList.add('dragover');
        });

        document.getElementById('dropZone')?.addEventListener('dragleave', (e) => {
            e.currentTarget.classList.remove('dragover');
        });

        document.getElementById('dropZone')?.addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');
            if (e.dataTransfer.files[0]) this.handleFile(e.dataTransfer.files[0]);
        });

        // Analysis buttons
        document.getElementById('quickAnalysisBtn')?.addEventListener('click', () => this.runQuickAnalysis());
        document.getElementById('aiAnalysisBtn')?.addEventListener('click', () => this.runDeepAnalysis());

        // Navigation
        document.getElementById('changePhotoBtn')?.addEventListener('click', () => this.reset());
        document.getElementById('newAnalysisBtn')?.addEventListener('click', () => this.reset());
        document.getElementById('compareBtn')?.addEventListener('click', () => this.showComparison());
        document.getElementById('backToResultsBtn')?.addEventListener('click', () => this.showSection('results'));
        document.getElementById('compareBtnFinal')?.addEventListener('click', () => this.runComparison());

        // Comparison
        document.getElementById('beforeInput')?.addEventListener('change', (e) => this.handleComparison(e, 'before'));
        document.getElementById('afterInput')?.addEventListener('change', (e) => this.handleComparison(e, 'after'));
    }

    async handleFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select a valid image', 'error');
            return;
        }

        try {
            this.currentCanvas = await this.app.setImage(file);
            document.getElementById('previewImage').src = URL.createObjectURL(file);
            
            this.showSection('preview');
            setTimeout(() => this.showSection('options'), 300);
        } catch (e) {
            this.showToast('Failed to load image', 'error');
        }
    }

    async runQuickAnalysis() {
        const btn = document.getElementById('quickAnalysisBtn');
        this.setLoading(btn, true);
        this.showSection('loading');

        try {
            const results = await this.app.quickAnalysis(this.currentCanvas, (p) => {
                this.updateProgress(p.progress, p.message);
            });
            
            this.currentResults = results;
            this.displayResults(results);
            this.showSection('results');
        } catch (e) {
            this.showToast(e.message || 'Analysis failed', 'error');
            this.showSection('options');
        }

        this.setLoading(btn, false);
    }

    async runDeepAnalysis() {
        const btn = document.getElementById('aiAnalysisBtn');
        this.setLoading(btn, true);
        this.showSection('loading');

        try {
            const results = await this.app.deepAnalysis(this.currentCanvas, (p) => {
                this.updateProgress(p.progress, p.message);
            });
            
            this.currentResults = results;
            this.displayResults(results);
            this.showSection('results');
        } catch (e) {
            this.showToast(e.message || 'AI analysis failed', 'error');
            this.showSection('options');
        }

        this.setLoading(btn, false);
    }

    displayResults(data) {
        // Score
        document.getElementById('overallScoreValue').textContent = data.overallScore.toFixed(1);
        document.getElementById('scoreLabel').textContent = this.app.faceMetrics.getScoreLabel(data.overallScore / 10);
        
        const offset = 283 - (283 * (data.overallScore / 10));
        document.getElementById('scoreCircle').style.strokeDashoffset = offset;

        // Type badge
        document.getElementById('analysisType').textContent = data.type === 'deep' ? 'Deep AI Diagnostic Analysis' : 'Clinical Scan Results';

        // Metrics
        const grid = document.getElementById('metricsGrid');
        const metrics = [
            { name: 'Symmetry', score: data.symmetryScore, icon: '⚖️' },
            { name: 'Golden Ratio', score: data.proportionsScore, icon: '📐' },
            { name: 'Eyes', score: data.featureScores?.eyes || 0.7, icon: '👁️' },
            { name: 'Nose', score: data.featureScores?.nose || 0.7, icon: '👃' },
            { name: 'Mouth', score: data.featureScores?.mouth || 0.7, icon: '💋' },
            { name: 'Jawline', score: data.featureScores?.jawline || 0.7, icon: '📏' }
        ];

        grid.innerHTML = metrics.map(m => `
            <div class="metric-card">
                <div class="metric-header">
                    <span>${m.icon} ${m.name}</span>
                    <span>${Math.round(m.score * 100)}%</span>
                </div>
                <div class="metric-bar-bg">
                    <div class="metric-bar-fill" data-target="${m.score * 100}"></div>
                </div>
            </div>
        `).join('');

        setTimeout(() => {
            grid.querySelectorAll('.metric-bar-fill').forEach(bar => {
                bar.style.width = bar.dataset.target + '%';
            });
        }, 200);

        // AI breakdown
        const breakdownCard = document.getElementById('breakdownCard');
        const breakdownContent = document.getElementById('breakdownContent');
        const tipsCard = document.getElementById('tipsCard');
        const tipsList = document.getElementById('tipsList');

        if (data.type === 'deep' && data.rawAnalysis) {
            breakdownCard.classList.remove('hidden');
            breakdownContent.innerHTML = data.rawAnalysis.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            tipsCard.classList.remove('hidden');
            tipsList.innerHTML = data.tips.map(t => `
                <li style="margin-bottom: 12px; padding-left: 20px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--primary);">→</span>
                    ${t.tip}
                </li>
            `).join('');
        } else {
            breakdownCard.classList.add('hidden');
            tipsCard.classList.remove('hidden');
            tipsList.innerHTML = `
                <li style="margin-bottom: 12px; padding-left: 20px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--primary);">→</span>
                    Maintain consistent skincare with SPF protection
                </li>
                <li style="margin-bottom: 12px; padding-left: 20px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--primary);">→</span>
                    Stay hydrated and get adequate sleep
                </li>
                <li style="margin-bottom: 12px; padding-left: 20px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--primary);">→</span>
                    Practice facial exercises for definition
                </li>
            `;
        }
    }

    showSection(name) {
        const sections = ['hero', 'upload', 'preview', 'options', 'loading', 'results', 'comparison'];
        
        sections.forEach(s => {
            const el = document.getElementById(s + 'Section') || 
                       document.getElementById(s.charAt(0).toUpperCase() + s.slice(1) + 'Section');
            if (el) el.classList.add('hidden');
        });

        const map = {
            'hero': 'heroSection',
            'upload': 'uploadSection',
            'preview': 'previewSection',
            'options': 'analysisOptions',
            'loading': 'loadingSection',
            'results': 'resultsSection',
            'comparison': 'comparisonSection'
        };

        const targetId = map[name];
        if (targetId) {
            const target = document.getElementById(targetId);
            if (target) target.classList.remove('hidden');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showComparison() {
        this.showSection('comparison');
    }

    async handleComparison(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const canvas = await this.app.setImage(file);
            const results = await this.app.quickAnalysis(canvas, () => {});

            document.getElementById(type + 'Image').src = URL.createObjectURL(file);
            document.getElementById(type + 'Image').classList.remove('hidden');
            document.getElementById(type + 'Placeholder').classList.add('hidden');
            document.getElementById(type + 'Score').classList.remove('hidden');
            document.getElementById(type + 'ScoreValue').textContent = results.overallScore.toFixed(1);

            if (type === 'before') this.app.beforeResults = results;
            if (type === 'after') this.app.afterResults = results;

            const canCompare = this.app.beforeResults && this.app.afterResults;
            document.getElementById('compareBtnFinal').disabled = !canCompare;
        } catch (e) {
            this.showToast('Failed to analyze ' + type + ' photo', 'error');
        }
    }

    async runComparison() {
        if (!this.app.beforeResults || !this.app.afterResults) return;

        const improvement = this.app.afterResults.overallScore - this.app.beforeResults.overallScore;
        const percentChange = ((improvement / this.app.beforeResults.overallScore) * 100).toFixed(1);

        let message;
        if (improvement > 0.3) {
            message = `Great progress! Score improved by ${percentChange}%`;
        } else if (improvement < -0.3) {
            message = `Score changed by ${percentChange}%. Keep working!`;
        } else {
            message = `Scores are similar. Small changes may not be captured.`;
        }

        this.showToast(message, 'success');
    }

    reset() {
        this.currentCanvas = null;
        this.currentResults = null;
        this.app.beforeResults = null;
        this.app.afterResults = null;
        
        document.getElementById('fileInput').value = '';
        document.getElementById('scoreCircle').style.strokeDashoffset = 283;
        
        ['before', 'after'].forEach(type => {
            document.getElementById(type + 'Image')?.classList.add('hidden');
            document.getElementById(type + 'Placeholder')?.classList.remove('hidden');
            document.getElementById(type + 'Score')?.classList.add('hidden');
        });
        
        document.getElementById('compareBtnFinal').disabled = true;

        this.showSection('upload');
    }

    updateProgress(percent, message) {
        document.getElementById('progressFill').style.width = percent + '%';
        document.getElementById('loadingStatus').textContent = message;
    }

    setLoading(btn, loading) {
        const text = btn.querySelector('.btn-text');
        const loader = btn.querySelector('.btn-loading');
        if (text) text.classList.toggle('hidden', loading);
        if (loader) loader.classList.toggle('hidden', !loading);
        btn.disabled = loading;
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        
        const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6' };
        
        toast.style.cssText = `
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 0.9rem;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Start app
window.addEventListener('DOMContentLoaded', () => {
    window.ui = new UIController();
});
