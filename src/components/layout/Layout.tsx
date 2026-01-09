import { useState } from "react";
import { Header } from "./Header";
import { BottomNavigation } from "./BottomNavigation";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} />
      
      <main className="flex-1 pb-20">
        {children}
      </main>
      
      <BottomNavigation />
    </div>
  );
}
