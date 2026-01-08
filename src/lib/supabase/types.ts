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
          position: number
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

// Tipos extendidos
export type ShoppingListWithItems = ShoppingList & {
  items: ListItem[]
  collaborators: (ListCollaborator & { profile: Profile })[]
}

export type ListItemWithPrices = ListItem & {
  prices: (ProductPrice & { supermarket: Supermarket })[]
}
