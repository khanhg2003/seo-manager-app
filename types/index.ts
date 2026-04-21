// ============================================================
// Global TypeScript Types
// ============================================================

export type UserRole = 'manager' | 'assistant'

export type ProjectStatus = 'active' | 'paused' | 'completed'

export type PhaseStatus = 'active' | 'completed'

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'

export type TaskPriority = 'normal' | 'high' | 'urgent'

// ---- Database Row Types ----

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  domain: string | null
  description: string | null
  status: ProjectStatus
  color: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Phase {
  id: string
  project_id: string
  name: string
  description: string | null
  order_index: number
  status: PhaseStatus
  approved_by: string | null
  approved_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  phase_id: string
  parent_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigned_to: string | null
  created_by: string | null
  due_date: string | null
  order_index: number
  created_at: string
  updated_at: string
  is_reviewed: boolean
}

export interface TaskComment {
  id: string
  task_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
}

// ---- Joined/Enriched Types (with relations) ----

export interface TaskWithRelations extends Task {
  assigned_profile?: Profile | null
  created_profile?: Profile | null
  subtasks?: Task[]
  phase?: Phase | null
  project?: Project | null
  comments_count?: number
}

export interface PhaseWithTasks extends Phase {
  tasks: TaskWithRelations[]
  approved_profile?: Profile | null
}

export interface ProjectWithPhases extends Project {
  phases: PhaseWithTasks[]
}

// ---- UI / Form Types ----

export interface CreateProjectInput {
  name: string
  domain?: string
  description?: string
  color: string
}

export interface CreatePhaseInput {
  project_id: string
  name: string
  description?: string
  order_index: number
}

export interface CreateTaskInput {
  project_id: string
  phase_id: string
  parent_id?: string | null
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigned_to?: string | null
  due_date?: string | null
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigned_to?: string | null
  due_date?: string | null
  phase_id?: string
  order_index?: number
  is_reviewed?: boolean
}

// ---- Status/Priority Labels (Vietnamese) ----

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Cần làm',
  in_progress: 'Đang xử lý',
  in_review: 'Chờ duyệt',
  done: 'Hoàn thành',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  normal: 'Bình thường',
  high: 'Cao',
  urgent: 'Khẩn cấp',
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-gray-100 text-gray-700 border-gray-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  in_review: 'bg-amber-50 text-amber-700 border-amber-200',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  normal: 'bg-gray-100 text-gray-600',
  high: 'bg-red-50 text-red-600',
  urgent: 'bg-orange-50 text-orange-600',
}

export const KANBAN_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo',        label: 'Cần làm',      color: 'border-gray-300' },
  { id: 'in_progress', label: 'Đang xử lý',   color: 'border-blue-400' },
  { id: 'in_review',   label: 'Chờ duyệt',    color: 'border-amber-400' },
  { id: 'done',        label: 'Hoàn thành',   color: 'border-emerald-400' },
]

export const DEFAULT_PHASE_NAMES = [
  'Technical Audit',
  'Keyword Research',
  'Content Production',
  'On-page Optimization',
  'Entity/Social Building',
  'Off-page & Link Building',
]

export const PROJECT_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
]
