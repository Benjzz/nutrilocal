'use client'

import { useApp } from '@/context/AppContext'

export default function ProfileSwitcher() {
  const { profiles, activeProfileId, setActiveProfileId } = useApp()

  if (profiles.length === 0) return null

  return (
    <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
      {profiles.map((p) => (
        <button
          key={p.id}
          onClick={() => setActiveProfileId(p.id)}
          className={`flex-1 text-sm font-medium py-1.5 px-3 rounded-lg transition-all ${
            activeProfileId === p.id
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500'
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>
  )
}
