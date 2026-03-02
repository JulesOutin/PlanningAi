import { z } from 'zod'

// ─── Database entity types ───────────────────────────────────────────────────

export type Moniteur = {
  id: string
  nom: string
  surnom: string
  created_at: string
}

export type Salle = {
  id: string
  nom: string
  created_at: string
}

export type Groupe = {
  id: string
  semaine: string        // ISO date lundi de la semaine
  nom: string           // ex: "CAPa2.JP"
  nom_couleur: string   // ex: "GF_VERT"
  couleur_hex: string   // ex: "#00FF00"
  created_at: string
}

export type TypeCours = {
  id: string
  nom: string           // ex: "Français MG2"
  duree_minutes: 60 | 120 | 180 | 240
}

export type Absence = {
  id: string
  moniteur_id: string
  date_debut: string
  date_fin: string
  type: 'RTT' | 'maladie' | 'arret_travail' | 'autre'
  commentaire: string | null
  moniteur?: Moniteur
}

export type Pause = {
  id: string
  jour_semaine: 1 | 2 | 3 | 4 | 5
  heure_debut: string   // "12:00"
  heure_fin: string     // "14:00"
  couleur: string
}

export type Planning = {
  id: string
  semaine: string       // ISO date lundi
  statut: 'brouillon' | 'valide' | 'publie'
  valide_par: string | null
  valide_le: string | null
  created_at: string
  updated_at: string
}

export type Seance = {
  id: string
  planning_id: string
  groupe_id: string
  moniteur_id: string
  salle_id: string
  type_cours_id: string
  jour_semaine: 1 | 2 | 3 | 4 | 5
  heure_debut: string   // "08:00"
  created_at: string
  // Relations (joins)
  groupe?: Groupe
  moniteur?: Moniteur
  salle?: Salle
  type_cours?: TypeCours
}

// ─── Conflict detection types ─────────────────────────────────────────────────

export type ConflictType =
  | 'moniteur_double'
  | 'salle_double'
  | 'moniteur_absent'
  | 'pause_rouge'
  | 'chevauchement'

export type ConflictSeverity = 'error' | 'warning'

export type Conflict = {
  type: ConflictType
  severity: ConflictSeverity
  message: string
  seance_id?: string
}

export type PrevisionHeure = {
  id: string
  nom_groupe: string        // correspond à groupes.nom_couleur
  formation_complete: string
  type_formation: string   // 'FI' | 'APP' | 'FC'
  h_prevision: number      // en minutes
  h_eleves_realisees: number
  h_realisees: number
  ordre: number
  created_at: string
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const MoniteurSchema = z.object({
  nom: z.string().min(2, 'Nom trop court').max(100),
  surnom: z.string().min(1, 'Surnom requis').max(10, 'Max 10 caractères'),
})

export const SalleSchema = z.object({
  nom: z.string().min(2, 'Nom trop court').max(50),
})

export const GroupeSchema = z.object({
  semaine: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  nom: z.string().min(2, 'Nom trop court').max(50),
  nom_couleur: z.string().min(2).max(20),
  couleur_hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hex invalide (ex: #00FF00)'),
})

export const TypeCoursSchema = z.object({
  nom: z.string().min(2, 'Nom trop court').max(100),
  duree_minutes: z.union([
    z.literal(60),
    z.literal(120),
    z.literal(180),
    z.literal(240),
  ]),
})

export const AbsenceSchema = z
  .object({
    moniteur_id: z.string().uuid('Moniteur invalide'),
    date_debut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
    date_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
    type: z.enum(['RTT', 'maladie', 'arret_travail', 'autre']),
    commentaire: z.string().optional(),
  })
  .refine((d) => d.date_fin >= d.date_debut, {
    message: 'Date fin doit être >= date début',
    path: ['date_fin'],
  })

export const SeanceSchema = z.object({
  planning_id: z.string().uuid(),
  groupe_id: z.string().uuid('Groupe invalide'),
  moniteur_id: z.string().uuid('Moniteur invalide'),
  salle_id: z.string().uuid('Salle invalide'),
  type_cours_id: z.string().uuid('Type de cours invalide'),
  jour_semaine: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  heure_debut: z.string().regex(/^\d{2}:\d{2}$/, 'Heure invalide (HH:MM)'),
})

export type MoniteurInput = z.infer<typeof MoniteurSchema>
export type SalleInput = z.infer<typeof SalleSchema>
export type GroupeInput = z.infer<typeof GroupeSchema>
export type TypeCoursInput = z.infer<typeof TypeCoursSchema>
export type AbsenceInput = z.infer<typeof AbsenceSchema>
export type SeanceInput = z.infer<typeof SeanceSchema>
