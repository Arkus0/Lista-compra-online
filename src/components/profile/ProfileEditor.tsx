'use client'

import { useState, useRef } from 'react'
import { Camera, User, Loader2, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Profile } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { useImageUpload } from '@/hooks/useImageUpload'

interface ProfileEditorProps {
  profile: Profile
  onUpdate: (profile: Profile) => void
  children?: React.ReactNode
}

export function ProfileEditor({ profile, onUpdate, children }: ProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(profile.name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { upload, isUploading, progress } = useImageUpload({
    bucket: 'avatars',
    maxSizeMB: 2,
    maxWidth: 256,
    maxHeight: 256,
    quality: 0.85,
  })

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const path = `${profile.id}/avatar.jpg`
    const url = await upload(file, path)

    if (url) {
      // Añadir timestamp para forzar recarga
      setAvatarUrl(`${url}?t=${Date.now()}`)
    }

    // Limpiar input para permitir seleccionar el mismo archivo
    e.target.value = ''
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: name.trim() || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      onUpdate({
        ...profile,
        name: name.trim() || null,
        avatar_url: avatarUrl || null,
      })

      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setName(profile.name || '')
    setAvatarUrl(profile.avatar_url || '')
    setError(null)
    setShowPasswordChange(false)
    setNewPassword('')
    setConfirmPassword('')
    setPasswordSuccess(false)
    setIsEditing(false)
  }

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Por favor completa todos los campos de contraseña')
      return
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (passwordError) throw passwordError

      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordChange(false)

      setTimeout(() => {
        setPasswordSuccess(false)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* Si hay children, hacerlos clickeables. Si no, usar el botón de avatar original */}
      {children ? (
        <div onClick={() => setIsEditing(true)}>
          {children}
        </div>
      ) : (
        <>
          {/* Avatar con botón de edición */}
          <div className="relative group">
            <button
              onClick={() => setIsEditing(true)}
              className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-background shadow-lg"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
              )}

              {/* Overlay de edición */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>

            {/* Badge de edición */}
            <button
              onClick={() => setIsEditing(true)}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* Modal de edición */}
      <Modal isOpen={isEditing} onClose={handleCancel} title="Editar perfil">
        <div className="space-y-6">
          {/* Avatar editor */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <button
                onClick={handleAvatarClick}
                disabled={isUploading}
                className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  {isUploading ? (
                    <div className="text-center text-white">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      <span className="text-xs">{Math.round(progress)}%</span>
                    </div>
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <p className="text-sm text-muted text-center">
              Toca para cambiar la foto
            </p>
          </div>

          {/* Name input */}
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
          />

          {/* Cambiar contraseña - Sección desplegable */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="w-full flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <span className="text-sm font-medium">Cambiar contraseña</span>
              {showPasswordChange ? (
                <ChevronUp className="w-4 h-4 text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted" />
              )}
            </button>

            {showPasswordChange && (
              <div className="mt-3 space-y-3">
                <Input
                  label="Nueva contraseña"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                />
                <Button
                  onClick={handlePasswordChange}
                  disabled={isSaving || !newPassword || !confirmPassword}
                  variant="secondary"
                  className="w-full"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Actualizar contraseña'
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Success message */}
          {passwordSuccess && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              Contraseña actualizada correctamente
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="flex-1"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
