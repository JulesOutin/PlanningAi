'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  SeanceSchema,
  type SeanceInput,
  type Groupe,
  type Moniteur,
  type Salle,
  type TypeCours,
  type Seance,
  type Planning,
  type Absence,
  type Pause,
} from '@/lib/types'
import { updateSeance } from '@/app/actions/seances'
import { creneauxDisponibles } from '@/lib/semaine'
import { detectConflicts } from '@/lib/conflicts'

interface Props {
  open: boolean
  onClose: () => void
  seance: Seance
  planning: Planning
  groupes: Groupe[]
  moniteurs: Moniteur[]
  salles: Salle[]
  typesCours: TypeCours[]
  allSeances: Seance[]
  absences: Absence[]
  pauses: Pause[]
  onSeanceUpdated: (seance: Seance) => void
}

export default function EditSeanceModal({
  open,
  onClose,
  seance,
  planning,
  groupes,
  moniteurs,
  salles,
  typesCours,
  allSeances,
  absences,
  pauses,
  onSeanceUpdated,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [liveConflicts, setLiveConflicts] = useState<string[]>([])
  const creneaux = creneauxDisponibles()

  const {
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<SeanceInput>({
    resolver: zodResolver(SeanceSchema),
    defaultValues: {
      planning_id: seance.planning_id,
      groupe_id: seance.groupe_id,
      moniteur_id: seance.moniteur_id,
      salle_id: seance.salle_id,
      type_cours_id: seance.type_cours_id,
      jour_semaine: seance.jour_semaine,
      heure_debut: seance.heure_debut,
    },
  })

  useEffect(() => {
    reset({
      planning_id: seance.planning_id,
      groupe_id: seance.groupe_id,
      moniteur_id: seance.moniteur_id,
      salle_id: seance.salle_id,
      type_cours_id: seance.type_cours_id,
      jour_semaine: seance.jour_semaine,
      heure_debut: seance.heure_debut,
    })
    setLiveConflicts([])
  }, [seance, reset])

  const watchedFields = watch()
  useEffect(() => {
    if (!watchedFields.moniteur_id || !watchedFields.salle_id || !watchedFields.type_cours_id)
      return

    const typeCours = typesCours.find((t) => t.id === watchedFields.type_cours_id)
    const moniteur = moniteurs.find((m) => m.id === watchedFields.moniteur_id)
    const salle = salles.find((s) => s.id === watchedFields.salle_id)
    const groupe = groupes.find((g) => g.id === watchedFields.groupe_id)

    const tempSeance: Seance = {
      ...seance,
      ...watchedFields,
      type_cours: typeCours,
      moniteur,
      salle,
      groupe,
    }

    const cs = detectConflicts(tempSeance, allSeances, absences, pauses, planning.semaine)
    setLiveConflicts(cs.map((c) => c.message))
  }, [
    watchedFields.moniteur_id,
    watchedFields.salle_id,
    watchedFields.type_cours_id,
    watchedFields.heure_debut,
    watchedFields.jour_semaine,
    watchedFields.groupe_id,
    allSeances,
    absences,
    pauses,
    planning.semaine,
    typesCours,
    moniteurs,
    salles,
    groupes,
    seance,
    watchedFields,
  ])

  async function onSubmit(data: SeanceInput) {
    setLoading(true)
    try {
      await updateSeance(seance.id, data)

      const typeCours = typesCours.find((t) => t.id === data.type_cours_id)
      const moniteur = moniteurs.find((m) => m.id === data.moniteur_id)
      const salle = salles.find((s) => s.id === data.salle_id)
      const groupe = groupes.find((g) => g.id === data.groupe_id)

      const updated: Seance = {
        ...seance,
        ...data,
        type_cours: typeCours,
        moniteur,
        salle,
        groupe,
      }

      toast.success('Séance mise à jour')
      onSeanceUpdated(updated)
      onClose()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier la séance</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Groupe</Label>
              <Controller
                name="groupe_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groupes.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ backgroundColor: g.couleur_hex }}
                            />
                            {g.nom_couleur}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Jour</Label>
              <Controller
                name="jour_semaine"
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((j, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {j}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cours</Label>
            <Controller
              name="type_cours_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typesCours.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nom} ({t.duree_minutes / 60}h)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type_cours_id && (
              <p className="text-xs text-destructive">{errors.type_cours_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Moniteur</Label>
              <Controller
                name="moniteur_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {moniteurs.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.surnom} — {m.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Salle</Label>
              <Controller
                name="salle_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {salles.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Heure de début</Label>
            <Controller
              name="heure_debut"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {creneaux.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {liveConflicts.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
              <p className="text-sm font-medium text-red-700 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Conflits détectés
              </p>
              {liveConflicts.map((msg, i) => (
                <p key={i} className="text-xs text-red-600">
                  • {msg}
                </p>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
