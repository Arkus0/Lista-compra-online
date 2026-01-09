'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'system') {
      // Si está en modo sistema, cambiar al opuesto del actual
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      // Si está en modo manual, alternar
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary active:bg-secondary transition-colors touch-none select-none"
      aria-label="Cambiar tema"
      type="button"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-5 h-5 text-foreground pointer-events-none" />
      ) : (
        <Moon className="w-5 h-5 text-foreground pointer-events-none" />
      )}
    </button>
  );
}
