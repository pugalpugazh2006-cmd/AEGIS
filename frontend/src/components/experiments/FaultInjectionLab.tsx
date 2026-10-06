import { useState } from 'react';
import { useToast } from '../ui/Toast';

interface Props { onExperimentStart?: () => void; }

type ScenarioId = 'latency_spike' | 'high_error_rate' | 'clear';

const scenarios: { id: ScenarioId; label: string; desc: string; color: string; icon: string }[] = [
  {
    id: 'latency_spike',
    label: 'Latency Spike',
    desc: 'Inject 800ms+ response latency',
    color: 'amber',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    id: 'high_error_rate',
    label: 'Error Surge',
    desc: 'Force 45%+ HTTP error rate',
    color: 'red',
    icon: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  },
];

const colorMap: Record<string, string> = {
  amber: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-400',
  red:   'bg-red-500/10 hover:bg-red-500/20 border-red-500/40 text-red-400',
  cyan:  'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
};

export default function FaultInjectionLab({ onExperimentStart }: Props) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState<'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED'>('IDLE');
  const [logs, setLogs]       = useState<string[]>([]);

  const appendLog = (msg: string) => setLogs(prev => [...prev.slice(-8), msg]);

  const startExperiment = async (scenario: ScenarioId) => {
    setLoading(true);
    setStatus('RUNNING');
    setLogs([]);
    appendLog(`> INJECT_FAULT --scenario=${scenario} --target=service-3`);
    appendLog(`> Authenticating with AEGIS Chaos Engine…`);
    addToast(`Fault injection started: ${scenario}`, 'warning');

    try {
      const res = await fetch('http://localhost:8000/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_type: scenario, target_service_id: 3 }),
      });
      const data = await res.json();
      setStatus('COMPLETED');
      appendLog(`> Injection complete. Ground truth: ${data.ground_truth}`);
      appendLog(`> AEGIS observation engine activated.`);
      appendLog(`> Telemetry pipeline receiving anomalous signals…`);
      addToast('Fault injected — AEGIS detection engine active', 'info');
      if (onExperimentStart) onExperimentStart();
    } catch (e) {
      console.error(e);
      setStatus('FAILED');
      appendLog(`> ERROR: Injection failed. Check backend connectivity.`);
      addToast('Fault injection failed', 'error');
    }
    setLoading(false);
  };

  const clearFaults = async () => {
    setLoading(true);
    setStatus('RUNNING');
    appendLog(`> CLEAR_FAULTS --all`);
    addToast('Clearing all injected faults…', 'info');
    try {
      await fetch('http://localhost:8000/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_type: 'clear', target_service_id: 3 }),
      });
      setStatus('COMPLETED');
      appendLog(`> All faults cleared. Services resuming normal operation.`);
      addToast('Faults cleared — systems nominal', 'success');
      if (onExperimentStart) onExperimentStart();
    } catch (e) {
      setStatus('FAILED');
      appendLog(`> ERROR: Clear operation failed.`);
      addToast('Clear operation failed', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-[#1D2A38] bg-[#0D131C] p-6 shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest font-mono">Fault Injection Lab</h2>
        </div>
        <p className="text-[10px] text-gray-500 font-mono">Simulate controlled infrastructure failures</p>
      </div>

      {/* Injection buttons */}
      <div className="flex flex-col gap-2 mb-4">
        {scenarios.map(s => (
          <button
            key={s.id}
            onClick={() => startExperiment(s.id)}
            disabled={loading}
            className={`btn-cyber flex items-center gap-3 border rounded-lg px-4 py-2.5 text-left transition-all disabled:opacity-40 ${colorMap[s.color]}`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
            </svg>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">{s.label}</p>
              <p className="text-[10px] opacity-60">{s.desc}</p>
            </div>
          </button>
        ))}
        <button
          onClick={clearFaults}
          disabled={loading}
          className={`btn-cyber flex items-center gap-3 border rounded-lg px-4 py-2.5 text-left transition-all disabled:opacity-40 ${colorMap.cyan}`}
        >
          <svg className="w-4 h-4 flex-shrink-0 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Clear All Faults</p>
            <p className="text-[10px] text-cyan-400/60">Restore normal operation</p>
          </div>
        </button>
      </div>

      {/* Console output */}
      <div className="flex-1 rounded-lg bg-[#05070B] border border-[#1D2A38] p-3 min-h-[100px] overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">CONSOLE OUTPUT</span>
          {status !== 'IDLE' && (
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest font-mono ${
              status === 'RUNNING'   ? 'bg-blue-500/15 text-blue-400' :
              status === 'COMPLETED' ? 'bg-green-500/15 text-green-400' :
              'bg-red-500/15 text-red-400'
            }`}>
              {status}
            </span>
          )}
        </div>
        {logs.length === 0 ? (
          <p className="text-[10px] font-mono text-gray-700 italic">Awaiting command injection…</p>
        ) : (
          <div className="space-y-0.5">
            {logs.map((log, i) => (
              <p key={i} className={`text-[10px] font-mono fade-in-up ${
                log.startsWith('> INJECT') || log.startsWith('> CLEAR') ? 'text-cyan-400' :
                log.includes('ERROR') ? 'text-red-400' :
                log.includes('complete') || log.includes('cleared') ? 'text-green-400' :
                'text-gray-400'
              }`}>
                {log}
              </p>
            ))}
            {status === 'RUNNING' && (
              <p className="text-[10px] font-mono text-gray-600 animate-pulse">_</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}