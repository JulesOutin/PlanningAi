'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Wand2,
  BookOpen,
  Users,
  CalendarDays,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { Moniteur, TypeCours } from '@/lib/types'
import {
  upsertModelePlanning,
  deleteModelePlanning,
  toggleMoniteurTypeCours,
  upsertDisponibiliteMoniteur,
  upsertCalendrierGroupe,
  genererPlanning,
} from '@/app/actions/auto-planning'
import { semaineCourante, JOURS_NOMS } from '@/lib/semaine'
import { format, parseISO, addWeeks } from 'date-fns'
import { fr } from 'date-fns/locale'

// Types retournés par les actions
type Modele = { id: string; nom_couleur: string; type_cours_id: string; heures_par_semaine: number; type_cours?: TypeCours }
type MoniteurCours = { moniteur_id: string; type_cours_id: string; moniteur?: Moniteur; type_cours?: TypeCours }
type Disponibilite = { moniteur_id: string; heures_max_semaine: number; moniteur?: Moniteur }
type Calendrier = { id: string; semaine: string; nom_couleur: string; type: 'cours' | 'stage' }

interface Props {
  moniteurs: Moniteur[]
  typesCours: TypeCours[]
  modeles: Modele[]
  moniteurCours: MoniteurCours[]
  disponibilites: Disponibilite[]
  calendrier: Calendrier[]
}

const TABS = [
  { id: 'modeles', label: 'Modèles de cours', icon: BookOpen },
  { id: 'moniteurs', label: 'Moniteurs', icon: Users },
  { id: 'calendrier', label: 'Calendrier apprentis', icon: CalendarDays },
  { id: 'generer', label: 'Générer', icon: Wand2 },
]

