import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { PricingProvider } from './context/PricingContext.tsx';

// Gracefully catch benign sandbox iframe WebSocket drops & offline rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || '';
    if (
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('client is offline') ||
      msg.includes('Failed to get document')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PricingProvider>
      <App />
    </PricingProvider>
  </StrictMode>,
);
