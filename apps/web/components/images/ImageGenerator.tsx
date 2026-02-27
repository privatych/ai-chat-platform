'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ModelSelector } from './ModelSelector';
import { ImageParameters } from './ImageParameters';
import { Loader2 } from 'lucide-react';

interface ImageGeneratorProps {
  tier: 'free' | 'premium';
  usageToday: number;
  limit: number;
  loading: boolean;
  onGenerate: (params: any) => Promise<void>;
  initialPrompt?: string;
  initialModel?: string;
}

export function ImageGenerator({
  tier,
  usageToday,
  limit,
  loading,
  onGenerate,
  initialPrompt,
  initialModel,
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('black-forest-labs/flux.2-klein-4b');
  const [parameters, setParameters] = useState({
    width: 1024,
    height: 1024,
    steps: 20,
  });

  // Update prompt and model when regenerating from history
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (initialModel) {
      setSelectedModel(initialModel);
    }
  }, [initialModel]);

  const canGenerate = usageToday < limit && prompt.trim().length > 0 && !loading;

  function handleSubmit() {
    if (!canGenerate) return;

    onGenerate({
      model: selectedModel,
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim() || undefined,
      ...parameters,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Image</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Model Selector */}
        <ModelSelector
          tier={tier}
          value={selectedModel}
          onChange={setSelectedModel}
        />

        {/* Prompt */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Prompt
          </label>
          <Textarea
            placeholder="Describe the image you want to create..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {prompt.length}/1000 characters
          </p>
        </div>

        {/* Negative Prompt */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Negative Prompt (Optional)
          </label>
          <Textarea
            placeholder="What to avoid in the image..."
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            rows={2}
            maxLength={500}
          />
        </div>

        {/* Advanced Parameters (Premium only) */}
        {tier === 'premium' && (
          <ImageParameters
            value={parameters}
            onChange={setParameters}
          />
        )}

        {/* Generate Button */}
        <Button
          onClick={handleSubmit}
          disabled={!canGenerate}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Image'
          )}
        </Button>

        {usageToday >= limit && (
          <p className="text-sm text-red-500 text-center">
            Daily limit reached. {tier === 'free' ? 'Upgrade to Premium for more generations.' : 'Come back tomorrow!'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
