'use client'

import { useState } from 'react'
import { Drawer } from 'vaul'
import { Plus } from 'lucide-react'
import { AddItemForm } from './AddItemForm'
import { FavoriteItems } from './FavoriteItems'
import { UserFavoriteItem, ListItem } from '@/lib/supabase/types'

interface AddItemDrawerProps {
  onAdd: (name: string, category: string, imageUrl?: string) => void | Promise<void>
  onOpenCatalog: () => void
  favoriteItems: UserFavoriteItem[]
  isLoadingFavorites: boolean
  onAddFromFavorite: (favorite: UserFavoriteItem) => Promise<void>
  onRemoveFavorite: (id: string) => Promise<void>
}

export function AddItemDrawer({
  onAdd,
  onOpenCatalog,
  favoriteItems,
  isLoadingFavorites,
  onAddFromFavorite,
  onRemoveFavorite
}: AddItemDrawerProps) {
  const [open, setOpen] = useState(false)

  // Wrapper para cerrar el drawer después de añadir (opcional, 
  // a veces es mejor dejarlo abierto para añadir multiples items)
  const handleAddWrapper = async (name: string, category: string, imageUrl?: string) => {
     await onAdd(name, category, imageUrl)
     // Si quieres que se cierre al añadir uno:
     // setOpen(false) 
  }

  // Wrapper para cerrar al usar el catálogo externo (ya que el catálogo es otro modal)
  const handleOpenCatalogWrapper = () => {
    setOpen(false)
    setTimeout(() => {
        onOpenCatalog()
    }, 150) // Pequeño delay para la animación
  }

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} shouldScaleBackground>
      <Drawer.Trigger asChild>
        <button 
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Añadir item"
        >
          <Plus className="w-7 h-7" />
        </button>
      </Drawer.Trigger>
      
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-[2px]" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-fit mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none max-h-[90vh]">
          {/* Handle visual */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 mt-4 mb-2" />
          
          <div className="p-4 overflow-y-auto">
            <Drawer.Title className="font-bold text-lg mb-4 text-center">Añadir Productos</Drawer.Title>
            
            {/* Sección de Favoritos dentro del Drawer */}
            <div className="mb-6">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Frecuentes</h3>
                <FavoriteItems 
                    favorites={favoriteItems} 
                    isLoading={isLoadingFavorites} 
                    onAddToList={onAddFromFavorite} 
                    onRemove={onRemoveFavorite} 
                />
            </div>

            {/* El formulario principal */}
            <AddItemForm 
                onAdd={handleAddWrapper}
                onOpenCatalog={handleOpenCatalogWrapper}
                suggestionsSource={favoriteItems}
            />
            
            {/* Espacio extra para teclados en iOS si fuera necesario, aunque Vaul lo maneja bien */}
            <div className="h-4" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
