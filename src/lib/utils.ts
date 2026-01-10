/**
 * Utilidades de rendimiento y helpers
 */

// Cache para normalización de texto (evita recalcular Unicode normalization)
const normalizeCache = new Map<string, string>()
const MAX_CACHE_SIZE = 500

/**
 * Normaliza texto para búsquedas: minúsculas, sin acentos
 * Usa cache para evitar recálculos costosos
 */
export function normalizeText(text: string): string {
  if (!text) return ''

  const cached = normalizeCache.get(text)
  if (cached !== undefined) return cached

  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  // Limitar tamaño del cache (FIFO simple)
  if (normalizeCache.size >= MAX_CACHE_SIZE) {
    const firstKey = normalizeCache.keys().next().value
    if (firstKey) normalizeCache.delete(firstKey)
  }

  normalizeCache.set(text, normalized)
  return normalized
}

/**
 * Compara dos textos normalizados (para búsquedas)
 */
export function normalizedIncludes(text: string, query: string): boolean {
  return normalizeText(text).includes(normalizeText(query))
}

/**
 * Compara si un texto normalizado empieza con un query
 */
export function normalizedStartsWith(text: string, query: string): boolean {
  return normalizeText(text).startsWith(normalizeText(query))
}
