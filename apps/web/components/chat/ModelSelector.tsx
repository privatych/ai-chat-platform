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
  return (
    <Select value={selectedModel} onValueChange={onModelChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        {availableModels.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            {model.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
