import React from 'react';
import { Capacitor } from '@capacitor/core';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Make the site installable/offline (production https builds only)
if ('serviceWorker' in navigator && import.meta.env.PROD && !Capacitor.isNativePlatform() && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}

createRoot(document.getElementById('root')).render(<App />);
