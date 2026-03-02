'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { AbsenceSchema, type AbsenceInput } from '@/lib/types'

export async function getAbsences() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('absences')
    .select('*, moniteur:moniteurs(id,nom,surnom)')
    .order('date_debut', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function getAbsencesByPeriode(debut: string, fin: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('absences')
    .select('*, moniteur:moniteurs(id,nom,surnom)')
    .lte('date_debut', fin)
    .gte('date_fin', debut)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createAbsence(input: AbsenceInput) {
  const parsed = AbsenceSchema.parse(input)
  const supabase = await createClient()
  const { error } = await supabase.from('absences').insert(parsed)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/absences')
}

export async function updateAbsence(id: string, input: AbsenceInput) {
  const parsed = AbsenceSchema.parse(input)
  const supabase = await createClient()
  const { error } = await supabase.from('absences').update(parsed).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/absences')
}

export async function deleteAbsence(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('absences').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/absences')
}
