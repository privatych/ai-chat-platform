# Image Generation Feature - Implementation Design

## Overview

**Goal:** Add AI image generation/editing functionality using top models via OpenRouter API.

**Target:** Two-tier system (FREE + PREMIUM) with daily generation limits and multiple model options.

**Business Model:**
- FREE: 10 generations/day, basic models, cost $1.20/month per user
- PREMIUM: 30 generations/day, 15-20 top models, 1990 RUB/month ($22), profit margin 18%

**Tech Stack:** OpenRouter API, Next.js 15, Drizzle ORM, local file storage via Nginx

---

## Economic Analysis

### Model Costs (1024×1024 images)

**FREE tier models:**
- FLUX.2 Klein: $0.014/image
- FLUX.1 Schnell: $0.003/image
- Stable Diffusion XL Turbo: $0.002-0.004/image
- Playground v2.5: $0.003-0.005/image
- Average: **$0.004/image**

**PREMIUM tier models:**
- FLUX.2 Pro: $0.03/image
- FLUX.2 Max: $0.07/image
- FLUX.1 Dev: $0.014/image
- SD 3.5 Large: $0.008-0.012/image
- Average: **$0.020/image**

### User Economics

| Tier | Generations/day | Cost/month | Revenue | Profit | Margin |
|------|-----------------|------------|---------|--------|--------|
| FREE | 10 | $1.20 | $0 | -$1.20 | N/A |
| PREMIUM | 30 | $18.00 | $22.00 | $4.00 | 18% |

**Break-even point:** 27 generations/day at 1990 RUB/month

---

## Architecture

### Directory Structure

```
apps/web/
  ├── app/
  │   └── images/
  │       ├── page.tsx              # Main generation interface
  │       └── gallery/
  │           └── page.tsx          # User gallery
  ├── components/
  │   └── images/
  │       ├── ImageGenerator.tsx    # Generation form
  │       ├── ModelSelector.tsx     # Model picker
  │       ├── ImagePreview.tsx      # Result display
  │       ├── ImageParameters.tsx   # Advanced settings (Premium)
  │       └── GenerationHistory.tsx # Recent generations

services/api/
  └── src/
      ├── routes/
      │   └── images/
      │       ├── index.ts          # Route registration
      │       ├── generate.ts       # POST /api/images/generate
      │       ├── history.ts        # GET /api/images/history
      │       └── stats.ts          # GET /api/images/stats (admin)
      ├── services/
      │   ├── openrouter-image.ts   # OpenRouter API client
      │   └── image-storage.ts      # File storage logic
      └── middleware/
          └── image-limit.ts        # Rate limiting

packages/database/
  └── src/schema/
      └── image-generations.ts      # New table schema

packages/shared/
  └── src/constants/
      └── image-models.ts           # Model configurations
```

### Database Schema

**Table: `image_generations`**

```typescript
{
  id: uuid (primary key)
  userId: uuid (foreign key → users.id, cascade delete)
  model: varchar(100)          // e.g., "flux-2-pro"
  prompt: text
  negativePrompt: text?
  width: integer
  height: integer
  imageUrl: text               // Public URL via Nginx
  cost: decimal(10, 6)         // USD cost
  createdAt: timestamp
}
```

**Indexes:**
- `(userId, createdAt)` - for user history queries
- `(createdAt)` - for admin stats

---

## Model Configuration

### FREE Tier (4 models)

```typescript
[
  {
    id: 'flux-2-klein',
    name: 'FLUX.2 Klein',
    provider: 'Black Forest Labs',
    cost: 0.014,
    speed: 'fast',
    category: 'general',
    description: 'Быстрая генерация, хорошее качество',
  },
  {
    id: 'flux-1-schnell',
    name: 'FLUX.1 Schnell',
    provider: 'Black Forest Labs',
    cost: 0.003,
    speed: 'ultra-fast',
    category: 'general',
    description: 'Сверхбыстрая генерация',
  },
  {
    id: 'sdxl-turbo',
    name: 'Stable Diffusion XL Turbo',
    provider: 'Stability AI',
    cost: 0.004,
    speed: 'fast',
    category: 'general',
    description: 'Универсальная модель',
  },
  {
    id: 'playground-v2.5',
    name: 'Playground v2.5',
    provider: 'Playground AI',
    cost: 0.004,
    speed: 'medium',
    category: 'artistic',
    description: 'Креативные и художественные стили',
  },
]
```

### PREMIUM Tier (16 models total)

