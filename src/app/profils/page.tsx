'use client'

import { useState, useEffect } from 'react'
import { Check, Dumbbell, Coffee } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import ProfileSwitcher from '@/components/ProfileSwitcher'
import { MacroGoal, Profile } from '@/lib/types'

type GoalForm = {
  training: MacroGoal
  rest: MacroGoal
}

export default function ProfilsPage() {
  const { activeProfile, updateProfile } = useApp()
  const [name, setName] = useState('')
  const [goals, setGoals] = useState<GoalForm>({
    training: { calories: 2500, proteins: 180, carbs: 250, fats: 80 },
    rest: { calories: 2000, proteins: 150, carbs: 180, fats: 70 },
  })
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'training' | 'rest'>('rest')

  useEffect(() => {
    if (activeProfile) {
      setName(activeProfile.name)
      setGoals(activeProfile.goals)
    }
  }, [activeProfile])

  async function handleSave() {
    if (!activeProfile) return
    const updated: Profile = {
      ...activeProfile,
      name,
      goals,
    }
    await updateProfile(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function updateGoal(
    type: 'training' | 'rest',
    key: keyof MacroGoal,
    value: number
  ) {
    setGoals((g) => ({
      ...g,
      [type]: { ...g[type], [key]: value },
    }))
  }

  if (!activeProfile) return null

  const macroFields: { key: keyof MacroGoal; label: string; unit: string }[] = [
    { key: 'calories', label: 'Calories', unit: 'kcal' },
    { key: 'proteins', label: 'Protéines', unit: 'g' },
    { key: 'carbs', label: 'Glucides', unit: 'g' },
    { key: 'fats', label: 'Lipides', unit: 'g' },
  ]

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      <h1 className="text-lg font-bold text-slate-800">Profils</h1>

      <ProfileSwitcher />

      {/* Nom du profil */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <label className="text-xs font-medium text-slate-500">Nom du profil</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* Objectifs */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Objectifs nutritionnels</h2>

        {/* Tab selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('rest')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'rest'
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <Coffee size={15} />
            Repos
          </button>
          <button
            onClick={() => setActiveTab('training')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'training'
                ? 'bg-green-50 text-green-600 border border-green-200'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <Dumbbell size={15} />
            Entraînement
          </button>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-3">
          {macroFields.map(({ key, label, unit }) => (
            <div key={key}>
              <label className="text-xs font-medium text-slate-500">
                {label} ({unit})
              </label>
              <input
                type="number"
                value={goals[activeTab][key]}
                onChange={(e) =>
                  updateGoal(activeTab, key, parseFloat(e.target.value) || 0)
                }
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
          {(['rest', 'training'] as const).map((type) => (
            <div key={type}>
              <p className={`font-semibold mb-1 ${type === 'training' ? 'text-green-600' : 'text-blue-600'}`}>
                {type === 'training' ? 'Entraînement' : 'Repos'}
              </p>
              <p className="text-slate-600">{goals[type].calories} kcal</p>
              <p className="text-slate-400">P {goals[type].proteins}g · G {goals[type].carbs}g · L {goals[type].fats}g</p>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className={`w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          saved
            ? 'bg-green-100 text-green-600'
            : 'bg-green-500 text-white shadow-sm'
        }`}
      >
        <Check size={16} />
        {saved ? 'Enregistré !' : 'Sauvegarder'}
      </button>
    </div>
  )
}
