'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Check, X, ChevronDown, ChevronUp, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'
import { DayLog, Recipe } from '@/lib/types'
import { calculateItemMacros, sumMacros, frenchDate, formatDate } from '@/lib/utils'

type Friendship = {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted'
  email?: string // email de l'autre personne
}

type FeedEntry = {
  key: string
  friendEmail: string
  profileId: string
  profileName: string
  date: string
  log: DayLog
}

const MACRO_COLORS = [
  { key: 'calories' as const, label: 'Kcal', color: 'text-orange-500', bg: 'bg-orange-50' },
  { key: 'proteins' as const, label: 'Prot', color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'carbs' as const, label: 'Gluc', color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'fats' as const, label: 'Lip', color: 'text-pink-500', bg: 'bg-pink-50' },
]

export default function AmisPage() {
  const supabase = createClient()
  const { session, ingredients, recipes } = useApp()

  const [addEmail, setAddEmail] = useState('')
  const [addStatus, setAddStatus] = useState<'idle' | 'loading' | 'sent' | 'not_found' | 'already' | 'self'>('idle')
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [feed, setFeed] = useState<FeedEntry[]>([])
  const [friendRecipes, setFriendRecipes] = useState<Recipe[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const currentUserId = session?.user.id

  const loadFriendships = useCallback(async () => {
    if (!currentUserId) return
    const { data: fs } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)

    if (!fs) return

    // Récupérer les emails des autres utilisateurs
    const otherIds = fs.map((f) => f.requester_id === currentUserId ? f.addressee_id : f.requester_id)
    const { data: emails } = await supabase
      .from('user_emails')
      .select('user_id, email')
      .in('user_id', otherIds)

    const emailMap = new Map((emails ?? []).map((e) => [e.user_id, e.email]))

    setFriendships(
      fs.map((f) => ({
        ...f,
        email: emailMap.get(f.requester_id === currentUserId ? f.addressee_id : f.requester_id),
      }))
    )
  }, [currentUserId, supabase])

  const loadFeed = useCallback(async () => {
    if (!currentUserId) return
    setFeedLoading(true)

    // Amis acceptés
    const { data: fs } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)

    if (!fs || fs.length === 0) {
      setFeed([])
      setFeedLoading(false)
      return
    }

    const friendIds = fs.map((f) =>
      f.requester_id === currentUserId ? f.addressee_id : f.requester_id
    )

    // Emails des amis
    const { data: emailRows } = await supabase
      .from('user_emails')
      .select('user_id, email')
      .in('user_id', friendIds)
    const emailMap = new Map((emailRows ?? []).map((e) => [e.user_id, e.email as string]))

    // Profils des amis
    const { data: friendProfiles } = await supabase
      .from('profiles')
      .select('id, name, user_id')
      .in('user_id', friendIds)
    if (!friendProfiles || friendProfiles.length === 0) {
      setFeed([])
      setFeedLoading(false)
      return
    }

    // Recettes des amis (pour calcul des macros)
    const { data: fRecipes } = await supabase
      .from('recipes')
      .select('*')
      .in('user_id', friendIds)
    setFriendRecipes((fRecipes ?? []) as Recipe[])

    // Logs aujourd'hui + hier
    const today = formatDate(new Date())
    const yesterday = formatDate(new Date(Date.now() - 86400000))

    const profileIds = friendProfiles.map((p) => p.id)
    const { data: logs } = await supabase
      .from('day_logs')
      .select('*')
      .in('profile_id', profileIds)
      .in('date', [today, yesterday])
      .order('date', { ascending: false })

    if (!logs) {
      setFeed([])
      setFeedLoading(false)
      return
    }

    const profileMap = new Map(friendProfiles.map((p) => [p.id, p]))

    const entries: FeedEntry[] = logs
      .filter((log) => log.meals && log.meals.length > 0)
      .map((log) => {
        const profile = profileMap.get(log.profile_id)
        return {
          key: `${log.profile_id}_${log.date}`,
          friendEmail: emailMap.get(profile?.user_id ?? '') ?? '',
          profileId: log.profile_id,
          profileName: profile?.name ?? '',
          date: log.date,
          log: log as DayLog,
        }
      })

    setFeed(entries)
    setFeedLoading(false)
  }, [currentUserId, supabase])

  useEffect(() => {
    loadFriendships()
    loadFeed()
  }, [loadFriendships, loadFeed])

  async function handleAddFriend() {
    if (!addEmail.trim() || !currentUserId) return
    setAddStatus('loading')

    if (addEmail.trim() === session?.user.email) {
      setAddStatus('self')
      return
    }

    // Chercher l'utilisateur par email
    const { data: found } = await supabase
      .from('user_emails')
      .select('user_id')
      .eq('email', addEmail.trim().toLowerCase())
      .single()

    if (!found) {
      setAddStatus('not_found')
      return
    }

    // Vérifier si une relation existe déjà
    const { data: existing } = await supabase
      .from('friendships')
      .select('id')
      .or(
        `and(requester_id.eq.${currentUserId},addressee_id.eq.${found.user_id}),` +
        `and(requester_id.eq.${found.user_id},addressee_id.eq.${currentUserId})`
      )
      .single()

    if (existing) {
      setAddStatus('already')
      return
    }

    const { error } = await supabase.from('friendships').insert({
      requester_id: currentUserId,
      addressee_id: found.user_id,
    })

    if (error) {
      setAddStatus('not_found')
      return
    }

    setAddStatus('sent')
    setAddEmail('')
    await loadFriendships()
    setTimeout(() => setAddStatus('idle'), 3000)
  }

  async function acceptRequest(friendshipId: string) {
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
    await Promise.all([loadFriendships(), loadFeed()])
  }

  async function declineRequest(friendshipId: string) {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    await loadFriendships()
  }

  const pendingReceived = friendships.filter(
    (f) => f.status === 'pending' && f.addressee_id === currentUserId
  )
  const pendingSent = friendships.filter(
    (f) => f.status === 'pending' && f.requester_id === currentUserId
  )
  const accepted = friendships.filter((f) => f.status === 'accepted')

  const allRecipes = [...recipes, ...friendRecipes]

  function getDisplayName(email: string) {
    return email.split('@')[0]
  }

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      <h1 className="text-lg font-bold text-slate-800">Amis</h1>

      {/* Ajouter un ami */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Ajouter un ami</h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={addEmail}
            onChange={(e) => { setAddEmail(e.target.value); setAddStatus('idle') }}
            onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
            placeholder="email@exemple.com"
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            onClick={handleAddFriend}
            disabled={addStatus === 'loading' || !addEmail.trim()}
            className="px-3 py-2 bg-green-500 text-white rounded-xl disabled:opacity-40"
          >
            <UserPlus size={16} />
          </button>
        </div>
        {addStatus === 'sent' && <p className="text-xs text-green-500">Demande envoyée !</p>}
        {addStatus === 'not_found' && <p className="text-xs text-red-400">Aucun compte trouvé avec cet email.</p>}
        {addStatus === 'already' && <p className="text-xs text-slate-400">Demande déjà envoyée ou déjà amis.</p>}
        {addStatus === 'self' && <p className="text-xs text-slate-400">Tu ne peux pas t&apos;ajouter toi-même.</p>}
      </div>

      {/* Demandes reçues */}
      {pendingReceived.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">
            Demandes reçues
            <span className="ml-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingReceived.length}
            </span>
          </h2>
          {pendingReceived.map((f) => (
            <div key={f.id} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 text-xs font-semibold">
                  {(f.email ?? '?')[0].toUpperCase()}
                </div>
                <span className="text-sm text-slate-700">{f.email}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => acceptRequest(f.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium"
                >
                  <Check size={12} />
                  Accepter
                </button>
                <button
                  onClick={() => declineRequest(f.id)}
                  className="p-1.5 text-slate-300 hover:text-red-400"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Demandes envoyées en attente */}
      {pendingSent.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <h2 className="text-sm font-semibold text-slate-500">Demandes envoyées</h2>
          {pendingSent.map((f) => (
            <div key={f.id} className="flex items-center justify-between py-1">
              <span className="text-sm text-slate-500">{f.email}</span>
              <span className="text-xs text-slate-300">En attente</span>
            </div>
          ))}
        </div>
      )}

      {/* Feed */}
      <div className="space-y-3">
        {accepted.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center space-y-2">
            <Users size={32} className="text-slate-200 mx-auto" />
            <p className="text-sm font-medium text-slate-500">Aucun ami pour l&apos;instant</p>
            <p className="text-xs text-slate-400">Ajoute des amis pour voir leur activité ici.</p>
          </div>
        ) : feedLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : feed.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <p className="text-sm text-slate-400">Aucune activité récente parmi tes amis.</p>
          </div>
        ) : (
          feed.map((entry) => {
            const allMacros = entry.log.meals.flatMap((m) =>
              m.items.map((item) => calculateItemMacros(item, ingredients, allRecipes))
            )
            const totals = sumMacros(allMacros)
            const isExpanded = expandedKey === entry.key
            const isToday = entry.date === formatDate(new Date())
            const displayName = getDisplayName(entry.friendEmail)

            return (
              <div key={entry.key} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-4 pt-3 pb-2 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-sm font-bold shrink-0">
                    {displayName[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
                    <p className="text-xs text-slate-400">
                      {entry.profileName}
                      {' · '}
                      {isToday ? "Aujourd'hui" : frenchDate(entry.date)}
                    </p>
                  </div>
                </div>

                {/* Macros (cliquables) */}
                <div
                  className="grid grid-cols-4 gap-1.5 px-4 pb-3 cursor-pointer"
                  onClick={() => setExpandedKey(isExpanded ? null : entry.key)}
                >
                  {MACRO_COLORS.map(({ key, label, color, bg }) => (
                    <div key={key} className={`${bg} rounded-xl p-2 text-center`}>
                      <div className={`text-sm font-bold ${color}`}>{totals[key]}</div>
                      <div className="text-[10px] text-slate-400">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Détail des repas */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-3 space-y-3">
                    {entry.log.meals.map((meal) => {
                      const mealMacros = sumMacros(
                        meal.items.map((item) => calculateItemMacros(item, ingredients, allRecipes))
                      )
                      return (
                        <div key={meal.id}>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs font-semibold text-slate-600">{meal.name}</p>
                            <p className="text-xs text-slate-400">
                              {mealMacros.calories} kcal
                            </p>
                          </div>
                          {meal.items.map((item) => {
                            const itemLabel = item.type === 'ingredient'
                              ? ingredients.find((i) => i.id === item.ref_id)?.name ?? 'Aliment'
                              : allRecipes.find((r) => r.id === item.ref_id)?.name ?? 'Recette'
                            const itemMacros = calculateItemMacros(item, ingredients, allRecipes)
                            return (
                              <div key={item.id} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                                <span className="text-xs text-slate-700 truncate flex-1 mr-2">{itemLabel}</span>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  <span className="text-orange-400">{itemMacros.calories}</span>
                                  {' '}kcal · P{itemMacros.proteins} · G{itemMacros.carbs} · L{itemMacros.fats}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}

                    <button
                      onClick={() => setExpandedKey(null)}
                      className="w-full flex items-center justify-center gap-1 py-1 text-xs text-slate-300 hover:text-slate-400"
                    >
                      <ChevronUp size={12} />
                      Réduire
                    </button>
                  </div>
                )}

                {/* Chevron si pas expanded */}
                {!isExpanded && (
                  <div className="flex justify-center pb-1.5">
                    <ChevronDown size={14} className="text-slate-200" />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
