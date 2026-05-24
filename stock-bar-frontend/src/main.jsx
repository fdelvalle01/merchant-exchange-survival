import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import MainRouter from './router/MainRouter';
import { BrowserRouter } from 'react-router-dom';
import { TickerProvider } from './context/TickerContext';
import { AuthProvider } from './auth/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TickerProvider>
          <MainRouter />
        </TickerProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
