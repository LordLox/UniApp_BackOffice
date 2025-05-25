// src/components/EventParticipantsModal.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Modal from './Modal';
import { useAuth } from '../contexts/AuthContext';
import { fetchEventParticipationHistory } from '../api/eventService';
import parseISO from 'date-fns/parseISO';
import format from 'date-fns/format'; // Ensure this import is present and correct
import enUS from 'date-fns/locale/en-US'; // Ensure this import is present and correct
// import { format, parseISO } from 'date-fns'; // Alternative combined import
// import { enUS } from 'date-fns/locale'; // Alternative combined import for locale

const EventParticipantsModal = ({ isOpen, onClose, event }) => {
    const { getAuthHeader, currentUser } = useAuth();
    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const veryStartDate = new Date(2000, 0, 1).getTime();
    const veryEndDate = new Date(2100, 0, 1).getTime();

    const loadParticipants = useCallback(async () => {
        if (!isOpen || !event || !currentUser) return;
        setIsLoading(true);
        setError('');
        const authHeader = getAuthHeader();

        if (!authHeader) {
            setError("Authentication required.");
            setIsLoading(false);
            return;
        }

        try {
            let targetProfessorIdForHistory = null;
            if (currentUser.typeValue === 0) { 
                targetProfessorIdForHistory = event.userId;
                 console.warn(`Admin viewing event (ID: ${event.id}) by Professor (ID: ${event.userId}). Backend /events/entry/history needs to support scoping for this admin request.`);
            }

            const historyData = await fetchEventParticipationHistory(
                authHeader,
                veryStartDate, 
                veryEndDate,
                'UTC',
                'en-US',
                targetProfessorIdForHistory 
            );
            
            const eventSpecificParticipations = historyData.filter(
                item => item.eventName === event.name
            );

            setParticipants(eventSpecificParticipations);
        } catch (err) {
            console.error(`Error fetching participations for event "${event.name}":`, err);
            setError(err.message || "Failed to load participations.");
        } finally {
            setIsLoading(false);
        }
    }, [isOpen, event, getAuthHeader, currentUser, veryStartDate, veryEndDate]); 

    useEffect(() => {
        if (isOpen && event) {
            loadParticipants();
        } else {
            setParticipants([]);
            setSearchTerm('');
            setError('');
        }
    }, [isOpen, event, loadParticipants]);

    const filteredParticipants = useMemo(() => {
        if (!searchTerm) return participants;
        const lowerSearchTerm = searchTerm.toLowerCase();
        return participants.filter(p => 
            (p.userName && p.userName.toLowerCase().includes(lowerSearchTerm)) ||
            (p.userBirthName && p.userBirthName.toLowerCase().includes(lowerSearchTerm)) ||
            (p.userBadge && String(p.userBadge).includes(lowerSearchTerm)) ||
            // Check if p.eventEntryDate exists before trying to format it
            (p.eventEntryDate && format(parseISO(p.eventEntryDate), 'Pp', { locale: enUS }).toLowerCase().includes(lowerSearchTerm))
        );
    }, [participants, searchTerm]);

    const formatEntryDate = (dateString) => {
        try {
            // Ensure dateString is valid before parsing
            if (!dateString) return "N/A";
            return format(parseISO(dateString), 'Pp', { locale: enUS }); // 'Pp' is a common format like '07/25/2024, 1:00 PM'
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return "Invalid Date";
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Participants for: ${event?.name || ''}`}>
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="Search participants (name, username, badge, date)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                />
            </div>
            {isLoading && <p>Loading participants...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!isLoading && !error && (
                filteredParticipants.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{border:'1px solid #ddd', padding:'8px', textAlign:'left'}}>Name</th>
                                    <th style={{border:'1px solid #ddd', padding:'8px', textAlign:'left'}}>Username</th>
                                    <th style={{border:'1px solid #ddd', padding:'8px', textAlign:'left'}}>Badge</th>
                                    <th style={{border:'1px solid #ddd', padding:'8px', textAlign:'left'}}>Entry Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredParticipants.map((p, index) => (
                                    // Using a more robust key if userBadge and eventEntryDate might not be unique enough in some edge cases.
                                    // If HistoryDto has a unique ID per entry, that would be best.
                                    <tr key={`${p.userBadge}-${p.userName}-${p.eventEntryDate}-${index}`}> 
                                        <td style={{border:'1px solid #ddd', padding:'8px'}}>{p.userBirthName}</td>
                                        <td style={{border:'1px solid #ddd', padding:'8px'}}>{p.userName}</td>
                                        <td style={{border:'1px solid #ddd', padding:'8px'}}>{p.userBadge}</td>
                                        <td style={{border:'1px solid #ddd', padding:'8px'}}>{formatEntryDate(p.eventEntryDate)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>No participants found for this event{searchTerm ? ' matching your search.' : '.'}</p>
                )
            )}
        </Modal>
    );
};

export default EventParticipantsModal;