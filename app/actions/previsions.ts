'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

export async function getPrevisions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('previsions_heures')
    .select('*')
    .order('ordre')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function updatePrevision(
  id: string,
  fields: { h_prevision?: number; h_eleves_realisees?: number; h_realisees?: number }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('previsions_heures')
    .update(fields)
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/previsions')
}
