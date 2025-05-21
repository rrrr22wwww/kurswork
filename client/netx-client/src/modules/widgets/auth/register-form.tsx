"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/components/ui/AuthProvider";

interface RegisterFormProps {
  onSuccess?: (redirectTo?: string) => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== passwordConfirm) {
      setError("Пароли не совпадают");
      toast.error("Ошибка регистрации", {
        description: "Пароли не совпадают",
      });
      setIsLoading(false);
      return;
    }

    try {
      await register(username, password);
      
      toast.success("Регистрация успешна", {
        description: "Вы зарегистрировались и вошли в систему",
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Ошибка регистрации:", error);
      setError(error.message || "Не удалось зарегистрироваться");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 py-2 no-initial-shadows">
      <div className="space-y-2">
        <Label htmlFor="username">Имя пользователя</Label>
        <Input
          id="username"
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Пароль</Label>
        <Input
          id="register-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password-confirm">Подтвердите пароль</Label>
        <Input
          id="password-confirm"
          type="password"
          placeholder="••••••••"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Создание аккаунта..." : "Зарегистрироваться"}
      </Button>
    </form>
  );
}