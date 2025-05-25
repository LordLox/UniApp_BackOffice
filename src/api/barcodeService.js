// src/api/barcodeService.js
import { API_BASE_URL } from '../config';

const handleApiResponse = async (response, isText = false) => {
    // ... (handleApiResponse from previous version remains the same)
    if (!response.ok) {
        const errorDataText = await response.text().catch(() => 'Could not parse error response.');
        console.error("API Error Data (Barcode Service):", errorDataText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}. Details: ${errorDataText}`);
    }
    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return isText ? "" : null;
    }
    // If expecting text but got JSON, or vice-versa, this might need adjustment based on endpoint
    if (isText) {
        return response.text();
    }
    return response.json();
};


export const decryptData = async (encryptedText, authHeader) => {
    // ... (decryptData remains the same)
    if (!authHeader) {
        throw new Error("Authorization header is missing for decryption.");
    }
    if (!encryptedText) {
        throw new Error("Encrypted text cannot be empty for decryption.");
    }
    const response = await fetch(`${API_BASE_URL}/barcode/decrypt`, {
        method: 'POST',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'text/plain', 
        },
        body: encryptedText,
    });
    return handleApiResponse(response, true); 
};

// New function to get the authenticated user's QR code
export const fetchMyQrCodeImage = async (authHeader) => {
    if (!authHeader) {
        throw new Error("Authorization header is missing for fetching QR code.");
    }
    // Backend endpoint: GET /barcode/qr (returns PNG image by default)
    // The controller returns Results.File(qrcode.BarcodeCodeImage, MimeTypes.GetMimeType(filename), filename);
    // or Results.Text(qrcode.EncryptedBarcodeValue); if Content-Type is text/plain
    const response = await fetch(`${API_BASE_URL}/barcode/qr`, {
        method: 'GET',
        headers: {
            'Authorization': authHeader,
            // 'Content-Type': 'image/png' // Not needed, backend defaults to this
        },
    });

    if (!response.ok) {
        const errorDataText = await response.text().catch(() => 'Could not parse error response.');
        throw new Error(`Failed to fetch QR code: ${response.status} ${response.statusText}. Details: ${errorDataText}`);
    }
    // The response is an image blob
    return response.blob(); 
};