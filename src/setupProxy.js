// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

// The backend base URL will be read from an environment variable.
// For local development, you can set a fallback or use a .env file.
const targetBackendUrl = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:5023'; // Your actual backend URL

module.exports = function(app) {
  // Proxy for API calls that might originate from the Android app (or the web UI itself)
  // We'll use a common prefix like '/api-proxy' for these proxied backend calls.
  // The Android app would need to be configured to hit:
  // https://your-react-frontend-domain.com/api-proxy/users/userinfo
  // instead of directly to https://backend.uniscanapp.it/users/userinfo

  app.use(
    '/api', // This is the prefix for all backend calls that should be proxied
    createProxyMiddleware({
      target: targetBackendUrl,
      changeOrigin: true, // Needed for virtual hosted sites
      pathRewrite: {
        '^/api': '', // Remove /api-proxy prefix when forwarding to the backend
      },
      onProxyReq: (proxyReq, req, res) => {
        // You can log requests here or modify headers if needed
        console.log(`[Proxy] Forwarding request: ${req.method} ${req.originalUrl} -> <span class="math-inline">\{targetBackendUrl\}</span>{proxyReq.path}`);
        // Forward original authorization header if present
        if (req.headers.authorization) {
          proxyReq.setHeader('Authorization', req.headers.authorization);
        }
        // Forward other relevant headers from the Android app
        if (req.headers['content-type']) {
            proxyReq.setHeader('Content-Type', req.headers['content-type']);
        }
        if (req.headers['timezone']) {
            proxyReq.setHeader('Timezone', req.headers['timezone']);
        }
        if (req.headers['culture']) {
            proxyReq.setHeader('Culture', req.headers['culture']);
        }
        if (req.headers['starttimestamp']) { // Headers are case-insensitive but often normalized
            proxyReq.setHeader('StartTimestamp', req.headers['starttimestamp']);
        }
        if (req.headers['endtimestamp']) {
            proxyReq.setHeader('EndTimestamp', req.headers['endtimestamp']);
        }
      },
      onError: (err, req, res) => {
        console.error('[Proxy] Error:', err);
        if (res && !res.headersSent) {
             res.writeHead(500, { 'Content-Type': 'application/json' });
             res.end(JSON.stringify({ message: 'Proxy error', error: err.message }));
        }
      }
    })
  );

  // If your React app itself makes direct calls to /users, /events, etc. (without /api-proxy)
  // and you want those to also go through this proxy during development,
  // you'd add more specific proxy rules or ensure your React app's API calls
  // *also* use the /api-proxy prefix.
  // For consistency, it's better if ALL backend interactions go through this /api-proxy.
};