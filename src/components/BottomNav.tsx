'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Calendar, Apple, ChefHat, User } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Journal', icon: BookOpen },
  { href: '/calendrier', label: 'Calendrier', icon: Calendar },
  { href: '/aliments', label: 'Aliments', icon: Apple },
  { href: '/recettes', label: 'Recettes', icon: ChefHat },
  { href: '/profils', label: 'Profils', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors"
            >
              <Icon
                size={22}
                className={active ? 'text-green-500' : 'text-slate-400'}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-medium ${
                  active ? 'text-green-500' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
