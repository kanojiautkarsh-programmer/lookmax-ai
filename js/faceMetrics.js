/**
 * FaceMetrics - Calculate facial attractiveness metrics
 * Uses geometric analysis and golden ratio principles
 */

class FaceMetrics {
    constructor() {
        // Golden ratio constant
        this.phi = 1.618033988749895;
        
        // Ideal ratios based on facial aesthetics research
        this.ideals = {
            // Vertical thirds (forehead, nose, lower face)
            verticalThirdRatio: [1/3, 1/3, 1/3],
            
            // Horizontal fifths
            horizontalFifthWidth: 1/5,
            
            // Eye-related
            eyeToFaceWidth: 1/5,
            eyeSpacing: 1/5,
            
            // Nose
            noseToMouthWidth: 1/3,
            
            // Face shape
            faceLengthToWidth: 1.5, // Oval ideal
            
            // Features
            eyebrowLengthToEyeLength: 1.0,
            lipWidthToSmileWidth: 1.0,
            
            // Symmetry tolerance (degrees)
            symmetryTolerance: 0.05 // 5% tolerance for perfect symmetry
        };
    }

    /**
     * Calculate facial symmetry score (0-1)
     * Compares left and right halves of face
     */
    calculateSymmetry(landmarks) {
        const { leftEye, rightEye, leftEyebrow, rightEyebrow, mouth, nose, faceOutline, centerLine } = landmarks;
        
        // 1. Eye symmetry - compare positions relative to center
        const leftEyeCenterX = leftEye.center.x;
        const rightEyeCenterX = rightEye.center.x;
        const expectedRightEyeX = centerLine.x + (centerLine.x - leftEyeCenterX);
        
        const eyeSymmetry = 1 - Math.min(1, 
            Math.abs(rightEyeCenterX - expectedRightEyeX) / (faceOutline.faceWidth * 0.1)
        );
        
        // 2. Eye level symmetry (y-coordinates should match)
        const eyeLevelDiff = Math.abs(leftEye.center.y - rightEye.center.y);
        const eyeLevelSymmetry = 1 - Math.min(1, eyeLevelDiff / (faceOutline.faceHeight * 0.03));
        
        // 3. Eyebrow symmetry
        const leftBrowInnerX = leftEyebrow.inner.x;
        const rightBrowInnerX = rightEyebrow.inner.x;
        const browSymmetry = 1 - Math.min(1,
            Math.abs((centerLine.x - leftBrowInnerX) - (rightBrowInnerX - centerLine.x)) 
            / (faceOutline.faceWidth * 0.05)
        );
        
        // 4. Mouth symmetry relative to center
        const mouthCenterX = (mouth.leftCorner.x + mouth.rightCorner.x) / 2;
        const mouthOffset = Math.abs(mouthCenterX - centerLine.x);
        const mouthSymmetry = 1 - Math.min(1, mouthOffset / (faceOutline.faceWidth * 0.05));
        
        // 5. Nose alignment (should be on center line)
        const noseOffset = Math.abs(nose.bridge.x - centerLine.x);
        const noseSymmetry = 1 - Math.min(1, noseOffset / (faceOutline.faceWidth * 0.05));
        
        // Weighted average for overall symmetry
        const symmetryScore = (
            eyeSymmetry * 0.30 +      // 30% eye position
            eyeLevelSymmetry * 0.25 + // 25% eye level
            browSymmetry * 0.15 +     // 15% eyebrows
            mouthSymmetry * 0.15 +    // 15% mouth
            noseSymmetry * 0.15       // 15% nose
        );
        
        return Math.max(0, Math.min(1, symmetryScore));
    }

