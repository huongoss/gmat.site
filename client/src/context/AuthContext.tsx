import React, { createContext, useContext, useState, useEffect } from 'react';
import { setUserId, trackEvent } from '../utils/analytics';
import { loginUser, registerUser, getProfile, setAuthToken } from '../services/api';

interface AuthContextType {
    user: any;
    token?: string;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (email: string, password: string, username?: string) => Promise<void>;
    isAuthenticated: boolean;
    refreshProfile: () => Promise<void>;
    authLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string | undefined>(undefined);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [authLoading, setAuthLoading] = useState<boolean>(true);

    useEffect(() => {
        (async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                setToken(storedToken);
                setAuthToken(storedToken);
                setIsAuthenticated(true);
                await refreshProfile();
            } else {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setUser(parsed);
                    setIsAuthenticated(true);
                    const uid = parsed?.id || parsed?._id;
                    if (uid) setUserId(String(uid));
                }
            }
            setAuthLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refreshProfile = async () => {
        try {
            const profile = await getProfile();
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
            const uid = profile?.id || profile?._id;
            if (uid) setUserId(String(uid));
        } catch (e: any) {
            // If forbidden/unauthorized, clear auth state
            if (e?.response?.status === 401 || e?.response?.status === 403) {
                setUser(null);
                setIsAuthenticated(false);
                setToken(undefined);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                setAuthToken(undefined);
            }
            console.warn('Failed to refresh profile:', e);
        }
    };

    const login = async (email: string, password: string) => {
        const { token } = await loginUser({ email, password });
        setToken(token);
        localStorage.setItem('token', token);
        setAuthToken(token);
        setIsAuthenticated(true);
        await refreshProfile();
        trackEvent('login', { method: 'password' });
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        setToken(undefined);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setAuthToken(undefined);
        setUserId(undefined);
    };

    const register = async (email: string, password: string, username?: string) => {
        await registerUser({ email, password, username });
        await login(email, password);
        trackEvent('sign_up', { method: 'password' });
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, register, isAuthenticated, refreshProfile, authLoading }}>
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