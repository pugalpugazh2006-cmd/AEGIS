import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

export default function TopologyGraph({ elements }: { elements: any }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#3b82f6',
            'label': 'data(label)',
            'color': '#fff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '12px',
            'width': '100px',
            'height': '40px',
            'shape': 'round-rectangle'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#64748b',
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        }
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        padding: 10
      }
    });

    return () => {
      cy.destroy();
    };
  }, [elements]);

  return <div ref={containerRef} style={{ width: '100%', height: '400px', backgroundColor: '#1e293b', borderRadius: '8px' }} />;
}
