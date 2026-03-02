'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { MoniteurSchema, type Moniteur, type MoniteurInput } from '@/lib/types'
import { createMoniteur, updateMoniteur, deleteMoniteur } from '@/app/actions/moniteurs'
import { useRouter } from 'next/navigation'

interface Props {
  moniteurs: Moniteur[]
}

export default function MoniteursClient({ moniteurs }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Moniteur | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MoniteurInput>({ resolver: zodResolver(MoniteurSchema) })

  function openCreate() {
    setEditTarget(null)
    reset({ nom: '', surnom: '' })
    setOpen(true)
  }

  function openEdit(m: Moniteur) {
    setEditTarget(m)
    reset({ nom: m.nom, surnom: m.surnom })
    setOpen(true)
  }

  async function onSubmit(data: MoniteurInput) {
    setLoading(true)
    try {
      if (editTarget) {
        await updateMoniteur(editTarget.id, data)
        toast.success('Moniteur mis à jour')
      } else {
        await createMoniteur(data)
        toast.success('Moniteur créé')
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
    if (!confirm(`Supprimer le moniteur "${nom}" ?`)) return
    try {
      await deleteMoniteur(id)
      toast.success('Moniteur supprimé')
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Moniteurs</h1>
          <p className="text-muted-foreground">{moniteurs.length} moniteur(s) enregistré(s)</p>
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
                <TableHead>Surnom</TableHead>
                <TableHead>Nom complet</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {moniteurs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Aucun moniteur. Cliquez sur &quot;Ajouter&quot; pour commencer.
                  </TableCell>
                </TableRow>
              )}
              {moniteurs.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <span className="font-mono font-bold bg-slate-100 px-2 py-1 rounded">
                      {m.surnom}
                    </span>
                  </TableCell>
                  <TableCell>{m.nom}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(m.id, m.nom)}
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
            <DialogTitle>{editTarget ? 'Modifier' : 'Ajouter'} un moniteur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="surnom">Surnom (2–3 lettres)</Label>
              <Input id="surnom" placeholder="CG" {...register('surnom')} />
              {errors.surnom && (
                <p className="text-sm text-destructive">{errors.surnom.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom complet</Label>
              <Input id="nom" placeholder="Claude Gautier" {...register('nom')} />
              {errors.nom && (
                <p className="text-sm text-destructive">{errors.nom.message}</p>
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
