import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import MainRouter from './router/MainRouter';
import { BrowserRouter } from 'react-router-dom';
import { TickerProvider } from './context/TickerContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <TickerProvider>
        <MainRouter />
      </TickerProvider>
    </BrowserRouter>
  </React.StrictMode>
);
