import React, { useState } from 'react';
import { Schedule, Script, TargetSite } from '../types';
import {
  Calendar,
  Clock,
  Play,
  Pause,
  Plus,
  Trash2,
  Terminal,
  Copy,
  Check,
  Zap,
  Globe,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SchedulerViewProps {
  schedules: Schedule[];
  scripts: Script[];
  targets: TargetSite[];
  onToggleSchedule: (id: string, active: boolean) => void;
  onCreateSchedule: (newSchedule: Omit<Schedule, 'id' | 'createdAt'>) => void;
  onDeleteSchedule: (id: string) => void;
  onTriggerNow: (scriptId: string) => void;
}

export const SchedulerView: React.FC<SchedulerViewProps> = ({
  schedules,
  scripts,
  targets,
  onToggleSchedule,
  onCreateSchedule,
  onDeleteSchedule,
  onTriggerNow,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedScriptId, setSelectedScriptId] = useState(scripts[0]?.id || '');
  const [cronExpression, setCronExpression] = useState('0 7 * * *');
  const [cronDescription, setCronDescription] = useState('Every day at 07:00 UTC');
  const [concurrencyPolicy, setConcurrencyPolicy] = useState<'skip' | 'queue' | 'replace'>('skip');
  const [copiedWebhookId, setCopiedWebhookId] = useState<string | null>(null);

  const handlePresetSelect = (cron: string, desc: string) => {
    setCronExpression(cron);
    setCronDescription(desc);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const script = scripts.find((s) => s.id === selectedScriptId);
    if (!script) return;

    onCreateSchedule({
      scriptId: script.id,
      scriptName: script.name,
      cronExpression,
      humanReadable: cronDescription,
      active: true,
      isActive: true,
      concurrencyPolicy,
      notifyEmails: ['qa-team@example.com'],
      webhookSecret: `whsec_${Math.random().toString(36).substring(2, 10)}`,
      nextRunAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    });
    setShowCreateModal(false);
  };

  const handleCopyWebhook = (secret: string, scriptId: string) => {
    const curlCmd = `curl -X POST https://autoqa.example.com/api/webhooks/${scriptId} \\
  -H "X-AutoQA-Secret: ${secret}" \\
  -H "Content-Type: application/json"`;
    navigator.clipboard.writeText(curlCmd);
    setCopiedWebhookId(scriptId);
    setTimeout(() => setCopiedWebhookId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-400" />
            <span>Automated Scheduling & CI/CD Webhooks</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure automated cron schedules and trigger test suites from GitHub Actions, GitLab CI, or Jenkins.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Scheduled Job</span>
        </button>
      </div>

      {/* Schedules Cards / List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {schedules.map((schedule) => {
          const script = scripts.find((s) => s.id === schedule.scriptId);
          const target = targets.find((t) => t.id === script?.targetSiteId);

          return (
            <div
              key={schedule.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                        schedule.isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {schedule.isActive ? 'Active Schedule' : 'Paused'}
                    </span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {schedule.cronExpression}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 mt-2">{schedule.scriptName}</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{schedule.humanReadable}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleSchedule(schedule.id, !schedule.isActive)}
                    className={`p-2 rounded-lg text-xs font-medium border transition-colors ${
                      schedule.isActive
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                    title={schedule.isActive ? 'Pause Schedule' : 'Resume Schedule'}
                  >
                    {schedule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>

                  <button
                    onClick={() => onDeleteSchedule(schedule.id)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                    title="Delete schedule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Timing & Target info */}
              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Next Scheduled Run:</span>
                  <span className="font-semibold text-slate-200">
                    {schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString() : 'Paused'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Concurrency Policy:</span>
                  <span className="font-mono text-blue-400 uppercase font-semibold">
                    {schedule.concurrencyPolicy}
                  </span>
                </div>
              </div>

              {/* Webhook trigger generator for CI/CD */}
              <div className="border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span>CI/CD Webhook Trigger</span>
                  </span>
                  <button
                    onClick={() => handleCopyWebhook(schedule.webhookSecret || schedule.webhookToken || '', schedule.scriptId)}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    {copiedWebhookId === schedule.scriptId ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">cURL Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy cURL</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[11px] text-slate-400 truncate">
                  POST /api/webhooks/{schedule.scriptId}
                </div>
              </div>

              {/* Quick Trigger Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onTriggerNow(schedule.scriptId)}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                >
                  <Play className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Execute Job Now</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {schedules.length === 0 && (
        <div className="py-12 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-400 text-xs">
          No automated schedules configured yet. Click &quot;New Scheduled Job&quot; to set up your first run.
        </div>
      )}

      {/* CREATE SCHEDULE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              <span>Create Scheduled Test Execution</span>
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Test Script</label>
                <select
                  value={selectedScriptId}
                  onChange={(e) => setSelectedScriptId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none"
                >
                  {scripts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (v{s.currentVersion.versionNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Frequency Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('*/15 * * * *', 'Every 15 minutes')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-left"
                  >
                    <strong>Every 15 min</strong>
                    <span className="block text-[10px] text-slate-400 font-mono">*/15 * * * *</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('0 * * * *', 'Every hour')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-left"
                  >
                    <strong>Hourly</strong>
                    <span className="block text-[10px] text-slate-400 font-mono">0 * * * *</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('0 7 * * *', 'Every day at 07:00 UTC')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-left"
                  >
                    <strong>Daily Morning (07:00)</strong>
                    <span className="block text-[10px] text-slate-400 font-mono">0 7 * * *</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('0 0 * * 1', 'Weekly every Monday at 00:00')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-left"
                  >
                    <strong>Weekly (Monday)</strong>
                    <span className="block text-[10px] text-slate-400 font-mono">0 0 * * 1</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Cron Expression</label>
                <input
                  type="text"
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 font-mono text-slate-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Human Description</label>
                <input
                  type="text"
                  value={cronDescription}
                  onChange={(e) => setCronDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Concurrency Policy</label>
                <select
                  value={concurrencyPolicy}
                  onChange={(e) => setConcurrencyPolicy(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none"
                >
                  <option value="skip">Skip if already running (Recommended)</option>
                  <option value="queue">Queue execution</option>
                  <option value="replace">Replace active run</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-200 px-3 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
