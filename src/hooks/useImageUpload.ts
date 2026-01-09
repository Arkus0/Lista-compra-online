'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseImageUploadOptions {
  bucket: string
  maxSizeMB?: number
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

interface UseImageUploadReturn {
  upload: (file: File, path: string) => Promise<string | null>
  isUploading: boolean
  error: string | null
  progress: number
}

// Comprimir y redimensionar imagen
async function compressImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      let { width, height } = img

      // Calcular nuevas dimensiones manteniendo aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height)

      // Convertir a blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Could not create blob'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('Could not load image'))

    // Leer archivo como data URL
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export function useImageUpload({
  bucket,
  maxSizeMB = 2,
  maxWidth = 512,
  maxHeight = 512,
  quality = 0.8,
}: UseImageUploadOptions): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const upload = useCallback(
    async (file: File, path: string): Promise<string | null> => {
      setIsUploading(true)
      setError(null)
      setProgress(0)

      try {
        // Verificar tipo de archivo
        if (!file.type.startsWith('image/')) {
          throw new Error('El archivo debe ser una imagen')
        }

        // Verificar tamaño
        const maxBytes = maxSizeMB * 1024 * 1024
        if (file.size > maxBytes) {
          throw new Error(`La imagen no debe superar ${maxSizeMB}MB`)
        }

        setProgress(20)

        // Comprimir imagen
        const compressedBlob = await compressImage(file, maxWidth, maxHeight, quality)
        setProgress(50)

        // Subir a Supabase Storage
        const supabase = createClient()

        // Eliminar archivo anterior si existe
        const { data: existingFiles } = await supabase.storage
          .from(bucket)
          .list(path.split('/').slice(0, -1).join('/'))

        const fileName = path.split('/').pop()
        const existingFile = existingFiles?.find((f) => f.name === fileName)

        if (existingFile) {
          await supabase.storage.from(bucket).remove([path])
        }

        setProgress(70)

        // Subir nuevo archivo
        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, compressedBlob, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        if (uploadError) throw uploadError

        setProgress(90)

        // Obtener URL pública
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

        setProgress(100)
        setIsUploading(false)

        return urlData.publicUrl
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al subir imagen'
        setError(message)
        setIsUploading(false)
        return null
      }
    },
    [bucket, maxSizeMB, maxWidth, maxHeight, quality]
  )

  return {
    upload,
    isUploading,
    error,
    progress,
  }
}
