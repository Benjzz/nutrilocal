'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Profile, Ingredient, Recipe, DayLog, DayType } from '@/lib/types'
import { todayStr, generateId } from '@/lib/utils'

type AppContextType = {
  // Auth
  session: Session | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>

  // Profils
  profiles: Profile[]
  activeProfileId: string | null
  activeProfile: Profile | null
  setActiveProfileId: (id: string) => void
  refreshProfiles: () => Promise<void>
  addProfile: (name: string) => Promise<void>
  updateProfile: (profile: Profile) => Promise<void>
  deleteProfile: (id: string) => Promise<void>

  // Ingrédients (partagés entre tous les utilisateurs)
  ingredients: Ingredient[]
  refreshIngredients: () => Promise<void>
  addIngredient: (ing: Omit<Ingredient, 'id'>) => Promise<void>
  updateIngredient: (ing: Ingredient) => Promise<void>
  deleteIngredient: (id: string) => Promise<void>

  // Recettes (par utilisateur)
  recipes: Recipe[]
  refreshRecipes: () => Promise<void>
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<void>
  updateRecipe: (recipe: Recipe) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>

  // Partage
  shareRecipe: (recipeId: string) => Promise<string | null>

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

  const [session, setSession] = useState<Session | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [currentDate, setCurrentDate] = useState(todayStr())
  const [dayLog, setDayLog] = useState<DayLog | null>(null)
  const [loading, setLoading] = useState(true)

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null

  const setActiveProfileId = useCallback((id: string) => {
    setActiveProfileIdState(id)
    localStorage.setItem('activeProfileId', id)
  }, [])

  // ─── Auth ─────────────────────────────────────────────────────────────────

  const signIn = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfiles([])
    setIngredients([])
    setRecipes([])
    setDayLog(null)
    setActiveProfileIdState(null)
    localStorage.removeItem('activeProfileId')
  }, [supabase])

  // ─── Profils ──────────────────────────────────────────────────────────────

  const refreshProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    if (data) {
      const mapped: Profile[] = data.map((p) => ({
        id: p.id,
        name: p.name,
        goals: p.goals,
      }))
      setProfiles(mapped)
      const saved = localStorage.getItem('activeProfileId')
      if (saved && mapped.find((p) => p.id === saved)) {
        setActiveProfileIdState(saved)
      } else if (mapped.length > 0) {
        setActiveProfileIdState(mapped[0].id)
      }
    }
  }, [supabase])

  const addProfile = useCallback(
    async (name: string) => {
      const id = generateId()
      await supabase.from('profiles').insert({
        id,
        name,
        goals: {
          training: { calories: 2500, proteins: 180, carbs: 250, fats: 80 },
          rest: { calories: 2000, proteins: 150, carbs: 180, fats: 70 },
        },
      })
      await refreshProfiles()
      setActiveProfileId(id)
    },
    [supabase, refreshProfiles, setActiveProfileId]
  )

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

  const deleteProfile = useCallback(
    async (id: string) => {
      await supabase.from('profiles').delete().eq('id', id)
      await refreshProfiles()
    },
    [supabase, refreshProfiles]
  )

  // ─── Ingrédients (partagés) ───────────────────────────────────────────────

  const refreshIngredients = useCallback(async () => {
    const { data } = await supabase.from('ingredients').select('*').order('name')
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

  // ─── Recettes (par utilisateur) ───────────────────────────────────────────

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

  // ─── Partage ──────────────────────────────────────────────────────────────

  const shareRecipe = useCallback(
    async (recipeId: string): Promise<string | null> => {
      const recipe = recipes.find((r) => r.id === recipeId)
      if (!recipe) return null
      const { data, error } = await supabase
        .from('shared_recipes')
        .insert({ recipe_data: recipe, created_by: session?.user.id })
        .select('id')
        .single()
      if (error || !data) return null
      return `${window.location.origin}/recette/${data.id}`
    },
    [supabase, recipes, session]
  )

  // ─── Log du jour ──────────────────────────────────────────────────────────

  const refreshDayLog = useCallback(async () => {
    if (!activeProfileId) return
    const { data } = await supabase
      .from('day_logs')
      .select('*')
      .eq('profile_id', activeProfileId)
      .eq('date', currentDate)
      .maybeSingle()

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
        .maybeSingle()

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

  // ─── Init et écoute de l'auth ─────────────────────────────────────────────

  useEffect(() => {
    async function registerEmail(userId: string, email: string | undefined) {
      if (!email) return
      await supabase.from('user_emails').upsert(
        { user_id: userId, email },
        { onConflict: 'user_id' }
      )
    }

    async function loadData(userId: string, email: string | undefined) {
      await registerEmail(userId, email)
      setLoading(true)
      await Promise.all([refreshProfiles(), refreshIngredients(), refreshRecipes()])
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadData(session.user.id, session.user.email)
      else setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (event === 'SIGNED_IN' && newSession) {
        loadData(newSession.user.id, newSession.user.email)
      } else if (event === 'SIGNED_OUT') {
        setProfiles([])
        setIngredients([])
        setRecipes([])
        setDayLog(null)
        setActiveProfileIdState(null)
        localStorage.removeItem('activeProfileId')
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeProfileId) refreshDayLog()
  }, [activeProfileId, currentDate, refreshDayLog])

  return (
    <AppContext.Provider
      value={{
        session,
        signIn,
        signOut,
        profiles,
        activeProfileId,
        activeProfile,
        setActiveProfileId,
        refreshProfiles,
        addProfile,
        updateProfile,
        deleteProfile,
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
        shareRecipe,
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
