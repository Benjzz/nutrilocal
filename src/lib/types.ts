export type DayType = 'training' | 'rest'

export type MacroGoal = {
  calories: number
  proteins: number
  carbs: number
  fats: number
}

export type Profile = {
  id: string
  name: string
  goals: {
    training: MacroGoal
    rest: MacroGoal
  }
}

export const INGREDIENT_CATEGORIES = [
  'Viandes & Poissons',
  'Légumes',
  'Féculents',
  'Fruits',
  'Produits laitiers',
  'Matières grasses',
  'Boissons',
  'Autre',
] as const

export type IngredientCategory = typeof INGREDIENT_CATEGORIES[number]

export type Ingredient = {
  id: string
  name: string
  category: IngredientCategory
  calories: number   // pour 100g
  proteins: number   // pour 100g
  carbs: number      // pour 100g
  fats: number       // pour 100g
  unit: 'g' | 'ml' | 'piece'
  piece_weight?: number // poids en g si unit = 'piece'
}

export type RecipeIngredient = {
  ingredient_id: string
  quantity: number // en grammes
}

export type Recipe = {
  id: string
  name: string
  servings: number
  ingredients: RecipeIngredient[]
}

export type MealItem = {
  id: string
  type: 'ingredient' | 'recipe'
  ref_id: string
  quantity: number // grammes pour ingredient, nb portions pour recipe
}

export const MEAL_TYPES = ['plat', 'collation', 'boisson'] as const
export type MealType = typeof MEAL_TYPES[number]

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  plat: 'Plat',
  collation: 'Collation',
  boisson: 'Boisson',
}

export type Meal = {
  id: string
  name: string
  meal_type: MealType
  items: MealItem[]
}

export type DayLog = {
  id: string
  profile_id: string
  date: string // YYYY-MM-DD
  day_type: DayType
  meals: Meal[]
}

export type MacroTotals = {
  calories: number
  proteins: number
  carbs: number
  fats: number
}
