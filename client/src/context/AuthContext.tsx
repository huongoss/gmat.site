import React, { createContext, useContext, useState, useEffect } from 'react';
import { setUserId, trackEvent } from '../utils/analytics';
import { loginUser, registerUser, getProfile, setAuthToken } from '../services/api';

interface AuthContextType {
    user: any;
    token?: string;
    login: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
    logout: () => void;
    register: (email: string, password: string, username?: string, recaptchaToken?: string) => Promise<void>;
    isAuthenticated: boolean;
    refreshProfile: () => Promise<void>;
    authLoading: boolean;
    justLoggedIn: boolean;
    clearJustLoggedIn: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string | undefined>(undefined);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [authLoading, setAuthLoading] = useState<boolean>(true);
    const [justLoggedIn, setJustLoggedIn] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                // Set token header immediately
                setToken(storedToken);
                setAuthToken(storedToken);
                try {
                    const profile = await getProfile();
                    setUser(profile);
                    localStorage.setItem('user', JSON.stringify(profile));
                    const uid = profile?.id || profile?._id;
                    if (uid) setUserId(String(uid));
                    setIsAuthenticated(true);
                } catch (e: any) {
                    console.warn('Auto profile load failed; clearing auth', e);
                    clearAuth();
                } finally {
                    setAuthLoading(false);
                }
            } else {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setUser(parsed);
                    setIsAuthenticated(true);
                    const uid = parsed?.id || parsed?._id;
                    if (uid) setUserId(String(uid));
                }
                setAuthLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refreshProfile = async (overrideToken?: string) => {
        const activeToken = overrideToken || token || localStorage.getItem('token');
        if (!activeToken) return;
        setAuthToken(activeToken);
        try {
            const profile = await getProfile();
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
            const uid = profile?.id || profile?._id;
            if (uid) setUserId(String(uid));
            if (!isAuthenticated) setIsAuthenticated(true);
        } catch (e: any) {
            if (e?.response?.status === 401 || e?.response?.status === 403) {
                clearAuth();
            }
            console.warn('Failed to refresh profile:', e);
        }
    };

    const clearAuth = () => {
        setUser(null);
        setIsAuthenticated(false);
        setToken(undefined);
        setJustLoggedIn(false);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setAuthToken(undefined);
        setUserId(undefined);
    };

    const clearJustLoggedIn = () => {
        setJustLoggedIn(false);
    };

    const login = async (email: string, password: string, recaptchaToken?: string) => {
        const { token } = await loginUser({ email, password, recaptchaToken });
        setToken(token);
        localStorage.setItem('token', token);
        setAuthToken(token);
        setIsAuthenticated(true); // optimistic
        setJustLoggedIn(true);
        await refreshProfile(token);
        trackEvent('login', { method: 'password' });
    };

    const logout = () => {
        clearAuth();
    };

    const register = async (email: string, password: string, username?: string, recaptchaToken?: string) => {
        // Call register endpoint (returns 201 Created with token + user)
        const reg = await registerUser({ email, password, username, recaptchaToken });
        // Some earlier versions ignored the returned token and performed an immediate login.
        // That caused an apparent "failure" after a 201 success when the reused reCAPTCHA token
        // was rejected on the /auth/login endpoint. We now trust the 201 response.
        if (reg?.token) {
            const newToken = reg.token as string;
            setToken(newToken);
            localStorage.setItem('token', newToken);
            setAuthToken(newToken);
            setJustLoggedIn(true);
            // No persistent flags needed; Account page will derive UI from emailVerified directly
            // Use returned user payload if present (may have minimal fields like emailVerified false)
            if (reg.user) {
                setUser(reg.user);
                localStorage.setItem('user', JSON.stringify(reg.user));
                const uid = (reg.user as any)?.id || (reg.user as any)?._id;
                if (uid) setUserId(String(uid));
            } else {
                // Fallback fetch profile (should succeed even if email not verified)
                await refreshProfile(newToken);
            }
            setIsAuthenticated(true);
        } else {
            // Fallback: if backend ever omits token, perform a normal login (request fresh reCAPTCHA if needed externally)
            await login(email, password, undefined);
        }
        trackEvent('sign_up', { method: 'password' });
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, register, isAuthenticated, refreshProfile, authLoading, justLoggedIn, clearJustLoggedIn }}>
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