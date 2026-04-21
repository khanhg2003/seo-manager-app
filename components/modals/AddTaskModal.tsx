'use client'

import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { X, Loader2 } from 'lucide-react'
import { TaskStatus, TaskPriority } from '@/types'

export function AddTaskModal({ 
  isOpen, 
  onClose, 
  projectId, 
  phaseId 
}: { 
  isOpen: boolean
  onClose: () => void
  projectId: string
  phaseId: string 
}) {
  const { createTask, profile } = useAppStore()
  
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  
  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    
    setLoading(true)
    await createTask({
      project_id: projectId,
      phase_id: phaseId,
      title: title.trim(),
      description: description.trim(),
      status: 'todo',
      priority,
      assigned_to: profile?.id // Giao mặc định cho người tạo
    })
    setLoading(false)
    setTitle('')
    setDescription('')
    setPriority('normal')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border p-6 animate-in zoom-in-95">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Thêm Task mới</h2>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Tên công việc <span className="text-red-500">*</span></label>
            <input 
              required
              autoFocus
              className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              placeholder="Ví dụ: Viết 5 bài blog tháng này..."
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Mô tả chi tiết</label>
            <textarea 
              className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground min-h-[100px] resize-y"
              placeholder="Thêm mô tả cho task nếu cần..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Độ ưu tiên</label>
            <div className="flex gap-3">
              {(['normal', 'high', 'urgent'] as const).map(p => (
                <label 
                  key={p} 
                  className={`flex-1 cursor-pointer border rounded-lg p-3 text-center transition-all ${
                    priority === p ? 'bg-primary/10 border-primary text-primary font-bold' : 'border-border text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <input type="radio" value={p} checked={priority === p} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="hidden" />
                  {p === 'normal' ? 'Bình thường' : p === 'high' ? 'Cao' : 'Khẩn cấp'}
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary rounded-lg px-5">Hủy</button>
            <button type="submit" disabled={loading} className="btn-primary rounded-lg px-6 flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Tạo Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
