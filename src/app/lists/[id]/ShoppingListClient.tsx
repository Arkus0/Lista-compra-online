'use client'

import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ShoppingList } from '@/components/shopping/ShoppingList'
import { ShoppingList as ShoppingListType, Profile } from '@/lib/supabase/types'
import { useStore } from '@/store/useStore'

interface Props {
  list: ShoppingListType
  user: Profile
}

export function ShoppingListClient({ list, user }: Props) {
  const { setCurrentList, setUser } = useStore()

  useEffect(() => {
    setCurrentList(list)
    setUser(user)
  }, [list, user, setCurrentList, setUser])

  return (
    <div className="h-screen flex flex-col">
      {/* Back button overlay */}
      <div className="absolute top-4 left-4 z-50">
        <Link
          href="/lists"
          className="w-10 h-10 rounded-xl bg-background/80 backdrop-blur-sm border border-gray-100 flex items-center justify-center hover:bg-secondary transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      <ShoppingList list={list} />
    </div>
  )
}
