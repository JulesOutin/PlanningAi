import { redirect } from 'next/navigation'
import { semaineCourante } from '@/lib/semaine'

export default function PlanningIndexPage() {
  redirect(`/dashboard/planning/${semaineCourante()}`)
}
