import React from 'react';
import { TargetSite, UserProfile, UserRole } from '../types';
import {
  Play,
  Layers,
  Sparkles,
  Calendar,
  BarChart3,
  Settings,
  ShieldCheck,
  Globe,
  ExternalLink,
  Plus,
} from 'lucide-react';

interface HeaderProps {
  targets: TargetSite[];
  selectedTargetId: string;
  onSelectTarget: (id: string) => void;
  currentUser: UserProfile;
  onSwitchRole: (role: UserRole) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onRunAllDue: () => void;
  onNewScript: () => void;
  targetPingLatency?: number | null;
}

export const Header: React.FC<HeaderProps> = ({
  targets,
  selectedTargetId,
  onSelectTarget,
  currentUser,
  onSwitchRole,
  activeTab,
  onSelectTab,
  onRunAllDue,
  onNewScript,
  targetPingLatency,
}) => {
  const currentTarget = targets.find((t) => t.id === selectedTargetId) || targets[0];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-sm">
      {/* Top Banner with Brand & Target Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Platform Name */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-inner font-bold text-white tracking-wider text-base">
            QA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-lg tracking-tight">AutoQA</span>
              <span className="text-xs bg-blue-500/20 text-blue-400 font-medium px-2 py-0.5 rounded-full border border-blue-500/30">
                v1.0 MVP
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Web-Based Test Automation Platform</p>
          </div>
        </div>

        {/* Target Site Context & Live Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 gap-2">
            <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400 mr-1.5 hidden md:inline">Target:</span>
              <select
                value={selectedTargetId}
                onChange={(e) => onSelectTarget(e.target.value)}
                className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer text-xs"
              >
                {targets.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-800 text-slate-200">
                    {t.name} ({t.environment.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
            {targetPingLatency !== undefined && targetPingLatency !== null && (
              <span className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                {targetPingLatency}ms
              </span>
            )}
            <a
              href={currentTarget?.baseUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-slate-200"
              title="Open target URL in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            <select
              value={currentUser.role}
              onChange={(e) => onSwitchRole(e.target.value as UserRole)}
              className="bg-transparent text-xs text-slate-300 font-medium outline-none cursor-pointer"
            >
              <option value="qa" className="bg-slate-800">QA Engineer ({currentUser.name})</option>
              <option value="developer" className="bg-slate-800">Developer (Mihai Ionescu)</option>
              <option value="product_owner" className="bg-slate-800">Product Owner (Sarah J.)</option>
              <option value="admin" className="bg-slate-800">Admin (Alex Radu)</option>
            </select>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onNewScript}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Script</span>
            </button>
            <button
              onClick={onRunAllDue}
              className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
              title="Trigger all active scheduled tests"
            >
              <Play className="h-3.5 w-3.5 text-emerald-400" />
              <span>Run Due</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-t border-slate-800/80 bg-slate-900/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
          <button
            onClick={() => onSelectTab('library')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'library'
                ? 'bg-slate-800 text-blue-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Script Library</span>
          </button>

          <button
            onClick={() => onSelectTab('studio')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'studio'
                ? 'bg-slate-800 text-blue-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Studio & Recorder</span>
          </button>

          <button
            onClick={() => onSelectTab('runs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'runs'
                ? 'bg-slate-800 text-blue-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Runs & Reports</span>
          </button>

          <button
            onClick={() => onSelectTab('scheduler')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'scheduler'
                ? 'bg-slate-800 text-blue-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Schedules & Webhooks</span>
          </button>

          <button
            onClick={() => onSelectTab('admin')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'admin'
                ? 'bg-slate-800 text-blue-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Targets & Audit Logs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
