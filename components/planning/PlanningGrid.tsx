'use client'

import { useState, useCallback, useTransition, useMemo } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { addDays, format, parseISO } from 'date-fns'
import { TooltipProvider } from '@/components/ui/tooltip'
import SeanceCard from './SeanceCard'
import type { Absence, Groupe, Pause, Planning, Seance, TypeCours, Moniteur, Salle } from '@/lib/types'
import { conflictsParSeance } from '@/lib/conflicts'
import { JOURS_NOMS, joursDeLaSemaine, formatJourCourt, heureEnMinutes } from '@/lib/semaine'
import { deleteSeance, updateSeance } from '@/app/actions/seances'
import AddSeanceModal from '../modals/AddSeanceModal'
import EditSeanceModal from '../modals/EditSeanceModal'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Props {
  planning: Planning
  seances: Seance[]
  groupes: Groupe[]
  moniteurs: Moniteur[]
  salles: Salle[]
  typesCours: TypeCours[]
  absences: Absence[]
  pauses: Pause[]
}

type CellTarget = { groupeId: string; jourSemaine: number }

export default function PlanningGrid({
  planning,
  seances: initialSeances,
  groupes,
  moniteurs,
  salles,
  typesCours,
  absences,
  pauses,
}: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [seances, setSeances] = useState(initialSeances)
  const [draggedSeance, setDraggedSeance] = useState<Seance | null>(null)
  const [dropTarget, setDropTarget] = useState<CellTarget | null>(null)
  const [addModal, setAddModal] = useState<CellTarget | null>(null)
  const [editSeance, setEditSeance] = useState<Seance | null>(null)

  const jours = joursDeLaSemaine(planning.semaine)
  const conflictsMap = conflictsParSeance(seances, absences, pauses, planning.semaine)

  // Pauses grouped by day
  const pausesByDay = useMemo(() => {
    const map = new Map<number, Pause[]>()
    for (const p of pauses) {
      if (!map.has(p.jour_semaine)) map.set(p.jour_semaine, [])
      map.get(p.jour_semaine)!.push(p)
    }
    map.forEach((ps) => ps.sort((a, b) => a.heure_debut.localeCompare(b.heure_debut)))
    return map
  }, [pauses])

  // Absent moniteur surnoms per day (1–5)
  const absentsByDay = useMemo(() => {
    const map = new Map<number, string[]>()
    for (let j = 1; j <= 5; j++) {
      const jourDate = addDays(parseISO(planning.semaine), j - 1)
      const jourStr = format(jourDate, 'yyyy-MM-dd')
      const absents = absences
        .filter((a) => jourStr >= a.date_debut && jourStr <= a.date_fin)
        .map((a) => `${a.moniteur?.surnom ?? '?'} (${a.type})`)
      if (absents.length > 0) map.set(j, absents)
    }
    return map
  }, [absences, planning.semaine])

  // Seances grouped by (groupeId, jourSemaine)
  const seancesMap = useCallback(() => {
    const map = new Map<string, Seance[]>()
    for (const s of seances) {
      const key = `${s.groupe_id}-${s.jour_semaine}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    map.forEach((ss) => ss.sort((a, b) => a.heure_debut.localeCompare(b.heure_debut)))
    return map
  }, [seances])()

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette séance ?')) return
    setSeances((prev) => prev.filter((s) => s.id !== id))
    try {
      await deleteSeance(id)
      toast.success('Supprimée')
      startTransition(() => router.refresh())
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
      router.refresh()
    }
  }

  function handleDragStart(seance: Seance) {
    setDraggedSeance(seance)
  }

  function handleDragOver(e: React.DragEvent, cell: CellTarget) {
    e.preventDefault()
    setDropTarget(cell)
  }

  function handleDragLeave() {
    setDropTarget(null)
  }

  async function handleDrop(e: React.DragEvent, cell: CellTarget) {
    e.preventDefault()
    setDropTarget(null)
    if (!draggedSeance) return
    if (
      draggedSeance.groupe_id === cell.groupeId &&
      draggedSeance.jour_semaine === cell.jourSemaine
    ) {
      setDraggedSeance(null)
      return
    }

    setSeances((prev) =>
      prev.map((s) =>
        s.id === draggedSeance.id
          ? { ...s, groupe_id: cell.groupeId, jour_semaine: cell.jourSemaine as 1 | 2 | 3 | 4 | 5 }
          : s
      )
    )
    setDraggedSeance(null)

    try {
      await updateSeance(draggedSeance.id, {
        groupe_id: cell.groupeId,
        jour_semaine: cell.jourSemaine as 1 | 2 | 3 | 4 | 5,
      })
      toast.success('Déplacée')
      startTransition(() => router.refresh())
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
      router.refresh()
    }
  }

  function handleSeanceAdded(newSeance: Seance) {
    setSeances((prev) => [...prev, newSeance])
    startTransition(() => router.refresh())
  }

  function handleSeanceUpdated(updated: Seance) {
    setSeances((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    startTransition(() => router.refresh())
  }

  const isReadonly = planning.statut === 'publie'

  // "10:15:00" → "10:15"
  function formatTime(t: string) {
    return t.length > 5 ? t.substring(0, 5) : t
  }

  function getMergedItems(cellSeances: Seance[], dayPauses: Pause[]) {
    return [
      ...cellSeances.map((s) => ({ type: 'seance' as const, time: heureEnMinutes(s.heure_debut), data: s })),
      ...dayPauses.map((p) => ({ type: 'pause' as const, time: heureEnMinutes(p.heure_debut), data: p })),
    ].sort((a, b) => a.time - b.time)
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border text-sm min-w-[900px]">
          <thead>
            {/* Jours */}
            <tr className="bg-slate-50">
              <th className="border border-border p-3 text-left font-semibold w-32 min-w-[128px]">
                Groupe
              </th>
              {jours.map((jour, i) => {
                const jourNum = i + 1
                const absents = absentsByDay.get(jourNum) ?? []
                return (
                  <th key={i} className="border border-border p-2 text-center font-semibold min-w-[160px]">
                    <div>{JOURS_NOMS[i]}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {formatJourCourt(jour)}
                    </div>
                    {/* Absents du jour */}
                    {absents.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {absents.map((a, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-orange-100 text-orange-700 rounded px-1 py-0.5 font-normal"
                          >
                            🏖 {a}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>

          </thead>

          <tbody>
            {groupes.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-border p-8 text-center text-muted-foreground">
                  Aucun groupe pour cette semaine.
                  <br />
                  Ajoutez des groupes dans la section &quot;Groupes&quot;.
                </td>
              </tr>
            ) : (
              groupes.map((groupe) => (
                <tr key={groupe.id}>
                  {/* Groupe label */}
                  <td className="border border-border p-2 align-top">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: groupe.couleur_hex }}
                      />
                      <div>
                        <p className="font-bold text-xs leading-tight">{groupe.nom_couleur}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{groupe.nom}</p>
                      </div>
                    </div>
                  </td>

                  {/* Day cells */}
                  {[1, 2, 3, 4, 5].map((jourNum) => {
                    const key = `${groupe.id}-${jourNum}`
                    const cellSeances = seancesMap.get(key) ?? []
                    const isTarget =
                      dropTarget?.groupeId === groupe.id &&
                      dropTarget?.jourSemaine === jourNum

                    return (
                      <td
                        key={jourNum}
                        className={cn(
                          'border border-border p-1.5 align-top min-h-[100px]',
                          isTarget && 'bg-primary/5 outline-2 outline-dashed outline-primary'
                        )}
                        onDragOver={(e) =>
                          !isReadonly && handleDragOver(e, { groupeId: groupe.id, jourSemaine: jourNum })
                        }
                        onDragLeave={handleDragLeave}
                        onDrop={(e) =>
                          !isReadonly && handleDrop(e, { groupeId: groupe.id, jourSemaine: jourNum })
                        }
                      >
                        {/* Séances + pauses intercalées */}
                        {getMergedItems(cellSeances, pausesByDay.get(jourNum) ?? []).map((item, idx) =>
                          item.type === 'pause' ? (
                            <div
                              key={`pause-${item.data.id}-${idx}`}
                              className="flex items-center gap-1 my-1 select-none"
                            >
                              <div className="flex-1 h-px bg-red-300" />
                              <span className="text-[10px] text-red-500 whitespace-nowrap font-medium">
                                🔴 {formatTime(item.data.heure_debut)}–{formatTime(item.data.heure_fin)}
                              </span>
                              <div className="flex-1 h-px bg-red-300" />
                            </div>
                          ) : (
                            <SeanceCard
                              key={item.data.id}
                              seance={item.data}
                              conflicts={conflictsMap.get(item.data.id) ?? []}
                              onDelete={handleDelete}
                              onDragStart={handleDragStart}
                              onClick={(seance) => !isReadonly && setEditSeance(seance)}
                            />
                          )
                        )}

                        {/* Bouton + */}
                        {!isReadonly && (
                          <button
                            type="button"
                            className="w-full mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded py-1 transition-colors border border-dashed border-border hover:border-primary"
                            onClick={() =>
                              setAddModal({ groupeId: groupe.id, jourSemaine: jourNum })
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {addModal && (
        <AddSeanceModal
          open={!!addModal}
          onClose={() => setAddModal(null)}
          planning={planning}
          groupeId={addModal.groupeId}
          jourSemaine={addModal.jourSemaine}
          groupes={groupes}
          moniteurs={moniteurs}
          salles={salles}
          typesCours={typesCours}
          allSeances={seances}
          absences={absences}
          pauses={pauses}
          onSeanceAdded={handleSeanceAdded}
        />
      )}

      {editSeance && (
        <EditSeanceModal
          open={!!editSeance}
          onClose={() => setEditSeance(null)}
          seance={editSeance}
          groupes={groupes}
          moniteurs={moniteurs}
          salles={salles}
          typesCours={typesCours}
          allSeances={seances}
          absences={absences}
          pauses={pauses}
          onSeanceUpdated={handleSeanceUpdated}
          planning={planning}
        />
      )}
    </TooltipProvider>
  )
}
