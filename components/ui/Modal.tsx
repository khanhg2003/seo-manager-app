'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={cn(
        "relative w-full glass-card shadow-2xl p-0 overflow-hidden animate-slide-in-up",
        sizeClasses[size]
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-accent/30">
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

// Add these animations to globals.css if they weren't added
// @keyframes slide-in-up {
//   from { transform: translateY(20px); opacity: 0; }
//   to { transform: translateY(0); opacity: 1; }
// }
