"use client";

import { Toaster } from "@/components/ui/sonner"; // Используем установленный компонент
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/ui/AuthProvider"; // Путь может отличаться в вашем проекте

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  );
}