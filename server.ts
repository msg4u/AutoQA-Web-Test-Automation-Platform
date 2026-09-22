import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_TARGETS,
  INITIAL_SCRIPTS,
  INITIAL_VERSIONS,
  INITIAL_SCHEDULES,
  INITIAL_RUNS,
  INITIAL_AUDIT_LOGS,
} from './src/data/initialData';
import { stepsToYaml, generatePlaywrightCode, yamlToSteps } from './src/utils/dslConverter';
import { executeSimulationStep } from './src/utils/mockRunner';
import { ScriptStep, Run, StepResult } from './src/types';

// In-memory application store
let targets = [...INITIAL_TARGETS];
let scripts = [...INITIAL_SCRIPTS];
let versions = [...INITIAL_VERSIONS];
let schedules = [...INITIAL_SCHEDULES];
let runs = [...INITIAL_RUNS];
let auditLogs = [...INITIAL_AUDIT_LOGS];

// Lazy initialization for Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      geminiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Endpoints ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Target Sites
  app.get('/api/targets', (req, res) => {
    res.json(targets);
  });

  app.post('/api/targets', (req, res) => {
    const newTarget = {
      ...req.body,
      id: `target_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    targets.unshift(newTarget);
    auditLogs.unshift({
      id: `audit_${Date.now()}`,
      userId: 'current_user',
      userName: req.body.author || 'QA Engineer',
      role: 'qa',
      action: 'Created Target Site',
      entityType: 'target',
      entityName: newTarget.name,
      timestamp: new Date().toISOString(),
      details: `Added target site URL: ${newTarget.baseUrl}`,
    });
    res.status(201).json(newTarget);
  });

  app.put('/api/targets/:id', (req, res) => {
    const idx = targets.findIndex((t) => t.id === req.params.id);
    if (idx !== -1) {
      targets[idx] = { ...targets[idx], ...req.body };
      res.json(targets[idx]);
    } else {
      res.status(404).json({ error: 'Target not found' });
    }
  });

  app.delete('/api/targets/:id', (req, res) => {
    targets = targets.filter((t) => t.id !== req.params.id);
    res.json({ success: true });
  });

  // Live URL inspection helper
  app.post('/api/inspect-target', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'AutoQA-Verification/1.0' },
        signal: AbortSignal.timeout(6000),
      });
      const latency = Date.now() - startTime;
      const html = await response.text();

      // Extract basic metadata
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'Unknown Title';
      const hasStory = html.toLowerCase().includes('casa') || html.toLowerCase().includes('story') || html.toLowerCase().includes('purcel');

      res.json({
        status: response.status,
        statusText: response.statusText,
        latencyMs: latency,
        title,
        accessible: response.ok,
        elementsFound: {
          hasMain: html.includes('<main'),
          hasButtons: (html.match(/<button/gi) || []).length,
          hasInputs: (html.match(/<input/gi) || []).length,
          hasAudio: html.includes('<audio') || html.includes('AudioContext') || html.toLowerCase().includes('audio'),
          storySpecific: hasStory,
        },
      });
    } catch (err: any) {
      res.json({
        accessible: false,
        latencyMs: Date.now() - startTime,
        error: err.message || 'Connection failed or timeout',
      });
    }
  });

  // Scripts
  app.get('/api/scripts', (req, res) => {
    res.json(scripts);
  });

  app.get('/api/scripts/:id', (req, res) => {
    const script = scripts.find((s) => s.id === req.params.id);
    if (!script) return res.status(404).json({ error: 'Script not found' });
    const currentVer = versions.find((v) => v.id === script.currentVersionId);
    res.json({ ...script, currentVersion: currentVer });
  });

  app.post('/api/scripts', (req, res) => {
    const { name, targetSiteId, steps, tags, requiresApproval, author } = req.body;
    const scriptId = `script_${Date.now()}`;
    const versionId = `ver_${scriptId}_1`;

    const target = targets.find((t) => t.id === targetSiteId) || targets[0];
    const targetSlug = target.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const dslYaml = stepsToYaml(name, targetSlug, steps || []);
    const playwrightCode = generatePlaywrightCode(name, target.baseUrl, steps || []);

    const newVersion = {
      id: versionId,
      scriptId,
      versionNumber: 1,
      dslYaml,
      steps: steps || [],
      playwrightCode,
      author: author || 'Elena Popa',
      changeLog: 'Initial version creation',
      createdAt: new Date().toISOString(),
    };
    versions.unshift(newVersion);

    const newScript = {
      id: scriptId,
      name,
      targetSiteId,
      status: 'draft' as const,
      currentVersionId: versionId,
      currentVersion: newVersion,
      versions: [newVersion],
      tags: tags || ['smoke'],
      requiresApproval: !!requiresApproval,
      approvalStatus: requiresApproval ? ('pending' as const) : ('approved' as const),
      timeoutMs: 30000,
      retryCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    scripts.unshift(newScript);

    auditLogs.unshift({
      id: `audit_${Date.now()}`,
      userId: 'usr_qa',
      userName: author || 'Elena Popa',
      role: 'qa',
      action: 'Created Test Script',
      entityType: 'script',
      entityName: name,
      timestamp: new Date().toISOString(),
      details: `Created script with ${steps?.length || 0} steps`,
    });

    res.status(201).json({ ...newScript, currentVersion: newVersion });
  });

  app.put('/api/scripts/:id', (req, res) => {
    const idx = scripts.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Script not found' });

    scripts[idx] = { ...scripts[idx], ...req.body, updatedAt: new Date().toISOString() };
    res.json(scripts[idx]);
  });

  app.delete('/api/scripts/:id', (req, res) => {
    scripts = scripts.filter((s) => s.id !== req.params.id);
    versions = versions.filter((v) => v.scriptId !== req.params.id);
    schedules = schedules.filter((s) => s.scriptId !== req.params.id);
    res.json({ success: true });
  });

  // Versions
  app.get('/api/scripts/:id/versions', (req, res) => {
    const scriptVersions = versions.filter((v) => v.scriptId === req.params.id);
    res.json(scriptVersions);
  });

  app.post('/api/scripts/:id/versions', (req, res) => {
    const script = scripts.find((s) => s.id === req.params.id);
    if (!script) return res.status(404).json({ error: 'Script not found' });

    const { steps, changeLog, author, dslYaml } = req.body;
    const existingVersions = versions.filter((v) => v.scriptId === script.id);
    const nextVerNum = existingVersions.length + 1;
    const versionId = `ver_${script.id}_v${nextVerNum}`;

    const target = targets.find((t) => t.id === script.targetSiteId) || targets[0];
    const computedDsl = dslYaml || stepsToYaml(script.name, target.name.toLowerCase().replace(/[^a-z0-9]/g, '-'), steps);
    const playwrightCode = generatePlaywrightCode(script.name, target.baseUrl, steps);

    const newVer = {
      id: versionId,
      scriptId: script.id,
      versionNumber: nextVerNum,
      dslYaml: computedDsl,
      steps,
      playwrightCode,
      author: author || 'Elena Popa',
      changeLog: changeLog || `Updated test steps to version ${nextVerNum}`,
      createdAt: new Date().toISOString(),
    };
    versions.unshift(newVer);

    script.currentVersionId = versionId;
    script.updatedAt = new Date().toISOString();
    if (script.requiresApproval) {
      script.approvalStatus = 'pending';
      script.status = 'draft';
    }

    auditLogs.unshift({
      id: `audit_${Date.now()}`,
      userId: 'usr_qa',
      userName: author || 'Elena Popa',
      role: 'qa',
      action: 'Created New Script Version',
      entityType: 'version',
      entityName: `${script.name} (v${nextVerNum})`,
      timestamp: new Date().toISOString(),
      details: changeLog || `Updated steps`,
    });

    res.status(201).json(newVer);
  });

  // Approval Workflow
  app.post('/api/scripts/:id/approve', (req, res) => {
    const { approved, comment, reviewerName, reviewerRole } = req.body;
    const script = scripts.find((s) => s.id === req.params.id);
    if (!script) return res.status(404).json({ error: 'Script not found' });

    script.approvalStatus = approved ? 'approved' : 'rejected';
    script.status = approved ? 'active' : 'draft';
    script.approvedBy = reviewerName || 'Sarah Jenkins';
    script.approvalComment = comment || (approved ? 'Approved by reviewer' : 'Changes requested');
    script.updatedAt = new Date().toISOString();

    auditLogs.unshift({
      id: `audit_${Date.now()}`,
      userId: 'usr_reviewer',
      userName: reviewerName || 'Sarah Jenkins',
      role: reviewerRole || 'qa',
      action: approved ? 'Approved Script' : 'Rejected Script',
      entityType: 'script',
      entityName: script.name,
      timestamp: new Date().toISOString(),
      details: comment || (approved ? 'Approved for scheduling and execution' : 'Rejection remarks provided'),
    });

    res.json(script);
  });

  // Schedules
  app.get('/api/schedules', (req, res) => {
    res.json(schedules);
  });

  app.post('/api/schedules', (req, res) => {
    const newSchedule = {
      ...req.body,
      id: `sched_${Date.now()}`,
      webhookToken: `wh_${Math.random().toString(36).substring(2, 10)}`,
      lastRunAt: undefined,
    };
    schedules.unshift(newSchedule);
    res.status(201).json(newSchedule);
  });

  app.put('/api/schedules/:id', (req, res) => {
    const idx = schedules.findIndex((s) => s.id === req.params.id);
    if (idx !== -1) {
      schedules[idx] = { ...schedules[idx], ...req.body };
      res.json(schedules[idx]);
    } else {
      res.status(404).json({ error: 'Schedule not found' });
    }
  });

  // Runs
  app.get('/api/runs', (req, res) => {
    res.json(runs);
  });

  app.get('/api/runs/:id', (req, res) => {
    const run = runs.find((r) => r.id === req.params.id || r.shareableToken === req.params.id);
    if (!run) return res.status(404).json({ error: 'Run not found' });
    res.json(run);
  });

  // Execute Test Run (Manual, Direct Ad-hoc, Webhook or Scheduled)
  const handleExecuteRun = async (req: express.Request, res: express.Response) => {
    try {
      const {
        scriptId,
        versionId,
        scriptName,
        targetUrl,
        steps: directSteps,
        triggerType = 'manual',
        failStepIndex,
      } = req.body || {};

      let resolvedScriptName = scriptName || 'Automated Test Run';
      let resolvedTargetUrl = targetUrl || 'https://picurici-cele-trei-case.ai.studio/';
      let resolvedEnvironment: 'prod' | 'staging' | 'dev' = 'prod';
      let resolvedSteps: ScriptStep[] = Array.isArray(directSteps) ? directSteps : [];
      let resolvedScriptId = scriptId || `adhoc_${Date.now()}`;
      let resolvedVersionId = versionId || `adhoc_ver_${Date.now()}`;
      let retryCount = 1;

      if (scriptId) {
        const script = scripts.find((s) => s.id === scriptId);
        if (script) {
          resolvedScriptName = script.name;
          resolvedScriptId = script.id;
          retryCount = script.retryCount ?? 1;
          const target = targets.find((t) => t.id === script.targetSiteId) || targets[0];
          resolvedTargetUrl = target.baseUrl;
          resolvedEnvironment = target.environment;
          const version = versions.find((v) => v.id === (versionId || script.currentVersionId));
          resolvedVersionId = version?.id || script.currentVersionId;
          if (version?.steps && (!resolvedSteps || resolvedSteps.length === 0)) {
            resolvedSteps = version.steps;
          }
        }
      }

      if (!resolvedSteps || resolvedSteps.length === 0) {
        resolvedSteps = [
          {
            id: 'step_fallback_1',
            action: 'navigate',
            value: '/',
            description: 'Navigate to target page root',
          },
          {
            id: 'step_fallback_2',
            action: 'assert_visible',
            selector: 'body',
            description: 'Verify page body is rendered',
          },
        ];
      }

      const runId = `run_${Date.now()}`;
      const startedAt = new Date().toISOString();

      // Execute each step sequentially
      const stepResults: StepResult[] = [];
      let hasFailure = false;

      for (let i = 0; i < resolvedSteps.length; i++) {
        const step = resolvedSteps[i];
        if (hasFailure) {
          stepResults.push({
            id: `step_res_${Date.now()}_${i}`,
            runId,
            stepIndex: i,
            step,
            status: 'skipped',
            durationMs: 0,
            screenshotUrl: stepResults[i - 1]?.screenshotUrl || '',
            consoleLogs: [],
            networkCalls: [],
          });
        } else {
          const result = executeSimulationStep(
            step,
            i,
            resolvedTargetUrl,
            resolvedScriptName,
            failStepIndex !== undefined ? Number(failStepIndex) : undefined
          );
          result.runId = runId;
          stepResults.push(result);
          if (result.status === 'failed') {
            hasFailure = true;
          }
        }
      }

      const passedCount = stepResults.filter((s) => s.status === 'passed').length;
      const failedCount = stepResults.filter((s) => s.status === 'failed').length;
      const totalDuration = stepResults.reduce((acc, s) => acc + (s.durationMs || 0), 0);
      const finishedAt = new Date(Date.now() + totalDuration).toISOString();

      const newRun: Run = {
        id: runId,
        scriptId: resolvedScriptId,
        scriptVersionId: resolvedVersionId,
        scriptName: resolvedScriptName,
        targetUrl: resolvedTargetUrl,
        environment: resolvedEnvironment,
        triggerType,
        status: failedCount > 0 ? 'failed' : 'passed',
        startedAt,
        finishedAt,
        durationMs: totalDuration,
        stepsTotal: resolvedSteps.length,
        stepsPassed: passedCount,
        stepsFailed: failedCount,
        errorSummary:
          failedCount > 0
            ? `Assertion failed at step ${stepResults.findIndex((s) => s.status === 'failed') + 1}: ${
                stepResults.find((s) => s.status === 'failed')?.errorMessage
              }`
            : undefined,
        retryAttempt: failedCount > 0 ? (retryCount > 0 ? 1 : 0) : 0,
        stepResults,
        shareableToken: `share_${runId}_${Math.random().toString(36).substring(2, 9)}`,
      };

      runs.unshift(newRun);

      auditLogs.unshift({
        id: `audit_${Date.now()}`,
        userId: 'usr_runner',
        userName: triggerType === 'manual' ? 'QA Engineer' : 'AutoQA Engine',
        role: triggerType === 'manual' ? 'qa' : 'admin',
        action: `Executed Run (${newRun.status.toUpperCase()})`,
        entityType: 'run',
        entityId: newRun.id,
        entityName: resolvedScriptName,
        timestamp: new Date().toISOString(),
        details: `${newRun.stepsPassed}/${newRun.stepsTotal} steps passed in ${newRun.durationMs}ms [Trigger: ${triggerType}]`,
      });

      res.status(200).json({ run: newRun, ...newRun });
    } catch (err: any) {
      console.error('Execution handler error:', err);
      res.status(500).json({ error: err.message || 'Failed to execute test run' });
    }
  };

  app.post('/api/runs/execute', handleExecuteRun);
  app.post('/api/runs/execute-now', handleExecuteRun);

  // Webhook Inbound Trigger
  app.post('/api/webhooks/:token', (req, res) => {
    const { token } = req.params;
    const schedule = schedules.find((s) => s.webhookToken === token);
    if (!schedule) return res.status(404).json({ error: 'Invalid webhook token' });

    const script = scripts.find((s) => s.id === schedule.scriptId);
    if (!script) return res.status(404).json({ error: 'Target script not found' });

    schedule.lastRunAt = new Date().toISOString();

    // Trigger execution
    const target = targets.find((t) => t.id === script.targetSiteId) || targets[0];
    const version = versions.find((v) => v.id === script.currentVersionId);
    const steps = version?.steps || [];
    const runId = `run_wh_${Date.now()}`;

    const stepResults = steps.map((step, idx) => {
      const res = executeSimulationStep(step, idx, target.baseUrl, target.name);
      res.runId = runId;
      return res;
    });

    const passedCount = stepResults.filter((s) => s.status === 'passed').length;
    const totalDuration = stepResults.reduce((acc, s) => acc + s.durationMs, 0);

    const newRun: Run = {
      id: runId,
      scriptId: script.id,
      scriptVersionId: version?.id || '',
      scriptName: script.name,
      targetUrl: target.baseUrl,
      environment: target.environment,
      triggerType: 'webhook',
      status: 'passed',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: totalDuration,
      stepsTotal: steps.length,
      stepsPassed: passedCount,
      stepsFailed: 0,
      retryAttempt: 0,
      stepResults,
      shareableToken: `share_${runId}_${Math.random().toString(36).substring(2, 9)}`,
    };

    runs.unshift(newRun);
    res.json({ status: 'queued_and_completed', runId, reportUrl: `/reports/${newRun.id}` });
  });

  // Audit Logs
  app.get('/api/audit-logs', (req, res) => {
    res.json(auditLogs);
  });

  // AI-Assisted Script Generation (Gemini API)
  app.post('/api/ai/generate-script', async (req, res) => {
    const { prompt, targetUrl, targetName } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const ai = getGeminiClient();

    // If Gemini client is available, call the real gemini-3.8-flash model
    if (ai) {
      try {
        const systemInstruction = `You are a Principal Test Automation Architect.
Your task is to take a natural language description of what to test on a website, and return a robust, high-quality test plan with concrete automated browser steps.

Target Website: ${targetName || 'Web Application'} (${targetUrl || 'https://picurici-cele-trei-case.ai.studio/'})

Allowed Step Actions:
- navigate: value is the relative or full path (e.g. "/")
- click: selector is the element selector or resilient text indicator (e.g. "first house", "text=Audio: ON 🔊", "button.submit")
- type: selector is the input locator, value is text to enter
- select: selector is dropdown, value is option to choose
- wait_for_element: selector is element, timeoutMs is wait limit
- assert_visible: selector is element that should be visible
- assert_text: selector is element, expected is expected text
- assert_url_contains: expected is substring in the URL (e.g. "/story")
- screenshot: value is the checkpoint label
- custom_js_assertion: value is Javascript boolean expression
- go_back: navigate back

Return STRICT JSON matching this schema:
{
  "scriptName": "Concise Descriptive Name",
  "targetSlug": "slug-name",
  "explanation": "Brief 1-2 sentence explanation of coverage",
  "steps": [
    {
      "action": "navigate" | "click" | "type" | "select" | "wait_for_element" | "assert_visible" | "assert_text" | "assert_url_contains" | "screenshot" | "go_back",
      "selector": "selector or locator if applicable",
      "value": "input text or checkpoint label if applicable",
      "expected": "expected text or URL substring if applicable",
      "description": "Human-readable plain English description of what this step does"
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `User requirement to test:\n"${prompt}"\nTarget URL: ${targetUrl}`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '{}';
        const parsed = JSON.parse(text);

        const steps: ScriptStep[] = (parsed.steps || []).map((s: any, idx: number) => ({
          id: `ai_step_${idx + 1}_${Date.now()}`,
          action: s.action || 'click',
          selector: s.selector,
          value: s.value,
          expected: s.expected,
          timeoutMs: s.timeoutMs || 5000,
          description: s.description || `${s.action} ${s.selector || s.value || ''}`,
        }));

        const dslYaml = stepsToYaml(parsed.scriptName || 'Generated Test Flow', parsed.targetSlug || 'target-app', steps);
        const playwrightCode = generatePlaywrightCode(parsed.scriptName || 'Generated Test Flow', targetUrl || 'https://picurici-cele-trei-case.ai.studio/', steps);

        return res.json({
          scriptName: parsed.scriptName || 'AI Generated Test Flow',
          explanation: parsed.explanation || 'Generated automated test flow from natural language intent.',
          steps,
          dslYaml,
          playwrightCode,
          source: 'gemini-3.8-flash',
        });
      } catch (err: any) {
        console.warn('Gemini API call failed, falling back to heuristic AI generator:', err.message);
      }
    }

    // Heuristic intelligent fallback when API key is pending or network fallback
    const isPicurici = (targetUrl || '').includes('picurici') || prompt.toLowerCase().includes('house') || prompt.toLowerCase().includes('case');
    const steps: ScriptStep[] = [
      { id: `step_1`, action: 'navigate', value: '/', description: 'Navigate to target root "/"' },
      { id: `step_2`, action: 'assert_visible', selector: isPicurici ? 'main illustration' : 'main', description: `Assert visible: ${isPicurici ? 'main illustration' : 'main container'}` },
      { id: `step_3`, action: 'click', selector: isPicurici ? 'first house' : 'button.primary', description: `Click element: ${isPicurici ? 'first house (straw)' : 'primary CTA'}` },
      { id: `step_4`, action: 'assert_url_contains', expected: isPicurici ? '/story' : '/', description: `Assert URL contains "${isPicurici ? '/story' : '/'}"` },
      { id: `step_5`, action: 'screenshot', value: 'checkpoint-view', description: 'Capture screenshot checkpoint: checkpoint-view' },
      { id: `step_6`, action: 'go_back', description: 'Navigate back to previous screen' },
      { id: `step_7`, action: 'assert_visible', selector: isPicurici ? 'second house' : 'header', description: `Assert visible: ${isPicurici ? 'second house' : 'header navigation'}` },
    ];

    const scriptName = isPicurici ? 'Three houses homepage flow' : 'Automated Verification Flow';
    const dslYaml = stepsToYaml(scriptName, 'target-app', steps);
    const playwrightCode = generatePlaywrightCode(scriptName, targetUrl || 'https://picurici-cele-trei-case.ai.studio/', steps);

    return res.json({
      scriptName,
      explanation: `Synthesized ${steps.length} test steps from intent "${prompt}" with Playwright locator bindings and assertions.`,
      steps,
      dslYaml,
      playwrightCode,
      source: 'heuristic-engine',
    });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoQA Platform server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
