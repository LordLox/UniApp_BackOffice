// server.js
// If you do not want to use Nginx
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs'); // Used to check if index.html exists

const app = express();

// Environment variables
const PORT = process.env.PORT || 3000;
const REACT_APP_BACKEND_API_URL = process.env.REACT_APP_BACKEND_API_URL;

if (!REACT_APP_BACKEND_API_URL) {
    console.error('FATAL ERROR: REACT_APP_BACKEND_API_URL environment variable is not set.');
    process.exit(1);
}

// Proxy middleware configuration
app.use(
    '/api', // This path string is valid
    createProxyMiddleware({
        target: REACT_APP_BACKEND_API_URL,
        changeOrigin: true,
        pathRewrite: {
            '^/api': '', 
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Prod Proxy] Forwarding request: ${req.method} ${req.originalUrl} -> ${REACT_APP_BACKEND_API_URL}${proxyReq.path}`);
            if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            if (req.headers['content-type']) {
                proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
            if (req.headers['timezone']) {
                proxyReq.setHeader('Timezone', req.headers['timezone']);
            }
            if (req.headers['culture']) {
                proxyReq.setHeader('Culture', req.headers['culture']);
            }
            if (req.headers['starttimestamp']) {
                proxyReq.setHeader('StartTimestamp', req.headers['starttimestamp']);
            }
            if (req.headers['endtimestamp']) {
                proxyReq.setHeader('EndTimestamp', req.headers['endtimestamp']);
            }
        },
        onError: (err, req, res) => {
            console.error('[Prod Proxy] Error:', err);
            if (res && !res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Proxy error', error: err.message }));
            } else if (res && res.writableEnded === false) {
                res.end();
            }
        },
    })
);

// Serve React static files from the 'build' directory
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// For any other GET request, serve the React app's index.html
// This path string '*' is a valid wildcard for Express
app.get('*', (req, res) => {
    const indexPath = path.join(buildPath, 'index.html');
    // Check if index.html exists to prevent errors if build is missing
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // This indicates a build problem or misconfiguration if index.html is not found
        res.status(404).send(
            'Application not found. Please ensure the frontend has been built correctly and build files are in the expected location.'
        );
    }
});

app.listen(PORT, () => {
    console.log(`UniApp BackOffice frontend server running on port ${PORT}`);
    console.log(`Proxying API requests from /api to: ${REACT_APP_BACKEND_API_URL}`);
});
