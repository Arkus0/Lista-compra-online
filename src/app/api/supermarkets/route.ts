import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const municipality = searchParams.get('municipality')
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = parseFloat(searchParams.get('radius') || '5')

  const supabase = await createClient()

  let query = supabase.from('supermarkets').select('*')

  if (municipality) {
    query = query.ilike('municipality', `%${municipality}%`)
  }

  const { data: supermarkets, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Si hay coordenadas, filtrar por distancia
  let filteredSupermarkets = supermarkets || []

  if (lat && lng) {
    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)

    filteredSupermarkets = supermarkets?.filter(s => {
      if (!s.latitude || !s.longitude) return false

      // Calcular distancia aproximada usando fórmula de Haversine simplificada
      const R = 6371 // Radio de la Tierra en km
      const dLat = (s.latitude - userLat) * Math.PI / 180
      const dLng = (s.longitude - userLng) * Math.PI / 180
      const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(userLat * Math.PI / 180) * Math.cos(s.latitude * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      const distance = R * c

      return distance <= radius
    }).map(s => ({
      ...s,
      distance: calculateDistance(userLat, userLng, s.latitude!, s.longitude!)
    })).sort((a, b) => a.distance - b.distance) || []
  }

  return NextResponse.json({
    supermarkets: filteredSupermarkets,
    count: filteredSupermarkets.length,
  })
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return Math.round(R * c * 100) / 100 // Redondear a 2 decimales
}
