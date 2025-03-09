"use client"

import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ModeToggle } from "@/components/mode-toggle"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Trophy, BookOpen, Brain, ShoppingCart, LucideLogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { signOut } from "next-auth/react"

export function Header() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const xpNeeded = 500 // XP needed for next level

  const handleSignOut = async () => {
    try {
      // Use the built-in signOut function from next-auth
      await signOut({ 
        redirect: true,
        callbackUrl: '/signin' // Redirect to signin page after signout
      });
    } catch (error) {
      console.error("Error during sign out:", error);
      // Fallback if the signout fails - redirect manually
      window.location.href = '/signin';
    }
  };

  // Use a conditional approach to avoid errors when user is null
  if (!user) {
    return (
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="font-bold">StudyQuest</div>
          <div>Loading...</div>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="ml-2 text-xl font-bold">StudyQuest</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/tasks" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Tasks
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/ai-assistant" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Brain className="mr-2 h-4 w-4" />
                    AI Assistant
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/quizzes" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Quizzes
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/rewards" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Rewards
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* User Menu & Theme Toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center space-x-2">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-bold">
                  {user.level}
                </Badge>
                <span>{user.xp} XP</span>
              </div>
              <Progress value={(user.xp / xpNeeded) * 100} className="w-32 h-2" />
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span className="font-bold">{user.points}</span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user.name}</span>
                  <span className="text-xs text-muted-foreground">Level {user.level}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => handleSignOut()}>
                <LucideLogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ModeToggle />

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" className="md:hidden" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="flex flex-col p-4 space-y-4">
            <Link
              href="/tasks"
              className="flex items-center p-2 rounded-md hover:bg-secondary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Tasks
            </Link>
            <Link
              href="/ai-assistant"
              className="flex items-center p-2 rounded-md hover:bg-secondary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Brain className="mr-2 h-5 w-5" />
              AI Assistant
            </Link>
            <Link
              href="/quizzes"
              className="flex items-center p-2 rounded-md hover:bg-secondary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Quizzes
            </Link>
            <Link
              href="/rewards"
              className="flex items-center p-2 rounded-md hover:bg-secondary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Rewards
            </Link>
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-bold">
                  Lvl {user.level}
                </Badge>
                <span>{user.xp} XP</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span className="font-bold">{user.points}</span>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

