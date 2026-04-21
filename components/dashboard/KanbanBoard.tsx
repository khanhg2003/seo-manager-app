'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, useDraggable, useDroppable, closestCorners } from '@dnd-kit/core'
import { TaskWithRelations, TaskStatus, STATUS_LABELS, KANBAN_COLUMNS } from '@/types'
import { useAppStore } from '@/stores/useAppStore'
import { AlertCircle, Clock, CheckCircle2, MessageSquare, MoreHorizontal } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn, formatDate } from '@/lib/utils'
import TaskDetailModal from '@/components/modals/TaskDetailModal'
import { ExternalLink } from 'lucide-react'

// Task Card Component
function TaskCard({ task, onClick }: { task: TaskWithRelations, onClick: () => void }) {
  const { moveTask } = useAppStore()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      status: task.status
    }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        "glass-card p-3 mb-2 cursor-pointer hover:border-primary/50 transition-colors bg-card group/card",
        isDragging && "opacity-50 rotate-1 scale-105 shadow-xl z-50",
        task.priority === 'urgent' && "border-l-4 border-l-red-500",
        task.priority === 'high' && "border-l-4 border-l-orange-500"
      )}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <h4 className="text-sm font-semibold text-foreground line-clamp-2 group-hover/card:text-primary transition-colors">{task.title}</h4>
        <div className="flex items-center gap-1 shrink-0">
          {task.output_url && (
            <a 
              href={task.output_url} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-primary hover:bg-primary/10 p-1 rounded-md transition-colors"
              title="Mở link output"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <div className="relative group/menu">
            <button 
              onClick={(e) => {
                e.stopPropagation()
              }}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-xl py-1 z-[60] hidden group-hover/menu:block">
              <p className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border mb-1">Cập nhật trạng thái</p>
              {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([status, label]) => (
                <button
                  key={status}
                  onClick={(e) => {
                    e.stopPropagation()
                    moveTask(task.id, status)
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors flex items-center gap-2",
                    task.status === status ? "text-primary font-bold bg-primary/5" : "text-foreground"
                  )}
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full", 
                    status === 'todo' ? "bg-gray-400" : 
                    status === 'in_progress' ? "bg-blue-500" : 
                    status === 'in_review' ? "bg-amber-500" : "bg-emerald-500"
                  )} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          {task.assigned_profile ? (
            <Avatar profile={task.assigned_profile} size="sm" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center border border-dashed border-muted-foreground">
              <span className="text-[10px] text-muted-foreground">?</span>
            </div>
          )}
          
          {(task.comments_count ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              <span>{task.comments_count}</span>
            </div>
          )}
        </div>

        {task.due_date && (
          <div className={cn(
            "text-[10px] font-medium flex items-center gap-1 px-1.5 py-0.5 rounded",
            new Date(task.due_date) < new Date() && task.status !== 'done' 
              ? "bg-red-500/10 text-red-500" 
              : "bg-secondary text-muted-foreground"
          )}>
            <Clock className="w-3 h-3" />
            {formatDate(task.due_date)}
          </div>
        )}
      </div>
    </div>
  )
}

// Kanban Column Component
function KanbanColumn({ 
  status, 
  label, 
  color, 
  tasks,
  onTaskClick
}: { 
  status: TaskStatus, 
  label: string, 
  color: string, 
  tasks: TaskWithRelations[],
  onTaskClick: (task: TaskWithRelations) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      status
    }
  })

  return (
    <div 
      className={cn(
        "flex flex-col bg-secondary/30 rounded-xl p-3 min-h-[500px]",
        color, // top border color from KANBAN_COLUMNS
        isOver && "bg-secondary/60 ring-2 ring-primary/20"
      )}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          {status === 'todo' && <Clock className="w-4 h-4 text-muted-foreground" />}
          {status === 'in_progress' && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
          {status === 'in_review' && <AlertCircle className="w-4 h-4 text-amber-500" />}
          {status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          {label}
          <span className="bg-secondary text-muted-foreground text-xs px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </h3>
      </div>

      <div ref={setNodeRef} className="flex-1 space-y-2">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
      </div>
    </div>
  )
}

export function KanbanBoard({ phaseId }: { phaseId: string }) {
  const { tasks, moveTask } = useAppStore()
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null)
  
  // Filter tasks for this phase only
  const phaseTasks = tasks.filter(t => t.phase_id === phaseId)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus
    const task = phaseTasks.find(t => t.id === taskId)

    if (task && task.status !== newStatus) {
      moveTask(taskId, newStatus)
    }
  }

  return (
    <>
      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6 items-start overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              status={col.id}
              label={col.label}
              color={col.color}
              tasks={phaseTasks.filter(t => t.status === col.id)}
              onTaskClick={setSelectedTask}
            />
          ))}
        </div>
      </DndContext>

      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
        />
      )}
    </>
  )
}
