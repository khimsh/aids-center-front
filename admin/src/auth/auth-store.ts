import { createContext } from 'react';

export type AuthUser = {
  id?: string | number;
  email?: string;
  full_name?: string;
  role?: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
