'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Globe, BarChart3, Calendar, Loader2,
  FolderOpen, MoreHorizontal, ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/types'

function ProjectCard({ project }: { project: Project }) {
  const completedPhases = 0 // placeholder
  const totalPhases = 6

  const statusLabel: Record<string, string> = {
    active: 'Đang chạy',
    completed: 'Hoàn thành',
    paused: 'Tạm dừng',
  }
  const statusColor: Record<string, string> = {
    active: 'badge-in_progress',
    completed: 'badge-done',
    paused: 'badge-todo',
  }

  return (
    <div className="glass-card p-6 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm"
            style={{ backgroundColor: project.color || '#3B82F6' }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-foreground leading-tight">{project.name}</h3>
            {project.domain && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Globe className="w-3 h-3" />
                {project.domain}
              </p>
            )}
          </div>
        </div>
        <span className={`badge ${statusColor[project.status] ?? 'badge-todo'}`}>
          {statusLabel[project.status] ?? project.status}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Tiến độ</span>
          <span>{completedPhases}/{totalPhases} giai đoạn</span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill bg-primary"
            style={{ width: `${(completedPhases / totalPhases) * 100}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(project.created_at).toLocaleDateString('vi-VN')}
        </span>
        <Link
          href={`/projects/${project.id}`}
          className="btn-ghost text-xs py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Xem chi tiết
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const { projects, fetchProjects, isLoading } = useAppStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [creating, setCreating] = useState(false)
  const { profile, createProject } = useAppStore()
  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    await createProject({
      name: newName.trim(),
      domain: newDomain.trim() || undefined,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
    } as any)
    setNewName('')
    setNewDomain('')
    setShowCreate(false)
    setCreating(false)
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tất cả dự án</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý tất cả dự án SEO của team
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Tạo dự án mới
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <h2 className="text-lg font-semibold mb-5">Tạo dự án mới</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="form-label">Tên dự án *</label>
                <input
                  className="form-input"
                  placeholder="Ví dụ: Website ABC"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="form-label">Domain</label>
                <input
                  className="form-input"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="btn-secondary flex-1"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="btn-primary flex-1"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Tạo dự án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-24 text-center">
          <FolderOpen className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
          <h3 className="font-semibold text-foreground mb-2">Chưa có dự án nào</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Bắt đầu bằng cách tạo dự án SEO đầu tiên của team
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Tạo dự án đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
