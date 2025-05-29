// src/pages/UsersPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUsers, createUser, updateUser, adminResetUserPassword, deleteUser } from '../api/userService';
// Import App from antd to use the useApp hook
// Import ExclamationCircleFilled for the modal icon
import { Table, Button, Space, Modal as AntModal, Tag, Typography, Alert, Tooltip, App } from 'antd'; 
import { EditOutlined, DeleteOutlined, UndoOutlined, PlusOutlined, ExclamationCircleFilled } from '@ant-design/icons'; // Added ExclamationCircleFilled
import UserForm from '../components/UserForm';
import ResetPasswordForm from '../components/ResetPasswordForm';
import ErrorModal from '../components/ErrorModal'; 

const { Title, Text } = Typography; // Added Text for modal content styling

const PROTECTED_ADMIN_ID = 1; 

const UsersPage = () => {
    const { modal, message: antMessage } = App.useApp(); 

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

    const loadUsers = useCallback(async () => { 
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

    useEffect(() => { 
        if (currentUser && currentUser.typeValue === 0) { 
            loadUsers();
        } else if (currentUser) {
            setPageError("Access Denied: You are not authorized to manage users.");
        }
    }, [currentUser, loadUsers]);

    const handleOpenModalForCreate = () => { 
        setEditingUser(null);
        setIsUserFormModalOpen(true);
    };

    const handleOpenModalForEdit = (user) => { 
        if (user.id === PROTECTED_ADMIN_ID) { 
            antMessage.info("The default admin user's details cannot be edited here. Use 'Change My Password' for password.");
            return;
        }
        setEditingUser(user);
        setIsUserFormModalOpen(true);
    };

    const handleCloseUserFormModal = () => { 
        setIsUserFormModalOpen(false);
        setEditingUser(null);
    };

    const handleCloseErrorModal = () => { 
        setIsErrorModalOpen(false);
        setActionError('');
    };
    
    const handleOpenResetPasswordModal = (user) => {
        if (user.id === PROTECTED_ADMIN_ID) { 
             antMessage.error("The default admin's password cannot be reset using this function. The admin should use 'Change My Password'.");
             return;
        }
        setUserToResetPassword(user);
        setIsResetPasswordModalOpen(true);
    };

    const handleCloseResetPasswordModal = () => {
        setIsResetPasswordModalOpen(false);
        setUserToResetPassword(null);
    };

    const handleUserFormSubmit = async (formData) => { 
        setActionError('');
        const authHeader = getAuthHeader();
        if (!authHeader) {
            setActionError("Authentication error. Cannot save user."); 
            setIsErrorModalOpen(true); 
            return;
        }
        setIsLoading(true); 
        try {
            if (editingUser) { 
                if (editingUser.id === PROTECTED_ADMIN_ID) {
                    antMessage.error("Default admin user cannot be edited.");
                    setIsLoading(false);
                    handleCloseUserFormModal();
                    return;
                }
                const updateData = { name: formData.name, type: parseInt(formData.type, 10) };
                await updateUser(editingUser.id, updateData, authHeader);
                antMessage.success(`User '${editingUser.username}' updated successfully.`);
            } else { 
                 const createData = {
                    name: formData.name, 
                    badge: parseInt(formData.badge, 10),
                    username: formData.username, 
                    password: formData.password,
                    type: parseInt(formData.type, 10)
                };
                await createUser(createData, authHeader);
                antMessage.success(`User '${createData.username}' created successfully.`);
            }
            handleCloseUserFormModal();
            await loadUsers(); 
        } catch (err) {
            console.error("Error submitting user form:", err);
            setActionError(err.message || "Failed to save user. Check details and try again.");
            setIsErrorModalOpen(true); 
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async (userId, username) => { 
        // Console logs for debugging can be removed or commented out in production
        // console.log(`handleDeleteUser called. User ID to delete: ${userId}, Username: ${username}`);
        // console.log(`Current logged-in user ID: ${currentUser?.id}, Protected Admin ID: ${PROTECTED_ADMIN_ID}`);

        if (userId === PROTECTED_ADMIN_ID) {
            // console.log("Condition met: userId === PROTECTED_ADMIN_ID. Modal will not be shown.");
            antMessage.error("The default admin user cannot be deleted.");
            return;
        }
        if (userId === currentUser?.id) {
            // console.log("Condition met: userId === currentUser?.id. Modal will not be shown.");
            antMessage.error("You cannot delete your own account through this interface.");
            return;
        }

        // console.log("Conditions for early exit not met. Proceeding to modal.confirm.");
        modal.confirm({
            title: 'Confirm Deletion',
            icon: <ExclamationCircleFilled style={{ color: '#faad14' }} />, // Warning icon
            content: (
                <div>
                    <Text>Are you sure you want to delete the user <Text strong>{username}</Text>?</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '0.9em' }}>This action cannot be undone.</Text>
                </div>
            ),
            okText: 'Delete User',
            okType: 'danger',
            cancelText: 'Cancel',
            centered: true, // Centers the modal on the screen
            onOk: async () => {
                // console.log(`User confirmed deletion for ID: ${userId}`);
                setActionError(''); 
                const authHeader = getAuthHeader();
                if (!authHeader) {
                    setActionError("Authentication error. Cannot delete user.");
                    setIsErrorModalOpen(true);
                    return; 
                }
                setIsLoading(true); 
                try {
                    await deleteUser(userId, authHeader); 
                    antMessage.success(`User '${username}' (ID: ${userId}) deleted successfully.`);
                    await loadUsers(); 
                } catch (err) {
                    console.error(`Error deleting user ${username} (ID: ${userId}):`, err);
                    setActionError(err.message || `Failed to delete user '${username}'.`);
                    setIsErrorModalOpen(true); 
                } finally {
                    setIsLoading(false);
                }
            },
            onCancel: () => {
                // console.log(`User cancelled deletion for ID: ${userId}`);
            },
        });
    };

    const handlePasswordResetSubmit = async (newPassword) => { 
        if (!userToResetPassword || userToResetPassword.id === PROTECTED_ADMIN_ID) {
            antMessage.error("Operation not permitted for this user via admin reset.");
            handleCloseResetPasswordModal();
            return;
        }
        
        setActionError('');
        const authHeader = getAuthHeader();
        if (!authHeader) {
             setActionError("Authentication error. Cannot reset password."); 
             setIsErrorModalOpen(true); 
             return;
        }
        setIsLoading(true);
        try {
            await adminResetUserPassword(userToResetPassword.id, newPassword, authHeader);
            antMessage.success(`Password for user '${userToResetPassword.username}' has been reset successfully.`);
            handleCloseResetPasswordModal(); 
        } catch (err) {
            console.error("Error resetting password via admin function:", err);
            throw err; 
        } finally {
            setIsLoading(false);
        }
    };
    
    if (currentUser?.typeValue !== 0) { 
        return (
            <div style={{ padding: '20px' }}>
                <Title level={2}>Users Management</Title>
                <Alert 
                    message={pageError || "Access Denied: You are not authorized to manage users."} 
                    type="error" 
                    showIcon 
                />
            </div>
        );
    }
    
    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id },
        { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Username', dataIndex: 'username', key: 'username', sorter: (a, b) => a.username.localeCompare(b.username) },
        { title: 'Badge', dataIndex: 'badge', key: 'badge', sorter: (a, b) => a.badge - b.badge },
        { 
            title: 'Type', dataIndex: 'type', key: 'type', 
            // Corrected syntax: removed the underscore after (type)
            render: (type) => { 
                const role = getUserTypeString(type);
                let color = 'default';
                if (role === 'Admin') color = 'volcano';
                else if (role === 'Professor') color = 'geekblue';
                else if (role === 'Student') color = 'green';
                return <Tag color={color}>{role.toUpperCase()}</Tag>;
            },
            sorter: (a,b) => a.type - b.type,
            filters: [ 
                { text: 'Admin', value: 0 }, 
                { text: 'Professor', value: 1 }, 
                { text: 'Student', value: 2 }, 
            ],
            onFilter: (value, record) => record.type === value,
        },
        {
            title: 'Actions', key: 'actions', width: 250, 
            render: (_, record) => { 
                const isProtectedAdminRecord = record.id === PROTECTED_ADMIN_ID;
                const isSelf = record.id === currentUser?.id; 

                if (isProtectedAdminRecord) {
                    return ( 
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
                            disabled={isSelf} 
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Title level={2} style={{margin:0}}>Users Management</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModalForCreate}> Add New User </Button>
            </div>

            {pageError && <Alert message={pageError} type="error" showIcon style={{marginBottom: 16}}/>}

            <Table 
                columns={columns} 
                dataSource={users} 
                rowKey="id" 
                loading={isLoading && users.length === 0} 
                bordered 
                size="middle" 
                pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }} 
            />
            
            <AntModal 
                title={editingUser ? `Edit User: ${editingUser.username}` : 'Add New User'} 
                open={isUserFormModalOpen} 
                onCancel={handleCloseUserFormModal} 
                footer={null} 
                destroyOnClose 
            >
                <UserForm 
                    key={editingUser ? `edit-${editingUser.id}` : 'create'} 
                    initialUser={editingUser} 
                    onSubmitForm={handleUserFormSubmit} 
                    onCancel={handleCloseUserFormModal} 
                    isEditMode={!!editingUser} 
                />
            </AntModal>
            
            <AntModal 
                title="Reset User Password" 
                open={isResetPasswordModalOpen} 
                onCancel={handleCloseResetPasswordModal} 
                footer={null} 
                destroyOnClose 
            >
                {userToResetPassword && ( 
                    <ResetPasswordForm 
                        targetUsername={userToResetPassword.username} 
                        onFinishReset={handlePasswordResetSubmit} 
                        onCancel={handleCloseResetPasswordModal} 
                    /> 
                )}
            </AntModal>
            
            <ErrorModal 
                isOpen={isErrorModalOpen} 
                onClose={handleCloseErrorModal} 
                errorMessage={actionError} 
            />
        </div>
    );
};

export default UsersPage;
