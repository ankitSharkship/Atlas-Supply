import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decodeToken } from "react-jwt";
import { commonMenu, servicesMenu, mastersMenu } from "@/utils/definedIDs";
import { ApiService } from "@/lib/api-service";

interface AuthUser {
  email: string;
  token: string;
  name: string;
  role?: string;
  department?: string;
  locations?: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = "auth_user";

function getNameFromEmail(email: string): string {
  const prefix = email.split("@")[0];
  return prefix
    .split(/[\._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

let cachedPageCategories: any = null;

const buildPageCategories = () => {
  if (cachedPageCategories !== null) {
    return cachedPageCategories;
  }

  const pageCategories: any = {};

  Object.values(commonMenu).forEach((item: any) => {
    if (item.id) {
      pageCategories[item.id] = [item.id];
    }
  });

  Object.values(servicesMenu).forEach((dashboard: any) => {
    if (dashboard.id) {
      const childPageIds: string[] = [];

      if (dashboard.children) {
        Object.values(dashboard.children).forEach((page: any) => {
          if (page.id) {
            childPageIds.push(page.id);
          }
        });
      }

      pageCategories[dashboard.id] =
        childPageIds.length > 0 ? childPageIds : [dashboard.id];
    }
  });

  Object.values(mastersMenu).forEach((dashboard: any) => {
    if (dashboard.id) {
      const childPageIds: string[] = [];

      if (dashboard.children) {
        Object.values(dashboard.children).forEach((page: any) => {
          if (page.id) {
            childPageIds.push(page.id);
          }
        });
      }

      pageCategories[dashboard.id] =
        childPageIds.length > 0 ? childPageIds : [dashboard.id];
    }
  });

  cachedPageCategories = pageCategories;
  return pageCategories;
};

const transformPages = (pagesArray: string[], pageCategories: any) => {
  if (!pagesArray || !Array.isArray(pagesArray)) {
    return {};
  }

  const transformedPages: any = {};

  Object.keys(pageCategories).forEach((category) => {
    const categoryPages = pageCategories[category];
    const userHasAccess = categoryPages.some((page: string) =>
      pagesArray.includes(page)
    );

    if (userHasAccess) {
      transformedPages[category] = categoryPages.filter((page: string) =>
        pagesArray.includes(page)
      );
    }
  });

  return transformedPages;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (error) {
        console.log("Failed to load user from storage");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const data: any = await ApiService.post("/api/login", {
        username: normalizedEmail,
        password: password,
      });

      if (!data.token) {
        throw new Error("No token received from server.");
      }

      const decoded: any = decodeToken(data.token);

      if (!decoded) {
        throw new Error("Failed to decode token");
      }

      const pageCategories = buildPageCategories();
      const transformedPages = transformPages(decoded.pages, pageCategories);

      const authUser: AuthUser = {
        email: normalizedEmail,
        token: data.token,
        name: getNameFromEmail(normalizedEmail),
        role: decoded.role,
        department: decoded.department,
        locations: decoded.locations || [],
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);

      console.log("User logged in:", authUser);
      console.log("Accessible pages:", transformedPages);
    } catch (error: any) {
      throw new Error(error.message || "Login failed. Please check connection.");
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}