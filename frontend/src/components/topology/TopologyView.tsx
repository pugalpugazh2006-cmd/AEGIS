import { useEffect, useRef } from 'react';
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