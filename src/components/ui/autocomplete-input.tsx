"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onSelect?: (value: string) => void;
}

export function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
  disabled,
  onSelect,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Показываем подсказки только если есть что показать и поле в фокусе
  const showSuggestions = isOpen && suggestions.length > 0;

  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // Закрываем при клике вне
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case "Enter":
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  }

  function handleSelect(suggestion: string) {
    onChange(suggestion);
    onSelect?.(suggestion);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />

      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                index === selectedIndex && "bg-accent text-accent-foreground",
              )}
              onMouseDown={(e) => {
                e.preventDefault(); // Предотвращаем потерю фокуса
                handleSelect(suggestion);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
