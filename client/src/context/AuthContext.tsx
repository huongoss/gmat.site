import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    user: any;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (email: string, password: string) => Promise<void>;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
    }, []);

    const login = async (email: string, password: string) => {
        // Implement login logic here, e.g., API call
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (data.user) {
            setUser(data.user);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
    };

    const register = async (email: string, password: string) => {
        // Implement registration logic here, e.g., API call
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (data.user) {
            setUser(data.user);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, isAuthenticated }}>
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