import { Ingredient, Recipe, MealItem, MacroTotals } from './types'

export function calculateIngredientMacros(
  ingredient: Ingredient,
  quantity: number // dans l'unité native de l'ingrédient (g, ml, ou pièce)
): MacroTotals {
  // Convertir en grammes pour le calcul
  let grams = quantity
  if (ingredient.unit === 'piece') {
    grams = quantity * (ingredient.piece_weight ?? 100)
  }
  // ml traité comme g (densité ≈ 1)
  const ratio = grams / 100
  return {
    calories: Math.round(ingredient.calories * ratio),
    proteins: Math.round(ingredient.proteins * ratio * 10) / 10,
    carbs: Math.round(ingredient.carbs * ratio * 10) / 10,
    fats: Math.round(ingredient.fats * ratio * 10) / 10,
  }
}

export function ingredientUnitLabel(unit: Ingredient['unit']): string {
  if (unit === 'piece') return 'pièce(s)'
  return unit
}

export function ingredientDefaultQty(unit: Ingredient['unit']): number {
  return unit === 'piece' ? 1 : 100
}

export function calculateRecipeMacros(
  recipe: Recipe,
  ingredients: Ingredient[],
  recipes: Recipe[],
  servings: number
): MacroTotals {
  const ingredientMap = new Map(ingredients.map((i) => [i.id, i]))
  const recipeMap = new Map(recipes.map((r) => [r.id, r]))
  const totals = { calories: 0, proteins: 0, carbs: 0, fats: 0 }

  for (const ri of recipe.ingredients) {
    let macros: MacroTotals
    if (ri.type === 'ingredient') {
      const ing = ingredientMap.get(ri.ingredient_id)
      if (!ing) continue
      macros = calculateIngredientMacros(ing, ri.quantity)
    } else {
      const subRecipe = recipeMap.get(ri.recipe_id)
      if (!subRecipe) continue
      // Éviter les récursions infinies (une recette ne peut pas se contenir elle-même)
      if (subRecipe.id === recipe.id) continue
      macros = calculateRecipeMacros(subRecipe, ingredients, recipes, ri.quantity)
    }
    totals.calories += macros.calories
    totals.proteins += macros.proteins
    totals.carbs += macros.carbs
    totals.fats += macros.fats
  }

  const perServing = {
    calories: totals.calories / recipe.servings,
    proteins: totals.proteins / recipe.servings,
    carbs: totals.carbs / recipe.servings,
    fats: totals.fats / recipe.servings,
  }

  return {
    calories: Math.round(perServing.calories * servings),
    proteins: Math.round(perServing.proteins * servings * 10) / 10,
    carbs: Math.round(perServing.carbs * servings * 10) / 10,
    fats: Math.round(perServing.fats * servings * 10) / 10,
  }
}

export function calculateItemMacros(
  item: MealItem,
  ingredients: Ingredient[],
  recipes: Recipe[]
): MacroTotals {
  if (item.type === 'ingredient') {
    const ing = ingredients.find((i) => i.id === item.ref_id)
    if (!ing) return { calories: 0, proteins: 0, carbs: 0, fats: 0 }
    return calculateIngredientMacros(ing, item.quantity)
  } else {
    const recipe = recipes.find((r) => r.id === item.ref_id)
    if (!recipe) return { calories: 0, proteins: 0, carbs: 0, fats: 0 }
    return calculateRecipeMacros(recipe, ingredients, recipes, item.quantity)
  }
}

export function sumMacros(macros: MacroTotals[]): MacroTotals {
  return macros.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      proteins: Math.round((acc.proteins + m.proteins) * 10) / 10,
      carbs: Math.round((acc.carbs + m.carbs) * 10) / 10,
      fats: Math.round((acc.fats + m.fats) * 10) / 10,
    }),
    { calories: 0, proteins: 0, carbs: 0, fats: 0 }
  )
}

export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayStr(): string {
  return formatDate(new Date())
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function frenchDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayStr()
}
