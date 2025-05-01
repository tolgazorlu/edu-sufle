"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WalletInformation } from "@/components/wallet-information";
import { useState } from "react";

function SettingsContent() {

  const [connectedAddress, setConnectedAddress] = useState<string>("");
  const [accountBalance, setAccountBalance] = useState<string>("0");

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
            <SiteHeader title="Settings" handleConnect={handleConnect} handleDisconnect={handleDisconnect} handleBalanceUpdate={handleBalanceUpdate} />
            <main className="flex-1 overflow-y-auto p-4">
             
                  <WalletInformation />
            
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}
