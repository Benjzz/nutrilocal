'use client'

import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, Search, Share2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Recipe, RecipeIngredient } from '@/lib/types'
import { calculateRecipeMacros, ingredientUnitLabel, ingredientDefaultQty } from '@/lib/utils'

type RecipeForm = {
  name: string
  servings: number
  ingredients: RecipeIngredient[]
}

const EMPTY_FORM: RecipeForm = { name: '', servings: 1, ingredients: [] }

export default function RecettesPage() {
  const { recipes, ingredients, addRecipe, updateRecipe, deleteRecipe, shareRecipe } = useApp()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function handleShare(recipeId: string) {
    const url = await shareRecipe(recipeId)
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // fallback si clipboard API non disponible
    }
    setCopiedId(recipeId)
    setTimeout(() => setCopiedId(null), 2500)
  }
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Recipe | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<RecipeForm>(EMPTY_FORM)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [previewServings, setPreviewServings] = useState<Record<string, number>>({})
  const [pickerSearch, setPickerSearch] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [pickerTab, setPickerTab] = useState<'ingredient' | 'recipe'>('ingredient')

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredIngredients = useMemo(
    () => ingredients.filter((i) => i.name.toLowerCase().includes(pickerSearch.toLowerCase())),
    [ingredients, pickerSearch]
  )

  const filteredSubRecipes = useMemo(
    () => recipes.filter((r) =>
      r.name.toLowerCase().includes(pickerSearch.toLowerCase()) &&
      r.id !== editing?.id // éviter de s'ajouter soi-même
    ),
    [recipes, pickerSearch, editing]
  )

  function openAdd() {
    setForm(EMPTY_FORM)
    setAdding(true)
    setEditing(null)
  }

  function openEdit(r: Recipe) {
    setForm({ name: r.name, servings: r.servings, ingredients: [...r.ingredients] })
    setEditing(r)
    setAdding(false)
  }

  function closeForm() {
    setAdding(false)
    setEditing(null)
    setShowPicker(false)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    if (editing) {
      await updateRecipe({ ...editing, ...form })
    } else {
      await addRecipe(form)
    }
    closeForm()
  }

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

  function updateItemQty(index: number, qty: number) {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.map((item, i) => i === index ? { ...item, quantity: qty } : item),
    }))
  }

  function removeItemFromForm(index: number) {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.filter((_, i) => i !== index),
    }))
  }

  function getItemLabel(ri: RecipeIngredient): string {
    if (ri.type === 'ingredient') return ingredients.find((i) => i.id === ri.ingredient_id)?.name ?? '?'
    return recipes.find((r) => r.id === ri.recipe_id)?.name ?? '?'
  }

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Recettes</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-green-500 text-white text-sm font-medium px-3 py-2 rounded-xl"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
        <Search size={16} className="text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher une recette..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm bg-transparent focus:outline-none"
        />
      </div>

      {/* Form */}
      {(adding || editing) && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              {editing ? 'Modifier la recette' : 'Nouvelle recette'}
            </h2>
            <button onClick={closeForm}>
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Nom</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Ex: Riz poulet légumes"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Nombre de portions</label>
            <input
              type="number"
              min="1"
              value={form.servings}
              onChange={(e) => setForm((f) => ({ ...f, servings: parseInt(e.target.value) || 1 }))}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="1"
            />
          </div>

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
                {/* Tabs */}
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
                          <span className="ml-1 text-xs text-slate-400">({r.servings} portion{r.servings > 1 ? 's' : ''})</span>
                        </button>
                      ))
                  }
                </div>
              </div>
            )}

            {form.ingredients.map((ri, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <span className="flex-1 text-sm text-slate-700 truncate">{getItemLabel(ri)}</span>
                <input
                  type="number"
                  value={ri.quantity || ''}
                  onChange={(e) => updateItemQty(index, parseFloat(e.target.value) || 0)}
                  className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none"
                  placeholder="0"
                />
                <span className="text-xs text-slate-400 w-12 text-right">
                  {ri.type === 'recipe'
                    ? 'port.'
                    : ingredientUnitLabel(ingredients.find((i) => i.id === ri.ingredient_id)?.unit ?? 'g')}
                </span>
                <button onClick={() => removeItemFromForm(index)} className="text-slate-300 hover:text-red-400">
                  <X size={14} />
                </button>
              </div>
            ))}

            {form.ingredients.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-2">Aucun élément</p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Check size={16} />
            {editing ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">
            {search ? 'Aucun résultat' : 'Aucune recette encore. Créez-en une !'}
          </p>
        ) : (
          filtered.map((recipe) => {
            const expanded = expandedId === recipe.id
            const servings = previewServings[recipe.id] ?? 1
            const macros = calculateRecipeMacros(recipe, ingredients, recipes, servings)
            const perPortionMacros = calculateRecipeMacros(recipe, ingredients, recipes, 1)

            return (
              <div key={recipe.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div
                  onClick={() => setExpandedId(expanded ? null : recipe.id)}
                  className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
                >
                  <div className="text-left">
                    <p className="font-medium text-slate-800 text-sm">{recipe.name}</p>
                    <p className="text-xs text-slate-400">
                      {perPortionMacros.calories} kcal · P {perPortionMacros.proteins}g · G {perPortionMacros.carbs}g · L {perPortionMacros.fats}g
                      <span className="ml-1 text-slate-300">/ portion</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(recipe) }} className="p-2 text-slate-400 hover:text-blue-500">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShare(recipe.id) }}
                      className="p-2 text-slate-400 hover:text-green-500 relative"
                      title="Partager"
                    >
                      {copiedId === recipe.id
                        ? <Check size={14} className="text-green-500" />
                        : <Share2 size={14} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteRecipe(recipe.id) }} className="p-2 text-slate-400 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                    {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-slate-100 px-4 py-3 space-y-3">
                    {/* Sélecteur de portions */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Portions</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setPreviewServings((p) => ({ ...p, [recipe.id]: Math.max(1, (p[recipe.id] ?? 1) - 1) }))}
                          className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-sm flex items-center justify-center hover:bg-slate-200"
                        >−</button>
                        <span className="text-sm font-semibold text-slate-800 w-4 text-center">{servings}</span>
                        <button
                          onClick={() => setPreviewServings((p) => ({ ...p, [recipe.id]: (p[recipe.id] ?? 1) + 1 }))}
                          className="w-7 h-7 rounded-full bg-green-500 text-white font-bold text-sm flex items-center justify-center hover:bg-green-600"
                        >+</button>
                      </div>
                    </div>

                    {/* Macros pour les portions sélectionnées */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Kcal', value: macros.calories, color: 'text-orange-500' },
                        { label: 'Prot', value: macros.proteins, color: 'text-blue-500' },
                        { label: 'Gluc', value: macros.carbs, color: 'text-amber-500' },
                        { label: 'Lip', value: macros.fats, color: 'text-pink-500' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-slate-50 rounded-xl p-2 text-center">
                          <div className={`text-sm font-bold ${color}`}>{value}</div>
                          <div className="text-xs text-slate-400">{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Liste des ingrédients */}
                    <div>
                      {recipe.ingredients.map((ri, idx) => {
                        const label = ri.type === 'ingredient'
                          ? ingredients.find((i) => i.id === ri.ingredient_id)?.name ?? '?'
                          : recipes.find((r) => r.id === ri.recipe_id)?.name ?? '?'
                        const unitLabel = ri.type === 'recipe'
                          ? 'port.'
                          : ingredientUnitLabel(ingredients.find((i) => i.id === ri.ingredient_id)?.unit ?? 'g')
                        const scaledQty = Math.round((ri.quantity / recipe.servings) * servings * 10) / 10
                        return (
                          <div key={idx} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
                            <span className="text-sm text-slate-700">{label}</span>
                            <span className="text-xs text-slate-400">{scaledQty} {unitLabel}</span>
                          </div>
                        )
                      })}
                    </div>
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
