"use client";

import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-orange text-bg font-heading font-bold tracking-wide " +
    "hover:brightness-110 active:brightness-90 " +
    "disabled:opacity-40 disabled:cursor-not-allowed",
  secondary:
    "bg-transparent text-orange font-heading font-bold tracking-wide " +
    "border border-dashed border-orange " +
    "hover:bg-orange/10 active:bg-orange/20 " +
    "disabled:opacity-40 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-muted font-heading tracking-wide " +
    "hover:text-text active:text-text/80 " +
    "disabled:opacity-40 disabled:cursor-not-allowed",
  danger:
    "bg-transparent text-pink font-heading font-bold tracking-wide " +
    "border border-dashed border-pink " +
    "hover:bg-pink/10 active:bg-pink/20 " +
    "disabled:opacity-40 disabled:cursor-not-allowed",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-2 text-xs min-h-[36px]",
  md: "px-4 py-3 text-sm min-h-[44px]",
  lg: "px-6 py-4 text-base min-h-[52px]",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        "inline-flex items-center justify-center gap-2",
        "transition-all duration-150",
        "select-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
