// src/api/eventService.js
import { API_BASE_URL } from '../config';

const handleApiResponse = async (response, expectingArray = true, httpMethod = 'GET') => {
    if (httpMethod === 'GET' && expectingArray && response.status === 404) {
        return [];
    }
    if (!response.ok) {
        const errorDataText = await response.text().catch(() => 'Could not parse error response.');
        console.error("API Error Data (Events Service):", errorDataText);
        try {
            const errorJson = JSON.parse(errorDataText);
            if (errorJson && (errorJson.message || errorJson.title)) {
                throw new Error(errorJson.message || errorJson.title || `API request failed: ${response.status} ${response.statusText}`);
            }
        } catch (e) { /* Fall through */ }
        throw new Error(`API request failed: ${response.status} ${response.statusText}. Details: ${errorDataText}`);
    }
    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return expectingArray ? [] : null;
    }
    // For POST /events, backend returns { "id": newEventId } with 201 Created
    if (response.status === 201 && httpMethod === 'POST' && !expectingArray) {
        return response.json(); // Expecting JSON like { id: ... }
    }
    return response.json();
};

export const fetchAllEvents = async (authHeader) => {
    if (!authHeader) throw new Error("Authorization header is missing.");
    const response = await fetch(`${API_BASE_URL}/events`, { // This now returns EventSummaryDto
        method: 'GET',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
    });
    return handleApiResponse(response, true, 'GET');
};

export const fetchMyEvents = async (authHeader) => {
    if (!authHeader) throw new Error("Authorization header is missing.");
    const response = await fetch(`${API_BASE_URL}/events/personal`, { // This now returns EventSummaryDto
        method: 'GET',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
    });
    return handleApiResponse(response, true, 'GET'); 
};

export const fetchEventParticipationHistory = async (
    authHeader, 
    startTimestamp, 
    endTimestamp, 
    timezone = 'UTC', 
    culture = 'en-US',
    targetUserId = null 
) => {
    if (!authHeader) throw new Error("Authorization header is missing.");
    let endpointUrl = `${API_BASE_URL}/events/entry/history`;
    // Backend /events/entry/history needs to be updated to use targetUserId for Admin
    // For now, this parameter is conceptual for the backend.
    // if (targetUserId && someAdminCheck) { endpointUrl += `?targetUserId=${targetUserId}`; }

    const response = await fetch(endpointUrl, {
        method: 'GET',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json', 
            'Timezone': timezone,
            'Culture': culture,
            'StartTimestamp': String(Math.floor(startTimestamp / 1000)), 
            'EndTimestamp': String(Math.floor(endTimestamp / 1000)),     
        },
    });
    return handleApiResponse(response, true, 'GET'); 
};

export const createEvent = async (eventData, authHeader) => {
    if (!authHeader) throw new Error("Authorization header is missing for creating event.");
    const payload = {
        name: eventData.name,
        type: eventData.type 
    };
    const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    // Expects { "id": newEventId } from backend on 201 Created
    return handleApiResponse(response, false, 'POST'); 
};

export const updateEvent = async (eventId, eventData, authHeader) => {
    if (!authHeader) throw new Error("Authorization header is missing for updating event.");
    const payload = {
        name: eventData.name,
        type: eventData.type
    };
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    return handleApiResponse(response, false, 'PATCH'); 
};

export const deleteEvent = async (eventId, authHeader) => {
    if (!authHeader) throw new Error("Authorization header is missing for deleting event.");
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': authHeader
        }
    });
    return handleApiResponse(response, false, 'DELETE');
};

export const fetchMyOwnParticipationHistory = async (authHeader, startTimestamp, endTimestamp, timezone = 'UTC', culture = 'en-US') => {
    if (!authHeader) throw new Error("Authorization header is missing.");
    
    const endpointUrl = `${API_BASE_URL}/me/event-history`; // Calls the new student-specific endpoint

    const response = await fetch(endpointUrl, {
        method: 'GET',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json', 
            'Timezone': timezone,
            'Culture': culture,
            'StartTimestamp': String(Math.floor(startTimestamp / 1000)), 
            'EndTimestamp': String(Math.floor(endTimestamp / 1000)),     
        },
    });
    // Assumes it returns an array of HistoryDto. handleApiResponse will return [] for 404.
    return handleApiResponse(response, true, 'GET'); 
};