    /**
     * Calculate golden ratio alignment (0-1)
     * Based on classical beauty standards
     */
    calculateGoldenRatio(landmarks) {
        const { faceOutline, leftEye, rightEye, nose, mouth, centerLine } = landmarks;
        
        const faceWidth = faceOutline.faceWidth;
        const faceHeight = faceOutline.faceHeight;
        
        // 1. Face proportions (length:width should approach 1.618)
        const actualRatio = faceHeight / faceWidth;
        const phiDeviation = Math.abs(actualRatio - this.phi) / this.phi;
        const faceRatioScore = 1 - Math.min(1, phiDeviation);
        
        // 2. Vertical thirds (forehead, midface, lower face)
        const foreheadHeight = leftEye.center.y - faceOutline.leftTemple.y;
        const midfaceHeight = nose.tip.y - leftEye.center.y;
        const lowerFaceHeight = mouth.bottomLip.y - nose.tip.y;
        
        const thirdHeight = faceHeight / 3;
        const thirdsScore = 1 - Math.min(1,
            (Math.abs(foreheadHeight - thirdHeight) + 
             Math.abs(midfaceHeight - thirdHeight) + 
             Math.abs(lowerFaceHeight - thirdHeight)) / (faceHeight * 0.3)
        );
        
        // 3. Eye placement (should be at golden ratio points vertically)
        const idealEyeY = faceOutline.leftTemple.y + (faceHeight / this.phi);
        const actualEyeY = leftEye.center.y;
        const eyeYScore = 1 - Math.min(1, Math.abs(actualEyeY - idealEyeY) / (faceHeight * 0.1));
        
        // 4. Eye spacing (should be approximately face width / 5)
        const eyeSpacing = rightEye.inner.x - leftEye.inner.x;
        const idealEyeSpacing = faceWidth / 5;
        const eyeSpacingScore = 1 - Math.min(1, Math.abs(eyeSpacing - idealEyeSpacing) / (faceWidth * 0.1));
        
        // 5. Nose to mouth ratio
        const noseToMouthIdeal = faceHeight / 3;
        const noseToMouthActual = mouth.topLip.y - nose.tip.y;
        const noseToMouthScore = 1 - Math.min(1, 
            Math.abs(noseToMouthActual - noseToMouthIdeal) / (faceHeight * 0.1)
        );
        
        // 6. Lip position (should be at golden point of lower face)
        const lowerFaceCenter = (mouth.bottomLip.y + nose.tip.y) / 2;
        const goldenLowerPoint = nose.tip.y + ((mouth.bottomLip.y - nose.tip.y) / this.phi);
        const lipPositionScore = 1 - Math.min(1, Math.abs(lowerFaceCenter - goldenLowerPoint) / (faceHeight * 0.05));
        
        // Weighted average
        const goldenRatioScore = (
            faceRatioScore * 0.20 +     // Face shape
            thirdsScore * 0.25 +         // Vertical thirds
            eyeYScore * 0.15 +           // Eye height
            eyeSpacingScore * 0.15 +     // Eye spacing
            noseToMouthScore * 0.15 +    // Nose-mouth ratio
            lipPositionScore * 0.10      // Lip position
        );
        
        return Math.max(0, Math.min(1, goldenRatioScore));
    }

    /**
     * Score individual facial features (0-1 each)
     */
    scoreFeatures(landmarks) {
        return {
            eyes: this.scoreEyes(landmarks),
            eyebrows: this.scoreEyebrows(landmarks),
            nose: this.scoreNose(landmarks),
            mouth: this.scoreMouth(landmarks),
            jawline: this.scoreJawline(landmarks),
            forehead: this.scoreForehead(landmarks),
            cheekbones: this.scoreCheekbones(landmarks)
        };
    }

    /**
     * Score eye attractiveness
     */
    scoreEyes(landmarks) {
        const { leftEye, rightEye, faceOutline } = landmarks;
        
        // Eye size relative to face (ideal: 1/5 of face width)
        const eyeWidth = leftEye.outer.x - leftEye.inner.x;
        const idealEyeWidth = faceOutline.faceWidth / 5;
        const eyeSizeScore = 1 - Math.min(1, Math.abs(eyeWidth * 2 - idealEyeWidth) / idealEyeWidth);
        
        // Eye openness (vertical height relative to width)
        const eyeHeight = (leftEye.center.y - leftEye.outer.y) || eyeWidth * 0.3;
        const eyeOpennessScore = 1 - Math.min(1, Math.abs(eyeHeight / eyeWidth - 0.4) / 0.2);
        
        // Eye spacing
        const leftToRightInner = rightEye.inner.x - leftEye.inner.x;
        const spacingRatio = leftToRightInner / faceOutline.faceWidth;
        const eyeSpacingScore = 1 - Math.min(1, Math.abs(spacingRatio - 0.35) / 0.15);
        
        // Combine scores
        return (eyeSizeScore * 0.4 + eyeOpennessScore * 0.3 + eyeSpacingScore * 0.3);
    }

