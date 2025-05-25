// src/components/ChangePasswordForm.js
import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { LockOutlined } from '@ant-design/icons';

const ChangePasswordForm = ({ onFinishChangePassword, onCancel, isLoading }) => {
    const [form] = Form.useForm();
    const [error, setError] = useState('');

    const handleSubmit = async (values) => {
        setError('');
        if (values.newPassword !== values.confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        // Password strength validation could be added here on client-side for immediate feedback,
        // but backend will ultimately validate it.
        try {
            await onFinishChangePassword(values.newPassword);
            form.resetFields();
            // Success message (e.g., "Password changed successfully!") will be handled by the parent page.
        } catch (err) {
            setError(err.message || "Failed to change password. Please ensure it meets complexity requirements.");
        }
    };

    return (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 24 }} />}
            <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                    { required: true, message: 'Please input your new password!' },
                    // Example client-side rule (backend has the definitive rules)
                    // { min: 8, message: 'Password must be at least 8 characters.'} 
                ]}
                hasFeedback
            >
                <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
            </Form.Item>
            <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                dependencies={['newPassword']}
                hasFeedback
                rules={[
                    { required: true, message: 'Please confirm your new password!' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('The two passwords that you entered do not match!'));
                        },
                    }),
                ]}
            >
                <Input.Password prefix={<LockOutlined />} placeholder="Confirm New Password" />
            </Form.Item>
            <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
                {onCancel && (
                    <Button onClick={onCancel} style={{ marginRight: 8 }} disabled={isLoading}>
                        Cancel
                    </Button>
                )}
                <Button type="primary" htmlType="submit" loading={isLoading}>
                    Change Password
                </Button>
            </Form.Item>
        </Form>
    );
};

export default ChangePasswordForm;