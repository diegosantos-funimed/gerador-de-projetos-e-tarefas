"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Plus } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const INCOME_CATEGORIES = [
  "Salário",
  "Freelance",
  "Investimentos",
  "Presente",
  "Outros",
]

const EXPENSE_CATEGORIES = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Vestuário",
  "Assinaturas",
  "Outros",
]

const formSchema = z
  .object({
    type: z.enum(["income", "expense"]),
    amount: z
      .string()
      .min(1, "Informe o valor")
      .refine(
        (v) =>
          !isNaN(Number(v.replace(",", "."))) &&
          Number(v.replace(",", ".")) > 0,
        { message: "Valor deve ser maior que zero" }
      ),
    description: z.string().min(1, "Informe a descrição"),
    category: z.string().min(1, "Selecione a categoria"),
    date: z.string().min(1, "Informe a data"),
    isInstallment: z.boolean(),
    installmentCurrent: z.string(),
    installmentTotal: z.string(),
    subscriptionFrequency: z.enum(["monthly", "annual"]),
    subscriptionHasEnd: z.boolean(),
    subscriptionDuration: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.category === "Assinaturas" && data.subscriptionHasEnd) {
      const dur = Number(data.subscriptionDuration)
      if (!data.subscriptionDuration || isNaN(dur) || dur < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe a duração",
          path: ["subscriptionDuration"],
        })
      }
    }
    if (!data.isInstallment) return
    const current = Number(data.installmentCurrent)
    const total = Number(data.installmentTotal)
    if (!data.installmentCurrent || isNaN(current) || current < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Parcela atual inválida",
        path: ["installmentCurrent"],
      })
    }
    if (!data.installmentTotal || isNaN(total) || total < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total de parcelas inválido",
        path: ["installmentTotal"],
      })
    }
    if (
      data.installmentCurrent &&
      data.installmentTotal &&
      !isNaN(current) &&
      !isNaN(total) &&
      current > total
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Parcela atual não pode ser maior que o total",
        path: ["installmentCurrent"],
      })
    }
  })

type FormValues = z.infer<typeof formSchema>

