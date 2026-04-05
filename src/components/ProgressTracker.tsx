"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  HistoryIcon,
  CameraIcon,
  TrendingUpIcon,
  TrashIcon,
  ExternalLinkIcon,
  CalendarIcon
} from "lucide-react";
import { AnalysisResult } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface ProgressTrackerProps {
  analyses: AnalysisResult[];
  onDelete?: (id: string) => void;
  className?: string;
}

export function ProgressTracker({
  analyses,
  onDelete,
  className,
}: ProgressTrackerProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const averageScores = React.useMemo(() => {
    if (analyses.length === 0) return null;
    
    const sum = analyses.reduce(
      (acc, a) => ({
        overall: acc.overall + a.scores.overall,
        face: acc.face + a.scores.face,
        skin: acc.skin + a.scores.skin,
        hair: acc.hair + a.scores.hair,
        style: acc.style + a.scores.style,
      }),
      { overall: 0, face: 0, skin: 0, hair: 0, style: 0 }
    );

    const count = analyses.length;
    return {
      overall: sum.overall / count,
      face: sum.face / count,
      skin: sum.skin / count,
      hair: sum.hair / count,
      style: sum.style / count,
    };
  }, [analyses]);

  const latestAnalysis = analyses[0];
  const firstAnalysis = analyses[analyses.length - 1];

  const progressChange = React.useMemo(() => {
    if (!firstAnalysis || !latestAnalysis || analyses.length < 2) return null;

    return {
      overall: latestAnalysis.scores.overall - firstAnalysis.scores.overall,
      face: latestAnalysis.scores.face - firstAnalysis.scores.face,
      skin: latestAnalysis.scores.skin - firstAnalysis.scores.skin,
      hair: latestAnalysis.scores.hair - firstAnalysis.scores.hair,
      style: latestAnalysis.scores.style - firstAnalysis.scores.style,
    };
  }, [analyses, firstAnalysis, latestAnalysis]);

  if (analyses.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-primary" />
            Progress Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <CameraIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No analyses yet</h3>
            <p className="text-sm text-muted-foreground">
              Upload a photo to start tracking your progress
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUpIcon className="h-5 w-5 text-primary" />
          Progress Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {analyses.length}
            </div>
            <div className="text-xs text-muted-foreground">Total Analyses</div>
          </div>
          {averageScores && (
            <>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {averageScores.overall.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {latestAnalysis?.scores.overall.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Latest</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className={`text-2xl font-bold ${progressChange && progressChange.overall >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {progressChange && (
                    <span>
                      {progressChange.overall >= 0 ? "+" : ""}
                      {progressChange.overall.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Change</div>
              </div>
            </>
          )}
        </div>

        {progressChange && analyses.length >= 2 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Progress Since First Analysis</h4>
            <div className="space-y-2">
              {Object.entries(progressChange).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{key}</span>
                    <span className={value >= 0 ? "text-emerald-500" : "text-red-500"}>
                      {value >= 0 ? "+" : ""}{value.toFixed(1)}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, Math.max(0, 50 + value * 10))} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="history">
          <TabsList className="w-full">
            <TabsTrigger value="history" className="flex-1">
              <HistoryIcon className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex-1">
              <TrendingUpIcon className="h-4 w-4 mr-2" />
              Compare
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-3 mt-4">
            {analyses.slice(0, 10).map((analysis) => (
              <div
                key={analysis.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={analysis.imageUrl}
                    alt="Analysis"
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {formatDate(new Date(analysis.timestamp))}
                      </span>
                    </div>
                    <div className="font-semibold">
                      Overall: {analysis.scores.overall.toFixed(1)}/10
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/analyze/${analysis.id}`}>
                    <Button variant="ghost" size="icon">
                      <ExternalLinkIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(analysis.id)}
                    >
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="compare" className="mt-4">
            {analyses.length >= 2 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">First Analysis</h4>
                    <img
                      src={firstAnalysis.imageUrl}
                      alt="First"
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(firstAnalysis.timestamp))}
                    </p>
                    <p className="font-semibold">
                      Score: {firstAnalysis.scores.overall.toFixed(1)}/10
                    </p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="text-sm font-semibold mb-2">Latest Analysis</h4>
                    <img
                      src={latestAnalysis.imageUrl}
                      alt="Latest"
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(latestAnalysis.timestamp))}
                    </p>
                    <p className="font-semibold text-primary">
                      Score: {latestAnalysis.scores.overall.toFixed(1)}/10
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <h4 className="text-sm font-semibold text-emerald-600 mb-2">
                    Your Progress
                  </h4>
                  <p className="text-sm">
                    {progressChange?.overall && progressChange.overall > 0
                      ? `You've improved by ${progressChange.overall.toFixed(1)} points! Keep it up!`
                      : progressChange?.overall === 0
                      ? "You've maintained your score. Try some new tips!"
                      : `Your score decreased by ${Math.abs(progressChange?.overall || 0).toFixed(1)} points. Don't worry - consistency is key!`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Need at least 2 analyses to compare</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
