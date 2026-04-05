"use client";

import * as React from "react";
import { Upload, Camera, X, Image as ImageIcon } from "lucide-react";
import { cn, fileToBase64 } from "@/lib/utils";
import { Button } from "./ui/button";

interface PhotoUploaderProps {
  onImageSelect: (imageBase64: string) => void;
  currentImage?: string;
  onClear?: () => void;
  className?: string;
}

export function PhotoUploader({
  onImageSelect,
  currentImage,
  onClear,
  className,
}: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(currentImage || null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (currentImage) {
      setPreview(currentImage);
    }
  }, [currentImage]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setPreview(base64);
      onImageSelect(base64);
    } catch (error) {
      console.error("Error converting file:", error);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleClear = () => {
    setPreview(null);
    onClear?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  if (preview) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative rounded-lg overflow-hidden border-2 border-primary/20">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-white text-sm font-medium">Photo ready for analysis</p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Change Photo
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          "flex flex-col items-center justify-center"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <ImageIcon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Upload Your Photo
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Drag and drop an image here, or click to browse. Best results with clear, well-lit selfies.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
            <Button variant="outline" onClick={() => cameraInputRef.current?.click()}>
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        <span>Supports JPG, PNG, WebP</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    </div>
  );
}
