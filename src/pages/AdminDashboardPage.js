// src/pages/AdminDashboardPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUsers } from '../api/userService'; 
import { fetchAllEvents } from '../api/eventService'; // Returns EventSummaryDto
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const AdminDashboardPage = () => {
    const { currentUser, getAuthHeader, getUserTypeString } = useAuth();
    const [userStats, setUserStats] = useState(null);
    const [eventStats, setEventStats] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const eventTypeToStringMap = { 0: 'Lesson', 1: 'Conference', 2: 'Lab' };

    const loadDashboardData = useCallback(async () => {
        if (!currentUser || currentUser.typeValue !== 0) { // Admin only
            setError("Access Denied: This dashboard is for Admins only.");
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
            // Fetch all users for user statistics
            const usersData = await fetchUsers(authHeader);
            const rolesCount = { Admin: 0, Professor: 0, Student: 0 };
            usersData.forEach(user => {
                const roleName = getUserTypeString(user.type); 
                if (rolesCount[roleName] !== undefined) {
                    rolesCount[roleName]++;
                }
            });
            setUserStats({
                totalUsers: usersData.length,
                roles: rolesCount,
            });

            // Fetch all events for event statistics
            const eventsData = await fetchAllEvents(authHeader); // Returns EventSummaryDto
            const typesCount = { Lesson: 0, Conference: 0, Lab: 0 };
            eventsData.forEach(event => {
                const typeName = eventTypeToStringMap[event.type];
                if (typesCount[typeName] !== undefined) {
                    typesCount[typeName]++;
                }
            });
            setEventStats({
                totalEvents: eventsData.length,
                types: typesCount,
            });

        } catch (err) {
            console.error("Error loading admin dashboard data:", err);
            setError(err.message || "Failed to load dashboard data.");
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, getAuthHeader, getUserTypeString]); // Added getUserTypeString to dependencies

    useEffect(() => {
        if (currentUser && currentUser.typeValue === 0) { // Ensure admin before loading
            loadDashboardData();
        }
    }, [currentUser, loadDashboardData]); // Dependency on currentUser to re-check if user changes

    if (!currentUser || currentUser.typeValue !== 0) {
        return <p style={{ color: 'red', padding: '20px' }}>{error || "Access Denied: This dashboard is for Admins only."}</p>;
    }

    if (isLoading) return <p>Loading dashboard statistics...</p>;
    if (error && (!userStats || !eventStats)) return <p style={{ color: 'red' }}>Error: {error}</p>;

    const userRolesChartData = userStats ? {
        labels: Object.keys(userStats.roles),
        datasets: [{
            label: 'User Roles',
            data: Object.values(userStats.roles),
            backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)'],
            borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
            borderWidth: 1,
        }],
    } : { labels: [], datasets: [] }; // Provide default structure for chart

    const eventTypesChartData = eventStats ? {
        labels: Object.keys(eventStats.types),
        datasets: [{
            label: 'Event Types',
            data: Object.values(eventStats.types),
            backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)'],
            borderColor: ['rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'],
            borderWidth: 1,
        }],
    } : { labels: [], datasets: [] }; // Provide default structure for chart
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false, // Important for sizing charts in divs
        plugins: {
            legend: { position: 'top', labels: { font: { size: 14 }}},
            title: { display: true, font: { size: 16 }}
        }
    };

    return (
        <div>
            <h2>Admin Dashboard - Global Statistics</h2>
            {error && <p style={{ color: 'red' }}>Error fetching data: {error}</p>}
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
                {userStats && (
                    <div style={{ flex: '1 1 400px', minWidth:'350px', height: '400px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <h3 style={{textAlign: 'center', marginBottom: '15px'}}>User Statistics (Total: {userStats.totalUsers})</h3>
                        <div style={{height: '300px'}}> {/* Container for chart */}
                           <Bar options={{...chartOptions, plugins: {...chartOptions.plugins, title: {...chartOptions.plugins.title, text: 'User Role Distribution'}}}} data={userRolesChartData} />
                        </div>
                    </div>
                )}

                {eventStats && (
                    <div style={{ flex: '1 1 400px', minWidth:'350px', height: '400px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <h3 style={{textAlign: 'center', marginBottom: '15px'}}>Event Statistics (Total: {eventStats.totalEvents})</h3>
                         <div style={{height: '300px'}}> {/* Container for chart */}
                           <Doughnut options={{...chartOptions, plugins: {...chartOptions.plugins, title: {...chartOptions.plugins.title, text: 'Event Type Distribution'}}}} data={eventTypesChartData} />
                        </div>
                    </div>
                )}
            </div>
            
            {!userStats && !eventStats && !isLoading && !error && <p>No statistics to display or data could not be loaded.</p>}
        </div>
    );
};

export default AdminDashboardPage;