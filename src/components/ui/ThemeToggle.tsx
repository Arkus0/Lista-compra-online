'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      // Al hacer clic, simplemente invertimos el tema visual actual
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      // IMPORTANTE: Eliminada la clase 'touch-none' que bloqueaba los toques en móvil
      // Se mantiene 'touch-manipulation' (por defecto en tus globals) para buena respuesta
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
