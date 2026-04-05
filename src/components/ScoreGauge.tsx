"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreGauge({
  score,
  label,
  size = "md",
  className,
}: ScoreGaugeProps) {
  const percentage = Math.min(100, Math.max(0, score * 10));
  
  const sizeClasses = {
    sm: "w-16 h-16 text-lg",
    md: "w-24 h-24 text-2xl",
    lg: "w-32 h-32 text-4xl",
  };

  const getColor = (score: number) => {
    if (score >= 8) return "text-emerald-500";
    if (score >= 6) return "text-yellow-500";
    if (score >= 4) return "text-orange-500";
    return "text-red-500";
  };

  const getBgColor = (score: number) => {
    if (score >= 8) return "bg-emerald-500";
    if (score >= 6) return "bg-yellow-500";
    if (score >= 4) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${percentage} 100`}
            strokeLinecap="round"
            className={cn("transition-all duration-1000 ease-out", getColor(score))}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", getColor(score), size === "lg" && "text-4xl")}>
            {score.toFixed(1)}
          </span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

interface ScoreBarProps {
  label: string;
  score: number;
  icon?: React.ReactNode;
  className?: string;
}

export function ScoreBar({
  label,
  score,
  icon,
  className,
}: ScoreBarProps) {
  const percentage = Math.min(100, Math.max(0, score * 10));

  const getColor = (score: number) => {
    if (score >= 8) return "bg-emerald-500";
    if (score >= 6) return "bg-yellow-500";
    if (score >= 4) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-semibold">{score.toFixed(1)}/10</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", getColor(score))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
