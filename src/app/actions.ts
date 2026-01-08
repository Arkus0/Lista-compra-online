'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateListsCache() {
  revalidatePath('/')
  revalidatePath('/lists')
}

export async function revalidateListCache(listId: string) {
  revalidatePath(`/lists/${listId}`)
  revalidatePath('/lists')
  revalidatePath('/')
}
