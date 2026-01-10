import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook para debounce de valores
 * Retorna el valor debounceado después del delay especificado
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para debounce de callbacks
 * Retorna una función estable que ejecuta el callback después del delay
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Mantener callback actualizado sin recrear la función retornada
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay)
    },
    [delay]
  )
}

/**
 * Hook que combina debounce con estado de "typing"
 * Útil para mostrar indicadores de carga durante la escritura
 */
export function useDebouncedSearch<T>(
  value: T,
  delay: number = 200
): { debouncedValue: T; isDebouncing: boolean } {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const [isDebouncing, setIsDebouncing] = useState(false)

  useEffect(() => {
    if (value !== debouncedValue) {
      setIsDebouncing(true)
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value)
      setIsDebouncing(false)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay, debouncedValue])

  return { debouncedValue, isDebouncing }
}
