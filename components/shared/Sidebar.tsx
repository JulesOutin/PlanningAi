'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Users,
  Building2,
  Palette,
  BookOpen,
  CalendarOff,
  CalendarDays,
  Wand2,
  BarChart3,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard/planning', label: 'Planning', icon: CalendarDays },
  { href: '/dashboard/auto-planning', label: 'Auto-planning', icon: Wand2 },
  { href: '/dashboard/previsions', label: 'Prévisions', icon: BarChart3 },
  { href: '/dashboard/moniteurs', label: 'Moniteurs', icon: Users },
  { href: '/dashboard/salles', label: 'Salles', icon: Building2 },
  { href: '/dashboard/groupes', label: 'Groupes', icon: Palette },
  { href: '/dashboard/cours', label: 'Cours', icon: BookOpen },
  { href: '/dashboard/absences', label: 'Absences', icon: CalendarOff },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Déconnexion réussie')
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 flex flex-col bg-slate-900 text-slate-100 shrink-0">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 rounded-lg p-2">
            <CalendarDays className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">MFR Planning</p>
            <p className="text-xs text-slate-400">La Chauvinière</p>
          </div>
        </div>
      </div>

      <Separator className="bg-slate-700" />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </div>
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-slate-700" />

      {/* Footer */}
      <div className="p-4">
        <p className="text-xs text-slate-500 mb-3 px-3">
          Tél: 02 43 03 87 77
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </aside>
  )
}
