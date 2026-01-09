'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

// Tipos para Web Speech API
interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEventType {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEventType {
  error: string
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventType) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventType) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface UseVoiceInputReturn {
  isListening: boolean
  transcript: string
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  error: string | null
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    // Verificar soporte del navegador
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognitionAPI) {
      setIsSupported(true)
      const recognition = new SpeechRecognitionAPI() as SpeechRecognitionInstance
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'es-ES'

      recognition.onresult = (event: SpeechRecognitionEventType) => {
        const current = event.resultIndex
        const result = event.results[current]
        const transcriptResult = result[0].transcript
        setTranscript(transcriptResult)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEventType) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'not-allowed') {
          setError('Permiso de micrófono denegado')
        } else if (event.error === 'no-speech') {
          setError('No se detectó voz')
        } else {
          setError('Error de reconocimiento de voz')
        }
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return

    setError(null)
    setTranscript('')
    setIsListening(true)

    try {
      recognitionRef.current.start()
    } catch (e) {
      // Si ya está escuchando, ignorar el error
      console.warn('Recognition already started')
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return

    recognitionRef.current.stop()
    setIsListening(false)
  }, [])

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    error,
  }
}