export default function AutoPlanningClient({
  moniteurs,
  typesCours,
  modeles: initialModeles,
  moniteurCours: initialMC,
  disponibilites: initialDispos,
  calendrier: initialCal,
}: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState('modeles')

  // ─── Modèles ─────────────────────────────────────────────────
  const [modeles] = useState(initialModeles)
  const [newModeleNomCouleur, setNewModeleNomCouleur] = useState('')
  const [newModeleCoursId, setNewModeleCoursId] = useState('')
  const [newModeleHeures, setNewModeleHeures] = useState('2')
  const [savingModele, setSavingModele] = useState(false)

  async function handleAddModele() {
    if (!newModeleNomCouleur || !newModeleCoursId || !newModeleHeures) {
      toast.error('Remplissez tous les champs')
      return
    }
    setSavingModele(true)
    try {
      await upsertModelePlanning(newModeleNomCouleur, newModeleCoursId, Number(newModeleHeures))
      toast.success('Modèle enregistré')
      setNewModeleNomCouleur('')
      setNewModeleCoursId('')
      setNewModeleHeures('2')
      startTransition(() => router.refresh())
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSavingModele(false)
    }
  }

  async function handleDeleteModele(id: string) {
    try {
      await deleteModelePlanning(id)
      toast.success('Supprimé')
      startTransition(() => router.refresh())
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  // ─── Moniteurs ───────────────────────────────────────────────
  const [moniteurCours] = useState(initialMC)
  const [disponibilites] = useState(initialDispos)

  function isAssociated(moniteurId: string, typeCoursId: string) {
    return moniteurCours.some(
      (mc) => mc.moniteur_id === moniteurId && mc.type_cours_id === typeCoursId
    )
  }

  async function handleToggle(moniteurId: string, typeCoursId: string) {
    try {
      await toggleMoniteurTypeCours(moniteurId, typeCoursId)
      startTransition(() => router.refresh())
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  async function handleDispoChange(moniteurId: string, val: string) {
    const n = Number(val)
    if (isNaN(n) || n <= 0) return
    try {
      await upsertDisponibiliteMoniteur(moniteurId, n)
      toast.success('Disponibilité mise à jour')
      startTransition(() => router.refresh())
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  function getDispoMax(moniteurId: string) {
    return disponibilites.find((d) => d.moniteur_id === moniteurId)?.heures_max_semaine ?? 35
  }

  // ─── Calendrier ──────────────────────────────────────────────
  const [calendrier] = useState(initialCal)
  const [calSemaine, setCalSemaine] = useState(semaineCourante())
  const [calNomCouleur, setCalNomCouleur] = useState('')
  const [calType, setCalType] = useState<'cours' | 'stage'>('cours')
  const [savingCal, setSavingCal] = useState(false)

  // All unique nom_couleur from calendrier + modeles
  const nomsCouleursConnus = Array.from(
    new Set([
      ...calendrier.map((c) => c.nom_couleur),
      ...modeles.map((m) => m.nom_couleur),
    ])
  ).sort()

  async function handleSaveCal() {
    if (!calNomCouleur) { toast.error('Choisissez un groupe'); return }
    setSavingCal(true)
    try {
      await upsertCalendrierGroupe(calSemaine, calNomCouleur, calType)
      toast.success('Calendrier mis à jour')
      startTransition(() => router.refresh())
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSavingCal(false)
    }
  }

  // ─── Génération ──────────────────────────────────────────────
  const [genSemaine, setGenSemaine] = useState(semaineCourante())
  const [genSemaineFin, setGenSemaineFin] = useState(semaineCourante())
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState<{ creees: number; erreurs: string[] } | null>(null)

  async function handleGenerer() {
    setGenerating(true)
    setGenResult(null)
    try {
      // Générer semaine par semaine
      let semaine = genSemaine
      let totalCreees = 0
      const allErreurs: string[] = []

      while (semaine <= genSemaineFin) {
        const result = await genererPlanning(semaine)
        totalCreees += result.creees
        allErreurs.push(...result.erreurs)
        semaine = format(addWeeks(parseISO(semaine), 1), 'yyyy-MM-dd')
      }

      setGenResult({ creees: totalCreees, erreurs: allErreurs })
      if (totalCreees > 0) toast.success(`${totalCreees} séance(s) générée(s)`)
      else toast.warning('Aucune séance générée')
      startTransition(() => router.refresh())
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setGenerating(false)
    }
  }

  // ─── Rendu ────────────────────────────────────────────────────

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Génération automatique</h1>
        <p className="text-muted-foreground">
          Configurez les règles puis générez les plannings en un clic.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── ONGLET MODÈLES ── */}
      {activeTab === 'modeles' && (
        <div className="space-y-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Ajouter une règle</CardTitle>
              <CardDescription>
                Définissez combien d&apos;heures d&apos;un cours sont nécessaires par semaine pour un type de groupe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Groupe (code couleur)</Label>
                  <Input
                    placeholder="GF_VERT"
                    value={newModeleNomCouleur}
                    onChange={(e) => setNewModeleNomCouleur(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cours</Label>
                  <Select value={newModeleCoursId} onValueChange={setNewModeleCoursId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      {typesCours.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nom} ({t.duree_minutes / 60}h)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Heures / semaine</Label>
                  <Input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={newModeleHeures}
                    onChange={(e) => setNewModeleHeures(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleAddModele} disabled={savingModele}>
                {savingModele ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Ajouter
              </Button>
            </CardContent>
          </Card>

          {/* Liste des modèles */}
          {modeles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Règles enregistrées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {modeles.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{m.nom_couleur}</Badge>
                        <span className="text-sm">{m.type_cours?.nom}</span>
                        <Badge variant="secondary">{m.heures_par_semaine}h/sem</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteModele(m.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── ONGLET MONITEURS ── */}
      {activeTab === 'moniteurs' && (
        <div className="space-y-6 max-w-5xl">
          {moniteurs.map((moniteur) => (
            <Card key={moniteur.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    <span className="font-mono bg-slate-100 px-2 py-1 rounded mr-2">{moniteur.surnom}</span>
                    {moniteur.nom}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Max h/sem :</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      className="w-16 h-7 text-xs"
                      defaultValue={getDispoMax(moniteur.id)}
                      onBlur={(e) => handleDispoChange(moniteur.id, e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">Cours pouvant être enseignés :</p>
                <div className="flex flex-wrap gap-2">
                  {typesCours.map((cours) => {
                    const actif = isAssociated(moniteur.id, cours.id)
                    return (
                      <button
                        key={cours.id}
                        type="button"
                        onClick={() => handleToggle(moniteur.id, cours.id)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          actif
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-primary'
                        }`}
                      >
                        {cours.nom}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── ONGLET CALENDRIER ── */}
      {activeTab === 'calendrier' && (
        <div className="space-y-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Ajouter une présence</CardTitle>
              <CardDescription>
                Indiquez si un groupe est en cours ou en stage pour une semaine donnée.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Semaine (lundi)</Label>
                  <Input type="date" value={calSemaine} onChange={(e) => setCalSemaine(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Groupe (code couleur)</Label>
                  <Input
                    placeholder="GF_VERT"
                    list="couleurs-list"
                    value={calNomCouleur}
                    onChange={(e) => setCalNomCouleur(e.target.value.toUpperCase())}
                  />
                  <datalist id="couleurs-list">
                    {nomsCouleursConnus.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={calType} onValueChange={(v) => setCalType(v as 'cours' | 'stage')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cours">Cours (présent)</SelectItem>
                      <SelectItem value="stage">Stage (absent)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveCal} disabled={savingCal}>
                {savingCal ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Enregistrer
              </Button>
            </CardContent>
          </Card>

          {calendrier.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Calendrier enregistré</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {calendrier.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-2 rounded border text-sm">
                      <span className="text-muted-foreground w-28">
                        {format(parseISO(c.semaine), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                      <Badge variant="outline">{c.nom_couleur}</Badge>
                      <Badge variant={c.type === 'cours' ? 'default' : 'secondary'}>
                        {c.type === 'cours' ? 'Cours' : 'Stage'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── ONGLET GÉNÉRATION ── */}
      {activeTab === 'generer' && (
        <div className="max-w-xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Générer les plannings</CardTitle>
              <CardDescription>
                Le système placera automatiquement les séances selon les modèles, les disponibilités des moniteurs et le calendrier des apprentis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Semaine de début</Label>
                  <Input type="date" value={genSemaine} onChange={(e) => setGenSemaine(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Semaine de fin</Label>
                  <Input type="date" value={genSemaineFin} onChange={(e) => setGenSemaineFin(e.target.value)} />
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                <strong>Attention :</strong> Les séances existantes sont conservées. Seules les nouvelles séances manquantes seront ajoutées.
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleGenerer}
                disabled={generating || !genSemaine || !genSemaineFin || genSemaineFin < genSemaine}
              >
                {generating ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-5 w-5 mr-2" />
                )}
                {generating ? 'Génération en cours…' : 'Générer les plannings'}
              </Button>
            </CardContent>
          </Card>

          {/* Résultat */}
          {genResult && (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">{genResult.creees} séance(s) générée(s)</span>
                </div>
                {genResult.erreurs.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Avertissements ({genResult.erreurs.length})
                      </p>
                      {genResult.erreurs.map((e, i) => (
                        <p key={i} className="text-xs text-muted-foreground">• {e}</p>
                      ))}
                    </div>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/planning/${genSemaine}`)}
                >
                  Voir le planning
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
