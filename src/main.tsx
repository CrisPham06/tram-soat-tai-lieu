import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/styles.css';
import { loadLocalFonts } from './ui/fonts';
void loadLocalFonts().then(() => createRoot(document.getElementById('root')!).render(<App />));
