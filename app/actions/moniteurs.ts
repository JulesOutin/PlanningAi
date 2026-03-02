'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { MoniteurSchema, type MoniteurInput } from '@/lib/types'

export async function getMoniteurs() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('moniteurs')
    .select('*')
    .order('surnom')
  if (error) throw new Error(error.message)
  return data
}

export async function createMoniteur(input: MoniteurInput) {
  const parsed = MoniteurSchema.parse(input)
  const supabase = await createClient()
  const { error } = await supabase.from('moniteurs').insert(parsed)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/moniteurs')
}

export async function updateMoniteur(id: string, input: MoniteurInput) {
  const parsed = MoniteurSchema.parse(input)
  const supabase = await createClient()
  const { error } = await supabase.from('moniteurs').update(parsed).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/moniteurs')
}

export async function deleteMoniteur(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('moniteurs').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/moniteurs')
}
