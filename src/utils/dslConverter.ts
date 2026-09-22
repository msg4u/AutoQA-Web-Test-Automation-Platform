import YAML from 'yaml';
import { ScriptStep, StepAction } from '../types';

export function stepsToYaml(scriptName: string, targetSlug: string, steps: ScriptStep[]): string {
  const stepsList = steps.map((step) => {
    switch (step.action) {
      case 'navigate':
        return { navigate: step.value || '/' };
      case 'click':
        return { click: step.selector || 'button' };
      case 'type':
        return { type: { selector: step.selector || 'input', text: step.value || '' } };
      case 'select':
        return { select: { selector: step.selector || 'select', value: step.value || '' } };
      case 'wait_for_element':
        return { wait_for_element: step.selector || 'body', timeout: step.timeoutMs || 5000 };
      case 'assert_visible':
        return { assert_visible: step.selector || 'main' };
      case 'assert_text':
        return { assert_text: { selector: step.selector || 'h1', text: step.expected || '' } };
      case 'assert_url_contains':
        return { assert_url_contains: step.expected || '/' };
      case 'screenshot':
        return { screenshot: step.value || 'checkpoint' };
      case 'custom_js_assertion':
        return { custom_js_assertion: step.value || 'return true;' };
      case 'go_back':
        return 'go_back';
      default:
        return { [step.action]: step.selector || step.value || true };
    }
  });

  const doc = {
    name: scriptName,
    target: targetSlug,
    steps: stepsList,
  };

  return YAML.stringify(doc);
}

export function yamlToSteps(yamlString: string): { name?: string; target?: string; steps: ScriptStep[] } {
  try {
    const parsed = YAML.parse(yamlString);
    if (!parsed || typeof parsed !== 'object') {
      return { steps: [] };
    }

    const name = parsed.name;
    const target = parsed.target;
    const rawSteps = Array.isArray(parsed.steps) ? parsed.steps : [];

    const steps: ScriptStep[] = rawSteps.map((s: any, idx: number) => {
      const id = `step_${idx + 1}_${Date.now()}`;
      if (typeof s === 'string') {
        if (s === 'go_back') {
          return { id, action: 'go_back', description: 'Navigate back to previous page' };
        }
        return { id, action: 'click', selector: s, description: `Click element: ${s}` };
      }

      if (s.navigate !== undefined) {
        return {
          id,
          action: 'navigate',
          value: String(s.navigate),
          description: `Navigate to URL: "${s.navigate}"`,
        };
      }
      if (s.assert_visible !== undefined) {
        return {
          id,
          action: 'assert_visible',
          selector: String(s.assert_visible),
          description: `Assert visible: "${s.assert_visible}"`,
        };
      }
      if (s.click !== undefined) {
        return {
          id,
          action: 'click',
          selector: String(s.click),
          description: `Click element: "${s.click}"`,
        };
      }
      if (s.assert_url_contains !== undefined) {
        return {
          id,
          action: 'assert_url_contains',
          expected: String(s.assert_url_contains),
          description: `Assert URL contains: "${s.assert_url_contains}"`,
        };
      }
      if (s.screenshot !== undefined) {
        return {
          id,
          action: 'screenshot',
          value: String(s.screenshot),
          description: `Capture screenshot checkpoint: "${s.screenshot}"`,
        };
      }
      if (s.assert_text !== undefined) {
        const sel = typeof s.assert_text === 'object' ? s.assert_text.selector : 'body';
        const txt = typeof s.assert_text === 'object' ? s.assert_text.text : String(s.assert_text);
        return {
          id,
          action: 'assert_text',
          selector: sel,
          expected: txt,
          description: `Assert text in "${sel}" equals "${txt}"`,
        };
      }
      if (s.type !== undefined) {
        const sel = typeof s.type === 'object' ? s.type.selector : 'input';
        const txt = typeof s.type === 'object' ? s.type.text : String(s.type);
        return {
          id,
          action: 'type',
          selector: sel,
          value: txt,
          description: `Type "${txt}" into "${sel}"`,
        };
      }
      if (s.select !== undefined) {
        const sel = typeof s.select === 'object' ? s.select.selector : 'select';
        const val = typeof s.select === 'object' ? s.select.value : String(s.select);
        return {
          id,
          action: 'select',
          selector: sel,
          value: val,
          description: `Select option "${val}" in "${sel}"`,
        };
      }
      if (s.wait_for_element !== undefined) {
        const sel = typeof s.wait_for_element === 'object' ? s.wait_for_element.selector : String(s.wait_for_element);
        const timeout = typeof s.wait_for_element === 'object' ? s.wait_for_element.timeout : 5000;
        return {
          id,
          action: 'wait_for_element',
          selector: sel,
          timeoutMs: timeout,
          description: `Wait for element "${sel}" (timeout: ${timeout}ms)`,
        };
      }
      if (s.custom_js_assertion !== undefined) {
        return {
          id,
          action: 'custom_js_assertion',
          value: String(s.custom_js_assertion),
          description: `Execute JS assertion: ${s.custom_js_assertion}`,
        };
      }

      // Default fallback
      const firstKey = Object.keys(s)[0] as StepAction;
      return {
        id,
        action: firstKey || 'click',
        selector: String(s[firstKey] || ''),
        description: `Perform ${firstKey} on ${s[firstKey]}`,
      };
    });

    return { name, target, steps };
  } catch (err) {
    console.error('Failed to parse YAML DSL:', err);
    return { steps: [] };
  }
}

