'use client'

import { 
  ProjectWithPhases, 
  STATUS_LABELS, 
  PRIORITY_LABELS 
} from '@/types'
import { 
  getProjectProgress, 
  getCurrentPhase, 
  cn 
} from '@/lib/utils'
import { 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react'
import Link from 'next/link'

// ---- Widget 1: Tiến độ dự án (Progress Bars) ----
export function ProjectProgressWidget({ projects }: { projects: ProjectWithPhases[] }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">Tiến độ SEO</h3>
        <Link href="/projects" className="text-xs text-primary hover:underline flex items-center gap-1">
          Xem tất cả <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-6">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Chưa có dự án nào được tạo.</p>
        ) : (
          projects.map((project) => {
            const progress = getProjectProgress(project.phases)
            const currentPhase = getCurrentPhase(project.phases)
            
            return (
              <div key={project.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <h4 className="text-sm font-bold truncate max-w-[200px]">{project.name}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      {currentPhase}
                    </p>
                  </div>
                  <span className="text-sm font-mono font-bold">{progress}%</span>
                </div>
                <div className="progress-bar-track bg-secondary/50">
                  <div 
                    className="progress-bar-fill shadow-lg shadow-primary/20"
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: project.color 
                    }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ---- Widget 2: Cần duyệt gấp (Action Required) ----
export function ActionRequiredWidget({ 
  tasksInReview, 
  phasesPending 
}: { 
  tasksInReview: any[]
  phasesPending: any[]
}) {
  const totalCount = tasksInReview.length + phasesPending.length

  return (
    <div className="glass-card p-6 border-amber-500/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold">Cần duyệt gấp</h3>
          {totalCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center animate-pulse">
              {totalCount}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {totalCount === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Tất cả đã được xử lý xong!</p>
          </div>
        ) : (
          <>
            {phasesPending.map((phase) => (
              <div key={phase.id} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 group">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-tighter">PHASE CHỜ DUYỆT</p>
                    <h5 className="text-sm font-semibold">{phase.name}</h5>
                    <p className="text-[10px] text-muted-foreground">Dự án: {phase.project_name}</p>
                  </div>
                </div>
              </div>
            ))}

            {tasksInReview.map((task) => (
              <div key={task.id} className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-tighter">TASK CHỜ DUYỆT</p>
                    <h5 className="text-sm font-semibold truncate max-w-[200px]">{task.title}</h5>
                    <p className="text-[10px] text-muted-foreground">Bởi: {task.assistant_name}</p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ---- Widget 3: Công việc khẩn cấp (Urgent/Overdue) ----
export function UrgentTasksWidget({ tasks }: { tasks: any[] }) {
  return (
    <div className="glass-card p-6 border-red-500/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">Việc quan trọng</h3>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Không có việc khẩn cấp.</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                task.priority === 'urgent' ? "bg-red-500/20" : "bg-orange-500/20"
              )}>
                <AlertCircle className={cn(
                  "w-5 h-5",
                  task.priority === 'urgent' ? "text-red-500" : "text-orange-500"
                )} />
              </div>
              <div className="flex-1 overflow-hidden">
                <h5 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                  {task.title}
                </h5>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter",
                    task.priority === 'urgent' ? "bg-red-500/20 text-red-500" : "bg-orange-500/20 text-orange-500"
                  )}>
                    {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    • {task.project_name}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
