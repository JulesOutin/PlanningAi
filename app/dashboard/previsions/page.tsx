import { getPrevisions } from '@/app/actions/previsions'
import { getGroupes } from '@/app/actions/groupes'
import PrevisionsClient from './PrevisionsClient'

export default async function PrevisionsPage() {
  const [previsions, groupes] = await Promise.all([getPrevisions(), getGroupes()])
  return <PrevisionsClient previsions={previsions} groupes={groupes ?? []} />
}
