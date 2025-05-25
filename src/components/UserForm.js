// src/components/UserForm.js
import React, { useState, useEffect } from 'react';

const UserForm = ({ initialUser, onSubmitForm, onCancel, isEditMode }) => {
    const [formData, setFormData] = useState({
        name: '',
        badge: '',
        username: '',
        password: '',
        type: 2, // Default to Student
    });
    // This error state is now primarily for client-side validation errors within the form
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (isEditMode && initialUser) {
            setFormData({
                name: initialUser.name || '',
                badge: initialUser.badge !== undefined ? String(initialUser.badge) : '',
                username: initialUser.username || '',
                password: '', 
                type: initialUser.type !== undefined ? initialUser.type : 2,
            });
        } else {
            setFormData({ name: '', badge: '', username: '', password: '', type: 2 });
        }
        setFormError(''); // Clear errors when initialUser or mode changes
    }, [initialUser, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'type' || name === 'badge') ? parseInt(value, 10) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(''); // Clear previous client-side errors
        
        // Client-side validation
        if (!formData.name || !formData.username || (!isEditMode && !formData.password) || formData.badge === '') {
            setFormError('Please fill in all required fields.');
            return;
        }
        if (isNaN(formData.badge) || formData.badge < 0) {
            setFormError('Badge must be a non-negative number.');
            return;
        }
        // Add any other client-side password strength checks here if desired,
        // though the backend is the ultimate authority.
        // Example: if (!isEditMode && formData.password.length < 8) {
        //     setFormError('Password must be at least 8 characters long.');
        //     return;
        // }


        const dataToSend = { ...formData };
        dataToSend.badge = parseInt(dataToSend.badge, 10);
        dataToSend.type = parseInt(dataToSend.type, 10);

        try {
            if (isEditMode) {
                const { username, password, ...updateData } = dataToSend;
                await onSubmitForm(updateData); // onSubmitForm will throw if API error occurs
            } else {
                await onSubmitForm(dataToSend); // onSubmitForm will throw if API error occurs
            }
        } catch (err) {
            // This catch block might not be strictly necessary here anymore if UsersPage handles all API errors.
            // However, if onSubmitForm could throw client-side errors before an API call, it might be useful.
            // For API errors, UsersPage will catch them and use ErrorModal.
            setFormError(err.message || 'An unexpected error occurred.');
            console.error("Error caught in UserForm handleSubmit (should be rare if parent handles API errors):", err);
        }
    };
    
    const userTypes = [
        { value: 0, label: 'Admin' },
        { value: 1, label: 'Professor' },
        { value: 2, label: 'Student' },
    ];

    return (
        <form onSubmit={handleSubmit}>
            {/* Display client-side form validation errors here */}
            {formError && (
                <p style={{ 
                    color: '#721c24', 
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    padding: '10px',
                    borderRadius: '4px',
                    marginBottom: '10px', 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}>
                    {formError}
                </p>
            )}
            <div style={{ marginBottom: '10px' }}>
                <label htmlFor="name-input" style={{display: 'block', marginBottom:'5px'}}>Name:</label>
                <input id="name-input" type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div style={{ marginBottom: '10px' }}>
                <label htmlFor="badge-input" style={{display: 'block', marginBottom:'5px'}}>Badge Number:</label>
                <input id="badge-input" type="number" name="badge" value={formData.badge} onChange={handleChange} required min="0" disabled={isEditMode} />
            </div>
            <div style={{ marginBottom: '10px' }}>
                <label htmlFor="username-input" style={{display: 'block', marginBottom:'5px'}}>Username:</label>
                <input id="username-input" type="text" name="username" value={formData.username} onChange={handleChange} required disabled={isEditMode} />
            </div>
            {!isEditMode && (
                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="password-input" style={{display: 'block', marginBottom:'5px'}}>Password:</label>
                    <input id="password-input" type="password" name="password" value={formData.password} onChange={handleChange} required={!isEditMode} />
                </div>
            )}
            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="type-select" style={{display: 'block', marginBottom:'5px'}}>User Type:</label>
                <select id="type-select" name="type" value={formData.type} onChange={handleChange}>
                    {userTypes.map(typeOpt => (
                        <option key={typeOpt.value} value={typeOpt.value}>{typeOpt.label}</option>
                    ))}
                </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={onCancel} style={{ backgroundColor: '#6c757d', color: 'white' }}>Cancel</button>
                <button type="submit" style={{ backgroundColor: isEditMode ? '#ffc107' : '#28a745', color: isEditMode ? 'black' : 'white' }}>
                    {isEditMode ? 'Update User' : 'Create User'}
                </button>
            </div>
        </form>
    );
};

export default UserForm;