'use client'

import { cn } from '@/lib/utils'
import { STATUS_LABELS, PRIORITY_LABELS } from '@/types'
import type { TaskStatus, TaskPriority } from '@/types'
import { AlertTriangle, Clock, CheckCircle2, Circle } from 'lucide-react'

// ---- Status Badge ----
interface StatusBadgeProps {
  status: TaskStatus
  className?: string
}

const statusIcons: Record<TaskStatus, React.ReactNode> = {
  todo:        <Circle className="w-3 h-3" />,
  in_progress: <Clock className="w-3 h-3" />,
  in_review:   <AlertTriangle className="w-3 h-3" />,
  done:        <CheckCircle2 className="w-3 h-3" />,
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn('badge', `badge-${status}`, className)}>
      {statusIcons[status]}
      {STATUS_LABELS[status]}
    </span>
  )
}

// ---- Priority Badge ----
interface PriorityBadgeProps {
  priority: TaskPriority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  if (priority === 'normal') return null // Don't render "Normal" badge to avoid clutter

  return (
    <span className={cn('badge', `badge-${priority}`, className)}>
      {priority === 'urgent' && '⚠️ '}
      {PRIORITY_LABELS[priority]}
    </span>
  )
}

// ---- Generic Badge ----
interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'danger'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variantClasses = {
    default: 'bg-secondary text-foreground border-border',
    outline: 'bg-transparent text-muted-foreground border-border',
    success: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50',
    warning: 'bg-amber-900/40 text-amber-300 border-amber-800/50',
    danger:  'bg-red-900/40 text-red-300 border-red-800/50',
  }

  return (
    <span className={cn('badge', variantClasses[variant], className)}>
      {children}
    </span>
  )
}
