import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { SESSION_CONFIG } from '../constants/constants';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
    const timeoutId = useRef(null);
    const lastActivityRef = useRef(Date.now());

    // Logout function
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }
    }, []);

    // Reset inactivity timer
    const resetInactivityTimer = useCallback(() => {
        lastActivityRef.current = Date.now();

        // Clear existing timeout
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }

        // Set new timeout
        if (user) {
            timeoutId.current = setTimeout(() => {
                logout();
                setShowSessionExpiredModal(true);
            }, SESSION_CONFIG.TIMEOUT_MS);
        }
    }, [user, logout]);

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
        setShowSessionExpiredModal(false);
    };

    const dismissSessionExpiredModal = () => {
        setShowSessionExpiredModal(false);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, showSessionExpiredModal, dismissSessionExpiredModal }}>
            {children}
            
            {/* Session Expired Modal */}
            {showSessionExpiredModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Session Expired</h2>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <p className="text-gray-600 text-center">
                                Your session has expired due to inactivity. Please log in again to continue.
                            </p>
                            
                            <button
                                onClick={() => {
                                    dismissSessionExpiredModal();
                                    window.location.href = '/login';
                                }}
                                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg"
                            >
                                Log In Again
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
};

export default AuthContext;
