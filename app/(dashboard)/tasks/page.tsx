'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useAppStore } from '@/stores/useAppStore'
import { 
  CheckCircle2, 
  Loader2, 
  Calendar, 
  Filter, 
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  User as UserIcon,
  Flag
} from 'lucide-react'
import { 
  TaskStatus, 
  TaskPriority, 
  STATUS_LABELS, 
  PRIORITY_LABELS, 
  STATUS_COLORS,
  PRIORITY_COLORS,
  TaskWithRelations
} from '@/types'
import { cn, formatDate } from '@/lib/utils'

export default function TasksPage() {
  const { 
    profile, 
    projects, 
    phases, 
    teamMembers, 
    fetchProjects, 
    fetchTeamMembers,
    fetchPhases
  } = useAppStore()
  
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  
  // Filters state
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterPhase, setFilterPhase] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('active')

  const isManager = profile?.role === 'manager'

  useEffect(() => {
    fetchProjects()
    fetchTeamMembers()
  }, [fetchProjects, fetchTeamMembers])
  
  // Set default assignee filter
  useEffect(() => {
    if (profile && !isManager) {
      setFilterAssignee(profile.id)
    } else if (profile && isManager && filterAssignee === 'all') {
      // For manager, default to 'all' or their own tasks?
      // User says: 'Việc của tôi' should display only my tasks.
      // But they also want 'Quản lý' to see others.
      // Let's default to my tasks if they land on "Việc của tôi" tab?
      // Actually the request says "Trang 'Việc của tôi' (My Tasks): Chỉ fetch và hiển thị những tasks có assignee_id trùng với user đang đăng nhập."
    }
  }, [profile, isManager])

  useEffect(() => {
    if (filterProject !== 'all') {
      fetchPhases(filterProject)
    }
  }, [filterProject, fetchPhases])

  const loadTasks = async () => {
    setLoading(true)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    setLoading(true)
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          projects(name),
          phases(name),
          assigned_profile:profiles(id, full_name, avatar_url, role)
        `)
        .order('created_at', { ascending: false })

      // Logic Filter logic theo phân quyền
      if (filterAssignee !== 'all') {
        query = query.eq('assigned_to', filterAssignee)
      } else if (!isManager) {
        // Assistant chỉ thấy task được giao cho mình nếu chọn 'Tất cả'
        query = query.eq('assigned_to', profile.id)
      }

      if (filterProject !== 'all') {
        query = query.eq('project_id', filterProject)
      }
      
      if (filterPhase !== 'all') query = query.eq('phase_id', filterPhase)
      if (filterPriority !== 'all') query = query.eq('priority', filterPriority)
      
      if (filterStatus === 'active') {
        query = query.neq('status', 'done')
      } else if (filterStatus === 'done') {
        query = query.eq('status', 'done')
      }

      const { data, error } = await query

      if (error) {
        console.error("loadTasks query error:", error)
        toast.error(error.message || "Lỗi không xác định từ Supabase")
      } else {
        setTasks(data as unknown as TaskWithRelations[])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile) {
      loadTasks()
    }
  }, [profile, filterProject, filterPhase, filterAssignee, filterPriority, filterStatus])

  // Cập nhật filter mặc định khi profile load xong
  useEffect(() => {
    if (profile && !isManager) {
      setFilterAssignee(profile.id)
    }
  }, [profile, isManager])

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {filterAssignee === profile?.id ? 'Việc của tôi' : 'Tất cả công việc'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {loading ? 'Đang cập nhật danh sách...' : `Tìm thấy ${tasks.length} kết quả phù hợp`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-secondary rounded-lg p-1">
            <button 
              onClick={() => setFilterStatus('active')}
              className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", 
                filterStatus === 'active' ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              Đang làm
            </button>
            <button 
              onClick={() => setFilterStatus('done')}
              className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", 
                filterStatus === 'done' ? "bg-card shadow-sm text-emerald-600" : "text-muted-foreground hover:text-foreground")}
            >
              Hoàn thành
            </button>
            <button 
              onClick={() => setFilterStatus('all')}
              className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", 
                filterStatus === 'all' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              Tất cả
            </button>
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn("p-2.5 rounded-lg border transition-all flex items-center gap-2 text-sm font-medium",
              isFilterOpen ? "bg-primary/10 border-primary text-primary" : "bg-background border-border hover:bg-secondary")}
          >
            <Filter className="w-4 h-4" />
            <span>Bộ lọc</span>
            <ChevronDown className={cn("w-3 h-3 transition-transform", isFilterOpen && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {isFilterOpen && (
        <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <LayoutGrid className="w-3 h-3" /> Dự án
            </label>
            <select 
              value={filterProject} 
              onChange={(e) => {
                setFilterProject(e.target.value)
                setFilterPhase('all')
              }}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            >
              <option value="all">Tất cả dự án</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <ListIcon className="w-3 h-3" /> Giai đoạn
            </label>
            <select 
              disabled={filterProject === 'all'}
              value={filterPhase} 
              onChange={(e) => setFilterPhase(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none disabled:opacity-50"
            >
              <option value="all">Tất cả giai đoạn</option>
              {phases.map(ph => <option key={ph.id} value={ph.id}>{ph.name}</option>)}
            </select>
          </div>

          {isManager && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <UserIcon className="w-3 h-3" /> Người thực hiện
              </label>
              <select 
                value={filterAssignee} 
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
              >
                <option value="all">Tất cả team</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <Flag className="w-3 h-3" /> Độ ưu tiên
            </label>
            <select 
              value={filterPriority} 
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            >
              <option value="all">Tất cả độ ưu tiên</option>
              {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Đang truy xuất dữ liệu...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Không tìm thấy công việc</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
            Không có task nào khớp với bộ lọc hiện tại của bạn. Thử thay đổi điều kiện lọc.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className="glass-card group hover:border-primary/40 hover:shadow-lg transition-all duration-300 p-4 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer"
            >
              <div className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit shrink-0 border",
                STATUS_COLORS[task.status]
              )}>
                {STATUS_LABELS[task.status]}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {task.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-foreground/70">
                     Dự án: {(task.projects as any)?.name || 'N/A'}
                  </span>
                  <span>•</span>
                  <span className="italic">{(task.phases as any)?.name || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                 <div className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold",
                  PRIORITY_COLORS[task.priority]
                )}>
                  {PRIORITY_LABELS[task.priority]}
                </div>
                
                {task.due_date && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-l border-border pl-4">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(task.due_date)}
                  </div>
                )}

                <div className="flex items-center gap-2 border-l border-border pl-4">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                    {task.assigned_profile?.full_name?.charAt(0) || '?'}
                  </div>
                  <span className="text-xs font-semibold hidden lg:block">
                    {task.assigned_profile?.full_name || 'Chưa giao'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
