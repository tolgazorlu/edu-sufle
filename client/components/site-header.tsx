import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { MetaMaskConnect } from "./MetaMaskConnect"

export function SiteHeader({ title, handleConnect, handleDisconnect, handleBalanceUpdate }: { title: string, handleConnect: (address: string) => void, handleDisconnect: () => void, handleBalanceUpdate: (balance: string) => void }) {
  
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 justify-between">
        <div className="flex items-center gap-1">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-semibold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">{title}</h1>
        </div>
        <MetaMaskConnect
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onBalanceUpdate={handleBalanceUpdate}
        />

       
      </div>
    </header>
  )
}
