'use client'

import { useRef, ReactNode } from 'react'

type DragScrollProps = {
  children: ReactNode
  className?: string
}

export default function DragScroll({ children, className = '' }: DragScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  function onMouseDown(e: React.MouseEvent) {
    if (!ref.current) return
    isDragging.current = true
    startX.current = e.pageX - ref.current.offsetLeft
    scrollLeft.current = ref.current.scrollLeft
    ref.current.style.cursor = 'grabbing'
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || !ref.current) return
    e.preventDefault()
    const x = e.pageX - ref.current.offsetLeft
    const walk = x - startX.current
    ref.current.scrollLeft = scrollLeft.current - walk
  }

  function onMouseUp() {
    isDragging.current = false
    if (ref.current) ref.current.style.cursor = 'grab'
  }

  return (
    <div
      ref={ref}
      className={`overflow-x-auto scrollbar-hide cursor-grab select-none ${className}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {children}
    </div>
  )
}
