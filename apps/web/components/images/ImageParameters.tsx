'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ImageParametersProps {
  value: {
    width: number;
    height: number;
    steps: number;
  };
  onChange: (value: any) => void;
}

export function ImageParameters({ value, onChange }: ImageParametersProps) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="parameters">
        <AccordionTrigger className="text-sm font-medium">
          Advanced Parameters
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          {/* Resolution */}
          <div className="space-y-2">
            <Label className="text-sm">Resolution</Label>
            <Select
              value={`${value.width}x${value.height}`}
              onValueChange={(val) => {
                const [w, h] = val.split('x').map(Number);
                onChange({ ...value, width: w, height: h });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="512x512">512 × 512</SelectItem>
                <SelectItem value="768x768">768 × 768</SelectItem>
                <SelectItem value="1024x1024">1024 × 1024 (Recommended)</SelectItem>
                <SelectItem value="1536x1536">1536 × 1536</SelectItem>
                <SelectItem value="2048x2048">2048 × 2048</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inference Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Inference Steps</Label>
              <span className="text-sm text-muted-foreground">{value.steps}</span>
            </div>
            <Slider
              value={[value.steps]}
              onValueChange={([steps]) => onChange({ ...value, steps })}
              min={10}
              max={50}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              More steps = better quality but slower generation
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
