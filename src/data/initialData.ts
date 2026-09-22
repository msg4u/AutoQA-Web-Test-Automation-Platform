import { TargetSite, Script, ScriptVersion, Schedule, Run, AuditLogItem, UserProfile, ScriptStep } from '../types';
import { stepsToYaml, generatePlaywrightCode } from '../utils/dslConverter';
import { executeSimulationStep } from '../utils/mockRunner';

export const INITIAL_USERS: UserProfile[] = [
  { id: 'usr_qa_1', name: 'Elena Popa', email: 'elena.qa@autotest.io', role: 'qa' },
  { id: 'usr_dev_1', name: 'Mihai Ionescu', email: 'mihai.dev@autotest.io', role: 'developer' },
  { id: 'usr_po_1', name: 'Sarah Jenkins', email: 'sarah.po@autotest.io', role: 'product_owner' },
  { id: 'usr_admin_1', name: 'Alex Radu', email: 'alex.admin@autotest.io', role: 'admin' },
];

export const CURRENT_USER: UserProfile = INITIAL_USERS[0];

export const INITIAL_TARGETS: TargetSite[] = [
  {
    id: 'target_picurici_prod',
    name: 'Picurici — Cele Trei Case (Prod)',
    baseUrl: 'https://picurici-cele-trei-case.ai.studio/',
    environment: 'prod',
    authConfig: { type: 'none' },
    tags: ['storybook', 'interactive', 'audio', 'production'],
    createdAt: '2026-09-10T08:00:00.000Z',
  },
  {
    id: 'target_picurici_staging',
    name: 'Picurici — Cele Trei Case (Staging)',
    baseUrl: 'https://staging-picurici-cele-trei-case.ai.studio/',
    environment: 'staging',
    authConfig: { type: 'bearer', token: 'stg_auth_sec_89102' },
    tags: ['storybook', 'staging', 'pre-release'],
    createdAt: '2026-09-12T10:30:00.000Z',
  },
  {
    id: 'target_generic_ecommerce',
    name: 'Sample Storefront QA',
    baseUrl: 'https://demo-storefront.ai.studio/',
    environment: 'prod',
    authConfig: { type: 'none' },
    tags: ['e-commerce', 'cart-checkout'],
    createdAt: '2026-09-15T14:15:00.000Z',
  },
];

const script1Steps: ScriptStep[] = [
  { id: 's1_1', action: 'navigate' as const, value: '/', description: 'Navigate to root "/"' },
  { id: 's1_2', action: 'assert_visible' as const, selector: 'main illustration', description: 'Assert visible: main illustration' },
  { id: 's1_3', action: 'click' as const, selector: 'first house', description: 'Click element: first house (Căsuța de Paie)' },
  { id: 's1_4', action: 'assert_url_contains' as const, expected: '/story', description: 'Assert URL contains "/story"' },
  { id: 's1_5', action: 'screenshot' as const, value: 'story-page', description: 'Capture screenshot: story-page' },
  { id: 's1_6', action: 'go_back' as const, description: 'Navigate back to homepage' },
  { id: 's1_7', action: 'click' as const, selector: 'second house', description: 'Click element: second house (Căsuța de Lemn)' },
  { id: 's1_8', action: 'assert_visible' as const, selector: 'story title', description: 'Assert visible: story title' },
];

const script2Steps: ScriptStep[] = [
  { id: 's2_1', action: 'navigate' as const, value: '/', description: 'Navigate to target "/"' },
  { id: 's2_2', action: 'click' as const, selector: 'text=Audio: ON 🔊', description: 'Click audio toggle button' },
  { id: 's2_3', action: 'click' as const, selector: 'third house', description: 'Click element: third house (Căsuța de Cărămidă)' },
  { id: 's2_4', action: 'assert_text' as const, selector: 'h2', expected: 'Căsuța de Cărămidă', description: 'Assert title matches "Căsuța de Cărămidă"' },
  { id: 's2_5', action: 'screenshot' as const, value: 'brick-house-story', description: 'Capture screenshot: brick-house-story' },
];

