"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { jwtDecode } from "jwt-decode"
import { useOCAuth } from "@opencampus/ocid-connect-js"
import {
  ArrowLeftRightIcon,
  BrainCircuit,
  CameraIcon,
  FileCodeIcon,
  FileTextIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  MapIcon,
  SettingsIcon,
  Telescope,
  UserRoundPenIcon,
} from "lucide-react"
import Link from "next/link"

import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { usePathname } from "next/navigation"

// Default data structure
const defaultData = {
  user: {
    name: "Guest",
    email: "guest@example.com",
    avatar: "/avatars/default.jpg",
    opencampus: {
      id: "--",
      role: "Guest",
      department: "--",
      joinDate: "--",
      status: "Inactive"
    }
  },
  navMain: [
    {
      title: "App",
      url: "/app",
      icon: LayoutDashboardIcon,
    },
    // {
    //   title: "Paths",
    //   url: "/app/paths",
    //   icon: MapIcon,
    // },
    {
      title: "Mindmap",
      url: "/app/mindmap",
      icon: BrainCircuit,
    },
    {
      title: "Profile",
      url: "/app/profile",
      icon: UserRoundPenIcon,
    },
    {
      title: "Transactions",
      url: "/app/transactions",
      icon: ArrowLeftRightIcon,
    },
    {
      title: "Discover (soon)",
      url: "/app/discover",
      icon: Telescope,
      disabled: true,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: CameraIcon,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: FileTextIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: FileCodeIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/app/settings",
      icon: SettingsIcon,
    },
    {
      title: "Get Help",
      url: "#",
      icon: HelpCircleIcon,
    },
  ],
}

interface DecodedToken {
  sub: string;
  edu_username: string;
  email: string;
  name: string;
  [key: string]: any;
}

// This component has been removed to avoid duplication

// Custom NavMain component for the sidebar with active link highlighting
export function NavMain({
  items
}: {
  items: {
    title: string
    url: string
    icon?: React.ElementType
    disabled?: boolean
  }[]
}) {
  const pathname = usePathname();
  
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url;
            const Icon = item.icon;
            
            return (
              <SidebarMenuItem key={item.title}>
                {item.disabled ? (
                  <SidebarMenuButton 
                    tooltip={item.title} 
                    disabled 
                    className="opacity-50 cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                ) : (
                  <Link href={item.url} passHref>
                    <SidebarMenuButton 
                      tooltip={item.title}
                      className={isActive ? "bg-primary/10 font-medium" : ""}
                    >
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />}
                        <span>{item.title}</span>
                      </div>
                    </SidebarMenuButton>
                  </Link>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { authState } = useOCAuth();
  const [userData, setUserData] = useState(defaultData.user);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    if (authState && authState.idToken) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(authState.idToken);
        
        // Extract user data from token
        setUserData({
          name: decodedToken.name || decodedToken.edu_username || "User",
          email: decodedToken.email,
          avatar: "/avatars/shadcn.jpg", // Default avatar
          opencampus: {
            id: decodedToken.sub || "--",
            role: decodedToken.role || "Student",
            department: decodedToken.department || "OpenCampus",
            joinDate: new Date().toISOString().split('T')[0],
            status: "Active"
          }
        });
        
        // Store user data in localStorage for persistence
        localStorage.setItem('userData', JSON.stringify({
          name: decodedToken.name || decodedToken.edu_username || "User",
          email: decodedToken.email,
          opencampus: {
            id: decodedToken.sub || "--",
            role: decodedToken.role || "Student",
            department: decodedToken.department || "OpenCampus",
            joinDate: new Date().toISOString().split('T')[0],
            status: "Active"
          }
        }));
      } catch (error) {
        console.error("Error decoding token:", error);
        
        // Try to get user data from localStorage if token decoding fails
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          try {
            const parsedData = JSON.parse(storedUserData);
            setUserData({
              ...userData,
              ...parsedData
            });
          } catch (e) {
            console.error("Error parsing stored user data:", e);
          }
        }
      }
    } else {
      // Try to get user data from localStorage if no token is available
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        try {
          const parsedData = JSON.parse(storedUserData);
          setUserData({
            ...userData,
            ...parsedData
          });
        } catch (e) {
          console.error("Error parsing stored user data:", e);
        }
      }
    }
  }, [authState, authState?.idToken]);
  
  useEffect(() => {
    if (authState?.idToken) {
      const storedUserData = localStorage.getItem("userData");
      if (storedUserData) {
        try {
          const parsedData = JSON.parse(storedUserData);
          setUserData(prevData => ({
            ...prevData,
            ...parsedData
          }));
        } catch (e) {
          console.error("Error parsing stored user data:", e);
        }
      }
    }
  }, [authState, authState?.idToken]);
  
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <Image src="/sufle.png" alt="Sufle" width={24} height={24} />
                <span className="text-base font-semibold">Sufle</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={defaultData.navMain} />
        <NavSecondary items={defaultData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {mounted && <NavUser user={userData} />}
      </SidebarFooter>
    </Sidebar>
  )
}
