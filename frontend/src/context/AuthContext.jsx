import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { SESSION_CONFIG } from '../constants/constants';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const timeoutId = useRef(null);
    const lastActivityRef = useRef(Date.now());

    // Reset inactivity timer
    const resetInactivityTimer = useCallback(() => {
        lastActivityRef.current = Date.now();

        // Clear existing timeout
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }

        // Set new timeout for 30 minutes
        if (user) {
            timeoutId.current = setTimeout(() => {
                logout();
                alert('Your session has expired due to inactivity. Please login again.');
            }, SESSION_CONFIG.TIMEOUT_MS);
        }
    }, [user]);

    // Track user activity
    useEffect(() => {
        if (!user) return;

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        const handleActivity = () => {
            resetInactivityTimer();
        };

        // Add event listeners
        events.forEach(event => {
            document.addEventListener(event, handleActivity);
        });

        // Initialize timeout
        resetInactivityTimer();

        // Cleanup
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
        };
    }, [user, resetInactivityTimer]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 < Date.now()) {
                    localStorage.removeItem('token');
                    setUser(null);
                } else {
                    setUser({ ...decoded, token });
                }
            } catch (e) {
                localStorage.removeItem('token');
                setUser(null);
            }
        }
        setLoading(false);
    }, []);

    const login = (token) => {
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        setUser({ ...decoded, token });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