**Flagship (4):**
- FLUX.2 Pro ($0.03) - Best quality
- FLUX.2 Max ($0.07) - Professional grade
- FLUX.1 Dev ($0.014) - High quality, fast
- SD 3.5 Large Turbo ($0.012) - Advanced

**Photorealistic (3):**
- RealVisXL v4.0 ($0.005) - Photorealistic images
- DreamShaper XL ($0.006) - Realistic portraits
- Juggernaut XL ($0.006) - Cinema-quality

**Anime/Illustration (3):**
- Anything v5 ($0.004) - Anime style
- NovelAI Diffusion ($0.008) - High-quality anime
- Pastel Mix ($0.004) - Soft anime art

**Artistic (3):**
- Stable Diffusion XL ($0.008) - Universal advanced
- Playground v2.5 ($0.004) - Creative styles
- OpenJourney v4 ($0.005) - Midjourney-style

**Specialized (3):**
- ArchitectureXL ($0.006) - Architecture/product design
- Food Photography ($0.005) - Food imagery
- Landscape XL ($0.005) - Nature scenes

### Tier Limits

```typescript
{
  free: {
    dailyLimit: 10,
    maxResolution: 1024,
    allowedModels: ['flux-2-klein', 'flux-1-schnell', 'sdxl-turbo', 'playground-v2.5'],
    features: ['text-to-image'],
  },
  premium: {
    dailyLimit: 30,
    maxResolution: 2048,
    allowedModels: [...all 20 models],
    features: ['text-to-image', 'img2img', 'inpainting'],
  },
}
```

---

## API Implementation

### OpenRouter Client

**services/api/src/services/openrouter-image.ts:**

```typescript
import axios from 'axios';

const OPENROUTER_API = 'https://openrouter.ai/api/v1';
const API_KEY = process.env.OPENROUTER_API_KEY;

interface GenerateImageRequest {
  model: string;
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  steps?: number;
}

interface GenerateImageResponse {
  imageUrl: string;
  cost: number;
}

export async function generateImage(
  req: GenerateImageRequest
): Promise<GenerateImageResponse> {
  try {
    const response = await axios.post(
      `${OPENROUTER_API}/images/generations`,
      {
        model: req.model,
        prompt: req.prompt,
        negative_prompt: req.negativePrompt,
        width: req.width,
        height: req.height,
        num_inference_steps: req.steps || 20,
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': 'https://ai.itoq.ru',
          'X-Title': 'AI Chat Platform',
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 seconds
      }
    );

    const imageUrl = response.data.data[0].url;
    const cost = calculateCost(req.model, req.width, req.height);

    return { imageUrl, cost };
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    if (error.response?.status === 402) {
      throw new Error('INSUFFICIENT_CREDITS');
    }
    throw new Error('GENERATION_FAILED');
  }
}

function calculateCost(model: string, width: number, height: number): number {
  const megapixels = (width * height) / 1_000_000;
  const modelCosts = {
    'flux-2-pro': 0.03,
    'flux-2-max': 0.07,
    'flux-2-klein': 0.014,
    'flux-1-dev': 0.014,
    'flux-1-schnell': 0.003,
    'sdxl-turbo': 0.004,
    // ...etc
  };

  return (modelCosts[model] || 0.01) * megapixels;
}
```

### Rate Limiting

**services/api/src/middleware/image-limit.ts:**

```typescript
import { db } from '@ai-chat/database';
import { imageGenerations } from '@ai-chat/database/schema';
import { eq, gte, and, sql } from 'drizzle-orm';

export async function checkImageLimit(
  userId: string,
  tier: 'free' | 'premium'
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(imageGenerations)
    .where(
      and(
        eq(imageGenerations.userId, userId),
        gte(imageGenerations.createdAt, today)
      )
    );

  const usedToday = Number(result[0]?.count || 0);
  const limit = tier === 'premium' ? 30 : 10;

  if (usedToday >= limit) {
    throw new Error('DAILY_LIMIT_REACHED');
  }
}

export async function getUsageToday(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(imageGenerations)
    .where(
      and(
        eq(imageGenerations.userId, userId),
        gte(imageGenerations.createdAt, today)
      )
    );

  return Number(result[0]?.count || 0);
}
```

### Generate Endpoint