function addYears(dateStr: string, years: number): string {
  const [year, month, day] = dateStr.split("-").map(Number)
  return `${year + years}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function addMonths(dateStr: string, months: number): string {
  const [year, month, day] = dateStr.split("-").map(Number)
  const d = new Date(year, month - 1 + months, day)
  // Corrige se o dia não existe no mês destino (ex: 31 → último dia)
  if (d.getDate() !== day) {
    d.setDate(0)
  }
  return d.toISOString().split("T")[0]
}

export function AddTransactionForm() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const defaultValues: FormValues = {
    type: "expense",
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    isInstallment: false,
    installmentCurrent: "",
    installmentTotal: "",
    subscriptionFrequency: "monthly",
    subscriptionHasEnd: false,
    subscriptionDuration: "",
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const selectedType = form.watch("type")
  const isInstallment = form.watch("isInstallment")
  const selectedCategory = form.watch("category")
  const isSubscription = selectedCategory === "Assinaturas"
  const subscriptionFrequency = form.watch("subscriptionFrequency")
  const subscriptionHasEnd = form.watch("subscriptionHasEnd")
  const categories =
    selectedType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  async function save(values: FormValues, keepOpen: boolean) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const amount = Number(values.amount.replace(",", "."))

    if (values.category === "Assinaturas") {
      const isMonthly = values.subscriptionFrequency === "monthly"
      // Sem fim: 10 anos (mensal = 120 entradas, anual = 10)
      const count = values.subscriptionHasEnd
        ? Math.max(1, Number(values.subscriptionDuration) || 1)
        : isMonthly
          ? 120
          : 10
      const groupId = crypto.randomUUID()

      const rows = Array.from({ length: count }, (_, i) => ({
        user_id: user.id,
        type: values.type,
        amount,
        description: values.description,
        category: values.category,
        date: isMonthly ? addMonths(values.date, i) : addYears(values.date, i),
        subscription_group_id: groupId,
      }))

      const { error } = await supabase.from("transactions").insert(rows)
      if (error) {
        toast.error("Erro ao registrar assinatura")
        return
      }
      const label = isMonthly
        ? `${count} ${count === 1 ? "mês" : "meses"}`
        : `${count} ${count === 1 ? "ano" : "anos"}`
      toast.success(
        values.subscriptionHasEnd
          ? `Assinatura registrada por ${label}!`
          : `Assinatura recorrente registrada (${label})!`
      )
    } else if (values.isInstallment) {
      const current = Number(values.installmentCurrent)
      const total = Number(values.installmentTotal)
      const groupId = crypto.randomUUID()

      // Calcula a data da 1ª parcela com base na parcela atual informada
      const firstDate = addMonths(values.date, -(current - 1))

      const rows = Array.from({ length: total }, (_, i) => ({
        user_id: user.id,
        type: values.type,
        amount,
        description: `${values.description} (${i + 1}/${total})`,
        category: values.category,
        date: addMonths(firstDate, i),
        installment_current: i + 1,
        installment_total: total,
        installment_group_id: groupId,
      }))

      const { error } = await supabase.from("transactions").insert(rows)
      if (error) {
        toast.error("Erro ao registrar parcelas")
        return
      }
      toast.success(`${total} parcelas registradas com sucesso!`)
    } else {
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: values.type,
        amount,
        description: values.description,
        category: values.category,
        date: values.date,
      })
      if (error) {
        toast.error("Erro ao registrar transação")
        return
      }
      toast.success("Transação registrada com sucesso!")
    }

    form.reset(defaultValues)
    router.refresh()
    if (!keepOpen) setOpen(false)
  }

  async function onSubmit(values: FormValues) {
    await save(values, false)
  }

  async function onSubmitAndCreateAnother() {
    const valid = await form.trigger()
    if (!valid) return
    await save(form.getValues(), true)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Registrar Transação</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        form.setValue("category", "")
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Notebook" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Valor (R$){" "}
                      {isInstallment && (
                        <span className="text-muted-foreground font-normal">
                          — por parcela
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        if (value === "Assinaturas") {
                          form.setValue("isInstallment", false)
                          form.setValue("installmentCurrent", "")
                          form.setValue("installmentTotal", "")
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Configuração de Assinatura */}
              {isSubscription && (
                <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                  {/* Frequência: Mensal / Anual */}
                  <FormField
                    control={form.control}
                    name="subscriptionFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequência</FormLabel>
                        <FormControl>
                          <ToggleGroup
                            type="single"
                            variant="outline"
                            value={field.value}
                            onValueChange={(v) => {
                              if (v) field.onChange(v)
                            }}
                            className="w-full"
                          >
                            <ToggleGroupItem value="monthly" className="flex-1">
                              Mensal
                            </ToggleGroupItem>
                            <ToggleGroupItem value="annual" className="flex-1">
                              Anual
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Sem fim / Com fim */}
                  <FormField
                    control={form.control}
                    name="subscriptionHasEnd"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-3">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked)
                                if (!checked)
                                  form.setValue("subscriptionDuration", "")
                              }}
                            />
                          </FormControl>
                          <Label className="cursor-pointer">
                            Tem data de fim?
                          </Label>
                        </div>
                        {!field.value && (
                          <p className="text-xs text-muted-foreground pt-1">
                            Sem fim: serão criadas{" "}
                            {subscriptionFrequency === "monthly"
                              ? "120 entradas (10 anos)"
                              : "10 entradas (1 por ano)"}
                            .
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Duração (apenas quando tem fim) */}
                  {subscriptionHasEnd && (
                    <FormField
                      control={form.control}
                      name="subscriptionDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {subscriptionFrequency === "monthly"
                              ? "Quantos meses?"
                              : "Quantos anos?"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder={
                                subscriptionFrequency === "monthly" ? "12" : "3"
                              }
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {/* Toggle de parcelamento — oculto para Assinaturas */}
              {!isSubscription && (
                <FormField
                  control={form.control}
                  name="isInstallment"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-3 py-1">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked)
                              if (!checked) {
                                form.setValue("installmentCurrent", "")
                                form.setValue("installmentTotal", "")
                              }
                            }}
                          />
                        </FormControl>
                        <Label className="cursor-pointer">É parcelado?</Label>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {isInstallment && (
                <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Informe a parcela que está sendo registrada. As demais serão
                    criadas automaticamente.
                  </p>
                  <div className="flex items-end gap-3">
                    <FormField
                      control={form.control}
                      name="installmentCurrent"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Parcela atual</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="ex: 5"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <span className="pb-2 text-muted-foreground font-medium">
                      /
                    </span>
                    <FormField
                      control={form.control}
                      name="installmentTotal"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Total de parcelas</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="ex: 12"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Data da parcela{" "}
                          {form.watch("installmentCurrent") || "atual"}
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {!isInstallment && (
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <SheetFooter className="px-6 pb-6 flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={form.formState.isSubmitting}
                onClick={onSubmitAndCreateAnother}
              >
                {form.formState.isSubmitting
                  ? "Salvando..."
                  : "Salvar e criar outra"}
              </Button>
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
