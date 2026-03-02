import { getSalles } from '@/app/actions/salles'
import SallesClient from './SallesClient'

export default async function SallesPage() {
  const salles = await getSalles()
  return <SallesClient salles={salles} />
}
