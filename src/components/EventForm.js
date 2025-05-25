// src/components/EventForm.js
import React, { useState, useEffect } from 'react';

const EventForm = ({ initialEvent, onSubmitForm, onCancel, isEditMode }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 0, // Default to Lesson (EventType enum: 0:Lesson, 1:Conference, 2:Lab)
    });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (isEditMode && initialEvent) {
            setFormData({
                name: initialEvent.name || '',
                type: initialEvent.type !== undefined ? initialEvent.type : 0,
            });
        } else {
            // Reset for create mode
            setFormData({ name: '', type: 0 });
        }
        setFormError(''); // Clear errors when initialEvent or mode changes
    }, [initialEvent, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'type' ? parseInt(value, 10) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!formData.name) {
            setFormError('Event name is required.');
            return;
        }
        // The backend will set UserId based on authenticated professor
        // EventCreateDto: Name, Type
        // EventUpdateDto: Name, Type
        try {
            await onSubmitForm(formData);
        } catch (err) {
            setFormError(err.message || 'An error occurred saving the event.');
        }
    };

    const eventTypes = [
        { value: 0, label: 'Lesson' },
        { value: 1, label: 'Conference' },
        { value: 2, label: 'Lab' },
    ]; // Based on GenericEnums.cs

    return (
        <form onSubmit={handleSubmit}>
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
            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="event-name-input" style={{display: 'block', marginBottom:'5px', fontWeight: 'bold'}}>Event Name:</label>
                <input 
                    id="event-name-input" 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    style={{width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc'}}
                />
            </div>
            <div style={{ marginBottom: '25px' }}>
                <label htmlFor="event-type-select" style={{display: 'block', marginBottom:'5px', fontWeight: 'bold'}}>Event Type:</label>
                <select 
                    id="event-type-select" 
                    name="type" 
                    value={formData.type} 
                    onChange={handleChange}
                    style={{width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc'}}
                >
                    {eventTypes.map(typeOpt => (
                        <option key={typeOpt.value} value={typeOpt.value}>{typeOpt.label}</option>
                    ))}
                </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={onCancel} style={{ backgroundColor: '#6c757d', color: 'white', padding: '10px 15px', borderRadius: '4px', border: 'none' }}>Cancel</button>
                <button type="submit" style={{ backgroundColor: isEditMode ? '#ffc107' : '#28a745', color: isEditMode ? 'black' : 'white', padding: '10px 15px', borderRadius: '4px', border: 'none' }}>
                    {isEditMode ? 'Update Event' : 'Create Event'}
                </button>
            </div>
        </form>
    );
};

export default EventForm;