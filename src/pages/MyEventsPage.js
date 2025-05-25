// src/pages/MyEventsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchMyEvents, createEvent, updateEvent, deleteEvent } from '../api/eventService';
import EventParticipationsModal from '../components/EventParticipationsModal';
import Modal from '../components/Modal'; 
import EventForm from '../components/EventForm'; 
import ErrorModal from '../components/ErrorModal'; 

const MyEventsPage = () => {
    const { currentUser, getAuthHeader } = useAuth();
    const [myEvents, setMyEvents] = useState([]); // Will store EventSummaryDto
    const [isLoading, setIsLoading] = useState(false);
    const [pageError, setPageError] = useState('');

    const [selectedEventForParticipations, setSelectedEventForParticipations] = useState(null); // Will be EventSummaryDto
    const [isParticipationsModalOpen, setIsParticipationsModalOpen] = useState(false);

    const [isEventFormModalOpen, setIsEventFormModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null); // Will be EventSummaryDto for edit
    
    const [actionError, setActionError] = useState('');
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

    const eventTypeToString = (typeValue) => {
        const types = { 0: 'Lesson', 1: 'Conference', 2: 'Lab' }; 
        return types[typeValue] || 'Unknown';
    };

    const loadMyEvents = useCallback(async () => {
        if (!currentUser || currentUser.typeValue !== 1) { 
            setPageError("Access Denied: This page is for professors only.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setPageError('');
        const authHeader = getAuthHeader();
        if (!authHeader) {
            setPageError("Authentication required.");
            setIsLoading(false);
            return;
        }

        try {
            const data = await fetchMyEvents(authHeader); // Now returns List<EventSummaryDto>
            setMyEvents(data || []);
        } catch (err) {
            console.error("Error fetching professor's events:", err);
            setPageError(err.message || "Failed to load your events.");
            setMyEvents([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, getAuthHeader]);

    useEffect(() => {
        if (currentUser && currentUser.typeValue === 1) { // Only load if professor
             loadMyEvents();
        }
    }, [currentUser, loadMyEvents]);

    const handleOpenEventFormForCreate = () => {
        setEditingEvent(null);
        setIsEventFormModalOpen(true);
    };

    const handleOpenEventFormForEdit = (eventSummary) => { // eventSummary is EventSummaryDto
        setEditingEvent(eventSummary);
        setIsEventFormModalOpen(true);
    };

    const handleCloseEventFormModal = () => {
        setIsEventFormModalOpen(false);
        setEditingEvent(null);
    };
    
    const handleCloseErrorModal = () => {
        setIsErrorModalOpen(false);
        setActionError('');
    };

    const handleEventFormSubmit = async (formData) => {
        setActionError('');
        const authHeader = getAuthHeader();
        if (!authHeader) {
            setActionError("Authentication error.");
            setIsErrorModalOpen(true);
            return;
        }
        setIsLoading(true); 
        try {
            const payload = { // Matches EventCreateDto and EventUpdateDto
                name: formData.name,
                type: formData.type
            };
            if (editingEvent) { 
                await updateEvent(editingEvent.id, payload, authHeader);
            } else { 
                await createEvent(payload, authHeader);
            }
            handleCloseEventFormModal();
            await loadMyEvents(); 
        } catch (err) {
            console.error("Error submitting event form:", err);
            setActionError(err.message || "Failed to save event.");
            setIsErrorModalOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event and all its participation records? This action cannot be undone.')) {
            setActionError('');
            const authHeader = getAuthHeader();
            if (!authHeader) {
                setActionError("Authentication error.");
                setIsErrorModalOpen(true);
                return;
            }
            setIsLoading(true);
            try {
                await deleteEvent(eventId, authHeader);
                await loadMyEvents(); 
            } catch (err) {
                console.error("Error deleting event:", err);
                setActionError(err.message || "Failed to delete event.");
                setIsErrorModalOpen(true);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleViewParticipations = (eventSummary) => { // eventSummary is EventSummaryDto
        setSelectedEventForParticipations(eventSummary);
        setIsParticipationsModalOpen(true);
    };

    const handleCloseParticipationsModal = () => {
        setIsParticipationsModalOpen(false);
        setSelectedEventForParticipations(null);
    };
        
    if (!currentUser || currentUser.typeValue !== 1) { 
        return <p style={{ color: 'red', padding: '20px' }}>{pageError || "Access Denied: This page is for professors only."}</p>;
    }
    
    if (isLoading && myEvents.length === 0) return <p>Loading your events...</p>;
    if (pageError && myEvents.length === 0) return <p style={{ color: 'red' }}>{pageError}</p>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>My Created Events</h2>
                <button onClick={handleOpenEventFormForCreate} style={{backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px'}}>Add New Event</button>
            </div>
            {pageError && <p style={{ color: 'red', marginBottom:'10px' }}>{pageError}</p>}
            
            {myEvents.length === 0 && !isLoading ? (
                <p>You have not created any events yet. Click "Add New Event" to start.</p>
            ) : (
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                        <tr>
                            <th style={{border:'1px solid #ddd', padding:'8px', textAlign:'left'}}>ID</th>
                            <th style={{border:'1px solid #ddd', padding:'8px', textAlign:'left'}}>Event Name</th>
                            <th style={{border:'1px solid #ddd', padding:'8px', textAlign:'left'}}>Type</th>
                            <th style={{border:'1px solid #ddd', padding:'8px', textAlign:'left'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myEvents.map(event => ( // event is now EventSummaryDto
                            <tr key={event.id}>
                                <td style={{border:'1px solid #ddd', padding:'8px'}}>{event.id}</td>
                                <td style={{border:'1px solid #ddd', padding:'8px'}}>{event.name}</td>
                                <td style={{border:'1px solid #ddd', padding:'8px'}}>{eventTypeToString(event.type)}</td>
                                <td style={{border:'1px solid #ddd', padding:'8px'}}>
                                    <button 
                                        onClick={() => handleViewParticipations(event)}
                                        style={{backgroundColor: '#17a2b8', color: 'white', border:'none', padding: '5px 10px', borderRadius:'4px', marginRight:'5px'}}
                                    >
                                        Participations
                                    </button>
                                    <button 
                                        onClick={() => handleOpenEventFormForEdit(event)}
                                        style={{backgroundColor: '#ffc107', color: 'black', border:'none', padding: '5px 10px', borderRadius:'4px', marginRight:'5px'}}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteEvent(event.id)}
                                        style={{backgroundColor: '#dc3545', color: 'white', border:'none', padding: '5px 10px', borderRadius:'4px'}}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <Modal isOpen={isEventFormModalOpen} onClose={handleCloseEventFormModal} title={editingEvent ? 'Edit Event' : 'Add New Event'}>
                <EventForm 
                    initialEvent={editingEvent} 
                    onSubmitForm={handleEventFormSubmit} 
                    onCancel={handleCloseEventFormModal}
                    isEditMode={!!editingEvent}
                />
            </Modal>
            {selectedEventForParticipations && (
                <EventParticipationsModal
                    isOpen={isParticipationsModalOpen}
                    onClose={handleCloseParticipationsModal}
                    event={selectedEventForParticipations} // Passes EventSummaryDto
                />
            )}
            <ErrorModal
                isOpen={isErrorModalOpen}
                onClose={handleCloseErrorModal}
                errorMessage={actionError}
            />
        </div>
    );
};

export default MyEventsPage;