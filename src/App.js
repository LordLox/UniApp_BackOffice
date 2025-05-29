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

// Import Ant Design's App component
import { Layout, Menu, Button, Typography, Avatar, Space, theme as antdTheme, Dropdown, App as AntApp } from 'antd'; 
import {
    DashboardOutlined, TeamOutlined, CalendarOutlined, UserOutlined,
    LogoutOutlined, ScheduleOutlined, KeyOutlined, QrcodeOutlined, ReadOutlined 
} from '@ant-design/icons';

const { Header, Content, Sider, Footer } = Layout;
const { Title } = Typography;

const AppSider = () => {
    const location = useLocation();
    const { currentUser } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const { token } = antdTheme.useToken(); // Use token for theming consistency if needed

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
            // Assuming My QR Code link should also point to student dashboard as per previous structure
            items.push({ key: '/my-qrcode', icon: <QrcodeOutlined />, label: <Link to="/student/dashboard">My QR Code</Link> }); 
        } else { 
            items.push({ key: '/', icon: <ReadOutlined />, label: <Link to="/">Overview</Link> });
        }
        return items;
    };
    
    let selectedKeys = [location.pathname];
    // This logic correctly sets the selected key for the root path based on user type.
    if (location.pathname === '/') { 
        if (currentUser?.typeValue === 0) selectedKeys = ['/admin/dashboard'];
        else if (currentUser?.typeValue === 1) selectedKeys = ['/professor/dashboard'];
        else if (currentUser?.typeValue === 2) selectedKeys = ['/student/dashboard'];
        else selectedKeys = ['/']; 
    } else if (location.pathname === '/student/dashboard' && selectedKeys.includes('/my-qrcode')) {
        // If on student dashboard, but /my-qrcode was clicked, ensure student dashboard is highlighted.
        // This handles if /my-qrcode is just an alias for a section within student dashboard.
        selectedKeys = ['/student/dashboard'];
    }


    return (
        <Sider 
            collapsible 
            collapsed={collapsed} 
            onCollapse={(value) => setCollapsed(value)}
            breakpoint="lg" // Sider will collapse on smaller screens
            // theme="light" // You can choose theme="dark" or "light"
            style={{
                overflow: 'auto', height: '100vh', position: 'fixed',
                left: 0, top: 0, bottom: 0, zIndex: 100, // Ensure Sider is above content scroll
                boxShadow: '2px 0 6px rgba(0,21,41,.35)', // Subtle shadow
                backgroundColor: token.colorBgContainer, // Use theme background
            }}
        >
            <div style={{ 
                height: '32px', margin: '16px', 
                textAlign:'center', color: token.colorPrimary,
                fontWeight:'bold', borderRadius: token.borderRadiusLG, lineHeight:'32px',
                fontSize: collapsed ? '0.8em' : '1.1em', 
                overflow: 'hidden', whiteSpace: 'nowrap',
                // background: token.colorPrimaryBg, // Optional: add a subtle background
            }}>
                {collapsed ? 'UBO' : 'UniApp BackOffice'}
            </div>
            <Menu 
                theme="light" // Or "dark" to match Sider if preferred
                mode="inline" 
                selectedKeys={selectedKeys} 
                items={getMenuItems()} 
            />
        </Sider>
    );
};

