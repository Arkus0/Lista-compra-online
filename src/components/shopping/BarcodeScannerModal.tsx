'use client'

import { useEffect } from 'react'
import { X, Loader2, ScanBarcode, AlertCircle } from 'lucide-react'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { Button } from '@/components/ui/Button'

interface BarcodeScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onProductFound: (name: string, category?: string) => void
}

export function BarcodeScannerModal({ isOpen, onClose, onProductFound }: BarcodeScannerModalProps) {
  const {
    isScanning,
    product,
    error,
    startScanning,
    stopScanning,
    videoRef,
    canvasRef,
    isLoading,
  } = useBarcodeScanner()

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanning()
    }

    return () => {
      if (isScanning) {
        stopScanning()
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (product) {
      const fullName = product.brand
        ? `${product.name} (${product.brand})`
        : product.name
      onProductFound(fullName, product.category)
      onClose()
    }
  }, [product, onProductFound, onClose])

  const handleClose = () => {
    stopScanning()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ScanBarcode className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Escanear código de barras</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative aspect-[4/3] bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Overlay con guías de escaneo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-32 border-2 border-primary rounded-lg relative">
              {/* Esquinas */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br" />

              {/* Línea de escaneo animada */}
              <div className="absolute inset-x-4 top-1/2 h-0.5 bg-primary/50 animate-pulse" />
            </div>
          </div>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">Buscando producto...</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 space-y-3">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger/10 text-danger rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-muted text-center">
            Apunta la cámara al código de barras del producto
          </p>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            {!isScanning && (
              <Button onClick={startScanning} className="flex-1">
                Reintentar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
