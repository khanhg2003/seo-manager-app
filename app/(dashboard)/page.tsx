'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'
import {
  BarChart3,
  FileSearch,
  AlertTriangle,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  XCircle,
  Loader2,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { TaskWithRelations, TaskStatus } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function DashboardPage() {
  const supabase = createClient()
  const { profile, projects, fetchProjects, approveTask, rejectTask } = useAppStore()

  const [reviewTasks, setReviewTasks] = useState<TaskWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectingTaskId, setRejectingTaskId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Projects (stats are calculated from this)
      await fetchProjects()

      // Fetch SEO metrics over all active projects efficiently
      // Note: We don't have a direct global fetchSeoMetrics in store, 
      // but we can query them directly here for dashboard visualization
      if (profile) {
        const { data: seoData } = await supabase
          .from('project_seo_metrics')
          .select('project_id, articles_count, gsc_traffic')

        if (seoData) {
          // Attach seo stats locally to projects for rendering
          useAppStore.setState(state => {
            const projectsWithSeo = state.projects.map(p => {
              const projectSeos = seoData.filter(s => s.project_id === p.id)
              const totalArticles = projectSeos.reduce((sum, s) => sum + (s.articles_count || 0), 0)
              const totalTraffic = projectSeos.reduce((sum, s) => sum + (s.gsc_traffic || 0), 0)
              return { ...p, totalArticles, totalTraffic }
            })
            return { projects: projectsWithSeo }
          })
        }

        // 2. Fetch Tasks for Approval Section
        let query = supabase
          .from('tasks')
          .select(`
            *,
            projects (name, color),
            assigned_profile:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url, role)
          `)
          .neq('assigned_to', profile.id)
          .in('status', ['done', 'in_review'])
          .eq('is_reviewed', false)
          .order('updated_at', { ascending: false })

        const { data, error } = await query
        if (!error && data) {
          setReviewTasks(data as unknown as TaskWithRelations[])
        }
      }
    } catch (err) {
      console.error("Dashboard load error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile) {
      loadDashboardData()
    }
  }, [profile])

  const handleApprove = async (taskId: string) => {
    try {
      await approveTask(taskId)
      toast.success("Đã duyệt công việc!")
      // Local filter update for immediate UX
      setReviewTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (err) {
      toast.error("Lỗi khi duyệt công việc")
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectingTaskId || !rejectReason.trim()) return

    try {
      await rejectTask(rejectingTaskId, rejectReason.trim())
      toast.success("Đã gửi yêu cầu sửa đổi")
      setReviewTasks(prev => prev.filter(t => t.id !== rejectingTaskId))
      setRejectingTaskId(null)
      setRejectReason('')
    } catch (err) {
      toast.error("Lỗi khi gửi yêu cầu")
    }
  }

  // Tiện ích tính toán tiến độ
  const calculateProgress = (project: any) => {
    const allTasks = project.phases?.flatMap((p: any) => p.tasks) || []
    if (allTasks.length === 0) return 0
    const doneTasks = allTasks.filter((t: any) => t.status === 'done').length
    return Math.round((doneTasks / allTasks.length) * 100)
  }

  const isLagging = (project: any, progress: number) => {
    const createdDate = new Date(project.created_at)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return createdDate < sevenDaysAgo && progress < 30
  }

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-500">
      {/* --- DASHBOARD HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            Trung tâm chỉ huy SEO
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            className="btn-secondary h-11 px-5 shadow-sm border-border/50 bg-background/50 backdrop-blur-sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <Link href="/projects" className="btn-primary h-11 px-6 shadow-md shadow-primary/20">
            <Plus className="w-5 h-5" />
            Dự án mới
          </Link>
        </div>
      </div>

      {/* --- SECTION 1: TIẾN ĐỘ TỔNG QUÁT (PROJECT GRID) --- */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Tiến độ Website trọng điểm
          </h2>
          <Link href="/projects" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            Xem tất cả <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-foreground">
          {projects.slice(0, 4).map((project) => {
            const progress = calculateProgress(project)
            const lagging = isLagging(project, progress)

            return (
              <div key={project.id} className="glass-card group hover:border-primary/30 transition-all duration-300 p-6 relative overflow-hidden">
                {/* Background Decor */}
                <div
                  className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity"
                  style={{ backgroundColor: project.color }}
                />

                <div className="flex justify-between items-start mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  {lagging && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider animate-pulse">
                      Chậm tiến độ
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-lg leading-tight mb-1 truncate" title={project.name}>
                  {project.name}
                </h3>
                <p className="text-xs text-muted-foreground font-medium mb-3 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  {project.website_url ? (
                    <a href={project.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline-offset-2 hover:underline">
                      {project.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  ) : (
                    'Chưa gắn Website'
                  )}
                </p>

                {/* SEO Mini Stats */}
                <div className="flex gap-4 mb-4 mt-2">
                  <div className="flex-1 bg-secondary/30 rounded-lg p-2 text-center border shadow-sm">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-0.5">Traffic GSC</p>
                    <p className="text-sm font-black text-emerald-500">{(project as any).totalTraffic?.toLocaleString() || 0}</p>
                  </div>
                  <div className="flex-1 bg-secondary/30 rounded-lg p-2 text-center border shadow-sm">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-0.5">Bài viết SEO</p>
                    <p className="text-sm font-black text-blue-500">{(project as any).totalArticles?.toLocaleString() || 0}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Hoàn thành (C.Việc)</span>
                    <span className={progress < 30 ? 'text-red-500' : 'text-primary'}>{progress}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${progress < 30 ? 'bg-red-500' : 'bg-primary'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <Link
                  href={`/projects/${project.id}`}
                  className="mt-5 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs font-bold transition-colors"
                >
                  Chi tiết dự án
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* --- SECTION 2: PHÊ DUYỆT CÔNG VIỆC (APPROVAL CENTER) --- */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileSearch className="w-6 h-6 text-amber-500" />
            Báo cáo công việc Assistant
          </h2>
          <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold border border-amber-100">
            {reviewTasks.length} Công việc chờ duyệt
          </div>
        </div>

        <div className="glass-card overflow-hidden border-none shadow-xl shadow-black/5">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/40 border-b border-border">
                <tr className="text-left">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Công việc</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Người thực hiện</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Dự án</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Cập nhật</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {reviewTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-3">
                        <CheckCircle2 className="w-12 h-12 text-muted/30" />
                        <p className="text-lg font-medium">Tuyệt vời! Không có công việc nào cần phê duyệt.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reviewTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-secondary/20 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-bold text-foreground group-hover:text-primary transition-colors">{task.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">{task.description || 'Không có mô tả'}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                            {task.assigned_profile?.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-bold">{task.assigned_profile?.full_name || 'N/A'}</div>
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Assistant</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                          style={{
                            borderColor: (task.projects as any)?.color + '40',
                            color: (task.projects as any)?.color,
                            backgroundColor: (task.projects as any)?.color + '10'
                          }}
                        >
                          {(task.projects as any)?.name}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-xs font-medium text-foreground">
                          {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true, locale: vi })}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(task.id)}
                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shadow-sm flex items-center gap-1.5 px-3 text-xs font-bold"
                            title="Phê duyệt công việc"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Duyệt
                          </button>
                          <button
                            onClick={() => setRejectingTaskId(task.id)}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all shadow-sm flex items-center gap-1.5 px-3 text-xs font-bold"
                            title="Yêu cầu sửa lại"
                          >
                            <XCircle className="w-4 h-4" />
                            Sửa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* --- REJECT REASON MODAL --- */}
      {rejectingTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
              <MessageSquare className="w-6 h-6 text-red-500" />
              Lý do yêu cầu sửa đổi
            </h3>
            <p className="text-sm text-muted-foreground mb-4 font-medium">
              Ghi chú của bạn sẽ được gửi trực tiếp đến Assistant để họ biết cần chỉnh sửa mục nào.
            </p>
            <textarea
              autoFocus
              className="w-full bg-secondary/50 border border-border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 min-h-[120px] resize-none"
              placeholder="Ví dụ: Link chưa đạt chuẩn, nội dung cần thêm từ khóa chính..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => { setRejectingTaskId(null); setRejectReason('') }}
                className="btn-secondary h-11 px-6 font-bold"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim()}
                className="btn-primary h-11 px-6 bg-red-600 hover:bg-red-700 font-bold disabled:opacity-50"
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
