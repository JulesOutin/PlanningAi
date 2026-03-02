import { getAbsences } from '@/app/actions/absences'
import { getMoniteurs } from '@/app/actions/moniteurs'
import AbsencesClient from './AbsencesClient'

export default async function AbsencesPage() {
  const [absences, moniteurs] = await Promise.all([getAbsences(), getMoniteurs()])
  return <AbsencesClient absences={absences} moniteurs={moniteurs} />
}
