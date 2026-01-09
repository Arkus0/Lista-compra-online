export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      shopping_lists: {
        Row: {
          id: string
          name: string
          owner_id: string
          share_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          share_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          share_code?: string | null
          updated_at?: string
        }
      }
      list_items: {
        Row: {
          id: string
          list_id: string
          name: string
          quantity: number
          unit: string | null
          category: string | null
          checked: boolean
          added_by: string
          checked_by: string | null
          assigned_to: string | null
          position?: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          name: string
          quantity?: number
          unit?: string | null
          category?: string | null
          checked?: boolean
          added_by: string
          checked_by?: string | null
          assigned_to?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          quantity?: number
          unit?: string | null
          category?: string | null
          checked?: boolean
          checked_by?: string | null
          assigned_to?: string | null
          position?: number
          updated_at?: string
        }
      }
      list_collaborators: {
        Row: {
          id: string
          list_id: string
          user_id: string
          role: 'viewer' | 'editor'
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          user_id: string
          role?: 'viewer' | 'editor'
          created_at?: string
        }
        Update: {
          role?: 'viewer' | 'editor'
        }
      }
      supermarkets: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          address: string | null
          latitude: number | null
          longitude: number | null
          municipality: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          logo_url?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
        }
      }
      product_prices: {
        Row: {
          id: string
          supermarket_id: string
          product_name: string
          price: number
          unit: string | null
          last_updated: string
        }
        Insert: {
          id?: string
          supermarket_id: string
          product_name: string
          price: number
          unit?: string | null
          last_updated?: string
        }
        Update: {
          price?: number
          unit?: string | null
          last_updated?: string
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          endpoint?: string
          p256dh?: string
          auth?: string
          updated_at?: string
        }
      }
      user_favorite_items: {
        Row: {
          id: string
          user_id: string
          name: string
          quantity: number
          unit: string | null
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          quantity?: number
          unit?: string | null
          category?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          quantity?: number
          unit?: string | null
          category?: string | null
        }
      }
      user_favorite_lists: {
        Row: {
          id: string
          user_id: string
          list_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          list_id: string
          created_at?: string
        }
        Update: {
          // No hay campos actualizables
        }
      }
      list_notes: {
        Row: {
          id: string
          list_id: string
          user_id: string
          content: string
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          user_id: string
          content: string
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          is_pinned?: boolean
          updated_at?: string
        }
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          items_added: boolean
          items_removed: boolean
          items_checked: boolean
          notes_added: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          items_added?: boolean
          items_removed?: boolean
          items_checked?: boolean
          notes_added?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          items_added?: boolean
          items_removed?: boolean
          items_checked?: boolean
          notes_added?: boolean
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          list_id: string
          type: 'item_added' | 'item_removed' | 'item_checked' | 'note_added' | 'collaborator_joined'
          actor_id: string | null
          actor_name: string
          list_name: string
          item_name: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          list_id: string
          type: 'item_added' | 'item_removed' | 'item_checked' | 'note_added' | 'collaborator_joined'
          actor_id?: string | null
          actor_name: string
          list_name: string
          item_name?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
      }
    }
    Functions: {
      join_list_by_code: {
        Args: {
          share_code_input: string
        }
        Returns: Json
      }
    }
    Enums: {
      // Aquí irían enums si los tuvieras definidos en Postgres,
      // por ahora el role se maneja como string literal en las tablas.
    }
  }
}

// Tipos helpers
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ShoppingList = Database['public']['Tables']['shopping_lists']['Row']
export type ListItem = Database['public']['Tables']['list_items']['Row']
export type ListCollaborator = Database['public']['Tables']['list_collaborators']['Row']
export type Supermarket = Database['public']['Tables']['supermarkets']['Row']
export type ProductPrice = Database['public']['Tables']['product_prices']['Row']
export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row']
export type UserFavoriteItem = Database['public']['Tables']['user_favorite_items']['Row']
export type UserFavoriteList = Database['public']['Tables']['user_favorite_lists']['Row']
export type ListNote = Database['public']['Tables']['list_notes']['Row']
export type NotificationPreferences = Database['public']['Tables']['notification_preferences']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

// Tipos extendidos
export type ShoppingListWithItems = ShoppingList & {
  items: ListItem[]
  collaborators: (ListCollaborator & { profile: Profile })[]
}

export type ListItemWithPrices = ListItem & {
  prices: (ProductPrice & { supermarket: Supermarket })[]
}

export type ListNoteWithProfile = ListNote & {
  profile: Profile
}

export type ListItemWithProfile = ListItem & {
  added_by_profile?: Profile
  checked_by_profile?: Profile
}

// Tipos para Realtime Presence
export type PresenceState = {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  online_at: string
}
