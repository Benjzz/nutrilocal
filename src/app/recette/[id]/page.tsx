'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Check, ChevronLeft, Leaf } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'
import { Recipe } from '@/lib/types'
import { calculateRecipeMacros, ingredientUnitLabel } from '@/lib/utils'

export default function SharedRecipePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { session, addRecipe, ingredients, recipes } = useApp()
  const supabase = createClient()

  const [sharedRecipe, setSharedRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('shared_recipes')
      .select('recipe_data')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
        } else {
          setSharedRecipe(data.recipe_data as Recipe)
        }
        setLoading(false)
      })
  }, [id, supabase])

  async function handleSave() {
    if (!sharedRecipe || !session) return
    setSaving(true)
    await addRecipe({
      name: sharedRecipe.name,
      servings: sharedRecipe.servings,
      ingredients: sharedRecipe.ingredients,
    })
    setSaving(false)
    setSaved(true)
  }

  const macros = sharedRecipe
    ? calculateRecipeMacros(sharedRecipe, ingredients, recipes, 1)
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-slate-500 font-medium">Ce lien de partage n&apos;existe plus.</p>
        <button onClick={() => router.push('/')} className="text-green-500 text-sm font-medium">
          Retour à l&apos;app
        </button>
      </div>
    )
  }

  if (!sharedRecipe) return null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 text-slate-400">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
            <Leaf size={13} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-700">NutriLocal</span>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">
        {/* Titre */}
        <div>
          <p className="text-xs font-medium text-green-500 uppercase tracking-wide mb-1">
            Recette partagée
          </p>
          <h1 className="text-2xl font-bold text-slate-800">{sharedRecipe.name}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {sharedRecipe.servings} portion{sharedRecipe.servings > 1 ? 's' : ''}
          </p>
        </div>

        {/* Macros par portion */}
        {macros && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Kcal', value: macros.calories, color: 'text-orange-500' },
              { label: 'Prot', value: macros.proteins, color: 'text-blue-500' },
              { label: 'Gluc', value: macros.carbs, color: 'text-amber-500' },
              { label: 'Lip', value: macros.fats, color: 'text-pink-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl p-3 text-center shadow-sm">
                <div className={`text-lg font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Ingrédients */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50">
            <p className="text-sm font-semibold text-slate-700">Composition</p>
            <p className="text-xs text-slate-400">pour 1 portion</p>
          </div>
          {sharedRecipe.ingredients.map((ri, idx) => {
            const label = ri.type === 'ingredient'
              ? ingredients.find((i) => i.id === ri.ingredient_id)?.name ?? ri.ingredient_id
              : recipes.find((r) => r.id === ri.recipe_id)?.name ?? ri.recipe_id
            const unitLabel = ri.type === 'recipe'
              ? 'port.'
              : ingredientUnitLabel(
                  ingredients.find((i) => i.id === ri.ingredient_id)?.unit ?? 'g'
                )
            const qty = Math.round((ri.quantity / sharedRecipe.servings) * 10) / 10
            return (
              <div key={idx} className="flex justify-between items-center px-4 py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-700">{label}</span>
                <span className="text-xs text-slate-400">{qty} {unitLabel}</span>
              </div>
            )
          })}
          {sharedRecipe.ingredients.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">Aucun ingrédient</p>
          )}
        </div>

        {/* CTA */}
        {session ? (
          <button
            onClick={handleSave}
            disabled={saved || saving}
            className={`w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-sm ${
              saved
                ? 'bg-green-100 text-green-600'
                : 'bg-green-500 text-white active:scale-[0.98]'
            }`}
          >
            <Check size={18} />
            {saved ? 'Enregistrée dans tes recettes !' : saving ? 'Enregistrement...' : 'Enregistrer dans mes recettes'}
          </button>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center space-y-3">
            <p className="text-sm text-slate-600">
              Connecte-toi pour enregistrer cette recette dans ton app.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl"
            >
              Se connecter
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
