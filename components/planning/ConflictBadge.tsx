import { AlertTriangle, XCircle } from 'lucide-react'
import type { Conflict } from '@/lib/types'

export default function ConflictBadge({ conflicts }: { conflicts: Conflict[] }) {
  if (conflicts.length === 0) return null

  const hasError = conflicts.some((c) => c.severity === 'error')
  const Icon = hasError ? XCircle : AlertTriangle
  const color = hasError ? 'text-red-600 bg-red-50 border-red-200' : 'text-yellow-600 bg-yellow-50 border-yellow-200'

  return (
    <div className={`flex items-start gap-1 mt-1 p-1 rounded border text-xs ${color}`}>
      <Icon className="h-3 w-3 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        {conflicts.map((c, i) => (
          <p key={i}>{c.message}</p>
        ))}
      </div>
    </div>
  )
}
