// src/components/ResetPasswordForm.js
import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { LockOutlined } from '@ant-design/icons';

const ResetPasswordForm = ({ onFinishReset, onCancel, targetUsername }) => {
    const [form] = Form.useForm();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values) => {
        setError('');
        if (values.newPassword !== values.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            await onFinishReset(values.newPassword); // Pass only the new password
            form.resetFields();
            // Success message can be handled by parent
        } catch (err) {
            setError(err.message || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
            <p>Resetting password for user: <strong>{targetUsername}</strong></p>
            <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                    { required: true, message: 'Please input the new password!' },
                    // You can add more password strength rules here on the client-side if desired
                    // e.g., { min: 8, message: 'Password must be at least 8 characters.' }
                    // However, the backend will enforce its own rules.
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
                    { required: true, message: 'Please confirm the new password!' },
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
            <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                <Button onClick={onCancel} style={{ marginRight: 8 }} disabled={loading}>
                    Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                    Reset Password
                </Button>
            </Form.Item>
        </Form>
    );
};

export default ResetPasswordForm;