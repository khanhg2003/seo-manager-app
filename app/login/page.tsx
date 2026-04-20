'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Timeout 15s để tránh spinner treo vô hạn nếu Supabase không phản hồi
    const timeoutId = setTimeout(() => {
      setError('Kết nối tới máy chủ quá lâu. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.')
      setLoading(false)
    }, 15000)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      clearTimeout(timeoutId)

      if (authError) {
        setError(authError.message || 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.')
        setLoading(false)
        return
      }

      if (!data.session) {
        setError('Không thể tạo phiên đăng nhập. Vui lòng thử lại.')
        setLoading(false)
        return
      }

      // Hard navigation: đảm bảo trình duyệt gửi cookie session mới cùng request
      window.location.href = '/'

    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('Login Exception:', err)
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
        setError('Không thể kết nối tới máy chủ. Kiểm tra biến môi trường SUPABASE trên Vercel.')
      } else {
        setError(err?.message || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px]
                        rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px]
                        rounded-full bg-violet-500/8 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-primary/20 border border-primary/30 mb-4">
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">SEO Task Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Hệ thống quản lý công việc SEO nội bộ
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 shadow-2xl">
          <h2 className="text-lg font-semibold mb-6">Đăng nhập</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="form-input pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="form-label">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="form-input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground
                             hover:text-foreground transition-colors"
                  aria-label={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30
                              px-4 py-3 text-sm text-destructive animate-fade-in">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full h-11"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang đăng nhập...</>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Hệ thống nội bộ — chỉ dành cho thành viên team
        </p>
      </div>
    </div>
  )
}
