// src/pages/ProfessorDashboardPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchMyEvents, fetchEventParticipationHistory } from '../api/eventService';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const ProfessorDashboardPage = () => {
    const { currentUser, getAuthHeader } = useAuth();
    const navigate = useNavigate();

    const [myEvents, setMyEvents] = useState([]);
    const [eventStats, setEventStats] = useState(null);
    const [participationStats, setParticipationStats] = useState({ totalParticipations: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const eventTypeToStringMap = { 0: 'Lesson', 1: 'Conference', 2: 'Lab' };

    const loadDashboardData = useCallback(async () => {
        if (!currentUser || currentUser.typeValue !== 1) { // Professor UserType is 1
            setError("Access Denied: This dashboard is for Professors only.");
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
            // Fetch professor's events
            const eventsData = await fetchMyEvents(authHeader);
            setMyEvents(eventsData || []);

            const typesCount = { Lesson: 0, Conference: 0, Lab: 0 };
            (eventsData || []).forEach(event => {
                const typeName = eventTypeToStringMap[event.type];
                if (typesCount[typeName] !== undefined) {
                    typesCount[typeName]++;
                }
            });
            setEventStats({
                totalEvents: (eventsData || []).length,
                types: typesCount,
            });

            // Fetch recent participation history (e.g., last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const now = new Date();

            const historyData = await fetchEventParticipationHistory(
                authHeader,
                thirtyDaysAgo.getTime(), // Convert to milliseconds
                now.getTime(),           // Convert to milliseconds
                'UTC', // Or user's timezone if available
                'en-US' // Or user's culture if available
            );
            setParticipationStats({
                totalParticipations: (historyData || []).length,
                // Could further process historyData for more detailed stats if needed
            });

        } catch (err) {
            console.error("Error loading professor dashboard data:", err);
            setError(err.message || "Failed to load dashboard data.");
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, getAuthHeader]); // Removed getUserTypeString as it's stable

    useEffect(() => {
        if (currentUser && currentUser.typeValue === 1) {
             loadDashboardData();
        }
    }, [currentUser, loadDashboardData]);

    if (!currentUser || currentUser.typeValue !== 1) { // Professor UserType is 1
        return <p style={{ color: 'red', padding: '20px' }}>{error || "Access Denied: This page is for Professors only."}</p>;
    }

    if (isLoading) return <p>Loading dashboard...</p>;
    
    const eventTypesChartData = eventStats ? {
        labels: Object.keys(eventStats.types),
        datasets: [{
            label: 'Event Types',
            data: Object.values(eventStats.types),
            backgroundColor: ['rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)'],
            borderColor: ['rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'],
            borderWidth: 1,
        }],
    } : { labels: [], datasets: [] };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'right', labels: { padding: 20 } },
            title: { display: true, text: 'My Event Types', font: {size: 16}, padding: { bottom: 10 } }
        }
    };
    
    const recentEvents = myEvents.slice(0, 5); // Display first 5 events as "recent"

    return (
        <div>
            <h2>Professor Dashboard</h2>
            <p>Welcome, {currentUser.name}! Here's an overview of your activities.</p>
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            {/* Summary Cards */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
                <div style={summaryCardStyle}>
                    <h3 style={summaryCardTitleStyle}>Total Events Created</h3>
                    <p style={summaryCardMetricStyle}>{eventStats ? eventStats.totalEvents : 'Loading...'}</p>
                </div>
                <div style={summaryCardStyle}>
                    <h3 style={summaryCardTitleStyle}>Participations (Last 30 Days)</h3>
                    <p style={summaryCardMetricStyle}>{participationStats.totalParticipations}</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {/* Event Types Chart */}
                {eventStats && eventStats.totalEvents > 0 && (
                    <div style={{ flex: '1 1 350px', minWidth: '300px', height: '350px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <div style={{height: '100%'}}>
                            <Doughnut options={chartOptions} data={eventTypesChartData} />
                        </div>
                    </div>
                )}

                {/* Quick Actions & Recent Events */}
                <div style={{ flex: '1 1 350px', minWidth: '300px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Quick Actions</h3>
                    <button 
                        onClick={() => navigate('/my-events')}
                        style={{display: 'block', width: '100%', padding: '12px', marginBottom: '15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem'}}
                    >
                        Manage My Events
                    </button>
                    {/* You can add a "Create New Event" button here that opens the modal directly if desired */}
                    
                    <h4 style={{ marginTop: '25px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>My Recent Events</h4>
                    {recentEvents.length > 0 ? (
                        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                            {recentEvents.map(event => (
                                <li key={event.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                                    {event.name} ({eventTypeToStringMap[event.type]})
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No events created yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Simple styles for summary cards
const summaryCardStyle = {
    flex: '1 1 200px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
};
const summaryCardTitleStyle = {
    margin: '0 0 10px 0',
    fontSize: '1rem',
    color: '#555',
};
const summaryCardMetricStyle = {
    margin: 0,
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#007bff',
};


export default ProfessorDashboardPage;