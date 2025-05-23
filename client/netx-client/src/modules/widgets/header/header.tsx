"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/modules/widgets/auth";
import { CreatePostDialog } from "@/modules/widgets/posts";
import { useAuth } from "@/components/ui/AuthProvider"; 
import { User, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export function Header() {
  const { isAuthenticated, isAdmin, user, logout, checkAuth } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  // Ensure component is mounted (client-side) before rendering auth-dependent UI
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Check auth when component mounts and periodically check for changes
  useEffect(() => {
    console.log("Header mounted, checking auth...");
    checkAuth();

    // Изменяем интервал на 7 минут (7 * 60 * 1000 миллисекунд)
    const intervalInMilliseconds = 7 * 60 * 1000;
    const intervalId = setInterval(() => {
      checkAuth();
    }, intervalInMilliseconds);
    
    return () => clearInterval(intervalId);
  }, []);

  // Log when auth state changes
  useEffect(() => {
    console.log("Auth state in Header:", { isAuthenticated, user });
  }, [isAuthenticated, user]);
  
  const handleLogout = async () => {
    await logout();
    toast.success("Выход выполнен", {
      description: "Вы успешно вышли из системы"
    });
  };

  // Don't render auth-dependent UI until we're mounted on client
  if (!mounted) {
    return (
      <header className="w-full bg-background border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex flex-1 items-center justify-start">
            <Link href="/" className="flex items-center text-neutral-700">
              <svg className="fill-current" width="200" height="29" viewBox="0 0 219 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.0948 30.4029H12.2304V3.012H0.84933V0.676339H27.4758V3.012H16.0948V30.4029ZM35.1195 0.676339H38.9839V30.4029H35.1195V0.676339ZM53.7679 0.676339L67.3996 26.1987H67.5695L81.3287 0.676339H84.2589V30.4029H80.3944V6.32438H80.2245L66.8051 30.9125H66.0407L52.9186 6.15452H52.7487V30.4029H50.8802V0.676339H53.7679ZM94.4664 0.676339H113.661V3.012H98.3309V13.6711H111.495V15.6245H98.3309V28.0672H113.661V30.4029H94.4664V0.676339ZM120.013 30.4029V0.676339H123.877V28.0672H139.208V30.4029H120.013ZM147.258 0.676339H151.122V30.4029H147.258V0.676339ZM186.969 0.676339H188.923V30.9125H188.711L165.142 7.68331H164.972V30.4029H163.018V0.166742H163.231L186.8 23.3959H186.969V0.676339ZM199.098 0.676339H218.293V3.012H202.963V13.6711H216.127V15.6245H202.963V28.0672H218.293V30.4029H199.098V0.676339Z"/>
              </svg>
            </Link>
          </div>
          <div className="flex gap-3 items-center">
            {/* Loading state */}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-background border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex flex-1 items-center justify-start">
          <Link href="/" className="flex items-center text-neutral-700">
            <svg className="fill-current" width="200" height="29" viewBox="0 0 219 31" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.0948 30.4029H12.2304V3.012H0.84933V0.676339H27.4758V3.012H16.0948V30.4029ZM35.1195 0.676339H38.9839V30.4029H35.1195V0.676339ZM53.7679 0.676339L67.3996 26.1987H67.5695L81.3287 0.676339H84.2589V30.4029H80.3944V6.32438H80.2245L66.8051 30.9125H66.0407L52.9186 6.15452H52.7487V30.4029H50.8802V0.676339H53.7679ZM94.4664 0.676339H113.661V3.012H98.3309V13.6711H111.495V15.6245H98.3309V28.0672H113.661V30.4029H94.4664V0.676339ZM120.013 30.4029V0.676339H123.877V28.0672H139.208V30.4029H120.013ZM147.258 0.676339H151.122V30.4029H147.258V0.676339ZM186.969 0.676339H188.923V30.9125H188.711L165.142 7.68331H164.972V30.4029H163.018V0.166742H163.231L186.8 23.3959H186.969V0.676339ZM199.098 0.676339H218.293V3.012H202.963V13.6711H216.127V15.6245H202.963V28.0672H218.293V30.4029H199.098V0.676339Z"/>
            </svg>
          </Link>
        </div>  
        <div className="flex gap-3 items-center">
          {/* Показываем кнопку создания поста только админам */}
          {isAdmin && <CreatePostDialog />}
          
          {isAuthenticated ? (
            <>
              {/* Блок с информацией о пользователе */}
              <div className="flex items-center gap-3 border rounded-lg px-4 py-2 bg-background shadow-sm">
                <div className="flex items-center">
                  <div className="bg-primary h-8 w-8 rounded-full flex items-center justify-center text-primary-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{user?.username || "Пользователь"}</p>
                    <p className="text-xs text-muted-foreground">
                      {isAdmin ? "Администратор" : "Пользователь"}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Кнопка выхода с иконкой */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="rounded-full h-8 w-8"
                title="Выйти"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <AuthDialog triggerButtonProps={{ variant: "outline", size: "default" }} />
          )}
        </div>
      </div>
    </header>
  );
}