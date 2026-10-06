import os

files = {
    "d:/AEGIS/frontend/src/components/topology/TopologyView.tsx": """
import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

export default function TopologyView({ elements }: { elements: any }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !elements) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#0D131C',
            'border-width': 2,
            'border-color': '#1D2A38',
            'label': 'data(label)',
            'color': '#fff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '12px',
            'font-family': 'monospace',
            'width': '120px',
            'height': '40px',
            'shape': 'round-rectangle',
            'text-outline-width': 0
          }
        },
        {
          selector: 'node[status = "HEALTHY"]',
          style: {
            'border-color': '#22c55e',
            'background-color': '#14532d',
            'color': '#fff'
          }
        },
        {
          selector: 'node[status = "ANOMALOUS"]',
          style: {
            'border-color': '#ef4444',
            'background-color': '#7f1d1d',
            'color': '#fff'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#1D2A38',
            'target-arrow-color': '#1D2A38',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        }
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        padding: 30,
        spacingFactor: 1.5
      }
    });

    // Add glowing effect to anomalous nodes using CSS class or style (cytoscape doesn't natively do glow, but we can fake it with underlay)
    cy.style().selector('node[status = "ANOMALOUS"]').style({
      'underlay-color': '#ef4444',
      'underlay-padding': 5,
      'underlay-opacity': 0.3,
      'underlay-shape': 'round-rectangle'
    }).update();
    
    cy.style().selector('node[status = "HEALTHY"]').style({
      'underlay-color': '#22c55e',
      'underlay-padding': 3,
      'underlay-opacity': 0.1,
      'underlay-shape': 'round-rectangle'
    }).update();

    return () => {
      cy.destroy();
    };
  }, [elements]);

  return (
    <div className="rounded-xl border border-[#1D2A38] bg-[#0D131C] p-6 shadow-lg h-full min-h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white uppercase tracking-wider">Service Topology</h3>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded border border-cyan-400/20">LIVE MAP</span>
      </div>
      <div className="flex-1 rounded border border-[#1D2A38] bg-[#05070B] overflow-hidden">
        {elements ? (
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-sm">
            INITIALIZING TOPOLOGY MAP...
          </div>
        )}
      </div>
    </div>
  );
}
""",
    "d:/AEGIS/frontend/src/components/experiments/FaultInjectionLab.tsx": """
import React, { useState } from 'react';

export default function FaultInjectionLab({ onExperimentStart }: { onExperimentStart?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<string>('IDLE');

  const startExperiment = async (scenario: string) => {
    setLoading(true);
    setStatus('RUNNING');
    try {
      const res = await fetch('http://localhost:8000/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_type: scenario, target_service_id: 3 })
      });
      const data = await res.json();
      setResult(data);
      setStatus('COMPLETED');
      if (onExperimentStart) onExperimentStart();
    } catch (e) {
      console.error(e);
      setStatus('FAILED');
    }
    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-[#1D2A38] bg-[#0D131C] p-6 shadow-lg">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Fault Injection Lab</h2>
        <p className="text-xs text-gray-400 mt-1">Simulate controlled infrastructure failures and observe AEGIS response.</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => startExperiment('latency_spike')}
          disabled={loading}
          className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-400 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          Latency Spike
        </button>
        <button
          onClick={() => startExperiment('high_error_rate')}
          disabled={loading}
          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          High Error Rate
        </button>
        <button
          onClick={() => startExperiment('clear')}
          disabled={loading}
          className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ml-auto"
        >
          Clear Faults
        </button>
      </div>

      <div className="rounded bg-[#05070B] border border-[#1D2A38] p-4 min-h-[100px]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-mono text-gray-500">SIMULATION OUTPUT</span>
          {status !== 'IDLE' && (
            <span className={`text-[10px] font-bold px-2 py-1 rounded ${
              status === 'RUNNING' ? 'bg-blue-500/20 text-blue-400' :
              status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {status}
            </span>
          )}
        </div>
        {result ? (
          <div className="text-xs font-mono">
            <p className="text-cyan-400">{`> INJECT_FAULT --scenario=${result.scenario_type}`}</p>
            <p className="text-gray-300 mt-1">Ground Truth: {result.ground_truth}</p>
            <p className="text-gray-500 mt-2">Telemetry updated. AEGIS observation engine analyzing...</p>
          </div>
        ) : (
          <p className="text-xs font-mono text-gray-600 italic">Waiting for command injection...</p>
        )}
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
        
print("Components 2 generated!")
