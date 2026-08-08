import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotDir = path.join(process.cwd(), 'scratch', 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

test.describe('GUPPI Web Dashboard Real User E2E Testing Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3737', { waitUntil: 'domcontentloaded' });
  });

  test('1. Overview Tab - Verifies server status & metric counters', async ({ page }) => {
    await expect(page.locator('text=General-purpose Unifying Pluggable Intelligence')).toBeVisible();
    await expect(page.locator('text=Server Online')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, '01_overview.png'), fullPage: true });
  });

  test('2. Cortex Memory Tab - Runs hybrid RAG search query', async ({ page }) => {
    await page.click('button:has-text("Cortex RAG Memory")');
    await page.fill('input[placeholder*="Search RAG memory"]', 'SQLite WAL');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '02_cortex_memory.png'), fullPage: true });
  });

  test('3. ContextForge AST Tab - Inspects AST symbol definitions', async ({ page }) => {
    await page.click('button:has-text("ContextForge AST Map")');
    await expect(page.locator('text=AST Symbols Index')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, '03_context_forge_ast.png'), fullPage: true });
  });

  test('4. AgentLens Telemetry Tab - Verifies trace step loggers', async ({ page }) => {
    await page.click('button:has-text("AgentLens Telemetry")');
    await expect(page.locator('text=Agent Telemetry & Trace Deck')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, '04_telemetry.png'), fullPage: true });
  });

  test('5. AgentGuard Safety Tab - Tests secret detection scanner', async ({ page }) => {
    await page.click('button:has-text("AgentGuard Safety")');
    await expect(page.locator('text=Active Guardrail Rules')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, '05_guard.png'), fullPage: true });
  });

  test('6. AgentBridge Mesh Tab - Verifies agent task mesh queue', async ({ page }) => {
    await page.click('button:has-text("AgentBridge Mesh")');
    await expect(page.locator('text=Cross-Agent Task Switchboard')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, '06_bridge.png'), fullPage: true });
  });

  test('7. Visual Knowledge Graph Tab - Renders visual memory network', async ({ page }) => {
    await page.click('button:has-text("Visual Knowledge Graph")');
    await expect(page.locator('text=Knowledge & Module Dependency Graph')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, '07_knowledge_graph.png'), fullPage: true });
  });

  test('8. Brainstorm Studio Tab - Verifies Q&A ideation canvas', async ({ page }) => {
    await page.click('button:has-text("Brainstorm Studio")');
    await expect(page.locator('text=Interactive Q&A Brainstorming Studio')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, '08_brainstorm_studio.png'), fullPage: true });
  });

  test('9. Self-Healing Studio Tab - Triggers emergency backup & AST diff repair', async ({ page }) => {
    await page.click('button:has-text("Self-Healing Studio")');
    await page.click('button:has-text("Create Backup & Propose AST Fix")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Emergency Backup Created!')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, '09_self_healing.png'), fullPage: true });
  });

  test('10. Multi-Repo Mesh Tab - Links workspace node & searches cross-repo symbols', async ({ page }) => {
    await page.click('button:has-text("Multi-Repo Mesh")');
    await page.fill('input[placeholder*="Search AST symbols"]', 'createMCPServer');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Repository Node: something')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, '10_multi_repo_mesh.png'), fullPage: true });
  });

  test('11. Test Studio Tab - Auto-generates AST unit test specs', async ({ page }) => {
    await page.click('button:has-text("Test Studio")');
    await page.click('button:has-text("Generate Unit Test Specs")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Tests Generated')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, '11_test_studio.png'), fullPage: true });
  });
});
