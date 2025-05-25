// src/api/userService.js
import { API_BASE_URL } from '../config';

// (handleResponse function remains the same as previously defined)
const handleResponse = async (response) => {
    if (!response.ok) {
        let errorDataMessage = 'An unknown error occurred.';
        try {
            const errorDataText = await response.text();
            console.error("Raw API Error Data:", errorDataText);
            if (errorDataText && (errorDataText.startsWith('{') || errorDataText.startsWith('['))) {
                const errorJson = JSON.parse(errorDataText);
                if (errorJson && errorJson.message) {
                    errorDataMessage = errorJson.message;
                } else if (typeof errorJson === 'string') {
                    errorDataMessage = errorJson;
                } else {
                    errorDataMessage = `API Error: ${response.statusText} (Status: ${response.status}). Check console for details.`;
                }
            } else {
                errorDataMessage = errorDataText.length < 200 ? errorDataText : `API Error: ${response.statusText} (Status: ${response.status}).`;
            }
        } catch (e) {
            console.error("Error parsing error response:", e);
            errorDataMessage = `API request failed with status ${response.status} ${response.statusText}. Could not parse error details.`;
        }
        throw new Error(errorDataMessage);
    }
    // For 201 Created, 200 OK with content, or 204 No Content
    if (response.status === 204 || response.headers.get("content-length") === "0" ) {
        return null; // No content to parse
    }
    // For POST /users that returns the new user ID or user object as JSON
    if (response.status === 201 && response.headers.get("content-type")?.includes("application/json")) {
        return response.json(); 
    }
    // For other successful responses with JSON content
    if (response.headers.get("content-type")?.includes("application/json")) {
        return response.json();
    }
    // For successful responses with plain text (like the old create user ID)
    return response.text();
};


export const fetchUsers = async (authHeader) => {
    if (!authHeader) throw new Error("Authorization header is missing.");
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
};

export const createUser = async (userData, authHeader) => {
    if (!authHeader) throw new Error("Authorization header is missing.");
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 
            'Authorization': authHeader, 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(userData),
    });
    // Assuming POST /users returns the new user ID or object
    return handleResponse(response); 
};

export const updateUser = async (userId, userData, authHeader) => {
    if (!authHeader) throw new Error("Authorization header is missing.");
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: { 
            'Authorization': authHeader, 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(userData),
    });
    return handleResponse(response); 
};

export const deleteUser = async (userId, authHeader) => {
    if (!authHeader) throw new Error("Authorization header is missing.");
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': authHeader },
    });
    return handleResponse(response); 
};

// New function for resetting password
export const adminResetUserPassword = async (userId, newPassword, authHeader) => {
    if (!authHeader) throw new Error("Authorization header is missing.");
    if (!userId || !newPassword) throw new Error("User ID and new password are required.");

    // Backend endpoint: POST /users/changepass/{userId}
    // The body is the new password as plain text.
    const response = await fetch(`${API_BASE_URL}/users/changepass/${userId}`, {
        method: 'POST',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'text/plain', // Backend expects plain text password in body
        },
        body: newPassword,
    });
    return handleResponse(response); // Expects 200 OK or error
};

// New function for authenticated user to change their own password
export const changeMyPassword = async (newPassword, authHeader) => {
    if (!authHeader) throw new Error("Authorization header is missing.");
    if (!newPassword) throw new Error("New password is required.");

    // Backend endpoint: POST /users/changepass
    // Body is the new password as plain text
    const response = await fetch(`${API_BASE_URL}/users/changepass`, {
        method: 'POST',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'text/plain',
        },
        body: newPassword,
    });
    return handleResponse(response); // Expects 200 OK or error
};