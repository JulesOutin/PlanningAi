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
import { SalleSchema, type Salle, type SalleInput } from '@/lib/types'
import { createSalle, updateSalle, deleteSalle } from '@/app/actions/salles'

export default function SallesClient({ salles }: { salles: Salle[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Salle | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SalleInput>({ resolver: zodResolver(SalleSchema) })

  function openCreate() {
    setEditTarget(null)
    reset({ nom: '' })
    setOpen(true)
  }

  function openEdit(s: Salle) {
    setEditTarget(s)
    reset({ nom: s.nom })
    setOpen(true)
  }

  async function onSubmit(data: SalleInput) {
    setLoading(true)
    try {
      if (editTarget) {
        await updateSalle(editTarget.id, data)
        toast.success('Salle mise à jour')
      } else {
        await createSalle(data)
        toast.success('Salle créée')
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
    if (!confirm(`Supprimer la salle "${nom}" ?`)) return
    try {
      await deleteSalle(id)
      toast.success('Salle supprimée')
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Salles</h1>
          <p className="text-muted-foreground">{salles.length} salle(s)</p>
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
                <TableHead>Nom de la salle</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                    Aucune salle. Cliquez sur &quot;Ajouter&quot;.
                  </TableCell>
                </TableRow>
              )}
              {salles.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.nom}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(s.id, s.nom)}
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
            <DialogTitle>{editTarget ? 'Modifier' : 'Ajouter'} une salle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" placeholder="SALLE MULTIMEDIA" {...register('nom')} />
              {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
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
