// src/pages/DashboardPage.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
    const { currentUser, getUserTypeString } = useAuth();
    return (
        <div>
            <h2>Dashboard</h2>
            {currentUser && (
                <p>
                    Welcome, {currentUser.name}! (Role: {getUserTypeString(currentUser.typeValue)})
                </p>
            )}
            <p>This is your main dashboard. Use the navigation menu to access specific sections and features relevant to your role.</p>
        </div>
    );
};

export default DashboardPage;