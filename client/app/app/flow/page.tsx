import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import PathFeed from "@/components/path-feed"

export default function FlowPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <h1 className="text-2xl font-semibold mb-4">Flow</h1>
          <p className="text-muted-foreground mb-6">Discover learning paths shared by the community.</p>
          <PathFeed />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 