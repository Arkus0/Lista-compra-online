import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { XCircle, CheckCircle, ChefHat } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ code: string }>
}

export default async function JoinRecipePage({ params }: Props) {
  const { code } = await params
  const supabase = await createClient()

  // 1. Verify authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // If not logged in, redirect to auth and then return here
    redirect(`/auth?next=/join-recipe/${code}`)
  }

  // 2. Try to join using the RPC function
  const { data: result, error } = await supabase
    .rpc('join_recipe_by_code', { share_code_input: code })

  if (error) {
    console.error('Error joining recipe:', error)
    return <ErrorState message="Ocurrió un error al intentar unirse a la receta." />
  }

  const response = result as { success: boolean, recipe_id?: string, message?: string, error?: string }

  // 3. If success, redirect to the recipe
  if (response.success && response.recipe_id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-500">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">¡Receta añadida!</h2>
          <p className="text-muted-foreground">{response.message || 'La receta se ha añadido a tu colección.'}</p>
          <Link href={`/recipes/${response.recipe_id}`}>
            <Button className="w-full mt-2">
              <ChefHat className="w-4 h-4 mr-2" />
              Ver receta
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  // 4. If failed (invalid code, etc), show error
  return <ErrorState message={response.error || response.message || 'No se pudo unir a la receta.'} />
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto text-red-500">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">No se pudo unir</h2>
        <p className="text-muted-foreground">{message}</p>
        <Link href="/recipes">
          <Button className="w-full mt-2">Ir a recetas</Button>
        </Link>
      </Card>
    </div>
  )
}
