'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AbsenceSchema, type Absence, type AbsenceInput, type Moniteur } from '@/lib/types'
import { createAbsence, updateAbsence, deleteAbsence } from '@/app/actions/absences'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const TYPE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'warning' }> = {
  RTT: { label: 'RTT', variant: 'secondary' },
  maladie: { label: 'Maladie', variant: 'warning' },
  arret_travail: { label: 'Arrêt travail', variant: 'destructive' },
  autre: { label: 'Autre', variant: 'outline' as 'default' },
}

export default function AbsencesClient({
  absences,
  moniteurs,
}: {
  absences: Absence[]
  moniteurs: Moniteur[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Absence | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AbsenceInput>({ resolver: zodResolver(AbsenceSchema) })

  function openCreate() {
    setEditTarget(null)
    reset({ moniteur_id: '', date_debut: '', date_fin: '', type: 'RTT', commentaire: '' })
    setOpen(true)
  }

  function openEdit(a: Absence) {
    setEditTarget(a)
    reset({
      moniteur_id: a.moniteur_id,
      date_debut: a.date_debut,
      date_fin: a.date_fin,
      type: a.type,
      commentaire: a.commentaire ?? '',
    })
    setOpen(true)
  }

  async function onSubmit(data: AbsenceInput) {
    setLoading(true)
    try {
      if (editTarget) {
        await updateAbsence(editTarget.id, data)
        toast.success('Absence mise à jour')
      } else {
        await createAbsence(data)
        toast.success('Absence créée')
      }
      setOpen(false)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette absence ?')) return
    try {
      await deleteAbsence(id)
      toast.success('Absence supprimée')
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Absences / RTT</h1>
          <p className="text-muted-foreground">{absences.length} absence(s)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Moniteur</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Du</TableHead>
                <TableHead>Au</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {absences.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucune absence.
                  </TableCell>
                </TableRow>
              )}
              {absences.map((a) => {
                const typeInfo = TYPE_LABELS[a.type]
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <span className="font-mono font-bold bg-slate-100 px-2 py-1 rounded text-sm">
                        {a.moniteur?.surnom}
                      </span>
                      <span className="ml-2 text-sm text-muted-foreground">{a.moniteur?.nom}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeInfo.variant as 'default'}>{typeInfo.label}</Badge>
                    </TableCell>
                    <TableCell>{format(parseISO(a.date_debut), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                    <TableCell>{format(parseISO(a.date_fin), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {a.commentaire ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(a.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Modifier' : 'Ajouter'} une absence</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Moniteur</Label>
              <Controller
                name="moniteur_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un moniteur" />
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
              {errors.moniteur_id && (
                <p className="text-sm text-destructive">{errors.moniteur_id.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Du</Label>
                <Input type="date" {...register('date_debut')} />
                {errors.date_debut && (
                  <p className="text-sm text-destructive">{errors.date_debut.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Au</Label>
                <Input type="date" {...register('date_fin')} />
                {errors.date_fin && (
                  <p className="text-sm text-destructive">{errors.date_fin.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RTT">RTT</SelectItem>
                      <SelectItem value="maladie">Maladie</SelectItem>
                      <SelectItem value="arret_travail">Arrêt de travail</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Commentaire (optionnel)</Label>
              <Input placeholder="..." {...register('commentaire')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editTarget ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
