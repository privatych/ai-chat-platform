'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { ImageGenerator } from '@/components/images/ImageGenerator';
import { ImagePreview } from '@/components/images/ImagePreview';
import { GenerationHistory } from '@/components/images/GenerationHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Brain, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/user-menu';

export default function ImagesPage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, clearAuth } = useAuthStore();
  const [usageToday, setUsageToday] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState<{ prompt: string; model: string } | null>(null);

  const tier = (user?.subscriptionTier || 'free') as 'free' | 'premium';
  const limit = tier === 'premium' ? 30 : 10;

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (hasHydrated && isAuthenticated) {
      loadUsageStats();
    }
  }, [hasHydrated, isAuthenticated, router]);

  async function loadUsageStats() {
    const response = await apiClient.request('/api/images/history?limit=100');
    if (response.success) {
      const today = new Date().setHours(0, 0, 0, 0);
      const todayGenerations = (response.data as any[]).filter(
        (g: any) => new Date(g.createdAt).setHours(0, 0, 0, 0) === today
      );
      setUsageToday(todayGenerations.length);
    }
  }

  async function handleGenerate(params: any) {
    setLoading(true);
    try {
      const response = await apiClient.request('/api/images/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });

      if (response.success) {
        setCurrentGeneration(response.data);
        setUsageToday(prev => prev + 1);
        // Clear regenerate prompt after successful generation
        setRegeneratePrompt(null);
      }
    } catch (error: any) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleRegenerate(prompt: string, model: string) {
    // Set the prompt and model for regeneration
    setRegeneratePrompt({ prompt, model });
    // Scroll to top to show the generator
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl mx-auto py-12 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-4">AI Image Generation</h1>
        <p className="text-muted-foreground mb-6">
          Sign in to start generating images with AI
        </p>
        <Link href="/login">
          <Button size="lg">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AI Chat Platform</span>
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <Link href="/chat">
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </Link>
            <ThemeToggle />
            <UserMenu onLogout={handleLogout} />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 bg-gradient-to-b from-background to-muted/20">
        <div className="container max-w-7xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">AI Image Generation</h1>
            <p className="text-muted-foreground">
              Create stunning images with cutting-edge AI models
            </p>
          </div>

        {/* Usage Stats Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Today's Usage</CardTitle>
                <CardDescription>
                  {usageToday} / {limit} generations used
                </CardDescription>
              </div>
              {tier === 'free' && (
                <Link href="/subscription">
                  <Button className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600">
                    <Crown className="h-4 w-4" />
                    Upgrade to Premium
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Left: Generator */}
          <ImageGenerator
            tier={tier}
            usageToday={usageToday}
            limit={limit}
            loading={loading}
            onGenerate={handleGenerate}
            initialPrompt={regeneratePrompt?.prompt}
            initialModel={regeneratePrompt?.model}
          />

          {/* Right: Preview */}
          <ImagePreview generation={currentGeneration} loading={loading} />
        </div>

          {/* History */}
          <GenerationHistory
            onReload={loadUsageStats}
            onRegenerate={handleRegenerate}
          />
        </div>
      </div>
    </div>
  );
}