const AppHeader = () => { 
    const { currentUser, logout, getUserTypeString } = useAuth();
    const { token } = antdTheme.useToken(); // Access theme tokens

    const userMenuItems = [
        { key: 'changePassword', icon: <KeyOutlined />, label: <Link to="/profile/change-password">Change Password</Link> },
        { type: 'divider' }, // Optional: adds a line separator
        { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: logout, danger: true },
    ];

    return (
        <Header style={{ 
            padding: '0 24px', 
            background: token.colorBgContainer, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: `1px solid ${token.colorBorderSecondary}`, // Use theme border color
            zIndex: 90 // Ensure header is above content but below Sider if overlapping
        }}>
            <Title level={3} style={{ margin: 0, color: token.colorTextBase }}>
                {/* Title can be dynamic or static */}
                UniApp BackOffice
            </Title>
            {currentUser && (
                <Space>
                    <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                        <Button type="text" style={{ color: token.colorTextBase, height: 'auto', padding: '0 8px' }}>
                            <Space>
                                <Avatar icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
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
    const { token } = antdTheme.useToken();
    // Determine Sider width based on its collapsed state if you control it here,
    // or use a fixed value/CSS for dynamic adjustment.
    // For simplicity, assuming a fixed width when currentUser exists.
    const siderWidth = currentUser ? 200 : 0; // Adjust if using collapsed state from AppSider

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {currentUser && <AppSider />}
            <Layout style={{ 
                marginLeft: siderWidth, // This pushes content to the right of the Sider
                transition: 'margin-left 0.2s', // Smooth transition for sider collapse/expand
                background: token.colorBgLayout, // Use theme layout background
            }}>
                {currentUser && <AppHeader />}
                <Content style={{ 
                    margin: '24px 16px', 
                    padding: 24, 
                    background: token.colorBgContainer, // Content area background
                    borderRadius: token.borderRadiusLG, 
                    minHeight: 280 
                }}>
                    {children}
                </Content>
                <Footer style={{ 
                    textAlign: 'center', 
                    background: token.colorBgLayout, // Footer background
                    color: token.colorTextSecondary, // Footer text color
                }}>
                    UniApp BackOffice ©{new Date().getFullYear()}
                </Footer>
            </Layout>
        </Layout>
    );
};

// RootRedirector handles initial navigation based on auth state and user type
const RootRedirector = () => {
    const { currentUser } = useAuth();

    // If not logged in (no currentUser and no stored credentials), redirect to login
    if (!currentUser && !localStorage.getItem('authCredentials')) { 
        return <Navigate to="/login" replace />;
    }
    
    // If currentUser exists, redirect based on role
    if (currentUser) {
        if (currentUser.typeValue === 0) return <Navigate to="/admin/dashboard" replace />;
        if (currentUser.typeValue === 1) return <Navigate to="/professor/dashboard" replace />;
        if (currentUser.typeValue === 2) return <Navigate to="/student/dashboard" replace />;
        // Fallback for any other authenticated user type not explicitly handled
        return <MainLayout><DashboardPage /></MainLayout>; 
    }
    
    // If localStorage.getItem('authCredentials') exists but currentUser is not yet set (e.g. during app load)
    // It's often better to show a loading spinner or let AuthContext handle hydration.
    // For now, this might briefly show DashboardPage before AuthContext hydrates currentUser and redirects.
    // Or, if AuthContext fails to hydrate for some reason, this acts as a fallback for "logged-in-ish" state.
    // Consider a dedicated loading component if flicker is an issue.
    return <MainLayout><DashboardPage /></MainLayout>; 
};

function AppContent() {
    // This component now renders the routes within the MainLayout
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes - Rendered within MainLayout */}
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<RootRedirector />} /> 
                
                <Route path="/admin/dashboard" element={<MainLayout><AdminDashboardPage /></MainLayout>} />
                <Route path="/professor/dashboard" element={<MainLayout><ProfessorDashboardPage /></MainLayout>} />
                <Route path="/student/dashboard" element={<MainLayout><StudentDashboardPage /></MainLayout>} />

                <Route path="/users" element={<MainLayout><UsersPage /></MainLayout>} />
                <Route path="/my-events" element={<MainLayout><MyEventsPage /></MainLayout>} />
                <Route path="/admin/events" element={<MainLayout><AdminEventsPage /></MainLayout>} /> 
                <Route path="/profile/change-password" element={<MainLayout><ChangePasswordPage /></MainLayout>} />
                {/* Add other protected routes here, wrapped in MainLayout if they share the common structure */}
            </Route>
            
            {/* Fallback for any unmatched routes */}
            <Route 
                path="*" 
                element={
                    // If credentials exist, assume user is logged in or in process of being authenticated,
                    // redirect to root, which will then handle role-based redirection.
                    // If no credentials, redirect to login.
                    localStorage.getItem('authCredentials') ? 
                        <Navigate to="/" replace /> 
                        : <Navigate to="/login" replace />
                } 
            />
        </Routes>
    );
}

// Main App component
function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Wrap AppContent with AntApp to provide context for static methods like Modal.confirm */}
        <AntApp>
          <AppContent />
        </AntApp>
      </Router>
    </AuthProvider>
  );
}

export default App;