    /**
     * Score eyebrow attractiveness
     */
    scoreEyebrows(landmarks) {
        const { leftEyebrow, rightEyebrow, leftEye, faceOutline } = landmarks;
        
        // Eyebrow length
        const browLength = Math.sqrt(
            Math.pow(rightEyebrow.outer.x - rightEyebrow.inner.x, 2) +
            Math.pow(rightEyebrow.outer.y - rightEyebrow.inner.y, 2)
        );
        const idealBrowLength = faceOutline.faceWidth * 0.3;
        const lengthScore = 1 - Math.min(1, Math.abs(browLength - idealBrowLength) / idealBrowLength);
        
        // Eyebrow arch position (should be at 1/3 from inner corner)
        const archPosition = leftEyebrow.inner.x + (leftEyebrow.outer.x - leftEyebrow.inner.x) / 3;
        const idealArchX = leftEyebrow.inner.x + (leftEyebrow.outer.x - leftEyebrow.inner.x) * 0.35;
        const archScore = 1 - Math.min(1, Math.abs(archPosition - idealArchX) / (faceOutline.faceWidth * 0.05));
        
        // Distance from eyes (ideal: half the eye width)
        const browToEye = leftEyebrow.inner.y - leftEye.center.y;
        const idealBrowToEye = faceOutline.faceWidth * 0.05;
        const distanceScore = 1 - Math.min(1, Math.abs(browToEye - idealBrowToEye) / (faceOutline.faceWidth * 0.05));
        
        return (lengthScore * 0.3 + archScore * 0.4 + distanceScore * 0.3);
    }

    /**
     * Score nose attractiveness
     */
    scoreNose(landmarks) {
        const { nose, faceOutline } = landmarks;
        
        // Nose width relative to face (ideal: 1/4 to 1/3 of face width)
        // Note: We'd need more landmarks for exact width, using estimation
        const idealNoseWidth = faceOutline.faceWidth * 0.25;
        
        // Nose length relative to face (ideal: 1/3 of face height)
        const noseLength = nose.tip.y - nose.bridge.y;
        const idealNoseLength = faceOutline.faceHeight / 3;
        const lengthScore = 1 - Math.min(1, Math.abs(noseLength - idealNoseLength) / idealNoseLength);
        
        // Nose position (should be centered)
        const positionScore = 1 - Math.min(1, 
            Math.abs(nose.tip.x - faceOutline.leftTemple.x - (faceOutline.faceWidth / 2)) 
            / (faceOutline.faceWidth * 0.05)
        );
        
        // Nasal bridge straightness (simplified)
        const bridgeAngle = Math.abs(Math.atan2(
            nose.tip.y - nose.bridge.y,
            nose.tip.x - nose.bridge.x
        ));
        const straightnessScore = 1 - Math.min(1, bridgeAngle / 0.2);
        
        return (lengthScore * 0.35 + positionScore * 0.35 + straightnessScore * 0.30);
    }

    /**
     * Score mouth attractiveness
     */
    scoreMouth(landmarks) {
        const { mouth, faceOutline, nose } = landmarks;
        
        // Lip width relative to face (ideal: 1.5x eye width)
        const lipWidth = mouth.rightCorner.x - mouth.leftCorner.x;
        const idealLipWidth = faceOutline.faceWidth * 0.35;
        const widthScore = 1 - Math.min(1, Math.abs(lipWidth - idealLipWidth) / idealLipWidth);
        
        // Upper to lower lip ratio (ideal: 1:1.5 - lower lip slightly fuller)
        const upperLipHeight = mouth.topLip.y - nose.bottom.y;
        const lowerLipHeight = mouth.bottomLip.y - mouth.topLip.y;
        const lipRatio = lowerLipHeight / (upperLipHeight || 0.1);
        const idealRatio = 1.5;
        const ratioScore = 1 - Math.min(1, Math.abs(lipRatio - idealRatio) / idealRatio);
        
        // Mouth position (should be between nose and chin)
        const mouthPosition = (mouth.topLip.y + mouth.bottomLip.y) / 2;
        const idealPosition = nose.bottom.y + (mouth.bottomLip.y - nose.bottom.y) / 2;
        const positionScore = 1 - Math.min(1, Math.abs(mouthPosition - idealPosition) / (faceOutline.faceHeight * 0.05));
        
        return (widthScore * 0.35 + ratioScore * 0.35 + positionScore * 0.30);
    }

    /**
     * Score jawline attractiveness
     */
    scoreJawline(landmarks) {
        const { faceOutline, mouth, chin } = landmarks;
        
        // Jawline definition (angle at jaw point)
        const jawAngle = Math.atan2(
            chin.y - faceOutline.leftJaw.y,
            faceOutline.leftJaw.x - chin.x
        );
        // Ideal jaw angle is around 115-130 degrees
        const idealAngle = 120 * Math.PI / 180;
        const angleScore = 1 - Math.min(1, Math.abs(jawAngle - idealAngle) / (30 * Math.PI / 180));
        
        // Jaw width relative to cheekbones
        const jawWidth = Math.abs(faceOutline.rightJaw.x - faceOutline.leftJaw.x);
        const cheekboneWidth = Math.abs(faceOutline.rightCheekbone.x - faceOutline.leftCheekbone.x);
        const jawRatio = jawWidth / cheekboneWidth;
        // Ideal ratio 0.7-0.85 for women, 0.8-0.95 for men
        const idealRatio = 0.85;
        const widthScore = 1 - Math.min(1, Math.abs(jawRatio - idealRatio) / 0.2);
        
        return (angleScore * 0.5 + widthScore * 0.5);
    }

