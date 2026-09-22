import React, { useState } from 'react';
import { Script, ScriptVersion } from '../types';
import { History, RotateCcw, X, GitCompare, Check, Calendar, User } from 'lucide-react';

interface VersionHistoryModalProps {
  script: Script;
  onClose: () => void;
  onRollback: (scriptId: string, versionId: string) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  script,
  onClose,
  onRollback,
}) => {
  const versions = script.versions || [script.currentVersion];
  const [selectedVersionId, setSelectedVersionId] = useState<string>(script.currentVersion.id);

  const selectedVer = versions.find((v) => v.id === selectedVersionId) || script.currentVersion;
  const currentVer = script.currentVersion;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-800/90 border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Version History & Diff</h3>
              <p className="text-xs text-slate-400">{script.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body (Versions on left, Version Details & Diff on right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Versions List */}
          <div className="md:col-span-5 border-r border-slate-800 p-4 space-y-2 overflow-y-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Revision Log ({versions.length})
            </span>

            {versions.map((ver) => {
              const isCurrent = ver.id === currentVer.id;
              const isSelected = ver.id === selectedVersionId;

              return (
                <div
                  key={ver.id}
                  onClick={() => setSelectedVersionId(ver.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-blue-500 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      v{ver.versionNumber}
                      {isCurrent && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-sans">
                          Active
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(ver.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium line-clamp-1">{ver.changeLog || 'Version created'}</p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{ver.author || 'QA Engineer'}</span> • <span>{ver.steps.length} steps</span>
                  </p>
                </div>
              );
            })}
          </div>

          {/* Version Inspector / Steps Comparison */}
          <div className="md:col-span-7 p-5 flex flex-col overflow-y-auto bg-slate-950 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>Version {selectedVer.versionNumber}</span>
                  {selectedVer.id === currentVer.id ? (
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Current Live Version
                    </span>
                  ) : (
                    <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Historical Snapshot
                    </span>
                  )}
                </span>
                <p className="text-xs text-slate-400 mt-0.5">Author: {selectedVer.author || 'QA Engineer'}</p>
              </div>

              {selectedVer.id !== currentVer.id && (
                <button
                  onClick={() => onRollback(script.id, selectedVer.id)}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Rollback to v{selectedVer.versionNumber}</span>
                </button>
              )}
            </div>

            {/* Change summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs">
              <span className="text-slate-400 block text-[11px] font-semibold mb-0.5">Changelog Notes:</span>
              <span className="text-slate-200">{selectedVer.changeLog || 'Standard release version'}</span>
            </div>

            {/* Steps in this version */}
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2">
                Steps in v{selectedVer.versionNumber} ({selectedVer.steps.length})
              </span>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {selectedVer.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-start gap-2.5 text-xs"
                  >
                    <span className="w-5 h-5 rounded bg-slate-800 text-slate-400 font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-400 uppercase text-[10px] font-mono">
                          {step.action}
                        </span>
                        {step.selector && (
                          <span className="text-slate-300 font-mono text-[11px]">{step.selector}</span>
                        )}
                      </div>
                      <p className="text-slate-300 text-xs mt-0.5">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
