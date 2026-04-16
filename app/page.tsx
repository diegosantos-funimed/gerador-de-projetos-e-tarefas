import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  CheckSquare,
  FolderKanban,
  Wallet,
  NotebookPen,
  Target,
  LayoutDashboard,
} from "lucide-react"

const FEATURES = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    description: "Visão geral do seu dia: hábitos, tarefas pendentes, saldo e objetivos em um só painel.",
  },
  {
    icon: FolderKanban,
    label: "Projetos e Tarefas",
    description: "Organize projetos com checklists e kanban. Acompanhe o progresso de tudo que importa.",
  },
  {
    icon: Wallet,
    label: "Finanças",
    description: "Registre receitas e despesas, visualize seu saldo mensal e gráficos de evolução.",
  },
  {
    icon: CheckSquare,
    label: "Hábitos",
    description: "Rastreie hábitos diários, mantenha seu streak e visualize seu histórico em heatmap.",
  },
  {
    icon: NotebookPen,
    label: "Notas",
    description: "Diário pessoal, resumos de leituras com avaliação e uma wiki do seu conhecimento.",
  },
  {
    icon: Target,
    label: "Objetivos",
    description: "Defina metas anuais e trimestrais com Key Results. Acompanhe seu progresso real.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/icon.svg" alt="Prumo" width={34} height={34} className="rounded-lg" />
            <span className="font-semibold text-lg">Prumo</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/sign-up">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="container mx-auto px-6 md:px-10 py-24 md:py-36 text-center max-w-4xl">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-8 border"
            style={{ color: "#00C878", borderColor: "#00C87840", backgroundColor: "#00C87810" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Sistema de gestão pessoal
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance mb-6 leading-tight">
            Mantenha sua vida{" "}
            <span style={{ color: "#00C878" }}>no prumo</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground text-pretty max-w-2xl mx-auto mb-10">
            Projetos, finanças, hábitos, notas e objetivos — tudo centralizado em um único lugar,
            pensado para funcionar do jeito que você pensa.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="gap-2">
              <Link href="/auth/sign-up">
                Começar gratuitamente
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Já tenho conta</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-secondary/30">
          <div className="container mx-auto px-6 md:px-10 py-20 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Tudo que você precisa</h2>
              <p className="text-muted-foreground">
                Módulos integrados que se complementam no seu dia a dia.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map(({ icon: Icon, label, description }) => (
                <div
                  key={label}
                  className="flex flex-col gap-3 p-5 rounded-xl border bg-card hover:shadow-sm transition-shadow"
                >
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                    style={{ backgroundColor: "#00C87815" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "#00C878" }} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{label}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="container mx-auto px-6 md:px-10 py-24 text-center max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para colocar tudo no lugar?
          </h2>
          <p className="text-muted-foreground mb-8">
            Crie sua conta e comece a usar o Prumo agora. É gratuito.
          </p>
          <Button size="lg" asChild className="gap-2">
            <Link href="/auth/sign-up">
              Criar minha conta
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-6 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Image src="/icon.svg" alt="Prumo" width={20} height={20} className="rounded" />
            <span>Prumo</span>
          </div>
          <p>Seu sistema de gestão pessoal.</p>
        </div>
      </footer>

    </div>
  )
}
