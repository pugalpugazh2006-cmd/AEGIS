import { useState, useRef, useEffect } from 'react';
import { Incident } from '../../types';

export default function Header({ incidents }: { incidents: Incident[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeIncidents = incidents.filter(i => i.status === 'ACTIVE');
  const resolvedIncidents = incidents.filter(i => i.status === 'RESOLVED');
  
  // Calculate notifications
  const notifications = [
    ...activeIncidents.map(i => ({
      id: `act-${i.id}`,
      type: i.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      title: 'Incident Detected',
      desc: i.title,
      time: i.start_time
    })),
    ...resolvedIncidents.map(i => ({
      id: `res-${i.id}`,
      type: 'SUCCESS',
      title: 'Service Recovered',
      desc: `Resolved: ${i.title}`,
      time: i.start_time
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  const unreadCount = activeIncidents.length; // Simplified badge count

  return (
    <header className="flex items-center justify-between border-b border-[#1D2A38] bg-[#05070B] px-6 py-4 z-50">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-white tracking-widest">AEGIS</h1>
        <div className="h-6 w-[1px] bg-[#1D2A38]"></div>
        <p className="text-sm font-semibold tracking-wider text-cyan-400 uppercase">Autonomous Engineering Guard</p>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-mono text-green-400 uppercase tracking-widest">System Operational</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase bg-[#0D131C] px-3 py-1 rounded border border-[#1D2A38]">
          <span>ENV:</span>
          <span className="text-cyan-400">LOCAL DEMO / SIMULATION</span>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1D2A38]/50 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#1D2A38] bg-[#0A0F16] shadow-xl overflow-hidden fade-in-up">
              <div className="p-3 border-b border-[#1D2A38] flex justify-between items-center bg-[#05070B]">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-mono">{unreadCount} New</span>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-[10px] text-gray-500 font-mono">
                    No recent events
                  </div>
                ) : (
                  <div className="divide-y divide-[#1D2A38]">
                    {notifications.map(n => (
                      <div key={n.id} className="p-3 hover:bg-[#1D2A38]/30 transition-colors cursor-pointer">
                        <div className="flex gap-2">
                          <div className="mt-0.5">
                            {n.type === 'CRITICAL' && <span className="flex h-2 w-2 rounded-full bg-red-500 shadow-red-glow animate-pulse"></span>}
                            {n.type === 'WARNING' && <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>}
                            {n.type === 'SUCCESS' && <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-green-glow"></span>}
                          </div>
                          <div>
                            <p className={`text-xs font-bold mb-0.5 ${n.type === 'CRITICAL' ? 'text-red-400' : n.type === 'WARNING' ? 'text-amber-400' : 'text-green-400'}`}>
                              {n.title}
                            </p>
                            <p className="text-[10px] text-gray-400 leading-snug mb-1">{n.desc}</p>
                            <p className="text-[9px] text-gray-600 font-mono">{new Date(n.time).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}