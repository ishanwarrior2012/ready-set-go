import { useState } from "react";
import { Header } from "./Header";
import { BottomNavigation } from "./BottomNavigation";
import { Sidebar } from "./Sidebar";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";

interface LayoutProps {
  children: React.ReactNode;
  showFab?: boolean;
}

export function Layout({ children, showFab = true }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} />
      
      <main className="flex-1 pb-20">
        {children}
      </main>
      
      {showFab && <FloatingActionButton />}
      <BottomNavigation />
    </div>
  );
}
