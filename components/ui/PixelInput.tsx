"use client";

import React, { useRef, useState } from "react";

interface PixelInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}

export function PixelInput({
  label = "ADD PLAYER",
  value,
  onChange,
  onSubmit,
  placeholder,
  maxLength = 20,
  disabled = false,
  autoFocus = false,
  inputMode,
}: PixelInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim() && onSubmit) {
      onSubmit(value.trim());
    }
  };

  return (
    <div
      className="flex items-center gap-2 px-4 py-3 bg-surface border border-dashed border-border cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <span className="font-heading text-green text-xs shrink-0 select-none">
        &gt; {label}:
      </span>
      <div className="relative flex-1 min-w-0">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={maxLength}
          disabled={disabled}
          autoFocus={autoFocus}
          inputMode={inputMode}
          placeholder={focused ? undefined : placeholder}
          className={[
            "w-full bg-transparent text-text font-heading text-sm outline-none",
            "placeholder:text-muted",
          ].join(" ")}
          aria-label={label}
        />
        {focused && !value && (
          <span
            className="absolute left-0 top-0 font-heading text-sm text-green animate-pulse"
            aria-hidden
          >
            █
          </span>
        )}
      </div>
    </div>
  );
}
