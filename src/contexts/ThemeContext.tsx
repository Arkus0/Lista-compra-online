'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// Exportamos los tipos para que puedan usarse fuera si es necesario
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

// Inicializamos con undefined pero especificando el tipo genérico
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Cargar tema guardado al montar
  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme);
      }
    } catch (e) {
      // Ignorar error si localStorage no está disponible
    }
  }, []);

  // Aplicar tema cuando cambia
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    const getSystemTheme = (): 'light' | 'dark' => {
      if (typeof window === 'undefined') return 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    let appliedTheme: 'light' | 'dark';
    if (theme === 'system') {
      appliedTheme = getSystemTheme();
    } else {
      appliedTheme = theme;
    }

    // CORRECCIÓN IMPORTANTE: Limpiamos ambas clases y forzamos la correcta
    // Esto es crucial para que el móvil no fuerce el modo oscuro del sistema
    root.classList.remove('light', 'dark');
    root.classList.add(appliedTheme);

    setResolvedTheme(appliedTheme);

    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.error('Error saving theme to localStorage:', e);
    }

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const newSystemTheme = getSystemTheme();
        root.classList.remove('light', 'dark');
        root.classList.add(newSystemTheme);
        setResolvedTheme(newSystemTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Forzamos el tipo de retorno para evitar inferencias incorrectas como '{} | null'
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
