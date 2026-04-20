'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Settings, 
  LogOut,
  ChevronRight,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { useAppStore } from '@/stores/useAppStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { profile, projects } = useAppStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { label: 'Tổng quan', href: '/', icon: LayoutDashboard },
    { label: 'Tất cả dự án', href: '/projects', icon: Briefcase },
    { label: 'Việc của tôi', href: '/tasks', icon: CheckSquare },
  ]

  return (
    <aside className="w-64 border-r border-sidebar-border bg-[hsl(var(--sidebar-bg))] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">SEO Manager</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "sidebar-nav-item",
              pathname === item.href && "active"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}

        {/* Projects Quick Access */}
        <div className="mt-8">
          <p className="px-3 text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
            Dự án đang làm
          </p>
          <div className="space-y-1">
            {projects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={cn(
                  "sidebar-nav-item py-2 opacity-80 hover:opacity-100",
                  pathname.includes(project.id) && "active opacity-100"
                )}
              >
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: project.color }} 
                />
                <span className="truncate">{project.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* User Info & Profile */}
      <div className="p-4 border-t border-sidebar-border space-y-4">
        <div className="flex items-center gap-3 px-2">
          <Avatar profile={profile} size="md" />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate">{profile?.full_name}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
              {profile?.role === 'manager' ? 'Quản lý' : 'Trợ lý'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="sidebar-nav-item w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
