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

function extractTestRun(data: any): any {
  if (!data) return null;
  if (Array.isArray(data)) {
    return data.length > 0 ? data[0] : null;
  }
  if (typeof data === 'object') {
    if (Array.isArray(data.test_runs) && data.test_runs.length > 0) {
      return data.test_runs[0];
    }
    return data;
  }
  return null;
}

export default function RepairWorkflow({ incident }: Props) {
  const { addToast } = useToast();
  const [repair, setRepair]   = useState<any>(null);
  const [testRun, setTestRun] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState<WorkflowStatus>('IDLE');
  const [progress, setProgress] = useState(0);
  const [recoverStep, setRecoverStep] = useState(0); // 0 = anomalous, 1 = recovering, 2 = healthy
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const initializedIncidentIdRef = useRef<number | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const stopProgress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const clearPendingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      stopProgress();
      clearPendingTimeout();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Main lifecycle effect for loading/initializing incident repair workflow
  useEffect(() => {
    stopPolling();
    stopProgress();
    clearPendingTimeout();

    // Abort any prior in-flight load request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset workflow state when switching to a different incident
    if (initializedIncidentIdRef.current !== incident.id) {
      setRepair(null);
      setTestRun(null);
      setProposalError(null);
      setIsGenerating(false);
      setStatus('IDLE');
      setProgress(0);
      setRecoverStep(0);
    }

    setLoading(true);

    let isCancelled = false;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Timeout of 8 seconds for loading incident details
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 8000);

    const loadWorkflow = async () => {
      const isResolvedIncident = incident.status === 'RESOLVED';
      const isActiveIncident = incident.status === 'ACTIVE';

      try {
        const getRes = await fetch(`http://localhost:8000/api/incidents/${incident.id}`, {
          signal: controller.signal
        });
        if (!getRes.ok) {
          let errorMsg = `Failed to fetch incident details (${getRes.status})`;
          try {
            const errData = await getRes.json();
            errorMsg = errData?.detail || errData?.message || errorMsg;
          } catch {}
          throw new Error(errorMsg);
        }
        const incidentData = await getRes.json();
        if (isCancelled) return;

        // Extract existing repairs from response
        const rawRepairs = incidentData.repairs || incidentData.incident?.repairs || (incident as any).repairs || [];
        const repairsList = Array.isArray(rawRepairs) ? rawRepairs : [];
        let foundRepair = null;
        if (repairsList.length > 0) {
          const sorted = [...repairsList].sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
          foundRepair = sorted[0];
        }

        const isResolved = isResolvedIncident || incidentData.incident?.status === 'RESOLVED' || incidentData.status === 'RESOLVED';
        const isActive = !isResolved && (isActiveIncident || incidentData.incident?.status === 'ACTIVE' || incidentData.status === 'ACTIVE');

        // Only create a new repair proposal when:
        // 1. Incident status is ACTIVE
        // 2. No existing repair proposal exists
        if (!foundRepair && isActive) {
          if (isCancelled) return;
          setIsGenerating(true);
          const res = await fetch('http://localhost:8000/api/repairs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ incident_id: incident.id, action_type: 'clear_fault' }),
            signal: controller.signal
          });
          if (!res.ok) {
            let errorMsg = `Failed to generate repair proposal (${res.status})`;
            try {
              const errData = await res.json();
              errorMsg = errData?.detail || errData?.message || errorMsg;
            } catch {}
            throw new Error(errorMsg);
          }
          foundRepair = await res.json();
        }

        // If the incident is RESOLVED and no repair record was found, present the resolved action
        if (!foundRepair && isResolved) {
          foundRepair = {
            id: incident.id,
            incident_id: incident.id,
            action_type: 'clear_fault',
            status: 'APPROVED'
          };
        }

        if (isCancelled) return;

        if (foundRepair) {
          setRepair(foundRepair);
          // Mark incident as initialized ONLY after async fetch/creation has completed successfully
          initializedIncidentIdRef.current = incident.id;

          let newStatus: WorkflowStatus = 'PROPOSED';
          if (isResolved || foundRepair.status === 'APPROVED') {
            newStatus = 'APPROVED';
          } else if (foundRepair.status === 'AWAITING_APPROVAL') {
            newStatus = 'VALIDATED';
          } else if (foundRepair.status === 'VALIDATING') {
            newStatus = 'VALIDATING';
          } else if (foundRepair.status === 'FAILED') {
            newStatus = 'FAILED';
          } else {
            newStatus = 'PROPOSED';
          }

          setStatus(newStatus);

          if (newStatus === 'APPROVED') {
            setRecoverStep(2);
          }

          // Fetch test runs independently if repair id exists
          if (foundRepair.id) {
            fetch(`http://localhost:8000/api/repairs/${foundRepair.id}/test-runs`, {
              signal: controller.signal
            })
              .then(async (r) => {
                if (!r.ok) {
                  throw new Error(`HTTP ${r.status}`);
                }
                return r.json();
              })
              .then(data => {
                if (isCancelled) return;
                const run = extractTestRun(data);
                if (run) {
                  setTestRun(run);
                  if (newStatus === 'VALIDATING') {
                    if (run.status === 'PASSED' || run.status === 'PASS') {
                      setStatus('VALIDATED');
                    } else if (run.status === 'FAILED' || run.status === 'FAIL') {
                      setStatus('FAILED');
                    }
                  }
                }
              })
              .catch(err => {
                if (err.name !== 'AbortError') {
                  console.error('Failed to fetch test runs:', err);
                }
              });
          }
        } else {
          throw new Error('No remediation proposal could be found or generated for this incident.');
        }
      } catch (e: any) {
        if (isCancelled) return;
        const isTimeout = controller.signal.aborted;
        const errorMsg = isTimeout
          ? 'Remediation request timed out after 8s. Please retry.'
          : (e?.message || 'Failed to load incident remediation');

        console.error('Error loading repair workflow:', e);
        addToast(errorMsg, 'error');
        setProposalError(errorMsg);
      } finally {
        clearTimeout(timeoutId);
        if (!isCancelled) {
          setLoading(false);
          setIsGenerating(false);
        }
      }
    };

    loadWorkflow();

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    };
  }, [incident.id, retryTrigger]);

  const handleRetryProposal = () => {
    setProposalError(null);
    setLoading(true);
    setRetryTrigger(c => c + 1);
  };

  const handleValidationComplete = (run: any) => {
    stopPolling();
    stopProgress();
    setProgress(100);
    setTestRun(run);

    const isPassed = run.status === 'PASSED' || run.status === 'PASS';
    const isFailed = run.status === 'FAILED' || run.status === 'FAIL';

    clearPendingTimeout();
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      if (isPassed) {
        setStatus('VALIDATED');
        addToast('Sandbox validation PASSED ✓', 'success');
      } else if (isFailed) {
        setStatus('FAILED');
        addToast('Sandbox validation FAILED ✗', 'error');
      } else {
        setStatus('VALIDATED');
        addToast(`Sandbox validation ${run.status}`, 'info');
      }
    }, 400);
  };

  const validateFix = async () => {
    if (!repair) return;
    if (status === 'APPROVED' || repair.status === 'APPROVED' || incident.status === 'RESOLVED') {
      return;
    }
    stopPolling();
    stopProgress();
    clearPendingTimeout();

    setLoading(true);
    setStatus('VALIDATING');
    setProgress(0);
    addToast('Sandbox validation started', 'info');

    // Animate progress bar up to 90% while waiting for validation result
    progressIntervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 90) {
          stopProgress();
          return 90;
        }
        return p + 8;
      });
    }, 200);

    try {
      const valRes = await fetch(`http://localhost:8000/api/repairs/${repair.id}/validate`, { method: 'POST' });
      if (!valRes.ok) {
        let errorMsg = `Validation request failed (${valRes.status})`;
        try {
          const errData = await valRes.json();
          errorMsg = errData?.detail || errData?.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const valData = await valRes.json().catch(() => null);
      const immediateRun = extractTestRun(valData);
      if (
        immediateRun &&
        (immediateRun.status === 'PASSED' ||
          immediateRun.status === 'PASS' ||
          immediateRun.status === 'FAILED' ||
          immediateRun.status === 'FAIL')
      ) {
        handleValidationComplete(immediateRun);
        return;
      }

      let isFinished = false;

      const checkTestRuns = async () => {
        if (isFinished) return;
        try {
          const res = await fetch(`http://localhost:8000/api/repairs/${repair.id}/test-runs`);
          if (!res.ok) {
            console.error(`Failed to fetch test runs: HTTP ${res.status}`);
            return;
          }
          const data = await res.json();
          const run = extractTestRun(data);
          if (run) {
            setTestRun(run);
            const isCompleted =
              run.status === 'PASSED' ||
              run.status === 'PASS' ||
              run.status === 'FAILED' ||
              run.status === 'FAIL';
            if (isCompleted) {
              isFinished = true;
              handleValidationComplete(run);
            }
          }
        } catch (e) {
          console.error('Error polling test runs:', e);
        }
      };

      await checkTestRuns();

      if (!isFinished) {
        pollIntervalRef.current = setInterval(checkTestRuns, 1000);
      }
    } catch (e: any) {
      console.error(e);
      stopProgress();
      stopPolling();
      setLoading(false);
      setStatus('FAILED');
      addToast(e?.message || 'Validation request failed', 'error');
    }
  };

  const approveRepair = async () => {
    if (!repair) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/repairs/${repair.id}/approve`, { method: 'POST' });
      if (!res.ok) {
        let errorMsg = `Approval failed (${res.status})`;
        try {
          const errData = await res.json();
          errorMsg = errData?.detail || errData?.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }
      setStatus('APPROVED');
      addToast('Repair approved — initiating recovery', 'success');

      // Animate ANOMALOUS → RECOVERING → HEALTHY
      setTimeout(() => { setRecoverStep(1); }, 400);
      setTimeout(() => {
        setRecoverStep(2);
        addToast('✓ Recovery Verified — Service Healthy', 'success');
      }, 2200);
    } catch (e: any) {
      console.error(e);
      addToast(e?.message || 'Approval failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (proposalError && !repair) {
    const isResolved = incident.status === 'RESOLVED';
    return (
      <div className="rounded-xl border border-red-500/30 bg-[#0D131C] p-6 shadow-lg fade-in-up">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest font-mono mb-1">
              {isResolved ? 'Remediation Load Error' : 'Remediation Proposal Failed'}
            </h3>
            <p className="text-xs text-gray-500">
              {isResolved
                ? `Failed to load repair details for resolved incident INC-${String(incident.id).padStart(4, '0')}.`
                : `Failed to generate or retrieve repair proposal for incident INC-${String(incident.id).padStart(4, '0')}.`}
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider font-mono bg-red-500/15 text-red-400 border-red-500/30">
            ERROR
          </span>
        </div>
        <div className="bg-[#05070B] rounded-lg border border-red-500/20 p-4 mb-4">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">Backend Error</span>
          <p className="text-xs font-mono text-red-400 break-words">{proposalError}</p>
        </div>
        <button
          onClick={handleRetryProposal}
          disabled={loading}
          className="btn-cyber w-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/50 text-cyan-400 font-bold uppercase tracking-wider text-xs py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Retrying…' : isResolved ? '↻ Retry Loading Remediation' : '↻ Retry Generating Proposal'}
        </button>
      </div>
    );
  }

  if (!repair) {
    const isResolved = incident.status === 'RESOLVED';
    const loadingMessage = isGenerating
      ? 'Generating remediation proposal…'
      : isResolved
      ? 'Loading resolved remediation details…'
      : 'Loading incident remediation…';

    return (
      <div className="rounded-xl border border-[#1D2A38] bg-[#0D131C] p-6 shadow-lg">
        <div className="flex items-center gap-3 text-cyan-500">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-mono uppercase tracking-widest">{loadingMessage}</span>
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
  const isRunPassed = testRun?.status === 'PASS' || testRun?.status === 'PASSED';

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
            <p className="text-xs text-gray-500">
              {status === 'APPROVED'
                ? 'Remediation has been applied and verified for this incident.'
                : 'AEGIS has proposed a fix for this incident.'}
            </p>
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
            <span className="text-sm font-bold text-cyan-400 font-mono">{repair?.action_type || 'clear_fault'}</span>
          </div>
        </div>

        {/* Validate button - only when PROPOSED, ACTIVE incident, and repair not already approved */}
        {status === 'PROPOSED' && incident.status === 'ACTIVE' && repair?.status !== 'APPROVED' && (
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
            {testRun && (
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-red-500/8 border-red-500/30">
                <span className="text-lg text-red-400">✗</span>
                <div>
                  <p className="text-xs font-bold font-mono uppercase tracking-widest text-red-400">
                    Sandbox {testRun.status || 'FAILED'}
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    Fix did not resolve the issue.
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={validateFix}
              disabled={loading}
              className="btn-cyber w-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/50 text-cyan-400 font-bold uppercase tracking-wider text-xs py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Retrying Validation…' : 'Retry Validation'}
            </button>
          </div>
        )}

        {/* Validated / Approved content */}
        {(status === 'VALIDATED' || status === 'APPROVED') && (
          <div className="space-y-4">
            {/* Pass/Fail badge if testRun available */}
            {testRun && (
              <div className={`flex items-center gap-2 p-3 rounded-lg border fade-in-up ${
                isRunPassed
                  ? 'bg-green-500/8 border-green-500/30'
                  : 'bg-red-500/8 border-red-500/30'
              }`}>
                <span className={`text-lg ${isRunPassed ? 'text-green-400' : 'text-red-400'}`}>
                  {isRunPassed ? '✓' : '✗'}
                </span>
                <div>
                  <p className={`text-xs font-bold font-mono uppercase tracking-widest ${isRunPassed ? 'text-green-400' : 'text-red-400'}`}>
                    Sandbox {testRun.status}
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    {isRunPassed ? 'Remediation verified effective.' : 'Fix did not resolve the issue.'}
                  </p>
                </div>
              </div>
            )}

            {/* Before / After comparison if testRun metrics available */}
            {testRun && (
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
            )}

            {/* Approve button - only when approval is still required */}
            {status === 'VALIDATED' && isRunPassed && repair?.status !== 'APPROVED' && incident.status !== 'RESOLVED' && (
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

            {/* Recovery status - displayed whenever APPROVED */}
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