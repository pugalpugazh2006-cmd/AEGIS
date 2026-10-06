import os

files = {
    "d:/AEGIS/frontend/src/components/layout/Header.tsx": """
import React from 'react';

export default function Header({ incidentsCount }: { incidentsCount: number }) {
  return (
    <header className="flex items-center justify-between border-b border-[#1D2A38] bg-[#05070B] px-6 py-4">
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
        <div className="relative">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          {incidentsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {incidentsCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
""",
    "d:/AEGIS/frontend/src/components/layout/Sidebar.tsx": """
import React from 'react';

const navItems = [
  { id: 'overview', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'infrastructure', label: 'Infrastructure', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01' },
  { id: 'topology', label: 'Topology', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  { id: 'incidents', label: 'Incidents', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  { id: 'experiments', label: 'Experiments', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { id: 'repairs', label: 'Repairs', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
];

export default function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  return (
    <div className="w-64 border-r border-[#1D2A38] bg-[#0A0F16] flex flex-col h-full">
      <div className="flex-1 py-6 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === item.id 
                ? 'text-cyan-400 bg-[#1D2A38]/50 border-r-2 border-cyan-400' 
                : 'text-gray-400 hover:text-white hover:bg-[#1D2A38]/30'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
            </svg>
            {item.label}
          </button>
        ))}
      </div>
      <div className="p-6 border-t border-[#1D2A38]">
        <div className="text-xs text-gray-500 font-mono text-center">AEGIS v2.4.1</div>
      </div>
    </div>
  );
}
""",
    "d:/AEGIS/frontend/src/components/layout/Layout.tsx": """
import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children, incidentsCount }: { children: React.ReactNode, incidentsCount: number }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex h-screen w-full flex-col bg-[#05070B] text-gray-100 font-sans overflow-hidden">
      <Header incidentsCount={incidentsCount} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
}
""",
    "d:/AEGIS/frontend/src/components/dashboard/Hero.tsx": """
import React from 'react';

export default function Hero({ servicesCount, criticalCount }: { servicesCount: number, criticalCount: number }) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-xl border border-[#1D2A38] bg-gradient-to-r from-[#0D131C] to-[#111923] p-8 shadow-2xl">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-white mb-2">AEGIS <span className="text-cyan-400 font-light">Autonomous Guard</span></h2>
          <p className="text-lg text-gray-400 tracking-widest uppercase font-semibold">Detect. Diagnose. Validate. Recover.</p>
        </div>
        <div className="flex items-center gap-8 border-l border-[#1D2A38] pl-8">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">System Status</p>
            <p className="text-xl font-bold text-green-400 uppercase tracking-wider flex items-center gap-2 justify-center">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Operational
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Monitoring</p>
            <p className="text-xl font-bold text-white">{servicesCount} <span className="text-gray-400 text-sm font-normal">Services</span></p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Critical Faults</p>
            <p className={`text-xl font-bold ${criticalCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>{criticalCount} <span className="text-gray-500 text-sm font-normal">Active</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip())
        
print("Files generated!")
