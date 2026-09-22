import React, { useState } from 'react';
import { Run, StepResult } from '../types';
import { VisualDiffViewer } from './VisualDiffViewer';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Share2,
  Download,
  Terminal,
  Wifi,
  Code2,
  Layers,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';

interface ReportDetailModalProps {
  run: Run;
  onClose: () => void;
  onReRun: (scriptId: string) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  run,
  onClose,
  onReRun,
}) => {
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(
    run.status === 'failed'
      ? Math.max(0, run.stepResults.findIndex((s) => s.status === 'failed'))
      : 0
  );
  const [activeTab, setActiveTab] = useState<'screenshot' | 'diff' | 'logs' | 'dom'>('screenshot');
  const [copiedLink, setCopiedLink] = useState(false);

  const selectedStep: StepResult | undefined = run.stepResults[selectedStepIndex] || run.stepResults[0];

  const shareUrl = `${window.location.origin}/reports/${run.shareableToken}`;

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(run, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${run.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-800/90 border-b border-slate-700/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                run.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {run.status === 'passed' ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">{run.scriptName}</h2>
                <span
                  className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full border ${
                    run.status === 'passed'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {run.status.toUpperCase()}
                </span>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                  {run.environment.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: <span className="text-slate-300 font-mono">{run.targetUrl}</span> • Trigger:{' '}
                <span className="text-slate-300 capitalize">{run.triggerType}</span> • Ran at:{' '}
                {new Date(run.startedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onReRun(run.scriptId)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Re-Run</span>
            </button>

            <button
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              title="Copy shareable link token"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
            </button>

            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* High-level Summary Metrics & Failure Banner */}
        <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400 block text-[11px]">Duration</span>
              <span className="font-semibold text-slate-200 font-mono">{run.durationMs}ms</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Steps Passed</span>
              <span className="font-semibold text-emerald-400">
                {run.stepsPassed} / {run.stepsTotal} ({Math.round((run.stepsPassed / run.stepsTotal) * 100)}%)
              </span>
            </div>
            {run.stepsFailed > 0 && (
              <div>
                <span className="text-slate-400 block text-[11px]">Steps Failed</span>
                <span className="font-semibold text-rose-400">{run.stepsFailed} step</span>
              </div>
            )}
            <div>
              <span className="text-slate-400 block text-[11px]">Retry Policy</span>
              <span className="font-semibold text-slate-300">{run.retryAttempt > 0 ? `Retried (1/1)` : 'None'}</span>
            </div>
          </div>

          {run.errorSummary && (
            <div className="flex-1 max-w-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3 py-1.5 rounded-lg text-xs font-mono truncate">
              ⚠️ {run.errorSummary}
            </div>
          )}
        </div>

        {/* Modal Main Body (2 Columns: Steps List vs Step Diagnostics) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Left: Steps Timeline & Outcome */}
          <div className="lg:col-span-5 border-r border-slate-800 overflow-y-auto p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Step Execution Results</h3>
            {run.stepResults.map((sr, idx) => (
              <div
                key={sr.id}
                onClick={() => setSelectedStepIndex(idx)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedStepIndex === idx
                    ? 'bg-slate-800 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        sr.status === 'passed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : sr.status === 'failed'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {sr.status === 'passed' ? '✓' : sr.status === 'failed' ? '✕' : '—'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-xs">Step {idx + 1}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-blue-400 rounded">
                          {sr.step.action}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{sr.step.description}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono text-slate-400">{sr.durationMs}ms</span>
                    {sr.hasVisualDiff && (
                      <span className="block text-[10px] text-amber-400 font-semibold">Diff</span>
                    )}
                  </div>
                </div>

                {sr.errorMessage && (
                  <div className="mt-2 text-[11px] font-mono text-rose-400 bg-rose-950/40 p-1.5 rounded border border-rose-900/60">
                    {sr.errorMessage}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right: Selected Step Inspector (Screenshot, Visual Diff, Logs, DOM) */}
          <div className="lg:col-span-7 flex flex-col overflow-y-auto bg-slate-950 p-4 space-y-4">
            {selectedStep ? (
              <>
                {/* Diagnostic Sub-Tabs */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                    <button
                      onClick={() => setActiveTab('screenshot')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                        activeTab === 'screenshot' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Screenshot & Overlay</span>
                    </button>

                    {selectedStep.baselineScreenshotUrl && (
                      <button
                        onClick={() => setActiveTab('diff')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                          activeTab === 'diff' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>Visual Diff Slider</span>
                        {selectedStep.hasVisualDiff && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => setActiveTab('logs')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                        activeTab === 'logs' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Terminal className="h-3.5 w-3.5" />
                      <span>Console & Network</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('dom')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                        activeTab === 'dom' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      <span>DOM Snapshot</span>
                    </button>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    Step {selectedStepIndex + 1} of {run.stepsTotal}
                  </span>
                </div>

                {/* TAB 1: Screenshot & Element Highlight */}
                {activeTab === 'screenshot' && (
                  <div className="space-y-3">
                    <div className="rounded-xl overflow-hidden border border-slate-800 shadow-lg bg-slate-900">
                      <img
                        src={selectedStep.screenshotUrl}
                        alt={`Screenshot step ${selectedStepIndex + 1}`}
                        className="w-full h-auto block"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                      <span>Full page Chromium capture at step completion</span>
                      {selectedStep.failingSelector && (
                        <span className="text-rose-400 font-mono">
                          Failing Locator: {selectedStep.failingSelector}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: Visual Diff Slider */}
                {activeTab === 'diff' && selectedStep.baselineScreenshotUrl && (
                  <VisualDiffViewer
                    currentScreenshot={selectedStep.screenshotUrl}
                    baselineScreenshot={selectedStep.baselineScreenshotUrl}
                    diffPercentage={selectedStep.diffPercentage}
                    stepDescription={selectedStep.step.description}
                  />
                )}

                {/* TAB 3: Console & Network Errors */}
                {activeTab === 'logs' && (
                  <div className="space-y-4">
                    {/* Console Logs */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                        <Terminal className="h-3.5 w-3.5 text-blue-400" />
                        <span>Browser Console Output</span>
                      </h4>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto">
                        {selectedStep.consoleLogs && selectedStep.consoleLogs.length > 0 ? (
                          selectedStep.consoleLogs.map((log, lIdx) => (
                            <div
                              key={lIdx}
                              className={`flex items-start gap-2 ${
                                log.level === 'error'
                                  ? 'text-rose-400'
                                  : log.level === 'warn'
                                  ? 'text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            >
                              <span className="text-slate-500 text-[10px]">{log.timestamp.split('T')[1].slice(0, 8)}</span>
                              <span className="uppercase text-[10px] font-bold px-1 rounded bg-slate-800">
                                {log.level}
                              </span>
                              <span>{log.message}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-500">No console output recorded for this step.</div>
                        )}
                      </div>
                    </div>

                    {/* Network Calls */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                        <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Network Telemetry Traces</span>
                      </h4>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto">
                        {selectedStep.networkCalls && selectedStep.networkCalls.length > 0 ? (
                          selectedStep.networkCalls.map((net, nIdx) => (
                            <div key={nIdx} className="flex items-center justify-between text-slate-300">
                              <div className="flex items-center gap-2 truncate max-w-md">
                                <span className="text-blue-400 font-bold">{net.method}</span>
                                <span className="truncate text-slate-300">{net.url}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    net.status < 400
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-rose-500/20 text-rose-300'
                                  }`}
                                >
                                  {net.status}
                                </span>
                                <span className="text-slate-500 text-[10px]">{net.durationMs}ms</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-500">No external network requests during this step.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: DOM Snapshot */}
                {activeTab === 'dom' && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-300">Page DOM Snapshot at Failure/Step Exit</h4>
                    <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300 overflow-auto max-h-80 leading-relaxed">
                      {selectedStep.domSnapshot || '<!-- No DOM snapshot captured -->'}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs">Select a step on the left to view diagnostics.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
