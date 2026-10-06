import CountUp from '../ui/CountUp';

interface KPICardsProps {
  servicesCount: number;
  anomalousCount: number;
  activeIncidentsCount: number;
  criticalIncidentsCount: number;
}

export default function KPICards({
  servicesCount,
  anomalousCount,
  activeIncidentsCount,
  criticalIncidentsCount,
}: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

      {/* Monitored Services */}
      <div className="kpi-card rounded-xl border border-[#1D2A38] bg-[#0D131C] p-5 shadow-lg hover:border-cyan-500/30">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5 tooltip-wrap">
            <span className="live-dot w-2 h-2 rounded-full bg-green-400 text-green-400" />
            <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">Live</span>
            <span className="tooltip">Real-time telemetry active</span>
          </div>
        </div>
        <div className="text-3xl font-black text-white mb-1">
          <CountUp target={servicesCount} />
        </div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Monitored Services</p>
        <div className="mt-3 h-px bg-gradient-to-r from-cyan-500/30 to-transparent" />
      </div>

      {/* Anomalous */}
      <div className={`kpi-card rounded-xl border p-5 shadow-lg transition-all duration-300 ${
        anomalousCount > 0
          ? 'border-amber-500/40 bg-amber-500/5 warn-pulse'
          : 'border-[#1D2A38] bg-[#0D131C] hover:border-green-500/30'
      }`}>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-lg ${anomalousCount > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-widest ${
            anomalousCount > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-green-500/10 text-green-400'
          }`}>
            {anomalousCount > 0 ? 'ALERT' : 'CLEAN'}
          </span>
        </div>
        <div className={`text-3xl font-black mb-1 ${anomalousCount > 0 ? 'text-amber-400' : 'text-green-400'}`}>
          <CountUp target={anomalousCount} />
        </div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Anomalous Services</p>
        <div className={`mt-3 h-px bg-gradient-to-r from-transparent ${anomalousCount > 0 ? 'via-amber-500/40' : 'via-green-500/20'} to-transparent`} />
      </div>

      {/* Active Incidents */}
      <div className={`kpi-card rounded-xl border p-5 shadow-lg transition-all duration-300 ${
        activeIncidentsCount > 0
          ? 'border-orange-500/40 bg-orange-500/5 hover:border-orange-500/50'
          : 'border-[#1D2A38] bg-[#0D131C] hover:border-gray-600/40'
      }`}>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-lg ${activeIncidentsCount > 0 ? 'bg-orange-500/15 text-orange-400' : 'bg-gray-500/10 text-gray-500'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-widest ${
            activeIncidentsCount > 0 ? 'bg-orange-500/15 text-orange-400' : 'bg-gray-500/10 text-gray-500'
          }`}>
            {activeIncidentsCount > 0 ? 'ACTIVE' : 'NONE'}
          </span>
        </div>
        <div className={`text-3xl font-black mb-1 ${activeIncidentsCount > 0 ? 'text-orange-400' : 'text-gray-400'}`}>
          <CountUp target={activeIncidentsCount} />
        </div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Active Incidents</p>
        <div className={`mt-3 h-px bg-gradient-to-r from-transparent ${activeIncidentsCount > 0 ? 'via-orange-500/30' : 'via-gray-600/20'} to-transparent`} />
      </div>

      {/* Critical */}
      <div className={`kpi-card rounded-xl border p-5 shadow-lg transition-all duration-300 ${
        criticalIncidentsCount > 0
          ? 'border-red-500/50 bg-red-500/8 critical-pulse'
          : 'border-[#1D2A38] bg-[#0D131C] hover:border-gray-600/40'
      }`}>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-lg ${criticalIncidentsCount > 0 ? 'bg-red-500/15 text-red-400' : 'bg-gray-500/10 text-gray-500'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-widest ${
            criticalIncidentsCount > 0 ? 'bg-red-500/15 text-red-400' : 'bg-gray-500/10 text-gray-500'
          }`}>
            {criticalIncidentsCount > 0 ? 'CRITICAL' : 'CLEAR'}
          </span>
        </div>
        <div className={`text-3xl font-black mb-1 ${criticalIncidentsCount > 0 ? 'text-red-400' : 'text-gray-400'}`}>
          <CountUp target={criticalIncidentsCount} />
        </div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Critical Faults</p>
        <div className={`mt-3 h-px bg-gradient-to-r from-transparent ${criticalIncidentsCount > 0 ? 'via-red-500/40' : 'via-gray-600/20'} to-transparent`} />
      </div>

    </div>
  );
}