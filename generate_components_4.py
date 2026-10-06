import os

files = {
    "d:/AEGIS/frontend/src/components/repairs/RepairWorkflow.tsx": """
import React, { useState, useEffect } from 'react';
import { Incident } from '../../types';

export default function RepairWorkflow({ incident }: { incident: Incident }) {
  const [repair, setRepair] = useState<any>(null);
  const [testRun, setTestRun] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('PROPOSED'); // PROPOSED, VALIDATING, VALIDATED, APPROVED

  useEffect(() => {
    // Reset state on new incident
    setRepair(null);
    setTestRun(null);
    setStatus('PROPOSED');
    setLoading(false);
  }, [incident]);

  const initiateRepair = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_id: incident.id, action_type: 'clear_fault' })
      });
      const data = await res.json();
      setRepair(data);
      setStatus('PROPOSED');
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const validateFix = async () => {
    if (!repair) return;
    setLoading(true);
    setStatus('VALIDATING');
    try {
      await fetch(`http://localhost:8000/api/repairs/${repair.id}/validate`, { method: 'POST' });
      
      // Poll for test runs
      const poll = setInterval(async () => {
        const res = await fetch(`http://localhost:8000/api/repairs/${repair.id}/test-runs`);
        const data = await res.json();
        if (data.length > 0) {
          const run = data[0];
          setTestRun(run);
          if (run.status === 'PASS' || run.status === 'FAIL') {
            clearInterval(poll);
            setStatus('VALIDATED');
            setLoading(false);
          }
        }
      }, 1000);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const approveRepair = async () => {
    if (!repair) return;
    setLoading(true);
    try {
      await fetch(`http://localhost:8000/api/repairs/${repair.id}/approve`, { method: 'POST' });
      setStatus('APPROVED');
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Initialize repair if none exists
  useEffect(() => {
    if (!repair && status === 'PROPOSED') {
      initiateRepair();
    }
  }, [repair, status]);

  if (!repair) {
    return (
      <div className="rounded-xl border border-[#1D2A38] bg-[#0D131C] p-6 shadow-lg text-center text-gray-500 text-xs">
        GENERATING REMEDIATION PROPOSAL...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1D2A38] bg-[#0D131C] p-6 shadow-lg relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${status === 'APPROVED' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-1">Recommended Remediation</h3>
          <p className="text-xs text-gray-400">AEGIS has proposed a fix for this incident.</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${
          status === 'APPROVED' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
          'bg-orange-500/20 text-orange-400 border-orange-500/30'
        }`}>
          {status}
        </span>
      </div>

      <div className="bg-[#05070B] rounded border border-[#1D2A38] p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">Action</span>
          <span className="text-sm font-bold text-white font-mono">{repair.action_type || 'clear_fault'}</span>
        </div>
      </div>

      {status === 'PROPOSED' && (
        <button 
          onClick={validateFix}
          disabled={loading}
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold uppercase tracking-wider text-sm py-3 rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'Initiating Validation...' : 'Validate Fix in Sandbox'}
        </button>
      )}

      {status === 'VALIDATING' && (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-[#1D2A38] rounded">
          <svg className="animate-spin mb-3 h-6 w-6 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span className="text-cyan-500 text-sm font-bold tracking-widest uppercase">Validating Fix...</span>
        </div>
      )}

      {(status === 'VALIDATED' || status === 'APPROVED') && testRun && (
        <div className="mb-6">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Validation Result</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-500/5 rounded border border-red-500/20 p-4 text-center">
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">Before Fix</p>
              <p className="text-xl font-black text-white">{testRun.baseline_metrics?.latency ? `${testRun.baseline_metrics.latency}ms` : 'High'} <span className="text-xs font-normal text-gray-400">Latency</span></p>
              <p className="text-sm font-bold text-red-400 mt-1">{testRun.baseline_metrics?.error_rate ? `${(testRun.baseline_metrics.error_rate * 100).toFixed(0)}%` : 'High'} <span className="text-xs font-normal text-gray-400">Errors</span></p>
            </div>
            <div className="bg-green-500/5 rounded border border-green-500/20 p-4 text-center">
              <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-1">After Fix</p>
              <p className="text-xl font-black text-white">{testRun.post_fix_metrics?.latency ? `${testRun.post_fix_metrics.latency}ms` : 'Normal'} <span className="text-xs font-normal text-gray-400">Latency</span></p>
              <p className="text-sm font-bold text-green-400 mt-1">{testRun.post_fix_metrics?.error_rate ? `${(testRun.post_fix_metrics.error_rate * 100).toFixed(0)}%` : '0%'} <span className="text-xs font-normal text-gray-400">Errors</span></p>
            </div>
          </div>
          
          {status === 'VALIDATED' && testRun.status === 'PASS' && (
            <div className="mt-6 border-t border-[#1D2A38] pt-6">
              <p className="text-xs text-gray-400 text-center mb-4">The system has evidence that the remediation restores service health.</p>
              <button 
                onClick={approveRepair}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold uppercase tracking-wider text-sm py-3 rounded transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50"
              >
                {loading ? 'Approving...' : 'Approve Repair'}
              </button>
            </div>
          )}

          {status === 'APPROVED' && (
            <div className="mt-6 border-t border-[#1D2A38] pt-6 space-y-2">
              <div className="flex items-center gap-3 text-green-400 text-sm font-bold tracking-wider">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                REPAIR APPROVED
              </div>
              <div className="flex items-center gap-3 text-green-400 text-sm font-bold tracking-wider">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                INCIDENT RESOLVED
              </div>
              <div className="flex items-center gap-3 text-green-400 text-sm font-bold tracking-wider">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                SERVICE HEALTHY
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
""",
    "d:/AEGIS/frontend/src/components/Dashboard.tsx": """
import React, { useEffect, useState, useCallback } from 'react';
import Layout from './layout/Layout';
import Hero from './dashboard/Hero';
import KPICards from './dashboard/KPICards';
import TopologyView from './topology/TopologyView';
import IntelligencePipeline from './ui/IntelligencePipeline';
import IncidentCommandCenter from './incidents/IncidentCommandCenter';
import FaultInjectionLab from './experiments/FaultInjectionLab';
import { Service, Incident } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

export default function Dashboard() {
  const [topology, setTopology] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      const [topologyRes, servicesRes, incidentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/topology`),
        fetch(`${API_BASE_URL}/services`),
        fetch(`${API_BASE_URL}/incidents`),
      ]);

      if (topologyRes.ok) setTopology(await topologyRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
      if (incidentsRes.ok) setIncidents(await incidentsRes.json());
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard loading error:', err);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      loadDashboardData();
    }, 3000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const activeIncidents = incidents.filter(i => i.status === 'ACTIVE');
  const criticalIncidents = activeIncidents.filter(i => i.severity === 'CRITICAL');
  const anomalousServices = services.filter(s => s.is_healthy === 0);
  const healthyServices = services.filter(s => s.is_healthy === 1);

  const hasTelemetry = services.length > 0;
  const hasAnomaly = anomalousServices.length > 0;
  const hasIncident = activeIncidents.length > 0;
  // Approximation for demo pipeline animation:
  const hasRCA = hasIncident; 
  const hasValidation = incidents.some(i => i.status === 'RESOLVED');
  const hasRecovery = incidents.some(i => i.status === 'RESOLVED');

  return (
    <Layout incidentsCount={activeIncidents.length}>
      <Hero servicesCount={services.length} criticalCount={criticalIncidents.length} />
      
      <KPICards 
        servicesCount={services.length}
        healthyCount={healthyServices.length}
        anomalousCount={anomalousServices.length}
        activeIncidentsCount={activeIncidents.length}
        criticalIncidentsCount={criticalIncidents.length}
      />

      <IntelligencePipeline 
        hasTelemetry={hasTelemetry}
        hasAnomaly={hasAnomaly}
        hasIncident={hasIncident}
        hasRCA={hasRCA}
        hasValidation={hasValidation}
        hasRecovery={hasRecovery}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2">
          <TopologyView elements={topology} />
        </div>
        <div className="xl:col-span-1">
          <FaultInjectionLab onExperimentStart={() => setTimeout(loadDashboardData, 1000)} />
        </div>
      </div>

      <div className="mt-8">
        <IncidentCommandCenter incidents={incidents} />
      </div>
    </Layout>
  );
}
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip())
        
print("Components 4 generated!")
