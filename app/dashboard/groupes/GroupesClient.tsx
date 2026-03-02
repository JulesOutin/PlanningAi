'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { GroupeSchema, type Groupe, type GroupeInput } from '@/lib/types'
import { createGroupe, updateGroupe, deleteGroupe } from '@/app/actions/groupes'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const COULEURS_PRESET = [
  { label: 'Vert', hex: '#22c55e' },
  { label: 'Bleu', hex: '#3b82f6' },
  { label: 'Jaune', hex: '#eab308' },
  { label: 'Rouge', hex: '#ef4444' },
  { label: 'Violet', hex: '#a855f7' },
  { label: 'Orange', hex: '#f97316' },
]

export default function GroupesClient({ groupes }: { groupes: Groupe[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Groupe | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GroupeInput>({ resolver: zodResolver(GroupeSchema) })

  const watchedCouleur = watch('couleur_hex')

  function openCreate() {
    setEditTarget(null)
    reset({ semaine: '', nom: '', nom_couleur: '', couleur_hex: '#22c55e' })
    setOpen(true)
  }

  function openEdit(g: Groupe) {
    setEditTarget(g)
    reset({
      semaine: g.semaine,
      nom: g.nom,
      nom_couleur: g.nom_couleur,
      couleur_hex: g.couleur_hex,
    })
    setOpen(true)
  }

  async function onSubmit(data: GroupeInput) {
    setLoading(true)
    try {
      if (editTarget) {
        await updateGroupe(editTarget.id, data)
        toast.success('Groupe mis à jour')
      } else {
        await createGroupe(data)
        toast.success('Groupe créé')
      }
      setOpen(false)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, nom: string) {
    if (!confirm(`Supprimer le groupe "${nom}" ?`)) return
    try {
      await deleteGroupe(id)
      toast.success('Groupe supprimé')
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Groupes</h1>
          <p className="text-muted-foreground">{groupes.length} groupe(s)</p>
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
                <TableHead>Couleur</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Code couleur</TableHead>
                <TableHead>Semaine</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucun groupe.
                  </TableCell>
                </TableRow>
              )}
              {groupes.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <div
                      className="w-6 h-6 rounded-full border border-border"
                      style={{ backgroundColor: g.couleur_hex }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{g.nom}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{g.nom_couleur}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(parseISO(g.semaine), 'dd/MM/yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(g)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(g.id, g.nom)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Modifier' : 'Ajouter'} un groupe</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Semaine (lundi)</Label>
              <Input type="date" {...register('semaine')} />
              {errors.semaine && (
                <p className="text-sm text-destructive">{errors.semaine.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nom du groupe</Label>
              <Input placeholder="CAPa2.JP" {...register('nom')} />
              {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Code couleur</Label>
              <Input placeholder="GF_VERT" {...register('nom_couleur')} />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex gap-2 flex-wrap">
                {COULEURS_PRESET.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.label}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: c.hex,
                      borderColor: watchedCouleur === c.hex ? '#000' : 'transparent',
                    }}
                    onClick={() => setValue('couleur_hex', c.hex)}
                  />
                ))}
                <Input
                  type="color"
                  className="w-8 h-8 p-0 border rounded-full cursor-pointer"
                  {...register('couleur_hex')}
                />
              </div>
              {errors.couleur_hex && (
                <p className="text-sm text-destructive">{errors.couleur_hex.message}</p>
              )}
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
