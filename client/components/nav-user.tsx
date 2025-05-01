"use client"

import { useRouter } from "next/navigation"
import {
  BellIcon,
  CreditCardIcon,
  LogOutIcon,
  MoreVerticalIcon,
  UserCircleIcon,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
    opencampus?: {
      id: string
      role: string
      department: string
      joinDate: string
      status: string
    }
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  
  const handleLogout = () => {
    // Clear localStorage
    localStorage.clear()
    // Redirect to login page or home page
    router.push("/")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
                {user.opencampus && (
                  <span className="truncate text-xs text-muted-foreground">
                    {user.opencampus.role}
                  </span>
                )}
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                  {user.opencampus && (
                    <span className="truncate text-xs text-muted-foreground mt-1">
                      {user.opencampus.role} • {user.opencampus.department}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            {/* <DropdownMenuGroup>
              {user.opencampus && (
                <DropdownMenuItem>
                  <div className="flex flex-col w-full">
                    <div className="flex items-center justify-between w-full">
                      <span>OpenCampus ID</span>
                      <span className="text-xs font-medium">{user.opencampus.id}</span>
                    </div>
                    <div className="flex items-center justify-between w-full mt-1">
                      <span>Status</span>
                      <span className="text-xs font-medium">{user.opencampus.status}</span>
                    </div>
                    <div className="flex items-center justify-between w-full mt-1">
                      <span>Join Date</span>
                      <span className="text-xs font-medium">{user.opencampus.joinDate}</span>
                    </div>
                  </div>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
