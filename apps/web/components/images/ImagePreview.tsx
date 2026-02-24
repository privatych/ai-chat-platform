'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ImagePreviewProps {
  generation: any;
  loading: boolean;
}

export function ImagePreview({ generation, loading }: ImagePreviewProps) {
  function handleDownload() {
    if (!generation?.imageUrl) return;

    const link = document.createElement('a');
    link.href = generation.imageUrl;
    link.download = `ai-image-${generation.id}.png`;
    link.click();
  }

  return (
    <Card>
      <CardContent className="p-6">
        {loading ? (
          <div className="aspect-square flex items-center justify-center bg-muted rounded-lg">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Generating image...</p>
              <p className="text-xs text-muted-foreground mt-1">This may take 10-30 seconds</p>
            </div>
          </div>
        ) : generation ? (
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <Image
                src={generation.imageUrl}
                alt="Generated image"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Cost: ${generation.cost.toFixed(4)}
              </div>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        ) : (
          <div className="aspect-square flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">Your generated image will appear here</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
