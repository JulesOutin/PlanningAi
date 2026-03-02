'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { heureEnMinutes, creneauxDisponibles } from '@/lib/semaine'
import type { Seance } from '@/lib/types'
import { addDays, format, parseISO } from 'date-fns'

// ─── Modèle planning ─────────────────────────────────────────

export async function getModelePlanning() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modele_planning')
    .select('*, type_cours:types_cours(*)')
    .order('nom_couleur')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function upsertModelePlanning(
  nomCouleur: string,
  typeCoursId: string,
  heuresParSemaine: number
) {
  const supabase = await createClient()
  const { error } = await supabase.from('modele_planning').upsert(
    { nom_couleur: nomCouleur, type_cours_id: typeCoursId, heures_par_semaine: heuresParSemaine },
    { onConflict: 'nom_couleur,type_cours_id' }
  )
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/auto-planning')
}

export async function deleteModelePlanning(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('modele_planning').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/auto-planning')
}

// ─── Moniteur ↔ cours ────────────────────────────────────────

export async function getMoniteurTypesCours() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('moniteur_types_cours')
    .select('*, moniteur:moniteurs(*), type_cours:types_cours(*)')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function toggleMoniteurTypeCours(moniteurId: string, typeCoursId: string) {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('moniteur_types_cours')
    .select('moniteur_id')
    .eq('moniteur_id', moniteurId)
    .eq('type_cours_id', typeCoursId)
    .single()

  if (existing) {
    await supabase
      .from('moniteur_types_cours')
      .delete()
      .eq('moniteur_id', moniteurId)
      .eq('type_cours_id', typeCoursId)
  } else {
    await supabase.from('moniteur_types_cours').insert({ moniteur_id: moniteurId, type_cours_id: typeCoursId })
  }
  revalidatePath('/dashboard/auto-planning')
}

export async function getDisponibilitesMoniteurs() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('disponibilite_moniteurs')
    .select('*, moniteur:moniteurs(*)')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function upsertDisponibiliteMoniteur(moniteurId: string, heuresMax: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('disponibilite_moniteurs').upsert(
    { moniteur_id: moniteurId, heures_max_semaine: heuresMax },
    { onConflict: 'moniteur_id' }
  )
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/auto-planning')
}

// ─── Calendrier groupes ───────────────────────────────────────

