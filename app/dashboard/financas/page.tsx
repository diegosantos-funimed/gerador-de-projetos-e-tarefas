import { createClient } from "@/lib/supabase/server"
import { AddTransactionForm } from "@/components/add-transaction-form"
import { TransactionsList } from "@/components/transactions-list"
import { FinanceSummaryCards } from "@/components/finance-summary-cards"
import { FinanceChart } from "@/components/finance-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthFilter } from "@/components/month-filter"

interface SearchParams {
  month?: string
  year?: string
}

export default async function FinancasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const now = new Date()
  const year = Number(params.year ?? now.getFullYear())
  const month = Number(params.month ?? now.getMonth() + 1)

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate = new Date(year, month, 0).toISOString().split("T")[0]

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false })

  const list = transactions ?? []

  const totalIncome = list
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0)

  const totalExpenses = list
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0)

  // Dados dos últimos 6 meses para o gráfico
  const chartMonths: { month: string; income: number; expense: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1)
    const m = d.getMonth() + 1
    const y = d.getFullYear()
    const start = `${y}-${String(m).padStart(2, "0")}-01`
    const end = new Date(y, m, 0).toISOString().split("T")[0]

    const { data: monthData } = await supabase
      .from("transactions")
      .select("type, amount")
      .gte("date", start)
      .lte("date", end)

    const inc = (monthData ?? [])
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + Number(t.amount), 0)
    const exp = (monthData ?? [])
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + Number(t.amount), 0)

    chartMonths.push({
      month: d.toLocaleString("pt-BR", { month: "short" }),
      income: inc,
      expense: exp,
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finanças</h1>
          <p className="text-muted-foreground mt-1">
            Controle suas receitas e despesas mensais
          </p>
        </div>
        <AddTransactionForm />
      </div>

      <div className="flex items-center gap-2">
        <MonthFilter year={year} month={month} />
      </div>

      <FinanceSummaryCards totalIncome={totalIncome} totalExpenses={totalExpenses} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Últimos 6 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <FinanceChart data={chartMonths} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Transações do mês</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsList transactions={list} />
        </CardContent>
      </Card>
    </div>
  )
}
