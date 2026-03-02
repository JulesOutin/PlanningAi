import { getGroupes } from '@/app/actions/groupes'
import GroupesClient from './GroupesClient'

export default async function GroupesPage() {
  const groupes = await getGroupes()
  return <GroupesClient groupes={groupes} />
}
