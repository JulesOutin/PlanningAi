import { getTypesCours } from '@/app/actions/cours'
import CoursClient from './CoursClient'

export default async function CoursPage() {
  const cours = await getTypesCours()
  return <CoursClient cours={cours} />
}