const script3Steps: ScriptStep[] = [
  { id: 's3_1', action: 'navigate' as const, value: '/', description: 'Navigate to root "/"' },
  { id: 's3_2', action: 'assert_visible' as const, selector: 'header', description: 'Verify top header presence' },
  { id: 's3_3', action: 'assert_text' as const, selector: 'h1', expected: 'Picurici — Cele Trei Căsuțe', description: 'Verify main heading text' },
  { id: 's3_4', action: 'screenshot' as const, value: 'a11y-overview', description: 'Take accessibility visual checkpoint' },
];

export const INITIAL_VERSIONS: ScriptVersion[] = [
  {
    id: 'ver_3houses_v1',
    scriptId: 'script_3houses_homepage',
    versionNumber: 1,
    dslYaml: stepsToYaml('Three houses homepage flow', 'picurici-cele-trei-case', script1Steps.slice(0, 5)),
    steps: script1Steps.slice(0, 5),
    playwrightCode: generatePlaywrightCode('Three houses homepage flow', 'https://picurici-cele-trei-case.ai.studio/', script1Steps.slice(0, 5)),
    author: 'Mihai Ionescu',
    changeLog: 'Initial draft covering first house navigation',
    createdAt: '2026-09-15T09:00:00.000Z',
  },
  {
    id: 'ver_3houses_v2',
    scriptId: 'script_3houses_homepage',
    versionNumber: 2,
    dslYaml: stepsToYaml('Three houses homepage flow', 'picurici-cele-trei-case', script1Steps),
    steps: script1Steps,
    playwrightCode: generatePlaywrightCode('Three houses homepage flow', 'https://picurici-cele-trei-case.ai.studio/', script1Steps),
    author: 'Elena Popa',
    changeLog: 'Added go_back and second house assertion to complete full 8-step specification',
    createdAt: '2026-09-20T11:20:00.000Z',
  },
  {
    id: 'ver_audio_v1',
    scriptId: 'script_audio_interactions',
    versionNumber: 1,
    dslYaml: stepsToYaml('Story page audio and house interactions', 'picurici-cele-trei-case', script2Steps),
    steps: script2Steps,
    playwrightCode: generatePlaywrightCode('Story page audio and house interactions', 'https://picurici-cele-trei-case.ai.studio/', script2Steps),
    author: 'Elena Popa',
    changeLog: 'Initial release for audio toggle and third house story verification',
    createdAt: '2026-09-17T14:30:00.000Z',
  },
  {
    id: 'ver_a11y_v1',
    scriptId: 'script_accessibility_headers',
    versionNumber: 1,
    dslYaml: stepsToYaml('Accessibility and title heading check', 'picurici-cele-trei-case', script3Steps),
    steps: script3Steps,
    playwrightCode: generatePlaywrightCode('Accessibility and title heading check', 'https://picurici-cele-trei-case.ai.studio/', script3Steps),
    author: 'Alex Radu',
    changeLog: 'Draft accessibility structure',
    createdAt: '2026-09-21T16:00:00.000Z',
  },
];

