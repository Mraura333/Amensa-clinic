import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Define global fetch interceptor to support Netlify/Vite dynamic api routing, cors credentials and security tokens
const originalFetch = window.fetch;
const customFetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  
  if (url.startsWith('/api/')) {
    const apiBase = (import.meta as any).env.VITE_API_URL || '';
    url = `${apiBase.replace(/\/$/, '')}${url}`;
    
    // Clone or initialize options
    const options: RequestInit = init ? { ...init } : {};
    options.headers = options.headers ? new Headers(options.headers) : new Headers();
    
    // Automatically attach patient token if present in sessionStorage or localStorage
    const patientToken = sessionStorage.getItem('amensa_patient_token') || localStorage.getItem('amensa_patient_token');
    if (patientToken && !options.headers.has('Authorization')) {
      options.headers.set('Authorization', `Bearer ${patientToken}`);
    }
    
    // Support CORS credentials (cookies) on cross-origin requests
    if (apiBase) {
      options.credentials = 'include';
    }
    
    try {
      const response = await originalFetch(url, options);
      
      // Automatic token capture on login / signup success
      if (response.ok && (url.includes('/api/auth/login') || url.includes('/api/auth/signup'))) {
        try {
          const clone = response.clone();
          const json = await clone.json();
          if (json && json.token) {
            sessionStorage.setItem('amensa_patient_token', json.token);
            localStorage.setItem('amensa_patient_token', json.token);
          }
        } catch (e) {
          console.error('Failed to parse and store patient session token:', e);
        }
      }

      // Automatic token cleanup on logout success
      if (url.includes('/api/auth/logout')) {
        sessionStorage.removeItem('amensa_patient_token');
        localStorage.removeItem('amensa_patient_token');
      }
      
      // Robust error handling to catch non-JSON HTML fallbacks on static servers like Netlify
      const contentType = response.headers.get('content-type');
      if (!response.ok && contentType && contentType.includes('text/html')) {
        const text = await response.text();
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          throw new Error(`Unexpected HTML response (Status ${response.status}). The requested endpoint '${input}' might not exist or the backend server is offline.`);
        }
      }
      
      return response;
    } catch (error: any) {
      console.warn('Fetch interceptor caught network error:', error.message || error);
      throw error;
    }
  }
  
  return originalFetch(input, init);
};

try {
  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    configurable: true,
    writable: true,
  });
} catch (e) {
  try {
    (window as any).fetch = customFetch;
  } catch (err) {
    console.warn('Unable to intercept window.fetch securely:', err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
