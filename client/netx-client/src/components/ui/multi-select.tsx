"use client";

import * as React from "react";
import { X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type OptionType = {
  id: string;
  name: string;
};

interface MultiSelectProps {
  options: OptionType[];
  selected: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Выберите элементы...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Получаем выбранные элементы по их ID
  const selectedOptions = options.filter((option) => selected.includes(option.id));

  // Обработчик выбора элемента
  const handleSelect = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  // Удаление выбранного элемента
  const handleRemove = (id: string) => {
    onChange(selected.filter((item) => item !== id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex min-h-9 w-full flex-wrap items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-none ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <div className="flex flex-wrap gap-1">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <Badge
                  key={option.id}
                  variant="secondary"
                  className="mb-1 mr-1 flex items-center gap-1"
                >
                  {option.name}
                  <button
                    type="button"
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-1 focus:ring-ring focus:ring-offset-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(option.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => {
              const isSelected = selected.includes(option.id);
              return (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => handleSelect(option.id)}
                >
                  <div className={cn("mr-2", isSelected ? "opacity-100" : "opacity-0")}>
                    <Check className="h-4 w-4" />
                  </div>
                  {option.name}
                </CommandItem>
              );
            })}
            {options.length === 0 && (
              <CommandItem disabled className="text-muted-foreground">
                Нет доступных элементов
              </CommandItem>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}