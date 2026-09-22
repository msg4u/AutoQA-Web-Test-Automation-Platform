import React, { useState, useEffect } from 'react';
import {
  TargetSite,
  Script,
  ScriptVersion,
  Run,
  Schedule,
  AuditLogItem,
  UserProfile,
  UserRole,
  ScriptStep,
} from './types';
import { Header } from './components/Header';
import { ScriptLibrary } from './components/ScriptLibrary';
import { TestStudio } from './components/TestStudio';
import { RunReports } from './components/RunReports';
import { ReportDetailModal } from './components/ReportDetailModal';
import { ExecutionProgressModal } from './components/ExecutionProgressModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { ApprovalModal } from './components/ApprovalModal';
import { SchedulerView } from './components/SchedulerView';
import { TargetsAndAdmin } from './components/TargetsAndAdmin';

import {
  INITIAL_TARGETS,
  INITIAL_SCRIPTS,
  INITIAL_RUNS,
  INITIAL_SCHEDULES,
  INITIAL_AUDIT_LOGS,
  CURRENT_USER,
} from './data/initialData';

export default function App() {
  // Navigation & User State
  const [activeTab, setActiveTab] = useState<string>('library');
  const [currentUser, setCurrentUser] = useState<UserProfile>(CURRENT_USER);

  // Core Entities State
  const [targets, setTargets] = useState<TargetSite[]>(INITIAL_TARGETS);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(INITIAL_TARGETS[0].id);
  const [scripts, setScripts] = useState<Script[]>(INITIAL_SCRIPTS);
  const [runs, setRuns] = useState<Run[]>(INITIAL_RUNS);
  const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);

  // Ping Latency Map
  const [pingResults, setPingResults] = useState<Record<string, number>>({
    [INITIAL_TARGETS[0].id]: 42,
  });

  // Modal / Context States
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [activeReportRun, setActiveReportRun] = useState<Run | null>(null);
  const [historyModalScript, setHistoryModalScript] = useState<Script | null>(null);
  const [approvalModalScript, setApprovalModalScript] = useState<Script | null>(null);

  // Live Execution Modal
  const [liveExecution, setLiveExecution] = useState<{
    scriptName: string;
    targetUrl: string;
    steps: ScriptStep[];
  } | null>(null);

  // Fetch initial data from server API
  useEffect(() => {
    const safeJsonFetch = async (url: string) => {
      try {
        const r = await fetch(url);
        if (!r.ok) return null;
        const text = await r.text();
        return text ? JSON.parse(text) : null;
      } catch {
        return null;
      }
    };

    const fetchData = async () => {
      try {
        const [targetsData, scriptsData, runsData, schedData, auditData] = await Promise.all([
          safeJsonFetch('/api/targets'),
          safeJsonFetch('/api/scripts'),
          safeJsonFetch('/api/runs'),
          safeJsonFetch('/api/schedules'),
          safeJsonFetch('/api/audit-logs'),
        ]);

        if (Array.isArray(targetsData)) {
          setTargets(targetsData);
        }
        if (Array.isArray(scriptsData)) {
          setScripts(scriptsData);
        }
        if (Array.isArray(runsData)) {
          setRuns(runsData);
        }
        if (Array.isArray(schedData)) {
          setSchedules(schedData);
        }
        if (Array.isArray(auditData)) {
          setAuditLogs(auditData);
        }
      } catch (err) {
        console.warn('API sync warning (using seeded local memory):', err);
      }
    };

    fetchData();
  }, []);

  // Ping target site
  const handlePingTarget = async (targetId: string) => {
    try {
      const res = await fetch(`/api/targets/${targetId}/ping`);
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          if (typeof data.latencyMs === 'number') {
            setPingResults((prev) => ({ ...prev, [targetId]: data.latencyMs }));
            return;
          }
        }
      }
      throw new Error('Ping failed');
    } catch {
      const fallback = Math.floor(30 + Math.random() * 25);
      setPingResults((prev) => ({ ...prev, [targetId]: fallback }));
    }
  };

  // Switch User Role
  const handleSwitchRole = (role: UserRole) => {
    const names: Record<UserRole, string> = {
      qa: 'Elena Popa',
      developer: 'Mihai Ionescu',
      product_owner: 'Sarah J.',
      admin: 'Alex Radu',
    };
    setCurrentUser({
      id: `usr_${role}`,
      name: names[role],
      role,
      email: `${role}@autoqa.example.com`,
    });
  };

  // Trigger Execution
  const handleTriggerRun = (steps: ScriptStep[], scriptName: string) => {
    const currentTarget = targets.find((t) => t.id === selectedTargetId) || targets[0];
    setLiveExecution({
      scriptName,
      targetUrl: currentTarget.baseUrl,
      steps,
    });
  };

  const handleRunScriptDirect = (script: Script) => {
    const currentTarget = targets.find((t) => t.id === script.targetSiteId) || targets[0];
    setLiveExecution({
      scriptName: script.name,
      targetUrl: currentTarget.baseUrl,
      steps: script.currentVersion.steps,
    });
  };

  // Save or Update Script
  const handleSaveScript = async (scriptData: {
    name: string;
    targetSiteId: string;
    steps: ScriptStep[];
    tags: string[];
    requiresApproval: boolean;
    changeLog?: string;
  }) => {
    try {
      const res = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingScript?.id,
          ...scriptData,
          author: currentUser.name,
        }),
      });
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          if (data.script) {
            setScripts((prev) => {
              const idx = prev.findIndex((s) => s.id === data.script.id);
              if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = data.script;
                return copy;
              }
              return [data.script, ...prev];
            });
            setActiveTab('library');
            setEditingScript(null);
            return;
          }
        }
      }
      throw new Error('Save failed');
    } catch {
      // Local fallback
      const scriptId = editingScript?.id || `script_${Date.now()}`;
      const newVersionId = `v_${Date.now()}`;
      const newVersionNumber = editingScript ? editingScript.currentVersion.versionNumber + 1 : 1;
      const newVersion: ScriptVersion = {
        id: newVersionId,
        scriptId,
        versionNumber: newVersionNumber,
        dslYaml: '',
        steps: scriptData.steps,
        playwrightCode: '',
        author: currentUser.name,
        createdAt: new Date().toISOString(),
        changeLog: scriptData.changeLog || 'Updated steps in Studio',
      };
      const updatedScript: Script = {
        id: scriptId,
        targetSiteId: scriptData.targetSiteId,
        name: scriptData.name,
        status: scriptData.requiresApproval ? 'in_review' : 'active',
        currentVersionId: newVersionId,
        currentVersion: newVersion,
        versions: editingScript ? [newVersion, ...editingScript.versions] : [newVersion],
        tags: scriptData.tags,
        requiresApproval: scriptData.requiresApproval,
        approvalStatus: scriptData.requiresApproval ? 'pending' : 'approved',
        timeoutMs: 30000,
        retryCount: 1,
        createdAt: editingScript?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setScripts((prev) => {
        const idx = prev.findIndex((s) => s.id === updatedScript.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = updatedScript;
          return copy;
        }
        return [updatedScript, ...prev];
      });
    }

    setActiveTab('library');
    setEditingScript(null);
  };

  // Rollback version
  const handleRollbackVersion = async (scriptId: string, versionId: string) => {
    try {
      const res = await fetch(`/api/scripts/${scriptId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId, user: currentUser.name }),
      });
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          if (data.script) {
            setScripts((prev) => prev.map((s) => (s.id === scriptId ? data.script : s)));
          }
        }
      }
    } catch {
      setScripts((prev) =>
        prev.map((s) => {
          if (s.id !== scriptId) return s;
          const targetVer = s.versions.find((v) => v.id === versionId);
          if (!targetVer) return s;
          return {
            ...s,
            currentVersion: targetVer,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    }
    setHistoryModalScript(null);
  };

  // Submit Approval
  const handleSubmitApproval = async (scriptId: string, approved: boolean, notes: string) => {
    try {
      const res = await fetch(`/api/scripts/${scriptId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          notes,
          reviewer: currentUser.name,
        }),
      });
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          if (data.script) {
            setScripts((prev) => prev.map((s) => (s.id === scriptId ? data.script : s)));
          }
        }
      }
    } catch {
      setScripts((prev) =>
        prev.map((s) => {
          if (s.id !== scriptId) return s;
          return {
            ...s,
            status: approved ? 'active' : 'draft',
            approvedBy: approved ? currentUser.name : undefined,
            approvedAt: approved ? new Date().toISOString() : undefined,
          };
        })
      );
    }
    setApprovalModalScript(null);
  };

  // Toggle Archive
  const handleToggleArchive = async (scriptId: string) => {
    try {
      const res = await fetch(`/api/scripts/${scriptId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: currentUser.name }),
      });
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          if (data.script) {
            setScripts((prev) => prev.map((s) => (s.id === scriptId ? data.script : s)));
          }
        }
      }
    } catch {
      setScripts((prev) =>
        prev.map((s) => {
          if (s.id !== scriptId) return s;
          return {
            ...s,
            status: s.status === 'archived' ? 'active' : 'archived',
          };
        })
      );
    }
  };

  // Toggle Schedule
  const handleToggleSchedule = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: active }),
      });
    } catch {
      // noop
    }
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: active } : s)));
  };

  // Create Schedule
  const handleCreateSchedule = async (newSchedule: Omit<Schedule, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSchedule, user: currentUser.name }),
      });
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          if (data.schedule) {
            setSchedules((prev) => [data.schedule, ...prev]);
            return;
          }
        }
      }
    } catch {
      // fallback
    }
    const created: Schedule = {
      id: `sched_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...newSchedule,
    };
    setSchedules((prev) => [created, ...prev]);
  };

  // Delete Schedule
  const handleDeleteSchedule = async (id: string) => {
    try {
      await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
    } catch {
      // noop
    }
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  // Add Target Site
  const handleAddTarget = async (newTarget: Omit<TargetSite, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTarget, user: currentUser.name }),
      });
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          if (data.target) {
            setTargets((prev) => [...prev, data.target]);
            setSelectedTargetId(data.target.id);
            return;
          }
        }
      }
    } catch {
      // fallback
    }
    const created: TargetSite = {
      id: `target_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...newTarget,
    };
    setTargets((prev) => [...prev, created]);
    setSelectedTargetId(created.id);
  };

  // Trigger All Due
  const handleRunAllDue = () => {
    const activeScheds = schedules.filter((s) => s.isActive);
    if (activeScheds.length === 0) {
      alert('No active schedules found.');
      return;
    }
    const targetScript = scripts.find((s) => s.id === activeScheds[0].scriptId) || scripts[0];
    handleRunScriptDirect(targetScript);
  };

  const currentTarget = targets.find((t) => t.id === selectedTargetId) || targets[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        targets={targets}
        selectedTargetId={selectedTargetId}
        onSelectTarget={setSelectedTargetId}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onRunAllDue={handleRunAllDue}
        onNewScript={() => {
          setEditingScript(null);
          setActiveTab('studio');
        }}
        targetPingLatency={pingResults[selectedTargetId]}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Tab 1: Script Library */}
        {activeTab === 'library' && (
          <ScriptLibrary
            scripts={scripts}
            targets={targets}
            selectedTargetId={selectedTargetId}
            currentUser={currentUser}
            onSelectScriptToEdit={(script) => {
              setEditingScript(script);
              setActiveTab('studio');
            }}
            onRunScriptNow={handleRunScriptDirect}
            onOpenHistory={setHistoryModalScript}
            onOpenApproval={setApprovalModalScript}
            onNewScript={() => {
              setEditingScript(null);
              setActiveTab('studio');
            }}
            onImportScript={(imported) => {
              handleSaveScript({
                name: imported.name,
                targetSiteId: imported.targetSiteId,
                steps: imported.steps,
                tags: imported.tags,
                requiresApproval: false,
                changeLog: 'Imported from YAML DSL',
              });
            }}
            onToggleArchive={handleToggleArchive}
          />
        )}

        {/* Tab 2: Studio & Recorder */}
        {activeTab === 'studio' && (
          <TestStudio
            target={currentTarget}
            editingScript={editingScript}
            onSaveScript={handleSaveScript}
            onRunTestNow={handleTriggerRun}
          />
        )}

        {/* Tab 3: Runs & Reports */}
        {activeTab === 'runs' && (
          <RunReports
            runs={runs}
            onOpenReport={setActiveReportRun}
            onReRunScript={(scriptId) => {
              const scr = scripts.find((s) => s.id === scriptId);
              if (scr) handleRunScriptDirect(scr);
            }}
          />
        )}

        {/* Tab 4: Scheduler & Webhooks */}
        {activeTab === 'scheduler' && (
          <SchedulerView
            schedules={schedules}
            scripts={scripts}
            targets={targets}
            onToggleSchedule={handleToggleSchedule}
            onCreateSchedule={handleCreateSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onTriggerNow={(scriptId) => {
              const scr = scripts.find((s) => s.id === scriptId);
              if (scr) handleRunScriptDirect(scr);
            }}
          />
        )}

        {/* Tab 5: Targets & Audit Logs */}
        {activeTab === 'admin' && (
          <TargetsAndAdmin
            targets={targets}
            auditLogs={auditLogs}
            onAddTarget={handleAddTarget}
            onPingTarget={handlePingTarget}
            pingResults={pingResults}
          />
        )}
      </main>

      {/* MODALS */}

      {/* 1. Live Execution Modal */}
      {liveExecution && (
        <ExecutionProgressModal
          scriptName={liveExecution.scriptName}
          targetUrl={liveExecution.targetUrl}
          steps={liveExecution.steps}
          onComplete={(completedRun) => {
            setRuns((prev) => [completedRun, ...prev]);
          }}
          onViewReport={(run) => {
            setLiveExecution(null);
            setActiveReportRun(run);
          }}
          onClose={() => setLiveExecution(null)}
        />
      )}

      {/* 2. Run Diagnostics & Report Modal */}
      {activeReportRun && (
        <ReportDetailModal
          run={activeReportRun}
          onClose={() => setActiveReportRun(null)}
          onReRun={(scriptId) => {
            setActiveReportRun(null);
            const scr = scripts.find((s) => s.id === scriptId);
            if (scr) handleRunScriptDirect(scr);
          }}
        />
      )}

      {/* 3. Version History & Rollback Modal */}
      {historyModalScript && (
        <VersionHistoryModal
          script={historyModalScript}
          onClose={() => setHistoryModalScript(null)}
          onRollback={handleRollbackVersion}
        />
      )}

      {/* 4. Peer Review & Approval Modal */}
      {approvalModalScript && (
        <ApprovalModal
          script={approvalModalScript}
          currentUser={currentUser}
          onClose={() => setApprovalModalScript(null)}
          onSubmitDecision={handleSubmitApproval}
        />
      )}
    </div>
  );
}
