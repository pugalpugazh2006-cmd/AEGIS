import { useOutletContext } from 'react-router-dom';
import FaultInjectionLab from './experiments/FaultInjectionLab';
import { DashboardContextType } from './DashboardLayout';

export default function ExperimentsPage() {
  const { loadDashboardData } = useOutletContext<DashboardContextType>();

  return (
    <div className="h-full max-w-3xl mx-auto space-y-6 pt-4">
      <FaultInjectionLab onExperimentStart={() => setTimeout(loadDashboardData, 1000)} />
      
      <div className="rounded-xl border border-dashed border-[#1D2A38] bg-[#0A0F16] p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-cyan-400 font-bold uppercase tracking-wider text-xs font-mono">Experimentation Info</p>
        <p className="text-[10px] text-gray-500 mt-2 font-mono max-w-md mx-auto">
          Injecting faults will cause immediate anomalies in the monitored services. The AEGIS detection engine will detect these anomalies automatically on the next polling cycle.
        </p>
      </div>
    </div>
  );
}
