'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PlanningPDF from './PlanningPDF'
import type { Groupe, Moniteur, Planning, Salle, Seance, TypeCours } from '@/lib/types'
import { format, parseISO } from 'date-fns'

interface Props {
  planning: Planning
  seances: Seance[]
  groupes: Groupe[]
  moniteurs: Moniteur[]
  salles: Salle[]
  typesCours: TypeCours[]
}

export default function PDFDownloadButton({ planning, seances, groupes }: Props) {
  const filename = `MFR-Planning-S${format(parseISO(planning.semaine), 'ww-yyyy')}.pdf`

  return (
    <PDFDownloadLink
      document={<PlanningPDF planning={planning} seances={seances} groupes={groupes} />}
      fileName={filename}
    >
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading}>
          <Printer className="h-4 w-4 mr-2" />
          {loading ? 'Génération…' : 'PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}
