'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import ProfileSwitcher from '@/components/ProfileSwitcher'
import { createClient } from '@/lib/supabase/client'
import { DayLog } from '@/lib/types'
import { calculateItemMacros, sumMacros, formatDate } from '@/lib/utils'

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function CalendrierPage() {
  const router = useRouter()
  const { activeProfileId, setCurrentDate, ingredients, recipes } = useApp()
  const supabase = createClient()

  const today = new Date()
  const todayStr = formatDate(today)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [monthLogs, setMonthLogs] = useState<DayLog[]>([])
  const [weekLogs, setWeekLogs] = useState<DayLog[]>([])

  // Dates de la semaine en cours (lundi → dimanche)
  const weekDates = useMemo(() => {
    const dow = today.getDay()
    const diff = dow === 0 ? -6 : 1 - dow
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return formatDate(d)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr])

  // Charger les logs du mois affiché
  useEffect(() => {
    if (!activeProfileId) return
    const start = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`
    const endDay = new Date(viewYear, viewMonth + 1, 0).getDate()
    const end = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`

    supabase
      .from('day_logs')
      .select('*')
      .eq('profile_id', activeProfileId)
      .gte('date', start)
      .lte('date', end)
      .then(({ data }) => {
        if (data) setMonthLogs(data as DayLog[])
      })
  }, [activeProfileId, viewYear, viewMonth, supabase])

  // Charger les logs de la semaine en cours
  useEffect(() => {
    if (!activeProfileId || weekDates.length === 0) return
    supabase
      .from('day_logs')
      .select('*')
      .eq('profile_id', activeProfileId)
      .gte('date', weekDates[0])
      .lte('date', weekDates[6])
      .then(({ data }) => {
        if (data) setWeekLogs(data as DayLog[])
      })
  }, [activeProfileId, weekDates, supabase])

  const logByDate = useMemo(() => {
    const map = new Map<string, DayLog>()
    for (const log of monthLogs) map.set(log.date, log)
    return map
  }, [monthLogs])

  const weekLogByDate = useMemo(() => {
    const map = new Map<string, DayLog>()
    for (const log of weekLogs) map.set(log.date, log)
    return map
  }, [weekLogs])

  function getCaloriesForLog(log: DayLog | undefined): number | null {
    if (!log || log.meals.length === 0) return null
    const total = sumMacros(
      log.meals.flatMap((m) => m.items.map((item) => calculateItemMacros(item, ingredients, recipes)))
    ).calories
    return total || null
  }

  function getCaloriesForDate(dateStr: string): number | null {
    return getCaloriesForLog(logByDate.get(dateStr))
  }

  function navigateMonth(delta: number) {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setViewMonth(m)
    setViewYear(y)
  }

  // Construire la grille du calendrier (lundi en premier)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const lastDay = new Date(viewYear, viewMonth + 1, 0)
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6
    const days: (number | null)[] = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [viewYear, viewMonth])

  function handleDayClick(day: number) {
    const dateStr = formatDate(new Date(viewYear, viewMonth, day))
    setCurrentDate(dateStr)
    router.push('/')
  }

  // Données semaine pour le graphique
  const weekCalories = weekDates.map((d) => getCaloriesForLog(weekLogByDate.get(d)))
  const weekMax = Math.max(...weekCalories.filter((c): c is number => c !== null), 1)

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      <ProfileSwitcher />

      {/* Graphique semaine en cours */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Semaine en cours</h3>
        <div className="flex items-end gap-1.5" style={{ height: 100 }}>
          {weekDates.map((dateStr, i) => {
            const cal = weekCalories[i]
            const isToday = dateStr === todayStr
            const barHeight = cal ? Math.max((cal / weekMax) * 80, 6) : 0
            const isPast = dateStr < todayStr

            return (
              <div
                key={dateStr}
                className="flex-1 flex flex-col items-center justify-end gap-1 h-full cursor-pointer"
                onClick={() => { setCurrentDate(dateStr); router.push('/') }}
              >
                {/* Valeur */}
                <span className={`text-[9px] font-medium leading-none ${cal ? (isToday ? 'text-green-500' : 'text-slate-500') : 'text-transparent'}`}>
                  {cal ?? 0}
                </span>
                {/* Barre */}
                <div className="w-full flex flex-col justify-end" style={{ height: 80 }}>
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isToday
                        ? 'bg-green-500'
                        : cal
                        ? isPast ? 'bg-slate-300' : 'bg-slate-200'
                        : 'bg-slate-100'
                    }`}
                    style={{ height: barHeight || 4, opacity: barHeight ? 1 : 0.4 }}
                  />
                </div>
                {/* Jour */}
                <span className={`text-[10px] font-medium ${isToday ? 'text-green-500' : 'text-slate-400'}`}>
                  {DAYS_FR[i]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigateMonth(-1)} className="p-2 text-slate-400">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-base font-semibold text-slate-800">
          {MONTHS_FR[viewMonth]} {viewYear}
        </h2>
        <button onClick={() => navigateMonth(1)} className="p-2 text-slate-400">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS_FR.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-slate-400 py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="aspect-square" />
            }
            const dateStr = formatDate(new Date(viewYear, viewMonth, day))
            const log = logByDate.get(dateStr)
            const calories = getCaloriesForDate(dateStr)
            const isToday = dateStr === todayStr
            const isTraining = log?.day_type === 'training'
            const hasData = calories !== null

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className="aspect-square flex flex-col items-center justify-center gap-0.5 relative hover:bg-slate-50 transition-colors"
              >
                <div
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${
                    isToday
                      ? 'bg-green-500 text-white'
                      : hasData
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {day}
                </div>
                {hasData && (
                  <span className="text-[9px] text-slate-400 leading-none">
                    {calories}
                  </span>
                )}
                {isTraining && (
                  <Dumbbell size={8} className="text-green-400 absolute top-1 right-1" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Résumé du mois (sans moyenne calories) */}
      {monthLogs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Résumé du mois</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Jours trackés</p>
              <p className="text-xl font-bold text-slate-800">{monthLogs.length}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Entraînements</p>
              <p className="text-xl font-bold text-green-500">
                {monthLogs.filter((l) => l.day_type === 'training').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
