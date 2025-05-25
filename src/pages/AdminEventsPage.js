// src/pages/AdminEventsPage.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchAllEvents } from '../api/eventService'; // Uses /events which returns EventSummaryDto
import EventParticipantsModal from '../components/EventParticipantsModal';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import addHours from 'date-fns/addHours'; // For placeholder end date
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse: (dateStr) => parseISO(dateStr),
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const AdminEventsPage = () => {
    const { currentUser, getAuthHeader } = useAuth();
    const [allEvents, setAllEvents] = useState([]); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [selectedEventForModal, setSelectedEventForModal] = useState(null); 
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);

    const eventTypeToString = (typeValue) => {
        const types = { 0: 'Lesson', 1: 'Conference', 2: 'Lab' };
        return types[typeValue] || 'Unknown';
    };
    
    const loadAllEvents = useCallback(async () => {
        if (!currentUser || currentUser.typeValue !== 0) { 
            setError("Access Denied: This page is for Admins only.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError('');
        const authHeader = getAuthHeader();
        if (!authHeader) {
            setError("Authentication required.");
            setIsLoading(false);
            return;
        }

        try {
            const eventsSummaries = await fetchAllEvents(authHeader); 
            
            const formattedForCalendar = eventsSummaries.map((eventSummary, index) => {
                const today = new Date();
                // Use actual dates from DTO if available, otherwise placeholders
                const startDate = eventSummary.startDate 
                    ? parseISO(eventSummary.startDate) 
                    : new Date(today.getFullYear(), today.getMonth(), today.getDate() + index);
                
                const endDate = eventSummary.endDate 
                    ? parseISO(eventSummary.endDate) 
                    : (eventSummary.allDay || !eventSummary.startDate) 
                        ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1) 
                        : addHours(startDate, 1);
                
                const allDay = eventSummary.allDay !== undefined ? eventSummary.allDay : !eventSummary.startDate;

                return {
                    id: eventSummary.id,
                    title: `${eventSummary.name} (Type: ${eventTypeToString(eventSummary.type)}, Prof: ${eventSummary.userName})`, 
                    start: startDate,
                    end: endDate,    
                    allDay: allDay,     
                    resource: eventSummary,  
                };
            });
            setAllEvents(formattedForCalendar);
        } catch (err) {
            console.error("Error fetching all events for admin:", err);
            setError(err.message || "Failed to load events.");
            setAllEvents([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, getAuthHeader]);

    useEffect(() => {
        if (currentUser && currentUser.typeValue === 0) { 
            loadAllEvents();
        }
    }, [currentUser, loadAllEvents]);

    const handleSelectEvent = (calendarEvent) => {
        setSelectedEventForModal(calendarEvent.resource); 
        setIsParticipantsModalOpen(true);
    };

    const handleCloseParticipantsModal = () => {
        setIsParticipantsModalOpen(false);
        setSelectedEventForModal(null);
    };

    const memoizedCalendarEvents = useMemo(() => allEvents, [allEvents]);
    
    if (!currentUser || currentUser.typeValue !== 0) {
        return <p style={{ color: 'red', padding: '20px' }}>{error || "Access Denied."}</p>;
    }
    
    return (
        <div>
            <h2>Admin - All Events Calendar & Logs</h2>
            {isLoading && <p>Loading all events...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!isLoading && !error && (
                 allEvents.length === 0 ? <p>No events found in the system.</p> :
                <div style={{ height: '600px', backgroundColor: 'white', padding: '10px', borderRadius:'4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <Calendar
                        localizer={localizer}
                        events={memoizedCalendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        views={['month', 'week', 'day', 'agenda']}
                        onSelectEvent={handleSelectEvent}
                        selectable
                    />
                </div>
            )}

            {selectedEventForModal && (
                <EventParticipantsModal
                    isOpen={isParticipantsModalOpen}
                    onClose={handleCloseParticipantsModal}
                    event={selectedEventForModal} // selectedEventForModal is an EventSummaryDto
                />
            )}
        </div>
    );
};

export default AdminEventsPage;