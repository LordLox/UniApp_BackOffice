// src/pages/ChangePasswordPage.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { changeMyPassword } from '../api/userService';
import ChangePasswordForm from '../components/ChangePasswordForm';
import { Card, Typography, message as AntMessage, Alert } from 'antd'; // Added Alert to import

const { Title } = Typography;

const ChangePasswordPage = () => {
    const { getAuthHeader, currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [pageError, setPageError] = useState(''); 

    const handleChangePassword = async (newPassword) => {
        setIsLoading(true);
        setPageError(''); 
        const authHeader = getAuthHeader();
        if (!authHeader) {
            AntMessage.error("Authentication session error. Please log in again.");
            setIsLoading(false);
            throw new Error("Authentication session error."); 
        }

        try {
            await changeMyPassword(newPassword, authHeader);
            AntMessage.success('Your password has been changed successfully!');
        } catch (error) {
            console.error("Error changing password:", error);
            AntMessage.error(`Password change failed: ${error.message}`);
            throw error; 
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentUser) {
        return <p>Please log in to change your password.</p>;
    }

    return (
        <div style={{ maxWidth: '600px', margin: '30px auto' }}>
            <Card>
                <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>Change My Password</Title>
                {/* This pageError is for errors outside the form submission itself */}
                {pageError && <Alert message={pageError} type="error" showIcon style={{marginBottom: '16px'}} />}
                <ChangePasswordForm 
                    onFinishChangePassword={handleChangePassword} 
                    isLoading={isLoading} 
                />
            </Card>
        </div>
    );
};

export default ChangePasswordPage;