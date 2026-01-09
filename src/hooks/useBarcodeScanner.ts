'use client'

import { useState, useCallback, useRef } from 'react'

interface ProductInfo {
  name: string
  brand?: string
  category?: string
  imageUrl?: string
}

interface UseBarcodeReturn {
  isScanning: boolean
  product: ProductInfo | null
  error: string | null
  startScanning: () => void
  stopScanning: () => void
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  isLoading: boolean
}

// Función para buscar producto en OpenFoodFacts
async function fetchProductFromOpenFoodFacts(barcode: string): Promise<ProductInfo | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data.status !== 1 || !data.product) {
      return null
    }

    const product = data.product

    // Mapear categoría de OpenFoodFacts a nuestras categorías
    let category = 'other'
    const categories = (product.categories_tags || []).join(' ').toLowerCase()

    if (categories.includes('beverages') || categories.includes('bebidas')) {
      category = 'beverages'
    } else if (categories.includes('dairy') || categories.includes('lacteos') || categories.includes('milk')) {
      category = 'dairy'
    } else if (categories.includes('meat') || categories.includes('carne') || categories.includes('fish') || categories.includes('pescado')) {
      category = 'meat-fish'
    } else if (categories.includes('frozen') || categories.includes('congelado')) {
      category = 'frozen'
    } else if (categories.includes('fruit') || categories.includes('vegetable') || categories.includes('fruta') || categories.includes('verdura')) {
      category = 'fruits-veg'
    } else if (categories.includes('snack') || categories.includes('cereal') || categories.includes('pasta') || categories.includes('rice')) {
      category = 'pantry'
    } else if (categories.includes('cleaning') || categories.includes('limpieza')) {
      category = 'household'
    } else if (categories.includes('hygiene') || categories.includes('beauty') || categories.includes('personal')) {
      category = 'hygiene'
    } else if (categories.includes('pet')) {
      category = 'pets'
    }

    return {
      name: product.product_name_es || product.product_name || product.generic_name || 'Producto desconocido',
      brand: product.brands,
      category,
      imageUrl: product.image_front_small_url || product.image_url,
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

export function useBarcodeScanner(): UseBarcodeReturn {
  const [isScanning, setIsScanning] = useState(false)
  const [product, setProduct] = useState<ProductInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Función para decodificar código de barras usando BarcodeDetector API (si está disponible)
  // o procesamiento manual de imagen
  const detectBarcode = useCallback(async (): Promise<string | null> => {
    if (!videoRef.current || !canvasRef.current) return null

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return null

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    // Usar BarcodeDetector API si está disponible (Chrome, Edge)
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
        })
        const barcodes = await barcodeDetector.detect(canvas)
        if (barcodes.length > 0) {
          return barcodes[0].rawValue
        }
      } catch (e) {
        console.warn('BarcodeDetector failed:', e)
      }
    }

    return null
  }, [])

  const startScanning = useCallback(async () => {
    setError(null)
    setProduct(null)
    setIsScanning(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        // Escanear cada 500ms
        scanIntervalRef.current = setInterval(async () => {
          const barcode = await detectBarcode()

          if (barcode) {
            setIsLoading(true)

            // Detener escaneo mientras buscamos el producto
            if (scanIntervalRef.current) {
              clearInterval(scanIntervalRef.current)
            }

            const productInfo = await fetchProductFromOpenFoodFacts(barcode)

            if (productInfo) {
              setProduct(productInfo)
              stopScanning()
            } else {
              setError(`Producto no encontrado para código: ${barcode}`)
              // Reiniciar escaneo
              scanIntervalRef.current = setInterval(async () => {
                const newBarcode = await detectBarcode()
                if (newBarcode && newBarcode !== barcode) {
                  // Nuevo código detectado, buscar de nuevo
                  setIsLoading(true)
                  const newProduct = await fetchProductFromOpenFoodFacts(newBarcode)
                  if (newProduct) {
                    setProduct(newProduct)
                    stopScanning()
                  }
                  setIsLoading(false)
                }
              }, 500)
            }

            setIsLoading(false)
          }
        }, 500)
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      if (err.name === 'NotAllowedError') {
        setError('Permiso de cámara denegado')
      } else if (err.name === 'NotFoundError') {
        setError('No se encontró cámara')
      } else {
        setError('Error al acceder a la cámara')
      }
      setIsScanning(false)
    }
  }, [detectBarcode])

  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
    setIsLoading(false)
  }, [])

  return {
    isScanning,
    product,
    error,
    startScanning,
    stopScanning,
    videoRef,
    canvasRef,
    isLoading,
  }
}
