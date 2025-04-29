"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/mode-toggle"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { name: "Transaction Flow", href: "/" },
    { name: "Wallet Analysis", href: "/wallet-analysis" },
    { name: "Transaction Clustering", href: "/transaction-clustering" },
    { name: "Entity Labeling", href: "/entity-labeling" },
  ]

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <div className="mr-6 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Soltrail</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === item.href ? "text-foreground font-semibold" : "text-foreground/60",
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation Toggle */}
        <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={toggleMenu}>
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle menu</span>
        </Button>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <ModeToggle />
            <div className="h-6 w-px bg-border md:hidden"></div>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="flex flex-col space-y-4 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-2 py-1 rounded-md transition-colors hover:bg-muted",
                  pathname === item.href ? "bg-muted font-semibold" : "",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
