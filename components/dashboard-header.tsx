"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChangePasswordDialog } from "@/components/change-password-dialog"
import { FolderKanban, KeyRound, LogOut, User, Moon, Sun, Wallet, ShieldCheck } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Projetos", icon: FolderKanban },
  { href: "/dashboard/financas", label: "Finanças", icon: Wallet },
  { href: "/dashboard/senhas", label: "Senhas", icon: ShieldCheck },
]

interface DashboardHeaderProps {
  user: SupabaseUser
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
              <FolderKanban className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg hidden sm:block">Pessoal</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Alternar tema</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setChangePasswordOpen(true)}
                className="cursor-pointer"
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Alterar senha
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </header>
  )
}
