import { getMoniteurs } from '@/app/actions/moniteurs'
import MoniteursClient from './MoniteursClient'

export default async function MoniteursPage() {
  const moniteurs = await getMoniteurs()
  return <MoniteursClient moniteurs={moniteurs} />
}
