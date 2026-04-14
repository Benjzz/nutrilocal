'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { Meal, MealItem, CustomRecipe, MEAL_TYPE_LABELS } from '@/lib/types'
import { useApp } from '@/context/AppContext'
import { calculateItemMacros, calculateIngredientMacros, calculateRecipeMacros, sumMacros, ingredientUnitLabel } from '@/lib/utils'
import AddFoodModal from './AddFoodModal'
import CustomizeRecipeModal from './CustomizeRecipeModal'
import { generateId } from '@/lib/utils'

type MealSectionProps = {
  meal: Meal
  onUpdate: (meal: Meal) => void
  onDelete: () => void
}

export default function MealSection({ meal, onUpdate, onDelete }: MealSectionProps) {
  const { ingredients, recipes } = useApp()
  const [open, setOpen] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [customizingItem, setCustomizingItem] = useState<MealItem | null>(null)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)

  const itemMacros = meal.items.map((item) =>
    calculateItemMacros(item, ingredients, recipes)
  )
  const totalMacros = sumMacros(itemMacros)

  function getItemLabel(item: MealItem): string {
    if (item.type === 'ingredient') {
      const ing = ingredients.find((i) => i.id === item.ref_id)
      return ing ? `${ing.name} — ${item.quantity}g` : 'Aliment inconnu'
    } else {
      const name = item.custom_recipe?.name
        ?? recipes.find((r) => r.id === item.ref_id)?.name
        ?? 'Recette inconnue'
      return `${name} — ${item.quantity} portion${item.quantity > 1 ? 's' : ''}`
    }
  }

  function removeItem(id: string) {
    onUpdate({ ...meal, items: meal.items.filter((i) => i.id !== id) })
  }

  function handleAdd(type: 'ingredient' | 'recipe', refId: string, quantity: number) {
    const newItem: MealItem = { id: generateId(), type, ref_id: refId, quantity }
    onUpdate({ ...meal, items: [...meal.items, newItem] })
  }

  function handleCustomizeSave(itemId: string, custom: CustomRecipe) {
    onUpdate({
      ...meal,
      items: meal.items.map((i) => i.id === itemId ? { ...i, custom_recipe: custom } : i),
    })
    setCustomizingItem(null)
  }

  function handleCustomizeReset(itemId: string) {
    onUpdate({
      ...meal,
      items: meal.items.map((i) => i.id === itemId ? { ...i, custom_recipe: undefined } : i),
    })
    setCustomizingItem(null)
  }

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {/* Header du repas */}
        <div
          className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-slate-800 text-sm">{meal.name}</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                meal.meal_type === 'plat' ? 'bg-orange-100 text-orange-500' :
                meal.meal_type === 'collation' ? 'bg-purple-100 text-purple-500' :
                'bg-blue-100 text-blue-500'
              }`}>
                {MEAL_TYPE_LABELS[meal.meal_type]}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {totalMacros.calories} kcal · P {totalMacros.proteins}g · G {totalMacros.carbs}g · L {totalMacros.fats}g
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="p-1 text-slate-300 hover:text-red-400"
            >
              <Trash2 size={15} />
            </button>
            {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </div>
        </div>

        {open && (
          <div className="border-t border-slate-50">
            {meal.items.map((item, idx) => {
              const macros = itemMacros[idx]
              const isCustomized = item.type === 'recipe' && !!item.custom_recipe
              const isRecipe = item.type === 'recipe'
              const itemExpanded = expandedItemId === item.id
              const recipeSource = isRecipe
                ? (item.custom_recipe
                    ? { id: item.ref_id, ...item.custom_recipe }
                    : recipes.find((r) => r.id === item.ref_id))
                : null

              return (
                <div key={item.id} className="border-b border-slate-50 last:border-0">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <div
                      className={`flex-1 min-w-0 ${isRecipe ? 'cursor-pointer' : ''}`}
                      onClick={() => isRecipe && setExpandedItemId(itemExpanded ? null : item.id)}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm text-slate-700 truncate">{getItemLabel(item)}</p>
                        {isCustomized && (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 shrink-0">
                            modifiée
                          </span>
                        )}
                        {isRecipe && (
                          itemExpanded
                            ? <ChevronUp size={11} className="text-slate-300 shrink-0" />
                            : <ChevronDown size={11} className="text-slate-300 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {macros.calories} kcal · P {macros.proteins}g · G {macros.carbs}g · L {macros.fats}g
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 ml-2">
                      {isRecipe && (
                        <button
                          onClick={() => setCustomizingItem(item)}
                          className="p-1.5 text-slate-300 hover:text-amber-400"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-slate-300 hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Détail des ingrédients de la recette */}
                  {itemExpanded && recipeSource && (
                    <div className="bg-slate-50 px-4 pb-2 space-y-0">
                      {recipeSource.ingredients.map((ri, i) => {
                        const scaledQty = (ri.quantity / recipeSource.servings) * item.quantity
                        const ingLabel = ri.type === 'ingredient'
                          ? ingredients.find((g) => g.id === ri.ingredient_id)?.name ?? '?'
                          : recipes.find((r) => r.id === ri.recipe_id)?.name ?? '?'
                        const unitLabel = ri.type === 'recipe'
                          ? 'port.'
                          : ingredientUnitLabel(ingredients.find((g) => g.id === ri.ingredient_id)?.unit ?? 'g')
                        const ingMacros = ri.type === 'ingredient'
                          ? (() => { const ing = ingredients.find((g) => g.id === ri.ingredient_id); return ing ? calculateIngredientMacros(ing, scaledQty) : null })()
                          : (() => { const sub = recipes.find((r) => r.id === ri.recipe_id); return sub ? calculateRecipeMacros(sub, ingredients, recipes, scaledQty) : null })()
                        return (
                          <div key={i} className="py-1.5 border-b border-slate-100 last:border-0">
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs text-slate-600 font-medium">{ingLabel}</span>
                              <span className="text-xs text-slate-400">{Math.round(scaledQty * 10) / 10} {unitLabel}</span>
                            </div>
                            {ingMacros && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                <span className="text-orange-400">{ingMacros.calories} kcal</span>
                                {' · '}P <span className="text-blue-400">{ingMacros.proteins}g</span>
                                {' · '}G <span className="text-amber-400">{ingMacros.carbs}g</span>
                                {' · '}L <span className="text-pink-400">{ingMacros.fats}g</span>
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            <button
              onClick={() => setShowModal(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-green-500 text-sm font-medium hover:bg-green-50 transition-colors"
            >
              <Plus size={16} />
              Ajouter un aliment
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <AddFoodModal
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}

      {customizingItem && (
        <CustomizeRecipeModal
          item={customizingItem}
          onSave={(custom) => handleCustomizeSave(customizingItem.id, custom)}
          onReset={() => handleCustomizeReset(customizingItem.id)}
          onClose={() => setCustomizingItem(null)}
        />
      )}
    </>
  )
}
