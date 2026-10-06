import React from 'react';

interface Props {
  hasTelemetry: boolean;
  hasAnomaly: boolean;
  hasIncident: boolean;
  hasRCA: boolean;
  hasValidation: boolean;
  hasRecovery: boolean;
}

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

export default function IntelligencePipeline({
  hasTelemetry, hasAnomaly, hasIncident, hasRCA, hasValidation, hasRecovery
}: Props) {
  const steps = [
    {
      id: 'telemetry',
      label: 'TELEMETRY',
      desc: 'System signals collected',
      active: hasTelemetry,
      color: 'cyan',
    },
    {
      id: 'detection',
      label: 'DETECTION',
      desc: 'Anomaly identified',
      active: hasAnomaly,
      color: 'amber',
    },
    {
      id: 'correlation',
      label: 'CORRELATION',
      desc: 'Incident correlated',
      active: hasIncident,
      color: 'orange',
    },
    {
      id: 'rca',
      label: 'ROOT CAUSE',
      desc: 'Cause identified',
      active: hasRCA,
      color: 'purple',
    },
    {
      id: 'validation',
      label: 'VALIDATION',
      desc: 'Fix verified',
      active: hasValidation,
      color: 'blue',
    },
    {
      id: 'recovery',
      label: 'RECOVERY',
      desc: 'Service restored',
      active: hasRecovery,
      color: 'green',
    },
  ] as const;

  const colorMap = {
    cyan:   { ring: 'border-cyan-400',   bg: 'bg-cyan-500/15',   text: 'text-cyan-400',   connector: 'via-cyan-400/60' },
    amber:  { ring: 'border-amber-400',  bg: 'bg-amber-500/15',  text: 'text-amber-400',  connector: 'via-amber-400/60' },
    orange: { ring: 'border-orange-400', bg: 'bg-orange-500/15', text: 'text-orange-400', connector: 'via-orange-400/60' },
    purple: { ring: 'border-purple-400', bg: 'bg-purple-500/15', text: 'text-purple-400', connector: 'via-purple-400/60' },
    blue:   { ring: 'border-blue-400',   bg: 'bg-blue-500/15',   text: 'text-blue-400',   connector: 'via-blue-400/60' },
    green:  { ring: 'border-green-400',  bg: 'bg-green-500/15',  text: 'text-green-400',  connector: 'via-green-400/60' },
  };

  // Find the last active index to determine the "currently processing" step
  const lastActiveIdx = steps.reduce((last, s, i) => s.active ? i : last, -1);
  const nextProcessingIdx = lastActiveIdx + 1;

  return (
    <div className="rounded-xl border border-[#1D2A38] bg-[#0D131C] p-6 shadow-lg mb-6 overflow-x-auto">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">
          AEGIS Intelligence Pipeline
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="live-dot w-1.5 h-1.5 rounded-full bg-cyan-400 text-cyan-400" />
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Processing</span>
        </div>
      </div>

      <div className="flex items-start min-w-[700px]">
        {steps.map((step, idx) => {
          const c = colorMap[step.color];
          const isProcessing = idx === nextProcessingIdx && lastActiveIdx >= 0;
          const prevActive = idx > 0 && steps[idx - 1].active;

          return (
            <React.Fragment key={step.id}>
              {/* Step node */}
              <div className="flex flex-col items-center flex-1">
                {/* Circle */}
                <div className={`
                  relative w-11 h-11 rounded-full flex items-center justify-center border-2 z-10
                  transition-all duration-500
                  ${step.active
                    ? `${c.ring} ${c.bg} ${c.text} stage-active`
                    : isProcessing
                      ? 'border-[#2A3D52] bg-[#111923] text-gray-500 animate-pulse'
                      : 'border-[#1D2A38] bg-[#0A0F16] text-gray-600'
                  }
                `}>
                  {step.active ? (
                    <CheckIcon />
                  ) : isProcessing ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <span className="text-xs font-mono font-bold">{idx + 1}</span>
                  )}

                  {/* Outer ring for active */}
                  {step.active && (
                    <div className={`absolute inset-[-5px] rounded-full border ${c.ring} opacity-30`} />
                  )}
                </div>

                {/* Label */}
                <div className="mt-3 text-center px-1">
                  <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                    step.active ? c.text : isProcessing ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {step.label}
                  </p>
                  <p className={`text-[9px] mt-0.5 transition-colors duration-300 ${
                    step.active ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {step.desc}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="flex-1 h-[2px] mt-[22px] mx-1 relative overflow-hidden rounded-full bg-[#1D2A38]">
                  {(prevActive && steps[idx + 1].active) ? (
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${c.connector} to-transparent connector-active`} />
                  ) : prevActive ? (
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${c.connector} to-[#1D2A38]`} />
                  ) : null}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}