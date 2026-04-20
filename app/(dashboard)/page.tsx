'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'
import { 
  ProjectProgressWidget, 
  ActionRequiredWidget, 
  UrgentTasksWidget 
} from '@/components/dashboard/Widgets'
import { 
  BarChart3, 
  FileSearch, 
  AlertTriangle, 
  Plus,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const supabase = createClient()
  const { projects, fetchProjects } = useAppStore()
  
  const [stats, setStats] = useState({
    tasksInReview: [] as any[],
    phasesPending: [] as any[],
    urgentTasks: [] as any[],
    projectsWithPhases: [] as any[],
  })
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    setLoading(true)
    
    // 1. Fetch projects with phases and tasks for progress
    const { data: projectsData } = await supabase
      .from('projects')
      .select(`
        *,
        phases (
          *,
          tasks (*)
        )
      `)
      .eq('status', 'active')
    
    // 2. Fetch tasks in review
    const { data: reviewData } = await supabase
      .from('tasks')
      .select(`
        *,
        projects (name),
        profiles!tasks_created_by_fkey (full_name)
      `)
      .eq('status', 'in_review')
      .limit(5)

    // 3. Fetch phases pending approval
    const { data: pendingPhasesData } = await supabase
      .from('phases')
      .select(`
        *,
        projects (name)
      `)
      .eq('status', 'active')
      .is('approved_by', null)
      .limit(5)

    // 4. Fetch urgent/overdue tasks
    const { data: urgentData } = await supabase
      .from('tasks')
      .select(`
        *,
        projects (name)
      `)
      .or('priority.eq.urgent,due_date.lt.now()')
      .neq('status', 'done')
      .limit(8)

    setStats({
      projectsWithPhases: projectsData?.map(p => ({
        ...p,
        phases: p.phases || []
      })) || [],
      tasksInReview: reviewData?.map(t => ({
        ...t,
        project_name: (t.projects as any)?.name,
        assistant_name: (t.profiles as any)?.full_name
      })) || [],
      phasesPending: pendingPhasesData?.map(p => ({
        ...p,
        project_name: (p.projects as any)?.name
      })) || [],
      urgentTasks: urgentData?.map(t => ({
        ...t,
        project_name: (t.projects as any)?.name
      })) || [],
    })
    
    setLoading(false)
  }

  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Chào buổi sáng!</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Dưới đây là tóm tắt công việc SEO trong ngày của team.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadDashboardData}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <Link href="/projects" className="btn-primary">
            <Plus className="w-4 h-4" />
            Dự án mới
          </Link>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-l-primary">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Đang chạy</p>
            <h3 className="text-2xl font-bold text-foreground">{projects.length} Website</h3>
          </div>
        </div>

        <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-l-amber-400">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <FileSearch className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Cần duyệt</p>
            <h3 className="text-2xl font-bold text-foreground">{stats.tasksInReview.length + stats.phasesPending.length} Hạng mục</h3>
          </div>
        </div>

        <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-l-red-400">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Khẩn cấp</p>
            <h3 className="text-2xl font-bold text-foreground">{stats.urgentTasks.length} Task</h3>
          </div>
        </div>
      </div>


      {/* Main Grid Widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1">
          <ProjectProgressWidget projects={stats.projectsWithPhases} />
        </div>
        <div className="xl:col-span-1">
          <ActionRequiredWidget 
            tasksInReview={stats.tasksInReview} 
            phasesPending={stats.phasesPending} 
          />
        </div>
        <div className="xl:col-span-1">
          <UrgentTasksWidget tasks={stats.urgentTasks} />
        </div>
      </div>
    </div>
  )
}
