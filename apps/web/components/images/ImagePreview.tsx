'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, ImageIcon, Calendar, DollarSign, Maximize2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface ImagePreviewProps {
  generation: any;
  loading: boolean;
}

export function ImagePreview({ generation, loading }: ImagePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  function handleDownload() {
    if (!generation?.imageUrl) return;

    const link = document.createElement('a');
    link.href = generation.imageUrl + '?download=1';
    link.download = `ai-image-${generation.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="aspect-square flex items-center justify-center bg-muted rounded-lg">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Generating image...</p>
              <p className="text-xs text-muted-foreground mt-1">This may take 10-30 seconds</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!generation) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="aspect-square flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
            <div className="text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Your generated image will appear here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Desktop layout: info left, image right
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          {/* Left: Info Panel */}
          <div className="space-y-4 order-2 lg:order-1">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Image Details
              </h3>

              <div className="space-y-3 text-sm">
                {/* Model */}
                <div>
                  <p className="text-muted-foreground mb-1">Model</p>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {generation.model}
                  </Badge>
                </div>

                {/* Prompt */}
                <div>
                  <p className="text-muted-foreground mb-1">Prompt</p>
                  <p className="text-sm bg-muted p-3 rounded-md break-words max-h-32 overflow-y-auto">
                    {generation.prompt}
                  </p>
                </div>

                {/* Negative Prompt */}
                {generation.negativePrompt && (
                  <div>
                    <p className="text-muted-foreground mb-1">Negative Prompt</p>
                    <p className="text-sm bg-muted p-2 rounded-md break-words">
                      {generation.negativePrompt}
                    </p>
                  </div>
                )}

                {/* Parameters */}
                <div>
                  <p className="text-muted-foreground mb-1">Parameters</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted p-2 rounded">
                      <span className="text-muted-foreground">Size:</span>{' '}
                      <span className="font-medium">{generation.width}×{generation.height}</span>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <span className="text-muted-foreground">Steps:</span>{' '}
                      <span className="font-medium">{generation.steps}</span>
                    </div>
                  </div>
                </div>

                {/* Cost & Date */}
                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Cost
                    </span>
                    <span className="font-medium">${generation.cost.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created
                    </span>
                    <span className="font-medium">
                      {new Date(generation.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <Button
              onClick={handleDownload}
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Image
            </Button>
          </div>

          {/* Right: Image */}
          <div className="order-1 lg:order-2">
            <div
              className="relative aspect-square rounded-lg overflow-hidden bg-muted border cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
              onClick={() => setIsFullscreen(true)}
            >
              <Image
                src={generation.imageUrl}
                alt={generation.prompt}
                fill
                className="object-contain"
                priority
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Maximize2 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen Modal */}
        {isFullscreen && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsFullscreen(false)}
          >
            <div className="relative w-full h-full max-w-7xl max-h-[90vh]">
              <Image
                src={generation.imageUrl}
                alt={generation.prompt}
                fill
                className="object-contain"
                priority
              />
              <Button
                onClick={() => setIsFullscreen(false)}
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
