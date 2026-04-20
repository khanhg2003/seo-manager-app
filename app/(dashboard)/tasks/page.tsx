'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Loader2, Calendar } from 'lucide-react'

type Task = {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  projects: { name: string } | null
}

const statusLabel: Record<string, string> = {
  todo: 'Chờ làm',
  in_progress: 'Đang làm',
  in_review: 'Cần duyệt',
  done: 'Hoàn thành',
}
const priorityLabel: Record<string, string> = {
  normal: 'Bình thường',
  high: 'Cao',
  urgent: 'Khẩn',
}

export default function TasksPage() {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('active')

  useEffect(() => {
    async function loadTasks() {
      setLoading(true)
      let query = supabase
        .from('tasks')
        .select('id, title, status, priority, due_date, projects(name)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (filter === 'active') {
        query = query.neq('status', 'done')
      } else if (filter === 'done') {
        query = query.eq('status', 'done')
      }

      const { data } = await query
      setTasks((data as unknown as Task[]) ?? [])
      setLoading(false)
    }
    loadTasks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const grouped = {
    urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'done'),
    in_review: tasks.filter(t => t.status === 'in_review'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    todo: tasks.filter(t => t.status === 'todo'),
    done: tasks.filter(t => t.status === 'done'),
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Việc của tôi</h1>
          <p className="text-muted-foreground mt-1">
            Các task được giao và đang theo dõi
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          {(['all', 'active', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? 'Tất cả' : f === 'active' ? 'Đang làm' : 'Hoàn thành'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-24 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
          <h3 className="font-semibold text-foreground mb-2">Không có task nào!</h3>
          <p className="text-muted-foreground text-sm">Tất cả công việc đã hoàn thành.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Urgent */}
          {grouped.urgent.length > 0 && (
            <Section
              title="⚡ Khẩn cấp"
              tasks={grouped.urgent}
              headerClass="text-red-600"
            />
          )}

          {/* In review */}
          {grouped.in_review.length > 0 && (
            <Section
              title="👀 Cần duyệt"
              tasks={grouped.in_review}
              headerClass="text-amber-600"
            />
          )}

          {/* In progress */}
          {grouped.in_progress.length > 0 && (
            <Section
              title="🔄 Đang làm"
              tasks={grouped.in_progress}
              headerClass="text-blue-600"
            />
          )}

          {/* Todo */}
          {grouped.todo.length > 0 && (
            <Section
              title="📋 Chờ làm"
              tasks={grouped.todo}
              headerClass="text-muted-foreground"
            />
          )}

          {/* Done */}
          {filter !== 'active' && grouped.done.length > 0 && (
            <Section
              title="✅ Đã xong"
              tasks={grouped.done}
              headerClass="text-green-600"
            />
          )}
        </div>
      )}
    </div>
  )
}

function Section({
  title, tasks, headerClass
}: {
  title: string
  tasks: Task[]
  headerClass?: string
}) {
  return (
    <div>
      <h2 className={`text-sm font-semibold mb-3 ${headerClass ?? ''}`}>
        {title} <span className="text-muted-foreground font-normal">({tasks.length})</span>
      </h2>
      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            className="glass-card px-4 py-3 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`badge ${('badge-' + task.status) as string} shrink-0`}>
              {statusLabel[task.status] ?? task.status}
            </div>
            <span className="flex-1 text-sm font-medium text-foreground truncate">
              {task.title}
            </span>
            {task.projects && (
              <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                {(task.projects as { name: string }).name}
              </span>
            )}
            <span className={`badge ${'badge-' + task.priority} shrink-0`}>
              {priorityLabel[task.priority] ?? task.priority}
            </span>
            {task.due_date && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                <Calendar className="w-3 h-3" />
                {new Date(task.due_date).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
