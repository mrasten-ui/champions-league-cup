import { createRoot } from 'react-dom/client';
import App from './App';
import { PenaltyShootoutPreview } from './components/PenaltyShootoutPreview';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
const devPreview = new URLSearchParams(window.location.search).get('dev');

root.render(
    devPreview === 'pens' ? <PenaltyShootoutPreview /> : <App />
);
