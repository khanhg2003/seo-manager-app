import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isBefore, startOfDay } from 'date-fns'
import { vi } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: vi })
  } catch {
    return '—'
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: vi })
  } catch {
    return '—'
  }
}

export function isOverdue(dueDateStr: string | null | undefined): boolean {
  if (!dueDateStr) return false
  const dueDate = startOfDay(new Date(dueDateStr))
  const today = startOfDay(new Date())
  return isBefore(dueDate, today)
}

export function isDueToday(dueDateStr: string | null | undefined): boolean {
  if (!dueDateStr) return false
  return isToday(new Date(dueDateStr))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function calculateProgress(tasks: { status: string }[]): number {
  if (tasks.length === 0) return 0
  const done = tasks.filter((t) => t.status === 'done').length
  return Math.round((done / tasks.length) * 100)
}

export function getProjectProgress(phases: { tasks: { status: string }[] }[]): number {
  const allTasks = phases.flatMap((p) => p.tasks)
  return calculateProgress(allTasks)
}

export function getCurrentPhase(phases: { status: string; name: string }[]): string {
  const activePhase = phases.find((p) => p.status === 'active')
  return activePhase?.name ?? 'Hoàn thành'
}
