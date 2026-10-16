import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { useThemeStore } from './store/useThemeStore';

// 첫 페인트 전 테마 적용(깜빡임 방지)
document.documentElement.classList.toggle('dark', useThemeStore.getState().theme === 'dark');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
