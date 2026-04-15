'use client'

import { useState } from 'react'
import { Apple, ChefHat } from 'lucide-react'
import AlimentsPage from '@/app/aliments/page'
import RecettesPage from '@/app/recettes/page'

type Tab = 'aliments' | 'recettes'

export default function BibliothequePage() {
  const [tab, setTab] = useState<Tab>('aliments')

  return (
    <div>
      {/* Tab bar sticky */}
      <div className="sticky top-0 bg-white border-b border-slate-100 z-10 px-4 py-2 flex gap-2">
        <button
          onClick={() => setTab('aliments')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-xl transition-colors ${
            tab === 'aliments' ? 'bg-green-50 text-green-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Apple size={15} />
          Aliments
        </button>
        <button
          onClick={() => setTab('recettes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-xl transition-colors ${
            tab === 'recettes' ? 'bg-green-50 text-green-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ChefHat size={15} />
          Recettes
        </button>
      </div>

      {tab === 'aliments' ? <AlimentsPage /> : <RecettesPage />}
    </div>
  )
}
