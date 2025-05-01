"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import PathFeed from "@/components/path-feed"
import { useState } from "react"

export default function FlowPage() {
  const [connectedAddress, setConnectedAddress] = useState("")
  const [accountBalance, setAccountBalance] = useState("0");

  const handleConnect = (address: string) => {
    setConnectedAddress(address);
  };

  const handleDisconnect = () => {
    setConnectedAddress("");
  };

  const handleBalanceUpdate = (balance: string) => {
    setAccountBalance(balance);
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Flow" handleConnect={handleConnect} handleDisconnect={handleDisconnect} handleBalanceUpdate={handleBalanceUpdate} />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <PathFeed />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 