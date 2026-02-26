'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Download, RefreshCw, Eye, Copy, Wand2 } from 'lucide-react';
import Image from 'next/image';

interface GenerationHistoryProps {
  onReload?: () => void;
  onRegenerate?: (prompt: string, model: string) => void;
}

export function GenerationHistory({ onReload, onRegenerate }: GenerationHistoryProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [editedPrompt, setEditedPrompt] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    const response = await apiClient.request('/api/images/history?limit=12');
    if (response.success) {
      setHistory(response.data as any[]);
    }
    setLoading(false);
  }

  function handleReload() {
    loadHistory();
    onReload?.();
  }

  function handleDownload(imageUrl: string, id: string) {
    // Add download parameter to force download
    const downloadUrl = imageUrl.includes('?')
      ? `${imageUrl}&download=1`
      : `${imageUrl}?download=1`;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `ai-image-${id}.png`;
    link.click();
  }

  function handleOpenImage(gen: any) {
    setSelectedImage(gen);
    setEditedPrompt(gen.prompt);
  }

  function handleCloseModal() {
    setSelectedImage(null);
    setEditedPrompt('');
  }

  function handleCopyPrompt() {
    if (selectedImage) {
      navigator.clipboard.writeText(selectedImage.prompt);
    }
  }

  function handleRegenerate() {
    if (selectedImage && onRegenerate) {
      onRegenerate(editedPrompt, selectedImage.model);
      handleCloseModal();
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Generations</CardTitle>
            <Button onClick={handleReload} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No generations yet. Create your first image!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {history.map((gen) => (
                <div
                  key={gen.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                  onClick={() => handleOpenImage(gen)}
                >
                  <Image
                    src={gen.imageUrl}
                    alt={gen.prompt}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenImage(gen);
                      }}
                      size="sm"
                      variant="secondary"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(gen.imageUrl, gen.id);
                      }}
                      size="sm"
                      variant="secondary"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-xs text-white truncate">{gen.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generated Image</DialogTitle>
            <DialogDescription>
              Model: {selectedImage?.model} • {selectedImage?.width}x{selectedImage?.height}
            </DialogDescription>
          </DialogHeader>

          {selectedImage && (
            <div className="space-y-4">
              {/* Image */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
                <Image
                  src={selectedImage.imageUrl}
                  alt={selectedImage.prompt}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Original Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Original Prompt</label>
                  <Button
                    onClick={handleCopyPrompt}
                    variant="ghost"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {selectedImage.prompt}
                </p>
              </div>

              {/* Edit Prompt */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Edit Prompt & Regenerate
                </label>
                <Textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  placeholder="Edit the prompt..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => handleDownload(selectedImage.imageUrl, selectedImage.id)}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={handleRegenerate}
                  disabled={!editedPrompt.trim()}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
