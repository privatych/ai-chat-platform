'use client';

import { IMAGE_MODELS } from '@ai-chat/shared';
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

  const selectedModel = [...freeModels, ...premiumModels].find(m => m.id === value);

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
        {selectedModel?.description}
      </p>
    </div>
  );
}
