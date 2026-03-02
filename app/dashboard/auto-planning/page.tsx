import { getMoniteurs } from '@/app/actions/moniteurs'
import { getTypesCours } from '@/app/actions/cours'
import {
  getModelePlanning,
  getMoniteurTypesCours,
  getDisponibilitesMoniteurs,
  getCalendrierGroupes,
} from '@/app/actions/auto-planning'
import AutoPlanningClient from './AutoPlanningClient'

export default async function AutoPlanningPage() {
  const [moniteurs, typesCours, modeles, moniteurCours, disponibilites, calendrier] =
    await Promise.all([
      getMoniteurs(),
      getTypesCours(),
      getModelePlanning(),
      getMoniteurTypesCours(),
      getDisponibilitesMoniteurs(),
      getCalendrierGroupes(),
    ])

  return (
    <AutoPlanningClient
      moniteurs={moniteurs}
      typesCours={typesCours}
      modeles={modeles}
      moniteurCours={moniteurCours}
      disponibilites={disponibilites}
      calendrier={calendrier}
    />
  )
}
