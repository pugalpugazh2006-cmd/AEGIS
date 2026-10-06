import os

files = {
    "d:/AEGIS/frontend/src/components/incidents/IncidentCommandCenter.tsx": """
import React, { useState, useEffect } from 'react';
import RCAPanel from './RCAPanel';
import RepairWorkflow from '../repairs/RepairWorkflow';
import { Incident } from '../../types';

export default function IncidentCommandCenter({ incidents }: { incidents: Incident[] }) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    // Auto-select first active incident if none selected
    if (!selectedIncident && incidents.length > 0) {
      const active = incidents.find(i => i.status === 'ACTIVE');
      if (active) setSelectedIncident(active);
    }
  }, [incidents, selectedIncident]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-1 flex flex-col gap-4">
        <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Active Incidents</h3>
        {incidents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1D2A38] bg-[#0A0F16] p-8 text-center">
            <p className="text-green-400 font-bold uppercase tracking-wider text-sm">0 Incidents Detected</p>
            <p className="text-xs text-gray-500 mt-2">Systems operating nominally.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {incidents.map(inc => (
              <div 
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedIncident?.id === inc.id 
                    ? 'border-cyan-500 bg-cyan-500/10' 
                    : 'border-[#1D2A38] bg-[#0D131C] hover:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-gray-500">INC-{String(inc.id).padStart(4, '0')}</span>
                  <div className="flex gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      inc.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                      inc.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>{inc.severity}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      inc.status === 'ACTIVE' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                      'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>{inc.status}</span>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white mb-2">{inc.title}</h4>
                <p className="text-xs text-gray-500">Detected: {new Date(inc.start_time).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="xl:col-span-2 flex flex-col gap-6">
        {selectedIncident ? (
          <>
            <RCAPanel incident={selectedIncident} />
            {selectedIncident.status === 'ACTIVE' && (
              <RepairWorkflow incident={selectedIncident} />
            )}
          </>
        ) : (
          <div className="flex-1 rounded-xl border border-dashed border-[#1D2A38] bg-[#0A0F16] flex items-center justify-center min-h-[400px]">
            <p className="text-gray-500 text-sm font-mono">Select an incident to view RCA and Remediation</p>
          </div>
        )}
      </div>
    </div>
  );
}
""",
    "d:/AEGIS/frontend/src/components/incidents/RCAPanel.tsx": """
import React, { useState, useEffect } from 'react';
import { Incident } from '../../types';

export default function RCAPanel({ incident }: { incident: Incident }) {
  const [rootCauses, setRootCauses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!incident) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/incidents/${incident.id}/root-causes`)
      .then(res => res.json())
      .then(data => {
        setRootCauses(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [incident]);

  return (
    <div className="rounded-xl border border-[#1D2A38] bg-[#0D131C] p-6 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
      <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-1">Root Cause Analysis</h3>
      <p className="text-xs text-gray-400 mb-6">AEGIS Intelligence Engine has identified the following candidates.</p>
      
      {loading ? (
        <div className="flex items-center justify-center p-8 text-cyan-500 text-sm font-mono">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ANALYZING TELEMETRY...
        </div>
      ) : rootCauses.length === 0 ? (
        <p className="text-xs text-gray-500">No root causes identified yet.</p>
      ) : (
        <div className="space-y-4">
          {rootCauses.map((rc, idx) => (
            <div key={rc.id} className={`rounded border p-4 ${idx === 0 ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-[#1D2A38] bg-[#0A0F16]'}`}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <span className={`text-xl font-black ${idx === 0 ? 'text-cyan-400' : 'text-gray-500'}`}>#{rc.rank}</span>
                  <span className="text-sm font-bold text-white">{rc.service_name}</span>
                  {idx === 0 && <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded uppercase tracking-wider">AEGIS ROOT CAUSE</span>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Confidence</p>
                  <p className={`text-lg font-bold ${idx === 0 ? 'text-cyan-400' : 'text-gray-400'}`}>{rc.score.toFixed(1)} / 100</p>
                </div>
              </div>
              <div className="bg-[#05070B] rounded border border-[#1D2A38] p-3">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-mono">Evidence</p>
                <ul className="text-xs text-gray-300 space-y-1 font-mono list-disc list-inside">
                  {Object.entries(rc.evidence_json || {}).map(([k, v]) => (
                    <li key={k}><span className="text-cyan-400/70">{k}:</span> {String(v)}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip())
        
print("Components 3 generated!")
