import { create } from 'zustand'
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

  // UI
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Comparador de precios
  showPriceComparison: boolean
  setShowPriceComparison: (show: boolean) => void
  selectedSupermarkets: string[]
  setSelectedSupermarkets: (ids: string[]) => void
}

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

  // Items
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

  // UI
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Comparador
  showPriceComparison: false,
  setShowPriceComparison: (show) => set({ showPriceComparison: show }),
  selectedSupermarkets: [],
  setSelectedSupermarkets: (ids) => set({ selectedSupermarkets: ids }),
}))
