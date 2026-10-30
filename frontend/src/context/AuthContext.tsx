import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, removeToken, setToken } from '../lib/api-client';
import { AuthResponse, UserSummary } from '../types';

interface AuthContextType {
  user: UserSummary | null;
  token: string | null;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string, role?: string) => Promise<AuthResponse>;
  register: (data: any) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getCachedUser = (): UserSummary | null => {
  try {
    const stored = localStorage.getItem('smart_patient_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(getCachedUser);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(!getToken() ? false : !getCachedUser());

  const fetchProfile = async () => {
    const existingToken = getToken();
    if (!existingToken) {
      setUser(null);
      localStorage.removeItem('smart_patient_user');
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.get<UserSummary>('/auth/me');
      localStorage.setItem('smart_patient_user', JSON.stringify(data));
      setUser(data);
    } catch (err) {
      removeToken();
      localStorage.removeItem('smart_patient_user');
      setTokenState(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (usernameOrEmail: string, password: string, role?: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', { usernameOrEmail, password, role });
    setToken(res.token);
    setTokenState(res.token);
    const userSummary: UserSummary = {
      userId: res.userId,
      username: res.username,
      email: res.email,
      role: res.role,
      accountStatus: 'ACTIVE',
      fullName: res.fullName,
      patientCode: res.patientCode,
      entityId: res.entityId,
    };
    localStorage.setItem('smart_patient_user', JSON.stringify(userSummary));
    setUser(userSummary);
    return res;
  };

  const register = async (data: any): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    setToken(res.token);
    setTokenState(res.token);
    const userSummary: UserSummary = {
      userId: res.userId,
      username: res.username,
      email: res.email,
      role: res.role,
      accountStatus: 'ACTIVE',
      fullName: res.fullName,
      patientCode: res.patientCode,
      entityId: res.entityId,
    };
    localStorage.setItem('smart_patient_user', JSON.stringify(userSummary));
    setUser(userSummary);
    return res;
  };

  const logout = () => {
    try {
      api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    removeToken();
    localStorage.removeItem('smart_patient_user');
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loading: isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
