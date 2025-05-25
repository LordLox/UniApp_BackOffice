// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { decryptData } from '../api/barcodeService'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const login = async (username, password) => {
        setIsLoading(true);
        setError('');
        const credentials = btoa(`${username}:${password}`);
        const authHeader = `Basic ${credentials}`;

        try {
            const userInfoResponse = await fetch(`${API_BASE_URL}/users/userinfo`, {
                headers: { 'Authorization': authHeader },
            });

            if (!userInfoResponse.ok) {
                if (userInfoResponse.status === 401) throw new Error('Invalid username or password.');
                const errorText = await userInfoResponse.text();
                throw new Error(`Login failed (userinfo endpoint): ${userInfoResponse.statusText} (Status: ${userInfoResponse.status}) - ${errorText}`);
            }

            const encryptedUserInfoString = await userInfoResponse.text();
            if (!encryptedUserInfoString) {
                throw new Error('Received empty user info response from server.');
            }

            const decryptedJsonString = await decryptData(encryptedUserInfoString, authHeader);
            if (!decryptedJsonString) {
                throw new Error('Failed to decrypt user information or received empty decrypted data.');
            }
            
            const userInfo = JSON.parse(decryptedJsonString); // This is your UserInfoDto

            // REMOVED THE STUDENT BLOCK:
            // if (userInfo.Type === UserType.Student) {
            //     throw new Error('Access Denied: Student accounts are not permitted to log into this backoffice application.');
            // }

            const userData = {
                usernameFromInput: username, 
                passwordFromInput: password, 
                id: userInfo.Id,
                name: userInfo.Name,
                typeValue: userInfo.Type,     
                badge: userInfo.Badge,
                username: userInfo.Username   
            };
            
            setCurrentUser(userData);
            localStorage.setItem('authCredentials', credentials); 
            localStorage.setItem('userData', JSON.stringify({
                id: userInfo.Id, 
                name: userInfo.Name, 
                typeValue: userInfo.Type,     
                badge: userInfo.Badge,
                username: userInfo.Username
            }));

            return true; 
        } catch (err) {
            console.error("Login process error:", err);
            setError(err.message || "An unexpected error occurred during login.");
            setCurrentUser(null); 
            localStorage.removeItem('authCredentials'); 
            localStorage.removeItem('userData'); 
            return false; 
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('authCredentials');
        localStorage.removeItem('userData');
    };

    useEffect(() => {
        const storedCredentials = localStorage.getItem('authCredentials');
        const storedUserDataString = localStorage.getItem('userData');
        if (storedCredentials && storedUserDataString) {
            try {
                const decodedCredentials = atob(storedCredentials);
                const [usernameFromCreds, passwordFromCreds] = decodedCredentials.split(':', 2);
                
                const parsedUserData = JSON.parse(storedUserDataString); 
                
                // We no longer need to explicitly block students here during hydration,
                // as the login logic now allows them. Routing will handle their destination.
                // if (parsedUserData.typeValue === UserType.Student) {
                //     logout(); 
                //     return;
                // }
                
                if (usernameFromCreds && parsedUserData) {
                    setCurrentUser({ 
                        username: parsedUserData.username, 
                        password: passwordFromCreds,       
                        id: parsedUserData.id,
                        name: parsedUserData.name, 
                        typeValue: parsedUserData.typeValue,
                        badge: parsedUserData.badge
                    });
                }
            } catch (e) {
                console.error("Error decoding stored user session data", e);
                logout(); 
            }
        }
    }, []); // Removed logout from dependency array

    const getAuthHeader = useCallback(() => {
        const storedCredentials = localStorage.getItem('authCredentials');
        if (storedCredentials) {
            return `Basic ${storedCredentials}`;
        }
        return null;
    }, []); 
    
    const getUserTypeString = (typeValue) => {
        const userTypes = { 0: 'Admin', 1: 'Professor', 2: 'Student' };
        return userTypes[typeValue] || 'Unknown';
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, isLoading, error, getAuthHeader, getUserTypeString }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);