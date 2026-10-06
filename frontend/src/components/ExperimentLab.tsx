import { useState } from 'react';

export default function ExperimentLab() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const startExperiment = async (scenario: string) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_type: scenario, target_service_id: 3 })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mt-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Fault Injection Lab</h2>
      <p className="text-gray-400 mb-6 text-sm">Safely inject controlled faults into the local demo environment to observe AEGIS detection and self-healing.</p>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => startExperiment('latency_spike')}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
        >
          Inject Latency Spike
        </button>
        <button
          onClick={() => startExperiment('high_error_rate')}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
        >
          Inject HTTP 500s
        </button>
        <button
          onClick={() => startExperiment('clear')}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
        >
          Clear Faults
        </button>
      </div>

      {result && (
        <div className="bg-gray-900 p-4 rounded border border-gray-700">
          <h3 className="font-semibold text-blue-400">Experiment Started</h3>
          <p className="text-sm text-gray-300 mt-2">Scenario: <span className="font-mono">{result.scenario_type}</span></p>
          <p className="text-sm text-gray-300">Ground Truth: {result.ground_truth}</p>
          <p className="text-sm text-gray-500 mt-2">The anomaly detector will process the telemetry shortly.</p>
        </div>
      )}
    </div>
  );
}
