'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { GroupeSchema, type GroupeInput } from '@/lib/types'

export async function getGroupes() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('groupes')
    .select('*')
    .order('semaine', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function getGroupesBySemaine(semaine: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('groupes')
    .select('*')
    .eq('semaine', semaine)
    .order('nom_couleur')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createGroupe(input: GroupeInput) {
  const parsed = GroupeSchema.parse(input)
  const supabase = await createClient()
  const { error } = await supabase.from('groupes').insert(parsed)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/groupes')
}

export async function updateGroupe(id: string, input: GroupeInput) {
  const parsed = GroupeSchema.parse(input)
  const supabase = await createClient()
  const { error } = await supabase.from('groupes').update(parsed).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/groupes')
}

export async function deleteGroupe(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('groupes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/groupes')
}
