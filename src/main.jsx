import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './services/firebase'; // Initialize Firebase
import './styles/global.css'; // Import global styles

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);

