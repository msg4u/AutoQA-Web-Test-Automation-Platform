import React, { useState } from 'react';
import { Run } from '../types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface RunReportsProps {
  runs: Run[];
  onOpenReport: (run: Run) => void;
  onReRunScript: (scriptId: string) => void;
}

export const RunReports: React.FC<RunReportsProps> = ({
  runs,
  onOpenReport,
  onReRunScript,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [triggerFilter, setTriggerFilter] = useState<'all' | 'manual' | 'scheduled' | 'webhook'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRuns = runs.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (triggerFilter !== 'all' && r.triggerType !== triggerFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.scriptName.toLowerCase().includes(q);
      const matchUrl = r.targetUrl.toLowerCase().includes(q);
      if (!matchName && !matchUrl) return false;
    }
    return true;
  });

  // Calculate Metrics
  const totalRuns = runs.length;
  const passedRuns = runs.filter((r) => r.status === 'passed').length;
  const failedRuns = runs.filter((r) => r.status === 'failed').length;
  const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 100;
  const avgDuration =
    totalRuns > 0 ? Math.round(runs.reduce((acc, r) => acc + (r.durationMs || 0), 0) / totalRuns) : 0;
  const diffsDetected = runs.reduce(
    (acc, r) => acc + r.stepResults.filter((s) => s.hasVisualDiff).length,
    0
  );

  return (
    <div className="space-y-4">
      {/* Top Level Metric Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Total Executions</span>
          <div className="text-2xl font-bold text-slate-100 mt-1">{totalRuns}</div>
          <p className="text-[11px] text-slate-500 mt-1">Across all environments</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Global Pass Rate</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-baseline gap-1.5">
            <span>{passRate}%</span>
            <span className="text-xs text-slate-400 font-normal">({passedRuns} passed)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{failedRuns} failed runs recorded</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Avg Execution Latency</span>
          <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">{avgDuration}ms</div>
          <p className="text-[11px] text-slate-500 mt-1">Headless Chromium pipeline</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Visual Diffs Found</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{diffsDetected}</div>
          <p className="text-[11px] text-slate-500 mt-1">Pixel baseline regressions</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by script name or target URL..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
            {(['all', 'passed', 'failed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                  statusFilter === st ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Trigger Filter */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
            {(['all', 'manual', 'scheduled', 'webhook'] as const).map((tr) => (
              <button
                key={tr}
                onClick={() => setTriggerFilter(tr)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                  triggerFilter === tr ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Test Script</th>
                <th className="px-4 py-3">Target URL</th>
                <th className="px-4 py-3">Trigger</th>
                <th className="px-4 py-3">Steps</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Executed At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRuns.map((run) => {
                const isPassed = run.status === 'passed';

                return (
                  <tr key={run.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isPassed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-400" />
                        )}
                        <span
                          className={`font-semibold uppercase text-[11px] px-2 py-0.5 rounded-full border ${
                            isPassed
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {run.status}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-100 max-w-[220px] truncate">
                      {run.scriptName}
                      {run.errorSummary && (
                        <span className="block text-[11px] text-rose-400 font-normal truncate mt-0.5">
                          {run.errorSummary}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400 max-w-[180px] truncate">
                      {run.targetUrl}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="capitalize text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                        {run.triggerType}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap font-mono">
                      <span className={isPassed ? 'text-emerald-400' : 'text-rose-400'}>
                        {run.stepsPassed}
                      </span>
                      <span className="text-slate-500"> / {run.stepsTotal}</span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-300">
                      {run.durationMs}ms
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-[11px]">
                      {new Date(run.startedAt).toLocaleString()}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => onOpenReport(run)}
                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-blue-400 px-2.5 py-1.5 rounded-lg border border-slate-700 font-medium transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Diagnostics</span>
                      </button>

                      <button
                        onClick={() => onReRunScript(run.scriptId)}
                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded-lg border border-slate-700 font-medium transition-colors"
                        title="Re-run this test script"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRuns.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-xs">
            No execution runs found matching the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};
