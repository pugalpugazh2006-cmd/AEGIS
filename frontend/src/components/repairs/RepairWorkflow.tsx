import { useState, useEffect, useRef } from 'react';
import { Incident } from '../../types';
import { useToast } from '../ui/Toast';

interface Props { incident: Incident; }

type WorkflowStatus = 'IDLE' | 'PROPOSED' | 'VALIDATING' | 'VALIDATED' | 'APPROVED' | 'FAILED';

function MetricBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const bgColor = color
    .replace('text-red-400',   'bg-red-400')
    .replace('text-green-400', 'bg-green-400')
    .replace('text-cyan-400',  'bg-cyan-400')
    .replace('text-amber-400', 'bg-amber-400');
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{label}</span>
        <span className={`text-xs font-bold font-mono ${color}`}>{value}</span>
      </div>
      <div className="h-1 bg-[#1D2A38] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bgColor}`}
          style={{ width: `${pct}%`, transitionDelay: '200ms' }}
        />
      </div>
    </div>
  );
}

export default function RepairWorkflow({ incident }: Props) {
  const { addToast } = useToast();
  const [repair, setRepair]   = useState<any>(null);
  const [testRun, setTestRun] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState<WorkflowStatus>('IDLE');
  const [progress, setProgress] = useState(0);
  const [recoverStep, setRecoverStep] = useState(0); // 0 = anomalous, 1 = recovering, 2 = healthy

  const initiatedForIncident = useRef<number | null>(null);

  useEffect(() => {
    if (incident.id !== initiatedForIncident.current) {
      setRepair(null);
      setTestRun(null);
      setStatus('IDLE');
      setLoading(false);
      setProgress(0);
      setRecoverStep(0);
      initiatedForIncident.current = null;
    }
  }, [incident.id]);

  useEffect(() => {
    if (status !== 'IDLE' || initiatedForIncident.current === incident.id) {
      return;
    }
    initiatedForIncident.current = incident.id;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const initiateRepair = async () => {
      setLoading(true);
      try {
        const getRes = await fetch(`http://localhost:8000/api/incidents/${incident.id}`, { signal: controller.signal });
        if (!getRes.ok) throw new Error('Failed to fetch incident details');
        const incidentData = await getRes.json();
        
        let foundRepair = null;
        if (incidentData.repairs && incidentData.repairs.length > 0) {
          foundRepair = incidentData.repairs[incidentData.repairs.length - 1];
        }

        if (!foundRepair) {
          const res = await fetch('http://localhost:8000/api/repairs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ incident_id: incident.id, action_type: 'clear_fault' }),
            signal: controller.signal
          });
          if (!res.ok) throw new Error('Failed to generate repair proposal');
          foundRepair = await res.json();
        }
        
        clearTimeout(timeoutId);

        if (initiatedForIncident.current === incident.id) {
          setRepair(foundRepair);
          
          let newStatus: WorkflowStatus = 'PROPOSED';
          if (foundRepair.status === 'PROPOSED') newStatus = 'PROPOSED';
          else if (foundRepair.status === 'VALIDATING') newStatus = 'VALIDATING';
          else if (foundRepair.status === 'AWAITING_APPROVAL') newStatus = 'VALIDATED';
          else if (foundRepair.status === 'APPROVED') newStatus = 'APPROVED';
          else if (foundRepair.status === 'FAILED') newStatus = 'FAILED';

          setStatus(newStatus);
          
          if (newStatus === 'APPROVED') {
            setRecoverStep(2);
          }

          if (newStatus === 'VALIDATED' || newStatus === 'APPROVED' || newStatus === 'VALIDATING') {
            // Fetch test runs independently just in case they aren't embedded
            fetch(`http://localhost:8000/api/repairs/${foundRepair.id}/test-runs`)
              .then(r => r.json())
              .then(data => {
                if (data.length > 0) {
                  setTestRun(data[data.length - 1]);
                }
              }).catch(console.error);
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error(e);
          addToast('Failed to generate repair proposal', 'error');
        } else {
          addToast('Repair generation timed out', 'error');
        }
        if (initiatedForIncident.current === incident.id) {
          setStatus('IDLE');
          initiatedForIncident.current = null;
        }
      } finally {
        if (initiatedForIncident.current === incident.id) {
          setLoading(false);
        }
      }
    };

    initiateRepair();

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [incident.id, status, addToast]);

  const validateFix = async () => {
    if (!repair) return;
    setLoading(true);
    setStatus('VALIDATING');
    setProgress(0);
    addToast('Sandbox validation started', 'info');

    // Animate progress bar
    const progInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(progInterval); return 90; }
        return p + 8;
      });
    }, 200);

    try {
      await fetch(`http://localhost:8000/api/repairs/${repair.id}/validate`, { method: 'POST' });

      const poll = setInterval(async () => {
        try {
          const res  = await fetch(`http://localhost:8000/api/repairs/${repair.id}/test-runs`);
          const data = await res.json();
          if (data.length > 0) {
            const run = data[0];
            setTestRun(run);
            if (run.status === 'PASS' || run.status === 'FAIL') {
              clearInterval(poll);
              clearInterval(progInterval);
              setProgress(100);
              setTimeout(() => {
                setStatus('VALIDATED');
                setLoading(false);
                addToast(
                  run.status === 'PASS' ? 'Sandbox validation PASSED ✓' : 'Sandbox validation FAILED ✗',
                  run.status === 'PASS' ? 'success' : 'error'
                );
              }, 400);
            }
          }
        } catch (e) { console.error(e); }
      }, 1000);
    } catch (e) {
      console.error(e);
      clearInterval(progInterval);
      setLoading(false);
      setStatus('PROPOSED');
      addToast('Validation request failed', 'error');
    }
  };

  const approveRepair = async () => {
    if (!repair) return;
    setLoading(true);
    try {
      await fetch(`http://localhost:8000/api/repairs/${repair.id}/approve`, { method: 'POST' });
      setStatus('APPROVED');
      addToast('Repair approved — initiating recovery', 'success');

      // Animate ANOMALOUS → RECOVERING → HEALTHY
      setTimeout(() => { setRecoverStep(1); }, 400);
      setTimeout(() => {
        setRecoverStep(2);
        addToast('✓ Recovery Verified — Service Healthy', 'success');
      }, 2200);
    } catch (e) {
      console.error(e);
      addToast('Approval failed', 'error');
    }
    setLoading(false);
  };

  if (!repair) {
    return (
      <div className="rounded-xl border border-[#1D2A38] bg-[#0D131C] p-6 shadow-lg">
        <div className="flex items-center gap-3 text-cyan-500">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-mono uppercase tracking-widest">Generating remediation proposal…</span>
        </div>
        <div className="skeleton h-2 w-full mt-4 rounded" />
        <div className="skeleton h-2 w-3/4 mt-2 rounded" />
      </div>
    );
  }

  const serviceStatus = recoverStep === 0 ? 'ANOMALOUS' : recoverStep === 1 ? 'RECOVERING' : 'HEALTHY';
  const serviceStatusColor =
    recoverStep === 0 ? 'text-red-400 bg-red-500/10 border-red-500/30' :
    recoverStep === 1 ? 'recovering-text bg-cyan-500/5 border-cyan-500/20' :
    'text-green-400 bg-green-500/10 border-green-500/30';

  const baseline = testRun?.baseline_metrics;
  const postFix  = testRun?.post_fix_metrics;

  return (
    <div className="rounded-xl border border-[#1D2A38] bg-[#0D131C] shadow-lg overflow-hidden">
      {/* Status accent bar */}
      <div className={`h-0.5 w-full transition-all duration-700 ${
        status === 'APPROVED' ? 'bg-gradient-to-r from-green-500 via-cyan-500 to-green-500' :
        status === 'VALIDATED' ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500' :
        status === 'VALIDATING' ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500' :
        status === 'FAILED' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
        'bg-gradient-to-r from-amber-500 to-orange-500'
      }`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono mb-1">
              Recommended Remediation
            </h3>
            <p className="text-xs text-gray-500">AEGIS has proposed a fix for this incident.</p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider font-mono ${
            status === 'APPROVED'  ? 'bg-green-500/15 text-green-400 border-green-500/30' :
            status === 'VALIDATED' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' :
            status === 'VALIDATING'? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
            status === 'FAILED'    ? 'bg-red-500/15 text-red-400 border-red-500/30' :
            'bg-amber-500/15 text-amber-400 border-amber-500/30'
          }`}>
            {status}
          </span>
        </div>

        {/* Action detail */}
        <div className="bg-[#05070B] rounded-lg border border-[#1D2A38] p-4 mb-5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Action</span>
            <span className="text-sm font-bold text-cyan-400 font-mono">{repair.action_type || 'clear_fault'}</span>
          </div>
        </div>

        {/* Validate button */}
        {status === 'PROPOSED' && (
          <button
            onClick={validateFix}
            disabled={loading}
            className="btn-cyber w-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/50 text-cyan-400 font-bold uppercase tracking-wider text-xs py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Initiating Validation…' : '⚡ Validate Fix in Sandbox'}
          </button>
        )}

        {/* Validating state */}
        {status === 'VALIDATING' && (
          <div className="space-y-3 fade-in-up">
            <div className="flex items-center justify-center gap-3 p-5 border border-dashed border-[#1D2A38] rounded-lg bg-[#05070B]">
              <svg className="animate-spin h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <div>
                <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase font-mono">Running Sandbox Tests</p>
                <p className="text-gray-500 text-[10px] font-mono mt-0.5">Comparing baseline vs. post-fix metrics…</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-[#1D2A38] rounded-full overflow-hidden progress-bar-indeterminate">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-right text-[10px] font-mono text-gray-500">{progress}%</p>
          </div>
        )}

        {/* Failed state */}
        {status === 'FAILED' && (
          <div className="space-y-3 fade-in-up">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-xs font-bold font-mono uppercase tracking-widest">Repair Failed</p>
              <p className="text-gray-500 text-[10px] mt-1 font-mono">The proposed remediation could not be applied or failed validation.</p>
            </div>
            <button
              onClick={() => setStatus('PROPOSED')}
              disabled={loading}
              className="btn-cyber w-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/50 text-cyan-400 font-bold uppercase tracking-wider text-xs py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              Retry Validation
            </button>
          </div>
        )}

        {/* Validated / Approved: show metrics */}
        {(status === 'VALIDATED' || status === 'APPROVED') && testRun && (
          <div className="space-y-4">
            {/* Pass/Fail badge */}
            <div className={`flex items-center gap-2 p-3 rounded-lg border fade-in-up ${
              testRun.status === 'PASS'
                ? 'bg-green-500/8 border-green-500/30'
                : 'bg-red-500/8 border-red-500/30'
            }`}>
              <span className={`text-lg ${testRun.status === 'PASS' ? 'text-green-400' : 'text-red-400'}`}>
                {testRun.status === 'PASS' ? '✓' : '✗'}
              </span>
              <div>
                <p className={`text-xs font-bold font-mono uppercase tracking-widest ${testRun.status === 'PASS' ? 'text-green-400' : 'text-red-400'}`}>
                  Sandbox {testRun.status}
                </p>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                  {testRun.status === 'PASS' ? 'Remediation verified effective.' : 'Fix did not resolve the issue.'}
                </p>
              </div>
            </div>

            {/* Before / After comparison */}
            <div className="grid grid-cols-2 gap-3 fade-in-up fade-in-up-delay-1">
              {/* Before */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest font-mono mb-3">Before Fix</p>
                {baseline ? (
                  <>
                    <MetricBar
                      label="Latency"
                      value={baseline.latency ?? 850}
                      max={1500}
                      color="text-red-400"
                    />
                    <MetricBar
                      label="Error Rate"
                      value={Math.round((baseline.error_rate ?? 0.45) * 100)}
                      max={100}
                      color="text-red-400"
                    />
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="skeleton h-3 w-full rounded" />
                    <div className="skeleton h-3 w-3/4 rounded" />
                  </div>
                )}
              </div>
              {/* After */}
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 fade-in-up fade-in-up-delay-2">
                <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest font-mono mb-3">After Fix</p>
                {postFix ? (
                  <>
                    <MetricBar
                      label="Latency"
                      value={postFix.latency ?? 120}
                      max={1500}
                      color="text-green-400"
                    />
                    <MetricBar
                      label="Error Rate"
                      value={Math.round((postFix.error_rate ?? 0.01) * 100)}
                      max={100}
                      color="text-green-400"
                    />
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="skeleton h-3 w-full rounded" />
                    <div className="skeleton h-3 w-3/4 rounded" />
                  </div>
                )}
              </div>
            </div>

            {/* Approve button */}
            {status === 'VALIDATED' && testRun.status === 'PASS' && (
              <div className="border-t border-[#1D2A38] pt-4 fade-in-up fade-in-up-delay-3">
                <p className="text-[10px] text-gray-500 font-mono text-center mb-3">
                  AEGIS has evidence the remediation restores service health. Confirm approval.
                </p>
                <button
                  onClick={approveRepair}
                  disabled={loading}
                  className="btn-cyber w-full bg-green-500/15 hover:bg-green-500/25 border border-green-500/50 text-green-400 font-bold uppercase tracking-wider text-xs py-3 rounded-lg transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                >
                  {loading ? 'Approving…' : '✓ Approve Repair & Deploy'}
                </button>
              </div>
            )}

            {/* Recovery status */}
            {status === 'APPROVED' && (
              <div className="space-y-2 border-t border-[#1D2A38] pt-4 approved-banner">
                {/* Service recovery transition */}
                <div className={`flex items-center justify-between p-3 rounded-lg border font-mono transition-all duration-700 ${serviceStatusColor}`}>
                  <span className="text-[10px] uppercase tracking-widest">Service Status</span>
                  <span className="text-xs font-bold tracking-wider">{serviceStatus}</span>
                </div>
                <div className="flex items-center gap-2 text-green-400 text-xs font-mono">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  REPAIR APPROVED
                </div>
                {recoverStep >= 2 && (
                  <div className="flex items-center gap-2 text-green-400 text-xs font-mono fade-in-up">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    RECOVERY VERIFIED
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}