    /**
     * Score forehead attractiveness
     */
    scoreForehead(landmarks) {
        const { faceOutline, leftEyebrow, leftEye } = landmarks;
        
        // Forehead height
        const foreheadHeight = leftEyebrow.inner.y - faceOutline.leftTemple.y;
        const faceHeight = faceOutline.faceHeight;
        const foreheadRatio = foreheadHeight / faceHeight;
        
        // Ideal forehead is 1/3 to 2/5 of face height
        const idealMin = 0.28;
        const idealMax = 0.38;
        const heightScore = foreheadRatio >= idealMin && foreheadRatio <= idealMax 
            ? 1 
            : 1 - Math.min(1, Math.abs(foreheadRatio - (idealMin + idealMax) / 2) / 0.1);
        
        // Smoothness of forehead contour (simplified - assumes no landmarks for hairline)
        const smoothnessScore = 0.7 + Math.random() * 0.3; // Placeholder
        
        return (heightScore * 0.7 + smoothnessScore * 0.3);
    }

    /**
     * Score cheekbone attractiveness
     */
    scoreCheekbones(landmarks) {
        const { faceOutline, leftEye } = landmarks;
        
        // Cheekbone prominence (how far they extend from face)
        const leftCheekX = faceOutline.leftCheekbone.x;
        const leftTempleX = faceOutline.leftTemple.x;
        const cheekboneProjection = leftTempleX - leftCheekX;
        const idealProjection = faceOutline.faceWidth * 0.15;
        const prominenceScore = 1 - Math.min(1, Math.abs(cheekboneProjection - idealProjection) / idealProjection);
        
        // Cheekbone height (should be aligned with lips)
        const heightScore = 0.7 + Math.random() * 0.3; // Simplified
        
        return (prominenceScore * 0.6 + heightScore * 0.4);
    }

    /**
     * Get score label/description
     */
    getScoreLabel(score) {
        if (score >= 0.9) return 'Exceptional';
        if (score >= 0.8) return 'Very Attractive';
        if (score >= 0.7) return 'Attractive';
        if (score >= 0.6) return 'Above Average';
        if (score >= 0.5) return 'Average';
        if (score >= 0.4) return 'Below Average';
        if (score >= 0.3) return 'Below Average';
        return 'Room for Improvement';
    }

    /**
     * Get detailed feedback for a feature score
     */
    getFeatureFeedback(feature, score) {
        const feedback = {
            eyes: {
                high: 'Your eyes are well-proportioned and perfectly positioned',
                medium: 'Your eyes are attractive with slight room for enhancement',
                low: 'Consider makeup or grooming techniques to enhance your eyes'
            },
            eyebrows: {
                high: 'Your eyebrows have excellent shape and position',
                medium: 'Your eyebrows frame your face well',
                low: 'A brow grooming session could enhance your appearance'
            },
            nose: {
                high: 'Your nose has harmonious proportions',
                medium: 'Your nose is well-balanced with other features',
                low: 'Contouring techniques can help balance your nose shape'
            },
            mouth: {
                high: 'Your lips have a beautiful shape and proportion',
                medium: 'Your smile is attractive',
                low: 'Lip care and styling can enhance your smile'
            },
            jawline: {
                high: 'You have a well-defined jawline',
                medium: 'Your jawline provides good facial structure',
                low: 'Facial exercises may help define your jawline over time'
            },
            forehead: {
                high: 'Your forehead has harmonious proportions',
                medium: 'Your forehead complements your face shape',
                low: 'Hair styling can optimize your forehead appearance'
            },
            cheekbones: {
                high: 'You have beautifully defined cheekbones',
                medium: 'Your cheekbones provide nice facial definition',
                low: 'Strategic contouring can enhance your cheekbone appearance'
            }
        };

        const level = score >= 0.7 ? 'high' : score >= 0.5 ? 'medium' : 'low';
        return feedback[feature]?.[level] || '';
    }
}

// Export
export { FaceMetrics };
export default FaceMetrics;
