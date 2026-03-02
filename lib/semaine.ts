import {
  startOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  format,
  getISOWeek,
  parseISO,
} from 'date-fns'
import { fr } from 'date-fns/locale'

/** Retourne le lundi de la semaine courante */
export function semaineCourante(): string {
  const lundi = startOfWeek(new Date(), { weekStartsOn: 1 })
  return format(lundi, 'yyyy-MM-dd')
}

/** Retourne le lundi de la semaine suivante */
export function semaineSuivante(semaine: string): string {
  return format(addWeeks(parseISO(semaine), 1), 'yyyy-MM-dd')
}

/** Retourne le lundi de la semaine précédente */
export function semainePrecedente(semaine: string): string {
  return format(subWeeks(parseISO(semaine), 1), 'yyyy-MM-dd')
}

/** Retourne le numéro ISO de la semaine (1–53) */
export function numeroSemaine(semaine: string): number {
  return getISOWeek(parseISO(semaine))
}

/** Retourne les 5 dates Lun–Ven pour une semaine donnée */
export function joursDeLaSemaine(semaine: string): Date[] {
  const lundi = parseISO(semaine)
  return Array.from({ length: 5 }, (_, i) => addDays(lundi, i))
}

/** Formate une date en "16/02" */
export function formatJourCourt(date: Date): string {
  return format(date, 'dd/MM')
}

/** Formate une date en "Lundi 16/02" */
export function formatJourLong(date: Date): string {
  return format(date, 'EEEE dd/MM', { locale: fr })
}

/** Formate une semaine en "16/02 → 20/02/2026" */
export function formatSemaineLabel(semaine: string): string {
  const jours = joursDeLaSemaine(semaine)
  const debut = format(jours[0], 'dd/MM')
  const fin = format(jours[4], 'dd/MM/yyyy')
  return `${debut} → ${fin}`
}

/** Noms des jours en français court */
export const JOURS_NOMS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']

/** Créneaux horaires de 08:00 à 18:00 par pas de 30 min */
export function creneauxHoraires(): string[] {
  const slots: string[] = []
  for (let h = 8; h < 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

/** Créneaux disponibles (hors pause 12:00–14:00) */
export function creneauxDisponibles(): string[] {
  return creneauxHoraires().filter((h) => {
    const [hh, mm] = h.split(':').map(Number)
    const minutes = hh * 60 + mm
    return !(minutes >= 12 * 60 && minutes < 14 * 60)
  })
}

/** Convertit "HH:MM" en minutes depuis minuit */
export function heureEnMinutes(heure: string): number {
  const [h, m] = heure.split(':').map(Number)
  return h * 60 + m
}

/** Vérifie si un créneau est dans la pause rouge */
export function estDansPause(heure: string, dureeMin: number): boolean {
  const debut = heureEnMinutes(heure)
  const fin = debut + dureeMin
  const pauseDebut = 12 * 60
  const pauseFin = 14 * 60
  return debut < pauseFin && pauseDebut < fin
}
