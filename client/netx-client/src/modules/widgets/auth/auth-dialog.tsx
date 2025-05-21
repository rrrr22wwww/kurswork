"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { Button } from "@/components/ui/button";
import { ComponentProps } from "react";
import { useAuth } from "@/components/ui/AuthProvider"; 

type ButtonProps = ComponentProps<typeof Button>;

interface AuthDialogProps {
  triggerButtonProps?: ButtonProps;
  triggerButtonLabel?: string;
}

export function AuthDialog({ 
  triggerButtonProps = { variant: "outline" },
  triggerButtonLabel = "Войти"
}: AuthDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { checkAuth } = useAuth();

  // При успешной авторизации закрываем модальное окно
  const handleAuthSuccess = async () => {
    await checkAuth(); // Обновляем информацию о пользователе в контексте
    setOpen(false);
  };

  // При переключении между формами
  const switchTab = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-none" {...triggerButtonProps}>
          {triggerButtonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-7 pt-8">
        <DialogTitle className="sr-only">
          Авторизация и регистрация
        </DialogTitle>
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full shadow-none grid-cols-2">
            <TabsTrigger value="login" className="data-[state=active]:shadow-none">
              Вход
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:shadow-none">
              Регистрация
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Добро пожаловать
                </h2>
                <p className="text-sm text-muted-foreground">
                  Введите свои данные для входа в аккаунт
                </p>
              </div>
              <LoginForm onSuccess={handleAuthSuccess} />
            </div>
          </TabsContent>
          
          <TabsContent value="register">
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Создать аккаунт
                </h2>
                <p className="text-sm text-muted-foreground">
                  Заполните форму для создания нового аккаунта
                </p>
              </div>
              <RegisterForm onSuccess={handleAuthSuccess} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}