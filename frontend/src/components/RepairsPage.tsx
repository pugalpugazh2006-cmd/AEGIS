import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import RepairWorkflow from './repairs/RepairWorkflow';
import { DashboardContextType } from './DashboardLayout';
import { Incident } from '../types';

export default function RepairsPage() {
  const { incidents } = useOutletContext<DashboardContextType>();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const repairableIncidents = incidents.filter(i => i.status === 'ACTIVE' || i.status === 'RESOLVED');

  useEffect(() => {
    if (!selectedIncident && repairableIncidents.length > 0) {
      const active = repairableIncidents.find(i => i.status === 'ACTIVE');
      if (active) setSelectedIncident(active);
      else setSelectedIncident(repairableIncidents[0]);
    }
  }, [repairableIncidents, selectedIncident]);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        <h2 className="text-lg font-bold text-white uppercase tracking-widest font-mono">Repair Management</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Incident List */}
        <div className="xl:col-span-1 space-y-2">
          {repairableIncidents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#1D2A38] bg-[#0A0F16] p-8 text-center">
              <p className="text-gray-500 text-xs font-mono">No incidents requiring repairs</p>
            </div>
          ) : (
            repairableIncidents.map(inc => (
              <button
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`w-full text-left rounded-xl border p-4 transition-all duration-200 panel-expand ${
                  selectedIncident?.id === inc.id
                    ? 'border-cyan-500/50 bg-cyan-500/8 shadow-[0_0_20px_rgba(34,211,238,0.08)]'
                    : 'border-[#1D2A38] bg-[#0D131C] hover:border-[#2A3D52]'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono text-gray-500">
                    INC-{String(inc.id).padStart(4, '0')}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase font-mono ${
                    inc.status === 'ACTIVE'
                      ? 'bg-red-500/15 text-red-400 border-red-500/30'
                      : 'bg-green-500/15 text-green-400 border-green-500/30'
                  }`}>
                    {inc.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-white truncate">{inc.title}</p>
              </button>
            ))
          )}
        </div>

        {/* Repair Workflow Panel */}
        <div className="xl:col-span-2">
          {selectedIncident ? (
            <div className="panel-expand">
              <RepairWorkflow incident={selectedIncident} />
            </div>
          ) : (
            <div className="flex-1 rounded-xl border border-dashed border-[#1D2A38] bg-[#0A0F16] flex items-center justify-center min-h-[400px]">
              <p className="text-gray-500 text-xs font-mono">Select an incident to manage repairs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
