import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import PathFeed from "@/components/path-feed"

export default function FlowPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Flow" />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <PathFeed />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 