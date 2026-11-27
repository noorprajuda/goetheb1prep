"use client";
import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "circular";
  position?: "top-right" | "inline";
  onCopy?: () => void;
}

export default function CopyButton({
  text,
  className = "",
  size = "md",
  variant = "default",
  position = "top-right",
  onCopy
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-10 h-10"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-4 h-4"
  };

  const baseClasses = variant === "circular" 
    ? `rounded-full flex items-center justify-center transition-colors ${sizeClasses[size]}`
    : `flex items-center justify-center transition-colors ${sizeClasses[size]}`;

  const button = (
    <button
      onClick={handleCopy}
      className={`${baseClasses} ${className}`}
      title="Copy text"
    >
      {copied ? (
        <Check className={`${iconSizes[size]} text-white`} />
      ) : (
        <Copy className={`${iconSizes[size]} text-white`} />
      )}
    </button>
  );

  if (position === "top-right") {
    return (
      <div className="absolute top-2 right-2 group">
        {button}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Copy text
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
        </div>
      </div>
    );
  }

  return button;
}
