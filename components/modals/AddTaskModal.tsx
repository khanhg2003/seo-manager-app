'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { X, Calendar, Flag, User, Loader2 } from 'lucide-react'
import { TaskPriority } from '@/types'
import { toast } from 'react-hot-toast'

interface AddTaskModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  phaseId: string
}

export default function AddTaskModal({ isOpen, onClose, projectId, phaseId }: AddTaskModalProps) {
  const { profile, teamMembers, fetchTeamMembers, createTask } = useAppStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [status, setStatus] = useState<'todo' | 'in_progress'>('todo')
  const [outputUrl, setOutputUrl] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (teamMembers.length === 0) {
        fetchTeamMembers()
      }
      if (profile && !assignedTo) {
        setAssignedTo(profile.id)
      }
    }
  }, [isOpen, profile, teamMembers.length, fetchTeamMembers, assignedTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Vui long nhap ten cong viec')
      return
    }

    setLoading(true)
    try {
      const task = await createTask({
        project_id: projectId,
        phase_id: phaseId,
        title: title.trim(),
        description: description.trim(),
        status: status,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        assigned_to: assignedTo.trim() === '' ? null : assignedTo,
        output_url: outputUrl.trim() === '' ? null : outputUrl.trim(),
      })

      if (task) {
        toast.success('Tao cong viec thanh cong!')
        onClose()
        setTitle('')
        setDescription('')
        setDueDate('')
        setPriority('normal')
        setOutputUrl('')
      } else {
        const errorMsg = useAppStore.getState().error || 'Khong ro nguyen nhan'
        toast.error(`Loi tao task: ${errorMsg}`)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Loi he thong: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-6 bg-primary rounded-full" />
              Tao cong viec moi
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="form-label flex items-center gap-2 text-sm font-medium">
                Ten cong viec <span className="text-destructive">*</span>
              </label>
              <input
                autoFocus
                type="text"
                className="form-input w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm"
                placeholder="Vi du: Audit technical website khach hang..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label text-sm font-medium">Mo ta chi tiet</label>
              <textarea
                rows={3}
                className="form-input w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm resize-none"
                placeholder="Nhap noi dung cong viec..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="form-label flex items-center gap-1.5 text-sm font-medium">
                  <User className="w-3.5 h-3.5" /> Nguoi thuc hien
                </label>
                <select
                  className="form-input w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Chon nhan vien --</option>
                  {teamMembers.map((member: { id: string; full_name: string; role: string }) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name} ({member.role === 'manager' ? 'Quan ly' : 'Tro ly'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="form-label flex items-center gap-1.5 text-sm font-medium">
                  <Flag className="w-3.5 h-3.5" /> Do uu tien
                </label>
                <select
                  className="form-input w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  disabled={loading}
                >
                  <option value="normal">Binh thuong</option>
                  <option value="high">Cao</option>
                  <option value="urgent">Khan cap</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="form-label flex items-center gap-1.5 text-sm font-medium">
                  <Calendar className="w-3.5 h-3.5" /> Han hoan thanh
                </label>
                <input
                  type="date"
                  className="form-input w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="form-label text-sm font-medium">Trang thai dau</label>
                <select
                  className="form-input w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'todo' | 'in_progress')}
                  disabled={loading}
                >
                  <option value="todo">Can lam (Todo)</option>
                  <option value="in_progress">Dang lam</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="form-label flex items-center gap-2 text-sm font-medium text-primary">
                Link Output (Bao cao ket qua)
              </label>
              <input
                type="url"
                className="form-input w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm"
                placeholder="https://docs.google.com/spreadsheets/..."
                value={outputUrl}
                onChange={(e) => setOutputUrl(e.target.value)}
                disabled={loading}
              />
              <p className="text-[10px] text-muted-foreground italic">
                Link tai lieu, bai viet hoac bao cao cua cong viec nay.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary transition-all duration-150 px-6 py-2 rounded-lg border border-border bg-white text-sm hover:bg-secondary font-medium"
                disabled={loading}
              >
                Huy
              </button>
              <button
                type="submit"
                className="btn-primary transition-all duration-150 px-8 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary/90 flex items-center gap-2 min-w-[140px] justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Dang luu...
                  </>
                ) : (
                  'Tao cong viec'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
