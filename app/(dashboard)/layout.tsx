'use client'

import { useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAppStore } from '@/stores/useAppStore'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { setProfile, fetchProjects, profile, isLoading } = useAppStore()
  const supabase = createClient()

  useEffect(() => {
    async function initApp() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(profile)
        // Load initial data
        fetchProjects()
      }
    }
    initApp()
  }, [setProfile, fetchProjects, supabase])

  if (!profile && isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse">Đang tải dữ liệu hệ thống...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Top Header Placeholder / Search */}
        <header className="h-16 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10 px-8 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Bảng điều khiển hệ thống
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-foreground">{profile?.full_name}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{profile?.role}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
