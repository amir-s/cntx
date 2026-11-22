const assert = require('node:assert/strict');
const asyncHooks = require('node:async_hooks');
const { test } = require('node:test');
const { setTimeout: delay, setImmediate: immediate } = require('node:timers/promises');
const { cntx } = require('../lib');

test('enabling context repeatedly creates only one hook', (t) => {
  const createHook = asyncHooks.createHook;
  const spy = t.mock.method(asyncHooks, 'createHook', createHook);

  cntx.enable();
  cntx.enable();
  cntx.enable();

  assert.equal(spy.mock.callCount(), 1);
});

test('creates and reuses an empty context', () => {
  const context = cntx();
  assert.deepEqual(context, {});
  assert.equal(cntx(), context);
});

test('replaces context and treats undefined as a read', () => {
  cntx({ requestId: 'first' });
  const context = { requestId: 'second' };
  assert.equal(cntx(context), context);
  assert.equal(cntx(undefined), context);
});

test('preserves falsy context values across async boundaries', async () => {
  for (const value of [false, 0, '', null, NaN]) {
    cntx({ previous: true });
    assert.equal(cntx(value), value);
    assert.equal(cntx(), value);
    await immediate();
    assert.equal(cntx(), value);
  }
});

test('propagates the same context through promises and timers', async () => {
  const context = { requestId: 'nested' };
  cntx(context);

  await Promise.resolve();
  assert.equal(cntx(), context);
  await delay(1);
  assert.equal(cntx(), context);
  await immediate();
  assert.equal(cntx(), context);
});

test('isolates interleaved async chains and their parent', async () => {
  const parent = { requestId: 'parent' };
  cntx(parent);
  const resources = Array.from({ length: 12 }, () => new asyncHooks.AsyncResource('request'));

  try {
    await Promise.all(
      resources.map((resource, requestId) =>
        resource.runInAsyncScope(async () => {
          assert.equal(cntx(), parent);
          const context = { requestId };
          cntx(context);
          await delay(requestId % 3);
          assert.equal(cntx(), context);
          await immediate();
          assert.equal(cntx(), context);
        }),
      ),
    );
    assert.equal(cntx(), parent);
  } finally {
    resources.forEach((resource) => resource.emitDestroy());
  }
});

test('a failing async chain does not replace its parent context', async () => {
  const parent = { requestId: 'parent' };
  cntx(parent);
  const resource = new asyncHooks.AsyncResource('failing-request');

  try {
    await assert.rejects(
      resource.runInAsyncScope(async () => {
        cntx({ requestId: 'failed' });
        await immediate();
        throw new Error('request failed');
      }),
      /request failed/,
    );
    assert.equal(cntx(), parent);
  } finally {
    resource.emitDestroy();
  }
});
