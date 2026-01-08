'use client'

import { MoreVertical } from 'lucide-react'

export function ListMenuButton() {
  return (
    <button
      className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
      onClick={(e) => {
        e.preventDefault() // Esto evita que el click navegue al entrar en la lista
        // Aquí podrás poner tu lógica de abrir menú más adelante
        console.log('Abrir menú') 
      }}
    >
      <MoreVertical className="w-4 h-4 text-gray-400" />
    </button>
  )
}
