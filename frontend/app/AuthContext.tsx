"use client";

import React, {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
} from "react";

export type AuthUser = {
  id: string;
  email: string;        
  isMechanic: boolean;
  fullName?: string | null;
  phone?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;                                
  setUser: Dispatch<SetStateAction<AuthUser | null>>;   
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const value: AuthContextValue = {
    user,
    setUser,
    loading,
    setLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return ctx;
}
