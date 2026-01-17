// frontend/src/context/AuthContext.jsx
/**
 * Authentication Context - Global state for user authentication
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, saveToken, saveUser, getUser, getToken } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is already logged in on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = getToken();
            const savedUser = getUser();

            if (token && savedUser) {
                setUser(savedUser);
            }

            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            setError(null);
            setLoading(true);

            const response = await authAPI.login({ email, password });
            const { access_token, user: userData } = response.data;

            saveToken(access_token);
            saveUser(userData);
            setUser(userData);

            return userData;
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Login failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setError(null);
            setLoading(true);

            const response = await authAPI.register(userData);

            // Auto-login after registration
            await login(userData.email, userData.password);

            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Registration failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
            setUser(null);
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const updateUser = (userData) => {
        setUser(userData);
        saveUser(userData);
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isStudent: user?.role === 'student',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
