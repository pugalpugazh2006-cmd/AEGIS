import os

files = {
    "d:/AEGIS/frontend/src/components/dashboard/KPICards.tsx": """
import React from 'react';

export default function KPICards({
  servicesCount,
  healthyCount,
  anomalousCount,
  activeIncidentsCount,
  criticalIncidentsCount
}: {
  servicesCount: number,
  healthyCount: number,
  anomalousCount: number,
  activeIncidentsCount: number,
  criticalIncidentsCount: number
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <div className="rounded-xl border border-[#1D2A38] bg-[#0D131C] p-5 shadow-lg group hover:border-cyan-500/30 transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 rounded bg-cyan-500/10 text-cyan-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Monitored</span>
        </div>
        <h3 className="text-3xl font-black text-white">{servicesCount}</h3>
        <p className="text-xs text-gray-400 mt-2">Active service components</p>
      </div>

      <div className={`rounded-xl border ${anomalousCount > 0 ? 'border-amber-500/50 bg-amber-500/5' : 'border-[#1D2A38] bg-[#0D131C]'} p-5 shadow-lg transition-all`}>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded ${anomalousCount > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Anomalous</span>
        </div>
        <h3 className={`text-3xl font-black ${anomalousCount > 0 ? 'text-amber-400' : 'text-green-400'}`}>{anomalousCount}</h3>
        <p className="text-xs text-gray-400 mt-2">{anomalousCount > 0 ? 'Detection engine active' : 'All services healthy'}</p>
      </div>

      <div className={`rounded-xl border ${activeIncidentsCount > 0 ? 'border-orange-500/30 bg-orange-500/5' : 'border-[#1D2A38] bg-[#0D131C]'} p-5 shadow-lg transition-all`}>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded ${activeIncidentsCount > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-500/10 text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Incidents</span>
        </div>
        <h3 className={`text-3xl font-black ${activeIncidentsCount > 0 ? 'text-orange-400' : 'text-gray-300'}`}>{activeIncidentsCount}</h3>
        <p className="text-xs text-gray-400 mt-2">Active operational incidents</p>
      </div>

      <div className={`rounded-xl border ${criticalIncidentsCount > 0 ? 'border-red-500/50 bg-red-500/10 animate-pulse-slow' : 'border-[#1D2A38] bg-[#0D131C]'} p-5 shadow-lg transition-all`}>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded ${criticalIncidentsCount > 0 ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/10 text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Critical</span>
        </div>
        <h3 className={`text-3xl font-black ${criticalIncidentsCount > 0 ? 'text-red-500' : 'text-gray-300'}`}>{criticalIncidentsCount}</h3>
        <p className="text-xs text-gray-400 mt-2">{criticalIncidentsCount > 0 ? 'Requires immediate attention' : 'No critical faults'}</p>
      </div>
    </div>
  );
}
""",
    "d:/AEGIS/frontend/src/components/ui/IntelligencePipeline.tsx": """
import React from 'react';

export default function IntelligencePipeline({
  hasTelemetry,
  hasAnomaly,
  hasIncident,
  hasRCA,
  hasValidation,
  hasRecovery
}: {
  hasTelemetry: boolean,
  hasAnomaly: boolean,
  hasIncident: boolean,
  hasRCA: boolean,
  hasValidation: boolean,
  hasRecovery: boolean
}) {
  const steps = [
    { id: 'telemetry', label: 'TELEMETRY', desc: 'Collecting system signals', active: hasTelemetry },
    { id: 'detection', label: 'DETECTION', desc: 'Anomaly identified', active: hasAnomaly },
    { id: 'correlation', label: 'CORRELATION', desc: 'Incident created', active: hasIncident },
    { id: 'rca', label: 'RCA', desc: 'Root cause identified', active: hasRCA },
    { id: 'validation', label: 'VALIDATION', desc: 'Remediation passed', active: hasValidation },
    { id: 'recovery', label: 'RECOVERY', desc: 'Service restored', active: hasRecovery },
  ];

  return (
    <div className="rounded-xl border border-[#1D2A38] bg-[#0D131C] p-6 shadow-lg mb-6 overflow-x-auto">
      <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">AEGIS Intelligence Pipeline</h3>
      <div className="flex items-center min-w-[800px]">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-1 relative group">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300 ${
                step.active 
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                  : 'bg-[#111923] border-[#1D2A38] text-gray-600'
              }`}>
                {step.active ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                ) : (
                  <span className="text-sm font-mono">{idx + 1}</span>
                )}
              </div>
              <div className="mt-4 text-center">
                <p className={`text-xs font-bold uppercase tracking-widest ${step.active ? 'text-white' : 'text-gray-500'}`}>{step.label}</p>
                <p className="text-[10px] text-gray-500 mt-1">{step.desc}</p>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-[2px] -mt-10 mx-2 z-0 relative">
                <div className="absolute inset-0 bg-[#1D2A38]"></div>
                {steps[idx + 1].active && (
                  <div className="absolute inset-0 bg-cyan-400 animate-pulse"></div>
                )}
              </div>
            )}
          </React.Fragment>
        ))}
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
        
print("Components 1 generated!")
