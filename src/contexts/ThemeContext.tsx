'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// ... (resto de tipos e interfaces igual)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // ... (estados igual)

  // ... (primer useEffect igual)

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

    // --- CORRECCIÓN AQUÍ ---
    // Limpiamos ambas clases y añadimos la que corresponda explícitamente
    root.classList.remove('light', 'dark');
    root.classList.add(appliedTheme);
    // -----------------------

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
        // También actualizamos aquí
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

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
