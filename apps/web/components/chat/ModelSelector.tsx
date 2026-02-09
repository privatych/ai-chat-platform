'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: any[];
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  availableModels,
}: ModelSelectorProps) {
  const currentModel = availableModels.find(m => m.id === selectedModel);

  return (
    <Select value={selectedModel} onValueChange={onModelChange}>
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Выберите модель" />
      </SelectTrigger>
      <SelectContent>
        {availableModels.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex flex-col items-start">
              <span className="font-medium">{model.name}</span>
              <span className="text-xs text-muted-foreground">{model.provider}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