export async function getCalendrierGroupes(semaineDebut?: string, semaineFin?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('calendrier_groupes')
    .select('*')
    .order('semaine')
  if (semaineDebut) query = query.gte('semaine', semaineDebut)
  if (semaineFin) query = query.lte('semaine', semaineFin)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function upsertCalendrierGroupe(
  semaine: string,
  nomCouleur: string,
  type: 'cours' | 'stage'
) {
  const supabase = await createClient()
  const { error } = await supabase.from('calendrier_groupes').upsert(
    { semaine, nom_couleur: nomCouleur, type },
    { onConflict: 'semaine,nom_couleur' }
  )
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/auto-planning')
}

// ─── Génération automatique ───────────────────────────────────

export async function genererPlanning(semaine: string): Promise<{ creees: number; erreurs: string[] }> {
  const supabase = await createClient()
  const erreurs: string[] = []

  // 1. Récupérer ou créer le planning
  let { data: planning } = await supabase
    .from('plannings')
    .select('id')
    .eq('semaine', semaine)
    .single()

  if (!planning) {
    const { data: newP, error } = await supabase
      .from('plannings')
      .insert({ semaine, statut: 'brouillon' })
      .select('id')
      .single()
    if (error || !newP) throw new Error('Impossible de créer le planning')
    planning = newP
  }

  // 2. Groupes présents cette semaine (mode 'cours')
  const { data: calendrier } = await supabase
    .from('calendrier_groupes')
    .select('nom_couleur')
    .eq('semaine', semaine)
    .eq('type', 'cours')

  const nomsCouleursPresents = (calendrier ?? []).map((c) => c.nom_couleur)

  // 3. Groupes de la semaine
  const { data: groupes } = await supabase
    .from('groupes')
    .select('*')
    .eq('semaine', semaine)

  if (!groupes || groupes.length === 0) {
    return { creees: 0, erreurs: ['Aucun groupe pour cette semaine'] }
  }

  // Filtrer les groupes présents (si calendrier défini, sinon tous)
  const groupesFiltres =
    nomsCouleursPresents.length > 0
      ? groupes.filter((g) => nomsCouleursPresents.includes(g.nom_couleur))
      : groupes

  // 4. Modèles de planning
  const { data: modeles } = await supabase
    .from('modele_planning')
    .select('*, type_cours:types_cours(*)')

  if (!modeles || modeles.length === 0) {
    return { creees: 0, erreurs: ['Aucun modèle de planning configuré'] }
  }

  // 5. Moniteurs compétences + disponibilité
  const { data: moniteurCours } = await supabase
    .from('moniteur_types_cours')
    .select('moniteur_id, type_cours_id')

  const { data: dispos } = await supabase
    .from('disponibilite_moniteurs')
    .select('moniteur_id, heures_max_semaine')

  const { data: moniteurs } = await supabase.from('moniteurs').select('*')
  const { data: salles } = await supabase.from('salles').select('id').limit(50)
  const { data: pauses } = await supabase.from('pauses').select('*')
  const { data: absences } = await supabase
    .from('absences')
    .select('moniteur_id, date_debut, date_fin')

  // Pauses groupées par jour
  const pausesByDay = new Map<number, { debut: number; fin: number }[]>()
  for (const p of pauses ?? []) {
    if (!pausesByDay.has(p.jour_semaine)) pausesByDay.set(p.jour_semaine, [])
    pausesByDay.get(p.jour_semaine)!.push({
      debut: heureEnMinutes(p.heure_debut),
      fin: heureEnMinutes(p.heure_fin),
    })
  }

  // Heures utilisées par moniteur cette semaine (accumulées pendant génération)
  const heuresUsees = new Map<string, number>()
  const dispoMax = new Map<string, number>()
  for (const d of dispos ?? []) {
    dispoMax.set(d.moniteur_id, Number(d.heures_max_semaine))
  }

  // Séances déjà existantes pour ce planning
  const { data: seancesExistantes } = await supabase
    .from('seances')
    .select('*')
    .eq('planning_id', planning.id)

  const seancesCreees: Omit<Seance, 'id' | 'created_at'>[] = []
  const allSeances: Array<{
    moniteur_id: string
    salle_id: string
    jour_semaine: number
    heure_debut: number
    heure_fin: number
  }> = (seancesExistantes ?? []).map((s) => ({
    moniteur_id: s.moniteur_id,
    salle_id: s.salle_id,
    jour_semaine: s.jour_semaine,
    heure_debut: heureEnMinutes(s.heure_debut),
    heure_fin: heureEnMinutes(s.heure_debut) + 60,
  }))

  const creneaux = creneauxDisponibles()

  function slotDisponible(
    moniteurId: string,
    salleId: string,
    jourSemaine: number,
    heureDebutMin: number,
    dureeMin: number
  ): boolean {
    const fin = heureDebutMin + dureeMin

    // Check pauses
    for (const p of pausesByDay.get(jourSemaine) ?? []) {
      if (heureDebutMin < p.fin && p.debut < fin) return false
    }

    // Check moniteur absent
    const jourDate = addDays(parseISO(semaine), jourSemaine - 1)
    const jourStr = format(jourDate, 'yyyy-MM-dd')
    const estAbsent = (absences ?? []).some(
      (a) => a.moniteur_id === moniteurId && jourStr >= a.date_debut && jourStr <= a.date_fin
    )
    if (estAbsent) return false

    // Check moniteur double booking
    for (const s of allSeances) {
      if (s.jour_semaine !== jourSemaine) continue
      if (s.moniteur_id === moniteurId && heureDebutMin < s.heure_fin && s.heure_debut < fin)
        return false
      if (s.salle_id === salleId && heureDebutMin < s.heure_fin && s.heure_debut < fin)
        return false
    }

    return true
  }

  // 6. Pour chaque groupe présent, planifier les cours du modèle
  for (const groupe of groupesFiltres) {
    const modelesGroupe = (modeles ?? []).filter(
      (m) => m.nom_couleur === groupe.nom_couleur
    )

    for (const modele of modelesGroupe) {
      const dureeMin = modele.type_cours?.duree_minutes ?? 60
      const heuresCible = Number(modele.heures_par_semaine)
      let heuresPlacees = 0

      // Moniteurs qui peuvent enseigner ce cours
      const moniteursCandidats = (moniteurCours ?? [])
        .filter((mc) => mc.type_cours_id === modele.type_cours_id)
        .map((mc) => mc.moniteur_id)

      if (moniteursCandidats.length === 0) {
        erreurs.push(
          `Aucun moniteur pour "${modele.type_cours?.nom}" (groupe ${groupe.nom_couleur})`
        )
        continue
      }

      // Tenter de placer les séances
      outer: for (let jour = 1; jour <= 5; jour++) {
        if (heuresPlacees >= heuresCible) break
        for (const heureStr of creneaux) {
          if (heuresPlacees >= heuresCible) break outer
          const heureDebutMin = heureEnMinutes(heureStr)

          // Chercher un moniteur disponible
          for (const moniteurId of moniteursCandidats) {
            const maxH = dispoMax.get(moniteurId) ?? 35
            const usees = heuresUsees.get(moniteurId) ?? 0
            if (usees + dureeMin / 60 > maxH) continue

            // Chercher une salle disponible
            for (const salle of salles ?? []) {
              if (
                slotDisponible(moniteurId, salle.id, jour, heureDebutMin, dureeMin)
              ) {
                const newSlot = {
                  moniteur_id: moniteurId,
                  salle_id: salle.id,
                  jour_semaine: jour,
                  heure_debut: heureDebutMin,
                  heure_fin: heureDebutMin + dureeMin,
                }
                allSeances.push(newSlot)
                heuresUsees.set(moniteurId, usees + dureeMin / 60)
                heuresPlacees += dureeMin / 60

                seancesCreees.push({
                  planning_id: planning.id,
                  groupe_id: groupe.id,
                  moniteur_id: moniteurId,
                  salle_id: salle.id,
                  type_cours_id: modele.type_cours_id,
                  jour_semaine: jour as 1 | 2 | 3 | 4 | 5,
                  heure_debut: heureStr,
                })
                break
              }
            }
            if (heuresPlacees >= heuresCible) break outer
          }
        }
      }

      if (heuresPlacees < heuresCible) {
        erreurs.push(
          `"${modele.type_cours?.nom}" : ${heuresPlacees}h/${heuresCible}h placées pour ${groupe.nom_couleur}`
        )
      }
    }
  }

  // 7. Insérer toutes les séances générées
  if (seancesCreees.length > 0) {
    const { error } = await supabase.from('seances').insert(seancesCreees)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/dashboard/planning')
  return { creees: seancesCreees.length, erreurs }
}
