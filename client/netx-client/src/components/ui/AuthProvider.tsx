"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  checkAuth: async () => {}
});

export const useAuth = () => useContext(AuthContext);

// API базовый URL
const API_BASE_URL = "http://localhost:3001/api/v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);

  // Проверка авторизации при загрузке страницы
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      
      // Добавляем таймаут для запроса
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 секунды таймаут
      
      try {
        // Исправленный URL, соответствующий серверным маршрутам
        const response = await fetch(`${API_BASE_URL}/auth/validate`, {
          method: "POST",
          credentials: "include",
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        setApiAvailable(true);

        // Если токен валидный, получаем данные пользователя
        if (response.ok) {
          // Предполагая, что есть отдельный эндпоинт для данных пользователя
          // Либо используйте тот же ответ validate, если он содержит данные пользователя
          const userData = await response.json();
          setUser(userData.content?.user || null);
        } else {
          setUser(null);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error("API сервер недоступен:", fetchError);
        setApiAvailable(false);
        setUser(null);

        // Выводим сообщение только один раз при загрузке страницы
        const isFirstRender = sessionStorage.getItem('auth_initialized') !== 'true';
        if (!isFirstRender) {
          toast.error("Ошибка подключения к серверу", {
            description: "Проверьте, что сервер запущен на порту 3001"
          });
        }
        sessionStorage.setItem('auth_initialized', 'true');
      }
    } catch (error) {
      console.error("Ошибка проверки авторизации:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Проверяем состояние авторизации с небольшой задержкой
  useEffect(() => {
    const timer = setTimeout(() => {
      checkAuth();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Функция авторизации
  const login = async (username: string, password: string) => {
    try {
      if (!apiAvailable) {
        toast.error("Сервер недоступен", { 
          description: "Проверьте подключение к серверу" 
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Ошибка авторизации");
      }

      const data = await response.json();
      setUser(data.content?.user || null);
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setApiAvailable(false);
        toast.error("Сервер недоступен", {
          description: "Не удалось подключиться к API серверу"
        });
      }
      throw error;
    }
  };

  // Функция регистрации
  const register = async (username: string, password: string) => {
    try {
      if (!apiAvailable) {
        toast.error("Сервер недоступен", { 
          description: "Проверьте подключение к серверу" 
        });
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Ошибка регистрации");
      }

      const data = await response.json();
      setUser(data.content?.user || null);
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setApiAvailable(false);
        toast.error("Сервер недоступен", {
          description: "Не удалось подключиться к API серверу"
        });
      }
      throw error;
    }
  };

  // Функция выхода из системы
  const logout = async () => {
    try {
      if (apiAvailable) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          credentials: "include"
        });
      }
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    } finally {
      setUser(null);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.isAdmin || false;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isAdmin,
      isLoading,
      login,
      register,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}