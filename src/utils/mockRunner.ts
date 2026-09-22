import { ScriptStep, StepResult } from '../types';

export function createStepSvgScreenshot(
  stepNumber: number,
  action: string,
  targetUrl: string,
  targetName: string,
  selector?: string,
  expected?: string,
  isFailed?: boolean,
  errorMessage?: string,
  isBaseline?: boolean
): string {
  const isPicurici = targetUrl.includes('picurici') || targetName.toLowerCase().includes('case');
  const primaryBg = isPicurici ? '#f8fafc' : '#f1f5f9';
  const highlightColor = isFailed ? '#ef4444' : isBaseline ? '#3b82f6' : '#10b981';

  // SVG representation of a browser viewport showing the target page
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 640" width="1000" height="640">
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#bae6fd" />
      <stop offset="60%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#fef08a" />
    </linearGradient>
    <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#86efac" />
      <stop offset="100%" stop-color="#4ade80" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Browser Frame Header -->
  <rect x="0" y="0" width="1000" height="48" fill="#1e293b" />
  <circle cx="24" cy="24" r="6" fill="#f87171" />
  <circle cx="44" cy="24" r="6" fill="#fbbf24" />
  <circle cx="64" cy="24" r="6" fill="#34d399" />
  <rect x="90" y="10" width="600" height="28" rx="6" fill="#0f172a" />
  <text x="110" y="29" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">
    ${targetUrl} ${action === 'navigate' ? ' (Loading)' : ''}
  </text>
  <rect x="710" y="14" width="70" height="20" rx="4" fill="#334155" />
  <text x="745" y="28" fill="#e2e8f0" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Step ${stepNumber}</text>

  <!-- Web Content Area -->
  <rect x="0" y="48" width="1000" height="592" fill="${primaryBg}" />

  ${
    isPicurici
      ? `
    <!-- Scenic Background of The Three Little Pigs Story -->
    <rect x="0" y="48" width="1000" height="340" fill="url(#skyGrad)" />
    <!-- Distant hills -->
    <path d="M 0 350 Q 250 260 500 340 T 1000 320 L 1000 640 L 0 640 Z" fill="url(#grassGrad)" />
    
    <!-- Top Nav of Target App -->
    <rect x="40" y="68" width="920" height="56" rx="12" fill="#ffffff" filter="url(#shadow)" />
    <circle cx="76" cy="96" r="16" fill="#f43f5e" />
    <text x="76" y="101" fill="#ffffff" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">🐷</text>
    <text x="105" y="102" fill="#0f172a" font-family="system-ui, sans-serif" font-size="18" font-weight="bold">Picurici — Cele Trei Căsuțe</text>
    <rect x="740" y="80" width="90" height="32" rx="8" fill="#e2e8f0" />
    <text x="785" y="101" fill="#334155" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">Audio: ON 🔊</text>
    <rect x="840" y="80" width="100" height="32" rx="8" fill="#2563eb" />
    <text x="890" y="101" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">Alege Casa</text>

    <!-- Main Banner Illustration -->
    <g transform="translate(60, 150)">
      <rect x="0" y="0" width="880" height="150" rx="16" fill="#ffffff" opacity="0.95" filter="url(#shadow)" />
      <text x="40" y="50" fill="#0f172a" font-family="system-ui, sans-serif" font-size="28" font-weight="bold">Povestea celor trei purceluși</text>
      <text x="40" y="85" fill="#475569" font-family="system-ui, sans-serif" font-size="15">Apasă pe căsuțe pentru a explora materialele și aventurile cu lupul cel fioros.</text>
      <rect x="40" y="105" width="160" height="28" rx="6" fill="#f1f5f9" />
      <text x="120" y="123" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Target ID: cele-trei-case</text>
    </g>

    <!-- The 3 Houses Interactive Cards -->
    <!-- House 1: Straw House -->
    <g transform="translate(60, 330)">
      <rect x="0" y="0" width="260" height="230" rx="16" fill="#ffffff" filter="url(#shadow)" stroke="${selector && selector.includes('first') ? highlightColor : '#e2e8f0'}" stroke-width="${selector && selector.includes('first') ? 4 : 1}" />
      <polygon points="130,20 20,80 240,80" fill="#fef08a" stroke="#eab308" stroke-width="3" />
      <rect x="40" y="80" width="180" height="120" fill="#fef9c3" />
      <rect x="100" y="120" width="60" height="80" rx="4" fill="#a16207" />
      <circle cx="145" cy="160" r="4" fill="#fef08a" />
      <text x="130" y="215" fill="#854d0e" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" text-anchor="middle">1. Căsuța de Paie</text>
    </g>

    <!-- House 2: Wood House -->
    <g transform="translate(370, 330)">
      <rect x="0" y="0" width="260" height="230" rx="16" fill="#ffffff" filter="url(#shadow)" stroke="${selector && selector.includes('second') ? highlightColor : '#e2e8f0'}" stroke-width="${selector && selector.includes('second') ? 4 : 1}" />
      <polygon points="130,20 20,80 240,80" fill="#b45309" stroke="#78350f" stroke-width="3" />
      <rect x="40" y="80" width="180" height="120" fill="#d97706" />
      <rect x="100" y="120" width="60" height="80" rx="4" fill="#78350f" />
      <circle cx="145" cy="160" r="4" fill="#fef08a" />
      <text x="130" y="215" fill="#78350f" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" text-anchor="middle">2. Căsuța de Lemn</text>
    </g>

    <!-- House 3: Brick House -->
    <g transform="translate(680, 330)">
      <rect x="0" y="0" width="260" height="230" rx="16" fill="#ffffff" filter="url(#shadow)" stroke="${selector && selector.includes('third') ? highlightColor : '#e2e8f0'}" stroke-width="${selector && selector.includes('third') ? 4 : 1}" />
      <polygon points="130,20 20,80 240,80" fill="#dc2626" stroke="#991b1b" stroke-width="3" />
      <rect x="40" y="80" width="180" height="120" fill="#ef4444" />
      <rect x="100" y="120" width="60" height="80" rx="4" fill="#991b1b" />
      <circle cx="145" cy="160" r="4" fill="#fef08a" />
      <text x="130" y="215" fill="#991b1b" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" text-anchor="middle">3. Căsuța de Cărămidă</text>
    </g>
    `
      : `
    <!-- Generic Web App View -->
    <rect x="60" y="80" width="880" height="60" rx="8" fill="#ffffff" filter="url(#shadow)" />
    <text x="100" y="118" fill="#0f172a" font-family="system-ui, sans-serif" font-size="20" font-weight="bold">${targetName}</text>
    <rect x="60" y="170" width="560" height="380" rx="12" fill="#ffffff" filter="url(#shadow)" />
    <text x="90" y="220" fill="#0f172a" font-family="system-ui, sans-serif" font-size="22" font-weight="bold">Application Main Workspace</text>
    <rect x="90" y="250" width="400" height="40" rx="6" fill="#f8fafc" stroke="#cbd5e1" />
    <text x="110" y="275" fill="#64748b" font-family="system-ui, sans-serif" font-size="14">Enter search or parameter...</text>
    <rect x="90" y="310" width="140" height="44" rx="8" fill="#2563eb" />
    <text x="160" y="337" fill="#ffffff" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Submit Action</text>

    <rect x="650" y="170" width="290" height="380" rx="12" fill="#ffffff" filter="url(#shadow)" />
    <text x="680" y="210" fill="#334155" font-family="system-ui, sans-serif" font-size="16" font-weight="600">Sidebar Metrics</text>
    <rect x="680" y="230" width="230" height="80" rx="8" fill="#f1f5f9" />
    <rect x="680" y="325" width="230" height="80" rx="8" fill="#f1f5f9" />
    `
  }

  <!-- Action Highlighter Overlay -->
  ${
    selector
      ? `
    <g transform="translate(0, 0)">
      <rect x="40" y="580" width="920" height="45" rx="8" fill="#0f172a" opacity="0.9" />
      <circle cx="65" cy="602" r="6" fill="${highlightColor}" />
      <text x="85" y="607" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13" font-weight="500">
        Active Selector: [${selector}] — Action: ${action} ${expected ? `| Expected: "${expected}"` : ''}
      </text>
    </g>
    `
      : ''
  }

  <!-- Failure overlay banner if failed -->
  ${
    isFailed
      ? `
    <g transform="translate(200, 220)">
      <rect x="0" y="0" width="600" height="180" rx="16" fill="#fef2f2" stroke="#ef4444" stroke-width="2" filter="url(#shadow)" />
      <circle cx="50" cy="50" r="22" fill="#fee2e2" />
      <text x="50" y="58" fill="#ef4444" font-family="system-ui, sans-serif" font-size="24" font-weight="bold" text-anchor="middle">✕</text>
      <text x="90" y="45" fill="#991b1b" font-family="system-ui, sans-serif" font-size="18" font-weight="bold">Step Assertion Failure</text>
      <text x="90" y="75" fill="#b91c1c" font-family="system-ui, sans-serif" font-size="14">${errorMessage || 'Element not found within 5000ms timeout'}</text>
      <rect x="90" y="100" width="460" height="50" rx="6" fill="#ffffff" stroke="#fca5a5" />
      <text x="105" y="130" fill="#7f1d1d" font-family="monospace" font-size="12">Target locator: page.locator('${selector || 'unknown'}')</text>
    </g>
    `
      : ''
  }

  ${
    isBaseline
      ? `
    <rect x="840" y="60" width="130" height="28" rx="6" fill="#1e3a8a" opacity="0.9" />
    <text x="905" y="79" fill="#bfdbfe" font-family="system-ui, sans-serif" font-size="11" font-weight="600" text-anchor="middle">Baseline Reference</text>
    `
      : ''
  }
</svg>
`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function executeSimulationStep(
  step: ScriptStep,
  stepIndex: number,
  targetUrl: string,
  targetName: string,
  failOnStepIndex?: number
): StepResult {
  const isFailing = failOnStepIndex !== undefined && stepIndex === failOnStepIndex;
  const durationMs = isFailing ? 5120 : Math.floor(120 + Math.random() * 320);

  const screenshot = createStepSvgScreenshot(
    stepIndex + 1,
    step.action,
    targetUrl,
    targetName,
    step.selector,
    step.expected,
    isFailing,
    isFailing ? `AssertionError: Element '${step.selector}' did not match condition within ${step.timeoutMs || 5000}ms` : undefined
  );

  const baselineScreenshot = createStepSvgScreenshot(
    stepIndex + 1,
    step.action,
    targetUrl,
    targetName,
    step.selector,
    step.expected,
    false,
    undefined,
    true
  );

  const consoleLogs: { level: 'info' | 'warn' | 'error'; message: string; timestamp: string }[] = [
    {
      level: 'info',
      message: `[AutoQA Runner] Executing Step ${stepIndex + 1}: ${step.description}`,
      timestamp: new Date().toISOString(),
    },
  ];

  const networkCalls: { url: string; method: string; status: number; durationMs: number }[] = [];

  if (step.action === 'navigate') {
    networkCalls.push({
      url: targetUrl + (step.value || '/'),
      method: 'GET',
      status: isFailing ? 500 : 200,
      durationMs: Math.floor(durationMs * 0.7),
    });
    consoleLogs.push({
      level: 'info',
      message: `[Network] Document load completed with status ${isFailing ? 500 : 200}`,
      timestamp: new Date().toISOString(),
    });
  } else {
    networkCalls.push({
      url: `${targetUrl}/api/telemetry`,
      method: 'POST',
      status: 200,
      durationMs: 42,
    });
  }

  if (isFailing) {
    consoleLogs.push({
      level: 'error',
      message: `[Playwright Engine] TimeoutError: page.waitForSelector('${step.selector || 'element'}'): Timeout 5000ms exceeded`,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    id: `step_res_${Date.now()}_${stepIndex}`,
    runId: '',
    stepIndex,
    step,
    status: isFailing ? 'failed' : 'passed',
    durationMs,
    errorMessage: isFailing
      ? `Timed out waiting for locator '${step.selector || step.description}' to resolve with status visible.`
      : undefined,
    domSnapshot: `<!-- DOM Snapshot at Step ${stepIndex + 1} -->\n<div id="root">\n  <header class="navbar">\n    <h1>${targetName}</h1>\n  </header>\n  <main class="page-body">\n    <section class="story-container">\n      <div class="house-card" data-testid="${step.selector || 'house-1'}">\n        ${step.expected ? `<span>${step.expected}</span>` : '<button>Interact</button>'}\n      </div>\n    </section>\n  </main>\n</div>`,
    failingSelector: isFailing ? step.selector || 'unknown' : undefined,
    screenshotUrl: screenshot,
    baselineScreenshotUrl: baselineScreenshot,
    hasVisualDiff: isFailing,
    diffPercentage: isFailing ? 4.8 : 0,
    consoleLogs,
    networkCalls,
  };
}
