"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeftIcon, 
  ShareIcon, 
  DownloadIcon, 
  TrashIcon,
  HomeIcon,
  SparklesIcon,
  CalendarIcon,
  ExternalLinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalysisCard } from "@/components";
import { getAnalysisById, getProgress } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import { AnalysisResult } from "@/lib/types";

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [analysis, setAnalysis] = React.useState<AnalysisResult | null>(null);
  const [progress, setProgress] = React.useState(getProgress());
  const [relatedAnalyses, setRelatedAnalyses] = React.useState<AnalysisResult[]>([]);

  React.useEffect(() => {
    const id = params.id as string;
    const found = getAnalysisById(id);
    if (found) {
      setAnalysis(found);
      
      const all = getProgress();
      const related = all.analyses
        .filter(a => a.id !== id)
        .slice(0, 3);
      setRelatedAnalyses(related);
    } else {
      router.push("/");
    }
  }, [params.id, router]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(getProgress());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <SparklesIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Looksmaxing AI Analysis",
          text: `Check out my appearance analysis! Overall score: ${analysis.scores.overall}/10`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="font-semibold">Analysis Result</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {formatDate(new Date(analysis.timestamp))}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <ShareIcon className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="icon" asChild>
                <Link href="/">
                  <HomeIcon className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <AnalysisCard analysis={analysis} />

            {analysis.detailedAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Detailed AI Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {analysis.detailedAnalysis}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={analysis.imageUrl}
                  alt="Analyzed photo"
                  className="w-full rounded-lg"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Face Shape</span>
                  <span className="font-medium">{analysis.analysis.faceShape}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Skin Tone</span>
                  <span className="font-medium">{analysis.analysis.skinTone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Skin Condition</span>
                  <span className="font-medium">{analysis.analysis.skinCondition}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Hair Type</span>
                  <span className="font-medium">{analysis.analysis.hairType}</span>
                </div>
              </CardContent>
            </Card>

            {relatedAnalyses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Analyses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedAnalyses.map(a => (
                    <Link key={a.id} href={`/analyze/${a.id}`}>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                        <img
                          src={a.imageUrl}
                          alt="Analysis"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            Score: {a.scores.overall.toFixed(1)}/10
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(a.timestamp))}
                          </p>
                        </div>
                        <ExternalLinkIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <SparklesIcon className="h-8 w-8 text-primary mx-auto" />
                  <h3 className="font-semibold">Want more tips?</h3>
                  <p className="text-sm text-muted-foreground">
                    Chat with our AI advisor for personalized recommendations
                  </p>
                  <Button className="w-full" asChild>
                    <Link href="/#chat">
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Chat with AI
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
