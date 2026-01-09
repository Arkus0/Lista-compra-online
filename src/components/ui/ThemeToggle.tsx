'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  // Ahora TypeScript sabrá seguro que setTheme existe
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary active:bg-secondary transition-colors select-none cursor-pointer"
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
