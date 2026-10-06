import { useState, useEffect } from 'react';
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