"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { WalletInformation } from "@/components/wallet-information";

function SettingsContent() {

  return (
    <SidebarProvider>
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader title="Settings" />
            <main className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="space-y-8">
                
                {/* Wallet Information Component */}
                <div className="mb-6">
                  <WalletInformation />
                </div>
                
              </div>
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}
