'use client'

import { useState } from 'react'
import { Clock, MapPin, User, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Conflict, Seance } from '@/lib/types'
import ConflictBadge from './ConflictBadge'

interface Props {
  seance: Seance
  conflicts: Conflict[]
  onDelete: (id: string) => void
  onDragStart: (seance: Seance) => void
  onClick: (seance: Seance) => void
}

export default function SeanceCard({
  seance,
  conflicts,
  onDelete,
  onDragStart,
  onClick,
}: Props) {
  const [dragging, setDragging] = useState(false)
  const hasConflict = conflicts.length > 0
  const hasError = conflicts.some((c) => c.severity === 'error')

  function handleDragStart(e: React.DragEvent) {
    setDragging(true)
    e.dataTransfer.setData('seanceId', seance.id)
    onDragStart(seance)
  }

  function handleDragEnd() {
    setDragging(false)
  }

  const borderColor = hasError
    ? 'border-red-400'
    : hasConflict
    ? 'border-yellow-400'
    : 'border-transparent'

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        group relative rounded border-2 p-1.5 mb-1 cursor-grab active:cursor-grabbing
        bg-white shadow-sm hover:shadow transition-all select-none text-xs
        ${borderColor}
        ${dragging ? 'opacity-50' : ''}
      `}
    >
      {/* Drag handle */}
      <div className="absolute left-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40">
        <GripVertical className="h-3 w-3" />
      </div>

      {/* Content */}
      <div className="pl-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="font-semibold text-left w-full truncate hover:text-primary"
              onClick={() => onClick(seance)}
            >
              {seance.type_cours?.nom ?? '—'}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              <strong>Cours:</strong> {seance.type_cours?.nom}
            </p>
            <p>
              <strong>Moniteur:</strong> {seance.moniteur?.surnom} — {seance.moniteur?.nom}
            </p>
            <p>
              <strong>Salle:</strong> {seance.salle?.nom}
            </p>
            <p>
              <strong>Durée:</strong> {(seance.type_cours?.duree_minutes ?? 60) / 60}h
            </p>
          </TooltipContent>
        </Tooltip>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {seance.heure_debut}
          </span>
          <span className="flex items-center gap-0.5">
            <User className="h-2.5 w-2.5" />
            {seance.moniteur?.surnom}
          </span>
          <span className="flex items-center gap-0.5">
            <MapPin className="h-2.5 w-2.5" />
            {seance.salle?.nom}
          </span>
        </div>
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0.5 top-0.5 h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(seance.id)
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>

      {/* Conflicts */}
      {hasConflict && <ConflictBadge conflicts={conflicts} />}
    </div>
  )
}