**services/api/src/routes/images/generate.ts:**

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { generateImage } from '../../services/openrouter-image';
import { saveImage } from '../../services/image-storage';
import { checkImageLimit } from '../../middleware/image-limit';
import { db } from '@ai-chat/database';
import { imageGenerations } from '@ai-chat/database/schema';
import { IMAGE_LIMITS } from '@ai-chat/shared';
import { v4 as uuidv4 } from 'uuid';

interface GenerateRequest {
  model: string;
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
}

export async function generateHandler(
  request: FastifyRequest<{ Body: GenerateRequest }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;
    const tier = request.user.subscriptionTier as 'free' | 'premium';
    const { model, prompt, negativePrompt, width = 1024, height = 1024 } = request.body;

    // Validation
    if (!prompt || prompt.trim().length === 0) {
      return reply.code(400).send({ error: 'Prompt is required' });
    }

    if (prompt.length > 1000) {
      return reply.code(400).send({ error: 'Prompt too long (max 1000 characters)' });
    }

    // Check tier limits
    const limits = IMAGE_LIMITS[tier];

    if (!limits.allowedModels.includes(model)) {
      return reply.code(403).send({ error: 'Model not available for your tier' });
    }

    if (width > limits.maxResolution || height > limits.maxResolution) {
      return reply.code(403).send({
        error: `Resolution exceeds limit (${limits.maxResolution}x${limits.maxResolution})`
      });
    }

    // Check daily limit
    await checkImageLimit(userId, tier);

    // Generate image
    const generationId = uuidv4();
    const result = await generateImage({
      model,
      prompt,
      negativePrompt,
      width,
      height,
    });

    // Save image to local storage
    const imageUrl = await saveImage(result.imageUrl, userId, generationId);

    // Save to database
    await db.insert(imageGenerations).values({
      id: generationId,
      userId,
      model,
      prompt,
      negativePrompt: negativePrompt || null,
      width,
      height,
      imageUrl,
      cost: result.cost,
    });

    return reply.send({
      success: true,
      data: {
        id: generationId,
        imageUrl: `https://ai.itoq.ru${imageUrl}`,
        cost: result.cost,
      },
    });

  } catch (error: any) {
    console.error('Image generation error:', error);

    if (error.message === 'DAILY_LIMIT_REACHED') {
      return reply.code(429).send({
        error: 'Daily generation limit reached. Upgrade to Premium or wait until tomorrow.'
      });
    }

    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      return reply.code(429).send({
        error: 'OpenRouter rate limit exceeded. Please try again in a minute.'
      });
    }

    return reply.code(500).send({ error: 'Image generation failed' });
  }
}
```

### Image Storage

**services/api/src/services/image-storage.ts:**

```typescript
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/www/ai-chat-platform/uploads/images';

