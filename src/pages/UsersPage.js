// src/pages/UsersPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUsers, createUser, updateUser, adminResetUserPassword, deleteUser } from '../api/userService'; // Ensured deleteUser is imported
import { Table, Button, Space, Modal as AntModal, Tag, message, Typography, Alert, Tooltip } from 'antd'; 
import { EditOutlined, DeleteOutlined, UndoOutlined, PlusOutlined } from '@ant-design/icons';
import UserForm from '../components/UserForm';
import ResetPasswordForm from '../components/ResetPasswordForm';
import ErrorModal from '../components/ErrorModal'; 

const { Title } = Typography;

// This constant defines the ID of an admin user that should not be deleted or easily modified.
const PROTECTED_ADMIN_ID = 1; 

const UsersPage = () => {
    const { getAuthHeader, getUserTypeString, currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pageError, setPageError] = useState(''); // For errors like failing to load users initially
    const [isUserFormModalOpen, setIsUserFormModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null); // User object for editing
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [userToResetPassword, setUserToResetPassword] = useState(null); // User object for password reset
    const [actionError, setActionError] = useState(''); // For errors from specific actions like create/update/delete/reset
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

    // Callback to load users from the API
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
            setUsers(data || []); // Ensure users is always an array
        } catch (err) {
            setPageError(err.message || "Failed to fetch users.");
            console.error("Error fetching users:", err);
            setUsers([]); 
        } finally {
            setIsLoading(false);
        }
    }, [getAuthHeader]); // getAuthHeader is stable

    // Effect to load users when the component mounts or currentUser changes (if admin)
    useEffect(() => { 
        if (currentUser && currentUser.typeValue === 0) { // 0 for Admin
            loadUsers();
        } else if (currentUser) {
            // If logged in but not admin, show access denied message for this page
            setPageError("Access Denied: You are not authorized to manage users.");
        }
        // If not currentUser, AuthContext/ProtectedRoute should handle redirection to login
    }, [currentUser, loadUsers]); // loadUsers is stable due to useCallback

    // Handlers for UserForm modal (Create/Edit)
    const handleOpenModalForCreate = () => { 
        setEditingUser(null); // Clear any previous editing state
        setIsUserFormModalOpen(true);
    };
    const handleOpenModalForEdit = (user) => { 
        // Prevent editing the protected admin user through this form
        if (user.id === PROTECTED_ADMIN_ID) { 
            message.info("The default admin user's details cannot be edited here. Use 'Change My Password' for password.");
            return;
        }
        setEditingUser(user);
        setIsUserFormModalOpen(true);
    };
    const handleCloseUserFormModal = () => { 
        setIsUserFormModalOpen(false);
        setEditingUser(null); // Clear editing state
    };

    // Handler for closing the generic error modal
    const handleCloseErrorModal = () => { 
        setIsErrorModalOpen(false);
        setActionError(''); // Clear the error message
    };
    
    // Handlers for ResetPasswordForm modal
    const handleOpenResetPasswordModal = (user) => {
        // Prevent resetting password for the protected admin via this admin function
        if (user.id === PROTECTED_ADMIN_ID) { 
             message.error("The default admin's password cannot be reset using this function. The admin should use 'Change My Password'.");
             return;
        }
        setUserToResetPassword(user);
        setIsResetPasswordModalOpen(true);
    };
    const handleCloseResetPasswordModal = () => {
        setIsResetPasswordModalOpen(false);
        setUserToResetPassword(null); // Clear state
    };

    // Handler for UserForm submission (Create or Update)
    const handleUserFormSubmit = async (formData) => { 
        setActionError(''); // Clear previous action errors
        const authHeader = getAuthHeader();
        if (!authHeader) {
            setActionError("Authentication error. Cannot save user."); 
            setIsErrorModalOpen(true); 
            return;
        }
        setIsLoading(true); // Indicate loading state for the submit operation
        try {
            if (editingUser) { 
                // Update existing user
                if (editingUser.id === PROTECTED_ADMIN_ID) { // Double-check protection
                    message.error("Default admin user cannot be edited.");
                    setIsLoading(false);
                    handleCloseUserFormModal();
                    return;
                }
                // For update, typically only name and type are updatable via this form
                // Username (login) and badge are often fixed after creation or managed elsewhere
                const updateData = { name: formData.name, type: parseInt(formData.type, 10) };
                await updateUser(editingUser.id, updateData, authHeader);
                message.success(`User '${editingUser.username}' updated successfully.`);
            } else { 
                // Create new user
                 const createData = {
                    name: formData.name, 
                    badge: parseInt(formData.badge, 10),
                    username: formData.username, 
                    password: formData.password, // Password only for create
                    type: parseInt(formData.type, 10)
                };
                await createUser(createData, authHeader);
                message.success(`User '${createData.username}' created successfully.`);
            }
            handleCloseUserFormModal(); // Close modal on success
            await loadUsers(); // Refresh the user list
        } catch (err) {
            console.error("Error submitting user form:", err);
            setActionError(err.message || "Failed to save user. Check details and try again.");
            setIsErrorModalOpen(true); // Show error in the generic error modal
        } finally {
            setIsLoading(false);
        }
    };

    // Handler for deleting a user
    const handleDeleteUser = async (userId, username) => { 
        // Log entry into the function and relevant IDs for debugging
        console.log(`handleDeleteUser called. User ID to delete: ${userId}, Username: ${username}`);
        console.log(`Current logged-in user ID: ${currentUser?.id}, Protected Admin ID: ${PROTECTED_ADMIN_ID}`);

        // Prevent deletion of the protected admin user
        if (userId === PROTECTED_ADMIN_ID) {
            console.log("Condition met: userId === PROTECTED_ADMIN_ID. Modal will not be shown.");
            message.error("The default admin user cannot be deleted.");
            return;
        }
        // Prevent a user from deleting their own account through this admin interface
        if (userId === currentUser?.id) {
            console.log("Condition met: userId === currentUser?.id. Modal will not be shown.");
            message.error("You cannot delete your own account through this interface.");
            return;
        }

        // If the above conditions are not met, proceed to show the confirmation modal
        console.log("Conditions for early exit not met. Proceeding to AntModal.confirm.");
        AntModal.confirm({
            title: `Delete User: ${username}`,
            content: `Are you sure you want to delete the user '${username}' (ID: ${userId})? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            // onOk is called when the user clicks 'Delete' in the modal
            onOk: async () => {
                console.log(`User confirmed deletion for ID: ${userId}`);
                setActionError(''); // Clear previous action errors
                const authHeader = getAuthHeader();
                if (!authHeader) {
                    setActionError("Authentication error. Cannot delete user.");
                    setIsErrorModalOpen(true);
                    return; // Exit if no auth header
                }
                setIsLoading(true); // Indicate loading for the delete operation
                try {
                    await deleteUser(userId, authHeader); // API call to delete
                    message.success(`User '${username}' (ID: ${userId}) deleted successfully.`);
                    await loadUsers(); // Refresh the user list
                } catch (err) {
                    console.error(`Error deleting user ${username} (ID: ${userId}):`, err);
                    setActionError(err.message || `Failed to delete user '${username}'.`);
                    setIsErrorModalOpen(true); // Show error in the generic error modal
                } finally {
                    setIsLoading(false);
                }
            },
            // onCancel is called when the user clicks 'Cancel' or closes the modal
            onCancel: () => {
                console.log(`User cancelled deletion for ID: ${userId}`);
            },
        });
    };

    // Handler for password reset submission by an admin for another user
    const handlePasswordResetSubmit = async (newPassword) => { 
        if (!userToResetPassword || userToResetPassword.id === PROTECTED_ADMIN_ID) {
            // This check is mostly defensive as the button should be disabled or modal not opened
            message.error("Operation not permitted for this user via admin reset.");
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
            // API call to reset password for the selected user
            await adminResetUserPassword(userToResetPassword.id, newPassword, authHeader);
            message.success(`Password for user '${userToResetPassword.username}' has been reset successfully.`);
            handleCloseResetPasswordModal(); // Close modal on success
        } catch (err) {
            console.error("Error resetting password via admin function:", err);
            // The ResetPasswordForm component itself might display specific errors from its own validation,
            // but this catch is for API errors from the service call.
            // We re-throw to allow ResetPasswordForm to potentially catch and display it, or rely on its own error handling.
            throw err; 
        } finally {
            setIsLoading(false);
        }
    };
    
    // If the current user is not an Admin, render an access denied message.
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
    
    // Configuration for the user table columns
    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id },
        { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Username', dataIndex: 'username', key: 'username', sorter: (a, b) => a.username.localeCompare(b.username) },
        { title: 'Badge', dataIndex: 'badge', key: 'badge', sorter: (a, b) => a.badge - b.badge },
        { 
            title: 'Type', dataIndex: 'type', key: 'type', 
            render: (type) => { 
                const role = getUserTypeString(type);
                let color = 'default';
                if (role === 'Admin') color = 'volcano';
                else if (role === 'Professor') color = 'geekblue';
                else if (role === 'Student') color = 'green';
                return <Tag color={color}>{role.toUpperCase()}</Tag>;
            },
            sorter: (a,b) => a.type - b.type,
            // Filters for user type
            filters: [ 
                { text: 'Admin', value: 0 }, 
                { text: 'Professor', value: 1 }, 
                { text: 'Student', value: 2 }, 
            ],
            onFilter: (value, record) => record.type === value,
        },
        {
            title: 'Actions', key: 'actions', width: 250, // Adjusted width to fit buttons
            render: (_, record) => { // record is the user object for the current row
                const isProtectedAdminRecord = record.id === PROTECTED_ADMIN_ID;
                const isSelf = record.id === currentUser?.id; // Is the record the currently logged-in user?

                // Special handling for the protected admin row in the table
                if (isProtectedAdminRecord) {
                    return ( 
                        <Tooltip title="Default admin user cannot be edited, deleted, or have password reset by other admins. Use 'Change My Password' in user menu for self-service.">
                            <span style={{ fontStyle: 'italic', color: '#888' }}>Protected Admin</span>
                        </Tooltip>
                    );
                }

                // For all other users, render action buttons
                return (
                    <Space size="small">
                        <Button 
                            icon={<EditOutlined />} 
                            onClick={() => handleOpenModalForEdit(record)}
                            // Edit button is implicitly disabled for PROTECTED_ADMIN_ID by the check above
                        >
                            Edit
                        </Button>
                        <Button 
                            icon={<UndoOutlined />} 
                            onClick={() => handleOpenResetPasswordModal(record)}
                            // Reset Pwd button is implicitly disabled for PROTECTED_ADMIN_ID by the check above
                        >
                            Reset Pwd
                        </Button>
                        <Button 
                            icon={<DeleteOutlined />} 
                            danger 
                            onClick={() => handleDeleteUser(record.id, record.username)}
                            disabled={isSelf} // Disable deleting oneself
                            // Delete button is implicitly disabled for PROTECTED_ADMIN_ID by the check above
                        >
                            Delete
                        </Button>
                    </Space>
                );
            }
        },
    ];

    // Main render for the UsersPage component
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Title level={2} style={{margin:0}}>Users Management</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModalForCreate}> Add New User </Button>
            </div>

            {/* Display page-level errors (e.g., initial load failure) */}
            {pageError && <Alert message={pageError} type="error" showIcon style={{marginBottom: 16}}/>}

            <Table 
                columns={columns} 
                dataSource={users} 
                rowKey="id" 
                loading={isLoading && users.length === 0} // Show loading indicator on table
                bordered 
                size="middle" 
                pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }} 
            />
            
            {/* Modal for Creating/Editing Users */}
            <AntModal 
                title={editingUser ? `Edit User: ${editingUser.username}` : 'Add New User'} 
                open={isUserFormModalOpen} 
                onCancel={handleCloseUserFormModal} 
                footer={null} // Custom footer buttons are in UserForm
                destroyOnClose // Re-mount UserForm each time to reset its internal state correctly
            >
                <UserForm 
                    key={editingUser ? `edit-${editingUser.id}` : 'create'} // Ensure form re-renders with new initial data
                    initialUser={editingUser} 
                    onSubmitForm={handleUserFormSubmit} 
                    onCancel={handleCloseUserFormModal} 
                    isEditMode={!!editingUser} 
                />
            </AntModal>
            
            {/* Modal for Resetting User Password */}
            <AntModal 
                title="Reset User Password" 
                open={isResetPasswordModalOpen} 
                onCancel={handleCloseResetPasswordModal} 
                footer={null} // Custom footer buttons are in ResetPasswordForm
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
            
            {/* Generic Modal for Displaying Action Errors */}
            <ErrorModal 
                isOpen={isErrorModalOpen} 
                onClose={handleCloseErrorModal} 
                errorMessage={actionError} 
            />
        </div>
    );
};

export default UsersPage;
