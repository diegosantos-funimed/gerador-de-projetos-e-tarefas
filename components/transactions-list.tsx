"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2, TrendingDown, TrendingUp } from "lucide-react"

interface Transaction {
  id: string
  type: "income" | "expense"
  amount: number
  description: string
  category: string
  date: string
  installment_current: number | null
  installment_total: number | null
  installment_group_id: string | null
}

interface TransactionsListProps {
  transactions: Transaction[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

export function TransactionsList({ transactions }: TransactionsListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete(id: string) {
    setDeleting(id)
    const supabase = createClient()
    const { error } = await supabase.from("transactions").delete().eq("id", id)
    if (error) {
      toast.error("Erro ao excluir transação")
    } else {
      toast.success("Transação excluída")
      router.refresh()
    }
    setDeleting(null)
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma transação registrada neste período.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="text-muted-foreground text-sm">
              {formatDate(t.date)}
            </TableCell>
            <TableCell className="font-medium">
              <span>{t.description}</span>
              {t.installment_current && t.installment_total && (
                <Badge variant="outline" className="ml-2 text-xs font-normal tabular-nums">
                  {t.installment_current}/{t.installment_total}
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{t.category}</Badge>
            </TableCell>
            <TableCell>
              {t.type === "income" ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Receita
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-sm font-medium">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Despesa
                </span>
              )}
            </TableCell>
            <TableCell
              className={`text-right font-semibold ${
                t.type === "income"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {t.type === "income" ? "+" : "-"}
              {formatCurrency(t.amount)}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(t.id)}
                disabled={deleting === t.id}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
