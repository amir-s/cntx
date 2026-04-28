const assert = require('node:assert/strict');
const test = require('node:test');

const { cntx } = require('../lib');

cntx.enable();

test('returns an empty object when no context exists', () => {
  const context = cntx();

  assert.equal(typeof context, 'object');
  assert.notEqual(context, null);
  assert.deepEqual(context, {});
});

test('stores and returns object context values', () => {
  const context = { requestId: 'request-1' };

  assert.equal(cntx(context), context);
  assert.equal(cntx(), context);
});

test('stores and returns falsy context values', async (t) => {
  const values = [false, 0, '', null];

  for (const value of values) {
    await t.test(String(value), () => {
      assert.equal(cntx(value), value);
      assert.equal(cntx(), value);
    });
  }
});

test('isolates concurrent async chains', async () => {
  async function runWithContext(requestId, delay) {
    cntx({ requestId });
    await new Promise((resolve) => setTimeout(resolve, delay));
    return cntx().requestId;
  }

  const results = await Promise.all([runWithContext('request-1', 25), runWithContext('request-2', 5)]);

  assert.deepEqual(results, ['request-1', 'request-2']);
});

test('propagates context through promises and timers', async () => {
  cntx({ requestId: 'request-3' });

  const fromPromise = await Promise.resolve().then(() => cntx().requestId);
  const fromTimer = await new Promise((resolve) => setTimeout(() => resolve(cntx().requestId), 0));

  assert.equal(fromPromise, 'request-3');
  assert.equal(fromTimer, 'request-3');
});

test('allows nested async work to override context for its own descendants', async () => {
  cntx({ requestId: 'outer' });

  const innerResult = await Promise.resolve().then(async () => {
    cntx({ requestId: 'inner' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    return cntx().requestId;
  });

  assert.equal(innerResult, 'inner');
  assert.equal(cntx().requestId, 'outer');
});
