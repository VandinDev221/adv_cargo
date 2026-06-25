import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { isGoogleLoginEnabled } from './components/GoogleLoginButton';
import './index.css';

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

function AppTree() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isGoogleLoginEnabled() ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AppTree />
      </GoogleOAuthProvider>
    ) : (
      <AppTree />
    )}
  </React.StrictMode>
);
