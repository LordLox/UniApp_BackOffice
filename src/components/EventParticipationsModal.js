// src/components/EventParticipantsModal.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Modal from './Modal';
import { useAuth } from '../contexts/AuthContext';
import { fetchEventParticipationHistory } from '../api/eventService';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import enUS from 'date-fns/locale/en-US';

const EventParticipantsModal = ({ isOpen, onClose, event }) => { // event is EventSummaryDto
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
            if (currentUser.typeValue === 0) { // If Admin
                targetProfessorIdForHistory = event.userId; // userId from EventSummaryDto is the professor's ID
                console.warn(`Admin viewing participants for event (ID: ${event.id}, Name: ${event.name}) by Professor (ID: ${event.userId}). Ensure backend /events/entry/history supports this scoping.`);
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
            (p.eventEntryDate && format(parseISO(p.eventEntryDate), 'Pp', { locale: enUS }).toLowerCase().includes(lowerSearchTerm))
        );
    }, [participants, searchTerm]);

    const formatEntryDate = (dateString) => {
        try {
            if (!dateString) return "N/A";
            return format(parseISO(dateString), 'Pp', { locale: enUS });
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