export const INITIAL_SCRIPTS: Script[] = [
  {
    id: 'script_3houses_homepage',
    name: 'Three houses homepage flow',
    targetSiteId: 'target_picurici_prod',
    status: 'active',
    currentVersionId: 'ver_3houses_v2',
    currentVersion: INITIAL_VERSIONS[1],
    versions: [INITIAL_VERSIONS[1], INITIAL_VERSIONS[0]],
    tags: ['smoke', 'critical-path', 'homepage', 'navigation'],
    requiresApproval: true,
    approvalStatus: 'approved',
    approvedBy: 'Elena Popa',
    approvedAt: '2026-09-20T11:25:00.000Z',
    approvalComment: 'All 8 steps reviewed against requirements section 9. Playwright mappings verified.',
    timeoutMs: 30000,
    retryCount: 1,
    createdAt: '2026-09-15T09:00:00.000Z',
    updatedAt: '2026-09-20T11:20:00.000Z',
  },
  {
    id: 'script_audio_interactions',
    name: 'Story page audio and house interactions',
    targetSiteId: 'target_picurici_prod',
    status: 'active',
    currentVersionId: 'ver_audio_v1',
    currentVersion: INITIAL_VERSIONS[2],
    versions: [INITIAL_VERSIONS[2]],
    tags: ['audio', 'interaction', 'regression'],
    requiresApproval: false,
    approvalStatus: 'approved',
    approvedBy: 'Mihai Ionescu',
    approvedAt: '2026-09-17T14:35:00.000Z',
    approvalComment: 'Audio state toggle verified with Web Audio API.',
    timeoutMs: 25000,
    retryCount: 1,
    createdAt: '2026-09-17T14:30:00.000Z',
    updatedAt: '2026-09-17T14:30:00.000Z',
  },
  {
    id: 'script_accessibility_headers',
    name: 'Accessibility and title heading check',
    targetSiteId: 'target_picurici_prod',
    status: 'draft',
    currentVersionId: 'ver_a11y_v1',
    currentVersion: INITIAL_VERSIONS[3],
    versions: [INITIAL_VERSIONS[3]],
    tags: ['a11y', 'draft', 'i18n'],
    requiresApproval: true,
    approvalStatus: 'pending',
    timeoutMs: 20000,
    retryCount: 0,
    createdAt: '2026-09-21T16:00:00.000Z',
    updatedAt: '2026-09-21T16:00:00.000Z',
  },
];

export const INITIAL_SCHEDULES: Schedule[] = [
  {
    id: 'sched_3houses_daily',
    scriptId: 'script_3houses_homepage',
    scriptName: 'Three houses homepage flow',
    cronExpression: '0 7 * * *',
    humanDescription: 'Every day at 07:00 UTC',
    humanReadable: 'Every day at 07:00 UTC',
    active: true,
    isActive: true,
    concurrencyPolicy: 'skip',
    webhookToken: 'wh_3houses_prod_99a81e3',
    webhookSecret: 'whsec_99a81e3_prod',
    lastRunAt: '2026-09-22T07:00:00.000Z',
    nextRunAt: '2026-09-23T07:00:00.000Z',
  },
  {
    id: 'sched_audio_15min',
    scriptId: 'script_audio_interactions',
    scriptName: 'Story page audio and house interactions',
    cronExpression: '*/15 * * * *',
    humanDescription: 'Every 15 minutes',
    humanReadable: 'Every 15 minutes',
    active: true,
    isActive: true,
    concurrencyPolicy: 'queue',
    webhookToken: 'wh_audio_stg_4478bc',
    webhookSecret: 'whsec_4478bc_stg',
    lastRunAt: '2026-09-22T07:15:00.000Z',
    nextRunAt: '2026-09-22T07:30:00.000Z',
  },
];

// Generate sample completed runs
function generateSampleRun(
  id: string,
  scriptId: string,
  scriptVersionId: string,
  scriptName: string,
  targetUrl: string,
  triggerType: 'manual' | 'scheduled' | 'webhook',
  startedAt: string,
  finishedAt: string,
  steps: ScriptStep[],
  failStepIdx?: number
): Run {
  const stepResults = steps.map((step, idx) => {
    const res = executeSimulationStep(step, idx, targetUrl, 'Picurici — Cele Trei Case', failStepIdx);
    res.runId = id;
    return res;
  });

  const passed = stepResults.filter((s) => s.status === 'passed').length;
  const failed = stepResults.filter((s) => s.status === 'failed').length;
  const totalDuration = stepResults.reduce((acc, s) => acc + s.durationMs, 0);

  return {
    id,
    scriptId,
    scriptVersionId,
    scriptName,
    targetUrl,
    environment: 'prod',
    triggerType,
    status: failed > 0 ? 'failed' : 'passed',
    startedAt,
    finishedAt,
    durationMs: totalDuration,
    stepsTotal: steps.length,
    stepsPassed: passed,
    stepsFailed: failed,
    errorSummary: failed > 0 ? `Step ${failStepIdx! + 1} (${steps[failStepIdx!].description}) failed timeout assertion` : undefined,
    retryAttempt: failed > 0 ? 1 : 0,
    stepResults,
    shareableToken: `rpt_token_${id}_${Math.random().toString(36).substring(2, 8)}`,
  };
}

