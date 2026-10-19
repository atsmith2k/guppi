import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { once } from 'events';
import type { AddressInfo } from 'net';
import { startGuppiServer } from '../src/server/index.js';

const testWorkspace = path.join(process.cwd(), 'scratch', 'test_server_bind');
if (!fs.existsSync(testWorkspace)) {
  fs.mkdirSync(testWorkspace, { recursive: true });
}

async function boundAddress(options: Parameters<typeof startGuppiServer>[0]) {
  const { server, db } = startGuppiServer({ port: 0, workspaceDir: testWorkspace, ...options });
  if (!server.listening) await once(server, 'listening');
  const address = (server.address() as AddressInfo).address;
  await new Promise((resolve) => server.close(resolve));
  db.close();
  return address;
}

test('GUPPI server binds to loopback unless told otherwise', async (t) => {
  // The server logs its startup banner to stdout. Plain stdout text mixed into the
  // test runner's serialized child-process stream can make Node 22's parser throw
  // "Unable to deserialize cloned data", so keep this file quiet.
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'warn', () => {});

  const savedHost = process.env.GUPPI_HOST;
  delete process.env.GUPPI_HOST;
  t.after(() => {
    if (savedHost === undefined) delete process.env.GUPPI_HOST;
    else process.env.GUPPI_HOST = savedHost;
  });

  await t.test('defaults to 127.0.0.1', async () => {
    assert.strictEqual(await boundAddress({}), '127.0.0.1');
  });

  await t.test('honours GUPPI_HOST', async () => {
    process.env.GUPPI_HOST = '::1';
    try {
      assert.strictEqual(await boundAddress({}), '::1');
    } finally {
      delete process.env.GUPPI_HOST;
    }
  });

  await t.test('an explicit host option wins over GUPPI_HOST', async () => {
    process.env.GUPPI_HOST = '::1';
    try {
      assert.strictEqual(await boundAddress({ host: '127.0.0.1' }), '127.0.0.1');
    } finally {
      delete process.env.GUPPI_HOST;
    }
  });
});
