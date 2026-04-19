import { createContext, useContext, useState, ReactNode } from 'react';
import { Employee } from '../types/crm.types';

interface AuthContextType {
  user: Employee | null;
  role: string | null;
  loginContext: (userData: Employee) => void;
  logoutContext: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Employee | null>(() => {
    try {
      const storedUser = localStorage.getItem('hospital_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const loginContext = (userData: Employee) => {
    setUser(userData);
    localStorage.setItem('hospital_user', JSON.stringify(userData));
  };

  const logoutContext = () => {
    setUser(null);
    localStorage.removeItem('hospital_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role_Id || null,
        loginContext,
        logoutContext,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