export async function saveImage(
  tempUrl: string,
  userId: string,
  imageId: string
): Promise<string> {
  try {
    // Create user directory if it doesn't exist
    const userDir = path.join(UPLOAD_DIR, userId);
    await fs.mkdir(userDir, { recursive: true });

    // Download image from OpenRouter temporary URL
    const response = await axios.get(tempUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    // Save to disk
    const filename = `${imageId}.png`;
    const filepath = path.join(userDir, filename);
    await fs.writeFile(filepath, response.data);

    // Return public URL path (served by Nginx)
    return `/uploads/images/${userId}/${filename}`;
  } catch (error) {
    console.error('Failed to save image:', error);
    throw new Error('IMAGE_STORAGE_FAILED');
  }
}

export async function deleteImage(userId: string, imageId: string): Promise<void> {
  const filepath = path.join(UPLOAD_DIR, userId, `${imageId}.png`);
  await fs.unlink(filepath).catch(() => {
    // Ignore if file doesn't exist
  });
}
```

### History Endpoint

**services/api/src/routes/images/history.ts:**

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '@ai-chat/database';
import { imageGenerations } from '@ai-chat/database/schema';
import { eq, desc } from 'drizzle-orm';

export async function historyHandler(
  request: FastifyRequest<{ Querystring: { limit?: string; offset?: string } }>,
  reply: FastifyReply
) {
  const userId = request.user.id;
  const limit = parseInt(request.query.limit || '20', 10);
  const offset = parseInt(request.query.offset || '0', 10);

  const generations = await db
    .select()
    .from(imageGenerations)
    .where(eq(imageGenerations.userId, userId))
    .orderBy(desc(imageGenerations.createdAt))
    .limit(limit)
    .offset(offset);

  return reply.send({
    success: true,
    data: generations.map(g => ({
      ...g,
      imageUrl: `https://ai.itoq.ru${g.imageUrl}`,
    })),
  });
}
```

### Route Registration

**services/api/src/routes/images/index.ts:**

```typescript
import { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/jwt';
import { generateHandler } from './generate';
import { historyHandler } from './history';

export async function imageRoutes(app: FastifyInstance) {
  // All image routes require authentication
  app.addHook('preHandler', authenticate);

  // Generate new image
  app.post('/generate', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, generateHandler);

  // Get user generation history
  app.get('/history', historyHandler);
}
```

Register in main API:

```typescript
// services/api/src/index.ts
import { imageRoutes } from './routes/images';

app.register(imageRoutes, { prefix: '/api/images' });
```

---

## Frontend Implementation

### Main Generation Page

**apps/web/app/images/page.tsx:**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { ImageGenerator } from '@/components/images/ImageGenerator';
import { ImagePreview } from '@/components/images/ImagePreview';
import { GenerationHistory } from '@/components/images/GenerationHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown } from 'lucide-react';
import Link from 'next/link';

export default function ImagesPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const [usageToday, setUsageToday] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const tier = user?.subscriptionTier || 'free';
  const limit = tier === 'premium' ? 30 : 10;

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      loadUsageStats();
    }
  }, [hasHydrated, isAuthenticated]);

  async function loadUsageStats() {
    const response = await apiClient.request('/api/images/history?limit=100');
    if (response.success) {
      const today = new Date().setHours(0, 0, 0, 0);
      const todayGenerations = response.data.filter(
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
      }
    } catch (error: any) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!hasHydrated) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl mx-auto py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">AI Image Generation</h1>
        <p className="text-muted-foreground mb-6">
          Sign in to start generating images with AI
        </p>
        <Link href="/login">
          <button className="btn-primary">Sign In</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Image Generation</h1>
        <p className="text-muted-foreground">
          Create stunning images with cutting-edge AI models
        </p>
      </div>

      {/* Usage Stats */}
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
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg">
                  <Crown className="h-4 w-4" />
                  Upgrade to Premium
                </button>
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
        />

        {/* Right: Preview */}
        <ImagePreview generation={currentGeneration} loading={loading} />
      </div>

      {/* History */}
      <GenerationHistory onReload={loadUsageStats} />
    </div>
  );
}
```

### Image Generator Component

**apps/web/components/images/ImageGenerator.tsx:**

```tsx
'use client';

import { useState } from 'react';
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
}

export function ImageGenerator({
  tier,
  usageToday,
  limit,
  loading,
  onGenerate,
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('flux-1-schnell');
  const [parameters, setParameters] = useState({
    width: 1024,
    height: 1024,
    steps: 20,
  });

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
```

### Model Selector

**apps/web/components/images/ModelSelector.tsx:**

```tsx
'use client';

import { IMAGE_MODELS } from '@ai-chat/shared/constants/image-models';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ModelSelectorProps {
  tier: 'free' | 'premium';
  value: string;
  onChange: (value: string) => void;
}

export function ModelSelector({ tier, value, onChange }: ModelSelectorProps) {
  const freeModels = IMAGE_MODELS.free;
  const premiumModels = tier === 'premium' ? IMAGE_MODELS.premium : [];

  const groupedModels = {
    free: freeModels,
    flagship: premiumModels.filter(m => m.category === 'flagship'),
    photorealistic: premiumModels.filter(m => m.category === 'photorealistic'),
    anime: premiumModels.filter(m => m.category === 'anime'),
    artistic: premiumModels.filter(m => m.category === 'artistic'),
  };

  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">
        Model
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Free Models</SelectLabel>
            {groupedModels.free.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2">
                  <span>{model.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {model.speed}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>

          {tier === 'premium' && (
            <>
              <SelectGroup>
                <SelectLabel>Flagship</SelectLabel>
                {groupedModels.flagship.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span>{model.name}</span>
                      {model.badge && (
                        <Badge variant="default" className="text-xs">
                          {model.badge}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>

              <SelectGroup>
                <SelectLabel>Photorealistic</SelectLabel>
                {groupedModels.photorealistic.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectGroup>

              <SelectGroup>
                <SelectLabel>Anime/Illustration</SelectLabel>
                {groupedModels.anime.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectGroup>

              <SelectGroup>
                <SelectLabel>Artistic</SelectLabel>
                {groupedModels.artistic.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">
        {IMAGE_MODELS.free.find(m => m.id === value)?.description ||
         IMAGE_MODELS.premium?.find(m => m.id === value)?.description}
      </p>
    </div>
  );
}
```

---

## Environment Configuration

### API Service

Add to **services/api/.env:**

```bash
OPENROUTER_API_KEY=your_openrouter_api_key
UPLOAD_DIR=/var/www/ai-chat-platform/uploads/images
```

### Nginx Configuration

Add to Nginx config:

```nginx
location /uploads/images/ {
    alias /var/www/ai-chat-platform/uploads/images/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## Testing Strategy

### Unit Tests

1. **Rate limiting logic** (`image-limit.ts`)
   - Test daily limit enforcement
   - Test count calculations
   - Test timezone handling

2. **Cost calculation** (`openrouter-image.ts`)
   - Test cost per model
   - Test megapixel calculations

### Integration Tests

1. **OpenRouter API mocking**
   - Mock successful generation
   - Mock rate limit errors
   - Mock timeout scenarios

2. **Image storage**
   - Test file creation
   - Test directory creation
   - Test error handling

### E2E Tests

1. **Complete generation flow**
   - Login → Generate → View result
   - Test limit enforcement
   - Test tier restrictions

2. **Error scenarios**
   - Invalid prompt
   - Exceeded limit
   - Network failure

### Manual Testing Checklist

- [ ] Free user can generate 10 images/day
- [ ] Premium user can generate 30 images/day
- [ ] Free user cannot access premium models
- [ ] Resolution limits enforced
- [ ] Images display correctly
- [ ] History loads properly
- [ ] Error messages are user-friendly
- [ ] Cost tracking is accurate

---

## Deployment Steps

1. **Database migration**
   ```bash
   cd packages/database
   pnpm db:push
   ```

2. **Create upload directory**
   ```bash
   ssh root@146.103.97.73
   mkdir -p /var/www/ai-chat-platform/uploads/images
   chown -R www-data:www-data /var/www/ai-chat-platform/uploads
   chmod 755 /var/www/ai-chat-platform/uploads
   ```

3. **Update Nginx config**
   - Add `/uploads/images/` location block
   - Reload Nginx: `nginx -s reload`

4. **Set environment variables**
   - Add `OPENROUTER_API_KEY` to API service
   - Add `UPLOAD_DIR` path

5. **Deploy code**
   ```bash
   git push origin feature/image-generation
   # On server
   cd /var/www/ai-chat-platform
   git pull
   pnpm install
   pnpm build
   pm2 restart all
   ```

6. **Verify deployment**
   - Test free tier generation
   - Test premium tier generation
   - Check file storage
   - Verify limits enforcement

---

## Monitoring & Analytics

### Cost Tracking

Create admin endpoint: **GET /api/images/stats**

```typescript
// Return daily/monthly costs
{
  totalGenerations: 1250,
  totalCost: 25.50,
  averageCostPerGeneration: 0.0204,
  costByModel: {
    'flux-2-pro': 12.50,
    'flux-1-schnell': 5.00,
    // ...
  },
  generationsByTier: {
    free: 800,
    premium: 450,
  }
}
```

### Alerts

Set up alerts for:
- Daily cost exceeds $100
- OpenRouter API errors > 5%
- Storage disk usage > 80%
- Individual user exceeds expected usage

---

## Future Enhancements

1. **Img2img feature** (Premium)
   - Upload reference image
   - Modify existing images

2. **Inpainting** (Premium)
   - Mask regions to regenerate
   - Fix specific parts of images

3. **Image upscaling**
   - Enhance resolution
   - Improve quality

4. **Batch generation**
   - Generate multiple variations
   - A/B testing prompts

5. **Prompt templates**
   - Pre-built prompts for common use cases
   - Community-shared prompts

6. **Private gallery**
   - Organize generations into folders
   - Share with others

---

## Success Metrics

**Technical:**
- < 30s average generation time
- < 1% API error rate
- 99% uptime

**Business:**
- 20% free → premium conversion rate
- Average 15 generations/day per premium user
- 18%+ profit margin maintained

**User Experience:**
- 4.5+ star rating
- < 5% support tickets related to images
- 70%+ user satisfaction

---

## References

- [OpenRouter Image Generation Docs](https://openrouter.ai/docs/guides/overview/multimodal/image-generation)
- [FLUX.2 Models](https://openrouter.ai/black-forest-labs)
- [Stable Diffusion Models](https://stability.ai/stable-image)

---

**Design Complete:** 2026-02-24
**Ready for Implementation:** Yes
