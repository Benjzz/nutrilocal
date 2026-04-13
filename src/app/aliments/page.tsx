'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, X, Check } from 'lucide-react'
import DragScroll from '@/components/DragScroll'
import { useApp } from '@/context/AppContext'
import { Ingredient, INGREDIENT_CATEGORIES, IngredientCategory } from '@/lib/types'

type FormData = {
  name: string
  category: IngredientCategory
  calories: string
  proteins: string
  carbs: string
  fats: string
  unit: 'g' | 'ml' | 'piece'
}

const EMPTY: FormData = {
  name: '',
  category: 'Autre',
  calories: '',
  proteins: '',
  carbs: '',
  fats: '',
  unit: 'g',
}

export default function AlimentsPage() {
  const { ingredients, addIngredient, updateIngredient, deleteIngredient } = useApp()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<IngredientCategory | 'Tous'>('Tous')
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY)

  const filtered = ingredients.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'Tous' || i.category === activeCategory
    return matchSearch && matchCat
  })

  function openAdd() {
    setForm(EMPTY)
    setAdding(true)
    setEditing(null)
  }

  function openEdit(ing: Ingredient) {
    setForm({
      name: ing.name,
      category: ing.category,
      calories: ing.calories === 0 ? '' : String(ing.calories),
      proteins: ing.proteins === 0 ? '' : String(ing.proteins),
      carbs: ing.carbs === 0 ? '' : String(ing.carbs),
      fats: ing.fats === 0 ? '' : String(ing.fats),
      unit: ing.unit,
    })
    setEditing(ing)
    setAdding(false)
  }

  function closeForm() {
    setAdding(false)
    setEditing(null)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    const data = {
      name: form.name,
      category: form.category,
      calories: parseFloat(form.calories) || 0,
      proteins: parseFloat(form.proteins) || 0,
      carbs: parseFloat(form.carbs) || 0,
      fats: parseFloat(form.fats) || 0,
      unit: form.unit,
    }
    if (editing) {
      await updateIngredient({ ...editing, ...data })
    } else {
      await addIngredient(data)
    }
    closeForm()
  }

  const categories: ('Tous' | IngredientCategory)[] = ['Tous', ...INGREDIENT_CATEGORIES]

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Aliments</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-green-500 text-white text-sm font-medium px-3 py-2 rounded-xl"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
        <Search size={16} className="text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher un aliment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm bg-transparent focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')}>
            <X size={14} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* Category filter */}
      <DragScroll className="flex gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              activeCategory === cat
                ? 'bg-green-500 text-white'
                : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </DragScroll>

      {/* Form */}
      {(adding || editing) && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              {editing ? 'Modifier' : 'Nouvel aliment'}
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
              placeholder="Ex: Blanc de poulet"
            />
          </div>

          {/* Category selector */}
          <div>
            <label className="text-xs font-medium text-slate-500">Catégorie</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {INGREDIENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setForm((f) => ({ ...f, category: cat }))}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    form.category === cat
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { key: 'calories', label: 'Calories (kcal/100g)' },
                { key: 'proteins', label: 'Protéines (g/100g)' },
                { key: 'carbs', label: 'Glucides (g/100g)' },
                { key: 'fats', label: 'Lipides (g/100g)' },
              ] as { key: keyof FormData; label: string }[]
            ).map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs font-medium text-slate-500">{label}</label>
                <input
                  type="number"
                  value={form[key] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Unité</label>
            <div className="flex gap-2 mt-1">
              {(['g', 'ml', 'piece'] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setForm((f) => ({ ...f, unit: u }))}
                  className={`flex-1 py-2 text-sm rounded-xl font-medium transition-colors ${
                    form.unit === u
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {u === 'piece' ? 'pièce' : u}
                </button>
              ))}
            </div>
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

      {/* List grouped by category */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">
            {search || activeCategory !== 'Tous' ? 'Aucun résultat' : 'Aucun aliment encore.'}
          </p>
        ) : (
          filtered.map((ing) => (
            <div
              key={ing.id}
              className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800 text-sm">{ing.name}</p>
                  <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                    {ing.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {ing.calories} kcal · P {ing.proteins}g · G {ing.carbs}g · L {ing.fats}g / 100{ing.unit}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(ing)}
                  className="p-2 text-slate-400 hover:text-blue-500"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => deleteIngredient(ing.id)}
                  className="p-2 text-slate-400 hover:text-red-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
