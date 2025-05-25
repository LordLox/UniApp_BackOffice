// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css'; // Import Ant Design's reset styles (or antd.min.css for full styles)
import './index.css';      // Your global custom styles (can be mostly removed or tailored)
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);