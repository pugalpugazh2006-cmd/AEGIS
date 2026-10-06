import { useState, useEffect } from 'react';
import RCAPanel from './RCAPanel';
import RepairWorkflow from '../repairs/RepairWorkflow';
import { Incident } from '../../types';

export default function IncidentCommandCenter({ incidents }: { incidents: Incident[] }) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    if (!selectedIncident && incidents.length > 0) {
      const active = incidents.find(i => i.status === 'ACTIVE');
      if (active) setSelectedIncident(active);
    }
  }, [incidents, selectedIncident]);

  const severityConfig: Record<string, string> = {
    CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',
    HIGH:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
    MEDIUM:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    LOW:      'bg-gray-500/15 text-gray-400 border-gray-500/30',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-sm font-bold text-white uppercase tracking-widest font-mono">Incident Command Center</h2>
        {incidents.filter(i => i.status === 'ACTIVE').length > 0 && (
          <span className="text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-mono uppercase tracking-widest">
            {incidents.filter(i => i.status === 'ACTIVE').length} Active
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Incident list */}
        <div className="xl:col-span-1 space-y-2">
          {incidents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#1D2A38] bg-[#0A0F16] p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-400 font-bold uppercase tracking-wider text-xs font-mono">All Clear</p>
              <p className="text-[10px] text-gray-500 mt-1 font-mono">No active incidents detected</p>
            </div>
          ) : (
            incidents.map(inc => {
              const isSelected = selectedIncident?.id === inc.id;
              const isActive   = inc.status === 'ACTIVE';
              return (
                <button
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`w-full text-left rounded-xl border p-4 transition-all duration-200 panel-expand ${
                    isSelected
                      ? 'border-cyan-500/50 bg-cyan-500/8 shadow-[0_0_20px_rgba(34,211,238,0.08)]'
                      : isActive
                        ? 'border-red-500/20 bg-[#0D131C] hover:border-red-500/30'
                        : 'border-[#1D2A38] bg-[#0D131C] hover:border-[#2A3D52]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono text-gray-500">
                      INC-{String(inc.id).padStart(4, '0')}
                    </span>
                    <div className="flex gap-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase font-mono ${severityConfig[inc.severity] || severityConfig.LOW}`}>
                        {inc.severity}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase font-mono ${
                        inc.status === 'ACTIVE'
                          ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : 'bg-green-500/15 text-green-400 border-green-500/30'
                      }`}>
                        {inc.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-white mb-1.5 text-left leading-snug">{inc.title}</p>
                  <p className="text-[10px] text-gray-500 font-mono">
                    {new Date(inc.start_time).toLocaleTimeString()}
                  </p>
                  {isSelected && (
                    <div className="mt-2 h-px bg-gradient-to-r from-cyan-500/40 to-transparent" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* RCA + Repair panel */}
        <div className="xl:col-span-2 space-y-4">
          {selectedIncident ? (
            <div className="panel-expand space-y-4">
              <RCAPanel incident={selectedIncident} />
              {selectedIncident.status === 'ACTIVE' && (
                <RepairWorkflow incident={selectedIncident} />
              )}
            </div>
          ) : (
            <div className="flex-1 rounded-xl border border-dashed border-[#1D2A38] bg-[#0A0F16] flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#1D2A38] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500 text-xs font-mono">Select an incident to view RCA and Remediation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}