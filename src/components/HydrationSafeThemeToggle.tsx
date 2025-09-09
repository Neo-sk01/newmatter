'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useHydration } from '@/hooks/useHydration';

/**
 * Props interface for the HydrationSafeThemeToggle component
 */
export interface ThemeToggleProps {
  /** Optional CSS class name for styling */
  className?: string;
}

/**
 * A hydration-safe theme toggle component that prevents hydration mismatch errors
 * 
 * This component uses a two-phase rendering approach:
 * 1. Server/Initial Render: Shows a neutral state (Sun icon) that's safe for SSR
 * 2. Post-Hydration: Updates to show the actual theme state after hydration completes
 * 
 * The component handles theme switching functionality and maintains consistent
 * dimensions during state transitions to prevent layout shifts.
 * 
 * @param props - Component props
 * @returns The theme toggle button
 */
export function HydrationSafeThemeToggle({ className }: ThemeToggleProps) {
  const { isHydrated } = useHydration();
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Only determine actual theme after hydration to prevent mismatch
  const currentTheme = isHydrated ? (resolvedTheme ?? theme) : undefined;
  const isDark = currentTheme === 'dark';

  // Handle theme switching with proper next-themes setTheme function
  const handleToggle = () => {
    if (isHydrated && setTheme) {
      // Use next-themes setTheme function to toggle between light and dark
      const newTheme = isDark ? 'light' : 'dark';
      setTheme(newTheme);
    }
  };

  // Determine tooltip content that updates based on current theme state
  const getTooltipContent = (): string => {
    if (!isHydrated) {
      return 'Toggle theme (loading...)';
    }
    return isDark ? 'Switch to light mode' : 'Switch to dark mode';
  };

  // Get appropriate ARIA label for current state
  const getAriaLabel = (): string => {
    if (!isHydrated) {
      return 'Toggle theme';
    }
    return isDark ? 'Switch to light mode' : 'Switch to dark mode';
  };

  // Get current theme description for screen readers
  const getCurrentThemeDescription = (): string => {
    if (!isHydrated) {
      return 'Theme is loading';
    }
    return `Current theme: ${isDark ? 'dark' : 'light'} mode`;
  };

  // Common button props to ensure consistent dimensions
  const buttonProps = {
    variant: "outline" as const,
    size: "icon" as const,
    className: `rounded-xl w-10 h-10 ${className || ''}`, // Fixed dimensions to prevent layout shifts
    onClick: handleToggle,
    'aria-label': getAriaLabel(),
    'aria-describedby': 'theme-toggle-description',
    role: 'switch',
    'aria-checked': isHydrated ? isDark : false,
    tabIndex: 0,
  };

  // Render neutral state during SSR/pre-hydration
  if (!isHydrated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button {...buttonProps}>
            <Sun className="h-5 w-5" aria-hidden="true" />
            <span id="theme-toggle-description" className="sr-only">
              {getCurrentThemeDescription()}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    );
  }

  // Render actual state after hydration
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...buttonProps}>
          {isDark ? (
            <Sun className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Moon className="h-5 w-5" aria-hidden="true" />
          )}
          <span id="theme-toggle-description" className="sr-only">
            {getCurrentThemeDescription()}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        {getTooltipContent()}
      </TooltipContent>
    </Tooltip>
  );
}

export default HydrationSafeThemeToggle;