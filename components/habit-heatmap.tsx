"use client"

import { useMemo } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface HabitHeatmapProps {
  logs: string[] // array of ISO date strings (yyyy-mm-dd) when the habit was completed
  color: string
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function HabitHeatmap({ logs, color }: HabitHeatmapProps) {
  const logSet = useMemo(() => new Set(logs), [logs])

  // Build 52 weeks grid (364 days + today)
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start from the Sunday 52 weeks ago
    const startDate = addDays(today, -364)
    const startSunday = new Date(startDate)
    startSunday.setDate(startSunday.getDate() - startSunday.getDay())

    const weeks: { date: string; inRange: boolean }[][] = []
    const monthLabelMap = new Map<number, string>()

    let current = new Date(startSunday)
    let weekIndex = 0

    while (current <= today || weeks.length < 53) {
      const week: { date: string; inRange: boolean }[] = []
      for (let d = 0; d < 7; d++) {
        const dateStr = formatDate(current)
        const inRange = current >= startDate && current <= today
        week.push({ date: dateStr, inRange })

        // Track month labels (show on first day of month that falls on Sunday col)
        if (d === 0 && inRange) {
          const m = current.getMonth()
          if (!monthLabelMap.has(m) || current.getDate() <= 7) {
            monthLabelMap.set(m, `${weekIndex}:${MONTHS[m]}`)
          }
        }
        current = addDays(current, 1)
      }
      weeks.push(week)
      weekIndex++
      if (weekIndex > 54) break
    }

    // Build month labels array sorted by week index
    const monthLabels: { weekIndex: number; label: string }[] = []
    for (const val of monthLabelMap.values()) {
      const [wi, label] = val.split(":")
      monthLabels.push({ weekIndex: parseInt(wi), label })
    }
    monthLabels.sort((a, b) => a.weekIndex - b.weekIndex)

    return { weeks, monthLabels }
  }, [])

  function getCellColor(date: string, inRange: boolean): string {
    if (!inRange) return "transparent"
    if (logSet.has(date)) return color
    return "var(--secondary)"
  }

  function getOpacity(date: string, inRange: boolean): number {
    if (!inRange) return 0
    return logSet.has(date) ? 1 : 1
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-max">
          {/* Month labels */}
          <div className="flex gap-[3px] ml-8">
            {weeks.map((_, wi) => {
              const ml = monthLabels.find((m) => m.weekIndex === wi)
              return (
                <div key={wi} className="w-3 text-[9px] text-muted-foreground">
                  {ml ? ml.label : ""}
                </div>
              )
            })}
          </div>

          {/* Grid rows = weekdays */}
          {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
            <div key={dayOfWeek} className="flex items-center gap-[3px]">
              {/* Weekday label — only show Mon, Wed, Fri */}
              <div className="w-7 text-[9px] text-muted-foreground text-right pr-1">
                {[1, 3, 5].includes(dayOfWeek) ? WEEKDAYS[dayOfWeek] : ""}
              </div>
              {weeks.map((week, wi) => {
                const cell = week[dayOfWeek]
                const completed = cell.inRange && logSet.has(cell.date)
                const localDate = cell.inRange ? parseLocalDate(cell.date) : null
                const label = localDate
                  ? `${localDate.getDate()} de ${MONTHS[localDate.getMonth()]} — ${completed ? "Concluído ✓" : "Não realizado"}`
                  : ""

                return (
                  <Tooltip key={wi}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-3 h-3 rounded-[2px] transition-opacity ${
                          !cell.inRange ? "opacity-0 cursor-default" : "cursor-default"
                        }`}
                        style={{
                          backgroundColor: getCellColor(cell.date, cell.inRange),
                          opacity: getOpacity(cell.date, cell.inRange),
                        }}
                      />
                    </TooltipTrigger>
                    {cell.inRange && (
                      <TooltipContent side="top" className="text-xs">
                        {label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}
