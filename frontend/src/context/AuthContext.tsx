import React, { createContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';

// Definisikan tipe User agar TypeScript tidak protes
interface User {
  id: number;
  name: string;
  role: string;
  outlet_id?: number;
}

// Menentukan tipe dari context value (Kita tambahkan user & setUser!)
interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

// Membuat context dengan default value undefined
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Menentukan tipe props untuk AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// Komponen provider untuk konteks otentikasi
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Cek token dari cookie
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!Cookies.get('token'));
  
  // Cek data user dari cookie (karena cookie nyimpan string, kita parse ke JSON)
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = Cookies.get('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!Cookies.get('token'));
      const savedUser = Cookies.get('user');
      setUser(savedUser ? JSON.parse(savedUser) : null);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};  