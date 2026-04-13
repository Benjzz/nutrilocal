type CalorieRingProps = {
  value: number
  goal: number
}

export default function CalorieRing({ value, goal }: CalorieRingProps) {
  const size = 140
  const stroke = 10
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0
  const over = goal > 0 && value > goal
  const offset = circ - pct * circ
  const remaining = Math.max(goal - value, 0)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? '#f87171' : '#22c55e'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute text-center">
        <div className={`text-2xl font-bold ${over ? 'text-red-500' : 'text-slate-800'}`}>
          {value}
        </div>
        <div className="text-xs text-slate-400">kcal</div>
        <div className="text-xs font-medium text-slate-500 mt-0.5">
          {over ? `+${value - goal}` : `−${remaining}`}
        </div>
      </div>
    </div>
  )
}
