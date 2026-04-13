'use client'

import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Recipe, RecipeIngredient } from '@/lib/types'
import { calculateRecipeMacros, generateId } from '@/lib/utils'

type RecipeForm = {
  name: string
  servings: number
  ingredients: RecipeIngredient[]
}

const EMPTY_FORM: RecipeForm = { name: '', servings: 1, ingredients: [] }

export default function RecettesPage() {
  const { recipes, ingredients, addRecipe, updateRecipe, deleteRecipe } = useApp()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Recipe | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<RecipeForm>(EMPTY_FORM)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [ingSearch, setIngSearch] = useState('')
  const [showIngPicker, setShowIngPicker] = useState(false)

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredIngredients = useMemo(
    () => ingredients.filter((i) => i.name.toLowerCase().includes(ingSearch.toLowerCase())),
    [ingredients, ingSearch]
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
    setShowIngPicker(false)
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
    if (form.ingredients.find((i) => i.ingredient_id === ingId)) return
    setForm((f) => ({
      ...f,
      ingredients: [...f.ingredients, { ingredient_id: ingId, quantity: 100 }],
    }))
    setShowIngPicker(false)
    setIngSearch('')
  }

  function updateIngQty(ingId: string, qty: number) {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.map((i) =>
        i.ingredient_id === ingId ? { ...i, quantity: qty } : i
      ),
    }))
  }

  function removeIngFromForm(ingId: string) {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.filter((i) => i.ingredient_id !== ingId),
    }))
  }

  function getIngName(id: string) {
    return ingredients.find((i) => i.id === id)?.name ?? '?'
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
              value={form.servings === 0 ? '' : form.servings}
              onChange={(e) => setForm((f) => ({ ...f, servings: parseInt(e.target.value) || 1 }))}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="1"
            />
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-500">Ingrédients</label>
              <button
                onClick={() => setShowIngPicker(!showIngPicker)}
                className="text-xs text-green-500 font-medium flex items-center gap-1"
              >
                <Plus size={12} />
                Ajouter
              </button>
            </div>

            {showIngPicker && (
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Chercher..."
                    value={ingSearch}
                    onChange={(e) => setIngSearch(e.target.value)}
                    className="flex-1 text-xs bg-transparent focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="max-h-36 overflow-y-auto">
                  {filteredIngredients.map((ing) => (
                    <button
                      key={ing.id}
                      onClick={() => addIngToForm(ing.id)}
                      disabled={!!form.ingredients.find((i) => i.ingredient_id === ing.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-40 border-t border-slate-50"
                    >
                      {ing.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.ingredients.map((ri) => (
              <div key={ri.ingredient_id} className="flex items-center gap-2 mb-2">
                <span className="flex-1 text-sm text-slate-700 truncate">{getIngName(ri.ingredient_id)}</span>
                <input
                  type="number"
                  value={ri.quantity === 0 ? '' : ri.quantity}
                  onChange={(e) => updateIngQty(ri.ingredient_id, parseFloat(e.target.value) || 0)}
                  className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none"
                  placeholder="0"
                />
                <span className="text-xs text-slate-400">g</span>
                <button onClick={() => removeIngFromForm(ri.ingredient_id)} className="text-slate-300 hover:text-red-400">
                  <X size={14} />
                </button>
              </div>
            ))}

            {form.ingredients.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-2">Aucun ingrédient</p>
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
            const macros = calculateRecipeMacros(recipe, ingredients, 1)
            const expanded = expandedId === recipe.id
            return (
              <div key={recipe.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(expanded ? null : recipe.id)}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <div className="text-left">
                    <p className="font-medium text-slate-800 text-sm">{recipe.name}</p>
                    <p className="text-xs text-slate-400">
                      {macros.calories} kcal · P {macros.proteins}g · G {macros.carbs}g · L {macros.fats}g
                      <span className="ml-1 text-slate-300">/ portion</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(recipe) }} className="p-2 text-slate-400 hover:text-blue-500">
                      <Pencil size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteRecipe(recipe.id) }} className="p-2 text-slate-400 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                    {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-slate-50 px-4 py-2">
                    <p className="text-xs font-medium text-slate-500 mb-1">{recipe.servings} portion{recipe.servings > 1 ? 's' : ''} au total</p>
                    {recipe.ingredients.map((ri) => {
                      const ing = ingredients.find((i) => i.id === ri.ingredient_id)
                      return (
                        <div key={ri.ingredient_id} className="flex justify-between py-1 border-b border-slate-50 last:border-0">
                          <span className="text-sm text-slate-700">{ing?.name ?? '?'}</span>
                          <span className="text-xs text-slate-400">{ri.quantity}g</span>
                        </div>
                      )
                    })}
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
