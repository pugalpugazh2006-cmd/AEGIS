import { useOutletContext } from 'react-router-dom';
import TopologyView from './topology/TopologyView';
import { DashboardContextType } from './DashboardLayout';

export default function TopologyPage() {
  const { topology } = useOutletContext<DashboardContextType>();

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <h2 className="text-lg font-bold text-white uppercase tracking-widest font-mono">Service Topology</h2>
      </div>
      
      <div className="flex-1 min-h-[600px] border border-[#1D2A38] bg-[#0D131C] rounded-xl overflow-hidden shadow-lg p-2 relative">
        <TopologyView elements={topology} />
        <div className="absolute top-4 left-4 bg-[#05070B]/80 backdrop-blur border border-[#1D2A38] p-3 rounded-lg pointer-events-none">
          <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-2 font-bold">Node Status Guide</p>
          <div className="space-y-1.5 text-[10px] font-mono">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-[#22d3ee] bg-[#22d3ee]/20" /> <span className="text-gray-300">Healthy Service</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-[#ef4444] bg-[#ef4444]/20" /> <span className="text-gray-300">Anomalous State</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
