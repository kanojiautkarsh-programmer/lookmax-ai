/**
 * ImageProcessor - Handle image loading, processing, and conversion
 */

class ImageProcessor {
    constructor() {
        this.maxDimension = 1024; // Max dimension for processing
        this.quality = 0.9; // JPEG quality
    }

    /**
     * Load image from various sources
     * @param {File|Blob|string} source - File, Blob, or URL
     * @returns {Promise<HTMLCanvasElement>} - Processed canvas
     */
    async loadImage(source) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = async () => {
                try {
                    const canvas = await this.processImage(img);
                    resolve(canvas);
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => {
                reject(new Error('Failed to load image. Please try another file.'));
            };

            // Handle different source types
            if (source instanceof File || source instanceof Blob) {
                img.src = URL.createObjectURL(source);
            } else if (typeof source === 'string') {
                // Could be URL or base64
                if (source.startsWith('data:')) {
                    img.src = source;
                } else {
                    img.crossOrigin = 'anonymous'; // Allow cross-origin for URLs
                    img.src = source;
                }
            } else {
                reject(new Error('Invalid image source'));
            }
        });
    }

    /**
     * Process image to optimal size and format
     * @param {HTMLImageElement} img - Source image
     * @returns {Promise<HTMLCanvasElement>} - Processed canvas
     */
    async processImage(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > this.maxDimension || height > this.maxDimension) {
            if (width > height) {
                height = (height / width) * this.maxDimension;
                width = this.maxDimension;
            } else {
                width = (width / height) * this.maxDimension;
                height = this.maxDimension;
            }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        return canvas;
    }

    /**
     * Get face region from canvas (crop to face area)
     * @param {HTMLCanvasElement} canvas - Source canvas
     * @param {Object} boundingBox - Face bounding box
     * @param {number} padding - Padding around face (0-1 ratio)
     * @returns {HTMLCanvasElement} - Cropped canvas
     */
    cropToFace(canvas, boundingBox, padding = 0.3) {
        const ctx = canvas.getContext('2d');
        const { x, y, width, height } = boundingBox;

        // Add padding
        const padX = width * padding;
        const padY = height * padding;

        const cropX = Math.max(0, x - padX);
        const cropY = Math.max(0, y - padY);
        const cropWidth = Math.min(canvas.width - cropX, width + padX * 2);
        const cropHeight = Math.min(canvas.height - cropY, height + padY * 2);

        // Create cropped canvas
        const cropped = document.createElement('canvas');
        cropped.width = cropWidth;
        cropped.height = cropHeight;
        
        const cropCtx = cropped.getContext('2d');
        cropCtx.drawImage(
            canvas,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );

        return cropped;
    }

    /**
     * Convert canvas to base64 string
     * @param {HTMLCanvasElement} canvas - Source canvas
     * @param {string} format - Image format (image/jpeg, image/png, image/webp)
     * @returns {string} - Base64 data URL
     */
    canvasToBase64(canvas, format = 'image/jpeg') {
        return canvas.toDataURL(format, this.quality);
    }

    /**
     * Convert canvas to Blob
     * @param {HTMLCanvasElement} canvas - Source canvas
     * @param {string} format - Image format
     * @returns {Promise<Blob>} - Image blob
     */
    canvasToBlob(canvas, format = 'image/jpeg') {
        return new Promise((resolve) => {
            canvas.toBlob(resolve, format, this.quality);
        });
    }

    /**
     * Get image data for analysis
     * @param {HTMLCanvasElement} canvas - Source canvas
     * @returns {ImageData} - Image data
     */
    getImageData(canvas) {
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * Simple color analysis
     * @param {HTMLCanvasElement} canvas - Source canvas
     * @returns {Object} - Color analysis results
     */
    analyzeColors(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let r = 0, g = 0, b = 0;
        let skinTone = 0;
        let totalPixels = 0;

        for (let i = 0; i < data.length; i += 4) {
            const red = data[i];
            const green = data[i + 1];
            const blue = data[i + 2];

            // Accumulate RGB
            r += red;
            g += green;
            b += blue;
            totalPixels++;

            // Detect skin tone (simple heuristic)
            // Skin typically has: r > g > b, and certain ranges
            if (this.isSkinTone(red, green, blue)) {
                skinTone++;
            }
        }

        // Calculate averages
        const avgR = r / totalPixels;
        const avgG = g / totalPixels;
        const avgB = b / totalPixels;

        // Calculate skin tone percentage
        const skinPercentage = (skinTone / totalPixels) * 100;

        // Estimate skin undertone
        const undertone = this.getUndertone(avgR, avgG, avgB);

        // Calculate brightness
        const brightness = (avgR + avgG + avgB) / 3 / 255;

        return {
            average: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) },
            skinPercentage: Math.round(skinPercentage),
            undertone,
            brightness: Math.round(brightness * 100) / 100
        };
    }

    /**
     * Check if pixel is likely skin tone
     */
    isSkinTone(r, g, b) {
        // Basic skin tone detection
        // Skin typically has higher red values
        if (r < 95 || g < 40 || b < 20) return false;
        if (r < g || r < b) return false;
        if (g > 85 || b > 75) return false;
        
        // Skin range check
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
        if (maxDiff > 40) return false;

        return true;
    }

    /**
     * Determine skin undertone (warm, cool, neutral)
     */
    getUndertone(r, g, b) {
        // Simple undertone detection based on RGB
        // Compare warmth
        const warmth = (r - 128) - (b - 128);
        
        if (warmth > 15) return 'warm';
        if (warmth < -15) return 'cool';
        return 'neutral';
    }

    /**
     * Validate image file
     * @param {File} file - File to validate
     * @returns {Object} - Validation result
     */
    validateImage(file) {
        const errors = [];
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            errors.push('Please upload a JPG, PNG, or WebP image');
        }

        if (file.size > maxSize) {
            errors.push('Image is too large. Maximum size is 10MB');
        }

        if (file.size < 10 * 1024) {
            errors.push('Image is too small. Please upload a clearer photo');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Apply basic filters for display
     * @param {HTMLCanvasElement} canvas - Source canvas
     * @param {string} filter - Filter type
     * @returns {HTMLCanvasElement} - Filtered canvas
     */
    applyFilter(canvas, filter) {
        const ctx = canvas.getContext('2d');
        const filtered = document.createElement('canvas');
        filtered.width = canvas.width;
        filtered.height = canvas.height;
        const filterCtx = filtered.getContext('2d');

        // Apply CSS-like filters
        switch (filter) {
            case 'grayscale':
                filterCtx.filter = 'grayscale(100%)';
                break;
            case 'brighten':
                filterCtx.filter = 'brightness(1.1) contrast(1.05)';
                break;
            case 'sharpen':
                filterCtx.filter = 'contrast(1.1)';
                break;
            default:
                filterCtx.filter = 'none';
        }

        filterCtx.drawImage(canvas, 0, 0);

        return filtered;
    }

    /**
     * Rotate image if needed
     * @param {HTMLCanvasElement} canvas - Source canvas
     * @param {number} degrees - Rotation degrees
     * @returns {HTMLCanvasElement} - Rotated canvas
     */
    rotate(canvas, degrees) {
        const radians = degrees * Math.PI / 180;
        const rotated = document.createElement('canvas');
        
        // For 90 or 270 degree rotations, swap dimensions
        if (degrees === 90 || degrees === 270) {
            rotated.width = canvas.height;
            rotated.height = canvas.width;
        } else {
            rotated.width = canvas.width;
            rotated.height = canvas.height;
        }

        const ctx = rotated.getContext('2d');
        ctx.translate(rotated.width / 2, rotated.height / 2);
        ctx.rotate(radians);
        ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

        return rotated;
    }
}

// Export
export { ImageProcessor };
export default ImageProcessor;
