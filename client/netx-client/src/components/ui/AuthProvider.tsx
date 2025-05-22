"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  username:string;
  isAdmin?: boolean;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<any>;
  register: (username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>; // checkAuth остаётся в контексте, если нужен для вызова извне
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

const API_BASE_URL = "http://localhost:3001/api/v1";
const USER_STORAGE_KEY = "currentUser";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userState, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);

  // setUser теперь стабилен благодаря пустому массиву зависимостей useCallback
  // и тому, что setUserState от useState также стабилен.
  const setUser = useCallback((userData: User | null) => {
    if (userData) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    setUserState(userData);
  }, []);

  // checkAuth теперь зависит только от setUser, который стабилен.
  // Это делает checkAuth также стабильной функцией.
  const checkAuth = useCallback(async () => {
    console.log("Checking auth...");
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: "POST",
        credentials: "include",
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      setApiAvailable(true);
      console.log("Auth check status:", response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log("Auth check response data:", responseData);
        if (responseData.content?.user) {
          const validatedUser = {
            ...responseData.content.user,
            isAdmin: responseData.content.user.role === 'admin' || responseData.content.user.isAdmin
          };
          setUser(validatedUser);
        } else if (responseData.content?.isValid === true) {
          // Токен валиден, но сервер не вернул данные пользователя.
          // Если пользователь был загружен из localStorage при инициализации, он останется.
          // Если localStorage был пуст, userState останется null.
          console.log("Token valid, no user data in server response. Current user state preserved if already set from initial load.");
        } else {
          // Ответ ОК, но нет ни пользователя, ни флага isValid=true. Считаем, что пользователя нужно очистить.
          console.warn("Token validation response OK, but no user data or isValid flag. Clearing user.");
          setUser(null);
        }
      } else {
        // Валидация токена провалена (например, 401)
        console.log("Token validation failed, status:", response.status, ". Clearing user.");
        setUser(null);
      }
    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        console.error("Auth check timed out.");
      } else {
        console.error("API server unavailable or fetch error during checkAuth:", fetchError);
      }
      setApiAvailable(false);
      // Если API недоступен, не очищаем пользователя, который мог быть загружен из localStorage.
      console.log("API unavailable during checkAuth. Preserving current user state if any.");
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  // Этот useEffect запускается один раз при монтировании
  useEffect(() => {
    console.log("AuthProvider mounted. Initializing auth state from localStorage.");
    let initialUserFromStorage: User | null = null;
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        initialUserFromStorage = {
          ...parsedUser,
          isAdmin: parsedUser.role === 'admin' || parsedUser.isAdmin
        };
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage on init:", e);
      localStorage.removeItem(USER_STORAGE_KEY); // Очищаем поврежденные данные
    }

    if (initialUserFromStorage) {
      // Устанавливаем состояние напрямую, это часть инициализации
      setUserState(initialUserFromStorage);
      console.log("Restored user from localStorage into state:", initialUserFromStorage);
    }
    
    // Всегда вызываем checkAuth для валидации с сервером.
    // checkAuth обновит userState (и localStorage через setUser) на основе ответа сервера.
    checkAuth();

  }, [checkAuth]); // checkAuth теперь стабильна, поэтому этот useEffect выполнится один раз как ожидается.

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      if (!apiAvailable) {
        toast.error("Сервер недоступен", { description: "Проверьте подключение к серверу" });
        throw new Error("Server unavailable");
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Ошибка авторизации: не удалось получить детали" }}));
        throw new Error(errorData.error?.message || "Ошибка авторизации");
      }

      const data = await response.json();
      console.log("Login response:", data);
      
      if (data.content?.user) {
        const loggedInUser = {
            ...data.content.user,
            isAdmin: data.content.user.role === 'admin' || data.content.user.isAdmin
        };
        setUser(loggedInUser);
        console.log("User state updated after login:", loggedInUser);
        return data;
      } else {
        console.error("Неверный формат ответа от сервера при логине:", data);
        setUser(null);
        throw new Error("Не удалось получить данные пользователя из ответа сервера");
      }
    } catch (error: any) {
      setUser(null);
      if (error.message.includes('Failed to fetch') || error.message.includes("Server unavailable")) {
        setApiAvailable(false);
        toast.error("Сервер недоступен", { description: "Не удалось подключиться к API серверу" });
      }
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Ошибка регистрации: не удалось получить детали" }}));
        throw new Error(errorData.error?.message || "Ошибка регистрации");
      }

      const data = await response.json();
      if (data.content?.user) {
         const registeredUser = {
            ...data.content.user,
            isAdmin: data.content.user.role === 'admin' || data.content.user.isAdmin
        };
        setUser(registeredUser);
        return data;
      } else {
        setUser(null);
        console.warn("User data not returned after successful registration.");
        return data; // Можно вернуть данные, даже если пользователя нет, для информации
      }
    } catch (error: any) {
      setUser(null);
      if (error.message.includes('Failed to fetch')) {
        setApiAvailable(false);
        toast.error("Сервер недоступен", { description: "Не удалось подключиться к API серверу" });
      }
      console.error("Register error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log("Logging out...");
    setIsLoading(true);
    try {
      if (apiAvailable) { // Пытаемся вызвать API выхода, только если сервер доступен
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          credentials: "include"
        });
        console.log("Logout API call successful or skipped if API unavailable.");
      }
    } catch (error) {
      console.error("Ошибка при вызове API выхода (игнорируется для локального разлогинивания):", error);
    } finally {
      setUser(null); // Всегда очищаем локальное состояние и localStorage
      setIsLoading(false);
      console.log("User logged out, state and localStorage cleared.");
    }
  };

  const isAuthenticated = !!userState;
  const isAdmin = userState?.isAdmin === true || userState?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user: userState,
      isAuthenticated,
      isAdmin,
      isLoading,
      login,
      register,
      logout,
      checkAuth // checkAuth можно вызывать из других частей приложения при необходимости
    }}>
      {children}
    </AuthContext.Provider>
  );
}