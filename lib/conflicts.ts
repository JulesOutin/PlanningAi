import { addDays, format, parseISO } from 'date-fns'
import { heureEnMinutes } from './semaine'
import type { Absence, Conflict, Pause, Seance } from './types'

function getSeanceDuree(seance: Seance): number {
  return seance.type_cours?.duree_minutes ?? 60
}

function seancesOverlap(a: Seance, b: Seance): boolean {
  if (a.jour_semaine !== b.jour_semaine) return false
  const aStart = heureEnMinutes(a.heure_debut)
  const aEnd = aStart + getSeanceDuree(a)
  const bStart = heureEnMinutes(b.heure_debut)
  const bEnd = bStart + getSeanceDuree(b)
  return aStart < bEnd && bStart < aEnd
}

/**
 * Détecte les conflits d'une séance par rapport à l'ensemble des séances du planning.
 */
export function detectConflicts(
  seance: Seance,
  allSeances: Seance[],
  absences: Absence[],
  pauses: Pause[],
  semaineLundi: string
): Conflict[] {
  const conflicts: Conflict[] = []
  const others = allSeances.filter((s) => s.id !== seance.id)
  const seanceStart = heureEnMinutes(seance.heure_debut)
  const seanceDuree = getSeanceDuree(seance)
  const seanceEnd = seanceStart + seanceDuree

  // Pause rouge
  for (const pause of pauses) {
    if (pause.jour_semaine === seance.jour_semaine) {
      const pauseStart = heureEnMinutes(pause.heure_debut)
      const pauseEnd = heureEnMinutes(pause.heure_fin)
      if (seanceStart < pauseEnd && pauseStart < seanceEnd) {
        conflicts.push({
          type: 'pause_rouge',
          severity: 'error',
          message: `Créneau dans la pause ${pause.heure_debut}–${pause.heure_fin}`,
        })
      }
    }
  }

  // Double booking moniteur
  for (const other of others.filter((s) => s.moniteur_id === seance.moniteur_id)) {
    if (seancesOverlap(seance, other)) {
      conflicts.push({
        type: 'moniteur_double',
        severity: 'error',
        message: `Moniteur ${seance.moniteur?.surnom ?? ''} déjà assigné à cet horaire`,
        seance_id: other.id,
      })
    }
  }

  // Double booking salle
  for (const other of others.filter((s) => s.salle_id === seance.salle_id)) {
    if (seancesOverlap(seance, other)) {
      conflicts.push({
        type: 'salle_double',
        severity: 'error',
        message: `Salle ${seance.salle?.nom ?? ''} déjà occupée à cet horaire`,
        seance_id: other.id,
      })
    }
  }

  // Moniteur absent
  const jourDate = addDays(parseISO(semaineLundi), seance.jour_semaine - 1)
  const jourStr = format(jourDate, 'yyyy-MM-dd')
  for (const absence of absences.filter(
    (a) => a.moniteur_id === seance.moniteur_id
  )) {
    if (jourStr >= absence.date_debut && jourStr <= absence.date_fin) {
      conflicts.push({
        type: 'moniteur_absent',
        severity: 'error',
        message: `Moniteur ${seance.moniteur?.surnom ?? ''} absent (${absence.type}) ce jour`,
      })
    }
  }

  return conflicts
}

/**
 * Retourne toutes les séances en conflit dans un planning.
 */
export function conflictsParSeance(
  seances: Seance[],
  absences: Absence[],
  pauses: Pause[],
  semaineLundi: string
): Map<string, Conflict[]> {
  const map = new Map<string, Conflict[]>()
  for (const seance of seances) {
    const cs = detectConflicts(seance, seances, absences, pauses, semaineLundi)
    if (cs.length > 0) map.set(seance.id, cs)
  }
  return map
}
