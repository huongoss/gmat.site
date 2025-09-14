import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { AuthProvider } from './context/AuthContext';
import { initAnalytics } from './utils/analytics';

// Initialize GA4 if measurement ID is present
const GA_ID = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID as string | undefined;
if (GA_ID) initAnalytics(GA_ID);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);