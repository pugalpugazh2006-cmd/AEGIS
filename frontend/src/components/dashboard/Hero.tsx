
export default function Hero({ servicesCount, criticalCount }: { servicesCount: number, criticalCount: number }) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-xl border border-[#1D2A38] bg-gradient-to-r from-[#0D131C] to-[#111923] p-8 shadow-2xl">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-white mb-2">AEGIS <span className="text-cyan-400 font-light">Autonomous Guard</span></h2>
          <p className="text-lg text-gray-400 tracking-widest uppercase font-semibold">Detect. Diagnose. Validate. Recover.</p>
        </div>
        <div className="flex items-center gap-8 border-l border-[#1D2A38] pl-8">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">System Status</p>
            <p className="text-xl font-bold text-green-400 uppercase tracking-wider flex items-center gap-2 justify-center">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Operational
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Monitoring</p>
            <p className="text-xl font-bold text-white">{servicesCount} <span className="text-gray-400 text-sm font-normal">Services</span></p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Critical Faults</p>
            <p className={`text-xl font-bold ${criticalCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>{criticalCount} <span className="text-gray-500 text-sm font-normal">Active</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}