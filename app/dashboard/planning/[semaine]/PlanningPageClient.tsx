'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, CheckCircle, Radio, RotateCcw, Printer, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PlanningGrid from '@/components/planning/PlanningGrid'
import dynamic from 'next/dynamic'
import type { Absence, Groupe, Moniteur, Pause, Planning, Salle, Seance, TypeCours } from '@/lib/types'
import {
  semaineSuivante,
  semainePrecedente,
  formatSemaineLabel,
  numeroSemaine,
} from '@/lib/semaine'
import {
  validerPlanning,
  publierPlanning,
  repasserBrouillon,
} from '@/app/actions/plannings'

// PDF download — loaded client-side only
const PDFDownloadButton = dynamic(() => import('@/components/pdf/PDFDownloadButton'), {
  ssr: false,
  loading: () => (
    <Button variant="outline" size="sm" disabled>
      <Printer className="h-4 w-4 mr-2" />
      PDF
    </Button>
  ),
})

const STATUT_LABELS = {
  brouillon: { label: 'Brouillon', variant: 'secondary' as const },
  valide: { label: 'Validé', variant: 'default' as const },
  publie: { label: 'Publié', variant: 'success' as const },
}

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

export default function PlanningPageClient({
  planning,
  seances,
  groupes,
  moniteurs,
  salles,
  typesCours,
  absences,
  pauses,
}: Props) {
  const router = useRouter()
  const params = useParams<{ semaine: string }>()
  const semaine = params.semaine
  const [, startTransition] = useTransition()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  function navigate(newSemaine: string) {
    router.push(`/dashboard/planning/${newSemaine}`)
  }

  async function handleAction(action: string) {
    setActionLoading(action)
    try {
      if (action === 'valider') {
        await validerPlanning(planning.id)
        toast.success('Planning validé')
      } else if (action === 'publier') {
        await publierPlanning(planning.id)
        toast.success('Planning publié — les moniteurs peuvent le consulter')
      } else if (action === 'brouillon') {
        await repasserBrouillon(planning.id)
        toast.success('Planning repassé en brouillon')
      }
      startTransition(() => router.refresh())
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const statutInfo = STATUT_LABELS[planning.statut]
  const semNumero = numeroSemaine(semaine)
  const semLabel = formatSemaineLabel(semaine)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(semainePrecedente(semaine))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <p className="font-bold text-lg leading-tight">Semaine {semNumero}</p>
              <p className="text-sm text-muted-foreground">{semLabel}</p>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(semaineSuivante(semaine))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Status + actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statutInfo.variant as 'default'}>{statutInfo.label}</Badge>

            {planning.statut === 'brouillon' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('valider')}
                disabled={actionLoading === 'valider'}
              >
                {actionLoading === 'valider' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Valider
              </Button>
            )}

            {planning.statut === 'valide' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction('brouillon')}
                  disabled={actionLoading === 'brouillon'}
                >
                  {actionLoading === 'brouillon' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Brouillon
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAction('publier')}
                  disabled={actionLoading === 'publier'}
                >
                  {actionLoading === 'publier' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Radio className="h-4 w-4 mr-2" />
                  )}
                  Publier
                </Button>
              </>
            )}

            {planning.statut === 'publie' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('brouillon')}
                disabled={actionLoading === 'brouillon'}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Dépublier
              </Button>
            )}

            <PDFDownloadButton
              planning={planning}
              seances={seances}
              groupes={groupes}
              moniteurs={moniteurs}
              salles={salles}
              typesCours={typesCours}
            />
          </div>
        </div>

        {/* MFR info */}
        <p className="text-xs text-muted-foreground mt-2">
          MFR-CFA La Chauvinière • Tél: 02 43 03 87 77 • Planning hebdomadaire 2025–2026
        </p>
      </div>

      {/* Grid — key=planning.id force le reset du state local lors du changement de semaine */}
      <div className="flex-1 overflow-auto p-4">
        <PlanningGrid
          key={planning.id}
          planning={planning}
          seances={seances}
          groupes={groupes}
          moniteurs={moniteurs}
          salles={salles}
          typesCours={typesCours}
          absences={absences}
          pauses={pauses}
        />
      </div>
    </div>
  )
}
