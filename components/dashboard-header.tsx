"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ChangePasswordDialog } from "@/components/change-password-dialog"
import {
  KeyRound, LogOut, User, Moon, Sun,
  Wallet, ShieldCheck, CheckSquare,
  LayoutDashboard, NotebookPen, Target,
  FolderKanban, Menu,
} from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const NAV_ITEMS = [
  { href: "/dashboard",            label: "Início",    icon: LayoutDashboard, exact: true  },
  { href: "/dashboard/projetos",   label: "Projetos",  icon: FolderKanban,    exact: false },
  { href: "/dashboard/financas",   label: "Finanças",  icon: Wallet,          exact: false },
  { href: "/dashboard/habitos",    label: "Hábitos",   icon: CheckSquare,     exact: false },
  { href: "/dashboard/notas",      label: "Notas",     icon: NotebookPen,     exact: false },
  { href: "/dashboard/objetivos",  label: "Objetivos", icon: Target,          exact: false },
  { href: "/dashboard/senhas",     label: "Senhas",    icon: ShieldCheck,     exact: false },
]

interface DashboardHeaderProps {
  user: SupabaseUser
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const Logo = () => (
    <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
      <Image src="/icon.svg" alt="Prumo" width={34} height={34} className="rounded-lg" />
      <span className="font-semibold text-lg">Prumo</span>
    </Link>
  )

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
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

        {/* Right side */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
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

          {/* User menu — desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hidden md:flex">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setChangePasswordOpen(true)} className="cursor-pointer">
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

          {/* Hamburger — mobile only */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                {/* Sheet header */}
                <div className="flex items-center gap-2 px-5 h-16 border-b shrink-0">
                  <Image src="/icon.svg" alt="Prumo" width={30} height={30} className="rounded-lg" />
                  <span className="font-semibold">Prumo</span>
                </div>

                {/* Nav links */}
                <nav className="flex-1 overflow-y-auto py-3 px-3">
                  {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
                    const active = exact ? pathname === href : pathname.startsWith(href)
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                          active
                            ? "bg-secondary text-secondary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {label}
                      </Link>
                    )
                  })}
                </nav>

                {/* User section */}
                <div className="border-t px-3 py-3 shrink-0 space-y-1">
                  <div className="px-3 py-1.5">
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setMobileOpen(false); setChangePasswordOpen(true) }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <KeyRound className="w-4 h-4 shrink-0" />
                    Alterar senha
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Sair
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </header>
  )
}
