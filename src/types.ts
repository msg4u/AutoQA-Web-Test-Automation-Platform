export type ScriptStatus = 'draft' | 'active' | 'in_review' | 'archived';
export type ApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type UserRole = 'qa' | 'developer' | 'product_owner' | 'admin';
export type TriggerType = 'manual' | 'scheduled' | 'webhook';
export type RunStatus = 'running' | 'passed' | 'failed' | 'cancelled';
export type StepStatus = 'passed' | 'failed' | 'skipped' | 'running';

export type StepAction =
  | 'navigate'
  | 'click'
  | 'type'
  | 'select'
  | 'wait_for_element'
  | 'assert_visible'
  | 'assert_text'
  | 'assert_url_contains'
  | 'screenshot'
  | 'custom_js_assertion'
  | 'go_back';

export interface ScriptStep {
  id: string;
  action: StepAction;
  selector?: string;
  value?: string;
  expected?: string;
  timeoutMs?: number;
  description: string;
}

export interface TargetSite {
  id: string;
  name: string;
  baseUrl: string;
  environment: 'prod' | 'staging' | 'dev';
  authConfig?: {
    type: 'none' | 'basic' | 'bearer' | 'form';
    username?: string;
    token?: string;
  };
  tags: string[];
  createdAt: string;
}

export interface ScriptVersion {
  id: string;
  scriptId: string;
  versionNumber: number;
  dslYaml: string;
  steps: ScriptStep[];
  playwrightCode: string;
  author: string;
  changeLog: string;
  createdAt: string;
}

export interface Script {
  id: string;
  name: string;
  targetSiteId: string;
  status: ScriptStatus;
  currentVersionId: string;
  currentVersion: ScriptVersion;
  versions: ScriptVersion[];
  tags: string[];
  requiresApproval: boolean;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  approvalComment?: string;
  timeoutMs: number;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  scriptId: string;
  scriptName?: string;
  cronExpression: string;
  humanDescription?: string;
  humanReadable?: string;
  active: boolean;
  isActive?: boolean;
  concurrencyPolicy: 'skip' | 'queue' | 'replace';
  webhookToken?: string;
  webhookSecret?: string;
  notifyEmails?: string[];
  createdAt?: string;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface StepResult {
  id: string;
  runId: string;
  stepIndex: number;
  step: ScriptStep;
  status: StepStatus;
  durationMs: number;
  errorMessage?: string;
  domSnapshot?: string;
  failingSelector?: string;
  screenshotUrl: string;
  baselineScreenshotUrl?: string;
  hasVisualDiff?: boolean;
  diffPercentage?: number;
  consoleLogs: {
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
  }[];
  networkCalls: {
    url: string;
    method: string;
    status: number;
    durationMs: number;
  }[];
}

export interface Run {
  id: string;
  scriptId: string;
  scriptVersionId: string;
  scriptName: string;
  targetUrl: string;
  environment: 'prod' | 'staging' | 'dev';
  triggerType: TriggerType;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  stepsTotal: number;
  stepsPassed: number;
  stepsFailed: number;
  errorSummary?: string;
  retryAttempt: number;
  stepResults: StepResult[];
  shareableToken: string;
}

export interface AuditLogItem {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  entityType: 'script' | 'version' | 'schedule' | 'target' | 'run';
  entityId?: string;
  entityName: string;
  timestamp: string;
  details: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
