'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { SeanceSchema, type SeanceInput } from '@/lib/types'

const SEANCE_SELECT = `
  *,
  groupe:groupes(*),
  moniteur:moniteurs(*),
  salle:salles(*),
  type_cours:types_cours(*)
`

export async function getSeancesByPlanning(planningId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('seances')
    .select(SEANCE_SELECT)
    .eq('planning_id', planningId)
    .order('heure_debut')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createSeance(input: SeanceInput) {
  const parsed = SeanceSchema.parse(input)
  const supabase = await createClient()
  const { error } = await supabase.from('seances').insert(parsed)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/planning')
}

export async function updateSeance(id: string, input: Partial<SeanceInput>) {
  const supabase = await createClient()
  const { error } = await supabase.from('seances').update(input).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/planning')
}

export async function deleteSeance(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('seances').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/planning')
}

export async function getPauses() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('pauses').select('*').order('jour_semaine')
  if (error) throw new Error(error.message)
  return data ?? []
}
