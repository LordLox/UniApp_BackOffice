// src/pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Form, Input, Button, Card, Typography, Alert, Spin } from 'antd'; // Checkbox removed if not used
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title } = Typography;

const LoginPage = () => {
    const { login, isLoading, error: authError, currentUser } = useAuth();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loginAttempted, setLoginAttempted] = useState(false);

    useEffect(() => {
        if (loginAttempted && currentUser) {
            setLoginAttempted(false); 
            if (currentUser.typeValue === 0) navigate('/admin/dashboard', { replace: true });
            else if (currentUser.typeValue === 1) navigate('/professor/dashboard', { replace: true });
            else navigate('/', { replace: true }); 
        }
    }, [currentUser, loginAttempted, navigate]);

    const onFinish = async (values) => {
        const { username, password } = values;
        const success = await login(username, password);
        if (success) {
            setLoginAttempted(true);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={2}>UniApp BackOffice</Title> {/* MODIFIED HERE */}
                </div>
                
                {authError && !isLoading && (
                    <Alert message={authError} type="error" showIcon style={{ marginBottom: 24 }} />
                )}

                <Spin spinning={isLoading} tip="Logging in...">
                    <Form
                        form={form}
                        name="normal_login"
                        onFinish={onFinish}
                        initialValues={{ remember: true }}
                    >
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: 'Please input your Username!' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Username" size="large" />
                        </Form.Item>
                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Please input your Password!' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" style={{ width: '100%' }} size="large">
                                Log in
                            </Button>
                        </Form.Item>
                    </Form>
                </Spin>
            </Card>
        </div>
    );
};

export default LoginPage;