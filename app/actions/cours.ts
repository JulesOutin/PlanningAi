'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { TypeCoursSchema, type TypeCoursInput } from '@/lib/types'

export async function getTypesCours() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('types_cours').select('*').order('nom')
  if (error) throw new Error(error.message)
  return data
}

export async function createTypeCours(input: TypeCoursInput) {
  const parsed = TypeCoursSchema.parse(input)
  const supabase = await createClient()
  const { error } = await supabase.from('types_cours').insert(parsed)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/cours')
}

export async function updateTypeCours(id: string, input: TypeCoursInput) {
  const parsed = TypeCoursSchema.parse(input)
  const supabase = await createClient()
  const { error } = await supabase.from('types_cours').update(parsed).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/cours')
}

export async function deleteTypeCours(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('types_cours').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/cours')
}
