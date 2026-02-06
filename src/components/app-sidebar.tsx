import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
  ChevronsUpDown,
  Key,
  LogOut,
  Mic,
  Music,
  Shield,
  Sparkles,
  User,
} from 'lucide-react'
import { signOut } from '@/lib/auth-client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Navigation items
const mainNavItems = [
  {
    title: 'Create Music',
    url: '/music',
    icon: Sparkles,
  },
  {
    title: 'Voice Studio',
    url: '/voice',
    icon: Mic,
  },
]

const settingsNavItems = [
  {
    title: 'API Keys',
    url: '/settings',
    icon: Key,
  },
  {
    title: 'Account',
    url: '/profile',
    icon: User,
  },
]

interface AppSidebarProps {
  user: {
    id: string
    email: string
    name: string | null
    image?: string | null
    role?: string
  }
}

export function AppSidebar({ user }: AppSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = user.role === 'admin'
  const userName = user.name || 'User'
  const userInitials = userName.charAt(0).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/' })
  }

  return (
    <Sidebar className="border-r-0">
      {/* Premium Header */}
      <SidebarHeader className="p-4">
        <Link to="/music" className="flex items-center gap-3 group">
          <div className="relative p-2.5 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
            <Music className="h-5 w-5 text-primary" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/5 to-white/10" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold tracking-tight text-[15px]">
              AI Studio
            </span>
            <span className="text-[11px] text-muted-foreground">
              Music Generation
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/70 px-2 mb-1">
            Studio
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="h-10 rounded-xl"
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/70 px-2 mb-1">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="h-10 rounded-xl"
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/70 px-2 mb-1">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === '/admin'}
                    className="h-10 rounded-xl"
                  >
                    <Link to="/admin">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">Admin Panel</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Premium User Menu */}
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="rounded-xl data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-14"
                >
                  <Avatar className="h-9 w-9 rounded-xl">
                    <AvatarImage src={user.image || undefined} alt={userName} />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-medium text-[13px]">
                      {userName}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl"
                side="top"
                align="start"
                sideOffset={8}
              >
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="p-1">
                  <DropdownMenuItem asChild className="rounded-lg">
                    <Link to="/profile" className="cursor-pointer">
                      <User className="h-4 w-4" />
                      Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg">
                    <Link to="/settings" className="cursor-pointer">
                      <Key className="h-4 w-4" />
                      API Keys
                    </Link>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <div className="p-1">
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer rounded-lg text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
