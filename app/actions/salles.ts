'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { SalleSchema, type SalleInput } from '@/lib/types'

export async function getSalles() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('salles').select('*').order('nom')
  if (error) throw new Error(error.message)
  return data
}

export async function createSalle(input: SalleInput) {
  const parsed = SalleSchema.parse(input)
  const supabase = await createClient()
  const { error } = await supabase.from('salles').insert(parsed)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/salles')
}

export async function updateSalle(id: string, input: SalleInput) {
  const parsed = SalleSchema.parse(input)
  const supabase = await createClient()
  const { error } = await supabase.from('salles').update(parsed).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/salles')
}

export async function deleteSalle(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('salles').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/salles')
}
