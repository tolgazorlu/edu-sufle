"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WalletInformation } from "@/components/wallet-information";
import { GoogleApiSettings } from "@/components/google-api-settings";
import { GoogleAiExample } from "@/components/google-ai-example";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
            <main className="flex-1 overflow-y-auto p-4 space-y-6">
              <Tabs defaultValue="wallet" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="wallet">Wallet</TabsTrigger>
                  <TabsTrigger value="google">Google API</TabsTrigger>
                </TabsList>
                <TabsContent value="wallet">
                  <WalletInformation />
                </TabsContent>
                <TabsContent value="google" className="space-y-6">
                  <GoogleApiSettings />
                  <GoogleAiExample />
                </TabsContent>
              </Tabs>
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}
