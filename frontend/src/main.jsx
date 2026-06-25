import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { GoogleAuthProvider } from './context/GoogleAuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleAuthProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </GoogleAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
