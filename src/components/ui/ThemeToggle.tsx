'use client';

import { useCallback } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Tooltip } from './Tooltip';

export default function ThemeToggle() {
  const { setTheme, resolvedTheme, theme } = useTheme();

  // Enable smooth theme transition
  const handleThemeChange = useCallback(() => {
    // Add transition class to HTML element
    document.documentElement.classList.add('theme-transition');

    // Change theme
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);

    // Remove transition class after animation
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 300);
  }, [resolvedTheme, setTheme]);

  const getTooltipText = () => {
    if (resolvedTheme === 'dark') {
      return 'Cambiar a modo claro';
    }
    return 'Cambiar a modo oscuro';
  };

  return (
    <Tooltip content={getTooltipText()} position="bottom">
      <button
        onClick={handleThemeChange}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary active:bg-secondary transition-all duration-200 select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group"
        aria-label={getTooltipText()}
        type="button"
      >
        <div className="relative w-5 h-5">
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-500 pointer-events-none animate-in spin-in-90 fade-in duration-300" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-500 pointer-events-none animate-in spin-in-90 fade-in duration-300" />
          )}
        </div>
      </button>
    </Tooltip>
  );
}
