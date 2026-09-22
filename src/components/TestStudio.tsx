import React, { useState } from 'react';
import { TargetSite, ScriptStep, StepAction, Script } from '../types';
import { TargetSandbox } from './TargetSandbox';
import { stepsToYaml, yamlToSteps, generatePlaywrightCode } from '../utils/dslConverter';
import {
  Sparkles,
  Play,
  Save,
  Plus,
  Trash2,
  Code,
  FileCode,
  Layers,
  Camera,
  MousePointer,
  CheckCircle2,
  ArrowUpDown,
  Download,
  Copy,
  Check,
  Radio,
  Clock,
  HelpCircle,
} from 'lucide-react';

interface TestStudioProps {
  target: TargetSite;
  editingScript?: Script | null;
  onSaveScript: (scriptData: {
    name: string;
    targetSiteId: string;
    steps: ScriptStep[];
    tags: string[];
    requiresApproval: boolean;
    changeLog?: string;
  }) => void;
  onRunTestNow: (steps: ScriptStep[], name: string) => void;
}

export const TestStudio: React.FC<TestStudioProps> = ({
  target,
  editingScript,
  onSaveScript,
  onRunTestNow,
}) => {
  const [activeMode, setActiveMode] = useState<'recorder' | 'ai' | 'editor'>('recorder');
  const [isRecording, setIsRecording] = useState(false);

  // Script Metadata
  const [scriptName, setScriptName] = useState(editingScript?.name || 'Three houses homepage flow');
  const [tagsInput, setTagsInput] = useState((editingScript?.tags || ['smoke', 'homepage']).join(', '));
  const [requiresApproval, setRequiresApproval] = useState(editingScript?.requiresApproval ?? true);
  const [changeLog, setChangeLog] = useState('');

  // Steps
  const [steps, setSteps] = useState<ScriptStep[]>([
    { id: 's1_1', action: 'navigate', value: '/', description: 'Navigate to root "/"' },
    { id: 's1_2', action: 'assert_visible', selector: 'main illustration', description: 'Assert visible: main illustration' },
    { id: 's1_3', action: 'click', selector: 'first house', description: 'Click element: first house (Căsuța de Paie)' },
    { id: 's1_4', action: 'assert_url_contains', expected: '/story', description: 'Assert URL contains "/story"' },
    { id: 's1_5', action: 'screenshot', value: 'story-page', description: 'Capture screenshot: story-page' },
    { id: 's1_6', action: 'go_back', description: 'Navigate back to homepage' },
    { id: 's1_7', action: 'click', selector: 'second house', description: 'Click element: second house (Căsuța de Lemn)' },
    { id: 's1_8', action: 'assert_visible', selector: 'story title', description: 'Assert visible: story title' },
  ]);

  // Code Tab in Editor
  const [codeTab, setCodeTab] = useState<'yaml' | 'playwright'>('yaml');
  const [copied, setCopied] = useState(false);

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState(
    'Check that the site loads, the main illustration appears, and clicking each of the three houses navigates to a story page'
  );
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // Record a step from sandbox
  const handleRecordStep = (newStep: Omit<ScriptStep, 'id'>) => {
    const stepWithId: ScriptStep = {
      ...newStep,
      id: `step_${Date.now()}_${steps.length + 1}`,
    };
    setSteps((prev) => [...prev, stepWithId]);
  };

  // Add a blank step manually
  const handleAddBlankStep = () => {
    const newStep: ScriptStep = {
      id: `step_${Date.now()}_${steps.length + 1}`,
      action: 'click',
      selector: 'button',
      description: 'Click button element',
    };
    setSteps((prev) => [...prev, newStep]);
  };

  // Remove a step
  const handleRemoveStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  // Update a step property
  const handleUpdateStep = (id: string, updates: Partial<ScriptStep>) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, ...updates };
        // Auto update description if not manually edited
        if (!updates.description) {
          switch (updated.action) {
            case 'navigate':
              updated.description = `Navigate to "${updated.value || '/'}"`;
              break;
            case 'click':
              updated.description = `Click "${updated.selector || 'element'}"`;
              break;
            case 'assert_visible':
              updated.description = `Assert visible "${updated.selector || 'element'}"`;
              break;
            case 'assert_text':
              updated.description = `Assert "${updated.selector}" contains "${updated.expected}"`;
              break;
            case 'assert_url_contains':
              updated.description = `Assert URL contains "${updated.expected}"`;
              break;
            case 'screenshot':
              updated.description = `Capture screenshot "${updated.value || 'checkpoint'}"`;
              break;
            case 'go_back':
              updated.description = `Navigate back to previous screen`;
              break;
          }
        }
        return updated;
      })
    );
  };

  // AI-Assisted Generation
  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiExplanation(null);

    try {
      const response = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          targetUrl: target.baseUrl,
          targetName: target.name,
        }),
      });

      const data = await response.json();
      if (data.steps && data.steps.length > 0) {
        setSteps(data.steps);
        if (data.scriptName) setScriptName(data.scriptName);
        setAiExplanation(data.explanation || 'Test script synthesized with Playwright bindings.');
      }
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  // YAML and Playwright code outputs
  const targetSlug = target.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const dslYaml = stepsToYaml(scriptName, targetSlug, steps);
  const playwrightCode = generatePlaywrightCode(scriptName, target.baseUrl, steps);

  const handleCopyCode = () => {
    const textToCopy = codeTab === 'yaml' ? dslYaml : playwrightCode;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const content = codeTab === 'yaml' ? dslYaml : playwrightCode;
    const filename =
      codeTab === 'yaml'
        ? `${scriptName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.autoqa.yaml`
        : `${scriptName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.spec.ts`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onSaveScript({
      name: scriptName,
      targetSiteId: target.id,
      steps,
      tags,
      requiresApproval,
      changeLog: changeLog || 'Updated test steps via Studio',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Metadata Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[280px]">
            <label className="block text-xs font-semibold text-slate-400 mb-1">Test Script Name</label>
            <input
              type="text"
              value={scriptName}
              onChange={(e) => setScriptName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-100 outline-none focus:border-blue-500"
              placeholder="e.g. Three houses homepage flow"
            />
          </div>

          <div className="w-48">
            <label className="block text-xs font-semibold text-slate-400 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
              placeholder="smoke, navigation"
            />
          </div>

          <div className="flex items-center gap-2 pt-4">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
              <span>Require Peer Approval</span>
            </label>

            <button
              onClick={() => onRunTestNow(steps, scriptName)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
              title="Execute current steps against target site"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run Now ({steps.length})</span>
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Version</span>
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setActiveMode('recorder')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeMode === 'recorder'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MousePointer className="h-3.5 w-3.5" />
              <span>Interactive Recorder</span>
            </button>

            <button
              onClick={() => setActiveMode('ai')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeMode === 'ai'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>AI Assistant (Gemini)</span>
            </button>

            <button
              onClick={() => setActiveMode('editor')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeMode === 'editor'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              <span>DSL & Playwright Code</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>{steps.length} Steps Defined</span>
            <span className="text-slate-600">•</span>
            <span>Target: <strong className="text-slate-300">{target.name}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Mode Content */}

      {/* MODE 1: Interactive Recorder & Live Sandbox */}
      {activeMode === 'recorder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left: Interactive Sandbox */}
          <div className="lg:col-span-7 h-[680px]">
            <TargetSandbox
              target={target}
              isRecording={isRecording}
              onRecordStep={handleRecordStep}
            />
          </div>

          {/* Right: Step Recording Stream */}
          <div className="lg:col-span-5 h-[680px] flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>Captured Test Steps</span>
                  <span className="text-xs font-mono bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                    {steps.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Review human-readable actions</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>{isRecording ? 'Recording ON' : 'Start Recording'}</span>
                </button>

                <button
                  onClick={handleAddBlankStep}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-lg border border-slate-700 text-xs"
                  title="Add step manually"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Steps List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-2.5 hover:border-slate-600 transition-colors flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-400 uppercase text-[10px] tracking-wider px-1.5 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
                          {step.action}
                        </span>
                        {step.selector && (
                          <span className="text-slate-300 font-mono text-[11px] truncate max-w-[180px]">
                            {step.selector}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 text-xs mt-1">{step.description}</p>
                      {step.expected && (
                        <p className="text-emerald-400 text-[11px] font-mono mt-0.5">
                          expected: &quot;{step.expected}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveStep(step.id)}
                    className="text-slate-500 hover:text-red-400 p-1 rounded"
                    title="Remove step"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {steps.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No steps recorded yet. Click &quot;Start Recording&quot; and click elements in the simulator.
                </div>
              )}
            </div>

            {/* Quick Action Bar for common asserts */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2 text-xs">
              <button
                onClick={() =>
                  handleRecordStep({
                    action: 'assert_visible',
                    selector: 'main illustration',
                    description: 'Assert visible: main illustration',
                  })
                }
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[11px] border border-slate-700"
              >
                + Assert Visible
              </button>
              <button
                onClick={() =>
                  handleRecordStep({
                    action: 'assert_url_contains',
                    expected: '/story',
                    description: 'Assert URL contains "/story"',
                  })
                }
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[11px] border border-slate-700"
              >
                + Assert URL (/story)
              </button>
              <button
                onClick={() =>
                  handleRecordStep({
                    action: 'screenshot',
                    value: `checkpoint-${steps.length + 1}`,
                    description: `Screenshot: checkpoint-${steps.length + 1}`,
                  })
                }
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[11px] border border-slate-700"
              >
                + Screenshot Checkpoint
              </button>
              <button
                onClick={() =>
                  handleRecordStep({
                    action: 'go_back',
                    description: 'Navigate back to previous screen',
                  })
                }
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[11px] border border-slate-700"
              >
                + Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: AI-Assisted Script Generator */}
      {activeMode === 'ai' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-bold text-slate-100">AI-Assisted Test Script Generator</h3>
              <span className="bg-amber-400/10 text-amber-300 text-xs font-semibold px-2 py-0.5 rounded border border-amber-400/20">
                Powered by Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Describe your testing intent in plain English. Gemini analyzes the target DOM structure and synthesizes
              a complete human-readable step list with resilient Playwright selectors and assertions.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Describe what to test:</label>
            <textarea
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 outline-none focus:border-blue-500 font-sans leading-relaxed"
              placeholder="e.g. Check that the site loads, the main illustration appears, and clicking each of the three houses navigates to a story page..."
            />
          </div>

          {/* Quick Preset Prompts */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">Try a worked example prompt:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setAiPrompt(
                    'Check that the site loads, the main illustration appears, and clicking each of the three houses navigates to a story page'
                  )
                }
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 text-left transition-colors"
              >
                🏠 Three houses homepage navigation flow (Section 9)
              </button>
              <button
                onClick={() =>
                  setAiPrompt(
                    'Verify audio toggle switches to ON, click the third brick house, and verify sturdy masonry story text'
                  )
                }
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 text-left transition-colors"
              >
                🔊 Audio controls and brick house verification
              </button>
              <button
                onClick={() =>
                  setAiPrompt(
                    'Test accessibility landmarks: header presence, h1 title match, and responsive screenshot checkpoint'
                  )
                }
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 text-left transition-colors"
              >
                ♿ Accessibility and Title Verification
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateWithAI}
              disabled={aiGenerating}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-md transition-all disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{aiGenerating ? 'Synthesizing with Gemini...' : 'Generate Automated Test Script'}</span>
            </button>

            {aiExplanation && (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                ✓ {aiExplanation}
              </span>
            )}
          </div>

          {/* Generated Steps Preview */}
          {steps.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <h4 className="text-sm font-bold text-slate-200 mb-3">Generated Test Plan ({steps.length} Steps)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="bg-slate-800/90 border border-slate-700 rounded-lg p-3 flex items-start gap-3 text-xs"
                  >
                    <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-200 block">{step.description}</span>
                      <div className="text-[11px] font-mono text-slate-400 mt-1">
                        action: <span className="text-amber-400">{step.action}</span>
                        {step.selector && <> | selector: <span className="text-sky-300">{step.selector}</span></>}
                        {step.expected && <> | expected: <span className="text-emerald-300">{step.expected}</span></>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: Code & DSL Split Editor */}
      {activeMode === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Step Form Editor */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-[650px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-400" />
                <span>Visual Step Builder</span>
              </h3>
              <button
                onClick={handleAddBlankStep}
                className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Step</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
              {steps.map((step, idx) => (
                <div key={step.id} className="bg-slate-800/90 border border-slate-700 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-700 font-bold text-slate-300 flex items-center justify-center text-[11px]">
                        {idx + 1}
                      </span>
                      <select
                        value={step.action}
                        onChange={(e) => handleUpdateStep(step.id, { action: e.target.value as StepAction })}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-semibold text-blue-400 outline-none cursor-pointer"
                      >
                        <option value="navigate">navigate</option>
                        <option value="click">click</option>
                        <option value="type">type / fill</option>
                        <option value="select">select dropdown</option>
                        <option value="wait_for_element">wait_for_element</option>
                        <option value="assert_visible">assert_visible</option>
                        <option value="assert_text">assert_text</option>
                        <option value="assert_url_contains">assert_url_contains</option>
                        <option value="screenshot">screenshot</option>
                        <option value="custom_js_assertion">custom_js_assertion</option>
                        <option value="go_back">go_back</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleRemoveStep(step.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                      title="Delete step"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Dynamic inputs based on action */}
                  {step.action !== 'go_back' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {['click', 'type', 'select', 'wait_for_element', 'assert_visible', 'assert_text'].includes(
                        step.action
                      ) && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Selector / Target</label>
                          <input
                            type="text"
                            value={step.selector || ''}
                            onChange={(e) => handleUpdateStep(step.id, { selector: e.target.value })}
                            placeholder="e.g. first house, button#submit"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs outline-none"
                          />
                        </div>
                      )}

                      {['navigate', 'type', 'select', 'screenshot', 'custom_js_assertion'].includes(step.action) && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            {step.action === 'navigate'
                              ? 'URL Path'
                              : step.action === 'screenshot'
                              ? 'Checkpoint Label'
                              : 'Value / Expression'}
                          </label>
                          <input
                            type="text"
                            value={step.value || ''}
                            onChange={(e) => handleUpdateStep(step.id, { value: e.target.value })}
                            placeholder="e.g. /story or input text"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs outline-none"
                          />
                        </div>
                      )}

                      {['assert_text', 'assert_url_contains'].includes(step.action) && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Expected Condition</label>
                          <input
                            type="text"
                            value={step.expected || ''}
                            onChange={(e) => handleUpdateStep(step.id, { expected: e.target.value })}
                            placeholder="e.g. /story or title text"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs outline-none"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Human Description</label>
                        <input
                          type="text"
                          value={step.description}
                          onChange={(e) => handleUpdateStep(step.id, { description: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 text-xs outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Code Viewer (YAML DSL & Playwright) */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-[650px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setCodeTab('yaml')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    codeTab === 'yaml' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  <span>Declarative YAML DSL</span>
                </button>
                <button
                  onClick={() => setCodeTab('playwright')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    codeTab === 'playwright'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>Playwright TypeScript</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded text-xs border border-slate-700 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownloadCode}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded text-xs border border-slate-700 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto bg-slate-950 p-3 rounded-lg border border-slate-800 my-3 font-mono text-xs text-slate-200 leading-relaxed">
              <pre>{codeTab === 'yaml' ? dslYaml : playwrightCode}</pre>
            </div>

            <p className="text-[11px] text-slate-500">
              {codeTab === 'yaml'
                ? 'Section 9 standard DSL: maps 1:1 to executable Playwright automation.'
                : 'Full executable Playwright test script ready to export and execute in CI/CD.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