export function generatePlaywrightCode(scriptName: string, baseUrl: string, steps: ScriptStep[]): string {
  const codeLines: string[] = [
    `import { test, expect } from '@playwright/test';`,
    ``,
    `test.describe('${scriptName.replace(/'/g, "\\'")}', () => {`,
    `  test('should execute automated test flow', async ({ page }) => {`,
    `    const BASE_URL = process.env.TARGET_URL || '${baseUrl}';`,
    ``,
  ];

  steps.forEach((step, idx) => {
    codeLines.push(`    // Step ${idx + 1}: ${step.description}`);
    switch (step.action) {
      case 'navigate': {
        const targetPath = step.value?.startsWith('http') ? step.value : `\${BASE_URL}${step.value || '/'}`;
        codeLines.push(`    await page.goto(\`${targetPath}\`);`);
        codeLines.push(`    await page.waitForLoadState('networkidle');`);
        break;
      }
      case 'click': {
        const sel = escapeSelector(step.selector || 'button');
        codeLines.push(`    const locator_${idx} = page.locator('${sel}');`);
        codeLines.push(`    await locator_${idx}.waitFor({ state: 'visible', timeout: 8000 });`);
        codeLines.push(`    await locator_${idx}.click();`);
        break;
      }
      case 'type': {
        const sel = escapeSelector(step.selector || 'input');
        const val = (step.value || '').replace(/'/g, "\\'");
        codeLines.push(`    await page.fill('${sel}', '${val}');`);
        break;
      }
      case 'select': {
        const sel = escapeSelector(step.selector || 'select');
        const val = (step.value || '').replace(/'/g, "\\'");
        codeLines.push(`    await page.selectOption('${sel}', '${val}');`);
        break;
      }
      case 'wait_for_element': {
        const sel = escapeSelector(step.selector || 'body');
        const to = step.timeoutMs || 5000;
        codeLines.push(`    await page.locator('${sel}').waitFor({ state: 'visible', timeout: ${to} });`);
        break;
      }
      case 'assert_visible': {
        const sel = escapeSelector(step.selector || 'body');
        codeLines.push(`    await expect(page.locator('${sel}')).toBeVisible({ timeout: 5000 });`);
        break;
      }
      case 'assert_text': {
        const sel = escapeSelector(step.selector || 'h1');
        const exp = (step.expected || '').replace(/'/g, "\\'");
        codeLines.push(`    await expect(page.locator('${sel}')).toContainText('${exp}');`);
        break;
      }
      case 'assert_url_contains': {
        const exp = (step.expected || '').replace(/'/g, "\\'");
        codeLines.push(`    await expect(page).toHaveURL(new RegExp('${exp}'));`);
        break;
      }
      case 'screenshot': {
        const name = (step.value || `step_${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
        codeLines.push(`    await page.screenshot({ path: 'artifacts/screenshot_${name}.png', fullPage: true });`);
        break;
      }
      case 'custom_js_assertion': {
        const js = step.value || 'return true;';
        codeLines.push(`    const result_${idx} = await page.evaluate(() => { ${js} });`);
        codeLines.push(`    expect(result_${idx}).toBeTruthy();`);
        break;
      }
      case 'go_back': {
        codeLines.push(`    await page.goBack();`);
        break;
      }
    }
    codeLines.push(``);
  });

  codeLines.push(`  });`);
  codeLines.push(`});`);
  return codeLines.join('\n');
}

function escapeSelector(sel: string): string {
  // If it's a plain text description from natural language, convert to resilient text or role selector
  if (!sel.includes('[') && !sel.includes('.') && !sel.includes('#') && !sel.includes('>') && !sel.includes(':')) {
    // E.g. "main illustration" or "first house"
    return `text=${sel.replace(/'/g, "\\'")}`;
  }
  return sel.replace(/'/g, "\\'");
}
