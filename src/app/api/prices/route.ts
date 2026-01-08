import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const products = searchParams.get('products')?.split(',') || []
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius') || '5' // km

  if (products.length === 0) {
    return NextResponse.json({ error: 'No products specified' }, { status: 400 })
  }

  const supabase = await createClient()

  // Obtener supermercados cercanos (si hay coordenadas)
  let supermarketIds: string[] = []

  if (lat && lng) {
    // En el futuro, usar PostGIS para búsqueda geográfica real
    // Por ahora, obtenemos todos los supermercados
    const { data: supermarkets } = await supabase
      .from('supermarkets')
      .select('id')

    supermarketIds = supermarkets?.map(s => s.id) || []
  }

  // Buscar precios para los productos
  const { data: prices, error } = await supabase
    .from('product_prices')
    .select(`
      *,
      supermarket:supermarkets(*)
    `)
    .in('product_name', products)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Agrupar precios por producto
  const pricesByProduct: Record<string, typeof prices> = {}
  for (const price of prices || []) {
    if (!pricesByProduct[price.product_name]) {
      pricesByProduct[price.product_name] = []
    }
    pricesByProduct[price.product_name].push(price)
  }

  // Calcular el mejor supermercado para comprar todo
  const supermarketTotals: Record<string, { total: number; name: string; products: number }> = {}

  for (const product of products) {
    const productPrices = pricesByProduct[product] || []
    for (const price of productPrices) {
      const supermarket = price.supermarket as { id: string; name: string }
      if (!supermarketTotals[supermarket.id]) {
        supermarketTotals[supermarket.id] = { total: 0, name: supermarket.name, products: 0 }
      }
      supermarketTotals[supermarket.id].total += price.price
      supermarketTotals[supermarket.id].products += 1
    }
  }

  // Ordenar supermercados por precio total
  const sortedSupermarkets = Object.entries(supermarketTotals)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => a.total - b.total)

  return NextResponse.json({
    products: pricesByProduct,
    recommendations: {
      bestSingleStore: sortedSupermarkets[0] || null,
      allStores: sortedSupermarkets,
    },
    meta: {
      productsRequested: products.length,
      productsFound: Object.keys(pricesByProduct).length,
      supermarketsCompared: sortedSupermarkets.length,
    },
  })
}

export async function POST(request: Request) {
  // Endpoint para añadir/actualizar precios (para futuro scraping o input manual)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { supermarket_id, product_name, price, unit } = body

  if (!supermarket_id || !product_name || price === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Upsert el precio
  const { data, error } = await supabase
    .from('product_prices')
    .upsert(
      {
        supermarket_id,
        product_name: product_name.toLowerCase().trim(),
        price,
        unit,
        last_updated: new Date().toISOString(),
      },
      {
        onConflict: 'supermarket_id,product_name',
      }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
