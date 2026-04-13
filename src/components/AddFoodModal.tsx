'use client'

import { useState, useMemo } from 'react'
import { X, Search, ChevronRight } from 'lucide-react'
import DragScroll from './DragScroll'
import { useApp } from '@/context/AppContext'
import { Ingredient, Recipe, INGREDIENT_CATEGORIES, IngredientCategory } from '@/lib/types'
import { calculateIngredientMacros, calculateRecipeMacros } from '@/lib/utils'

type Tab = 'ingredients' | 'recipes'

type AddFoodModalProps = {
  onClose: () => void
  onAdd: (type: 'ingredient' | 'recipe', id: string, quantity: number) => void
}

export default function AddFoodModal({ onClose, onAdd }: AddFoodModalProps) {
  const { ingredients, recipes } = useApp()
  const [tab, setTab] = useState<Tab>('ingredients')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<IngredientCategory | 'Tous'>('Tous')
  const [selected, setSelected] = useState<{ type: Tab; item: Ingredient | Recipe } | null>(null)
  const [quantity, setQuantity] = useState('')

  const filteredIngredients = useMemo(
    () =>
      ingredients.filter((i) => {
        const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
        const matchCat = activeCategory === 'Tous' || i.category === activeCategory
        return matchSearch && matchCat
      }),
    [ingredients, search, activeCategory]
  )

  const filteredRecipes = useMemo(
    () =>
      recipes.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase())
      ),
    [recipes, search]
  )

  function handleSelect(type: Tab, item: Ingredient | Recipe) {
    setSelected({ type, item })
    setQuantity(type === 'ingredients' ? '100' : '1')
  }

  function handleAdd() {
    if (!selected || !quantity) return
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) return
    onAdd(
      selected.type === 'ingredients' ? 'ingredient' : 'recipe',
      selected.item.id,
      qty
    )
    onClose()
  }

  const previewMacros = useMemo(() => {
    if (!selected || !quantity) return null
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) return null

    if (selected.type === 'ingredients') {
      return calculateIngredientMacros(selected.item as Ingredient, qty)
    } else {
      return calculateRecipeMacros(selected.item as Recipe, ingredients, qty)
    }
  }, [selected, quantity, ingredients])

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto bg-white rounded-t-2xl shadow-2xl flex flex-col"
        style={{ height: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            {selected ? 'Quantité' : 'Ajouter un aliment'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {selected ? (
          /* Vue quantité */
          <div className="p-4 space-y-4">
            <div>
              <p className="font-medium text-slate-800">{selected.item.name}</p>
              <p className="text-sm text-slate-500">
                {selected.type === 'ingredients' ? 'Aliment' : 'Recette'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">
                {selected.type === 'ingredients' ? 'Quantité (g)' : 'Nombre de portions'}
              </label>
              <input
                type="number" onFocus={(e) => e.target.select()}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-400"
                autoFocus
                min="0"
              />
            </div>

            {previewMacros && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Kcal', value: previewMacros.calories, color: 'text-orange-500' },
                  { label: 'Prot', value: previewMacros.proteins, color: 'text-blue-500' },
                  { label: 'Gluc', value: previewMacros.carbs, color: 'text-amber-500' },
                  { label: 'Lip', value: previewMacros.fats, color: 'text-pink-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-2 text-center">
                    <div className={`text-sm font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium"
              >
                Retour
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 py-3 rounded-xl bg-green-500 text-white font-semibold"
              >
                Ajouter
              </button>
            </div>
          </div>
        ) : (
          /* Vue liste */
          <>
            {/* Tabs */}
            <div className="flex gap-1 p-3 border-b border-slate-100">
              {(['ingredients', 'recipes'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    tab === t
                      ? 'bg-green-500 text-white'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'ingredients' ? 'Aliments' : 'Recettes'}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="px-3 pt-3">
              <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Category filter (ingredients only) */}
            {tab === 'ingredients' && (
              <DragScroll className="flex gap-1.5 px-3 py-2">
                {(['Tous', ...INGREDIENT_CATEGORIES] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors ${
                      activeCategory === cat
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </DragScroll>
            )}

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {tab === 'ingredients' ? (
                filteredIngredients.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-8">
                    Aucun aliment trouvé
                  </p>
                ) : (
                  filteredIngredients.map((ing) => (
                    <button
                      key={ing.id}
                      onClick={() => handleSelect('ingredients', ing)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 border-b border-slate-50"
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-slate-800 text-sm">{ing.name}</p>
                          <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">
                            {ing.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {ing.calories} kcal · P {ing.proteins}g · G {ing.carbs}g · L {ing.fats}g
                          <span className="ml-1">/ 100{ing.unit}</span>
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                    </button>
                  ))
                )
              ) : filteredRecipes.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">
                  Aucune recette trouvée
                </p>
              ) : (
                filteredRecipes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect('recipes', r)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 border-b border-slate-50"
                  >
                    <div className="text-left">
                      <p className="font-medium text-slate-800 text-sm">{r.name}</p>
                      <p className="text-xs text-slate-400">
                        {r.servings} portion{r.servings > 1 ? 's' : ''} · {r.ingredients.length} ingrédient{r.ingredients.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
