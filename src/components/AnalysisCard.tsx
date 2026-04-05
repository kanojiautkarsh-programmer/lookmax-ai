"use client";

import * as React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "./ui/card";
import { ScoreGauge, ScoreBar } from "./ScoreGauge";
import { 
  FaceIcon, 
  DropletIcon, 
  ScissorsIcon, 
  ShirtIcon,
  SparklesIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  LightbulbIcon,
  CheckCircle2Icon,
  AlertCircleIcon
} from "lucide-react";
import { AnalysisResult } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface AnalysisCardProps {
  analysis: AnalysisResult;
  className?: string;
}

export function AnalysisCard({ analysis, className }: AnalysisCardProps) {
  const { scores, analysis: analysisData, tips, strengths, improvements } = analysis;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>{formatDate(new Date(analysis.timestamp))}</CardDescription>
          </div>
          <ScoreGauge score={scores.overall} label="Overall" size="lg" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ScoreBar
            label="Face"
            score={scores.face}
            icon={<FaceIcon className="h-4 w-4" />}
          />
          <ScoreBar
            label="Skin"
            score={scores.skin}
            icon={<DropletIcon className="h-4 w-4" />}
          />
          <ScoreBar
            label="Hair"
            score={scores.hair}
            icon={<ScissorsIcon className="h-4 w-4" />}
          />
          <ScoreBar
            label="Style"
            score={scores.style}
            icon={<ShirtIcon className="h-4 w-4" />}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-primary" />
              Your Strengths
            </h4>
            <ul className="space-y-2">
              {strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2Icon className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <LightbulbIcon className="h-4 w-4 text-amber-500" />
              Areas to Improve
            </h4>
            <ul className="space-y-2">
              {improvements.map((improvement, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <AlertCircleIcon className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3">Your Profile</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Face Shape:</span>{" "}
              <span className="font-medium">{analysisData.faceShape}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Skin Tone:</span>{" "}
              <span className="font-medium">{analysisData.skinTone}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Skin Condition:</span>{" "}
              <span className="font-medium">{analysisData.skinCondition}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Hair Type:</span>{" "}
              <span className="font-medium">{analysisData.hairType}</span>
            </div>
          </div>
        </div>

        {tips.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-3">Actionable Tips</h4>
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 font-medium">
                    {i + 1}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
