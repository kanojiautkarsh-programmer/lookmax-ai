"use client";

import * as React from "react";
import Link from "next/link";
import { 
  SparklesIcon, 
  CameraIcon, 
  MessageCircleIcon, 
  TrendingUpIcon,
  ShieldCheckIcon,
  ZapIcon,
  ArrowRightIcon,
  StarIcon,
  HeartIcon,
  UsersIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressTracker, PhotoUploader, ChatInterface, LoadingOverlay } from "@/components";
import { performAnalysis } from "@/lib/ai";
import { addAnalysis, getProgress, addChatMessage } from "@/lib/storage";
import { getChatAdvice } from "@/lib/ai";
import { AnalysisResult, ChatMessage } from "@/lib/types";

export default function HomePage() {
  const [activeTab, setActiveTab] = React.useState<"analyze" | "chat">("analyze");
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [currentAnalysis, setCurrentAnalysis] = React.useState<AnalysisResult | null>(null);
  const [progress, setProgress] = React.useState(getProgress());
  const [isChatLoading, setIsChatLoading] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(getProgress());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleImageSelect = (imageBase64: string) => {
    setSelectedImage(imageBase64);
    setCurrentAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      const result = await performAnalysis(selectedImage, "detailed");
      const saved = addAnalysis({
        imageUrl: result.imageUrl,
        scores: result.scores,
        analysis: result.analysis,
        tips: result.tips,
        strengths: result.strengths,
        improvements: result.improvements,
        detailedAnalysis: result.detailedAnalysis,
      });
      setCurrentAnalysis(saved);
      setProgress(getProgress());
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    setIsChatLoading(true);
    try {
      const history = progress.chatHistory.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));
      
      const response = await getChatAdvice(message, history);
      
      addChatMessage({ role: "user", content: message });
      addChatMessage({ role: "assistant", content: response });
      
      setProgress(getProgress());
    } catch (error) {
      console.error("Chat error:", error);
      addChatMessage({
        role: "assistant",
        content: "Sorry, I couldn't process your request. Please try again.",
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <LoadingOverlay 
        isLoading={isAnalyzing} 
        message="Analyzing your appearance..."
        progress={isAnalyzing ? 75 : undefined}
      />

      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl">Looksmaxing AI</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </Link>
              <Button asChild>
                <Link href="#analyze">Get Started</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="gradient-text">Transform</span> Your Appearance with AI
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get personalized appearance analysis, skincare tips, hairstyle recommendations, 
              and fashion advice powered by advanced AI. All for free.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild className="gap-2">
                <Link href="#analyze">
                  <CameraIcon className="h-5 w-5" />
                  Analyze Now
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2">
                <Link href="#chat">
                  <MessageCircleIcon className="h-5 w-5" />
                  Chat with AI
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
              <div className="flex items-center gap-1">
                <ShieldCheckIcon className="h-4 w-4 text-emerald-500" />
                <span>100% Private</span>
              </div>
              <div className="flex items-center gap-1">
                <ZapIcon className="h-4 w-4 text-amber-500" />
                <span>Instant Results</span>
              </div>
              <div className="flex items-center gap-1">
                <StarIcon className="h-4 w-4 text-primary" />
                <span>Free Forever</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CameraIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI Photo Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Upload a selfie and get detailed analysis of your face shape, skin condition, 
                  hair type, and style with actionable improvement tips.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageCircleIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI Chat Advisor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Chat with our AI advisor about skincare routines, hairstyle recommendations, 
                  fashion tips, and grooming best practices.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUpIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track your appearance journey over time. Compare before and after photos 
                  and see your improvement with visual charts.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="analyze" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Analyze Your Appearance</h2>
          <p className="text-center text-muted-foreground max-w-xl mx-auto mb-8">
            Upload a clear photo and get instant AI-powered analysis with personalized tips.
          </p>
          
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CameraIcon className="h-5 w-5 text-primary" />
                  Upload Photo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <PhotoUploader
                  onImageSelect={handleImageSelect}
                  currentImage={selectedImage || undefined}
                  onClear={() => {
                    setSelectedImage(null);
                    setCurrentAnalysis(null);
                  }}
                />
                {selectedImage && !currentAnalysis && (
                  <Button 
                    onClick={handleAnalyze} 
                    className="w-full" 
                    size="lg"
                    disabled={isAnalyzing}
                  >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Analyze Appearance
                  </Button>
                )}
                {currentAnalysis && (
                  <Button 
                    onClick={handleAnalyze} 
                    className="w-full" 
                    size="lg"
                    disabled={isAnalyzing}
                    variant="outline"
                  >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Re-analyze
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {currentAnalysis ? (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-emerald-500">
                        {currentAnalysis.scores.overall.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Analysis Complete!</h3>
                      <p className="text-sm text-muted-foreground">Your overall score</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentAnalysis.strengths[0] || "Great analysis complete!"}
                  </p>
                  <Link href={`/analyze/${currentAnalysis.id}`}>
                    <Button className="w-full mt-4 gap-2">
                      View Full Analysis
                      <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <CameraIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">Ready to analyze?</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload a clear, well-lit photo for the best results
                    </p>
                  </CardContent>
                </Card>
              )}

              <ProgressTracker analyses={progress.analyses} />
            </div>
          </div>
        </div>
      </section>

      <section id="chat" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Chat with AI Advisor</h2>
          <p className="text-center text-muted-foreground max-w-xl mx-auto mb-8">
            Get personalized advice on skincare, hairstyles, fashion, and more.
          </p>
          <div className="max-w-3xl mx-auto">
            <ChatInterface
              messages={progress.chatHistory}
              onSendMessage={handleSendMessage}
              isLoading={isChatLoading}
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full gradient-bg mx-auto flex items-center justify-center text-white font-bold">
                1
              </div>
              <h3 className="font-semibold">Upload Photo</h3>
              <p className="text-sm text-muted-foreground">
                Take or upload a clear selfie
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full gradient-bg mx-auto flex items-center justify-center text-white font-bold">
                2
              </div>
              <h3 className="font-semibold">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Our AI analyzes your features
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full gradient-bg mx-auto flex items-center justify-center text-white font-bold">
                3
              </div>
              <h3 className="font-semibold">Get Tips</h3>
              <p className="text-sm text-muted-foreground">
                Receive personalized recommendations
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full gradient-bg mx-auto flex items-center justify-center text-white font-bold">
                4
              </div>
              <h3 className="font-semibold">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your improvement over time
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 gradient-bg text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Your Transformation Today</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">
            Join thousands of people improving their appearance with AI-powered insights. 
            Free, private, and always improving.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild className="gap-2">
              <Link href="#analyze">
                <SparklesIcon className="h-5 w-5" />
                Get Started Free
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-white/60 mt-8">
            <div className="flex items-center gap-1">
              <UsersIcon className="h-4 w-4" />
              <span>10,000+ Users</span>
            </div>
            <div className="flex items-center gap-1">
              <StarIcon className="h-4 w-4" />
              <span>4.9 Rating</span>
            </div>
            <div className="flex items-center gap-1">
              <HeartIcon className="h-4 w-4" />
              <span>Made with Love</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center">
                <SparklesIcon className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Looksmaxing AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Looksmaxing AI. All rights reserved. Made for self-improvement enthusiasts.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
