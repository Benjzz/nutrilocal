'use client'

import { useState, useMemo } from 'react'
import { Plus, Dumbbell, Coffee, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import ProfileSwitcher from '@/components/ProfileSwitcher'
import CalorieRing from '@/components/CalorieRing'
import MacroBar from '@/components/MacroBar'
import MealSection from '@/components/MealSection'
import { DayLog, Meal, MealType, MEAL_TYPE_LABELS } from '@/lib/types'
import { calculateItemMacros, sumMacros, frenchDate, generateId, todayStr, formatDate } from '@/lib/utils'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'

const MEAL_PRESETS: { name: string; meal_type: MealType }[] = [
  { name: 'Petit-déjeuner', meal_type: 'plat' },
  { name: 'Déjeuner', meal_type: 'plat' },
  { name: 'Dîner', meal_type: 'plat' },
  { name: 'Collation', meal_type: 'collation' },
]

export default function JournalPage() {
  const {
    activeProfile,
    activeProfileId,
    dayLog,
    currentDate,
    setCurrentDate,
    setDayType,
    saveDayLog,
    ingredients,
    recipes,
    loading,
  } = useApp()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = meals.findIndex((m) => m.id === active.id)
    const newIndex = meals.findIndex((m) => m.id === over.id)
    const reordered = arrayMove(meals, oldIndex, newIndex)
    updateMeals(reordered)
  }

  const [addingMeal, setAddingMeal] = useState(false)
  const [customMealName, setCustomMealName] = useState('')
  const [customMealType, setCustomMealType] = useState<MealType>('plat')

  const goals = useMemo(() => {
    if (!activeProfile) return { calories: 0, proteins: 0, carbs: 0, fats: 0 }
    const type = dayLog?.day_type ?? 'rest'
    return activeProfile.goals[type]
  }, [activeProfile, dayLog])

  const meals: Meal[] = dayLog?.meals ?? []

  const totalMacros = useMemo(() => {
    const allItemMacros = meals.flatMap((meal) =>
      meal.items.map((item) => calculateItemMacros(item, ingredients, recipes))
    )
    return sumMacros(allItemMacros)
  }, [meals, ingredients, recipes])

  function navigateDate(delta: number) {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + delta)
    setCurrentDate(formatDate(d))
  }

  async function updateMeals(newMeals: Meal[]) {
    if (!activeProfileId) return
    const log: DayLog = {
      id: dayLog?.id ?? generateId(),
      profile_id: activeProfileId,
      date: currentDate,
      day_type: dayLog?.day_type ?? 'rest',
      meals: newMeals,
    }
    await saveDayLog(log)
  }

  async function addMeal(name: string, meal_type: MealType) {
    const newMeal: Meal = { id: generateId(), name, meal_type, items: [] }
    await updateMeals([...meals, newMeal])
    setAddingMeal(false)
    setCustomMealName('')
    setCustomMealType('plat')
  }

  async function updateMeal(updated: Meal) {
    await updateMeals(meals.map((m) => (m.id === updated.id ? updated : m)))
  }

  async function deleteMeal(id: string) {
    await updateMeals(meals.filter((m) => m.id !== id))
  }

  const isToday = currentDate === todayStr()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 px-4 pt-5 pb-4">
      <ProfileSwitcher />

      <div className="flex items-center justify-between">
        <button onClick={() => navigateDate(-1)} className="p-2 text-slate-400 hover:text-slate-600">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700 capitalize">{frenchDate(currentDate)}</p>
          {isToday && <p className="text-xs text-green-500 font-medium">Aujourd&apos;hui</p>}
        </div>
        <button
          onClick={() => navigateDate(1)}
          className={`p-2 transition-colors ${isToday ? 'text-slate-200 cursor-default' : 'text-slate-400 hover:text-slate-600'}`}
          disabled={isToday}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setDayType('rest')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            (dayLog?.day_type ?? 'rest') === 'rest'
              ? 'bg-blue-50 text-blue-600 border border-blue-200'
              : 'bg-white text-slate-400 border border-slate-100'
          }`}
        >
          <Coffee size={16} />
          Repos
        </button>
        <button
          onClick={() => setDayType('training')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            dayLog?.day_type === 'training'
              ? 'bg-green-50 text-green-600 border border-green-200'
              : 'bg-white text-slate-400 border border-slate-100'
          }`}
        >
          <Dumbbell size={16} />
          Entraînement
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <CalorieRing value={totalMacros.calories} goal={goals.calories} />
          <div className="flex-1 space-y-2.5">
            <MacroBar label="Protéines" value={totalMacros.proteins} goal={goals.proteins} color="bg-blue-400" />
            <MacroBar label="Glucides" value={totalMacros.carbs} goal={goals.carbs} color="bg-amber-400" />
            <MacroBar label="Lipides" value={totalMacros.fats} goal={goals.fats} color="bg-pink-400" />
          </div>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={meals.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {meals.map((meal) => (
              <MealSection key={meal.id} meal={meal} onUpdate={updateMeal} onDelete={() => deleteMeal(meal.id)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {addingMeal ? (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-sm font-medium text-slate-600">Ajouter un repas</p>

          {/* Presets */}
          <div className="grid grid-cols-2 gap-2">
            {MEAL_PRESETS.filter((p) => !meals.find((m) => m.name === p.name)).map((preset) => (
              <button
                key={preset.name}
                onClick={() => addMeal(preset.name, preset.meal_type)}
                className="py-2 px-3 text-sm font-medium bg-slate-50 rounded-xl text-slate-700 hover:bg-slate-100 text-left"
              >
                <span>{preset.name}</span>
                <span className={`ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  preset.meal_type === 'plat' ? 'bg-orange-100 text-orange-500' :
                  preset.meal_type === 'collation' ? 'bg-purple-100 text-purple-500' :
                  'bg-blue-100 text-blue-500'
                }`}>{MEAL_TYPE_LABELS[preset.meal_type]}</span>
              </button>
            ))}
          </div>

          {/* Custom */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Nom personnalisé..."
              value={customMealName}
              onChange={(e) => setCustomMealName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <div className="flex gap-2">
              {(['plat', 'collation', 'boisson'] as MealType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setCustomMealType(t)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    customMealType === t
                      ? t === 'plat' ? 'bg-orange-500 text-white'
                        : t === 'collation' ? 'bg-purple-500 text-white'
                        : 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {MEAL_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            <button
              onClick={() => customMealName && addMeal(customMealName, customMealType)}
              className="w-full py-2.5 bg-green-500 text-white text-sm font-medium rounded-xl disabled:opacity-40"
              disabled={!customMealName}
            >
              Créer
            </button>
          </div>

          <button onClick={() => setAddingMeal(false)} className="w-full py-1.5 text-sm text-slate-400">
            Annuler
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingMeal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white rounded-2xl shadow-sm text-green-500 font-medium text-sm hover:bg-green-50 transition-colors"
        >
          <Plus size={18} />
          Ajouter un repas
        </button>
      )}
    </div>
  )
}
