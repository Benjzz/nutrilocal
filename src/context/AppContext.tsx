'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Ingredient, Recipe, DayLog, DayType } from '@/lib/types'
import { todayStr, generateId } from '@/lib/utils'

type AppContextType = {
  // Profils
  profiles: Profile[]
  activeProfileId: string | null
  activeProfile: Profile | null
  setActiveProfileId: (id: string) => void
  refreshProfiles: () => Promise<void>
  updateProfile: (profile: Profile) => Promise<void>

  // Ingrédients
  ingredients: Ingredient[]
  refreshIngredients: () => Promise<void>
  addIngredient: (ing: Omit<Ingredient, 'id'>) => Promise<void>
  updateIngredient: (ing: Ingredient) => Promise<void>
  deleteIngredient: (id: string) => Promise<void>

  // Recettes
  recipes: Recipe[]
  refreshRecipes: () => Promise<void>
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<void>
  updateRecipe: (recipe: Recipe) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>

  // Log du jour
  currentDate: string
  setCurrentDate: (date: string) => void
  dayLog: DayLog | null
  refreshDayLog: () => Promise<void>
  setDayType: (type: DayType) => Promise<void>
  saveDayLog: (log: DayLog) => Promise<void>

  loading: boolean
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [currentDate, setCurrentDate] = useState(todayStr())
  const [dayLog, setDayLog] = useState<DayLog | null>(null)
  const [loading, setLoading] = useState(true)

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null

  // Persister le profil actif dans localStorage
  const setActiveProfileId = useCallback((id: string) => {
    setActiveProfileIdState(id)
    localStorage.setItem('activeProfileId', id)
  }, [])

  const refreshProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    if (data) {
      const mapped: Profile[] = data.map((p) => ({
        id: p.id,
        name: p.name,
        goals: p.goals,
      }))
      setProfiles(mapped)
      // Restaurer le profil actif depuis localStorage
      const saved = localStorage.getItem('activeProfileId')
      if (saved && mapped.find((p) => p.id === saved)) {
        setActiveProfileIdState(saved)
      } else if (mapped.length > 0) {
        setActiveProfileIdState(mapped[0].id)
      }
    }
  }, [supabase])

  const updateProfile = useCallback(
    async (profile: Profile) => {
      await supabase
        .from('profiles')
        .update({ name: profile.name, goals: profile.goals })
        .eq('id', profile.id)
      await refreshProfiles()
    },
    [supabase, refreshProfiles]
  )

  const refreshIngredients = useCallback(async () => {
    const { data } = await supabase
      .from('ingredients')
      .select('*')
      .order('name')
    if (data) setIngredients(data as Ingredient[])
  }, [supabase])

  const addIngredient = useCallback(
    async (ing: Omit<Ingredient, 'id'>) => {
      await supabase.from('ingredients').insert({ ...ing, id: generateId() })
      await refreshIngredients()
    },
    [supabase, refreshIngredients]
  )

  const updateIngredient = useCallback(
    async (ing: Ingredient) => {
      await supabase.from('ingredients').update(ing).eq('id', ing.id)
      await refreshIngredients()
    },
    [supabase, refreshIngredients]
  )

  const deleteIngredient = useCallback(
    async (id: string) => {
      await supabase.from('ingredients').delete().eq('id', id)
      await refreshIngredients()
    },
    [supabase, refreshIngredients]
  )

  const refreshRecipes = useCallback(async () => {
    const { data } = await supabase.from('recipes').select('*').order('name')
    if (data) setRecipes(data as Recipe[])
  }, [supabase])

  const addRecipe = useCallback(
    async (recipe: Omit<Recipe, 'id'>) => {
      await supabase.from('recipes').insert({ ...recipe, id: generateId() })
      await refreshRecipes()
    },
    [supabase, refreshRecipes]
  )

  const updateRecipe = useCallback(
    async (recipe: Recipe) => {
      await supabase.from('recipes').update(recipe).eq('id', recipe.id)
      await refreshRecipes()
    },
    [supabase, refreshRecipes]
  )

  const deleteRecipe = useCallback(
    async (id: string) => {
      await supabase.from('recipes').delete().eq('id', id)
      await refreshRecipes()
    },
    [supabase, refreshRecipes]
  )

  const refreshDayLog = useCallback(async () => {
    if (!activeProfileId) return
    const { data } = await supabase
      .from('day_logs')
      .select('*')
      .eq('profile_id', activeProfileId)
      .eq('date', currentDate)
      .single()

    if (data) {
      setDayLog({
        id: data.id,
        profile_id: data.profile_id,
        date: data.date,
        day_type: data.day_type,
        meals: data.meals,
      })
    } else {
      setDayLog(null)
    }
  }, [supabase, activeProfileId, currentDate])

  const saveDayLog = useCallback(
    async (log: DayLog) => {
      const { data: existing } = await supabase
        .from('day_logs')
        .select('id')
        .eq('profile_id', log.profile_id)
        .eq('date', log.date)
        .single()

      if (existing) {
        await supabase
          .from('day_logs')
          .update({ day_type: log.day_type, meals: log.meals })
          .eq('id', existing.id)
      } else {
        await supabase.from('day_logs').insert({
          id: generateId(),
          profile_id: log.profile_id,
          date: log.date,
          day_type: log.day_type,
          meals: log.meals,
        })
      }
      await refreshDayLog()
    },
    [supabase, refreshDayLog]
  )

  const setDayType = useCallback(
    async (type: DayType) => {
      if (!activeProfileId) return
      const meals = dayLog?.meals ?? []
      await saveDayLog({
        id: dayLog?.id ?? generateId(),
        profile_id: activeProfileId,
        date: currentDate,
        day_type: type,
        meals,
      })
    },
    [activeProfileId, currentDate, dayLog, saveDayLog]
  )

  // Chargement initial
  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([refreshProfiles(), refreshIngredients(), refreshRecipes()])
      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recharger le log quand le profil ou la date change
  useEffect(() => {
    if (activeProfileId) refreshDayLog()
  }, [activeProfileId, currentDate, refreshDayLog])

  return (
    <AppContext.Provider
      value={{
        profiles,
        activeProfileId,
        activeProfile,
        setActiveProfileId,
        refreshProfiles,
        updateProfile,
        ingredients,
        refreshIngredients,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        recipes,
        refreshRecipes,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        currentDate,
        setCurrentDate,
        dayLog,
        refreshDayLog,
        setDayType,
        saveDayLog,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