export const INITIAL_RUNS: Run[] = [
  generateSampleRun(
    'run_104_recent_pass',
    'script_3houses_homepage',
    'ver_3houses_v2',
    'Three houses homepage flow',
    'https://picurici-cele-trei-case.ai.studio/',
    'scheduled',
    '2026-09-22T07:00:00.000Z',
    '2026-09-22T07:00:02.400Z',
    script1Steps
  ),
  generateSampleRun(
    'run_103_manual_pass',
    'script_audio_interactions',
    'ver_audio_v1',
    'Story page audio and house interactions',
    'https://picurici-cele-trei-case.ai.studio/',
    'manual',
    '2026-09-22T06:14:00.000Z',
    '2026-09-22T06:14:01.850Z',
    script2Steps
  ),
  generateSampleRun(
    'run_102_webhook_fail',
    'script_3houses_homepage',
    'ver_3houses_v2',
    'Three houses homepage flow',
    'https://picurici-cele-trei-case.ai.studio/',
    'webhook',
    '2026-09-21T21:40:00.000Z',
    '2026-09-21T21:40:06.900Z',
    script1Steps,
    7 // Failing at step 8: assert_visible "story title"
  ),
  generateSampleRun(
    'run_101_historical_pass',
    'script_3houses_homepage',
    'ver_3houses_v1',
    'Three houses homepage flow',
    'https://picurici-cele-trei-case.ai.studio/',
    'scheduled',
    '2026-09-21T07:00:00.000Z',
    '2026-09-21T07:00:02.100Z',
    script1Steps.slice(0, 5)
  ),
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'audit_5',
    userId: 'usr_qa_1',
    userName: 'Elena Popa',
    role: 'qa',
    action: 'Approved Script Version',
    entityType: 'script',
    entityName: 'Three houses homepage flow (v2)',
    timestamp: '2026-09-20T11:25:00.000Z',
    details: 'Approved for automated production cron scheduling.',
  },
  {
    id: 'audit_4',
    userId: 'usr_dev_1',
    userName: 'Mihai Ionescu',
    role: 'developer',
    action: 'Updated Schedule',
    entityType: 'schedule',
    entityName: 'Every day at 07:00 UTC',
    timestamp: '2026-09-18T09:12:00.000Z',
    details: 'Configured daily regression cron cadence and failure alerting.',
  },
  {
    id: 'audit_3',
    userId: 'usr_qa_1',
    userName: 'Elena Popa',
    role: 'qa',
    action: 'Created Test Script',
    entityType: 'script',
    entityName: 'Story page audio and house interactions',
    timestamp: '2026-09-17T14:30:00.000Z',
    details: 'Added audio toggle assertion and brick house navigation check.',
  },
  {
    id: 'audit_2',
    userId: 'usr_admin_1',
    userName: 'Alex Radu',
    role: 'admin',
    action: 'Created Target Site',
    entityType: 'target',
    entityName: 'Picurici — Cele Trei Case (Prod)',
    timestamp: '2026-09-10T08:00:00.000Z',
    details: 'Registered primary target URL https://picurici-cele-trei-case.ai.studio/',
  },
];
