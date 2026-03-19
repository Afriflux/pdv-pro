'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleProductStatus(
  productId: string,
  currentStatus: boolean
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('Product')
    .update({
      active:     !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/products')
}

export async function duplicateProduct(productId: string) {
  const supabase = createAdminClient()
  
  // 1. Récupérer le produit original
  const { data: original, error: fetchError } = await supabase
    .from('Product')
    .select('*')
    .eq('id', productId)
    .single()

  if (fetchError || !original) {
    throw new Error('Produit original non trouvé')
  }

  // 2. Créer la copie
  const dataToInsert = JSON.parse(JSON.stringify(original))
  delete dataToInsert.id
  delete dataToInsert.created_at
  delete dataToInsert.updated_at

  const { error: insertError } = await supabase
    .from('Product')
    .insert({
      ...dataToInsert,
      id: crypto.randomUUID(),
      name: `${original.name} (Copie)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (insertError) throw new Error(insertError.message)

  revalidatePath('/dashboard/products')
  return { success: true }
}
