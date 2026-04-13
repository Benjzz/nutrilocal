'use client'

import { useState, useEffect } from 'react'
import { Check, Dumbbell, Coffee, Plus, Trash2, LogOut } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import ProfileSwitcher from '@/components/ProfileSwitcher'
import { MacroGoal, Profile } from '@/lib/types'

type GoalStrings = { calories: string; proteins: string; carbs: string; fats: string }
type GoalForm = { training: GoalStrings; rest: GoalStrings }

function toStrings(g: MacroGoal): GoalStrings {
  return {
    calories: g.calories === 0 ? '' : String(g.calories),
    proteins: g.proteins === 0 ? '' : String(g.proteins),
    carbs: g.carbs === 0 ? '' : String(g.carbs),
    fats: g.fats === 0 ? '' : String(g.fats),
  }
}

function toNumbers(g: GoalStrings): MacroGoal {
  return {
    calories: parseFloat(g.calories) || 0,
    proteins: parseFloat(g.proteins) || 0,
    carbs: parseFloat(g.carbs) || 0,
    fats: parseFloat(g.fats) || 0,
  }
}

export default function ProfilsPage() {
  const { activeProfile, profiles, updateProfile, addProfile, deleteProfile, signOut, session } =
    useApp()
  const [name, setName] = useState('')
  const [goals, setGoals] = useState<GoalForm>({
    training: { calories: '', proteins: '', carbs: '', fats: '' },
    rest: { calories: '', proteins: '', carbs: '', fats: '' },
  })
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'training' | 'rest'>('rest')
  const [newProfileName, setNewProfileName] = useState('')
  const [showNewProfile, setShowNewProfile] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (activeProfile) {
      setName(activeProfile.name)
      setGoals({
        training: toStrings(activeProfile.goals.training),
        rest: toStrings(activeProfile.goals.rest),
      })
      setConfirmDelete(false)
    }
  }, [activeProfile])

  async function handleSave() {
    if (!activeProfile) return
    const updated: Profile = {
      ...activeProfile,
      name,
      goals: {
        training: toNumbers(goals.training),
        rest: toNumbers(goals.rest),
      },
    }
    await updateProfile(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleAddProfile() {
    if (!newProfileName.trim()) return
    await addProfile(newProfileName.trim())
    setNewProfileName('')
    setShowNewProfile(false)
  }

  async function handleDeleteProfile() {
    if (!activeProfile) return
    await deleteProfile(activeProfile.id)
    setConfirmDelete(false)
  }

  function updateGoal(type: 'training' | 'rest', key: keyof MacroGoal, value: string) {
    setGoals((g) => ({ ...g, [type]: { ...g[type], [key]: value } }))
  }

  const macroFields: { key: keyof MacroGoal; label: string; unit: string }[] = [
    { key: 'calories', label: 'Calories', unit: 'kcal' },
    { key: 'proteins', label: 'Protéines', unit: 'g' },
    { key: 'carbs', label: 'Glucides', unit: 'g' },
    { key: 'fats', label: 'Lipides', unit: 'g' },
  ]

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      {/* Header avec déconnexion */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Profils</h1>
        <div className="flex items-center gap-2">
          {session?.user.email && (
            <span className="text-xs text-slate-400 truncate max-w-[140px]">
              {session.user.email}
            </span>
          )}
          <button
            onClick={signOut}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
            title="Se déconnecter"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Switcher + ajouter un profil */}
      <div className="space-y-2">
        <ProfileSwitcher />
        {!showNewProfile ? (
          <button
            onClick={() => setShowNewProfile(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 hover:text-green-500 hover:border-green-300 transition-colors"
          >
            <Plus size={13} />
            Ajouter un profil
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddProfile()}
              placeholder="Nom du nouveau profil"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              autoFocus
            />
            <button
              onClick={handleAddProfile}
              disabled={!newProfileName.trim()}
              className="px-3 py-2 bg-green-500 text-white rounded-xl text-sm disabled:opacity-40"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => { setShowNewProfile(false); setNewProfileName('') }}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-400"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {profiles.length === 0 && !showNewProfile && (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center space-y-2">
          <p className="text-sm font-medium text-slate-700">Aucun profil</p>
          <p className="text-xs text-slate-400">Crée ton premier profil pour commencer.</p>
        </div>
      )}

      {activeProfile && (
        <>
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

            <div className="grid grid-cols-2 gap-3">
              {macroFields.map(({ key, label, unit }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-slate-500">
                    {label} ({unit})
                  </label>
                  <input
                    type="number"
                    value={goals[activeTab][key]}
                    onChange={(e) => updateGoal(activeTab, key, e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
              {(['rest', 'training'] as const).map((type) => (
                <div key={type}>
                  <p className={`font-semibold mb-1 ${type === 'training' ? 'text-green-600' : 'text-blue-600'}`}>
                    {type === 'training' ? 'Entraînement' : 'Repos'}
                  </p>
                  <p className="text-slate-600">{goals[type].calories} kcal</p>
                  <p className="text-slate-400">
                    P {goals[type].proteins}g · G {goals[type].carbs}g · L {goals[type].fats}g
                  </p>
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

          {/* Supprimer le profil (seulement s'il en existe plusieurs) */}
          {profiles.length > 1 && (
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <p className="text-xs font-medium text-slate-400 mb-3">Zone dangereuse</p>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                  Supprimer ce profil
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">
                    Supprimer <strong>{activeProfile.name}</strong> et tout son historique ?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteProfile}
                      className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-medium"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-2 border border-slate-200 rounded-xl text-sm text-slate-500"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
