'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import Image from 'next/image';

interface GenerationHistoryProps {
  onReload?: () => void;
}

export function GenerationHistory({ onReload }: GenerationHistoryProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    const response = await apiClient.request('/api/images/history?limit=12');
    if (response.success) {
      setHistory(response.data);
    }
    setLoading(false);
  }

  function handleReload() {
    loadHistory();
    onReload?.();
  }

  function handleDownload(imageUrl: string, id: string) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-image-${id}.png`;
    link.click();
  }

  return (
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
              <div key={gen.id} className="group relative aspect-square rounded-lg overflow-hidden bg-muted">
                <Image
                  src={gen.imageUrl}
                  alt={gen.prompt}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    onClick={() => handleDownload(gen.imageUrl, gen.id)}
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
  );
}
