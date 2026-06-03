import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { PlanProvider } from './hooks/usePlan.jsx';
import './styles/App.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PlanProvider>
      <App />
    </PlanProvider>
  </React.StrictMode>
);
