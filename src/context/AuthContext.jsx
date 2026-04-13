import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loginWithGoogle = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        localStorage.setItem('authSessionStart', Date.now().toString());
        return result;
    };

    const logout = async () => {
        await signOut(auth);
        localStorage.removeItem('authSessionStart');
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (user) {
                // If user is logged in but has no session start time (e.g. existing session), start it now
                if (!localStorage.getItem('authSessionStart')) {
                    localStorage.setItem('authSessionStart', Date.now().toString());
                }
            } else {
                localStorage.removeItem('authSessionStart');
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Session Timeout Checker (4 hours)
    useEffect(() => {
        if (!currentUser) return;

        const checkSession = () => {
            const sessionStart = localStorage.getItem('authSessionStart');
            if (sessionStart) {
                const elapsed = Date.now() - parseInt(sessionStart, 10);
                const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
                
                if (elapsed >= FOUR_HOURS_MS) {
                    console.log('Session expired, auto-logging out...');
                    logout();
                    alert("セキュリティ保護のため、ログインから4時間が経過しました。自動的にログアウトしました。");
                }
            }
        };

        // Check initially
        checkSession();
        
        // Then check every minute
        const interval = setInterval(checkSession, 60000);
        return () => clearInterval(interval);
    }, [currentUser]);

    const value = {
        currentUser,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex items-center justify-center h-screen bg-[#F6F7F2]">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3D5A40] border-t-transparent"></div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};
