'use client';

import type { ProductOption, ProductVariant } from '@/types';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VariantSelectorProps {
  options: ProductOption[];
  selectedOptions: Record<string, string>;
  onSelectOption: (optionName: string, value: string) => void;
  isOptionAvailable: (optionName: string, value: string) => boolean;
  isOptionSelected: (optionName: string, value: string) => boolean;
}

// Color swatches - add more as needed
const COLOR_MAP: Record<string, string> = {
  black: '#000000',
  white: '#FFFFFF',
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#EAB308',
  purple: '#A855F7',
  pink: '#EC4899',
  orange: '#F97316',
  gray: '#6B7280',
  grey: '#6B7280',
  brown: '#92400E',
  navy: '#1E3A5F',
  beige: '#D4C4A8',
  cream: '#FFFDD0',
  gold: '#FFD700',
  silver: '#C0C0C0',
};

function getColorHex(colorName: string): string | null {
  return COLOR_MAP[colorName.toLowerCase()] || null;
}

export function VariantSelector({
  options,
  selectedOptions,
  onSelectOption,
  isOptionAvailable,
  isOptionSelected,
}: VariantSelectorProps) {
  return (
    <div className="space-y-6">
      {options.map((option) => {
        const isColorOption = option.name.toLowerCase() === 'color';
        const isSizeOption = option.name.toLowerCase() === 'size';

        return (
          <div key={option.id} className="space-y-3">
            <Label className="text-sm font-medium">
              {option.name}
              {selectedOptions[option.name] && (
                <span className="ml-2 font-normal text-muted-foreground">
                  {selectedOptions[option.name]}
                </span>
              )}
            </Label>

            {/* Color Swatches */}
            {isColorOption ? (
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const colorHex = getColorHex(value);
                  const available = isOptionAvailable(option.name, value);
                  const selected = isOptionSelected(option.name, value);

                  return (
                    <button
                      key={value}
                      onClick={() => onSelectOption(option.name, value)}
                      disabled={!available}
                      title={value}
                      className={cn(
                        'relative h-10 w-10 rounded-full border-2 transition-all',
                        selected
                          ? 'border-primary ring-2 ring-primary ring-offset-2'
                          : 'border-gray-300 hover:border-gray-400',
                        !available && 'opacity-40 cursor-not-allowed'
                      )}
                      style={{
                        backgroundColor: colorHex || '#E5E7EB',
                      }}
                    >
                      {!available && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="block w-full h-0.5 bg-gray-400 rotate-45" />
                        </span>
                      )}
                      {!colorHex && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                          {value.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : isSizeOption ? (
              /* Size Buttons */
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const available = isOptionAvailable(option.name, value);
                  const selected = isOptionSelected(option.name, value);

                  return (
                    <button
                      key={value}
                      onClick={() => onSelectOption(option.name, value)}
                      disabled={!available}
                      className={cn(
                        'min-w-[3rem] px-3 py-2 text-sm font-medium border rounded-md transition-colors',
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-gray-300 hover:border-gray-400',
                        !available && 'opacity-40 cursor-not-allowed line-through'
                      )}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Dropdown for other options */
              <Select
                value={selectedOptions[option.name] || ''}
                onValueChange={(value) => onSelectOption(option.name, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Select ${option.name}`} />
                </SelectTrigger>
                <SelectContent>
                  {option.values.map((value) => {
                    const available = isOptionAvailable(option.name, value);

                    return (
                      <SelectItem
                        key={value}
                        value={value}
                        disabled={!available}
                        className={cn(!available && 'opacity-50')}
                      >
                        {value}
                        {!available && ' (Unavailable)'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
        );
      })}
    </div>
  );
}
