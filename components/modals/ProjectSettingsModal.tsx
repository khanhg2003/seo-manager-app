'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { X, Settings2, Trash2, Globe, FileSpreadsheet, Loader2, Info } from 'lucide-react'
import { Project } from '@/types'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface ProjectSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project
}

export default function ProjectSettingsModal({ isOpen, onClose, project }: ProjectSettingsModalProps) {
  const { updateProject, deleteProject } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
    website_url: project.website_url || '',
    google_sheet_id: project.google_sheet_id || '',
    domain: project.domain || '',
    color: project.color,
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: project.name,
        description: project.description || '',
        website_url: project.website_url || '',
        google_sheet_id: project.google_sheet_id || '',
        domain: project.domain || '',
        color: project.color,
      })
    }
  }, [isOpen, project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error("Tên dự án không được để trống")
      return
    }

    setLoading(true)
    try {
      await updateProject(project.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        website_url: formData.website_url.trim(),
        google_sheet_id: formData.google_sheet_id.trim(),
        domain: formData.domain.trim(),
        color: formData.color,
      })
      onClose()
    } catch (error) {
      // Error handled by store toast
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa dự án "${project.name}"? Hành động này không thể hoàn tác và tất cả các task liên quan sẽ bị mất.`)) {
      return
    }

    setDeleting(true)
    try {
      await deleteProject(project.id, {
        onSuccess: () => {
          onClose()
          window.location.href = '/projects'
        }
      })
    } catch (error) {
      // Error handled by store toast
    } finally {
      setDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Cài đặt dự án</h2>
              <p className="text-xs text-muted-foreground">Quản lý thông tin và cấu hình dự án</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="project-settings-form" onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {/* General Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tên dự án</label>
                <input
                  type="text"
                  className="form-input w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading || deleting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Màu thương hiệu</label>
                <div className="flex flex-wrap gap-2">
                  {['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#10b981', '#06b6d4', '#3b82f6'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-transform",
                        formData.color === color ? "border-primary scale-110 shadow-lg" : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mô tả dự án</label>
              <textarea
                className="form-input w-full flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading || deleting}
                placeholder="Mô tả tóm tắt về dự án..."
              />
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Links & IDs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  className="form-input w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  disabled={loading || deleting}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Domain (Rút gọn)</label>
                <input
                  type="text"
                  placeholder="example.com"
                  className="form-input w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  disabled={loading || deleting}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Google Sheet ID
                </label>
                <input
                  type="text"
                  placeholder="ID từ URL của bảng tính"
                  className="form-input w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
                  value={formData.google_sheet_id}
                  onChange={(e) => setFormData({ ...formData, google_sheet_id: e.target.value })}
                  disabled={loading || deleting}
                />
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700 leading-relaxed">
                  Dùng để đồng bộ dữ liệu báo cáo tự động từ Google Sheet lên hệ thống quản lý task.
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Danger Zone */}
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mt-4">
            <h3 className="text-red-700 font-bold text-sm mb-1">Khu vực nguy hiểm</h3>
            <p className="text-red-600/70 text-xs mb-4 italic">Xóa vĩnh viễn dự án này và toàn bộ dữ liệu liên quan.</p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || deleting}
              className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all text-sm font-bold shadow-sm"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Xóa dự án này
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-secondary/30">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm font-bold border border-border bg-background hover:bg-secondary transition-colors"
            disabled={loading || deleting}
          >
            Hủy
          </button>
          <button
            type="submit"
            form="project-settings-form"
            className="px-10 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
            disabled={loading || deleting}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  )
}
