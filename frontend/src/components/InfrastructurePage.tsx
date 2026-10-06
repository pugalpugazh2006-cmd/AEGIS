import { useOutletContext } from 'react-router-dom';
import { DashboardContextType } from './DashboardLayout';

export default function InfrastructurePage() {
  const { services } = useOutletContext<DashboardContextType>();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
        <h2 className="text-lg font-bold text-white uppercase tracking-widest font-mono">Infrastructure Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {services.map(service => (
          <div key={service.id} className={`panel-expand rounded-xl border p-5 transition-all ${
            service.is_healthy 
              ? 'border-[#1D2A38] bg-[#0D131C] hover:border-cyan-500/30' 
              : 'border-red-500/30 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:border-red-500/50'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${service.is_healthy ? 'bg-green-500 shadow-green-glow' : 'bg-red-500 animate-pulse-slow shadow-red-glow'}`} />
                <span className="text-xs font-mono font-bold text-gray-300">SRV-{String(service.id).padStart(3, '0')}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase font-mono ${
                service.is_healthy 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {service.is_healthy ? 'HEALTHY' : 'ANOMALOUS'}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">{service.name}</h3>
            <p className="text-xs text-gray-400 font-mono mb-4">{service.description}</p>
            
            <div className="pt-4 border-t border-[#1D2A38]/50 flex justify-between items-center text-[10px] font-mono text-gray-500">
              <span>UPTIME: {service.is_healthy ? '99.99%' : 'DEGRADED'}</span>
              <span>LATENCY: {service.is_healthy ? '12ms' : 'HIGH'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
