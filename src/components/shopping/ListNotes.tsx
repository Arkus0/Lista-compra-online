'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  MessageSquare,
  Pin,
  PinOff,
  Trash2,
  Send,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { ListNote, Profile } from '@/lib/supabase/types'
import { sendPushNotification } from '@/lib/notifications'

interface ListNotesProps {
  listId: string
  listName: string
  currentUser: Profile
  isCollaborative?: boolean
}

interface NoteWithProfile extends ListNote {
  profile?: Profile
}

export function ListNotes({ listId, listName, currentUser, isCollaborative = false }: ListNotesProps) {
  const [notes, setNotes] = useState<NoteWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [isSending, setIsSending] = useState(false)

  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Cargar notas
  useEffect(() => {
    const loadNotes = async () => {
      const { data } = await supabase
        .from('list_notes')
        .select('*, profile:profiles(*)')
        .eq('list_id', listId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (data) {
        setNotes(data as NoteWithProfile[])
      }
      setIsLoading(false)
    }

    loadNotes()
  }, [listId, supabase])

  // Suscripción en tiempo real para notas
  useEffect(() => {
    const channel = supabase
      .channel(`notes-${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'list_notes',
          filter: `list_id=eq.${listId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Cargar el perfil del autor
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', payload.new.user_id)
              .single()

            const newNote = { ...payload.new, profile } as NoteWithProfile
            setNotes((prev) => [newNote, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setNotes((prev) =>
              prev.map((note) =>
                note.id === payload.new.id
                  ? { ...note, ...payload.new }
                  : note
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setNotes((prev) => prev.filter((note) => note.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [listId, supabase])

  // Añadir nota
  const handleAddNote = useCallback(async () => {
    if (!newNote.trim() || isSending) return

    setIsSending(true)

    const { error } = await supabase.from('list_notes').insert({
      list_id: listId,
      user_id: currentUser.id,
      content: newNote.trim(),
    })

    if (!error) {
      setNewNote('')
      inputRef.current?.focus()

      // Enviar notificación push si es colaborativa
      if (isCollaborative) {
        sendPushNotification({
          listId,
          listName,
          action: 'note_added',
          actorName: currentUser.name || 'Alguien',
          excludeUserId: currentUser.id,
        })
      }
    }

    setIsSending(false)
  }, [newNote, isSending, supabase, listId, currentUser, isCollaborative, listName])

  // Toggle pin nota
  const handleTogglePin = useCallback(
    async (noteId: string, isPinned: boolean) => {
      await supabase
        .from('list_notes')
        .update({ is_pinned: !isPinned })
        .eq('id', noteId)
    },
    [supabase]
  )

  // Eliminar nota
  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      await supabase.from('list_notes').delete().eq('id', noteId)
    },
    [supabase]
  )

  // Contar notas fijadas
  const pinnedCount = notes.filter((n) => n.is_pinned).length

  // Separar notas fijadas y no fijadas
  const pinnedNotes = notes.filter((n) => n.is_pinned)
  const unpinnedNotes = notes.filter((n) => !n.is_pinned)

  return (
    <div className="border-t border-gray-100 dark:border-gray-800">
      {/* Notas fijadas - siempre visibles */}
      {pinnedNotes.length > 0 && (
        <div className="px-3 pt-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Pin className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Notas fijadas
            </span>
          </div>
          {pinnedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isOwner={note.user_id === currentUser.id}
              onTogglePin={() => handleTogglePin(note.id, note.is_pinned)}
              onDelete={() => handleDeleteNote(note.id)}
            />
          ))}
        </div>
      )}

      {/* Header toggle para ver todas las notas */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted" />
          <span className="text-sm font-medium">
            {isExpanded ? 'Ocultar notas' : `Ver todas las notas (${notes.length})`}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted" />
        )}
      </button>

      {/* Contenido expandido */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Input para nueva nota */}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAddNote()
                }
              }}
              placeholder="Escribe una nota..."
              rows={2}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            />
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || isSending}
              size="sm"
              className="self-end"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Lista de todas las notas */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">
              No hay notas todavía
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* Notas no fijadas */}
              {unpinnedNotes.length > 0 && (
                <>
                  {pinnedNotes.length > 0 && (
                    <p className="text-xs font-medium text-muted mt-4 mb-2">
                      Otras notas
                    </p>
                  )}
                  {unpinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      isOwner={note.user_id === currentUser.id}
                      onTogglePin={() => handleTogglePin(note.id, note.is_pinned)}
                      onDelete={() => handleDeleteNote(note.id)}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface NoteCardProps {
  note: NoteWithProfile
  isOwner: boolean
  onTogglePin: () => void
  onDelete: () => void
}

function NoteCard({ note, isOwner, onTogglePin, onDelete }: NoteCardProps) {
  const timeAgo = getTimeAgo(new Date(note.created_at))

  return (
    <div
      className={`p-3 rounded-lg border ${
        note.is_pinned
          ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
          : 'border-gray-100 dark:border-gray-800 bg-secondary/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {note.profile?.avatar_url ? (
            <img
              src={note.profile.avatar_url}
              alt=""
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs text-primary font-medium">
                {(note.profile?.name || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-muted truncate">
              <span className="font-medium">
                {note.profile?.name || 'Usuario'}
              </span>{' '}
              · {timeAgo}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 shrink-0">
          {note.is_pinned && (
            <Pin className="w-3 h-3 text-amber-500" />
          )}
          {isOwner && (
            <>
              <button
                onClick={onTogglePin}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title={note.is_pinned ? 'Desfijar' : 'Fijar'}
              >
                {note.is_pinned ? (
                  <PinOff className="w-3.5 h-3.5 text-muted" />
                ) : (
                  <Pin className="w-3.5 h-3.5 text-muted" />
                )}
              </button>
              <button
                onClick={onDelete}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </>
          )}
        </div>
      </div>

      <p className="text-sm mt-2 whitespace-pre-wrap break-words">
        {note.content}
      </p>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'ahora'
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `hace ${Math.floor(seconds / 86400)}d`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
