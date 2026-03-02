'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

export async function getPlannings() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('plannings')
    .select('*')
    .order('semaine', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function getPlanningBySemaine(semaine: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('plannings')
    .select('*')
    .eq('semaine', semaine)
    .single()
  return data
}

export async function createOrGetPlanning(semaine: string) {
  const supabase = await createClient()
  const existing = await getPlanningBySemaine(semaine)
  if (existing) return existing

  const { data, error } = await supabase
    .from('plannings')
    .insert({ semaine, statut: 'brouillon' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/planning')
  return data
}

export async function validerPlanning(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('plannings')
    .update({ statut: 'valide', valide_par: user?.id, valide_le: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/planning')
}

export async function publierPlanning(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('plannings')
    .update({ statut: 'publie' })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/planning')
}

export async function repasserBrouillon(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('plannings')
    .update({ statut: 'brouillon', valide_par: null, valide_le: null })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/planning')
}
