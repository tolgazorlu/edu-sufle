'use client'

import { SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SiteHeader } from '@/components/site-header';
import Todo from '@/components/Todo';
import React from 'react';

export default function TodoPage() {
  const handleConnect = (address: string) => {
    // Handle wallet connection
  };

  const handleDisconnect = () => {
    // Handle wallet disconnection
  };

  const handleBalanceUpdate = (balance: string) => {
    // Handle balance update
  };

  return (
    <div>
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader 
            title="Learning Path Todo" 
            handleConnect={handleConnect} 
            handleDisconnect={handleDisconnect} 
            handleBalanceUpdate={handleBalanceUpdate} 
          />
          <div className="flex flex-col h-full bg-gray-50">
            <Todo />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
} 