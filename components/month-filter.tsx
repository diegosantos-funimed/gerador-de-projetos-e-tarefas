"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MonthFilterProps {
  year: number
  month: number
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export function MonthFilter({ year, month }: MonthFilterProps) {
  const router = useRouter()

  function navigate(delta: number) {
    let newMonth = month + delta
    let newYear = year
    if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    } else if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    }
    router.push(`/dashboard/financas?month=${newMonth}&year=${newYear}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-sm font-medium w-36 text-center">
        {MONTHS[month - 1]} {year}
      </span>
      <Button variant="outline" size="icon" onClick={() => navigate(1)}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
