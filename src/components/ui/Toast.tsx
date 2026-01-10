'use client'

import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { Check, X, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, options?: { duration?: number; action?: Toast['action'] }) => void
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const toastIcons: Record<ToastType, typeof Check> = {
  success: Check,
  error: X,
  info: Info,
  warning: AlertTriangle,
}

const toastStyles: Record<ToastType, string> = {
  success: 'bg-success',
  error: 'bg-danger',
  info: 'bg-info',
  warning: 'bg-warning',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [isExiting, setIsExiting] = useState(false)
  const Icon = toastIcons[toast.type]

  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(onDismiss, 200)
      }, toast.duration || 4000)
      return () => clearTimeout(timer)
    }
  }, [toast.duration, onDismiss])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(onDismiss, 200)
  }

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white min-w-[280px] max-w-[400px]
        ${toastStyles[toast.type]}
        ${isExiting ? 'animate-out fade-out slide-out-to-right-full duration-200' : 'animate-in slide-in-from-right-full fade-in duration-300'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick()
            handleDismiss()
          }}
          className="text-sm font-semibold underline hover:no-underline ml-2"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={handleDismiss}
        className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    options?: { duration?: number; action?: Toast['action'] }
  ) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts(prev => [...prev, { id, message, type, ...options }])
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={() => hideToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
