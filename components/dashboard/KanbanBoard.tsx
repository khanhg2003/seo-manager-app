'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, useDraggable, useDroppable, closestCorners } from '@dnd-kit/core'
import { TaskWithRelations, TaskStatus, STATUS_LABELS, KANBAN_COLUMNS } from '@/types'
import { useAppStore } from '@/stores/useAppStore'
import { AlertCircle, Clock, CheckCircle2, MessageSquare, MoreHorizontal } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn, formatDate } from '@/lib/utils'

// Task Card Component
function TaskCard({ task }: { task: TaskWithRelations }) {
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
      className={cn(
        "glass-card p-3 mb-2 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors bg-card",
        isDragging && "opacity-50 rotate-1 scale-105 shadow-xl z-50",
        task.priority === 'urgent' && "border-l-4 border-l-red-500",
        task.priority === 'high' && "border-l-4 border-l-orange-500"
      )}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <h4 className="text-sm font-semibold text-foreground line-clamp-2">{task.title}</h4>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="w-4 h-4" />
        </button>
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
function KanbanColumn({ status, label, color, tasks }: { status: TaskStatus, label: string, color: string, tasks: TaskWithRelations[] }) {
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
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}

export function KanbanBoard({ phaseId }: { phaseId: string }) {
  const { tasks, moveTask } = useAppStore()
  
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
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6 items-start overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            status={col.id}
            label={col.label}
            color={col.color}
            tasks={phaseTasks.filter(t => t.status === col.id)}
          />
        ))}
      </div>
    </DndContext>
  )
}
