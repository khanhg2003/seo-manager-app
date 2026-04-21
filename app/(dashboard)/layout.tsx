'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAppStore } from '@/stores/useAppStore'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { setProfile, fetchProjects, profile } = useAppStore()
  const supabase = createClient()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    async function initApp() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (!error && profileData) {
            setProfile(profileData)
          } else {
             console.error("No profile found for user:", user.id)
             // Fallback profile for testing purposes
             setProfile({
               id: user.id,
               full_name: 'Manager (Testing)',
               role: 'manager',
               avatar_url: null,
               created_at: new Date().toISOString(),
               updated_at: new Date().toISOString()
             })
          }
        } else {
           // No user found - providing mock profile to bypass login screen
           setProfile({
             id: 'mock-user-123',
             full_name: 'Khách (Bypass)',
             role: 'manager',
             avatar_url: null,
             created_at: new Date().toISOString(),
             updated_at: new Date().toISOString()
           })
        }
        
        await fetchProjects()
      } catch (err) {
        console.error("Dashboard init error:", err)
      } finally {
        setInitializing(false)
      }
    }
    initApp()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (initializing) {
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
        <header className="h-16 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10 px-8 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Bảng điều khiển hệ thống
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-foreground">{profile?.full_name ?? 'SEO Team'}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{profile?.role ?? 'member'}</p>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
