'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { updatePrevision } from '@/app/actions/previsions'
import type { Groupe, PrevisionHeure } from '@/lib/types'

interface Props {
  previsions: PrevisionHeure[]
  groupes: Groupe[]
}

// minutes → "585 H 00"
function hm(minutes: number): string {
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${minutes < 0 ? '-' : ''}${h} H ${String(m).padStart(2, '0')}`
}

// "585 H 00" → minutes (parse helper for HH + MM inputs)
function toMin(h: number, m: number) {
  return h * 60 + m
}

function splitMin(minutes: number) {
  const abs = Math.abs(minutes)
  return { h: Math.floor(abs / 60), m: abs % 60 }
}

interface EditState {
  prevision: PrevisionHeure
  prevH: number; prevM: number
  elevH: number; elevM: number
  realH: number; realM: number
}

export default function PrevisionsClient({ previsions: initial, groupes }: Props) {
  const [rows, setRows] = useState<PrevisionHeure[]>(initial)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)

  // index groupes by nom_couleur for color lookup
  const groupeByNom = new Map(groupes.map((g) => [g.nom_couleur, g]))

  // totals
  const totPrev = rows.reduce((s, r) => s + r.h_prevision, 0)
  const totElev = rows.reduce((s, r) => s + r.h_eleves_realisees, 0)
  const totReal = rows.reduce((s, r) => s + r.h_realisees, 0)
  const totDiff = totReal - totPrev

  function openEdit(p: PrevisionHeure) {
    const { h: prevH, m: prevM } = splitMin(p.h_prevision)
    const { h: elevH, m: elevM } = splitMin(p.h_eleves_realisees)
    const { h: realH, m: realM } = splitMin(p.h_realisees)
    setEdit({ prevision: p, prevH, prevM, elevH, elevM, realH, realM })
  }

  async function handleSave() {
    if (!edit) return
    setSaving(true)
    const fields = {
      h_prevision: toMin(edit.prevH, edit.prevM),
      h_eleves_realisees: toMin(edit.elevH, edit.elevM),
      h_realisees: toMin(edit.realH, edit.realM),
    }
    try {
      await updatePrevision(edit.prevision.id, fields)
      setRows((prev) =>
        prev.map((r) => (r.id === edit.prevision.id ? { ...r, ...fields } : r))
      )
      toast.success('Mis à jour')
      setEdit(null)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  // Group rows by type_formation
  const types = [...new Set(rows.map((r) => r.type_formation))]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prévisions d&apos;heures</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Suivi H prévision / H élèves réalisées / H réalisées par formation
        </p>
      </div>

      {types.map((type) => {
        const typeRows = rows.filter((r) => r.type_formation === type)
        const typeLabel =
          type === 'FI' ? 'Formation initiale' : type === 'APP' ? 'Apprentissage' : 'Formation continue'

        return (
          <div key={type} className="rounded-lg border overflow-hidden">
            {/* Section header */}
            <div className="bg-slate-50 px-4 py-2 border-b flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">{type}</Badge>
              <span className="font-semibold text-sm">{typeLabel}</span>
              <span className="text-xs text-muted-foreground ml-auto">{typeRows.length} formations</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="text-left px-4 py-2 w-40">Groupe</th>
                    <th className="text-left px-4 py-2">Formation</th>
                    <th className="text-right px-4 py-2 w-36">H Prévision</th>
                    <th className="text-right px-4 py-2 w-44">H Élèves Réalisées</th>
                    <th className="text-right px-4 py-2 w-36">H Réalisées</th>
                    <th className="text-right px-4 py-2 w-36">H Différence</th>
                    <th className="w-12 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {typeRows.map((row, idx) => {
                    const diff = row.h_realisees - row.h_prevision
                    const groupe = groupeByNom.get(row.nom_groupe)
                    return (
                      <tr
                        key={row.id}
                        className={cn('border-b last:border-0 hover:bg-slate-50/50 transition-colors', idx % 2 === 0 ? '' : 'bg-slate-50/30')}
                      >
                        {/* Groupe */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            {groupe ? (
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10"
                                style={{ backgroundColor: groupe.couleur_hex }}
                              />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-300" />
                            )}
                            <span className="font-mono text-xs font-semibold">{row.nom_groupe}</span>
                          </div>
                        </td>

                        {/* Formation */}
                        <td className="px-4 py-2.5 text-muted-foreground">{row.formation_complete}</td>

                        {/* H Prévision */}
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                          {row.h_prevision === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : hm(row.h_prevision)}
                        </td>

                        {/* H Élèves Réalisées */}
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-blue-700">
                          {hm(row.h_eleves_realisees)}
                        </td>

                        {/* H Réalisées */}
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                          {hm(row.h_realisees)}
                        </td>

                        {/* H Différence */}
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold">
                          {row.h_prevision === 0 ? (
                            <span className={cn('text-green-600')}>+{hm(row.h_realisees)}</span>
                          ) : (
                            <span className={cn(diff >= 0 ? 'text-green-600' : 'text-red-600')}>
                              {hm(diff)}
                            </span>
                          )}
                        </td>

                        {/* Edit */}
                        <td className="px-2 py-2.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>

                {/* Sous-total par type */}
                <tfoot>
                  <tr className="bg-slate-100 font-semibold text-sm border-t-2">
                    <td className="px-4 py-2.5" colSpan={2}>Sous-total {typeLabel}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {hm(typeRows.reduce((s, r) => s + r.h_prevision, 0))}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-blue-700">
                      {hm(typeRows.reduce((s, r) => s + r.h_eleves_realisees, 0))}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {hm(typeRows.reduce((s, r) => s + r.h_realisees, 0))}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {(() => {
                        const d = typeRows.reduce((s, r) => s + r.h_realisees - r.h_prevision, 0)
                        return <span className={d >= 0 ? 'text-green-600' : 'text-red-600'}>{hm(d)}</span>
                      })()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )
      })}

      {/* TOTAL GÉNÉRAL */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm font-bold">
          <tbody>
            <tr className="bg-slate-900 text-white">
              <td className="px-4 py-3 w-40" />
              <td className="px-4 py-3">TOTAL GÉNÉRAL</td>
              <td className="px-4 py-3 text-right font-mono tabular-nums w-36">{hm(totPrev)}</td>
              <td className="px-4 py-3 text-right font-mono tabular-nums w-44 text-blue-300">{hm(totElev)}</td>
              <td className="px-4 py-3 text-right font-mono tabular-nums w-36">{hm(totReal)}</td>
              <td className="px-4 py-3 text-right font-mono tabular-nums w-36">
                <span className={totDiff >= 0 ? 'text-green-400' : 'text-red-400'}>{hm(totDiff)}</span>
              </td>
              <td className="w-12" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Dialog édition */}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Modifier — {edit?.prevision.nom_groupe}</DialogTitle>
          </DialogHeader>

          {edit && (
            <div className="space-y-4 py-2">
              {/* H Prévision */}
              <div className="space-y-1">
                <Label>H Prévision</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number" min={0} max={9999}
                    value={edit.prevH}
                    onChange={(e) => setEdit((s) => s && { ...s, prevH: Number(e.target.value) })}
                    className="w-24 text-right font-mono"
                  />
                  <span className="text-muted-foreground">H</span>
                  <Input
                    type="number" min={0} max={59}
                    value={edit.prevM}
                    onChange={(e) => setEdit((s) => s && { ...s, prevM: Number(e.target.value) })}
                    className="w-20 text-right font-mono"
                  />
                  <span className="text-muted-foreground">min</span>
                </div>
              </div>

              {/* H Élèves Réalisées */}
              <div className="space-y-1">
                <Label>H Élèves Réalisées</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number" min={0} max={9999}
                    value={edit.elevH}
                    onChange={(e) => setEdit((s) => s && { ...s, elevH: Number(e.target.value) })}
                    className="w-24 text-right font-mono"
                  />
                  <span className="text-muted-foreground">H</span>
                  <Input
                    type="number" min={0} max={59}
                    value={edit.elevM}
                    onChange={(e) => setEdit((s) => s && { ...s, elevM: Number(e.target.value) })}
                    className="w-20 text-right font-mono"
                  />
                  <span className="text-muted-foreground">min</span>
                </div>
              </div>

              {/* H Réalisées */}
              <div className="space-y-1">
                <Label>H Réalisées</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number" min={0} max={9999}
                    value={edit.realH}
                    onChange={(e) => setEdit((s) => s && { ...s, realH: Number(e.target.value) })}
                    className="w-24 text-right font-mono"
                  />
                  <span className="text-muted-foreground">H</span>
                  <Input
                    type="number" min={0} max={59}
                    value={edit.realM}
                    onChange={(e) => setEdit((s) => s && { ...s, realM: Number(e.target.value) })}
                    className="w-20 text-right font-mono"
                  />
                  <span className="text-muted-foreground">min</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
