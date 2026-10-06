
import Header from './Header';
import Sidebar from './Sidebar';
import ParticleBackground from '../ui/ParticleBackground';
import { ToastProvider } from '../ui/Toast';

import { Incident } from '../../types';

export default function Layout({ children, incidents }: { children: React.ReactNode, incidents: Incident[] }) {
  return (
    <ToastProvider>
      <div className="cyber-bg flex h-screen w-full flex-col text-gray-100 overflow-hidden">
        {/* Low-contrast ambient corner glow */}
        <div className="cyber-glow-corner" aria-hidden="true" />
        {/* Floating particles */}
        <ParticleBackground />

        {/* UI content sits above background layers */}
        <div className="content-layer flex flex-col h-full">
          <Header incidents={incidents} />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}