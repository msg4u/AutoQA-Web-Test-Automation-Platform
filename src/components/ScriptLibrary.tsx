import React, { useState } from 'react';
import { Script, TargetSite, UserProfile, ScriptStep } from '../types';
import {
  Play,
  Edit3,
  History,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Tag,
  CheckCircle2,
  Clock,
  Archive,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { stepsToYaml, generatePlaywrightCode, yamlToSteps } from '../utils/dslConverter';

interface ScriptLibraryProps {
  scripts: Script[];
  targets: TargetSite[];
  selectedTargetId: string;
  currentUser: UserProfile;
  onSelectScriptToEdit: (script: Script) => void;
  onRunScriptNow: (script: Script) => void;
  onOpenHistory: (script: Script) => void;
  onOpenApproval: (script: Script) => void;
  onNewScript: () => void;
  onImportScript: (importedData: { name: string; targetSiteId: string; steps: ScriptStep[]; tags: string[] }) => void;
  onToggleArchive: (scriptId: string) => void;
}

export const ScriptLibrary: React.FC<ScriptLibraryProps> = ({
  scripts,
  targets,
  selectedTargetId,
  currentUser,
  onSelectScriptToEdit,
  onRunScriptNow,
  onOpenHistory,
  onOpenApproval,
  onNewScript,
  onImportScript,
  onToggleArchive,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'in_review' | 'draft' | 'archived'>('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importYaml, setImportYaml] = useState('');
  const [importName, setImportName] = useState('');

  // Filter scripts based on active target, search, and status
  const filteredScripts = scripts.filter((s) => {
    if (selectedTargetId && s.targetSiteId !== selectedTargetId) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchTag = s.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchTag) return false;
    }
    return true;
  });

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = yamlToSteps(importYaml);
      onImportScript({
        name: importName || parsed.name || 'Imported Script',
        targetSiteId: selectedTargetId || targets[0].id,
        steps: parsed.steps,
        tags: ['imported'],
      });
      setShowImportModal(false);
      setImportYaml('');
      setImportName('');
    } catch (err) {
      alert('Failed to parse YAML DSL. Please verify format.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scripts by title, tag, or description..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
            {(['all', 'active', 'in_review', 'draft', 'archived'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                  statusFilter === st ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import YAML</span>
          </button>

          <button
            onClick={onNewScript}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Test Script</span>
          </button>
        </div>
      </div>

      {/* Scripts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScripts.map((script) => {
          const targetSite = targets.find((t) => t.id === script.targetSiteId);

          return (
            <div
              key={script.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all shadow-sm group"
            >
              <div>
                {/* Status & Version Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                        script.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : script.status === 'in_review'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : script.status === 'draft'
                          ? 'bg-slate-700 text-slate-300 border-slate-600'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {script.status.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                      v{script.currentVersion.versionNumber}
                    </span>
                  </div>

                  {script.approvedBy ? (
                    <span
                      className="text-[11px] text-indigo-400 flex items-center gap-1 font-medium"
                      title={`Approved by ${script.approvedBy} on ${new Date(script.approvedAt!).toLocaleDateString()}`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Approved</span>
                    </span>
                  ) : script.requiresApproval ? (
                    <button
                      onClick={() => onOpenApproval(script)}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Needs Review</span>
                    </button>
                  ) : null}
                </div>

                {/* Title and Target */}
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                  {script.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono line-clamp-1">
                  {targetSite?.baseUrl || 'Target site'}
                </p>

                {/* Steps count & Changelog */}
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-blue-400" />
                    <strong>{script.currentVersion.steps.length}</strong> steps
                  </span>
                  <span>•</span>
                  <span className="truncate">Updated {new Date(script.updatedAt).toLocaleDateString()}</span>
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {script.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium border border-slate-700/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectScriptToEdit(script)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Edit in Test Studio"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => onOpenHistory(script)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="View Version History & Diffs"
                  >
                    <History className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => onToggleArchive(script.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
                    title={script.status === 'archived' ? 'Unarchive' : 'Archive Script'}
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => onRunScriptNow(script)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Run Now</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredScripts.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Layers className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-200">No test scripts found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No scripts match the current filters. Adjust your search or generate a new test script with our AI assistant.
          </p>
          <button
            onClick={onNewScript}
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Script</span>
          </button>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-400" />
              <span>Import Script from YAML DSL</span>
            </h3>
            <p className="text-xs text-slate-400">
              Paste a declarative YAML test specification (matching Section 9 architecture format) to import into the library.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Script Name</label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="e.g. Imported regression flow"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">YAML DSL Content</label>
                <textarea
                  rows={8}
                  value={importYaml}
                  onChange={(e) => setImportYaml(e.target.value)}
                  placeholder={`name: Sample Test Flow\ntarget: picurici\nsteps:\n  - action: navigate\n    value: /\n  - action: assert_visible\n    selector: main illustration`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 px-3 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  Import Script
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
