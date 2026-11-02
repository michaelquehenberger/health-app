import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Schriften lokal mitgeliefert, nicht von Google nachgeladen (DSGVO).
import '@fontsource/sora/600.css';
import '@fontsource/sora/800.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './styles.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
