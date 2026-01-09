import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { ShoppingList, ListItem, Profile } from '@/lib/supabase/types'

interface AppState {
  // Usuario
  user: Profile | null
  setUser: (user: Profile | null) => void

  // Listas
  lists: ShoppingList[]
  setLists: (lists: ShoppingList[]) => void
  addList: (list: ShoppingList) => void
  updateList: (id: string, updates: Partial<ShoppingList>) => void
  removeList: (id: string) => void

  // Lista actual
  currentList: ShoppingList | null
  setCurrentList: (list: ShoppingList | null) => void

  // Items de la lista actual
  items: ListItem[]
  setItems: (items: ListItem[]) => void
  addItem: (item: ListItem) => void
  updateItem: (id: string, updates: Partial<ListItem>) => void
  removeItem: (id: string) => void
  toggleItemChecked: (id: string) => void
  // Batch update para drag & drop - más eficiente
  updateItemsPositions: (updates: { id: string; position: number }[]) => void

  // UI
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Comparador de precios
  showPriceComparison: boolean
  setShowPriceComparison: (show: boolean) => void
  selectedSupermarkets: string[]
  setSelectedSupermarkets: (ids: string[]) => void
}

// Store principal
export const useStore = create<AppState>((set) => ({
  // Usuario
  user: null,
  setUser: (user) => set({ user }),

  // Listas
  lists: [],
  setLists: (lists) => set({ lists }),
  addList: (list) => set((state) => ({ lists: [...state.lists, list] })),
  updateList: (id, updates) => set((state) => ({
    lists: state.lists.map((list) =>
      list.id === id ? { ...list, ...updates } : list
    ),
  })),
  removeList: (id) => set((state) => ({
    lists: state.lists.filter((list) => list.id !== id),
  })),

  // Lista actual
  currentList: null,
  setCurrentList: (list) => set({ currentList: list }),

  // Items - optimizados
  items: [],
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
  })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
  })),
  toggleItemChecked: (id) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ),
  })),
  // Actualización batch de posiciones - evita múltiples re-renders
  updateItemsPositions: (updates) => set((state) => {
    const positionMap = new Map(updates.map(u => [u.id, u.position]))
    return {
      items: state.items.map((item) => {
        const newPosition = positionMap.get(item.id)
        return newPosition !== undefined ? { ...item, position: newPosition } : item
      }),
    }
  }),

  // UI
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Comparador
  showPriceComparison: false,
  setShowPriceComparison: (show) => set({ showPriceComparison: show }),
  selectedSupermarkets: [],
  setSelectedSupermarkets: (ids) => set({ selectedSupermarkets: ids }),
}))

// ============================================
// SELECTORES OPTIMIZADOS - Evitan re-renders innecesarios
// ============================================

// Selector para usuario
export const useUser = () => useStore((state) => state.user)
export const useSetUser = () => useStore((state) => state.setUser)

// Selector para listas
export const useLists = () => useStore((state) => state.lists)
export const useListsActions = () => useStore(
  useShallow((state) => ({
    setLists: state.setLists,
    addList: state.addList,
    updateList: state.updateList,
    removeList: state.removeList,
  }))
)

// Selector para lista actual
export const useCurrentList = () => useStore((state) => state.currentList)
export const useSetCurrentList = () => useStore((state) => state.setCurrentList)

// Tipos para las acciones de items
interface ItemsActions {
  setItems: (items: ListItem[]) => void
  addItem: (item: ListItem) => void
  updateItem: (id: string, updates: Partial<ListItem>) => void
  removeItem: (id: string) => void
  toggleItemChecked: (id: string) => void
  updateItemsPositions: (updates: { id: string; position: number }[]) => void
}

// Selector para items - separados para mejor rendimiento
export const useItems = () => useStore((state) => state.items)
export const useItemsActions = (): ItemsActions => useStore(
  useShallow((state) => ({
    setItems: state.setItems,
    addItem: state.addItem,
    updateItem: state.updateItem,
    removeItem: state.removeItem,
    toggleItemChecked: state.toggleItemChecked,
    updateItemsPositions: state.updateItemsPositions,
  }))
)

// Items separados por estado (checked/unchecked) - memoizado
export const useCheckedItems = () => useStore(
  (state) => state.items.filter(item => item.checked)
)
export const useUncheckedItems = () => useStore(
  (state) => state.items.filter(item => !item.checked)
)

// Selector para UI
export const useIsLoading = () => useStore((state) => state.isLoading)
export const useSetIsLoading = () => useStore((state) => state.setIsLoading)

// Selector para comparador de precios
export const usePriceComparison = () => useStore(
  useShallow((state) => ({
    showPriceComparison: state.showPriceComparison,
    setShowPriceComparison: state.setShowPriceComparison,
    selectedSupermarkets: state.selectedSupermarkets,
    setSelectedSupermarkets: state.setSelectedSupermarkets,
  }))
)

// Hook para obtener un item específico por ID - evita re-render si el item no cambia
export const useItem = (id: string) => useStore(
  (state) => state.items.find(item => item.id === id)
)

// Hook para contar items
export const useItemsCount = () => useStore(
  useShallow((state) => ({
    total: state.items.length,
    checked: state.items.filter(i => i.checked).length,
    unchecked: state.items.filter(i => !i.checked).length,
  }))
)
