import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type {
  Profile, Project, Phase, Task, TaskWithRelations,
  PhaseWithTasks, ProjectWithPhases,
  CreateProjectInput, CreatePhaseInput, CreateTaskInput, UpdateTaskInput,
} from '@/types'

const supabase = createClient()

interface AppState {
  // Auth & Team
  profile: Profile | null
  setProfile: (profile: Profile | null) => void
  teamMembers: Profile[]
  fetchTeamMembers: () => Promise<void>

  // Projects
  projects: Project[]
  selectedProject: Project | null
  setSelectedProject: (project: Project | null) => void
  fetchProjects: () => Promise<void>
  createProject: (input: CreateProjectInput) => Promise<Project | null>
  updateProject: (id: string, input: Partial<CreateProjectInput> & { status?: string }) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  // Phases
  phases: Phase[]
  fetchPhases: (projectId: string) => Promise<void>
  createPhase: (input: CreatePhaseInput) => Promise<Phase | null>
  updatePhase: (id: string, input: Partial<CreatePhaseInput> & { status?: string }) => Promise<void>
  approvePhase: (phaseId: string) => Promise<void>
  reopenPhase: (phaseId: string) => Promise<void>
  deletePhase: (id: string) => Promise<void>

  // Tasks
  tasks: TaskWithRelations[]
  fetchTasksByProject: (projectId: string, phaseId?: string) => Promise<void>
  createTask: (input: CreateTaskInput) => Promise<Task | null>
  updateTask: (id: string, input: UpdateTaskInput) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  moveTask: (taskId: string, newStatus: string) => Promise<void>

  // UI state
  isLoading: boolean
  error: string | null
  setError: (error: string | null) => void
}

export const useAppStore = create<AppState>()((set, get) => ({
  // ---- Auth & Team ----
  profile: null,
  setProfile: (profile) => set({ profile }),
  teamMembers: [],
  fetchTeamMembers: async () => {
    const { data, error } = await supabase.from('profiles').select('*')
    if (!error && data) {
      set({ teamMembers: data })
    }
  },

  // ---- Projects ----
  projects: [],
  selectedProject: null,
  setSelectedProject: (project) => set({ selectedProject: project }),

  fetchProjects: async () => {
    set({ isLoading: true, error: null })
    const { data, error } = await supabase
      .from('projects')
      .select('*, phases(id, status, tasks(id, status))')
      .order('created_at', { ascending: false })

    if (error) { set({ error: error.message, isLoading: false }); return }
    set({ projects: (data ?? []) as any, isLoading: false })
  },

  createProject: async (input) => {
    const profile = get().profile
    if (!profile) return null

    const { data, error } = await supabase
      .from('projects')
      .insert({ ...input, created_by: profile.id })
      .select()
      .single()

    if (error) { set({ error: error.message }); return null }

    // We DO NOT call seed_default_phases manually anymore.
    // The Database TRIGGER `trigger_create_default_phases` automatically inserts 6 default phases 
    // immediately when a project is inserted above.

    await get().fetchProjects()
    return data
  },

  updateProject: async (id, input) => {
    const { error } = await supabase
      .from('projects')
      .update(input)
      .eq('id', id)

    if (error) { set({ error: error.message }); return }
    await get().fetchProjects()
  },

  deleteProject: async (id) => {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) { set({ error: error.message }); return }
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }))
  },

  // ---- Phases ----
  phases: [],

  fetchPhases: async (projectId) => {
    const { data, error } = await supabase
      .from('phases')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    if (error) { set({ error: error.message }); return }
    set({ phases: data ?? [] })
  },

  createPhase: async (input) => {
    const profile = get().profile
    if (!profile) return null

    const { data, error } = await supabase
      .from('phases')
      .insert({ ...input, created_by: profile.id })
      .select()
      .single()

    if (error) { set({ error: error.message }); return null }
    set((state) => ({ phases: [...state.phases, data] }))
    return data
  },

  updatePhase: async (id, input) => {
    const { error } = await supabase.from('phases').update(input).eq('id', id)
    if (error) { set({ error: error.message }); return }
    set((state) => ({
      phases: state.phases.map((p) => (p.id === id ? { ...p, ...(input as Partial<Phase>) } : p)),
    }))
  },

  approvePhase: async (phaseId) => {
    const profile = get().profile
    if (!profile || profile.role !== 'manager') {
      set({ error: 'Chỉ Manager mới có quyền phê duyệt Phase' })
      return
    }

    const { error } = await supabase
      .from('phases')
      .update({
        status: 'completed',
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', phaseId)

    if (error) { set({ error: error.message }); return }
    await get().fetchPhases(get().selectedProject?.id ?? '')
  },

  reopenPhase: async (phaseId) => {
    const profile = get().profile
    if (!profile || profile.role !== 'manager') {
      set({ error: 'Chỉ Manager mới có quyền mở lại Phase' })
      return
    }

    const { error } = await supabase
      .from('phases')
      .update({
        status: 'active',
        approved_by: null,
        approved_at: null,
      })
      .eq('id', phaseId)

    if (error) { set({ error: error.message }); return }
    await get().fetchPhases(get().selectedProject?.id ?? '')
  },

  deletePhase: async (id) => {
    const { error } = await supabase.from('phases').delete().eq('id', id)
    if (error) { set({ error: error.message }); return }
    set((state) => ({ phases: state.phases.filter((p) => p.id !== id) }))
  },

  // ---- Tasks ----
  tasks: [],

  fetchTasksByProject: async (projectId, phaseId) => {
    set({ isLoading: true })
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assigned_profile:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url, role),
        created_profile:profiles!tasks_created_by_fkey(id, full_name, role)
      `)
      .eq('project_id', projectId)
      .is('parent_id', null) // Only root tasks on kanban
      .order('created_at', { ascending: true })

    if (phaseId) query = query.eq('phase_id', phaseId)

    const { data, error } = await query
    if (error) { set({ error: error.message, isLoading: false }); return }
    set({ tasks: (data ?? []) as TaskWithRelations[], isLoading: false })
  },

  createTask: async (input) => {
    const profile = get().profile
    if (!profile) return null

    // Chuẩn hóa assigned_to: Nếu là chuỗi rỗng thì chuyển thành null để tránh lỗi UUID
    const normalizedInput = {
      ...input,
      assigned_to: input.assigned_to && input.assigned_to.trim() !== '' ? input.assigned_to : null,
      created_by: profile.id
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(normalizedInput)
      .select()
      .single()

    if (error) { 
      console.error("Create task database error:", error)
      set({ error: error.message })
      return null 
    }

    // Refresh tasks for current project to ensure Kanban is up to date
    if (get().selectedProject) {
      await get().fetchTasksByProject(get().selectedProject!.id)
    }
    
    return data
  },

  updateTask: async (id, input) => {
    const { error } = await supabase.from('tasks').update(input).eq('id', id)
    if (error) { set({ error: error.message }); return }
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...input } : t)),
    }))
  },

  deleteTask: async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) { set({ error: error.message }); return }
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
  },

  moveTask: async (taskId, newStatus) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t
      ),
    }))

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (error) {
      set({ error: error.message })
      // Revert on error
      if (get().selectedProject) {
        await get().fetchTasksByProject(get().selectedProject!.id)
      }
    }
  },

  // ---- UI ----
  isLoading: false,
  error: null,
  setError: (error) => set({ error }),
}))
