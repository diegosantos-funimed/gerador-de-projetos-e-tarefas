"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { List, Kanban } from "lucide-react"

interface ViewToggleProps {
  view: "list" | "kanban"
  onViewChange: (view: "list" | "kanban") => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <ToggleGroup 
      type="single" 
      value={view} 
      onValueChange={(value) => value && onViewChange(value as "list" | "kanban")}
      className="bg-muted p-1 rounded-lg"
    >
      <ToggleGroupItem 
        value="list" 
        aria-label="Visualização em lista"
        className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3"
      >
        <List className="h-4 w-4 mr-2" />
        Lista
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="kanban" 
        aria-label="Visualização em Kanban"
        className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3"
      >
        <Kanban className="h-4 w-4 mr-2" />
        Kanban
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
