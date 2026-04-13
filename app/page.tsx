import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FolderKanban, CheckCircle2, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
              <FolderKanban className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">Projetos</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance mb-6">
            Gerencie seus projetos com simplicidade
          </h1>
          <p className="text-lg text-muted-foreground mb-8 text-pretty">
            Crie projetos, organize suas tarefas em checklists e acompanhe o progresso de forma visual e intuitiva.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Já tenho conta</Link>
            </Button>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 text-left">
            <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
                <FolderKanban className="w-5 h-5 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold">Projetos organizados</h3>
              <p className="text-sm text-muted-foreground">
                Crie projetos com nome e descrição para organizar suas tarefas.
              </p>
            </div>
            <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
                <CheckCircle2 className="w-5 h-5 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold">Checklists de tarefas</h3>
              <p className="text-sm text-muted-foreground">
                Adicione tarefas e marque o que já foi concluído.
              </p>
            </div>
            <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
                <ArrowRight className="w-5 h-5 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold">Progresso visual</h3>
              <p className="text-sm text-muted-foreground">
                Acompanhe o progresso de cada projeto de forma visual.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>Gerenciador de Projetos - Organize suas tarefas com eficiência</p>
      </footer>
    </div>
  )
}
