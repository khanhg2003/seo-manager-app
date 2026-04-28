'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppStore } from '@/stores/useAppStore'
import { KanbanBoard } from '@/components/dashboard/KanbanBoard'
import { SeoMetricsPanel } from '@/components/dashboard/SeoMetricsPanel'
import AddTaskModal from '@/components/modals/AddTaskModal'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Plus,
  Settings2,
  Lock
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import ProjectSettingsModal from '@/components/modals/ProjectSettingsModal'

export default function ProjectDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const {
    profile,
    projects,
    phases,
    fetchProjects,
    fetchPhases,
    fetchTasksByProject,
    approvePhase,
    reopenPhase,
    selectedProject,
    setSelectedProject,
    isLoading
  } = useAppStore()

  const [activePhaseId, setActivePhaseId] = useState<string | null>(null)
  const [initing, setIniting] = useState(true)
  const [approving, setApproving] = useState(false)
  const [reopening, setReopening] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'tasks' | 'seo'>('tasks')

  // Initialize data for this specific project
  useEffect(() => {
    let active = true

    async function loadData() {
      if (!id || typeof id !== 'string') return

      setIniting(true)

      // Load projects if not loaded directly (e.g., page refresh)
      if (projects.length === 0) {
        await fetchProjects()
      }

      const currentProject = useAppStore.getState().projects.find(p => p.id === id)

      if (!currentProject) {
        if (active) router.push('/projects')
        return
      }

      setSelectedProject(currentProject)
      await fetchPhases(currentProject.id)
      await fetchTasksByProject(currentProject.id)

      // Auto select the first active phase or the very first phase by default
      const currentPhases = useAppStore.getState().phases
      if (currentPhases.length > 0) {
        const activePhase = currentPhases.find(p => p.status === 'active')
        setActivePhaseId(activePhase ? activePhase.id : currentPhases[0].id)
      }

      if (active) setIniting(false)
    }

    loadData()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (initing) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!selectedProject) return null

  const activePhase = phases.find(p => p.id === activePhaseId)
  const isManager = profile?.role === 'manager'

  const handleApprove = async () => {
    if (!activePhaseId) return
    setApproving(true)
    await approvePhase(activePhaseId)
    setApproving(false)
  }

  const handleReopen = async () => {
    if (!activePhaseId) return
    if (!confirm("Bạn có chắc chắn muốn mở lại Phase này?")) return
    setReopening(true)
    await reopenPhase(activePhaseId)
    setReopening(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center gap-4 text-sm">
        <Link
          href="/projects"
          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-card hover:text-foreground transition-colors border shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: selectedProject.color }}
            />
            <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
            <span className="badge badge-in_progress">{selectedProject.status}</span>
          </div>
          {selectedProject.domain && (
            <p className="text-muted-foreground mt-1 text-xs">{selectedProject.domain}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            className="btn-secondary"
            onClick={() => setIsSettingsModalOpen(true)}
          >
            <Settings2 className="w-4 h-4" /> Cài đặt
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              if (!activePhaseId) {
                alert("Vui lòng chọn 1 Phase trước khi thêm task!")
                return
              }
              setIsTaskModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4" /> Thêm Task
          </button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="flex items-center gap-4 border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('tasks')}
          className={cn(
            "pb-3 text-sm font-bold transition-all border-b-2",
            activeTab === 'tasks' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Công việc (Phases)
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={cn(
            "pb-3 text-sm font-bold transition-all border-b-2",
            activeTab === 'seo' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Hiệu suất SEO
        </button>
      </div>

      {activeTab === 'tasks' ? (
        <div className="space-y-6">
          {/* Phase Navigation Tabs */}
          <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex items-center gap-2 p-1 bg-secondary/50 rounded-xl w-max">
              {phases.map(phase => (
                <button
                  key={phase.id}
                  onClick={() => setActivePhaseId(phase.id)}
                  className={cn(
                    "px-5 py-2.5 rounded-lg text-sm font-medium transition-all min-w-[160px] text-center flex flex-col items-center gap-1",
                    activePhaseId === phase.id
                      ? "bg-card shadow-sm text-foreground ring-1 ring-border"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    phase.status === 'completed' && "opacity-60"
                  )}
                >
                  <span className="truncate w-full">{phase.name}</span>
                  <div className="flex items-center justify-center gap-1 w-full">
                    {phase.status === 'completed' ? (
                      <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Hoàn thành
                      </span>
                    ) : (
                      <span className="text-[10px] text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Đang chạy
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {profile?.role === 'assistant' && (
                <button className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-muted-foreground hover:bg-secondary flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Thêm Phase
                </button>
              )}
            </div>
          </div>

          {/* Phase Action Bar */}
          {activePhase && (
            <div className="glass-card p-4 flex items-center justify-between shadow-sm">
              <div>
                <h3 className="font-bold text-foreground">{activePhase.name}</h3>
                {activePhase.status === 'completed' ? (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Đã được phê duyệt
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Đang trong quá trình thực hiện. Kéo thả task để cập nhật trạng thái.
                  </p>
                )}
              </div>

              {/* Nút Action cho Phase */}
              <div className="flex items-center gap-3">
                {activePhase.status === 'completed' ? (
                  isManager && (
                    <button
                      onClick={handleReopen}
                      disabled={reopening}
                      className="btn-secondary border-amber-500/50 text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                    >
                      {reopening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      Mở lại Phase
                    </button>
                  )
                ) : (
                  isManager ? (
                    <button
                      onClick={handleApprove}
                      disabled={approving}
                      className="btn-primary bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 shadow-lg"
                    >
                      {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Duyệt & Đóng Phase
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-md bg-secondary/80 flex items-center gap-2 text-xs font-medium text-muted-foreground border border-border" title="Chỉ Manager mới có quyền duyệt phase này">
                      <Lock className="w-3 h-3" /> Chờ Manager duyệt
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Progress Bar for Active Phase */}
          {activePhase && (
            <div className="px-1">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tiến độ giai đoạn</span>
                <span className="text-sm font-bold text-primary">
                  {(() => {
                    const phaseTasks = useAppStore.getState().tasks.filter(t => t.phase_id === activePhase.id)
                    if (phaseTasks.length === 0) return activePhase.status === 'completed' ? '100%' : '0%'
                    const done = phaseTasks.filter(t => t.status === 'done').length
                    return Math.round((done / phaseTasks.length) * 100) + '%'
                  })()}
                </span>
              </div>
              <div className="progress-bar-track h-2 bg-secondary shadow-inner">
                <div
                  className="progress-bar-fill bg-primary h-full transition-all duration-500 shadow-lg shadow-primary/20"
                  style={{
                    width: (() => {
                      const phaseTasks = useAppStore.getState().tasks.filter(t => t.phase_id === activePhase.id)
                      if (phaseTasks.length === 0) return activePhase.status === 'completed' ? '100' : '0'
                      const done = phaseTasks.filter(t => t.status === 'done').length
                      return Math.round((done / phaseTasks.length) * 100)
                    })() + '%'
                  }}
                />
              </div>
            </div>
          )}

          {/* Kanban Board cho Phase được chọn */}
          {activePhaseId ? (
            <KanbanBoard phaseId={activePhaseId} />
          ) : (
            <div className="flex h-[400px] items-center justify-center text-muted-foreground glass-card rounded-2xl">
              Vui lòng chọn hoặc tạo một Phase để xem công việc.
            </div>
          )}
        </div>
      ) : (
        /* SEO METRICS TAB */
        <SeoMetricsPanel projectId={selectedProject.id} />
      )}

      {/* Modals */}
      <AddTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        projectId={selectedProject.id}
        phaseId={activePhaseId || ''}
      />

      <ProjectSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        project={selectedProject}
      />
    </div>
  )
}
