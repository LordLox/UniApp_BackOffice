// src/components/ErrorModal.js
import React from 'react';
import Modal from './Modal'; // Assuming your generic Modal component is in the same folder

const ErrorModal = ({ isOpen, onClose, errorMessage }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Error">
            <pre style={{ 
                color: '#721c24', /* Darker red for text */
                backgroundColor: '#f8d7da', /* Light pink/red background */
                border: '1px solid #f5c6cb', /* Reddish border */
                padding: '15px',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap', /* Respects newlines and wraps text */
                wordBreak: 'break-word',
                maxHeight: '300px', /* Limit height for long messages */
                overflowY: 'auto',  /* Add scroll for very long messages */
                fontSize: '0.9em'
            }}>
                {errorMessage}
            </pre>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button 
                    onClick={onClose} 
                    style={{ 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        border: 'none',
                        padding: '8px 15px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Close
                </button>
            </div>
        </Modal>
    );
};

export default ErrorModal;