// src/pages/UsersPage.js
// ... (imports remain the same, ensure Typography and Alert are imported if not already)
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUsers, createUser, updateUser, adminResetUserPassword } from '../api/userService';
import { Table, Button, Space, Modal as AntModal, Tag, message, Typography, Alert, Tooltip } from 'antd'; 
import { EditOutlined, DeleteOutlined, UndoOutlined, PlusOutlined } from '@ant-design/icons';
import UserForm from '../components/UserForm';
import ResetPasswordForm from '../components/ResetPasswordForm';
import ErrorModal from '../components/ErrorModal'; 

const { Title } = Typography;

const PROTECTED_ADMIN_ID = 1; 

const UsersPage = () => {
    // ... (state variables and most functions remain the same)
    const { getAuthHeader, getUserTypeString, currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pageError, setPageError] = useState('');
    const [isUserFormModalOpen, setIsUserFormModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [userToResetPassword, setUserToResetPassword] = useState(null);
    const [actionError, setActionError] = useState('');
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

    const loadUsers = useCallback(async () => { /* ... */ 
        setIsLoading(true);
        setPageError('');
        const authHeader = getAuthHeader();
        if (!authHeader) {
            setPageError("User is not authenticated to fetch users.");
            setIsLoading(false);
            return;
        }
        try {
            const data = await fetchUsers(authHeader);
            setUsers(data || []); 
        } catch (err) {
            setPageError(err.message || "Failed to fetch users.");
            console.error("Error fetching users:", err);
            setUsers([]); 
        } finally {
            setIsLoading(false);
        }
    }, [getAuthHeader]);

    useEffect(() => { /* ... */ 
        if (currentUser && currentUser.typeValue === 0) { 
            loadUsers();
        } else if (currentUser) {
            setPageError("Access Denied: You are not authorized to manage users.");
        }
    }, [currentUser, loadUsers]);

    const handleOpenModalForCreate = () => { /* ... */ 
        setEditingUser(null);
        setIsUserFormModalOpen(true);
    };
    const handleOpenModalForEdit = (user) => { /* ... */ 
        if (user.id === PROTECTED_ADMIN_ID) { 
            message.info("The default admin user's details cannot be edited here. Use 'Change My Password' for password.");
            return;
        }
        setEditingUser(user);
        setIsUserFormModalOpen(true);
    };
    const handleCloseUserFormModal = () => { /* ... */ 
        setIsUserFormModalOpen(false);
        setEditingUser(null);
    };
    const handleCloseErrorModal = () => { /* ... */ 
        setIsErrorModalOpen(false);
        setActionError('');
    };
    
    const handleOpenResetPasswordModal = (user) => {
        if (user.id === PROTECTED_ADMIN_ID) { // Any admin trying to reset PROTECTED_ADMIN_ID's password
             message.error("The default admin's password cannot be reset using this function. The admin should use 'Change My Password'.");
             return;
        }
        // For resetting other users' passwords
        setUserToResetPassword(user);
        setIsResetPasswordModalOpen(true);
    };

    const handleCloseResetPasswordModal = () => {
        setIsResetPasswordModalOpen(false);
        setUserToResetPassword(null);
    };

    const handleUserFormSubmit = async (formData) => { /* ... (no change from previous version where PROTECTED_ADMIN_ID edit was blocked) ... */ 
        setActionError('');
        const authHeader = getAuthHeader();
        if (!authHeader) {
            setActionError("Authentication error."); setIsErrorModalOpen(true); return;
        }
        setIsLoading(true); 
        try {
            if (editingUser) { 
                if (editingUser.id === PROTECTED_ADMIN_ID) {
                    message.error("Default admin user cannot be edited.");
                    setIsLoading(false);
                    handleCloseUserFormModal();
                    return;
                }
                const updateData = { name: formData.name, type: parseInt(formData.type, 10) };
                await updateUser(editingUser.id, updateData, authHeader);
                message.success(`User '${editingUser.username}' updated successfully.`);
            } else { 
                 const createData = {
                    name: formData.name, badge: parseInt(formData.badge, 10),
                    username: formData.username, password: formData.password,
                    type: parseInt(formData.type, 10)
                };
                await createUser(createData, authHeader);
                message.success(`User '${createData.username}' created successfully.`);
            }
            handleCloseUserFormModal();
            await loadUsers(); 
        } catch (err) {
            console.error("Error submitting user form:", err);
            setActionError(err.message || "Failed to save user.");
            setIsErrorModalOpen(true); 
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async (userId, username) => { /* ... (no change from previous where PROTECTED_ADMIN_ID delete was blocked) ... */ 
        if (userId === PROTECTED_ADMIN_ID) {
            message.error("The default admin user cannot be deleted.");
            return;
        }
        if (userId === currentUser?.id) {
            message.error("You cannot delete your own account through this interface.");
            return;
        }
        AntModal.confirm({ /* ... */ });
    };

    const handlePasswordResetSubmit = async (newPassword) => { // This is for an Admin resetting ANOTHER user's password
        if (!userToResetPassword || userToResetPassword.id === PROTECTED_ADMIN_ID) {
            // This check is defensive, the button for PROTECTED_ADMIN_ID should be disabled for this action
            message.error("Operation not permitted for this user via admin reset.");
            handleCloseResetPasswordModal();
            return;
        }
        
        setActionError('');
        const authHeader = getAuthHeader();
        if (!authHeader) {
             setActionError("Authentication error."); setIsErrorModalOpen(true); return;
        }
        setIsLoading(true);
        try {
            await adminResetUserPassword(userToResetPassword.id, newPassword, authHeader);
            message.success(`Password for user '${userToResetPassword.username}' has been reset successfully.`);
            handleCloseResetPasswordModal();
        } catch (err) {
            console.error("Error resetting password via admin function:", err);
            // This error will be displayed in the ResetPasswordForm's alert
            throw err; 
        } finally {
            setIsLoading(false);
        }
    };
    
    if (currentUser?.typeValue !== 0) { /* ... */ }
    
    const columns = [
        // ... (ID, Name, Username, Badge, Type columns remain the same) ...
        { title: 'ID', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id },
        { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Username', dataIndex: 'username', key: 'username', sorter: (a, b) => a.username.localeCompare(b.username) },
        { title: 'Badge', dataIndex: 'badge', key: 'badge', sorter: (a, b) => a.badge - b.badge },
        { 
            title: 'Type', dataIndex: 'type', key: 'type', 
            render: (type) => { /* ... */ 
                const role = getUserTypeString(type);
                let color = 'default';
                if (role === 'Admin') color = 'volcano';
                if (role === 'Professor') color = 'geekblue';
                if (role === 'Student') color = 'green';
                return <Tag color={color}>{role.toUpperCase()}</Tag>;
            },
            sorter: (a,b) => a.type - b.type,
            filters: [ { text: 'Admin', value: 0 }, { text: 'Professor', value: 1 }, { text: 'Student', value: 2 }, ],
            onFilter: (value, record) => record.type === value,
        },
        {
            title: 'Actions', key: 'actions', width: 250, // Adjusted width if needed
            render: (_, record) => {
                const isProtectedAdminRecord = record.id === PROTECTED_ADMIN_ID;
                const isSelf = record.id === currentUser?.id;

                if (isProtectedAdminRecord) {
                    return ( // Only show "Protected" text for the main admin row
                        <Tooltip title="Default admin user cannot be edited, deleted, or have password reset by other admins. Use 'Change My Password' in user menu for self-service.">
                            <span style={{ fontStyle: 'italic', color: '#888' }}>Protected Admin</span>
                        </Tooltip>
                    );
                }

                return (
                    <Space size="small">
                        <Button 
                            icon={<EditOutlined />} 
                            onClick={() => handleOpenModalForEdit(record)}
                        >
                            Edit
                        </Button>
                        <Button 
                            icon={<UndoOutlined />} 
                            onClick={() => handleOpenResetPasswordModal(record)}
                        >
                            Reset Pwd
                        </Button>
                        <Button 
                            icon={<DeleteOutlined />} 
                            danger 
                            onClick={() => handleDeleteUser(record.id, record.username)}
                            disabled={isSelf} // Any admin cannot delete themselves from this list
                        >
                            Delete
                        </Button>
                    </Space>
                );
            }
        },
    ];

    return (
        <div>
            {/* ... (Title, Add New User Button, Error Alert, Table, Modals remain structurally similar) ... */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Title level={2} style={{margin:0}}>Users Management</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModalForCreate}> Add New User </Button>
            </div>
            {pageError && <Alert message={pageError} type="error" showIcon style={{marginBottom: 16}}/>}
            <Table columns={columns} dataSource={users} rowKey="id" loading={isLoading && users.length === 0} bordered size="middle" pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }} />
            
            <AntModal title={editingUser ? `Edit User: ${editingUser.username}` : 'Add New User'} open={isUserFormModalOpen} onCancel={handleCloseUserFormModal} footer={null} destroyOnClose >
                <UserForm key={editingUser ? `edit-${editingUser.id}` : 'create'} initialUser={editingUser} onSubmitForm={handleUserFormSubmit} onCancel={handleCloseUserFormModal} isEditMode={!!editingUser} />
            </AntModal>
            
            <AntModal title="Reset User Password" open={isResetPasswordModalOpen} onCancel={handleCloseResetPasswordModal} footer={null} destroyOnClose >
                {userToResetPassword && ( <ResetPasswordForm targetUsername={userToResetPassword.username} onFinishReset={handlePasswordResetSubmit} onCancel={handleCloseResetPasswordModal} /> )}
            </AntModal>
            
            <ErrorModal isOpen={isErrorModalOpen} onClose={handleCloseErrorModal} errorMessage={actionError} />
        </div>
    );
};

export default UsersPage;