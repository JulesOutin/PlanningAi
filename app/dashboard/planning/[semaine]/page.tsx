import { notFound } from 'next/navigation'
import { createOrGetPlanning } from '@/app/actions/plannings'
import { getGroupesBySemaine } from '@/app/actions/groupes'
import { getSeancesByPlanning, getPauses } from '@/app/actions/seances'
import { getMoniteurs } from '@/app/actions/moniteurs'
import { getSalles } from '@/app/actions/salles'
import { getTypesCours } from '@/app/actions/cours'
import { getAbsencesByPeriode } from '@/app/actions/absences'
import PlanningPageClient from './PlanningPageClient'
import { addDays, format, parseISO } from 'date-fns'

interface Props {
  params: Promise<{ semaine: string }>
}

export default async function PlanningPage({ params }: Props) {
  const { semaine } = await params

  // Validate semaine param
  if (!/^\d{4}-\d{2}-\d{2}$/.test(semaine)) {
    notFound()
  }

  const lundi = parseISO(semaine)
  const vendredi = addDays(lundi, 4)
  const vendrediStr = format(vendredi, 'yyyy-MM-dd')

  const [planning, groupes, moniteurs, salles, typesCours, pauses, absences] = await Promise.all([
    createOrGetPlanning(semaine),
    getGroupesBySemaine(semaine),
    getMoniteurs(),
    getSalles(),
    getTypesCours(),
    getPauses(),
    getAbsencesByPeriode(semaine, vendrediStr),
  ])

  const seances = await getSeancesByPlanning(planning.id)

  return (
    <PlanningPageClient
      planning={planning}
      seances={seances}
      groupes={groupes}
      moniteurs={moniteurs}
      salles={salles}
      typesCours={typesCours}
      absences={absences}
      pauses={pauses}
    />
  )
}
