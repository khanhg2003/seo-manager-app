'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { X, Calendar, Flag, User, Loader2, MessageSquare, ExternalLink, Trash2 } from 'lucide-react'
import { TaskWithRelations, TaskPriority, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/types'
import { toast } from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import { cn, formatDate } from '@/lib/utils'

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  task: TaskWithRelations
}

export default function TaskDetailModal({ isOpen, onClose, task }: TaskDetailModalProps) {
  const { teamMembers, fetchTeamMembers, updateTask, deleteTask } = useAppStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form State
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '')
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || '')
  const [outputUrl, setOutputUrl] = useState(task.output_url || '')

  useEffect(() => {
    if (isOpen) {
      if (teamMembers.length === 0) {
        fetchTeamMembers()
      }
      // Reset form to task values when opening
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
      setDueDate(task.due_date ? task.due_date.split('T')[0] : '')
      setAssignedTo(task.assigned_to || '')
      setOutputUrl(task.output_url || '')
      setIsEditing(false)
    }
  }, [isOpen, task, teamMembers.length, fetchTeamMembers])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Tên công việc không được để trống")
      return
    }

    setLoading(true)
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        assigned_to: assignedTo === '' ? null : assignedTo,
        output_url: outputUrl.trim() === '' ? null : outputUrl.trim()
      })
      setIsEditing(false)
    } catch (err) {
      // Error handled by store toast
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa công việc này?")) return
    
    setDeleting(true)
    try {
      await deleteTask(task.id)
      onClose()
    } catch (err) {
      // Error handled by store toast
    } finally {
      setDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header bar with status */}
        <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-3">
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", STATUS_COLORS[task.status])}>
              {STATUS_LABELS[task.status]}
            </span>
            {task.is_reviewed && (
              <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200 uppercase tracking-wider">
                Đã duyệt
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-primary hover:underline px-2 py-1"
              >
                Chỉnh sửa
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-secondary rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tên công việc</label>
                <input
                  autoFocus
                  type="text"
                  className="form-input w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-bold"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mô tả</label>
                <textarea
                  rows={4}
                  className="form-input w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  placeholder="Nhập chi tiết công việc..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" /> Người thực hiện
                  </label>
                  <select
                    className="form-input w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">-- Chưa giao --</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Flag className="w-3 h-3" /> Độ ưu tiên
                  </label>
                  <select
                    className="form-input w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    disabled={loading}
                  >
                    <option value="normal">Bình thường</option>
                    <option value="high">Cao</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Hạn hoàn thành
                  </label>
                  <input
                    type="date"
                    className="form-input w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Link Output
                  </label>
                  <input
                    type="url"
                    className="form-input w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                    placeholder="https://..."
                    value={outputUrl}
                    onChange={(e) => setOutputUrl(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-red-500 hover:text-red-600 text-xs font-bold"
                  disabled={loading || deleting}
                >
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Xóa task
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-lg text-sm font-bold border border-border bg-background hover:bg-secondary"
                    disabled={loading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Lưu cập nhật
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              {/* View Mode */}
              <div>
                <h1 className="text-2xl font-black tracking-tight mb-2">{task.title}</h1>
                <div className="flex flex-wrap gap-4 items-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {task.assigned_profile ? (
                      <>
                        <Avatar profile={task.assigned_profile} size="sm" />
                        <span className="font-medium text-foreground">{task.assigned_profile.full_name}</span>
                      </>
                    ) : (
                      <span className="italic">Chưa được giao</span>
                    )}
                  </div>
                  <span>•</span>
                  <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-tighter", PRIORITY_COLORS[task.priority])}>
                    {PRIORITY_LABELS[task.priority]}
                  </div>
                  {task.due_date && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-4 h-4" />
                        {formatDate(task.due_date)}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mô tả chi tiết</h3>
                <div className="bg-secondary/20 rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap border border-border/50">
                  {task.description || <span className="italic text-muted-foreground">Không có mô tả chi tiết.</span>}
                </div>
              </div>

              {task.output_url && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Link Kết quả (Output)</h3>
                  <a 
                    href={task.output_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <ExternalLink className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-primary truncate max-w-[400px]">{task.output_url}</p>
                        <p className="text-[10px] text-primary/60 font-medium">Click để mở trong tab mới</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform text-primary">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </a>
                </div>
              )}

              {/* Social / Activity info if any */}
              <div className="flex items-center gap-6 pt-4 text-xs font-bold text-muted-foreground border-t border-border">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> 
                  {task.comments_count || 0} Thảo luận
                </div>
                <div>ID: {task.id.slice(0, 8)}</div>
                <div className="ml-auto">Cập nhật: {formatDate(task.updated_at)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
