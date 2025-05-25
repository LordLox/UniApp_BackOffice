// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage'; // This IS used by RootRedirector
import UsersPage from './pages/UsersPage';
import MyEventsPage from './pages/MyEventsPage'; 
import AdminEventsPage from './pages/AdminEventsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProfessorDashboardPage from './pages/ProfessorDashboardPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

import { Layout, Menu, Button, Typography, Avatar, Space, theme as antdTheme, Dropdown } from 'antd'; 
import {
    DashboardOutlined, TeamOutlined, CalendarOutlined, UserOutlined,
    LogoutOutlined, ScheduleOutlined, KeyOutlined, QrcodeOutlined, ReadOutlined 
} from '@ant-design/icons';

const { Header, Content, Sider, Footer } = Layout;
const { Title, } = Typography; // Paragraph was missing from destructuring, but used in RootRedirector

const AppSider = () => {
    const location = useLocation();
    const { currentUser } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const getMenuItems = () => {
        const items = [];
        if (!currentUser) return items;

        if (currentUser.typeValue === 0) { // Admin
            items.push({ key: '/admin/dashboard', icon: <DashboardOutlined />, label: <Link to="/admin/dashboard">Dashboard</Link> });
            items.push({ key: '/users', icon: <TeamOutlined />, label: <Link to="/users">Manage Users</Link> });
            items.push({ key: '/admin/events', icon: <CalendarOutlined />, label: <Link to="/admin/events">Event Admin</Link> });
        } else if (currentUser.typeValue === 1) { // Professor
            items.push({ key: '/professor/dashboard', icon: <DashboardOutlined />, label: <Link to="/professor/dashboard">Dashboard</Link> });
            items.push({ key: '/my-events', icon: <ScheduleOutlined />, label: <Link to="/my-events">My Events</Link> });
        } else if (currentUser.typeValue === 2) { // Student
            items.push({ key: '/student/dashboard', icon: <DashboardOutlined />, label: <Link to="/student/dashboard">Dashboard</Link> });
            items.push({ key: '/my-qrcode', icon: <QrcodeOutlined />, label: <Link to="/student/dashboard">My QR Code</Link> }); 
        } else { 
            items.push({ key: '/', icon: <ReadOutlined />, label: <Link to="/">Overview</Link> });
        }
        return items;
    };
    
    let selectedKeys = [location.pathname];
    if (location.pathname === '/') { 
        if (currentUser?.typeValue === 0) selectedKeys = ['/admin/dashboard'];
        else if (currentUser?.typeValue === 1) selectedKeys = ['/professor/dashboard'];
        else if (currentUser?.typeValue === 2) selectedKeys = ['/student/dashboard'];
        else selectedKeys = ['/']; 
    }

    return (
        <Sider 
            collapsible 
            collapsed={collapsed} 
            onCollapse={(value) => setCollapsed(value)}
            breakpoint="lg" 
            theme="light"
            style={{
                overflow: 'auto', height: '100vh', position: 'fixed',
                left: 0, top: 0, bottom: 0, zIndex: 100,
                boxShadow: '2px 0 6px rgba(0,21,41,.35)'
            }}
        >
            <div style={{ 
                height: '32px', margin: '16px', 
                textAlign:'center', color: antdTheme.useToken().token.colorPrimary,
                fontWeight:'bold', borderRadius:'5px', lineHeight:'32px',
                fontSize: collapsed ? '0.8em' : '1.1em', 
                overflow: 'hidden', whiteSpace: 'nowrap'
            }}>
                {collapsed ? 'UBO' : 'UniApp BackOffice'}
            </div>
            <Menu theme="light" mode="inline" selectedKeys={selectedKeys} items={getMenuItems()} />
        </Sider>
    );
};

const AppHeader = () => { 
    const { currentUser, logout, getUserTypeString } = useAuth();
    const { token: { colorBgContainer, colorTextBase } } = antdTheme.useToken();

    const userMenuItems = [
        { key: 'changePassword', icon: <KeyOutlined />, label: <Link to="/profile/change-password">Change Password</Link> },
        { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: logout, danger: true },
    ];

    return (
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', zIndex: 90 }}>
            <Title level={3} style={{ margin: 0, color: colorTextBase }}>
                UniApp BackOffice
            </Title>
            {currentUser && (
                <Space>
                    <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                        <Button type="text" style={{ color: colorTextBase, height: 'auto', padding: '0 8px' }}>
                            <Space>
                                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                                {currentUser.name} ({getUserTypeString(currentUser.typeValue)})
                            </Space>
                        </Button>
                    </Dropdown>
                </Space>
            )}
        </Header>
    );
};

const MainLayout = ({ children }) => { 
    const { currentUser } = useAuth();
    const siderWidth = currentUser ? 200 : 0; 

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {currentUser && <AppSider />}
            <Layout style={{ marginLeft: siderWidth, transition: 'margin-left 0.2s' }}>
                {currentUser && <AppHeader />}
                <Content style={{ margin: '24px 16px', padding: 24, background: antdTheme.useToken().token.colorBgLayout || '#fff', borderRadius: antdTheme.useToken().token.borderRadiusLG, minHeight: 280 }}>
                    {children}
                </Content>
                <Footer style={{ textAlign: 'center', background: antdTheme.useToken().token.colorBgLayout || '#fff' }}>
                    UniApp BackOffice ©{new Date().getFullYear()}
                </Footer>
            </Layout>
        </Layout>
    );
};

const RootRedirector = () => {
    const { currentUser } = useAuth();

    if (!currentUser && !localStorage.getItem('authCredentials')) { 
        return <Navigate to="/login" replace />;
    }
    
    if (currentUser) {
        if (currentUser.typeValue === 0) return <Navigate to="/admin/dashboard" replace />;
        if (currentUser.typeValue === 1) return <Navigate to="/professor/dashboard" replace />;
        if (currentUser.typeValue === 2) return <Navigate to="/student/dashboard" replace />;
    }
    // Fallback: Generic DashboardPage for any other authenticated user or during initial load.
    return <MainLayout><DashboardPage /></MainLayout>; 
};

function AppContent() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<RootRedirector />} /> 
                
                <Route path="/admin/dashboard" element={<MainLayout><AdminDashboardPage /></MainLayout>} />
                <Route path="/professor/dashboard" element={<MainLayout><ProfessorDashboardPage /></MainLayout>} />
                <Route path="/student/dashboard" element={<MainLayout><StudentDashboardPage /></MainLayout>} />

                <Route path="/users" element={<MainLayout><UsersPage /></MainLayout>} />
                <Route path="/my-events" element={<MainLayout><MyEventsPage /></MainLayout>} />
                <Route path="/admin/events" element={<MainLayout><AdminEventsPage /></MainLayout>} /> 
                <Route path="/profile/change-password" element={<MainLayout><ChangePasswordPage /></MainLayout>} />
            </Route>
            
            <Route 
                path="*" 
                element={
                    localStorage.getItem('authCredentials') ? 
                        // If logged in (or credentials exist), redirect to root, which handles role-based dashboard
                        <Navigate to="/" replace /> 
                        : <Navigate to="/login" replace /> // If not logged in at all, go to login
                } 
            />
        </Routes>
    );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;