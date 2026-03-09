import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [intendedPath, setIntendedPath] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('jasmineToken') || null);

    useEffect(() => {
        if (token) {
            localStorage.setItem('jasmineToken', token);
            // In a real app we might fetch the user profile here 
            // based on token to restore state on reload. 
            // For this game, we'll restore basic user state from localStorage too.
            const storedUser = localStorage.getItem('jasmineUser');
            if (storedUser) setUser(JSON.parse(storedUser));
        } else {
            localStorage.removeItem('jasmineToken');
            localStorage.removeItem('jasmineUser');
        }
    }, [token]);

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('jasmineUser', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
    };

    const updateUser = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem('jasmineUser', JSON.stringify(newUser));
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, intendedPath, setIntendedPath }}>
            {children}
        </AuthContext.Provider>
    );
};
