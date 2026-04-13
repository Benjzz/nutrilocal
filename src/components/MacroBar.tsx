type MacroBarProps = {
  label: string
  value: number
  goal: number
  color: string
  unit?: string
}

export default function MacroBar({ label, value, goal, color, unit = 'g' }: MacroBarProps) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  const over = goal > 0 && value > goal

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className={`font-semibold ${over ? 'text-red-500' : 'text-slate-700'}`}>
          {value}{unit} / {goal}{unit}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-400' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
