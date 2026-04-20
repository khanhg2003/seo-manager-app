'use client'

import { cn, getInitials } from '@/lib/utils'
import type { Profile } from '@/types'

interface AvatarProps {
  profile?: Profile | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
}

const colorMap = [
  'bg-violet-600',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-pink-600',
]

function getColor(name: string): string {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % colorMap.length
  return colorMap[hash]
}

export function Avatar({ profile, size = 'md', className }: AvatarProps) {
  if (!profile) {
    return (
      <div className={cn(
        'rounded-full bg-muted border border-border flex items-center justify-center',
        sizeMap[size], className
      )}>
        <span className="text-muted-foreground">?</span>
      </div>
    )
  }

  const initials = getInitials(profile.full_name)
  const color = getColor(profile.full_name)

  if (profile.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatar_url}
        alt={profile.full_name}
        className={cn('rounded-full object-cover', sizeMap[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white',
        color, sizeMap[size], className
      )}
      title={profile.full_name}
    >
      {initials}
    </div>
  )
}
