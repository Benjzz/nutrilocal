'use client'

import { useState, useMemo } from 'react'
import { X, Check, Plus, Search, RotateCcw } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { MealItem, CustomRecipe, RecipeIngredient } from '@/lib/types'
import { ingredientUnitLabel, ingredientDefaultQty, calculateIngredientMacros, calculateRecipeMacros } from '@/lib/utils'

const MACRO_COLS = [
  { key: 'calories' as const, label: 'Kcal', color: 'text-orange-500', bg: 'bg-orange-50' },
  { key: 'proteins' as const, label: 'Prot', color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'carbs' as const, label: 'Gluc', color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'fats' as const, label: 'Lip', color: 'text-pink-500', bg: 'bg-pink-50' },
]

type Props = {
  item: MealItem
  onSave: (custom: CustomRecipe) => void
  onReset: () => void
  onClose: () => void
}

type FormState = {
  servings: number
  ingredients: RecipeIngredient[]
}

export default function CustomizeRecipeModal({ item, onSave, onReset, onClose }: Props) {
  const { ingredients, recipes } = useApp()

  const baseRecipe = recipes.find((r) => r.id === item.ref_id)
  const source = item.custom_recipe ?? baseRecipe

  const [form, setForm] = useState<FormState>({
    servings: source?.servings ?? 1,
    ingredients: source?.ingredients ? [...source.ingredients] : [],
  })
  const [pickerSearch, setPickerSearch] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [pickerTab, setPickerTab] = useState<'ingredient' | 'recipe'>('ingredient')

  // Macros calculées réactivement depuis form
  const ingMacros = useMemo(() => {
    return form.ingredients.map((ri) => {
      if (ri.type === 'ingredient') {
        const ing = ingredients.find((i) => i.id === ri.ingredient_id)
        if (!ing) return { calories: 0, proteins: 0, carbs: 0, fats: 0 }
        return calculateIngredientMacros(ing, ri.quantity)
      } else {
        const sub = recipes.find((r) => r.id === ri.recipe_id)
        if (!sub) return { calories: 0, proteins: 0, carbs: 0, fats: 0 }
        return calculateRecipeMacros(sub, ingredients, recipes, ri.quantity)
      }
    })
  }, [form.ingredients, ingredients, recipes])

  const totalMacros = useMemo(() => {
    const t = { calories: 0, proteins: 0, carbs: 0, fats: 0 }
    for (const m of ingMacros) {
      t.calories += m.calories
      t.proteins += m.proteins
      t.carbs += m.carbs
      t.fats += m.fats
    }
    return {
      calories: Math.round(t.calories),
      proteins: Math.round(t.proteins * 10) / 10,
      carbs: Math.round(t.carbs * 10) / 10,
      fats: Math.round(t.fats * 10) / 10,
    }
  }, [ingMacros])

  const perServingMacros = useMemo(() => {
    const s = form.servings || 1
    return {
      calories: Math.round(totalMacros.calories / s),
      proteins: Math.round((totalMacros.proteins / s) * 10) / 10,
      carbs: Math.round((totalMacros.carbs / s) * 10) / 10,
      fats: Math.round((totalMacros.fats / s) * 10) / 10,
    }
  }, [totalMacros, form.servings])

  const filteredIngredients = useMemo(
    () => ingredients.filter((i) => i.name.toLowerCase().includes(pickerSearch.toLowerCase())),
    [ingredients, pickerSearch]
  )

  const filteredSubRecipes = useMemo(
    () => recipes.filter(
      (r) => r.name.toLowerCase().includes(pickerSearch.toLowerCase()) && r.id !== item.ref_id
    ),
    [recipes, pickerSearch, item.ref_id]
  )

  function addIngToForm(ingId: string) {
    if (form.ingredients.find((i) => i.type === 'ingredient' && i.ingredient_id === ingId)) return
    const ing = ingredients.find((i) => i.id === ingId)
    const defaultQty = ing ? ingredientDefaultQty(ing.unit) : 100
    setForm((f) => ({
      ...f,
      ingredients: [...f.ingredients, { type: 'ingredient', ingredient_id: ingId, quantity: defaultQty }],
    }))
    setShowPicker(false)
    setPickerSearch('')
  }

  function addSubRecipeToForm(recipeId: string) {
    if (form.ingredients.find((i) => i.type === 'recipe' && i.recipe_id === recipeId)) return
    setForm((f) => ({
      ...f,
      ingredients: [...f.ingredients, { type: 'recipe', recipe_id: recipeId, quantity: 1 }],
    }))
    setShowPicker(false)
    setPickerSearch('')
  }

  function updateQty(index: number, qty: number) {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.map((item, i) => i === index ? { ...item, quantity: qty } : item),
    }))
  }

  function removeItem(index: number) {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.filter((_, i) => i !== index),
    }))
  }

  function getLabel(ri: RecipeIngredient): string {
    if (ri.type === 'ingredient') return ingredients.find((i) => i.id === ri.ingredient_id)?.name ?? '?'
    return recipes.find((r) => r.id === ri.recipe_id)?.name ?? '?'
  }

  function handleSave() {
    onSave({
      name: source?.name ?? 'Recette',
      servings: form.servings,
      ingredients: form.ingredients,
    })
  }

  const recipeName = source?.name ?? 'Recette'

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto bg-white rounded-t-2xl shadow-2xl flex flex-col"
        style={{ height: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Personnaliser</h2>
            <p className="text-xs text-slate-400">{recipeName} · pour aujourd&apos;hui seulement</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Portions */}
          <div>
            <label className="text-xs font-medium text-slate-500">Nombre de portions</label>
            <input
              type="number"
              min="1"
              value={form.servings}
              onChange={(e) => setForm((f) => ({ ...f, servings: parseInt(e.target.value) || 1 }))}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Résumé macros */}
          {form.ingredients.length > 0 && (
            <div className="space-y-1">
              <div className="grid grid-cols-4 gap-1.5">
                {MACRO_COLS.map(({ key, label, color, bg }) => (
                  <div key={key} className={`${bg} rounded-xl p-2 text-center`}>
                    <div className={`text-sm font-bold ${color}`}>{totalMacros[key]}</div>
                    <div className="text-[10px] text-slate-400">{label}</div>
                  </div>
                ))}
              </div>
              {form.servings > 1 && (
                <p className="text-[10px] text-slate-400 text-center">
                  Par portion : {perServingMacros.calories} kcal · P{perServingMacros.proteins} · G{perServingMacros.carbs} · L{perServingMacros.fats}
                </p>
              )}
            </div>
          )}

          {/* Composition */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-500">Composition</label>
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="text-xs text-green-500 font-medium flex items-center gap-1"
              >
                <Plus size={12} />
                Ajouter
              </button>
            </div>

            {showPicker && (
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-2">
                <div className="flex border-b border-slate-100">
                  {(['ingredient', 'recipe'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setPickerTab(t)}
                      className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                        pickerTab === t ? 'bg-green-500 text-white' : 'text-slate-500'
                      }`}
                    >
                      {t === 'ingredient' ? 'Aliment' : 'Recette'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Chercher..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="flex-1 text-xs bg-transparent focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="max-h-36 overflow-y-auto">
                  {pickerTab === 'ingredient'
                    ? filteredIngredients.map((ing) => (
                        <button
                          key={ing.id}
                          onClick={() => addIngToForm(ing.id)}
                          disabled={!!form.ingredients.find((i) => i.type === 'ingredient' && i.ingredient_id === ing.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-40 border-t border-slate-50"
                        >
                          {ing.name}
                        </button>
                      ))
                    : filteredSubRecipes.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => addSubRecipeToForm(r.id)}
                          disabled={!!form.ingredients.find((i) => i.type === 'recipe' && i.recipe_id === r.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-40 border-t border-slate-50"
                        >
                          {r.name}
                        </button>
                      ))
                  }
                </div>
              </div>
            )}

            {form.ingredients.map((ri, index) => {
              const m = ingMacros[index]
              return (
                <div key={index} className="mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-sm text-slate-700 truncate">{getLabel(ri)}</span>
                    <input
                      type="number"
                      value={ri.quantity || ''}
                      onChange={(e) => updateQty(index, parseFloat(e.target.value) || 0)}
                      className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none"
                      placeholder="0"
                    />
                    <span className="text-xs text-slate-400 w-12 text-right">
                      {ri.type === 'recipe'
                        ? 'port.'
                        : ingredientUnitLabel(ingredients.find((i) => i.id === ri.ingredient_id)?.unit ?? 'g')}
                    </span>
                    <button onClick={() => removeItem(index)} className="text-slate-300 hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                  {m && (
                    <p className="text-[10px] text-slate-400 pl-0 mt-0.5">
                      <span className="text-orange-400">{m.calories}</span> kcal · P{m.proteins} · G{m.carbs} · L{m.fats}
                    </p>
                  )}
                </div>
              )
            })}

            {form.ingredients.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-2">Aucun élément</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 shrink-0 space-y-2">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            <Check size={16} />
            Appliquer pour aujourd&apos;hui
          </button>
          {item.custom_recipe && (
            <button
              onClick={onReset}
              className="w-full py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} />
              Réinitialiser (revenir à la recette originale)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
