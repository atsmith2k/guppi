import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { GuppiDB } from '../src/db/client.js';
import { LSTTraversalEngine } from '../src/engine/lst_traversal.js';
import { createLSTTraversalPillar } from '../src/server/pillars/lst_pillar.js';

test('GUPPI LST & Serena Codebase Traversal Suite', async (t) => {
  const db = new GuppiDB(process.cwd());
  const lstEngine = new LSTTraversalEngine(db, process.cwd());

  await t.test('1. LST Parsing & Tree Selection - Parses AST losslessly', () => {
    const root = lstEngine.parseFileToLST('src/engine/lst_traversal.ts');
    assert.strictEqual(root.kind, 'SourceFile');
    assert.ok(root.children.length > 0);

    const classNodes = lstEngine.queryLSTTree('src/engine/lst_traversal.ts', 'ClassDeclaration');
    assert.ok(classNodes.length >= 1);
    assert.strictEqual(classNodes[0].name, 'LSTTraversalEngine');
  });

  await t.test('2. Serena-Style Reference Tracer - Finds cross-file call references', () => {
    const refs = lstEngine.findReferences('GuppiDB');
    assert.ok(refs.length > 0);
  });

  await t.test('3. Lossless Skeleton Slice - Generates token-efficient folded context', () => {
    const skeleton = lstEngine.skeletonSlice('src/engine/lst_traversal.ts');
    assert.ok(skeleton.includes('/* ... [Implementation Folded'));
    assert.ok(skeleton.includes('export class LSTTraversalEngine'));
  });

  await t.test('4. Pillar 6 MCP Module Registration - Exposes traversal tools & resources', () => {
    const pillar = createLSTTraversalPillar(db);
    assert.strictEqual(pillar.pillarName, 'LST & Codebase Traversal');
    assert.strictEqual(pillar.tools.length, 5);
  });
});
