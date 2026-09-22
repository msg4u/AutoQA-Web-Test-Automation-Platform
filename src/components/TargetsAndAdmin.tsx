import React, { useState } from 'react';
import { TargetSite, AuditLogItem } from '../types';
import {
  Globe,
  Plus,
  Activity,
  Shield,
  FileText,
  ExternalLink,
  CheckCircle2,
  Lock,
  Wifi,
} from 'lucide-react';

interface TargetsAndAdminProps {
  targets: TargetSite[];
  auditLogs: AuditLogItem[];
  onAddTarget: (newTarget: Omit<TargetSite, 'id' | 'createdAt'>) => void;
  onPingTarget: (targetId: string) => void;
  pingResults: Record<string, number>;
}

export const TargetsAndAdmin: React.FC<TargetsAndAdminProps> = ({
  targets,
  auditLogs,
  onAddTarget,
  onPingTarget,
  pingResults,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [environment, setEnvironment] = useState<'prod' | 'staging' | 'dev'>('prod');
  const [authType, setAuthType] = useState<'none' | 'basic' | 'bearer'>('none');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !baseUrl) return;

    onAddTarget({
      name,
      baseUrl,
      environment,
      authConfig: { type: authType },
      tags: ['web-target'],
    });

    setShowAddModal(false);
    setName('');
    setBaseUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Target Sites Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-400" />
              <span>Target Sites & Test Environments</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage configured target websites, domains, environments, and basic/bearer authentication headers.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Target Site</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {targets.map((target) => {
            const latency = pingResults[target.id];

            return (
              <div
                key={target.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                        target.environment === 'prod'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {target.environment}
                    </span>

                    <button
                      onClick={() => onPingTarget(target.id)}
                      className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 bg-slate-900 px-2 py-1 rounded border border-slate-700 font-mono"
                    >
                      <Wifi className="h-3 w-3" />
                      <span>{latency ? `${latency}ms` : 'Ping Target'}</span>
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 mt-2">{target.name}</h3>
                  <a
                    href={target.baseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-400 font-mono flex items-center gap-1 hover:text-slate-200 mt-1"
                  >
                    <span className="truncate">{target.baseUrl}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>

                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3 text-slate-500" />
                    <span>Auth: {target.authConfig?.type || 'none'}</span>
                  </span>
                  <span>Added {new Date(target.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Logs Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-400" />
              <span>Platform Audit & Security Log</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable record of all test creations, edits, peer reviews, executions, and rollbacks.
            </p>
          </div>
          <span className="text-xs text-slate-500">{auditLogs.length} events logged</span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">User</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Entity</th>
                  <th className="px-4 py-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-slate-200 whitespace-nowrap font-sans font-medium">
                      {log.userName}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-300 whitespace-nowrap">
                      {log.entityType}:{log.entityId ? log.entityId.slice(0, 8) : (log.entityName || 'sys').slice(0, 8)}
                    </td>
                    <td className="px-4 py-2 text-slate-300 font-sans max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADD TARGET MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-400" />
              <span>Add New Target Site</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Picurici Staging"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Base URL</label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Environment</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
                >
                  <option value="prod">Production</option>
                  <option value="staging">Staging</option>
                  <option value="dev">Development</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Authentication Config</label>
                <select
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
                >
                  <option value="none">None (Public)</option>
                  <option value="basic">HTTP Basic Auth</option>
                  <option value="bearer">Bearer Token</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-200 px-3 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  Save Target Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
